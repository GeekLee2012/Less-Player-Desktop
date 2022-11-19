import { Howl, Howler } from 'howler';
import { PLAY_STATE } from '../common/Constants';
import EventBus from '../common/EventBus';
import { Playlist } from './Playlist';
import { Track } from './Track';

let singleton = null, audioSource = null, analyser = null, eqFilters = null
const EQ = [
    {
        frequency: 31,
        type: 'lowshelf'
    },
    {
        frequency: 62,
        type: 'peaking'
    },
    {
        frequency: 125,
        type: 'peaking'
    },
    {
        frequency: 250,
        type: 'peaking'
    },
    {
        frequency: 500,
        type: 'peaking'
    },
    {
        frequency: 1000,
        type: 'peaking'
    },
    {
        frequency: 2000,
        type: 'peaking'
    },
    {
        frequency: 4000,
        type: 'peaking'
    },
    {
        frequency: 8000,
        type: 'peaking'
    },
    {
        frequency: 16000,
        type: 'highshelf'
    }
]

//追求简洁、组合式API、单一责任
export class Player {
    constructor(track) {
        this.currentTrack = track
        this.sound = null
        this.retry = 0
    }

    static get() {
        if(!singleton) singleton = new Player()
        return singleton
    }

    /* 初始化并配置播放器 */
    static initAndSetup() {
        const player = Player.get()
        return player.on('suspend', () => player.pause())
            .on('track-play', track => player.playTrack(track))
            .on('track-restore', track => player.restore(track))
            .on('track-togglePlay', () => player.togglePlay())
            .on('track-seek', percent => player.seek(percent))
            .on('volume-set', volume => player.volume(volume))
            .on('track-stop', () => player.setCurrent(null))
            .on('radio-play', () => player.setCurrent(null))
            .on('queue-empty', () => player.setCurrent(null))
            .on('track-updateEQ', (values) => player.updateEQ(values))
    }

    createSound() {
        if(!Track.hasUrl(this.currentTrack)) return null
        var self = this
        //释放资源
        if(this.sound) this.sound.unload()
        this.sound = new Howl({
            src: [ this.currentTrack.url ],
            html5: true,
            autoplay: false,
            preload: false,
            onplay: function() {
                this.retry = 0
                requestAnimationFrame(self.__step.bind(self))
                self.notifyStateChanged(PLAY_STATE.PLAYING)
            },
            onpause: function() {
                self.notifyStateChanged(PLAY_STATE.PAUSE)
            },
            onend: function() {
                self.notifyStateChanged(PLAY_STATE.END)
            },
            onseek: function() {
                requestAnimationFrame(self.__step.bind(self))
            },
            onloaderror: function() {
                self.retryPlay(1)
            },
            onplayerror: function() {
                self.retryPlay(1)
            }
        })
        this.tryUnlockHowlAudios()
        return this.sound
    }

    getSound() {
        return Track.hasUrl(this.currentTrack) ? this.sound : null
    }

    //播放
    play() {
        let sound = this.getSound()
        if(sound) sound.play()
    }

    //暂停
    pause() {
        const sound = this.getSound()
        if(sound) sound.pause()
    }

    togglePlay() {
        const sound = this.getSound()
        if(!sound) {
            this.retryPlay(1)
            return
        } 
        if(sound.playing()) {
            sound.pause()
        } else {
            sound.play()
        }
    }

    //暂停
    stop() {
        const sound = this.getSound()
        if(sound) sound.stop()
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
        //this.createSound()
    }

    volume(value) {
        Howler.volume(value)
    }

    seek(percent) {
        const sound = this.getSound()
        if(!sound || !sound.playing()) return 
        sound.seek(sound.duration() * percent)
    }
    
    __step() {
        // Get the Howl we want to manipulate.
        const sound = this.getSound()
        if(!sound) return
        if(!sound.playing()) return 
        // Determine our current seek position.
        const seek = sound.seek() || 0
        EventBus.emit('track-pos', seek)
        try {
            this.analyseSound()
        } catch(error) {
            console.log(error)
            this.retryPlay(1)
        }
        // If the sound is still playing, continue stepping.
        requestAnimationFrame(this.__step.bind(this))
    }
    
    on(event, handler) {
        EventBus.on(event, handler)
        return this
    }

    notifyStateChanged(state) {
        EventBus.emit('track-state', state)
    }
    
    notifyError() {
        EventBus.emit('track-error', this.currentTrack)
    }

    retryPlay(times) {
        if(this.retry < times) this.notifyError()
        ++this.retry
    }

    analyseSound () {
        const audioCtx = Howler.ctx
        if(!audioCtx) return 
        const audioNode = this.sound._sounds[0]._node
        if(!audioNode) return 
        if(!analyser) {
            analyser = audioCtx.createAnalyser()
            //analyser.fftSize = 256
            analyser.fftSize = 512
            var distortion = audioCtx.createWaveShaper()
            var gainNode = audioCtx.createGain()
            var biquadFilters = this.createBiquadFilters(audioCtx)
            eqFilters = biquadFilters
            if(!audioSource) audioSource = audioCtx.createMediaElementSource(audioNode)
            audioSource.connect(analyser)
            analyser.connect(distortion)
            this.connectBiquadFilters(biquadFilters, distortion, gainNode)
            gainNode.connect(audioCtx.destination)
        }
        const freqData = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(freqData)
        EventBus.emit('track-freqUnit8Data', freqData)
    }

    tryUnlockHowlAudios() {
        const audios = Howler._html5AudioPool
        // Unlock CORS
        audios.forEach(audio => {
            audio.crossOrigin = 'anonymous'
        })
    }

    createBiquadFilters(audioCtx) {
        if(!audioCtx) return []
        let filters = EQ.map(function(band) {
            let filter = audioCtx.createBiquadFilter()
            filter.type = band.type
            filter.gain.value = 0 // -40 ~ 40
            filter.Q.value = 1
            filter.frequency.value = band.frequency
            return filter
        })
        return filters
    }

    connectBiquadFilters(filters, currentNode, nextNode) {
        if(!filters || filters.length < 0) return
        filters.reduce(function (prev, curr) {
            prev.connect(curr)
            return curr
        }, currentNode).connect(nextNode)
    }

    updateEQ(values) {
        if(!eqFilters || eqFilters.length < 1) return
        eqFilters.forEach((filter, index) => {
            filter.gain.value = values[index]
        })
    }

}
