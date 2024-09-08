import { defineStore } from 'pinia';
import { PlayMode } from '../../common/Constants';
import { onEvents, emitEvents } from '../../common/EventBusWrapper';
import { Video } from '../../common/Video';
import { trimArray } from '../../common/Utils';


const isValueEqual = (v1, v2) => {
    if(!v1 || !v2) return 
    if(typeof v1 == 'string' || typeof v2 == 'string') {
        v1 = v1.toString().trim()
        v2 = v2.toString().trim() 
    }
    return v1 == v2
}

export const isVideoEquals = (v1, v2) => {
    if (!v1 || !v2) return false
    return v1.platform == v2.platform && 
        (isValueEqual(v1.id, v2.id) || isValueEqual(v1.title, v2.title))
}

//RGB三色主题
export const videoThemeNames = ['vjs-theme-city', 'vjs-theme-forest', 'vjs-theme-sea']

export const useVideoPlayStore = defineStore('videoPlayer', {
    state: () => ({
        playing: false,
        playMode: PlayMode.REPEAT_ALL,
        currentVideo: null, 
        playingIndex: -1, 
        videoThemeIndex: 1,
        dataLayoutIndex: 0, // 0 => Grid, 1 => List
        recentVideos: [],
        savePlayingPos: false, //是否保存播放进度，即是否从头开始看
    }),
    getters: {
        currentVideoPlayingItem() {
            if(!this.currentVideo) return 
            const { data } = this.currentVideo
            return data ? data[this.playingIndex] : this.currentVideo
        },
        currentVideoData() {
            if(!this.currentVideo) return 
            const { data } = this.currentVideo
            return data ? data : []
        },
        currentVideoDataSize() {
            if(!this.currentVideo) return -1
            const { data } = this.currentVideo
            return data ? data.length : -1
        },
        isPlayFromBeginning() {
            return !this.savePlayingPos
        }
    },
    actions: {
        isCurrentVideo(video) {
            return isVideoEquals(this.currentVideo, video)
        },
        isPlaying() {
            return this.playing
        },
        setPlaying(value) {
            this.playing = value
        },
        findItemIndex(video) {
            const { data } = this.currentVideo
            if(!data || data.length < 1) return -1
            return data.findItemIndex(item => (isVideoEquals(video, item)))
        },
         /*
        addVideoItem(video) {
            if(!video || !this.currentVideo) return 
            const { data } = this.currentVideo
            if(!data || data.length < 1) return 

            const index = this.findItemIndex(video)
            if (index == -1) this.currentVideo.data.push(video)
        },
        addVideoItems(videos) {
            if(!this.currentVideo) return 
            const { data } = this.currentVideo
            if(!data || data.length < 1) return 

            if (!videos || !Array.isArray(videos) || videos.length < 1) return
            videos.forEach(item => this.addVideoItem(item))
        },
        removeVideoItem(video) {
            if(!video || !this.currentVideo) return 
            const { data } = this.currentVideo
            if(!data || data.length < 1) return 

            const index = this.findItemIndex(video)
            if (index > -1) {
                const isCurrent = (index == this.playingIndex)
                this.currentVideo.data.splice(index, 1)
                if (index <= this.playingIndex) {
                    --this.playingIndex
                }
                const maxSize = this.currentVideoDataSize
                if (maxSize < 1) return
                if (isCurrent) {
                    if (this.playing) {
                        this.playNextVideoItem()
                    }
                }
            }
        },
        resetQueue() {
            this.queueVideos.length = 0
            this.playingIndex = -1
        },
        */
        _resetPlayState() {
            this.playing = false
            //this.currentTime = 0
            //this.progress = 0.0
        },
        _validPlayingIndex(index) {
            index = index || 0
            const size = this.currentVideoDataSize
            index = Math.max(index, 0)
            index = Math.min(index, (size - 1))
            return index
        },
        //直接播放，其他状态一概不管
        playVideoDirectly(video) {
            if(!video) return
            this._resetPlayState()

            const playEventName = video.url ? 'video-play' : 'video-change'
            emitEvents(playEventName, video)
        },
        //播放，并更新当前播放列表相关状态
        playVideoNow(video, index, pos) {
            if(!video) return 

            this.currentVideo = video
            const isCollectionType = Video.isCollectionType(video)
            this.playingIndex = !isCollectionType ? -1 : Math.max(index || 0, 0)

            const _video = isCollectionType ? this.currentVideoPlayingItem : this.currentVideo
            Object.assign(_video, { pos })
            this.playVideoDirectly(_video)
            this.traceRecentVideos()
        },
        playVideoItemByIndex(index) {
            this.playingIndex = this._validPlayingIndex(index)
            this.playVideoNow(this.currentVideo, this.playingIndex)
        },
        playPrevVideoItem() {
            const size = this.currentVideoDataSize
            if (size < 1) return
            let index = this.playingIndex
            switch (this.playMode) {
                case PlayMode.REPEAT_ALL:
                    --index
                    index = index < 0 ? size - 1 : index
                    break
                case PlayMode.REPEAT_ONE:
                    break
                case PlayMode.RANDOM:
                    break
            }
            this.playVideoItemByIndex(index)
        },
        playNextVideoItem() {
            const size = this.currentVideoDataSize
            if (size < 1) return

            let index = this.playingIndex
            switch (this.playMode) {
                case PlayMode.REPEAT_ALL:
                    index = ++index % size
                    break
                case PlayMode.REPEAT_ONE:
                    break
                case PlayMode.RANDOM:
                    index = Math.ceil(Math.random() * size)
                    break
            }
            this.playVideoItemByIndex(index)
        },
        switchVideoThemeIndex() {
            this.videoThemeIndex = ++this.videoThemeIndex % videoThemeNames.length
        },
        seDataLayoutIndex(index) {
            this.dataLayoutIndex = index
        },
        clearCurrentVideo() {
            this.currentVideo = null
            this.playingIndex = -1
            this._resetPlayState()
        },
        traceRecentVideos() {
            const current = this.currentVideo
            let index = 0
            do {
                index = this.recentVideos.findIndex(item => isVideoEquals(item.data, current))
                if(index > -1) {
                    this.recentVideos.splice(index, 1)
                    index = 0
                }
            } while(index > -1)
            
            this.recentVideos.push({
                data: current,
                index: this.playingIndex
            })
            //TODO 暂时只保留一条记录
            trimArray(this.recentVideos, 1)
        },
        getRecentLatestVideo() {
            const size = this.recentVideos.length
            if(size < 1) return 
            return this.recentVideos[0]
        },
        clearRecentVideos() {
            this.recentVideos.length = 0
        },
        toggleSavePlayingPos() {
            this.savePlayingPos = !this.savePlayingPos
        },
        updateRecentLatestVideo(pos) {
            if(!this.savePlayingPos) return 
            const video = this.getRecentLatestVideo()
            if(!video) return 
            Object.assign(video, { pos })
        },
    },
    persist: {
        enabled: true,
        strategies: [
            {
                storage: localStorage,
                paths: [ 'currentVideo', 'playingIndex', 'videoThemeIndex', 'dataLayoutIndex', 'recentVideos', 'savePlayingPos' ]
            }
        ]
    }
})