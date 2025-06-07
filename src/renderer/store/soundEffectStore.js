import { defineStore } from "pinia";
import { onEvents, emitEvents } from "../../common/EventBusWrapper";
import { randomTextWithinAlphabetNums, toLowerCaseTrimString, toTrimString, } from "../../common/Utils";



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

const PRESET_EQUALIZERS = [
    {
        id: 'none',
        name: '关闭',
        values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }, {
        id: 'popular',
        name: '流行',
        values: [4, 2, 0, -3, -6, -6, -3, 0, 1, 3]
    }, {
        id: 'dance',
        name: '舞曲',
        values: [7, 6, 3, 0, 0, -4, -6, -6, 0, 0]
    }, {
        id: 'blues',
        name: '蓝调',
        values: [3, 6, 8, 3, -2, 0, 4, 7, 9, 10]
    }, {
        id: 'classic',
        name: '古典',
        values: [0, 0, 0, 0, 0, 0, -6, -6, -6, -8]
    }, {
        id: 'jazz',
        name: '爵士',
        values: [0, 0, 1, 4, 4, 4, 0, 1, 3, 3]
    }, {
        id: 'slowsong',
        name: '慢歌',
        values: [5, 4, 2, 0, -2, 0, 3, 6, 7, 8]
    }, {
        id: 'electronic',
        name: '电子乐',
        values: [6, 5, 0, -5, -4, 0, 6, 8, 8, 7]
    }, {
        id: 'rocknroll',
        name: '摇滚',
        values: [7, 4, -4, 7, -2, 1, 5, 7, 9, 9]
    }, {
        id: 'country',
        name: '乡村',
        values: [5, 6, 2, -5, 1, 1, -5, 3, 8, 5]
    }, {
        id: 'vocals',
        name: '人声',
        values: [-2, -1, -1, 0, 3, 4, 3, 0, 0, 1]
    }/*, {
        id: 'custom',
        name: '自定义',
        values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }*/]

//const MIN_GAIN = -40 / 4, MAX_GAIN = 40 / 4
const MIN_GAIN = -12, MAX_GAIN = 12

//预设混响
const PRESET_IMPULSE_RESPONSES = [
    {
        name: "关闭",
        source: null,
        enabled: true
    }, {
        name: "教室",
        source: "Classroom.wav",
        enabled: true
    },
    {
        name: "会议厅",
        source: "Convocation Mall.wav",
        enabled: true
    },
    {
        name: "艺术博物馆",
        source: "Cranbrook Art Museum.wav",
        enabled: true
    },
    {
        name: "深井（无效）",
        source: "Deep Well.wav",
        enabled: false
    },
    {
        name: "海滩",
        source: "Divorce Beach.wav",
        enabled: true
    },
    {
        name: "回声桥",
        source: "Echo Bridge.wav",
        enabled: true
    },
    {
        name: "起居室 - 空荡",
        source: "Empty Livingroom.wav",
        enabled: true
    },
    {
        name: "无尽隧道",
        source: "Endless Tunnel.wav",
        enabled: true
    },
    {
        name: "走廊",
        source: "Gallery.wav",
        enabled: true
    },
    {
        name: "大厅",
        source: "Hall.wav",
        enabled: true
    },
    {
        name: "车内",
        source: "Inside Car.wav",
        enabled: true
    },
    {
        name: "浴室 - 闭门",
        source: "Inside Shower Door Closed.wav",
        enabled: true
    },
    {
        name: "浴室 - 宽敞",
        source: "Large Bathroom.wav",
        enabled: true
    },
    {
        name: "音乐大厅 - 大型（无效）",
        source: "Large Concert Hall.wav",
        enabled: false
    },
    {
        name: "演讲礼堂",
        source: "Lecture Hall.wav",
        enabled: true
    },
    {
        name: "起居室",
        source: "Living Room.wav",
        enabled: true
    },
    {
        name: "更衣室",
        source: "Locker Room.wav",
        enabled: true
    },
    {
        name: "洞窟 - 巨大",
        source: "Massive Cavern.wav",
        enabled: true
    },
    {
        name: "洞穴 - 中型",
        source: "Medium Sized Cave.wav",
        enabled: true
    },
    {
        name: "房间 - 中型（无效）",
        source: "Mid-Sized Room.wav",
        enabled: false
    },
    {
        name: "狭窄螺旋楼梯",
        source: "Narrow Spiral Staircase.wav",
        enabled: true
    },
    {
        name: "露天体育场（无效）",
        source: "Open Air Stadium.wav",
        enabled: false
    },
    {
        name: "反向隧道",
        source: "Reverse Tunnel.wav",
        enabled: true
    },
    {
        name: "亲水公园",
        source: "Waterplace Park.wav",
        enabled: true
    },
    {
        name: "胡同巷子",
        source: "WoodruffLane.wav",
        enabled: true
    },
]

export const useSoundEffectStore = defineStore('soundEffect', {
    state: () => ({
        isUseEffect: false,
        currentEffectType: 0,   // 0 => 均衡器, 1 => 混响
        //均衡器 Equalizer
        currentEQIndex: 0,
        //customEQValues: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        customEQs: [{
            id: 'custom',
            name: '自定义',
            values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        }],
        //混响 Impulse Response
        currentIRIndex: 0,
        //声道（立体声）
        stereoPanValue: 0,  //范围： -1.0 ~ 1.0，默认为0
        //音量
        volumeGain: 1.0,    //范围：0.0 ~ 3.0，默认为1.0
    }),
    getters: {
        currentEffectName() {
            if (!this.isUseEffect) return '关闭'
            return this.currentEffectType == 1 ? this.currentIR.name : this.currentEQ.name
        },
        //均衡器
        currentEQ() {
            return this.availableEQs[this.currentEQIndex] || {}
        },
        currentEQValues() {
           return this.currentEQ.values || []
        },
        currentEQId() {
            return this.currentEQ.id || ''
        },
        currentEQValue() {
            return (index) => this.currentEQValues[index]
        },
        currentEQValueToPercent() {
            return (index) => {
                const value = this.currentEQValue(index)
                const percent = (value - MIN_GAIN) / (MAX_GAIN - MIN_GAIN)
                return percent
            }
        },
        //混响
        currentIR() {
            return PRESET_IMPULSE_RESPONSES[this.currentIRIndex]
        },
        currentIRSource() {
            return this.currentIR.source
        },
        currentStereoPanValueToPercent() {
            return (Number(this.stereoPanValue) + 1.0) / 2.0 
        },
        currentVolumeGainToPercent() {
            return Number(this.volumeGain) / 3.0  
        },
        isUseCustomEQ() {
            return (this.currentEffectType == 0) && this.isCustomEQ(this.currentEQ)
        },
        availableEQs() {
            const list = []
            list.push(...PRESET_EQUALIZERS)
            list.push(...this.customEQs)
            return list
        },
    },
    actions: {
        setUseEffect(type, index, ignore) {
            type = type || 0
            index = index || 0
            this.currentEffectType = type
            if (!ignore) this.isUseEffect = (index > 0)
            if (this.currentEffectType === 1) { //混响
                this.currentEQIndex = 0
                this.currentIRIndex = index
            } else { //均衡器
                this.currentEQIndex = index
                this.currentIRIndex = 0
            }
            this.setupSoundEffect()
        },
        //TODO 暂时简单处理：关闭时，相当于快捷关闭; 开启时，并不开启任何音效
        toggleSoundEffect() {
            this.isUseEffect = !this.isUseEffect
            this.setUseEffect(1, 0, true)
            this.setUseEffect(0, 0, true)
        },
        //均衡器
        getPresetEQs() {
            return PRESET_EQUALIZERS
        },
        getPresetEQ(index) {
            return this.getPresetEQs()[index]
            //return this.availableEQs[index]
        },
        getEQNames() {
            return EQ
        },
        _formatEQValue(value) {
            value = value || 0
            const flValue = parseFloat(value).toFixed(1)
            const intValue = parseInt(value)
            return (intValue == flValue) ? intValue : flValue
        },
        updateCustomEQValue(index, value) {
            const minIndex = this.getPresetEQs().length
            if(this.currentEQIndex < minIndex) return 
            this.currentEQValues[index] = this._formatEQValue(value)
        },
        percentToEQValue(percent) {
            const ZERO_PERCENT = 0.5
            let value = 0
            if (percent < ZERO_PERCENT) {
                value = MIN_GAIN * (ZERO_PERCENT - percent) / ZERO_PERCENT
            } else if (percent > ZERO_PERCENT) {
                value = MAX_GAIN * (percent - ZERO_PERCENT) / ZERO_PERCENT
            }
            return this._formatEQValue(value)
        },
        isCustomEQ(item) {
            const { id } = item || {}
            return toLowerCaseTrimString(id).startsWith('custom')
        },
        isPresetCustomEQ(item) {
            const { id } = item || {}
            return toLowerCaseTrimString(id) == 'custom'
        },
        isRemovableCustomEQ(item) {
            if(this.isPresetCustomEQ(item)) return false
            return this.isCustomEQ(item) 
        },
        saveCustomEQ(id, name, values) {
            const index = this.customEQs.findIndex(item => (item.id == id))
            const _name = toTrimString(name)
            const _values = [...values]
            if(index > 0) {
                Object.assign(this.customEQs[index], { name: _name })
            } else {
                const randomNum = randomTextWithinAlphabetNums(9)
                const _id = `custom-${randomNum}`
                this.customEQs.push({ id: _id, name: _name, values: _values })
                this.setUseEffect(0, this.availableEQs.length - 1)
            }
        },
        removeCustomEQ(item) {
            const { id } = item || {}
            if(!id || !this.isCustomEQ(item)) return 
            const index = this.customEQs.findIndex(eq => (eq.id == id))
            const currentIndex = (this.currentEQIndex - this.getPresetEQs().length)
            if(index > 0) {
                this.customEQs.splice(index, 1)
                if(index == currentIndex) this.setUseEffect(0, 0)
            }
        },
        resetCustomEQ() {
            const index = (this.currentEQIndex - this.getPresetEQs().length)
            if(index >= 0) {
                Object.assign(this.customEQs[index], {
                    values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                })
            }
            this.setupSoundEffect()
        },
        //混响
        getPresetIRs() {
            return PRESET_IMPULSE_RESPONSES
        },
        syncCurrentEQToCustom(fromIndex) {
            if (!this.isUseEffect || !this.isCustomEQ(this.currentEQ)) return false
            const { values } = this.getPresetEQ(fromIndex) || { values: [] }
            values.forEach((value, index) => {
                this.updateCustomEQValue(index, value)
            })
            return values.length > 0
        },
        setStereoPanValue(value) {
            value = Number(value || 0.0)
            value = Math.max(-1.0, value)
            value = Math.min(1.0, value)
            this.stereoPanValue = value
            emitEvents('track-updateStereoPan', this.stereoPanValue)
        },
        setVolumeGain(value) {
            value = Number(value)
            value = Math.max(0, value)
            value = Math.min(3.0, value)
            if(Math.abs(1 - value) <= 0.01) value = 1.0
            this.volumeGain = value
            emitEvents('track-updateVolumeGain', this.volumeGain)
        },
        setupSoundEffect() {
            emitEvents('track-setupSoundEffect', {
                eqValues: this.currentEQValues,
                irSource: this.currentIRSource,
                type: this.currentEffectType,
                stereoPan: this.stereoPanValue,
                volumeGain: this.volumeGain,
            })
        }
    },
    persist: {
        enabled: true,
        strategies: [{
            storage: localStorage,
        }]
    }
})