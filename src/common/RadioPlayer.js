import EventBus from '../common/EventBus';
import Hls from 'hls.js';

let gRadioHolder = null
let lastPlayTime = null
let singleton = null
let audioSource = null, analyser = null, eqFilters = null
const EQ = [
    {
        frequency: 31,
        type: 'lowshelf'
    },
    {
        frequency: 62,
        type: 'peaking'
    },
    {
        frequency: 125,
        type: 'peaking'
    },
    {
        frequency: 250,
        type: 'peaking'
    },
    {
        frequency: 500,
        type: 'peaking'
    },
    {
        frequency: 1000,
        type: 'peaking'
    },
    {
        frequency: 2000,
        type: 'peaking'
    },
    {
        frequency: 4000,
        type: 'peaking'
    },
    {
        frequency: 8000,
        type: 'peaking'
    },
    {
        frequency: 16000,
        type: 'highshelf'
    }
]

export class RadioPlayer {

    constructor(channel) {
        this.channel = channel
        this.hls = new Hls()
        this.playing = false
        this.channelChanged = false
        this.audioCtx = new AudioContext()
    }

    static get() {
        if(!singleton) singleton = new RadioPlayer()
        return singleton
    }

    /* 初始化并配置播放器 */
    static initAndSetup() {
        const player = RadioPlayer.get()
        return player.on('radio-init', radioHolder => (gRadioHolder = radioHolder)) 
            .on('radio-channelChange', channel => player.setChannel(channel))
            .on('radio-play', channel => player.playChannel(channel))
            .on('radio-togglePlay', () => player.togglePlay())
            .on('volume-set', volume => player.volume(volume))
            .on('radio-stop', () => player.setChannel(null))
            .on('queue-empty', () => player.setChannel(null))
            .on('track-play', () => player.setChannel(null))
            .on('track-restoreInit', channel => player.setChannel(channel))
            .on('track-updateEQ', (values) => player.updateEQ(values))
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
            lastPlayTime = Date.now()
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
    }

    playChannel(channel) {
        this.setChannel(channel)
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
        const nowTime = Date.now()
        const currentTime = (nowTime - lastPlayTime) || 0
        const currentSecs = currentTime / 1000
        EventBus.emit('track-pos', currentSecs)
        this.analyseSound()
        requestAnimationFrame(this.__step.bind(this))
    }

    on(event, handler) {
        EventBus.on(event, handler)
        return this
    }

    analyseSound () {
        if(!gRadioHolder) return 
        if(!analyser) {
            const audioCtx = this.audioCtx
            analyser = audioCtx.createAnalyser()
            //analyser.fftSize = 256
            analyser.fftSize = 512
            //gRadioHolder.crossOrigin = 'anonymous'
            var distortion = audioCtx.createWaveShaper()
            var gainNode = audioCtx.createGain()
            var biquadFilters = this.createBiquadFilters(audioCtx)
            eqFilters = biquadFilters
            if(!audioSource) audioSource = audioCtx.createMediaElementSource(gRadioHolder)
            audioSource.connect(analyser)
            analyser.connect(distortion)
            this.connectBiquadFilters(biquadFilters, distortion, gainNode)
            gainNode.connect(audioCtx.destination)
        }
        const freqData = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(freqData)
        EventBus.emit('track-freqUnit8Data', freqData)
    }

    createBiquadFilters(audioCtx) {
        if(!audioCtx) return []
        let filters = EQ.map(function(band) {
            let filter = audioCtx.createBiquadFilter()
            filter.type = band.type
            filter.gain.value = 0 // -40 ~ 40
            filter.Q.value = 1
            filter.frequency.value = band.frequency
            return filter
        })
        return filters
    }

    connectBiquadFilters(filters, currentNode, nextNode) {
        if(!filters || filters.length < 0) return
        filters.reduce(function (prev, curr) {
            prev.connect(curr)
            return curr
        }, currentNode).connect(nextNode)
    }

    updateEQ(values) {
        if(!eqFilters || eqFilters.length < 1) return
        eqFilters.forEach((filter, index) => {
            filter.gain.value = values[index]
        })
    }
    
}
