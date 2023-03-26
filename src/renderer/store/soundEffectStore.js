import { defineStore } from "pinia";
import EventBus from '../../common/EventBus';



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
        id: 'custom',
        name: '自定义',
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
    }]

const MIN_GAIN = -40 / 4, MAX_GAIN = 40 / 4

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
        customEQValues: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        //混响 Impulse Response
        currentIRIndex: 0,
    }),
    getters: {
        currentEffectName() {
            if (!this.isUseEffect) return '关闭'
            return this.currentEffectType == 1 ? this.currentIR.name : this.currentEQ.name
        },
        //均衡器
        currentEQ() {
            return PRESET_EQUALIZERS[this.currentEQIndex]
        },
        currentEQValues() {
            const { id, values } = this.currentEQ
            return id === 'custom' ? this.customEQValues : values
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
        }
    },
    actions: {
        setUseEffect(type, index) {
            type = type || 0
            index = index || 0
            this.currentEffectType = type
            this.isUseEffect = (index > 0)
            if (this.currentEffectType === 1) { //混响
                this.currentEQIndex = 0
                this.currentIRIndex = index
            } else { //均衡器
                this.currentEQIndex = index
                this.currentIRIndex = 0
            }
            EventBus.emit('track-updateEQ', this.currentEQValues)
            EventBus.emit('track-updateIR', this.currentIRSource)
        },
        //TODO 暂时简单处理：关闭时，相当于快捷关闭; 开启时，并不开启任何音效
        toggleSoundEffect() {
            this.isUseEffect = !this.isUseEffect
            this.currentEQIndex = 0
            this.currentIRIndex = 0
        },
        //均衡器
        getPresetEQs() {
            return PRESET_EQUALIZERS
        },
        getPresetEQ(index) {
            return this.getPresetEQs()[index]
        },
        getEQNames() {
            return EQ
        },
        updateCustomEQValue(index, value) {
            const fValue = parseFloat(value).toFixed(1)
            this.customEQValues[index] = (fValue == value ? parseInt(value) : fValue)
        },
        percentToEQValue(percent) {
            const ZERO_PERCENT = 0.5
            if (percent < ZERO_PERCENT) {
                return MIN_GAIN * (ZERO_PERCENT - percent) / ZERO_PERCENT
            } else if (percent > ZERO_PERCENT) {
                return MAX_GAIN * (percent - ZERO_PERCENT) / ZERO_PERCENT
            }
            return 0
        },
        //混响
        getPresetIRs() {
            return PRESET_IMPULSE_RESPONSES
        }
    },
})