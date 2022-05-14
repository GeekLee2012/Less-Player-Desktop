import { Howl, Howler } from 'howler';
import { PLAY_STATE } from '../common/Constants';
import EventBus from '../common/EventBus';

let singleton = null

//追求简洁、组合式API
export class Player {
    
    constructor(track) {
        this.currentTrack = track
    }

    static get() {
        if(!singleton) singleton = new Player()
        return singleton
    }

    /* 初始化并配置播放器 */
    static initAndSetup() {
        const player = Player.get()
        player.on('suspend', () => player.pause())
            .on('track-play', track => player.playTrack(track))
            .on('track-togglePlay', () => player.togglePlay())
            .on('track-seek', percent => player.seek(percent))
            .on('volume-set', volume => player.volume(volume))
            .on('track-stop', () => player.setCurrent(null))
            .on('queue-empty', () => player.setCurrent(null))
        return player
    }

    //播放
    play() {
        let sound = this.currentTrack.howl
        var self = this
        if(!sound) {
            sound = this.currentTrack.howl = new Howl({
                src: [ this.currentTrack.url ],
                html5: true,
                onplay: function() {
                    requestAnimationFrame(self.__step.bind(self))
                    EventBus.emit('track-state', PLAY_STATE.PLAYING)
                },
                onpause: function() {
                    EventBus.emit('track-state', PLAY_STATE.PAUSE)
                },
                onend: function() {
                    EventBus.emit('track-state', PLAY_STATE.END)
                },
                onseek: function() {
                    requestAnimationFrame(self.__step.bind(self))
                }
            })
        } 
        sound.play()
    }

    //暂停
    pause() {
        if(!this.currentTrack) return 
        const sound = this.currentTrack.howl
        if(sound) sound.pause()
    }

    togglePlay() {
        if(!this.currentTrack) return 
        const sound = this.currentTrack.howl
        if(!sound) return 
        if(sound.playing()) {
            sound.pause()
        } else {
            sound.play()
        }
    }

    //暂停
    stop() {
        if(!this.currentTrack) return 
        const sound = this.currentTrack.howl
        if(sound) sound.stop()
    }

    setCurrent(track) {
        this.stop()
        this.currentTrack = track
    }

    playTrack(track) {
        this.setCurrent(track)
        this.play()
    }

    volume(value) {
        Howler.volume(value)
    }

    seek(percent) {
        if(!this.currentTrack) return 
        const sound = this.currentTrack.howl
        if(sound.playing()) sound.seek(sound.duration() * percent)
    }
    
    __step() {
        if(!this.currentTrack) return 
        // Get the Howl we want to manipulate.
        const sound = this.currentTrack.howl
        // Determine our current seek position.
        const seek = sound.seek() || 0
        EventBus.emit('track-pos', seek)
        // If the sound is still playing, continue stepping.
        if (sound.playing()) requestAnimationFrame(this.__step.bind(this))
    }
    
    on(event, handler) {
        EventBus.on(event, handler)
        return this
    }

}
