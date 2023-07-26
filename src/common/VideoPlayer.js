import Hls from 'hls.js';
import EventBus from './EventBus';



let singleton = null
let gVideoHolder = null
let lastPlayTime = null

export class VideoPlayer {

    constructor(video) {
        this.video = video
        this.hls = new Hls()
        this.playing = false
        this.videoChanged = false
    }

    static get() {
        if (!singleton) singleton = new VideoPlayer()
        return singleton
    }

    /* 初始化并配置播放器 */
    static initAndSetup() {
        const player = VideoPlayer.get()
        return player.on('video-init', videoHolder => VideoPlayer.setVideoHolder(videoHolder))
            .on('video-change', video => player.setVideo(video))
            .on('video-play', video => player.playVideo(video))
            .on('video-togglePlay', () => player.togglePlay())
            .on('volume-set', volume => player.volume(volume))
            .on('video-stop', () => player.setVideo(null))
    }

    static setVideoHolder(videoHolder) {
        gVideoHolder = videoHolder
    }

    //播放
    play() {
        if (!Hls.isSupported()) return
        if (!gVideoHolder) return
        if (!this.video || !this.video.url) return
        const self = this

        const { url: src } = this.video
        if (VideoPlayer.isHlsVideo()) {
            this.hls.loadSource(src)
            this.hls.attachMedia(gVideoHolder)

            this.hls.on(Hls.Events.MANIFEST_PARSED, function () {
                gVideoHolder.play()
                self.setPlayState(true)
                self.videoChanged = false
                lastPlayTime = Date.now()
                requestAnimationFrame(self._step.bind(self))
            })
        } else { //TODO
            gVideoHolder.load()
            gVideoHolder.play()
            this.setPlayState(true)
        }
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

    //暂停
    pause() {
        if (!Hls.isSupported() || !gVideoHolder) return
        if (!this.playing) return
        if (VideoPlayer.isHlsVideo()) {
            this.hls.detachMedia()
        } else {
            gVideoHolder.pause()
        }
        this.setPlayState(false)
    }

    togglePlay() {
        if (this.playing) {
            this.pause()
        } else {
            this.play()
        }
    }

    setPlayState(playing) {
        this.playing = playing
        EventBus.emit('video-state', playing)
    }

    setVideo(video) {
        this.pause()
        if (VideoPlayer.isHlsVideo()) this.hls.stopLoad()
        this.video = video
        this.videoChanged = true
        if (!video) this.reloadVideo()
    }

    reloadVideo() {
        if (gVideoHolder) gVideoHolder.load()
    }

    playVideo(video) {
        this.setVideo(video)
        this.play()
    }


    volume(value) {
        if (!Hls.isSupported()) return
        if (!gVideoHolder) return
        gVideoHolder.volume = value
    }

    _step() {
        if (!this.video) return
        if (!this.playing) return
        const nowTime = Date.now()
        const currentTime = (nowTime - lastPlayTime) || 0
        const currentSecs = currentTime / 1000
        EventBus.emit('video-pos', currentSecs)
        requestAnimationFrame(this._step.bind(this))
    }

    on(event, handler) {
        EventBus.on(event, handler)
        return this
    }

}
