import { defineStore } from 'pinia';
import { PlayMode } from '../../common/Constants';
import { Track } from '../../common/Track';
import { toMmss } from '../../common/Utils';
import { Playlist } from '../../common/Playlist';
import { emitEvents } from '../../common/EventBusWrapper';



const NONE_TRACK = new Track('', '', 
    '爱你所爱',
    [{ id: '', name: '不枉青春' }],
    { id: '', name: '山川湖海，日月星辰' })

export const usePlayStore = defineStore('player', {
    state: () => ({
        playing: false,
        loading: false,
        playMode: PlayMode.REPEAT_ALL,
        playingIndex: -1,
        queueTracks: [],
        //单位: ms
        currentTime: 0,
        //0.0 - 1.0
        progress: 0.0,
        //0.0 - 1.0
        volume: 0.5,
        //是否正在自动下一曲
        isAutoPlaying: false,
        //音频输出设备
        audioOutputDevices: []
    }),
    getters: {
        currentTrack(state) {
            if (this.playingIndex < 0) return NONE_TRACK
            return this.track(this.playingIndex)
        },
        track(state) {
            return (index) => (state.queueTracks[index])
        },
        mmssCurrentTime() {
            return toMmss(this.currentTime)
        },
        queueTracksSize(state) {
            return state.queueTracks.length
        },
        hasLyric(state) {
            const track = state.currentTrack
            if (!track) return false
            const lyric = track.lyric
            if (!lyric) return false
            return lyric.data.size > 0
        }
    },
    actions: {
        findTrackIndex(track) {
            return this.queueTracks.findIndex((item, index) => Track.isEquals(track, item))
        },
        isNoneTrack(track) {
            return NONE_TRACK == track
        },
        isCurrentTrack(track) {
            return Track.isEquals(this.currentTrack, track)
        },
        isPlaying() {
            return this.playing
        },
        setPlaying(value) {
            this.playing = value
            if(value) this.setLoading(false)
        },
        isLoading() {
            return this.loading
        },
        setLoading(value) {
            this.loading = value
        },
        isDefaultFMRadioType(track) { 
            return track && Playlist.isFMRadioType(track) && !track.streamType
        },
        togglePlay() {
            const { currentTrack: track } = this
            //FM广播
            if (this.isDefaultFMRadioType(track)) {
                return emitEvents('radio-togglePlay')
            }
            //播放列表为空
            if (this.queueTracksSize < 1) return
            //当前歌曲不存在或存在但缺少url
            if (!Track.hasUrl(track) || NONE_TRACK == track) {
                this.playNextTrack()
                return
            }
            //当前歌曲正常
            emitEvents('track-togglePlay')
        },
        addTrack(track) {
            //TODO 超级列表如何保证时效
            const index = this.findTrackIndex(track)
            if (index == -1) this.queueTracks.push(track)
        },
        addTracks(tracks) {
            if (!tracks || !Array.isArray(tracks) || tracks.length < 1) return
            tracks.forEach(item => this.addTrack(item))
        },
        playTrackLater(track) {
            let index = this.findTrackIndex(track)
            if (index == -1) {
                index = this.playingIndex + 1
                this.queueTracks.splice(index, 0, track)
                return true
            } else if (index < this.playingIndex) {
                this.queueTracks.splice(this.playingIndex + 1, 0, track)
                this.queueTracks.splice(index, 1)
                --this.playingIndex
                return true
            } else if (index > (this.playingIndex + 1)) {
                this.queueTracks.splice(this.playingIndex + 1, 0, track)
                this.queueTracks.splice(index + 1, 1)
                return true
            }
            return false
        },
        removeTrack(track) {
            const index = this.findTrackIndex(track)
            if (index > -1) {
                const isCurrent = (index == this.playingIndex)
                this.queueTracks.splice(index, 1)
                emitEvents('track-resetTrackRetry')
                if (index <= this.playingIndex) {
                    --this.playingIndex
                }
                const maxSize = this.queueTracksSize
                if (maxSize < 1) {
                    this.resetQueue()
                    return
                }
                if (isCurrent) {
                    if (this.playing) {
                        this.playNextTrack()
                    }
                }
            }
        },
        resetQueue() {
            this.isAutoPlaying = false
            this.queueTracks.length = 0
            this.playingIndex = -1
            this._resetPlayState()
            this.loading = false
        },
        markPlayState(currentTime, progress) {
            this.currentTime = currentTime
            this.progress = progress
        },
        _resetPlayState() {
            this.playing = false
            this.currentTime = 0
            this.progress = 0.0
        },
        _validPlayingIndex() {
            const maxSize = this.queueTracksSize
            this.playingIndex = this.playingIndex > 0 ? this.playingIndex : 0
            this.playingIndex = this.playingIndex < maxSize ? this.playingIndex : (maxSize - 1)
        },
        //直接播放，其他状态一概不管
        playTrackDirectly(track) {
            this._resetPlayState()
            let playEventName = 'track-play'
            if (this.isDefaultFMRadioType(track)) { //FM广播, 默认Live Stream
                playEventName = 'radio-play'
            } else if (!Track.hasUrl(track)) {   //普通歌曲
                playEventName = 'track-changed'
            }
            emitEvents(playEventName, track)
        },
        //播放，并更新当前播放列表相关状态
        playTrack(track) {
            let index = this.findTrackIndex(track)
            if (index < 0) {
                index = this.playingIndex + 1
                this.queueTracks.splice(index, 0, track)
            }
            this.playingIndex = index
            this.playTrackDirectly(track)
        },
        playPrevTrack() {
            const maxSize = this.queueTracksSize
            if (maxSize < 1) return
            if (maxSize == 1) emitEvents('track-resetTrackRetry')
            switch (this.playMode) {
                case PlayMode.REPEAT_ALL:
                    const index = this.playingIndex - 1
                    this.playingIndex = (index < 0 ? maxSize - 1 : index)
                    break
                case PlayMode.REPEAT_ONE:
                    break
                case PlayMode.RANDOM:
                    break
            }
            this._validPlayingIndex()
            this.playTrackDirectly(this.currentTrack)
        },
        playNextTrack() {
            if (Playlist.isNormalRadioType(this.currentTrack)) {
                return emitEvents('track-nextPlaylistRadioTrack', this.currentTrack)
            }
            const maxSize = this.queueTracksSize
            if (maxSize < 1) return
            if (maxSize == 1) emitEvents('track-resetTrackRetry')
            switch (this.playMode) {
                case PlayMode.REPEAT_ALL:
                    this.playingIndex = (this.playingIndex + 1) % maxSize
                    break
                case PlayMode.REPEAT_ONE:
                    break
                case PlayMode.RANDOM:
                    this.playingIndex = Math.ceil(Math.random() * maxSize)
                    break
            }
            this._validPlayingIndex()
            this.playTrackDirectly(this.currentTrack)
        },
        updateVolume(value) {
            value = parseFloat(value)
            value = value > 0 ? value : 0
            value = value < 1 ? value : 1
            this.volume = value
            emitEvents('volume-set', value)
        },
        updateVolumeByOffset(value) {
            value = parseFloat(value)
            this.updateVolume(this.volume + value)
        },
        toggleVolumeMute() {
            this.updateVolume(this.volume > 0 ? 0.0 : 1.0)
        },
        switchPlayMode() {
            this.playMode = ++this.playMode % 3
        },
        setAutoPlaying(value) {
            this.isAutoPlaying = value
        },
        setAudioOutputDevices(devices) {
            this.audioOutputDevices = devices
        },
        moveTrack(index, toIndex) {
            if(this.queueTracks.length < 1) return
            if(index < 0 || toIndex < 0) return 
            if(index == toIndex) return 

            //移动分解为2步实现：1、删除当前元素；2、在目标位置重新插入当前元素
            const maxIndex = this.queueTracksSize - 1
            //移除当前元素
            const track = this.queueTracks[index]
            this.queueTracks.splice(index, 1)
            //插入当前元素到目标位置
            if(toIndex > index && toIndex < maxIndex) --toIndex
            this.queueTracks.splice(toIndex, 0, track)

            //前置检查，无当前播放直接返回
            //虽然不做检查，后面的代码也没有问题，但执行下去也毫无意义
            if(this.playingIndex < 0) return
            //当列表存在删除、插入操作时，需更新当前播放playingIndex
            if(index == this.playingIndex) {
                this.playingIndex = toIndex
            } else if(index < this.playingIndex && toIndex >= this.playingIndex) {
                --this.playingIndex
            } else if(index > this.playingIndex && toIndex <= this.playingIndex){
                ++this.playingIndex
            }
        }
    },
    persist: {
        enabled: true,
        strategies: [
            {
                //key: "player",
                storage: localStorage,
                paths: ['playingIndex', 'playMode', 'queueTracks', 'volume', 'currentTime', 'progress']
            }
        ]
    }
})