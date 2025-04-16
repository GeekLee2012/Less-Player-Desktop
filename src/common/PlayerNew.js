import { toRaw } from 'vue';
import { Howl, Howler } from 'howler';
import { PlayState } from '../common/Constants';
import { Track } from './Track';
import { createWebAudioApi } from './WebAudioApi';
import { isDevEnv, createMpv } from './Utils';
import { EventWrapper } from './EventBusWrapper';


const getRaw = (data) => {
    return data && toRaw(data)
}

const isTrackAvailable = (track) => {
    return Track.hasUrl(track)
}

const getRawTrack = (track) => {
    if(!track) return 
    const _track = getRaw(track)
    const { artist, album, lyric, lyricTrans, lyricRoma } = _track
    return Object.assign(_track, {
        artist: getRaw(artist),
        album: getRaw(album),
        lyric: getRaw(lyric),
        lyricTrans: getRaw(lyricTrans),
        lyricRoma: getRaw(lyricRoma),
    })
}

class HowlerPlayer extends EventWrapper {
    constructor(track) {
        super()
        this.currentTrack = track
        this.sound = null
        this.playState = PlayState.NONE
        this.currentTime = 0
        this.webAudioApi = null
        this.pendingSoundEffect = null
        this.pendingStereoPan = null
        this.pendingVolumeGain = null
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

    createInstance() {
        if (!isTrackAvailable(this.currentTrack)) return this.stop()
        
        const self = this
        this.sound = new Howl({
            src: [this.currentTrack.url],
            html5: true,
            autoplay: false,
            preload: false,
            pool: 1,
            onplay: function () {
                self.setState(PlayState.PLAYING)
                //存在未处理seek事件
                if (self.seekPendingMark) { 
                    self.animationFrameCnt = 0
                    self.seek(self.seekPendingMark)
                    self.seekPendingMark = 0
                    return 
                }
                //正常情况
                self._rewindAnimationFrame(self._step.bind(self))
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
                self.updateMetadata()
            },
            onloaderror: function (id, error) {
                self.setState(PlayState.LOAD_ERROR)
            },
            onplayerror: function (id, error) {
                self.setState(PlayState.PLAY_ERROR)
            }
        })
        this.currentTime = 0
        this._tryUnlockAudios()
        this.setState(PlayState.INIT)

        if (this.pendingOutputDeviceId) this._setAudioOutputDevice(this.pendingOutputDeviceId)
        return this.sound
    }

    getInstance() {
        return isTrackAvailable(this.currentTrack) && this.sound
    }

    //播放
    play() {
        const sound = this.getInstance()
        if (!sound) return
        sound.play()
    }

    //暂停
    pause() {
        const sound = this.getInstance()
        if (!sound) return
        sound.pause()
    }

    togglePlay() {
        const sound = this.getInstance()
        if (!sound) return
        sound.playing() ? sound.pause() : sound.play()
    }

    //停止
    stop() {
        try {
            const sound = this.getInstance()
            //释放资源
            if (sound) { 
                sound.stop()
                sound.unload()
            }
        } catch(error) {
            if(isDevEnv()) console.log(error)
        }
    }

    _tryUnlockAudios() {
        const audios = Howler._html5AudioPool
        // Unlock CORS
        if (audios) audios.forEach(audio => audio.crossOrigin = 'anonymous')
    }

    volume(value) {
        Howler.volume(value)
        this.updateVolumeGain(value)
    }

    seek(percent) {
        const sound = this.getInstance()
        if (!sound || !sound.playing()) return 

        const duration = sound.duration()
        if (duration) {
            const pos = Math.min(duration * percent, duration)
            sound.seek(pos)
        }
    }

    setState(state) {
        this.playState = state
        const { currentTrack: track, currentTime } = this
        this.notify('track-state', { state, track, currentTime })
        this.postPlayStateToDesktopLryic()
    }

    setCurrent(track) {
        this.stop()
        this.currentTrack = getRawTrack(track)
        this.currentTime = 0
        this.setState(PlayState.NONE)
        this.createInstance()
        return this
    }

    _initWebAudioApi() {
        if (!this.webAudioApi) {
            const audioCtx = Howler.ctx
            if (audioCtx) {
                const audioNode = this.sound._sounds[0]._node
                if (audioNode) this.webAudioApi = createWebAudioApi(audioCtx, audioNode)
            }
        }
        return this.webAudioApi
    }

    _step() {
        const sound = this.getInstance()
        if (!sound) return 
        if (!sound.playing() && this.playState != PlayState.PLAYING) {
            this._stopAnimationFrame()
            return 
        }
        //当前播放时间
        this.currentTime = sound.seek() || 0
        const duration = Number.isFinite(sound.duration()) ? sound.duration() * 1000 : 0
        //刷新进度
        /*
        const isTimeReset = this._countAnimationFrameTime()
        const needRefreshState = this.useStateRefreshAutoDetector ? isTimeReset : this.isStateRefreshable()
        if (needRefreshState) this.notify('track-pos', this.currentTime)
        */
        
        if (this.isStateRefreshable()) this.notify('track-pos', { currentTime: this.currentTime, duration })

        //声音处理
        try {
            this._resolveSound()
        } catch (error) {
            if (isDevEnv()) console.log(error)

            this.setState(PlayState.PLAY_ERROR)
        }
        //循环动画
        this._countAnimationFrame()
        this._rewindAnimationFrame(this._step.bind(this), true)
    }

    _resolveSound() {
        if (!this._initWebAudioApi()) return
        this._resolvePendingSoundEffect()
        if (!this.isSpectrumRefreshable()) return
        
        const { leftChannelAnalyser, rightChannelAnalyser, analyser, audioCtx } = this.webAudioApi
        if (!analyser || !leftChannelAnalyser || !rightChannelAnalyser) return
        
        const { frequencyBinCount: leftFreqBinCount } = leftChannelAnalyser
        const { frequencyBinCount: rightFreqBinCount } = rightChannelAnalyser
        const { frequencyBinCount: freqBinCount } = analyser
        
        const leftFreqData = new Uint8Array(leftFreqBinCount)
        const rightFreqData = new Uint8Array(rightFreqBinCount)
        const freqData = new Uint8Array(freqBinCount)
        leftChannelAnalyser.getByteFrequencyData(leftFreqData)
        rightChannelAnalyser.getByteFrequencyData(rightFreqData)
        analyser.getByteFrequencyData(freqData)

        const { sampleRate } = audioCtx
        this.notify('track-spectrumData', { 
                leftFreqData, leftFreqBinCount, 
                rightFreqData, rightFreqBinCount, 
                freqData, freqBinCount, sampleRate, 
                analyser, leftChannelAnalyser, rightChannelAnalyser 
            })
    }

    updateEQ(values) {
        if (this.webAudioApi) {
            this.webAudioApi.updateEQ(values)
            this.pendingSoundEffect = null
        } else {
            this.pendingSoundEffect = this.pendingSoundEffect || {}
            Object.assign(this.pendingSoundEffect, { eqValues: values })
        }
    }

    updateIR(source) {
        if (this.webAudioApi) {
            this.webAudioApi.updateIR(source)
            this.pendingSoundEffect = null
        } else {
            this.pendingSoundEffect = this.pendingSoundEffect || {}
            Object.assign(this.pendingSoundEffect, { irSource: source })
        }
    }

    updateStereoPan(value) {
        if (this.webAudioApi) {
            this.webAudioApi.updateStereoPan(value)
            this.pendingStereoPan = null
        } else {
            this.pendingStereoPan = value
        }
    }

    updateVolumeGain(value) {
        if (this.webAudioApi) {
            this.webAudioApi.updateVolumeGain(value)
            this.pendingVolumeGain = null
        } else {
            this.pendingVolumeGain = value
        }
    }

    setupSoundEffect(options) {
        const { eqValues, irSource, stereoPan, volumeGain } = options
        this.updateEQ(eqValues)
        this.updateIR(irSource)
        this.updateStereoPan(stereoPan)
        this.updateVolumeGain(volumeGain)
    }

    _resolvePendingSoundEffect() {
        if (this.pendingSoundEffect) {
            const { eqValues, irSource } = this.pendingSoundEffect
            if(irSource) this.updateIR(irSource)
            if(eqValues) this.updateEQ(eqValues)
        }
        if(typeof this.pendingStereoPan == 'number') {
            this.updateStereoPan(this.pendingStereoPan)
        }
    }

    _countAnimationFrame() {
        const max = this.stateRefreshFrequency || 1024
        this.animationFrameCnt = (this.animationFrameCnt + 1) % max
    }

    isStateRefreshable() {
        return this.animationFrameCnt % (this.stateRefreshFrequency || 60) == 0
    }

    isSpectrumRefreshable() {
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

    postToDesktopLryic(action, data) {
        if (!this.desktopLyricMessagePortActiveState) return 
        const messagePort = this.desktopLyricMessagePort
        try {
            if (messagePort) messagePort.postMessage({ action, data })
        } catch(error) {
            if(isDevEnv()) {
                console.log(error)
            }
        }
    }

    postPlayStateToDesktopLryic() {
        if (!this.desktopLyricMessagePortActiveState) return
        if(!this.mpv) return 

        switch (this.mpv.playState) {
            case PlayState.NONE:
                this.postToDesktopLryic('s-track-none')
                break
            case PlayState.INIT:
                this.postToDesktopLryic('s-track-init', {
                    track: this.currentTrack
                })
                break
            case PlayState.PLAYING:
                this.postToDesktopLryic('s-track-play')
                break
            case PlayState.PAUSE:
                this.postToDesktopLryic('s-track-pause')
                break
        }
    }

    onDesktopLyricMessage() {
        if(!this.desktopLyricMessagePort) return 
        const self = this
        this.desktopLyricMessagePort.onPlayerMessage = (action, data) => {
            if (action == 'c-track-init') {
                //self.setMessagePortActiveState(true)
                self.postToDesktopLryic('s-track-init', {
                    track: self.currentTrack,
                    playing: (self.playState == PlayState.PLAYING)
                })
            } else if (action == 'c-track-pos') {
                const sound = self.getInstance()
                if (!sound) return
                self.currentTime = sound.seek() || 0
                self.postToDesktopLryic('s-track-pos', self.currentTime)
            }
        }
    }

    updateLyric(track, hasLyric) {
        this.currentTrack = getRawTrack(track)
        this.postLyricStateToDesktopLyric(this.currentTrack, hasLyric)
    }

    postLyricStateToDesktopLyric(track, hasLyric) {
        if (!this.desktopLyricMessagePortActiveState) return
        const action = hasLyric ? 's-track-lyricLoaded' : 's-track-noLyric'
        this.postToDesktopLryic(action, track)
    }

    updateMetadata() {
        if(!this.currentTrack) return 
        const { duration } = this.currentTrack
        let sDuration = this.sound.duration()
        sDuration = Number.isFinite(sDuration) ? sDuration * 1000 : 0
        if((duration != sDuration) && (sDuration > 0)) {
            Object.assign(this.currentTrack, { duration: sDuration })
        }
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

class MpvPlayer extends EventWrapper {
    constructor(track) {
        super()
        this.currentTrack = track
        this.mpv = null
        this.playState = PlayState.NONE
        this.currentTime = 0
        this.started = false
        this.retryCreate = 0

        //桌面歌词
        this.desktopLyricMessagePort = null
        this.desktopLyricMessagePortActiveState = null

        this.pendingOutputDeviceId = null
        this.mpvBinaryPath = null
    }

    setFallback(value) {
        this.fallback = value
        return this
    }

    setMpvBinaryPath(value) {
        this.mpvBinaryPath = value
        if(this.getInstance()) {
            this.mpv = null
            this.createInstance()
        }
        return this
    }

    createInstance() {  
        if (!isTrackAvailable(this.currentTrack)) return this.stop()

        const self = this
        if(!this.mpv) {
            this.mpv = createMpv({
                "binary": this.mpvBinaryPath,
                "verbose": false,
                "audio_only": true
            })
            if(!this.mpv) {
                this.setState(PlayState.PLAY_ERROR, (++this.retryCreate > 1))
                return this.mpv
            }

            this.mpv.volume(100)
            this.setState(PlayState.NONE)

            this.mpv.on('started', () => {
                self.setState(PlayState.STARTED)
                self.seeking = false
                self.started = true
            })

            this.mpv.on('statuschange', (status) => {
                const pos = status['playlist-pos']
                if(pos < 0) return self.setState(PlayState.INIT)
                if(self.playState == PlayState.STOP) return

                const { pause } = status
                self.setState(pause ? PlayState.PAUSE : PlayState.PLAYING)
            })

            this.mpv.on('timeposition', async (position) => {                
                self.currentTime = position
                const duration = await self.duration()
                self.notify('track-pos', { currentTime: self.currentTime, duration })
            })

            this.mpv.on('stopped', async () => {
                if(self.playState != PlayState.STOP) self.setState(PlayState.END)
            })

            //this.mpv.on('seek', async ({ start, end }) => {})
        }

        this.mpv.clearPlaylist()
        //this.mpv.load(this.currentTrack.url)
        this.started = false
        this.setState(PlayState.INIT)
        this.currentTime = 0
        return this.mpv
    }

    getInstance() {
        if(this.mpv) this.retryCreate = 0
        return this.mpv
    }

    isTrackLoadable() {
        return isTrackAvailable(this.currentTrack) && !this.started
    }

    //播放
    play() {
        const mpv = this.getInstance()
        if(!mpv) return 
        if(this.isTrackLoadable()) return mpv.load(this.currentTrack.url)
        mpv.play()
    }

    //暂停
    pause() {
        const mpv = this.getInstance()
        if(!mpv) return
        mpv.pause()
    }

    togglePlay() {
        const mpv = this.getInstance()
        if(!mpv) return
        if(this.isTrackLoadable()) return mpv.load(this.currentTrack.url)
        mpv.togglePause()
    }

    //停止
    stop() {
        const mpv = this.getInstance()
        if(!mpv) return
        this.setState(PlayState.STOP)
        mpv.stop()
    }

    setState(state, fallback) {
        this.playState = state
        const { currentTrack: track, currentTime } = this
        this.notify('track-state', { state, track, currentTime, fallback })
        this.postPlayStateToDesktopLryic()
    }

    setCurrent(track) {
        this.currentTrack = getRawTrack(track)
        this.currentTime = 0
        this.setState(PlayState.NONE)
        this.createInstance()
        return this
    }

    playTrack(track, fallback) {
        this.setCurrent(track, fallback)
        if(fallback && !this.getInstance()) return this.setState(PlayState.PLAY_ERROR, fallback)
        this.play()
    }

    restore(track) {
        this.setCurrent(track)
    }

    volume(value) {
        const mpv = this.getInstance()
        if (!mpv) return
        mpv.volume(parseInt(value * 100))
    }

    async duration() {
        const mpv = this.getInstance()
        if (!mpv) return -1

        const duration = await mpv.getProperty('duration')
        return duration ? duration * 1000 : 0
    }

   async seek(percent) {
        const mpv = this.getInstance()
        if (!mpv) return

        const duration = await this.duration()
        if (duration && duration > 0) {
            const pos = Math.min(duration * percent, duration) / 1000
            mpv.goToPosition(pos)
        }
    }

    setupDesktopLyricMessagePort(messagePort) {
        this.desktopLyricMessagePort = messagePort
        this.onDesktopLyricMessage()
    }

    setMessagePortActiveState(state) {
        this.desktopLyricMessagePortActiveState = state
    }

    postToDesktopLryic(action, data) {
        if (!this.desktopLyricMessagePortActiveState) return 
        const messagePort = this.desktopLyricMessagePort
        try {
            if (messagePort) messagePort.postMessage({ action, data })
        } catch(error) {
            if(isDevEnv()) {
                console.log(error)
            }
        }
    }

    postPlayStateToDesktopLryic() {
        if (!this.desktopLyricMessagePortActiveState) return
        switch (this.playState) {
            case PlayState.NONE:
                this.postToDesktopLryic('s-track-none')
                break
            case PlayState.INIT:
                this.postToDesktopLryic('s-track-init', {
                    track: this.currentTrack
                })
                break
            case PlayState.PLAYING:
                this.postToDesktopLryic('s-track-play')
                break
            case PlayState.PAUSE:
                this.postToDesktopLryic('s-track-pause')
                break
        }
    }

    onDesktopLyricMessage() {
        if(!this.desktopLyricMessagePort) return 
        const self = this
        this.desktopLyricMessagePort.onPlayerMessage = (action, data) => {
            if (action == 'c-track-init') {
                //self.setMessagePortActiveState(true)
                self.postToDesktopLryic('s-track-init', {
                    track: self.currentTrack,
                    playing: (self.playState == PlayState.STARTED 
                        || self.playState == PlayState.PLAYING)
                })
            } else if (action == 'c-track-pos') {
                self.postToDesktopLryic('s-track-pos', self.currentTime)
            }
        }
    }

    updateLyric(track, hasLyric) {
        this.currentTrack = getRawTrack(track)
        this.postLyricStateToDesktopLyric(this.currentTrack, hasLyric)
    }

    postLyricStateToDesktopLyric(track, hasLyric) {
        if (!this.desktopLyricMessagePortActiveState) return
        const action = hasLyric ? 's-track-lyricLoaded' : 's-track-noLyric'
        this.postToDesktopLryic(action, track)
    }

    quit() {
        const mpv = this.getInstance()
        if(!mpv) return
        mpv.quit()
        this.mpv = null
    }
}

//追求简单、组合式API、单一责任
class Player extends EventWrapper {
    constructor() {
        super()
    }

    setDelegate(delegate) {
        this.delegate = delegate
        return this
    }

    setFallbackDelegate(delegate) {
        this.fallbackDelegate = delegate
        return this
    }

    setActiveDelegate(delegate) {
        if(this.activeDelegate && (this.activeDelegate != delegate)) {
            this.activeDelegate.stop()
        }
        this.activeDelegate = delegate
        return this
    }

    getActiveDelegate() {
        return this.activeDelegate || this.delegate || this.fallbackDelegate
    }

    static create() {
        return new Player().on({
            'track-play': value => singleton.playTrack(value),
            'track-restore': value => singleton.restore(value),
            'track-changed': value => singleton.setCurrent(value),
            'track-togglePlay': () => singleton.togglePlay(),
            'track-seek': value => singleton.seek(value),
            'volume-set': value => singleton.volume(value),
            'radio-play': () => singleton.setCurrent(null),
            'playbackQueue-empty': () => singleton.setCurrent(null),
            'track-setupSoundEffect': value => singleton.setupSoundEffect(value),
            'track-updateStereoPan': value => singleton.updateStereoPan(value),
            'track-updateVolumeGain': value => singleton.updateVolumeGain(value),
            'track-stateRefreshFrequency': value => singleton.updateStateRefreshFrequency(value),
            'track-spectrumRefreshFrequency': value => singleton.updateSpectrumRefreshFrequency(value),
            'track-markSeekPending': value => singleton.setSeekPendingMark(value),
            'desktopLyric-messagePort': value => singleton.setupDesktopLyricMessagePort(value),
            'track-lyricLoaded': value => singleton.updateLyric(value, true),
            'track-noLyric': value => singleton.updateLyric(value, false),
            'track-switchToFallback': value => singleton.switchToFallback(value),
            'desktopLyric-showState': value => singleton.setMessagePortActiveState(value),
            'outputDevice-setup': value => singleton._setAudioOutputDevice(value),
            'mpvBinary-setPath': value => singleton.setMpvBinaryPath(value),
            'app-beforeQuit': () => singleton.quit()
        })
    }

    //播放
    play() {
        if(!this.getActiveDelegate()) return
        if(!this.getActiveDelegate().play) return
        this.getActiveDelegate().play()
    }

    //暂停
    pause() {
        if(!this.getActiveDelegate()) return
        if(!this.getActiveDelegate().pause) return
        this.getActiveDelegate().pause()
    }

    togglePlay() {
        if(!this.getActiveDelegate()) return
        if(!this.getActiveDelegate().togglePlay) return
        this.getActiveDelegate().togglePlay()
    }

    //停止
    stop() {
        if(!this.getActiveDelegate()) return
        if(!this.getActiveDelegate().stop) return
        this.getActiveDelegate().stop()
    }

    setCurrent(track) {
        this.setActiveDelegate(null)
        if(!this.getActiveDelegate()) return
        if(!this.getActiveDelegate().setCurrent) return
        this.getActiveDelegate().setCurrent(track)
    }

    playTrack(track) {
        this.setCurrent(track)
        this.play()
    }

    restore(track) {
        this.setCurrent(track)
    }

    volume(value) {
        if(!this.getActiveDelegate()) return
        if(!this.getActiveDelegate().volume) return
        this.getActiveDelegate().volume(value)
    }

    seek(percent) {
        if(!this.getActiveDelegate()) return
        if(!this.getActiveDelegate().seek) return
        this.getActiveDelegate().seek(percent)
    }

    updateStateRefreshFrequency(value) {
        if(!this.getActiveDelegate()) return
        if(!this.getActiveDelegate().updateStateRefreshFrequency) return
        this.getActiveDelegate().updateStateRefreshFrequency(value)
    }

    updateSpectrumRefreshFrequency(value) {
        if(!this.getActiveDelegate()) return
        if(!this.getActiveDelegate().updateSpectrumRefreshFrequency) return
        this.getActiveDelegate().updateSpectrumRefreshFrequency(value)
    }

    setSeekPendingMark(value) {
        if(!this.getActiveDelegate()) return
        if(!this.getActiveDelegate().setSeekPendingMark) return
        this.getActiveDelegate().setSeekPendingMark(value)
    }

    updateStereoPan(value) {
        if(!this.getActiveDelegate()) return
        if(!this.getActiveDelegate().updateStereoPan) return
        this.getActiveDelegate().updateStereoPan(value)
    }

    updateVolumeGain(value) {
        if(!this.getActiveDelegate()) return
        if(!this.getActiveDelegate().updateVolumeGain) return
        this.getActiveDelegate().updateVolumeGain(value)
    }

    setupSoundEffect(options) {
        if(!this.getActiveDelegate()) return
        if(!this.getActiveDelegate().setupSoundEffect) return
        this.getActiveDelegate().setupSoundEffect(options)
    }

    setupDesktopLyricMessagePort(value) {
        if(!this.getActiveDelegate()) return
        if(!this.getActiveDelegate().setupDesktopLyricMessagePort) return
        this.getActiveDelegate().setupDesktopLyricMessagePort(value)
    }

    updateLyric(track, hasLyric) {
        if(!this.getActiveDelegate()) return
        if(!this.getActiveDelegate().updateLyric) return
        this.getActiveDelegate().updateLyric(track, hasLyric)
    }

    setMessagePortActiveState(value) {
        if(!this.getActiveDelegate()) return
        if(!this.getActiveDelegate().setMessagePortActiveState) return
        this.getActiveDelegate().setMessagePortActiveState(value)
    }

    async _setAudioOutputDevice(deviceId) {
        if(!this.getActiveDelegate()) return
        if(!this.getActiveDelegate()._setAudioOutputDevice) return
        this.getActiveDelegate()._setAudioOutputDevice(deviceId)
    }

    switchToFallback(value) {
        this.setActiveDelegate(this.fallbackDelegate)
        if(!this.fallbackDelegate) return
        if(!this.fallbackDelegate.playTrack) return
        this.fallbackDelegate.playTrack(value, true)
    }

    setMpvBinaryPath(value) {
        const delegates = [this.delegate, this.fallbackDelegate]
        delegates.forEach(delegate => {
            if(delegate && delegate.setMpvBinaryPath) {
                delegate.setMpvBinaryPath(value)
            }
        })
    }

    quit() {
        const delegates = [this.delegate, this.fallbackDelegate]
        delegates.forEach(delegate => {
            if(delegate && delegate.quit) {
                delegate.quit()
            }
        })
    }

}


const howlPlayer = new HowlerPlayer()
const mpvPlayer = new MpvPlayer()
let singleton = null
export function createAudioPlayer() {
    if(!singleton) {
        singleton = Player.create()
            .setDelegate(howlPlayer)
            .setFallbackDelegate(mpvPlayer)
    }
    return singleton
}