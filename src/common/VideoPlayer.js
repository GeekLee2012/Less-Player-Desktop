import EventBus from './EventBus';
import Hls from 'hls.js';



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

        const src = this.video.url
        if (this.isM3U8Video()) {
            this.hls.loadSource(src)
            this.hls.attachMedia(gVideoHolder)

            this.hls.on(Hls.Events.MANIFEST_PARSED, function () {
                gVideoHolder.play()
                self.setPlayState(true)
                self.videoChanged = false
                lastPlayTime = Date.now()
                requestAnimationFrame(self.__step.bind(self))
            })
        } else { //TODO
            this.addSourceToVideo(gVideoHolder, src, 'video/mp4')
            gVideoHolder.load()
            gVideoHolder.play()
            this.setPlayState(true)
        }
    }

    isM3U8Video() {
        if (!this.video || !this.video.url) return false
        return this.video.url.includes('.m3u8')
    }

    addSourceToVideo(element, src, type) {
        let source = element.querySelector('source')
        if (!source) {
            source = document.createElement('source')
            element.appendChild(source)
        }
        source.src = src;
        source.type = type;
    }

    //暂停
    pause() {
        if (!Hls.isSupported()) return
        if (!gVideoHolder) return
        if (!this.playing) return
        if (this.isM3U8Video()) {
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
        this.hls.stopLoad()
        this.video = video
        this.videoChanged = true
        if (!video) this.resetHtmlVideo()
    }

    resetHtmlVideo() {
        this.addSourceToVideo(gVideoHolder, '')
        gVideoHolder.load()
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

    __step() {
        if (!this.video) return
        if (!this.playing) return
        const nowTime = Date.now()
        const currentTime = (nowTime - lastPlayTime) || 0
        const currentSecs = currentTime / 1000
        EventBus.emit('video-pos', currentSecs)
        requestAnimationFrame(this.__step.bind(this))
    }

    on(event, handler) {
        EventBus.on(event, handler)
        return this
    }

}
