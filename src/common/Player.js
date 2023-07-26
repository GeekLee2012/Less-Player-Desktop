import { Howl, Howler } from 'howler';
import { PLAY_STATE } from '../common/Constants';
import EventBus from '../common/EventBus';
import { Track } from './Track';
import { WebAudioApi } from './WebAudioApi';
import { toRaw } from 'vue';



let singleton = null

//追求简单、组合式API、单一责任
export class Player {
    constructor(track) {
        this.currentTrack = track
        this.sound = null
        this.playState = PLAY_STATE.NONE
        this.currentTime = 0
        this.retry = 0
        this.webAudioApi = null
        this.pendingSoundEffectType = 0 // 0 =>均衡器， 1 => 混响
        this.pendingSoundEffect = null
        this.animationFrameId = 0
        this.seekPendingMark = 0 //percent
        this.animationFrameCnt = 0 //动画帧数计数器，控制事件触发频率，降低CPU占用
        this.stateRefreshFrequency = 60 //歌曲进度更新频度
        this.spectrumRefreshFrequency = 3 //歌曲频谱更新频度
        this.desktopLyricMessagePort = null
        this.desktopLyricMessagePortActiveState = null
    }

    static get() {
        if (!singleton) singleton = new Player()
        return singleton
    }

    /* 初始化并配置播放器 */
    static initAndSetup() {
        const player = Player.get()
        return player.on('track-play', track => player.playTrack(track))
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
            .on('desktopLyric-messagePort', value => player.setupDesktopLyricMessagePort(value))
            .on('track-noLyric', value => player.postLyricStateToDesktopLyric(value, false))
            .on('track-lyricLoaded', value => player.postLyricStateToDesktopLyric(value, true))
            .on('desktopLyric-showState', value => player.setMessagePortActiveState(value))
    }

    _isTrackAvailable() {
        return Track.hasUrl(this.currentTrack)
    }

    createSound() {
        if (!this._isTrackAvailable()) return null
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
                self._retryPlay(1)
            },
            onplayerror: function () {
                self._retryPlay(1)
            }
        })
        this._tryUnlockHowlAudios()
        this.currentTime = 0
        this.notifyStateChanged(PLAY_STATE.INIT)
        return this.sound
    }

    getSound() {
        return this._isTrackAvailable() ? this.sound : null
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
            this._retryPlay(1)
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
        if (!track) {
            this.notifyStateChanged(PLAY_STATE.NONE)
        }
    }

    playTrack(track) {
        this.setCurrent(track)
        this.play()
    }

    restore(track) {
        this.setCurrent(track)
        //this.createSound()
    }

    volume(value) {
        Howler.volume(value)
    }

    seek(percent) {
        const sound = this.getSound()
        if (!sound || !sound.playing()) return
        const duration = sound.duration()
        if (duration) {
            sound.seek(Math.min(duration * percent, duration))
            //this.notify('track-seekFinish')
        }
    }

    _step() {
        const sound = this.getSound()
        if (!sound) return
        if (!sound.playing() && this.playState != PLAY_STATE.PLAYING) {
            this._stopAnimationFrame()
            return
        }
        //当前时间
        this.currentTime = sound.seek() || 0
        if (this.isStateRefreshEnabled()) {
            this.notify('track-pos', this.currentTime)
        }
        //声音处理
        try {
            this._resolveSound()
        } catch (error) {
            console.log(error)
            this._retryPlay(1)
        }
        this._countAnimationFrame()
        //循环动画
        this._rewindAnimationFrame(this._step.bind(this), true)
    }

    on(event, handler) {
        EventBus.on(event, handler)
        return this
    }

    notify(event, args) {
        EventBus.emit(event, args)
        return this
    }

    notifyStateChanged(state) {
        this.playState = state
        this.notify('track-state', this.playState)

        this.postPlayStateToDesktopLryic()
    }

    _notifyError(isRetry) {
        const { currentTrack: track, currentTime } = this
        this.notify('track-error', { retry: isRetry, track, currentTime })
    }

    _retryPlay(maxRetry) {
        const isRetry = this.retry < maxRetry
        this._notifyError(isRetry)
        if (isRetry) {
            ++this.retry
        } else {
            this.retry = 0
        }
    }

    _createWebAudioApi() {
        if (!this.webAudioApi) {
            const audioCtx = Howler.ctx
            if (audioCtx) {
                const audioNode = this.sound._sounds[0]._node
                if (audioNode) {
                    this.webAudioApi = WebAudioApi.create(audioCtx, audioNode)
                }
            }
        }
        return this.webAudioApi
    }

    _resolveSound() {
        if (!this._createWebAudioApi()) return
        this._resolvePendingSoundEffect()
        if (!this.isSpectrumRefreshEnabled()) return
        const { analyser } = this.webAudioApi
        if (!analyser) return
        const { frequencyBinCount } = analyser
        const freqData = new Uint8Array(frequencyBinCount)
        analyser.getByteFrequencyData(freqData)
        this.notify('track-spectrumData', freqData)
    }

    _tryUnlockHowlAudios() {
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

    _resolvePendingSoundEffect() {
        if (!this.pendingSoundEffect) return
        if (this.pendingSoundEffectType === 1) {
            this.updateIR(this.pendingSoundEffect)
        } else {
            this.updateEQ(this.pendingSoundEffect)
        }
    }

    _countAnimationFrame() {
        const max = this.stateRefreshFrequency || 1024
        this.animationFrameCnt = (this.animationFrameCnt + 1) % max
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

    setupDesktopLyricMessagePort(messagePort) {
        this.desktopLyricMessagePort = messagePort
        this.onDesktopLyricMessage()
    }

    setMessagePortActiveState(state) {
        this.desktopLyricMessagePortActiveState = state
    }

    postMessageToDesktopLryic(action, data) {
        if (!this.desktopLyricMessagePortActiveState) return
        const messagePort = this.desktopLyricMessagePort
        if (messagePort) messagePort.postMessage({ action, data })
    }

    postPlayStateToDesktopLryic() {
        if (!this.desktopLyricMessagePortActiveState) return
        switch (this.playState) {
            case PLAY_STATE.NONE:
                this.postMessageToDesktopLryic('s-track-none')
                break
            case PLAY_STATE.INIT:
                this.postMessageToDesktopLryic('s-track-init', {
                    track: Player.getRawTrack(this.currentTrack)
                })
                break
            case PLAY_STATE.PLAYING:
                this.postMessageToDesktopLryic('s-track-play')
                break
            case PLAY_STATE.PAUSE:
                this.postMessageToDesktopLryic('s-track-pause')
                break
        }
    }

    onDesktopLyricMessage() {
        const self = this
        this.desktopLyricMessagePort.onPlayerMessage = (action, data) => {
            if (action == 'c-track-init') {
                //self.setMessagePortActiveState(true)
                self.postMessageToDesktopLryic('s-track-init', {
                    track: Player.getRawTrack(self.currentTrack),
                    playing: (self.playState == PLAY_STATE.PLAYING)
                })
            } else if (action == 'c-track-pos') {
                const sound = self.getSound()
                if (!sound) return
                self.currentTime = sound.seek() || 0
                self.postMessageToDesktopLryic('s-track-pos', self.currentTime)
            }
        }
    }

    postLyricStateToDesktopLyric(track, hasLyric) {
        if (!this.desktopLyricMessagePortActiveState) return
        const action = hasLyric ? 's-track-lyricLoaded' : 's-track-noLyric'
        this.postMessageToDesktopLryic(action, Player.getRawTrack(track))
    }

    static getRawTrack(track) {
        return toRaw(track)
    }
}
