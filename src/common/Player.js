import { Howl, Howler } from 'howler';
import { PlayState } from '../common/Constants';
import EventBus from '../common/EventBus';
import { Track } from './Track';
import { WebAudioApi } from './WebAudioApi';
import { toRaw } from 'vue';
import { isDevEnv } from './Utils';



let singleton = null

//追求简单、组合式API、单一责任
export class Player {
    constructor(track) {
        this.currentTrack = track
        this.sound = null
        this.playState = PlayState.NONE
        this.currentTime = 0
        this.webAudioApi = null
        this.pendingSoundEffectType = 0 // 0 =>均衡器， 1 => 混响
        this.pendingSoundEffect = null
        this.animationFrameId = 0
        this.seekPendingMark = 0 //percent
        //动画帧 - 进度刷新
        this.animationFrameCnt = 0 //动画帧数计数器，控制事件触发频率，降低CPU占用
        this.stateRefreshFrequency = 60 //歌曲进度更新频度
        this.spectrumRefreshFrequency = 3 //歌曲频谱更新频度
        /*
        this.useStateRefreshAutoDetector = false
        this.lastAnimationFrameUpdateTime = 0   //上一动画帧执行时间
        this.animationFrameTimeCnt = 0  //动画帧累加计时器
        */
        //桌面歌词
        this.desktopLyricMessagePort = null
        this.desktopLyricMessagePortActiveState = null

        this.pendingOutputDeviceId = null
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
            .on('track-changed', track => player.setCurrent(track))
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
            .on('outputDevice-setup', value => player._setAudioOutputDevice(value))
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
                self.setState(PlayState.PLAYING)

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
                self.setState(PlayState.PAUSE)
            },
            onend: function () {
                self.setState(PlayState.END)
            },
            onseek: function () {
                //重置动画帧
                self._rewindAnimationFrame(self._step.bind(self))
                /*
                //重置动画帧相关时间
                self.lastAnimationFrameUpdateTime = Date.now()
                self.animationFrameTimeCnt = 1000
                */
            },
            onload: function() {
                self.setState(PlayState.LOADED)
            },
            onloaderror: function () {
                self.setState(PlayState.LOAD_ERROR)
            },
            onplayerror: function () {
                self.setState(PlayState.PLAY_ERROR)
            }
        })
        this._tryUnlockHowlAudios()
        this.currentTime = 0
        this.setState(PlayState.INIT)

        if (this.pendingOutputDeviceId) this._setAudioOutputDevice(this.pendingOutputDeviceId)
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
        if (!sound) return
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
        try {
            this.stop()
        } catch(error) {
            if(isDevEnv()) console.log(error)
        }
        this.currentTrack = track
        this.setState(PlayState.NONE)
        this.createSound()
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
        if (!sound.playing() && this.playState != PlayState.PLAYING) {
            this._stopAnimationFrame()
            return
        }
        //当前播放时间
        this.currentTime = sound.seek() || 0

        //刷新进度
        /*
        const isTimeReset = this._countAnimationFrameTime()
        const needRefreshState = this.useStateRefreshAutoDetector ? isTimeReset : this.isStateRefreshEnabled()
        if (needRefreshState) this.notify('track-pos', this.currentTime)
        */
        if (this.isStateRefreshEnabled()) this.notify('track-pos', this.currentTime)

        //声音处理
        try {
            this._resolveSound()
        } catch (error) {
            if (isDevEnv()) console.log(error)

            this.setState(PlayState.PLAY_ERROR)
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

    setState(state) {
        this.playState = state
        const { currentTrack: track, currentTime } = this
        this.notify('track-state', { state, track, currentTime })

        this.postPlayStateToDesktopLryic()
    }

    _createWebAudioApi() {
        if (!this.webAudioApi) {
            const audioCtx = Howler.ctx
            if (audioCtx) {
                const audioNode = this.sound._sounds[0]._node
                if (audioNode) this.webAudioApi = WebAudioApi.create(audioCtx, audioNode)
            }
        }
        return this.webAudioApi
    }

    _resolveSound() {
        if (!this._createWebAudioApi()) return
        this._resolvePendingSoundEffect()
        if (!this.isSpectrumRefreshEnabled()) return
        const { analyser, audioCtx } = this.webAudioApi
        if (!analyser) return
        const { frequencyBinCount: freqBinCount } = analyser
        const { sampleRate } = audioCtx
        const freqData = new Uint8Array(freqBinCount)
        analyser.getByteFrequencyData(freqData)
        this.notify('track-spectrumData', { freqData, freqBinCount, sampleRate, analyser })
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
        return this.animationFrameCnt % (this.stateRefreshFrequency || 60) == 0
    }

    isSpectrumRefreshEnabled() {
        return this.animationFrameCnt % (this.spectrumRefreshFrequency || 3) == 0
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
            case PlayState.NONE:
                this.postMessageToDesktopLryic('s-track-none')
                break
            case PlayState.INIT:
                this.postMessageToDesktopLryic('s-track-init', {
                    track: Player.getRawTrack(this.currentTrack)
                })
                break
            case PlayState.PLAYING:
                this.postMessageToDesktopLryic('s-track-play')
                break
            case PlayState.PAUSE:
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
                    playing: (self.playState == PlayState.PLAYING)
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

    _countAnimationFrameTime() {
        const _now = Date.now()
        //动画帧自动计时器
        if (this.lastAnimationFrameUpdateTime) {
            this.animationFrameTimeCnt += (_now - this.lastAnimationFrameUpdateTime)
        }
        this.lastAnimationFrameUpdateTime = _now
        const reset = this.animationFrameTimeCnt >= 990
        if (reset) this.animationFrameTimeCnt = 0
        return reset
    }

    //TODO 切换音频输出设备
    async _setAudioOutputDevice(deviceId) {
        try {
            this.pendingOutputDeviceId = null
            const audioSource = ("setSinkId" in AudioContext.prototype)
                ? Howler.ctx : this.sound._sounds[0]._node
            if (audioSource) await audioSource.setSinkId(deviceId)
        } catch (error) {
            if (isDevEnv()) console.log(`音频输出设置失败，DeviceId: ${deviceId}\n`, error)
            this.pendingOutputDeviceId = deviceId
        }
    }
}
