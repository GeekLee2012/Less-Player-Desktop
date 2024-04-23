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

export class WebAudioApi {
    constructor(audioCtx, audioNode) {
        this.audioCtx = audioCtx
        this.audioNode = audioNode
        this.audioSource = null
    }

    static create(audioCtx, audioNode) {
        return new WebAudioApi(audioCtx, audioNode).setup()
    }

    setup() {
        const audioCtx = this.audioCtx
        const audioNode = this.audioNode
        this.splitterNode = audioCtx.createChannelSplitter(2)
        this.mergerNode = audioCtx.createChannelMerger(2)

        this.leftChannelAnalyser = audioCtx.createAnalyser()
        this.rightChannelAnalyser = audioCtx.createAnalyser()
        this.analyser = audioCtx.createAnalyser()

        this.leftChannelAnalyser.fftSize = 512
        this.rightChannelAnalyser.fftSize = 512
        this.analyser.fftSize = 512

        this.distortion = audioCtx.createWaveShaper()
        this.stereoPanNode = audioCtx.createStereoPanner()
        this.gainNode = audioCtx.createGain()
        this.biquadFilters = this.createBiquadFilters()
        if (!this.audioSource) this.audioSource = audioCtx.createMediaElementSource(audioNode)
        this.audioSource.connect(this.splitterNode)
        this.splitterNode.connect(this.leftChannelAnalyser, 0)
        this.splitterNode.connect(this.rightChannelAnalyser, 1)
        this.leftChannelAnalyser.connect(this.mergerNode, 0, 0)
        this.rightChannelAnalyser.connect(this.mergerNode, 0, 1)
        this.mergerNode.connect(this.analyser)
        this.analyser.connect(this.distortion)
        this.connectBiquadFilters(this.biquadFilters, this.distortion, this.stereoPanNode)
        this.stereoPanNode.connect(this.gainNode)
        this.gainNode.connect(audioCtx.destination)
        //this.audioSource.connect(audioCtx.destination)
        return this
    }

    createBiquadFilters() {
        const audioCtx = this.audioCtx
        if (!audioCtx) return []
        let filters = EQ.map(band => {
            let filter = audioCtx.createBiquadFilter()
            filter.type = band.type
            filter.gain.value = 0 // -40 ~ 40
            filter.Q.value = 1
            filter.frequency.value = band.frequency
            return filter
        })
        return filters
    }

    // Node Chain: currentNode -> filters -> nextNode
    connectBiquadFilters(filters, currentNode, nextNode) {
        if (!filters || filters.length < 0) return
        filters.reduce((prev, curr) => {
            prev.connect(curr)
            return curr
        }, currentNode).connect(nextNode)
    }

    updateEQ(values) {
        const eqFilters = this.biquadFilters
        if (!eqFilters || eqFilters.length < 1) return
        eqFilters.forEach((filter, index) => {
            filter.gain.value = values[index]
        })
    }

    //混响 audioNodes -> reverb -> destination
    connectReverb() {
        this.gainNode.disconnect()
        this.gainNode.connect(this.convolver)
        this.convolver.connect(this.audioCtx.destination)
    }

    disconnectReverb() {
        this.gainNode.disconnect()
        this.gainNode.connect(this.audioCtx.destination)
    }

    //source格式： xxx.wav
    async updateIR(source) {
        if (!source) {
            this.disconnectReverb()
            return
        }
        const audioCtx = this.audioCtx
        if (!this.convolver) this.convolver = audioCtx.createConvolver()
        this.connectReverb()

        //TODO
        //从文件加载脉冲反应(Impulse Response)
        let response = await fetch(`impulse/${source}`)
        let buffer = await response.arrayBuffer()
        this.convolver.buffer = await audioCtx.decodeAudioData(buffer)

        return this.convolver
    }

    updateStereoPan(value) {
        value = value || 0.0
        value = Math.max(-1.0, value)
        value = Math.min(1.0, value)
        
        this.stereoPanNode.pan.setValueAtTime(value, this.audioCtx.currentTime)
    }

    updateVolumeGain(value) {
        value = Number(value)
        value = Math.max(0, value)
        value = Math.min(3.0, value)
        
        this.gainNode.gain.setValueAtTime(value, this.audioCtx.currentTime)
    }
}