import { PlayState, PlayAction } from './Constants';
import { onEvents, emitEvents } from './EventBusWrapper';


let singleton = null

class VideoPlayer {

    constructor(video) {
        this.video = video
        this.videoNode = null
        this.delegatePlayer = null
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

    initDelegatePlayer() {
        if(!this.videoNode) return 
        
        this.delegatePlayer = videojs(this.videoNode, { 
            fill: true, 
            playbackRates: [0.5, 1, 1.5, 2], 
            userActions: {
                click: false
            }
        })
        this.delegatePlayer.volume(this.volume)
        this.setPlayState(PlayState.INIT)

        const self = this
        this.delegatePlayer.on('playing', () => self.setPlayState(PlayState.PLAYING))
        this.delegatePlayer.on('pause', () => self.setPlayState(PlayState.PAUSE))
        this.delegatePlayer.on('ended', () => self.setPlayState(PlayState.END))
        this.delegatePlayer.on('error', () => self.setPlayState(PlayState.PLAY_ERROR))
        this.delegatePlayer.on('ratechange', (event) => self.setPlayAction(PlayAction.CHANGE_RATE, event, self.delegatePlayer.playbackRate()))

        this.customControlBar()
    }

    customControlBar() {
        if(!this.delegatePlayer) return 
        
        const self = this
        this.delegatePlayer.getChild('ControlBar')
            .addChild('button', {
                clickHandler: (event) => {
                    self.setPlayAction(PlayAction.NEXT, event)
                },
                controlText: 'Next',
                className: 'c-vjs-play-next-btn'
            }, 1)

    }

    setVideoNode(node) {
        this.videoNode = node
        this.initDelegatePlayer()
    }

    //播放
    play() {
        if (!this.videoNode) return
        if (!this.video || !this.video.url) return this.setPlayState(PlayState.PLAY_ERROR)
        
        const { url: src } = this.video
        if(this.videoChanged) this.delegatePlayer.src(src)
        
        this.delegatePlayer.play()
        this.videoChanged = false
    }

    playing() {
        return this.playState == PlayState.PLAYING
    }

    //暂停
    pause() {
        if (!this.videoNode) return
        if (!this.playing()) return

        this.delegatePlayer.pause()
    }

    togglePlay() {
        this.playing() ? this.pause() : this.play()
    }

    setPlayState(state, isSilent) {
        this.playState = state
        const { video } = this
        if(!isSilent) this.notify('video-state', { state, video })
    }

    setPlayAction(action, event, data) {
        const { video } = this
        this.notify('video-action', { action, event, video, data })
    }

    setVideo(video) {
        if(this.delegatePlayer) this.delegatePlayer.reset()
        
        this.video = video
        this.videoChanged = true
        this.setPlayState(PlayState.NONE, true)
    }

    playVideo(video) {
        this.setVideo(video)
        this.play()
    }

    volume(value) {
        this.volume = value
        if(this.delegatePlayer) this.delegatePlayer.volume(value)
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
