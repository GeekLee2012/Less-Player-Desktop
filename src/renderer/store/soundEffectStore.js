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

const PRESET_EFFECTS = [
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

export const useSoundEffectStore = defineStore('audioEffect', {
    state: () => ({
        isUseEffect: false,
        currentEffectIndex: 0,
        customEQValues: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }),
    getters: {
        currentEffect() {
            return PRESET_EFFECTS[this.currentEffectIndex]
        },
        currentEffectName() {
            return this.isUseEffect ? this.currentEffect.name : '关闭'
        },
        currentEQValues() {
            const { id, values } = this.currentEffect
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
    },
    actions: {
        setUseEffect(value) {
            this.isUseEffect = value || false
            if (!this.isUseEffect) this.currentEffectIndex = 0
            EventBus.emit('track-updateEQ', this.currentEQValues)
        },
        toggleAudioEffect() {
            this.setUseEffect(!this.isUseEffect)
        },
        getPresetEffects() {
            return PRESET_EFFECTS
        },
        getPresetEffect(index) {
            return this.getPresetEffects()[index]
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
        }
    },
})