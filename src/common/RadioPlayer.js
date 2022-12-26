import EventBus from '../common/EventBus';
import Hls from 'hls.js';
import { WebAudioApi } from './WebAudioApi';

let audioNode = null, lastPlayTime = null, singleton = null

export class RadioPlayer {
    constructor(channel) {
        this.channel = channel
        this.hls = new Hls()
        this.playing = false
        this.channelChanged = false
        this.webAudioApi = null
    }

    static get() {
        if (!singleton) singleton = new RadioPlayer()
        return singleton
    }

    /* 初始化并配置播放器 */
    static initAndSetup() {
        const player = RadioPlayer.get()
        return player.on('radio-init', node => player.createWebAudioApi(node))
            .on('radio-channelChange', channel => player.setChannel(channel))
            .on('radio-play', channel => player.playChannel(channel))
            .on('radio-togglePlay', () => player.togglePlay())
            .on('volume-set', volume => player.volume(volume))
            .on('radio-stop', () => player.setChannel(null))
            .on('playbackQueue-empty', () => player.setChannel(null))
            .on('track-play', () => player.setChannel(null))
            .on('track-restoreInit', channel => player.setChannel(channel))
            .on('track-updateEQ', (values) => player.updateEQ(values))
    }

    //播放
    play() {
        if (!Hls.isSupported()) return
        if (!audioNode) return
        if (!this.channel) return

        //this.hls.loadSource('http://ngcdn001.cnr.cn/live/zgzs/index.m3u8')
        this.hls.loadSource(this.channel.url)
        this.hls.attachMedia(audioNode)

        const self = this
        this.hls.on(Hls.Events.MANIFEST_PARSED, function () {
            audioNode.play()
            self.setState(true)
            self.channelChanged = false
            lastPlayTime = Date.now()
            requestAnimationFrame(self.__step.bind(self))
        })
    }

    //暂停
    pause() {
        if (!Hls.isSupported()) return
        if (!audioNode) return
        if (!this.playing) return
        this.hls.detachMedia()
        this.setState(false)
    }

    togglePlay() {
        if (this.playing) {
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
        this.hls.stopLoad()
        this.channel = channel
        this.channelChanged = true
    }

    playChannel(channel) {
        this.setChannel(channel)
        this.play()
    }

    volume(value) {
        if (!Hls.isSupported()) return
        if (!audioNode) return
        audioNode.volume = value
    }

    __step() {
        if (!this.channel) return
        if (!this.playing) return
        const nowTime = Date.now()
        const currentTime = (nowTime - lastPlayTime) || 0
        const currentSecs = currentTime / 1000
        EventBus.emit('track-pos', currentSecs)
        this.resolveSound()
        requestAnimationFrame(this.__step.bind(this))
    }

    on(event, handler) {
        EventBus.on(event, handler)
        return this
    }

    createWebAudioApi(node) {
        if (!node) return
        audioNode = node
        if (this.webAudioApi) return
        this.webAudioApi = WebAudioApi.create(new AudioContext(), audioNode)
    }

    resolveSound() {
        if (!this.webAudioApi) return

        const analyser = this.webAudioApi.getAnalyser()
        const freqData = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(freqData)
        EventBus.emit('track-freqUnit8Data', freqData)
    }

    updateEQ(values) {
        if (this.webAudioApi) this.webAudioApi.updateEQ(values)
    }

}
