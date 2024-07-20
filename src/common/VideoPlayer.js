import Hls from 'hls.js';
import { PlayState } from './Constants';
import { onEvents, emitEvents } from './EventBusWrapper';



let singleton = null
let videoNode = null
let lastPlayTime = null

class VideoPlayer {

    constructor(video) {
        this.video = video
        this.hls = new Hls()
        this.videoChanged = false
        this.playState = PlayState.NONE
    }

    static create() {
        if (singleton) return singleton
        singleton = new VideoPlayer().on({
                'video-init': value => singleton.setVideoNode(value),
                'video-change': value => singleton.setVideo(value),
                'video-play': value => singleton.playVideo(value),
                'video-togglePlay': () => singleton.togglePlay(),
                'video-setVolume': value => singleton.volume(value),
                'video-stop': () => singleton.setVideo(null),
            })
        return singleton
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
    
    on(registration) {
        onEvents(registration)
        return this
    }

    notify(events, data) {
        emitEvents(events, data)
        return this
    }

}

export function createVideoPlayer() {
    return VideoPlayer.create()
}
