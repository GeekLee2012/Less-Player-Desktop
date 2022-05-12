import { defineStore } from 'pinia';
import { PLAY_STATE, PLAY_MODE } from '../../common/Constants';
import EventBus from '../../common/EventBus';
import { Track } from '../../common/Track';
import { toMmss } from '../../common/Times';
import { RadioCN } from '../../vendor/radiocn';

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
        volume: 1,
        //是否为FM广播
        isFmMode: false,
        channelTrack: null
    }),
    getters: {
        currentTrack(state) {
            if(this.isFmMode) return this.channelTrack
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
        noTrack() {
            return NO_TRACK
        },
        mmssCurrentTime() {
            return toMmss(this.currentTime)
        },
        queueTracksSize(state) {
            return state.queueTracks.length
        },
        hasLyric(state) {
            const track = state.currentTrack
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
            //FM广播
            if(this.isFmMode) {
                EventBus.emit('radio-togglePlay')
                return 
            }

            if(this.queueTracksSize < 1) return
            if(this.currentTrack && (NO_TRACK != this.currentTrack)) {
                EventBus.emit('track-togglePlay')
                return 
            }
            this.playNextTrack()   
        },
        addTrack(track) {
            //TODO 超级列表如何保证时效
            if(this.queueTracks.indexOf(track) > -1) return
            this.queueTracks.push(track)
        },
        addTracks(tracks) {
            //TODO 暂时不去重, 超级列表如何保证时效
            this.queueTracks.push(...tracks)
        },
        removeTrack(track) {
            const index = this.queueTracks.indexOf(track)
            if(index > -1) {
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
                if(isCurrent && this.playing) {
                    this.playNextTrack()
                } 
            }
        },
        resetQueue() {
            this.queueTracks.length = 0
            this.playingIndex = -1
            this.__resetPlayState()
            EventBus.emit('queue-empty')
        },
        __resetPlayState() {
            this.playing = false
            this.currentTime = 0
            this.progress = 0.0
        },
        __changeTrack(track) {
            EventBus.emit('track-stop')
            EventBus.emit('track-changed', track)
            this.__resetPlayState()
        },
        __validPlayingIndex() {
            const maxSize = this.queueTracksSize
            this.playingIndex = this.playingIndex > 0 ? this.playingIndex : 0
            this.playingIndex = this.playingIndex < maxSize ? this.playingIndex : (maxSize - 1)
        },
        playTrack(track) {
            if(this.isFmMode) this.setFmMode(false)
            
            //TODO
            let index = this.queueTracks.indexOf(track)
            if(index == -1) {
                index = this.playingIndex + 1
                this.queueTracks.splice(index, 0, track)
            }
            this.playingIndex = index
            if(track.hasUrl()) {
                EventBus.emit('track-play', track)
                if(!track.hasLyric()) EventBus.emit('track-loadLyric', track)
            } else {
                this.__changeTrack(track)
            }
            console.log(this.currentTrack)
        },
        playPrevTrack() {
            //TODO
            const maxSize = this.queueTracksSize
            if(maxSize < 1) return
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
            this.__validPlayingIndex()
            this.__changeTrack(this.currentTrack)
        },
        playNextTrack() {
            if(this.isFmMode) this.setFmMode(false)

            //TODO
            if(this.currentTrack.isRadioType) {
                EventBus.emit('radio-nextTrack', this.currentTrack)
                return 
            }
            const maxSize = this.queueTracksSize
            if(maxSize < 1) return
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
            this.__validPlayingIndex()
            this.__changeTrack(this.currentTrack)
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
        },
        setFmMode(isFmMode) {
            this.isFmMode = isFmMode
            if(this.isFmMode) {
                this.resetQueue()
            } else {
                EventBus.emit('radio-stop')
            }
        },
        setFmChannel(channel) {
            if(!channel) return
            this.channelTrack = new Track(channel.id, RadioCN.CODE, channel.name, [ channel.radio ], null, 0, channel.cover)
            this.setFmMode(true)
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
    const { updateCurrentTime } = usePlayStore()
    updateCurrentTime(secs)
})

EventBus.on('track-volume', value => {
    const { updateVolume } = usePlayStore()
    updateVolume(value)
})

EventBus.on('key-togglePlay', () => {
    const { togglePlay } = usePlayStore()
    togglePlay()
})

//FM广播
EventBus.on('radio-state', state => {
    const { setPlaying, isFmMode } = usePlayStore()
    if(isFmMode) setPlaying(state)
})

EventBus.on('radio-channelChanged', channel => {
    const { setFmChannel  } = usePlayStore()
    setFmChannel(channel)
})
