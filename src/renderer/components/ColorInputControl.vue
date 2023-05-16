<script setup>
import { computed, ref, watch } from 'vue';
import { useAppCommonStore } from '../store/appCommonStore';
import EventBus from '../../common/EventBus';


const { showColorPickerToolbar } = useAppCommonStore()

const props = defineProps({
    color: String,
    mode: Number,
    onColorChanged: Function
})

const mode = ref(props.mode || 0)
const color = ref(props.color || '')
const modeNames = ['预览', 'HEXA', 'RGBA', '渐变']
const modeName = computed(() => modeNames[mode.value])
const modeColor = computed(() => {
    const cValue = reformatHexaInput(color.value)
    if (!cValue || cValue.trim().length < 1) return cValue
    if (mode.value == 2) {
        const hexaColor = cValue.substring(1)
        const rStr = hexaColor.substring(0, 2)
        const gStr = hexaColor.substring(2, 4)
        const bStr = hexaColor.substring(4, 6)
        const aStr = hexaColor.length > 6 ? hexaColor.substring(6, 8) : 'FF'
        const r = Number(`0x${rStr}`)
        const g = Number(`0x${gStr}`)
        const b = Number(`0x${bStr}`)
        let a = (Number.parseInt(`0x${aStr}`, 16) / 255).toFixed(2).replace('.00', '')
        if (a.endsWith('0') && a.length > 1) a = a.substring(0, a.length - 1)
        return `${r}, ${g}, ${b}, ${a}`
    }
    return cValue.toUpperCase()
})

const reformatHexaInput = (value) => {
    let _value = (value || '').trim()
    if (_value.length < 1) return value
    if (!_value.startsWith('#')) _value = '#' + _value
    if (_value.length == 4) {
        const parts = _value.split('')
        _value = `#${parts[1]}${parts[1]}${parts[2]}${parts[2]}${parts[3]}${parts[3]}`
    }
    return _value.toUpperCase()
}

const toggleMode = () => {
    mode.value = (mode.value + 1) % modeNames.length
}

const openColorPicker = (event) => {
    EventBus.emit('color-picker-toolbar-show', { event })
}

const { onColorChanged } = props
watch(color, (nv, ov) => {
    if (onColorChanged) onColorChanged(nv, ov)
}) 
</script>

<template>
    <div class="color-input-ctl">
        <span class="name" v-html="modeName" @click="toggleMode"></span>
        <input class="value" v-show="mode !== 0" :value="modeColor" />
        <span class="preview" v-show="mode === 0" @click="openColorPicker" :style="{ background: color }"
            v-html="modeColor"></span>
    </div>
</template>

<style scoped>
.color-input-ctl {
    width: 239px;
    height: 36px;
    display: flex;
    color: var(--text-sub-color);
    border-radius: 3px;
}

.color-input-ctl .name {
    min-width: 66px;
    background-color: var(--content-bg-color2);
    border: 1px solid var(--input-border-color);
    border-top-left-radius: 3px;
    border-bottom-left-radius: 3px;
    border-right: 1px solid var(--input-border-color);
}

.color-input-ctl .name,
.color-input-ctl .preview {
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: var(--tip-text-size);
}

.color-input-ctl .value,
.color-input-ctl .preview {
    flex: 1;
    border: 1px solid var(--input-border-color);
    border-left: 0px;
    border-right: 1px solid var(--input-border-color);
    border-top-right-radius: 3px;
    border-bottom-right-radius: 3px;
}

.color-input-ctl .value {
    padding: 0px 8px;
    width: 137px;
    text-align: left;
    font-size: var(--text-sub-size);
    /*color: var(--text-sub-color);*/
}
</style>