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
        event, value: rgba, onChanged: (value) => {
            const { rgba, hexa, hex } = value || {}
            color.value = hexa || rgba || hex 
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

const clear = () => {
    inputRef.value.value = ''
    color.value = null
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
    <div class="color-input-ctl" 
        :class="{ 
            'gradient-only-input-mode': gradientMode,
            'has-value': (color || gradient),
        }" 
        @keydown.stop="">
        <div class="name" v-html="modeName" @click="toggleMode"></div>
        <input class="value" ref="inputRef" v-show="mode == 1 || mode == 2" :value="modeColor"
            @keydown.enter="updateColor()" @blur="updateColor()" />
        <div class="preview" 
            v-show="mode === 0" 
            @click="openColorPicker" 
            :style="modeStyle" 
            v-html="modeColor">
        </div>
        <div class="preview"
             v-show="mode === 3" 
             @click="openGradientColorToolbar" 
             :style="gradientStyle">
        </div>
        <div class="btn clear-btn" @click="clear">
            <svg width="10"  height="10" viewBox="0 0 593.14 593.11"  data-name="Layer 1" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z"
                    transform="translate(-663.4 -243.46)" />
            </svg>
        </div>
    </div>
</template>

<style scoped>
.color-input-ctl {
    width: 239px;
    --height: 34px;
    display: flex;
    color: var(--content-subtitle-text-color);
    border-radius: 3px;
}

.color-input-ctl .name {
    min-width: 66px;
    height: var(--height);
    /*background-color: var(--content-header-nav-bg-color);*/
    border: 1px solid var(--border-inputs-border-color);
    border-top-left-radius: var(--border-inputs-border-radius);
    border-bottom-left-radius: var(--border-inputs-border-radius);
    border-right: 1px solid var(--border-inputs-border-color);
    background-color: var(--content-inputs-bg-color);
    color: var(--content-inputs-text-color);
}

.color-input-ctl .name:hover {
    background: var(--button-icon-text-btn-bg-color);
    color: var(--button-icon-text-btn-text-color)
}

.contrast-mode .color-input-ctl .name:hover {
    font-weight: bold;
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
    font-weight: normal !important;
    background: var(--content-inputs-bg-color) !important;
    color: var(--content-inputs-text-color) !important;
}

.color-input-ctl .value,
.color-input-ctl .preview {
    flex: 1;
    border: 1px solid var(--border-inputs-border-color);
    border-left: 0px;
    height: var(--height);
    /*
    border-right: 1px solid var(--border-inputs-border-color);
    border-top-right-radius: var(--border-inputs-border-radius);
    border-bottom-right-radius: var(--border-inputs-border-radius);
    */
}

.color-input-ctl .value {
    padding: 0px 8px;
    /*width: 137px;*/
    width: calc(100% - 66px - 36px);
    text-align: left;
    font-size: var(--content-text-subtitle-size);
    background-color: var(--content-inputs-bg-color);
    color: var(--content-inputs-text-color);
}

.color-input-ctl .btn {
    min-width: var(--height);
    height: var(--height);
    border: 1px solid var(--border-inputs-border-color);
    border-top-right-radius: var(--border-inputs-border-radius);
    border-bottom-right-radius: var(--border-inputs-border-radius);
    border-left: 1px solid var(--border-inputs-border-color);
    background-color: var(--content-inputs-bg-color);
    color: var(--content-inputs-text-color);
    
    display: none;
}

.color-input-ctl.has-value .value,
.color-input-ctl.has-value .preview  {
    border-right: 0px;
}

.color-input-ctl.has-value .btn {
    display: flex;
    justify-content: center;
    align-items: center;
}

.color-input-ctl .btn svg {
    fill: var(--button-icon-btn-color);
    fill: var(--content-inputs-text-color);
}

.color-input-ctl .btn:hover {
    background: var(--button-icon-text-btn-bg-color);
}

.color-input-ctl .btn:hover svg {
    fill: var(--button-icon-text-btn-text-color) !important;
}
</style>