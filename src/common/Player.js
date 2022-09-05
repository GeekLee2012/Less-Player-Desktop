import { Howl, Howler } from 'howler';
import { PLAY_STATE } from '../common/Constants';
import EventBus from '../common/EventBus';

let singleton = null

//追求简洁、组合式API、单一责任
export class Player {
    constructor(track) {
        this.currentTrack = track
        this.sound = null
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
    }

    createSound() {
        if(!this.currentTrack) return null
        var self = this
        //释放资源
        if(this.sound) this.sound.unload()
        this.sound = new Howl({
            src: [ this.currentTrack.url ],
            html5: true,
            onplay: function() {
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
            }
        })
        return this.sound
    }

    getSound() {
        if(!this.currentTrack) return null
        return this.sound
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
        if(!sound) return 
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
        if(!sound) return 
        if(sound.playing()) sound.seek(sound.duration() * percent)
    }
    
    __step() {
        // Get the Howl we want to manipulate.
        const sound = this.getSound()
        if(!sound) return
        if(!sound.playing()) return 
        // Determine our current seek position.
        const seek = sound.seek() || 0
        EventBus.emit('track-pos', seek)
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
    
}
