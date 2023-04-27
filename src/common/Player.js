import { Howl, Howler } from 'howler';
import { PLAY_STATE } from '../common/Constants';
import EventBus from '../common/EventBus';
import { Track } from './Track';
import { WebAudioApi } from './WebAudioApi';



let singleton = null

//追求简单、组合式API、单一责任
export class Player {
    constructor(track) {
        this.currentTrack = track
        this.sound = null
        this.playState = PLAY_STATE.NONE
        this.retry = 0
        this.webAudioApi = null
        this.pendingSoundEffectType = 0 // 0 =>均衡器， 1 => 混响
        this.pendingSoundEffect = null
        this.animationFrameId = 0
        this.seekPendingMark = 0 //percent
        this.animationFrameCnt = 0 //动画帧数计数器，控制事件触发频率，降低CPU占用
        this.stateRefreshFrequency = 60 //歌曲进度更新频度
        this.spectrumRefreshFrequency = 3 //歌曲频谱更新频度
    }

    static get() {
        if (!singleton) singleton = new Player()
        return singleton
    }

    /* 初始化并配置播放器 */
    static initAndSetup() {
        const player = Player.get()
        return player.on('suspend', () => player.pause())
            .on('track-play', track => player.playTrack(track))
            .on('track-restore', track => player.restore(track))
            .on('track-changed', () => player.setCurrent(null))
            .on('track-togglePlay', () => player.togglePlay())
            .on('track-seek', percent => player.seek(percent))
            .on('volume-set', volume => player.volume(volume))
            .on('radio-play', () => player.setCurrent(null))
            .on('playbackQueue-empty', () => player.setCurrent(null))
            .on('track-updateEQ', values => player.updateEQ(values))
            .on('track-updateIR', source => player.updateIR(source))
            .on('track-stateRefreshFrequency', value => player.stateRefreshFrequency = value)
            .on('track-spectrumRefreshFrequency', value => player.spectrumRefreshFrequency = value)
            .on('track-markSeekPending', value => player.seekPendingMark = value)
        //.on('track-resetAnimFrameCnt', () => player.animationFrameCnt = 0)
    }

    isTrackAvailable() {
        return Track.hasUrl(this.currentTrack)
    }

    createSound() {
        if (!this.isTrackAvailable()) return null
        var self = this
        this.sound = new Howl({
            src: [this.currentTrack.url],
            html5: true,
            autoplay: false,
            preload: false,
            pool: 1,
            onplay: function () {
                self.retry = 0
                self.notifyStateChanged(PLAY_STATE.PLAYING)

                if (self.seekPendingMark) { //存在未处理seek事件
                    self.animationFrameCnt = 0
                    self.seek(self.seekPendingMark)
                    self.seekPendingMark = 0
                } else { //正常情况
                    self._rewindAnimationFrame(self._step.bind(self))
                }
            },
            onpause: function () {
                self._stopAnimationFrame()
                self.notifyStateChanged(PLAY_STATE.PAUSE)
            },
            onend: function () {
                self.notifyStateChanged(PLAY_STATE.END)
            },
            onseek: function () {
                //重置动画帧
                self._rewindAnimationFrame(self._step.bind(self))
            },
            onloaderror: function () {
                self.retryPlay(1)
            },
            onplayerror: function () {
                self.retryPlay(1)
            }
        })
        this.tryUnlockHowlAudios()
        this.notifyStateChanged(PLAY_STATE.INIT)
        return this.sound
    }

    getSound() {
        return this.isTrackAvailable() ? this.sound : null
    }

    //播放
    play() {
        let sound = this.getSound()
        if (sound) sound.play()
    }

    //暂停
    pause() {
        const sound = this.getSound()
        if (sound) sound.pause()
    }

    togglePlay() {
        const sound = this.getSound()
        if (!sound) {
            this.retryPlay(1)
            return
        }
        if (sound.playing()) {
            sound.pause()
        } else {
            sound.play()
        }
    }

    //停止
    stop() {
        const sound = this.getSound()
        if (sound) { //释放资源
            sound.stop()
            sound.unload()
        }
    }

    setCurrent(track) {
        this.stop()
        this.currentTrack = track
        this.createSound()
    }

    playTrack(track) {
        this.setCurrent(track)
        this.play()
    }

    restore(track) {
        this.setCurrent(track)
        this.createSound()
    }

    volume(value) {
        Howler.volume(value)
    }

    seek(percent) {
        const sound = this.getSound()
        if (!sound || !sound.playing()) return
        const duration = sound.duration()
        if (duration) sound.seek(duration * percent)
    }

    _step() {
        const sound = this.getSound()
        if (!sound) return
        if (!sound.playing() && this.playState != PLAY_STATE.PLAYING) return
        //当前时间
        const seek = sound.seek() || 0
        if (this.isStateRefreshEnabled()) EventBus.emit('track-pos', seek)
        //声音处理
        try {
            this.resolveSound()
        } catch (error) {
            console.log(error)
            this.retryPlay(1)
        }
        this._countAnimationFrame()
        //循环动画
        this._rewindAnimationFrame(this._step.bind(this), true)
    }

    on(event, handler) {
        EventBus.on(event, handler)
        return this
    }

    notifyStateChanged(state) {
        this.playState = state
        EventBus.emit('track-state', this.playState)
    }

    notifyError(isRetry) {
        EventBus.emit('track-error', isRetry ? this.currentTrack : null)
    }

    retryPlay(times) {
        this.notifyError(this.retry < times)
        ++this.retry
    }

    createWebAudioApi() {
        if (this.webAudioApi) return
        const audioCtx = Howler.ctx
        if (!audioCtx) return
        const audioNode = this.sound._sounds[0]._node
        if (!audioNode) return
        this.webAudioApi = WebAudioApi.create(audioCtx, audioNode)
    }

    resolveSound() {
        this.createWebAudioApi()
        if (!this.webAudioApi) return
        this.resolvePendingSoundEffect()
        const analyser = this.webAudioApi.getAnalyser()
        const freqData = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(freqData)
        if (this.isSpectrumRefreshEnabled()) EventBus.emit('track-spectrumData', freqData)
    }

    tryUnlockHowlAudios() {
        const audios = Howler._html5AudioPool
        // Unlock CORS
        if (audios) audios.forEach(audio => audio.crossOrigin = 'anonymous')
    }

    updateEQ(values) {
        if (this.webAudioApi) {
            this.webAudioApi.updateEQ(values)
            this.pendingSoundEffect = null
        } else {
            this.pendingSoundEffectType = 0
            this.pendingSoundEffect = values
        }
    }

    updateIR(source) {
        if (this.webAudioApi) {
            this.webAudioApi.updateIR(source)
            this.pendingSoundEffect = null
        } else {
            this.pendingSoundEffectType = 1
            this.pendingSoundEffect = source
        }
    }

    resolvePendingSoundEffect() {
        if (!this.pendingSoundEffect) return
        if (this.pendingSoundEffectType === 1) {
            this.updateIR(this.pendingSoundEffect)
        } else {
            this.updateEQ(this.pendingSoundEffect)
        }
    }

    _countAnimationFrame() {
        this.animationFrameCnt = (this.animationFrameCnt + 1) % 1024
    }

    isStateRefreshEnabled() {
        return this.animationFrameCnt % this.stateRefreshFrequency == 0
    }

    isSpectrumRefreshEnabled() {
        return this.animationFrameCnt % this.spectrumRefreshFrequency == 0
    }

    _stopAnimationFrame(noReset) {
        if (this.animationFrameId > 0) cancelAnimationFrame(this.animationFrameId)
        if (!noReset) this.animationFrameCnt = 0
    }

    _rewindAnimationFrame(callback, noReset) {
        this._stopAnimationFrame(noReset)
        this.animationFrameId = requestAnimationFrame(callback)
    }
}
