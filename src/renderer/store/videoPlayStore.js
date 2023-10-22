import { defineStore } from 'pinia';
import { PLAY_MODE } from '../../common/Constants';
import EventBus from '../../common/EventBus';



export const isVideoEquals = (v1, v2) => {
    if (!v1 || !v2) return false
    return v1.id == v2.id && v1.platform == v2.platform
}

export const useVideoPlayStore = defineStore('videoPlayer', {
    state: () => ({
        playing: false,
        playMode: PLAY_MODE.REPEAT_ALL,
        playingIndex: -1,
        queueVideos: [],
    }),
    getters: {
        currentVideo() {
            return this.playingIndex < 0 ? null : this.queueVideos[this.playingIndex]
        },
        queueVideosSize(state) {
            return state.queueVideos.length
        }
    },
    actions: {
        findIndex(video) {
            return this.queueVideos.findIndex(item => (isVideoEquals(video, item)))
        },
        isCurrentVideo(video) {
            return isVideoEquals(this.currentVideo, video)
        },
        isPlaying() {
            return this.playing
        },
        setPlaying(value) {
            this.playing = value
        },
        addVideo(video) {
            const index = this.findIndex(video)
            if (index == -1) this.queueVideos.push(video)
        },
        addVideos(videos) {
            if (!videos || !Array.isArray(videos) || videos.length < 1) return
            videos.forEach(item => this.addVideo(item))
        },
        playVideoLater(video) {
            let index = this.findIndex(video)
            if (index == -1) {
                index = this.playingIndex + 1
                this.queueVideos.splice(index, 0, video)
            } else if (index < this.playingIndex) {
                this.queueVideos.splice(this.playingIndex + 1, 0, video)
                this.queueVideos.splice(index, 1)
                --this.playingIndex
            } else if (index > this.playingIndex
                && (index != this.playingIndex + 1)) {
                this.queueVideos.splice(this.playingIndex + 1, 0, video)
                this.queueVideos.splice(index + 1, 1)
            }
        },
        removeVideo(video) {
            const index = this.findIndex(video)
            if (index > -1) {
                const isCurrent = (index == this.playingIndex)
                this.queueVideos.splice(index, 1)
                if (index <= this.playingIndex) {
                    --this.playingIndex
                }
                const maxSize = this.queueVideosSize
                if (maxSize < 1) {
                    this.resetQueue()
                    return
                }
                if (isCurrent) {
                    if (this.playing) {
                        this.playNextVideo()
                    }
                }
            }
        },
        resetQueue() {
            this.queueVideos.length = 0
            this.playingIndex = -1
            this.__resetPlayState()
        },
        __resetPlayState() {
            this.playing = false
            this.currentTime = 0
            this.progress = 0.0
        },
        __validPlayingIndex() {
            const maxSize = this.queueVideosSize
            this.playingIndex = this.playingIndex > 0 ? this.playingIndex : 0
            this.playingIndex = this.playingIndex < maxSize ? this.playingIndex : (maxSize - 1)
        },
        //直接播放，其他状态一概不管
        playVideoDirectly(video) {
            this.__resetPlayState()
            let playEventName = 'video-play'
            if (!video.url) {
                playEventName = 'video-changed'
            }
            EventBus.emit(playEventName, video)
        },
        //播放，并更新当前播放列表相关状态
        playVideoNow(video) {
            let index = this.findIndex(video)
            if (index < 0) {
                index = this.playingIndex + 1
                this.queueVideos.splice(index, 0, video)
            }
            this.playingIndex = index
            this.playVideoDirectly(video)
        },
        playPrevVideo() {
            const maxSize = this.queueVideosSize
            if (maxSize < 1) return
            switch (this.playMode) {
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
            this.playVideoDirectly(this.currentVideo)
        },
        playNextVideo() {
            const maxSize = this.queueVideosSize
            if (maxSize < 1) return
            switch (this.playMode) {
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
            this.playVideoDirectly(this.currentVideo)
        },
        /*
        switchPlayMode() {
            this.playMode = ++this.playMode % 3
        },
        */
    },
    persist: {
        enabled: true,
        strategies: [
            {
                storage: localStorage,
                paths: ['playingIndex', 'queueVideos']
            }
        ]
    }
})