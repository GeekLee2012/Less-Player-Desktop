import Hls from 'hls.js';
import EventBus from './EventBus';
import { PlayState } from './Constants';



let singleton = null
let videoNode = null
let lastPlayTime = null

export class VideoPlayer {

    constructor(video) {
        this.video = video
        this.hls = new Hls()
        this.videoChanged = false
        this.playState = PlayState.NONE
    }

    static get() {
        if (!singleton) singleton = new VideoPlayer()
        return singleton
    }

    /* 初始化并配置播放器 */
    static initAndSetup() {
        const player = VideoPlayer.get()
        return player.on('video-init', node => player.setVideoNode(node))
            .on('video-change', video => player.setVideo(video))
            .on('video-play', video => player.playVideo(video))
            .on('video-togglePlay', () => player.togglePlay())
            .on('video-setVolume', volume => player.volume(volume))
            .on('video-stop', () => player.setVideo(null))
    }

    setVideoNode(node) {
        videoNode = node
        if (videoNode) {
            const self = this
            videoNode.addEventListener('playing', event => self.setPlayState(PlayState.PLAYING))
            videoNode.addEventListener('pause', event => self.setPlayState(PlayState.PAUSE))
            videoNode.addEventListener("ended", event => self.setPlayState(PlayState.END))
            videoNode.addEventListener("error", event => self.setPlayState(PlayState.PLAY_ERROR))
        }
    }

    //播放
    play() {
        if (!Hls.isSupported() || !videoNode) return
        if (!this.video || !this.video.url) return this.setPlayState(PlayState.PLAY_ERROR)

        const self = this
        const { url: src } = this.video

        if (VideoPlayer.isHlsVideo()) {
            this.hls.loadSource(src)
            this.hls.attachMedia(videoNode)

            this.hls.on(Hls.Events.MANIFEST_PARSED, function () {
                this.setPlayState(PlayState.INIT)
                videoNode.play()

                lastPlayTime = Date.now()
                requestAnimationFrame(self._step.bind(self))
            })
        } else { //TODO
            if (this.videoChanged) {
                videoNode.load()
                this.setPlayState(PlayState.INIT)
            }
            videoNode.play()
        }
        this.videoChanged = false
    }

    static isHlsVideo(url) {
        if (!url || url.trim().length < 1) return false
        return url.includes('.m3u8?')
            || url.endsWith('.m3u8')
            || url.includes('.ts?')
            || url.endsWith('.ts')
    }

    addSourceToVideo(element, src, type) {
        if (!element) return
        let source = element.querySelector('source')
        if (!source) {
            source = document.createElement('source')
            element.appendChild(source)
        }
        source.src = src
        source.type = type
    }

    playing() {
        return this.playState == PlayState.PLAYING
    }

    //暂停
    pause() {
        if (!Hls.isSupported() || !videoNode) return
        if (!this.playing()) return

        if (VideoPlayer.isHlsVideo()) {
            this.hls.detachMedia()
        } else {
            videoNode.pause()
        }
        this.setPlayState(PlayState.PAUSE)
    }

    togglePlay() {
        if (this.playing()) {
            this.pause()
        } else {
            this.play()
        }
    }

    setPlayState(state) {
        this.playState = state
        const { video } = this
        this.notify('video-state', { state, video })
    }

    setVideo(video) {
        this.pause()
        if (VideoPlayer.isHlsVideo()) this.hls.stopLoad()
        this.video = video
        this.videoChanged = true
        this.playState = PlayState.NONE
        if (!video) this.reloadVideo()
    }

    reloadVideo() {
        if (videoNode) videoNode.load()
    }

    playVideo(video) {
        this.setVideo(video)
        this.play()
    }


    volume(value) {
        if (!Hls.isSupported() || !videoNode) return
        videoNode.volume = value
    }

    _step() {
        if (!this.video) return
        if (!this.playing()) return
        const nowTime = Date.now()
        const currentTime = (nowTime - lastPlayTime) || 0
        const currentSecs = currentTime / 1000
        this.notify('video-pos', currentSecs)
        requestAnimationFrame(this._step.bind(this))
    }

    on(event, handler) {
        EventBus.on(event, handler)
        return this
    }

    notify(event, args) {
        EventBus.emit(event, args)
        return this
    }

}
