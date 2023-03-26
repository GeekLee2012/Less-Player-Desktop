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
        this.analyser = audioCtx.createAnalyser()
        this.analyser.fftSize = 512
        this.distortion = audioCtx.createWaveShaper()
        this.gainNode = audioCtx.createGain()
        this.biquadFilters = this.createBiquadFilters()
        if (!this.audioSource) this.audioSource = audioCtx.createMediaElementSource(audioNode)
        this.audioSource.connect(this.analyser)
        this.analyser.connect(this.distortion)
        this.connectBiquadFilters(this.biquadFilters, this.distortion, this.gainNode)
        this.gainNode.connect(audioCtx.destination)
        return this
    }

    getAnalyser() {
        return this.analyser
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
        if (!this.convolver) {
            this.convolver = audioCtx.createConvolver()
        }
        this.connectReverb()

        //TODO
        //从文件加载脉冲反应(Impulse Response)
        let response = await fetch(`impulse/${source}`)
        let buffer = await response.arrayBuffer()
        this.convolver.buffer = await audioCtx.decodeAudioData(buffer)

        return this.convolver
    }

}