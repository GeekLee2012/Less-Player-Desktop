import { PlayState, PlayAction } from './Constants';
import { onEvents, emitEvents } from './EventBusWrapper';


let singleton = null

class VideoPlayer {

    constructor(video) {
        this.video = video
        this.videoNode = null
        this.rawPlayer = null
        this.videoChanged = false
        this.playState = PlayState.NONE
        this.volume = 0.5
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

    initRawPlayer() {
        if(!this.videoNode) return 
        
        const self = this
        this.rawPlayer = videojs(this.videoNode, { fill: true })
        this.rawPlayer.volume(this.volume)

        this.setPlayState(PlayState.INIT)

        this.rawPlayer.on('playing', () => {
            self.setPlayState(PlayState.PLAYING)
        })

        this.rawPlayer.on('pause', () => {
            self.setPlayState(PlayState.PAUSE)
        })

        this.rawPlayer.on('ended', () => {
            self.setPlayState(PlayState.END)
        })

        this.rawPlayer.on('error', () => {
            self.setPlayState(PlayState.PLAY_ERROR)
        })

        this.extendsPlayerComponents()
    }

    extendsPlayerComponents() {
        if(!this.rawPlayer) return 
        
        const self = this
        this.rawPlayer.getChild('ControlBar').addChild('button', {
                clickHandler: (event) => {
                    self.setPlayAction(PlayAction.NEXT, event)
                },
                controlText: 'Next',
                className: 'play-next-btn'
            }, 1)
    }

    setVideoNode(node) {
        this.videoNode = node
        this.initRawPlayer()
    }

    //播放
    play() {
        if (!this.videoNode) return
        if (!this.video || !this.video.url) return this.setPlayState(PlayState.PLAY_ERROR)
        
        const { url: src } = this.video
        if(this.videoChanged) this.rawPlayer.src(src)
        this.rawPlayer.play()
        this.videoChanged = false
    }

    playing() {
        return this.playState == PlayState.PLAYING
    }

    //暂停
    pause() {
        if (!this.videoNode) return
        if (!this.playing()) return

        this.rawPlayer.pause()
        this.setPlayState(PlayState.PAUSE)
    }

    togglePlay() {
        this.playing() ? this.pause() : this.play()
    }

    setPlayState(state) {
        this.playState = state
        const { video } = this
        this.notify('video-state', { state, video })
    }

    setPlayAction(action, event) {
        const { video } = this
        this.notify('video-action', { action, event, video })
    }

    setVideo(video) {
        if(this.rawPlayer) this.rawPlayer.reset()
        this.video = video
        this.videoChanged = true
        this.playState = PlayState.NONE
    }

    playVideo(video) {
        this.setVideo(video)
        this.play()
    }

    volume(value) {
        this.volume = value
        if(this.rawPlayer) this.rawPlayer.volume(value)
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
