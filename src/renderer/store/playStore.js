import { defineStore } from 'pinia';
import { PLAY_STATE, PLAY_MODE } from '../../common/Constants';
import EventBus from '../../common/EventBus';
import { Track } from '../../common/Track';
import { toMmss } from '../../common/Times';

const NO_TRACK = new Track(0, '', '听你想听，爱你所爱', 
                    [ { id: 0, name: '趁青春' }], 
                    { id: 0, name: '山川湖海，日月星辰' }, 
                    0, 'default_cover.png')

export const usePlayStore = defineStore('play', {
    state: ()=> ({
        playing: false,
        playingIndex: -1,
        playMode: PLAY_MODE.REPEAT_ALL,
        queueTracks: [],
        //单位: ms
        currentTime: 0,
        //0.0 - 1.0
        progress: 0.0,
        //0.0 - 1.0
        volume: 1
    }),
    getters: {
        currentTrack(state) {
            if(this.playingIndex < 0) return NO_TRACK
            return this.track(this.playingIndex)
        },
        isCurrentTrack(state) {
            return (track) => {
                return track.id > 0 && state.currentTrack.id == track.id
            }
        },
        track(state) {
            return (index) => {
                return state.queueTracks[index]
            }
        },
        indexOf(state) {
            return (track) => {
                return state.queueTracks.indexOf(track)
            }
        },
        noTrack() {
            return NO_TRACK
        },
        mmssCurrentTime() {
            return toMmss(this.currentTime)
        },
        queueTracksSize(state) {
            return state.queueTracks.length
        },
        hasLyric() {
            const track = this.currentTrack
            if(!track) return false
            const lyric = track.lyric
            if(!lyric) return false
            return lyric.data.size > 0
        }
    },
    actions: {
        setPlaying(value) {
            this.playing = value
        },
        togglePlay() {
            if(this.currentTrack && NO_TRACK != this.currentTrack) {
                this.setPlaying(!this.playing)
                EventBus.emit('track-togglePlay')
            } else {
                this.playNextTrack()   
            }
        },
        addTrack(track) {
            if(this.indexOf(track) != -1) return
            this.queueTracks.push(track)
        },
        addTracks(tracks) {
            //TODO 暂时不去重
            this.queueTracks.push(...tracks)
        },
        removeTrack(track) {
            const index = this.queueTracks.indexOf(track)
            if(index != -1) {
                this.queueTracks.splice(index, 1)
                const isCurrent = (index == this.playingIndex)
                if(index <= this.playingIndex) {
                    --this.playingIndex
                }
                const maxSize = this.queueTracksSize
                if(maxSize < 1){
                    this.resetQueue()
                    return 
                }
                if(isCurrent) {
                    this.playNextTrack()
                } 
            }
        },
        resetQueue() {
            this.queueTracks.length = 0
            this.playingIndex = -1
            this.playing = false
            this.currentTime = 0
            this.progress = 0.0
            EventBus.emit('queue-empty')
        },
        playTrack(track) {
            let index = this.indexOf(track)
            if(index == -1) {
                index = this.playingIndex + 1
                this.queueTracks.splice(index, 0, track)
            }
            this.playingIndex = index
            if(track.url && track.url.trim().length > 0) {
                EventBus.emit('track-play', track)
            } else {
                EventBus.emit('track-changed', track)
            }
        },
        playPrevTrack() {
            //TODO
            const maxSize = this.queueTracksSize
            switch(this.playMode) {
                case PLAY_MODE.REPEAT_ALL:
                    --this.playingIndex
                    this.playingIndex = this.playingIndex < 0 ? maxSize - 1 : this.playingIndex
                    break
                case PLAY_MODE.REPEAT_ONE:
                    break
                case PLAY_MODE.RANDOM:
                    break
            }
            EventBus.emit('track-changed', this.currentTrack)
        },
        playNextTrack() {
            //TODO
            const maxSize = this.queueTracksSize
            switch(this.playMode) {
                case PLAY_MODE.REPEAT_ALL:
                    this.playingIndex = ++this.playingIndex % maxSize
                    break
                case PLAY_MODE.REPEAT_ONE:
                    break
                case PLAY_MODE.RANDOM:
                    this.playingIndex = Math.ceil(Math.random() * maxSize)
                    break
            }
            EventBus.emit('track-changed', this.currentTrack)
        },
        updateCurrentTime(secs) {
            this.currentTime = secs * 1000
            let duration = 0
            try {
                duration = this.currentTrack.duration
            } catch(error) {
                console.log(error)
            }
            this.progress = duration > 0 ? (this.currentTime / duration) : 0
        },
        updateVolume(value) {
            value = parseFloat(value)
            value = value > 0 ? value : 0
            value = value < 1 ? value : 1 
            this.volume = value
        },
        switchPlayMode() {
            this.playMode = ++this.playMode % 3
            //TODO
        }
    }
})

EventBus.on('track-state', state => {
    const { playNextTrack, setPlaying } = usePlayStore();
    switch(state) {
        case PLAY_STATE.PLAYING:
            setPlaying(true)
            break;
        case PLAY_STATE.PAUSE:
            setPlaying(false)
            break;
        case PLAY_STATE.END:
            playNextTrack()
            break;
        default:
            break
    }
})

EventBus.on('track-pos', secs => {
    const { updateCurrentTime } = usePlayStore();
    updateCurrentTime(secs)
})

EventBus.on('track-volume', value => {
    const { updateVolume } = usePlayStore();
    updateVolume(value)
})
