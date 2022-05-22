import EventBus from '../common/EventBus';
import Hls from 'hls.js';

let singleton = null
let gRadioHolder = null
let lastPlayTime = null

export class RadioPlayer {

    constructor(channel) {
        this.channel = channel
        this.hls = new Hls()
        this.playing = false
        this.channelChanged = false
    }

    static get() {
        if(!singleton) singleton = new RadioPlayer()
        return singleton
    }

    /* 初始化并配置播放器 */
    static initAndSetup() {
        const player = RadioPlayer.get()
        return player.on('radio-init', radioHolder => (gRadioHolder = radioHolder))
            .on('radio-play', channel => player.playChannel(channel))
            .on('radio-togglePlay', () => player.togglePlay())
            .on('volume-set', volume => player.volume(volume))
            .on('radio-stop', () => player.setChannel(null))
    }

    //播放
    play() {
        if(!Hls.isSupported()) return 
        if(!gRadioHolder) return 
        if(!this.channel) return
        
        //this.hls.loadSource('http://ngcdn001.cnr.cn/live/zgzs/index.m3u8')
        this.hls.loadSource(this.channel.url)
        this.hls.attachMedia(gRadioHolder)
        
        const self = this
        this.hls.on(Hls.Events.MANIFEST_PARSED, function() {
            gRadioHolder.play()
            self.setState(true)
            self.channelChanged = false
            requestAnimationFrame(self.__step.bind(self))
        })
    }

    //暂停
    pause() {
        if(!Hls.isSupported()) return 
        if(!gRadioHolder) return 
        if(!this.playing) return 
        this.hls.detachMedia()
        this.setState(false)
    }

    togglePlay() {
        if(this.playing) {
            this.pause()
        } else {
            this.play()
        }
    }

    setState(state) {
        this.playing = state
        EventBus.emit('radio-state', state)
    }

    setChannel(channel) {
        this.pause()
        this.channel = channel
        this.channelChanged = true
        EventBus.emit('radio-channelChanged', channel)
    }

    playChannel(channel) {
        this.setChannel(channel)
        lastPlayTime = Date.now()
        this.play()
    }

    volume(value) {
        if(!Hls.isSupported()) return 
        if(!gRadioHolder) return 
        gRadioHolder.volume = value
    }

    __step() {
        if(!this.channel) return 
        if(!this.playing) return
        const currentTime = (Date.now() - lastPlayTime) || 0
        const currentSecs = currentTime / 1000
        EventBus.emit('track-pos', currentSecs)
        requestAnimationFrame(this.__step.bind(this))
    }

    on(event, handler) {
        EventBus.on(event, handler)
        return this
    }

}
