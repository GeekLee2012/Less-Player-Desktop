import Hls from 'hls.js';
import { createWebAudioApi } from './WebAudioApi';
import { isBlank } from './Utils';
import { PlayState } from './Constants';
import { emitEvents, onEvents } from './EventBusWrapper';



let audioNode = null, singleton = null

class RadioPlayer {
    constructor(channel) {
        this.channel = channel
        this.hls = this.initHls()
        this.playState = PlayState.NONE
        this.channelChanged = false
        this.webAudioApi = null
        this.pendingSoundEffect = null
        this.pendingStereoPan = null
        this.pendingVolumeGain = null
        this.animationFrameCnt = 0 //动画帧数计数器，控制事件触发频率，降低CPU占用
        this.stateRefreshFrequency = 60 //歌曲进度更新频度
        this.spectrumRefreshFrequency = 3 //歌曲频谱更新频度
        this.lastPlayTime = null
    }

    initHls() {
        const hls = new Hls()
        const self = this
        /*
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            self.hls.config.xhrSetup = (xhr, url) => {
                //xhr.setRequestHeader()
            }
        })
        */
        hls.on(Hls.Events.MANIFEST_LOADING, () => {
            self.setState(PlayState.LOADING)
        })
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            audioNode.play()
            self.setState(PlayState.PLAYING)
            
            if(self.channelChanged) self.lastPlayTime = Date.now()
            self.channelChanged = false
            
            self.animationFrameCnt = 0
            requestAnimationFrame(self._step.bind(self))
        })
        hls.on(Hls.Events.MEDIA_DETACHED, () => {
            self.setState(PlayState.PAUSE)
        })
        hls.on(Hls.Events.ERROR, () => {
            self.setState(PlayState.PLAY_ERROR)
        })
        return hls
    }

    static create() {
        if(!singleton) {
            singleton = new RadioPlayer()
                .initWebAudio()
                .on({
                    'radio-channelChange': value => singleton.setChannel(value),
                    'radio-play': value => singleton.playChannel(value),
                    'radio-togglePlay': () => singleton.togglePlay(),
                    'volume-set': value => singleton.volume(value),
                    'radio-stop': () => singleton.setChannel(null),
                    'playbackQueue-empty': () => singleton.setChannel(null),
                    'track-changed': () => singleton.setChannel(null),
                    'track-play': () => singleton.setChannel(null),
                    'track-restore': value => singleton.setChannel(value),
                    'track-setupSoundEffect': value => singleton.setupSoundEffect(value),
                    'track-updateStereoPan': value => singleton.updateStereoPan(value),
                    'track-updateVolumeGain': value => singleton.updateVolumeGain(value),
                    'track-stateRefreshFrequency': value => singleton.stateRefreshFrequency = value,
                    'track-spectrumRefreshFrequency': value => singleton.spectrumRefreshFrequency = value,
                })
        }
        return singleton
    }

    //播放
    play() {
        //非可处理异常，直接返回
        if (!Hls.isSupported() || !audioNode) return
        //数据异常，设置错误状态，让程序处理
        if (!this.channel || isBlank(this.channel.url)) {
            return this.setState(PlayState.PLAY_ERROR)
        }

        this.hls.loadSource(this.channel.url)
        this.hls.attachMedia(audioNode)
    }

    playing() {
        return this.playState == PlayState.PLAYING
    }

    //暂停
    pause() {
        if (!Hls.isSupported() || !audioNode) return
        if (!this.playing()) return

        this.hls.detachMedia()
    }

    togglePlay() {
        this.playing() ? this.pause() : this.play()
    }

    setState(state) {
        this.playState = state
        const { channel: track } = this
        return this.notify('radio-state', { state, track, currentTime: 0, radio: true })
    }

    setChannel(channel) {
        this.pause()
        this.hls.stopLoad()
        this.channel = channel
        this.channelChanged = true
        if(!channel) this.lastPlayTime = null
        return this
    }

    playChannel(channel) {
        this.setChannel(channel).play()
    }

    volume(value) {
        if (!Hls.isSupported() || !audioNode) return
        audioNode.volume = value
    }

    _step() {
        if (!this.playing()) return 

        const nowTime = Date.now()
        const currentTime = (nowTime - this.lastPlayTime) || 0
        const currentSeconds = currentTime / 1000
        if (this.isStateRefreshEnabled()) {
            this.notify('track-pos', { currentTime: currentSeconds, duration: 0 })
        }
        this._resolveSound()
        this._countAnimationFrame()
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

    initWebAudio() {
        if (!audioNode) {
            //以这种方式创建的Element元素
            //好处，在浏览器开发者工具源码里看不到，而坏处也是源码里看不到......
            audioNode = document.createElement('audio')
            audioNode.setAttribute('crossOrigin', 'anonymous')
            audioNode.classList.add('audio-node')
            audioNode.classList.add('hidden')
            //默认优先查找id=app的元素作为父节点
            const parentNode = document.body.querySelector('#app') || document.body
            parentNode.appendChild(audioNode)
        }
        this._initWebAudioApi(audioNode)
        return this
    }

    _initWebAudioApi(node) {
        if (!node) return 
        audioNode = node
        if (this.webAudioApi) return
        this.webAudioApi = createWebAudioApi(new AudioContext(), audioNode)
    }

    _resolveSound() {
        if (!this.webAudioApi) return
        this._resolvePendingSoundEffect()
        if (!this.isSpectrumRefreshEnabled()) return
        
        const { leftChannelAnalyser, rightChannelAnalyser, analyser, audioCtx } = this.webAudioApi
        if (!analyser || !leftChannelAnalyser || !rightChannelAnalyser) return this
        
        const { frequencyBinCount: leftFreqBinCount } = leftChannelAnalyser
        const { frequencyBinCount: rightFreqBinCount } = rightChannelAnalyser
        const { frequencyBinCount: freqBinCount } = analyser
        
        const leftFreqData = new Uint8Array(leftFreqBinCount)
        const rightFreqData = new Uint8Array(rightFreqBinCount)
        const freqData = new Uint8Array(freqBinCount)
        leftChannelAnalyser.getByteFrequencyData(leftFreqData)
        rightChannelAnalyser.getByteFrequencyData(rightFreqData)
        analyser.getByteFrequencyData(freqData)

        const { sampleRate } = audioCtx
        this.notify('track-spectrumData', { 
                leftFreqData, leftFreqBinCount, 
                rightFreqData, rightFreqBinCount, 
                freqData, freqBinCount, sampleRate, 
                analyser, leftChannelAnalyser, rightChannelAnalyser 
            })
    }

    updateEQ(values) {
        if (this.webAudioApi) {
            this.webAudioApi.updateEQ(values)
            this.pendingSoundEffect = null
        } else {
            this.pendingSoundEffect = this.pendingSoundEffect || {}
            Object.assign(this.pendingSoundEffect, { eqValues: values })
        }
    }

    updateIR(source) {
        if (this.webAudioApi) {
            this.webAudioApi.updateIR(source)
            this.pendingSoundEffect = null
        } else {
            this.pendingSoundEffect = this.pendingSoundEffect || {}
            Object.assign(this.pendingSoundEffect, { irSource: source })
        }
    }

    updateStereoPan(value) {
        if (this.webAudioApi) {
            this.webAudioApi.updateStereoPan(value)
            this.pendingStereoPan = null
        } else {
            this.pendingStereoPan = value
        }
    }

    updateVolumeGain(value) {
        if (this.webAudioApi) {
            this.webAudioApi.updateVolumeGain(value)
            this.pendingVolumeGain = null
        } else {
            this.pendingVolumeGain = value
        }
    }

    setupSoundEffect(options) {
        const { eqValues, irSource, stereoPan, volumeGain } = options
        this.updateEQ(eqValues)
        this.updateIR(irSource)
        this.updateStereoPan(stereoPan)
        this.updateVolumeGain(volumeGain)
    }

    _resolvePendingSoundEffect() {
        if (this.pendingSoundEffect) {
            const { eqValues, irSource } = this.pendingSoundEffect
            if(irSource) this.updateIR(irSource)
            if(eqValues) this.updateEQ(eqValues)
        }
        if(typeof this.pendingStereoPan == 'number') {
            this.updateStereoPan(this.pendingStereoPan)
        }
    }

    _countAnimationFrame() {
        const max = this.stateRefreshFrequency || 1024
        this.animationFrameCnt = (this.animationFrameCnt + 1) % max
    }

    isStateRefreshEnabled() {
        return this.animationFrameCnt % this.stateRefreshFrequency == 0
    }

    isSpectrumRefreshEnabled() {
        return this.animationFrameCnt % this.spectrumRefreshFrequency == 0
    }

}

export function createRadioPlayer() {
    return RadioPlayer.create()
}