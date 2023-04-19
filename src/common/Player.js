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
        this.retry = 0
        this.webAudioApi = null
        this.pendingSoundEffectType = 0 // 0 =>均衡器， 1 => 混响
        this.pendingSoundEffect = null
        this.animationFrameId = 0
        this.seeking = false
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
            .on('track-updateEQ', (values) => player.updateEQ(values))
            .on('track-updateIR', (source) => player.updateIR(source))
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
                if (self.animationFrameId > 0) cancelAnimationFrame(self.animationFrameId)
                self.animationFrameId = requestAnimationFrame(self._step.bind(self))
                self.notifyStateChanged(PLAY_STATE.PLAYING)
            },
            onpause: function () {
                if (self.animationFrameId > 0) cancelAnimationFrame(self.animationFrameId)
                self.notifyStateChanged(PLAY_STATE.PAUSE)
            },
            onend: function () {
                self.notifyStateChanged(PLAY_STATE.END)
            },
            onseek: function () {
                self.seeking = true
                if (self.animationFrameId > 0) cancelAnimationFrame(self.animationFrameId)
                self.animationFrameId = requestAnimationFrame(self._step.bind(self))
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
        if (!sound.playing() && !this.seeking) return
        if (this.seeking) this.seeking = false
        const seek = sound.seek() || 0
        EventBus.emit('track-pos', seek)
        try {
            this.resolveSound()
        } catch (error) {
            console.log(error)
            this.retryPlay(1)
        }
        if (this.animationFrameId > 0) cancelAnimationFrame(this.animationFrameId)
        this.animationFrameId = requestAnimationFrame(this._step.bind(this))
    }

    on(event, handler) {
        EventBus.on(event, handler)
        return this
    }

    notifyStateChanged(state) {
        EventBus.emit('track-state', state)
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
        EventBus.emit('track-freqUnit8Data', freqData)
    }

    tryUnlockHowlAudios() {
        const audios = Howler._html5AudioPool
        if (!audios) return
        // Unlock CORS
        audios.forEach(audio => {
            audio.crossOrigin = 'anonymous'
        })
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
}
