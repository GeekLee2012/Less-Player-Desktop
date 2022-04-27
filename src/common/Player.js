import { Howl, Howler } from 'howler';
import { PLAY_STATE } from '../common/Constants';
import EventBus from '../common/EventBus';

let singleton = null

export class Player {
    
    constructor(track) {
        this.currentTrack = track
    }

    static get() {
        if(!singleton) {
            singleton = new Player()
        }
        return singleton
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
                    requestAnimationFrame(self.step.bind(self));
                    EventBus.emit('track-state', PLAY_STATE.PLAYING)
                },
                onpause: function() {
                    EventBus.emit('track-state', PLAY_STATE.PAUSE)
                },
                onend: function() {
                    EventBus.emit('track-state', PLAY_STATE.END)
                },
                onseek: function() {
                    requestAnimationFrame(self.step.bind(self));
                }
            })
        } 
        sound.play();
    }

    //暂停
    pause() {
        if(!this.currentTrack) return 
        const sound = this.currentTrack.howl
        if(sound) {
            sound.pause();
        }
    }

    togglePlay() {
        if(!this.currentTrack) return 
        const sound = this.currentTrack.howl
        if(sound) {
            if(sound.playing()) {
                sound.pause()
            } else {
                sound.play()
            }
        }
    }

    //暂停
    stop() {
        if(!this.currentTrack) return 
        const sound = this.currentTrack.howl
        if(sound) {
            sound.stop();
        }
    }

    setCurrent(track) {
        this.stop()
        this.currentTrack = track
    }

    volume(value) {
        Howler.volume(value)
    }

    seek(percent) {
        if(!this.currentTrack) return 
        const sound = this.currentTrack.howl
        if(sound.playing()) {
            sound.seek(sound.duration() * percent);
        }
    }

    step() {
        if(!this.currentTrack) return 
        // Get the Howl we want to manipulate.
        const sound = this.currentTrack.howl;
        // Determine our current seek position.
        const seek = sound.seek() || 0;
        //console.log("seek: " + seek)
        EventBus.emit('track-pos', seek)
        // If the sound is still playing, continue stepping.
        if (sound.playing()) {
            requestAnimationFrame(this.step.bind(this));
        }
    }
}

const player = Player.get()

//TODO
EventBus.on('suspend', () => {
    player.pause()
})

EventBus.on('track-play', track => {
    player.setCurrent(track)
    console.log(track)
    player.play()
})

EventBus.on('track-togglePlay', () => {
    player.togglePlay()
})

EventBus.on('track-seek', data => {
    player.seek(data)
})

EventBus.on("volume-changed", volume => {
    player.volume(volume)
})

EventBus.on("queue-empty", volume => {
    player.stop()
})
