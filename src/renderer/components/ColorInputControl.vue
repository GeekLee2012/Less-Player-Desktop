<script setup>
import { computed, ref, toRef, watch } from 'vue';
import { onEvents, emitEvents } from '../../common/EventBusWrapper';



const props = defineProps({
    value: String,
    colorMode: Boolean, //单色模式，排除渐变
    gradientMode: Boolean, //渐变模式，排除单色
    onChanged: Function,
    label: String, //标题
})

const { colorMode, gradientMode, onChanged } = props
const inputValue = toRef(props, 'value')
const isGradientValue = (inputValue.value && inputValue.value.includes('linear-gradient'))
const guessMode = (inputValue.value && inputValue.value.includes('rgb')) ? 2 : 0
const mode = ref((gradientMode || isGradientValue) ? 3 : guessMode)
const color = ref(mode.value !== 3 ? inputValue.value : null)
const gradient = ref(mode.value === 3 ? inputValue.value : null)
const setMode = (value) => mode.value = value

const getColorByMode = (mode) => {
    //const _value = reformatInput(color.value, mode)
    let _value = color.value
    if (!_value || _value.trim().length < 1) return _value
    if (mode === 2) {
        const hexaColor = _value.substring(1)
        const rStr = hexaColor.substring(0, 2)
        const gStr = hexaColor.substring(2, 4)
        const bStr = hexaColor.substring(4, 6)
        const aStr = hexaColor.length > 6 ? hexaColor.substring(6, 8) : 'FF'
        const r = Number(`0x${rStr}`)
        const g = Number(`0x${gStr}`)
        const b = Number(`0x${bStr}`)
        let a = (Number.parseInt(`0x${aStr}`, 16) / 255).toFixed(2).replace('.00', '')
        if (a.endsWith('0') && a.length > 1) a = a.substring(0, a.length - 1)
        _value = `${r}, ${g}, ${b}, ${a}`
    }
    return _value.toUpperCase()
}
const modeNames = ['单色', 'HEXA', 'RGBA', '渐变']
const modeName = computed(() => modeNames[mode.value])
const modeColor = computed(() => { if (color.value) return getColorByMode(mode.value) })
const modeStyle = computed(() => {
    const bg = color.value
    return `background: ${bg};`
})

const gradientStyle = computed(() => {
    const bg = gradient.value
    return `background: ${bg};`
})

const reformatInput = (value, mode) => {
    let _value = (value || '').trim()
    if (_value.length < 1) return value
    if (mode <= 1 && !_value.startsWith('#')) {
        _value = `#${_value}`
    } else if (mode === 2 && !_value.startsWith('rgb')) {
        _value = `rgba(${_value})`
    }
    if (_value.startsWith('#') && _value.length == 4) {
        const parts = _value.split('')
        _value = `#${parts[1]}${parts[1]}${parts[2]}${parts[2]}${parts[3]}${parts[3]}`
    } else if (_value.startsWith('rgb')) {
        _value = _value.split('(')[1].replace(')', '').trim()
        const rgbaColors = _value.replace(/，/g, ',').split(',')
        const rStr = rgbaColors[0].trim()
        const gStr = rgbaColors[1].trim()
        const bStr = rgbaColors[2].trim()
        const aStr = rgbaColors.length > 3 ? rgbaColors[3].trim() : '255'
        let r = Number(`${rStr}`).toString(16)
        let g = Number(`${gStr}`).toString(16)
        let b = Number(`${bStr}`).toString(16)
        let a = parseInt((Number(`${aStr}`) * 255)).toString(16).replace('ff', '')
        r = r.length == 1 ? `0${r}` : r
        g = g.length == 1 ? `0${g}` : g
        b = b.length == 1 ? `0${b}` : b
        a = a.length == 1 ? `0${a}` : a
        _value = `#${r}${g}${b}${a}`
    }
    return _value.toUpperCase()
}

const toggleMode = () => {
    if (gradientMode) {
        mode.value = 3
        return
    }
    const offset = colorMode ? 1 : 0
    mode.value = (mode.value + 1) % (modeNames.length - offset)
}

const openColorPicker = (event) => {
    if (gradientMode) return
    const rgba = getColorByMode(2)
    emitEvents('color-picker-toolbar-show', {
        event, value: rgba, onChanged: ({ rgba, hexa }) => {
            color.value = hexa
            gradient.value = null
        },
        title: props.label
    })
}

const openGradientColorToolbar = (event) => {
    if (colorMode) return
    emitEvents('gradient-color-toolbar-show', {
        event, value: gradient.value, onChanged: (value) => {
            gradient.value = value
            color.value = null
        }
    })
}

const inputRef = ref(null)
const updateColor = () => {
    const { value } = inputRef.value
    const hexa = reformatInput(value, mode.value)
    color.value = hexa
    gradient.value = null
}


/* 生命周期、监听 */
watch([color, gradient], ([nv1, nv2], [ov1, ov2]) => {
    if (onChanged) onChanged(nv1 || nv2)
})

watch(inputValue, (nv, ov) => {
    if (!nv) {
        color.value = null
        gradient.value = null
        return
    }
    if (nv.startsWith('linear-gradient')) {
        color.value = null
        gradient.value = nv
        setMode(3)
    } else {
        color.value = nv
        gradient.value = null
        setMode(0)
    }
})
</script>

<template>
    <div class="color-input-ctl" :class="{ 'gradient-only-input-mode': gradientMode }" @keydown.stop="">
        <span class="name" v-html="modeName" @click="toggleMode"></span>
        <input class="value" ref="inputRef" v-show="mode == 1 || mode == 2" :value="modeColor"
            @keydown.enter="updateColor()" @blur="updateColor()" />
        <span class="preview" v-show="mode === 0" @click="openColorPicker" :style="modeStyle" v-html="modeColor"></span>
        <span class="preview" v-show="mode === 3" @click="openGradientColorToolbar" :style="gradientStyle"></span>
    </div>
</template>

<style scoped>
.color-input-ctl {
    width: 239px;
    height: 36px;
    display: flex;
    color: var(--content-subtitle-text-color);
    border-radius: 3px;
}

.color-input-ctl .name {
    min-width: 66px;
    /*background-color: var(--content-header-nav-bg-color);*/
    border: 1px solid var(--border-inputs-border-color);
    border-top-left-radius: 3px;
    border-bottom-left-radius: 3px;
    border-right: 1px solid var(--border-inputs-border-color);
    background-color: var(--content-inputs-bg-color);
    color: var(--content-inputs-text-color);
}

.color-input-ctl .name,
.color-input-ctl .preview {
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: var(--content-text-tip-text-size);
}

.gradient-only-input-mode .name {
    cursor: default;
}

.color-input-ctl .value,
.color-input-ctl .preview {
    flex: 1;
    border: 1px solid var(--border-inputs-border-color);
    border-left: 0px;
    border-right: 1px solid var(--border-inputs-border-color);
    border-top-right-radius: 3px;
    border-bottom-right-radius: 3px;
}

/*
.color-input-ctl .preview {
    justify-content: flex-start;
    padding-left: 8px;
}
*/

.color-input-ctl .value {
    padding: 0px 8px;
    width: 137px;
    text-align: left;
    font-size: var(--content-text-subtitle-size);
    background-color: var(--content-inputs-bg-color);
    color: var(--content-inputs-text-color);
}
</style>