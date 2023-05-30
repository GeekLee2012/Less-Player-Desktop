<script setup>
import { computed, ref, watch } from 'vue';
import { useAppCommonStore } from '../store/appCommonStore';
import EventBus from '../../common/EventBus';


const { toggleGradientColorToolbar } = useAppCommonStore()

const props = defineProps({
    value: String,
    mode: Number,
    noToolbar: Boolean,
    onChanged: Function
})

const mode = ref(props.mode || 0)
const gradient = ref(props.value || '')
const modeNames = ['预览', '渐变']
const modeName = computed(() => modeNames[mode.value])
const setGradient = (value) => gradient.value = value

const modeGradient = computed(() => {
    let _value = gradient.value || ''
    _value = _value.replace('linear-gradient', '').trim()
    if (_value.startsWith('(') && _value.endsWith(')')) {
        _value = _value.substring(1, _value.length - 1)
    }
    return _value
})

const modeStyle = computed(() => {
    const bg = gradient.value
    return `background: ${bg};`
})

const reformat = (value) => {
    let _value = (value || '').trim()
    //可能单一颜色，更可能无效值
    if (_value.length < 7) return value
    //单一颜色
    if (_value.startsWith('#') && !_value.includes(',')) return value.toUpperCase()
    if (!_value.startsWith('linear-gradient')) {
        if (_value.startsWith('(') && _value.endsWith(')')) {
            _value = `linear-gradient${_value}`
        } else {
            _value = `linear-gradient(${_value})`
        }
    }
    return _value.toUpperCase().replace('LINEAR-GRADIENT', 'linear-gradient')
        .replace('TOP', 'top').replace('BOTTOM', 'bottom')
        .replace('LEFT', 'left').replace('RIGHT', 'right')
        .replace('TO', 'to')
}

const toggleMode = () => {
    mode.value = (mode.value + 1) % modeNames.length
}

const inputRef = ref(null)
const updateValue = (value) => {
    setGradient(reformat(value))
}

const updateValueFromInput = () => {
    if (!inputRef.value) return
    const { value: inputValue } = inputRef.value
    updateValue(inputValue)
}

const openGradientColorToolbar = (event) => {
    if (props.noToolbar) return
    //EventBus.emit('gradient-color-toolbar-show', { event })
    toggleGradientColorToolbar()
    EventBus.emit('app-elementAlignCenter', {
        selector: '#gradient-color-toolbar',
        width: 768,
        height: 568
    })
}

const { onChanged } = props
watch(gradient, (nv, ov) => {
    if (onChanged) onChanged(nv, ov)
})

defineExpose({
    updateValue
})
</script>

<template>
    <div class="gradient-color-input-ctl" @keydown.stop="">
        <span class="name" v-html="modeName" @click="toggleMode"></span>
        <input class="value" v-show="mode !== 0" ref="inputRef" :value="modeGradient" @keyup.enter="updateValueFromInput()"
            @blur="updateValueFromInput()" placeholder="格式请参照CSS linear-gradient，但不支持角度、命名颜色" />
        <span class="preview" :class="{ 'read-only': noToolbar }" v-show="mode === 0" @click="openGradientColorToolbar"
            :style="modeStyle"></span>
    </div>
</template>

<style scoped>
.gradient-color-input-ctl {
    width: 239px;
    height: 36px;
    display: flex;
    color: var(--content-subtitle-text-color);
    border-radius: 3px;
}

.gradient-color-input-ctl .read-only {
    cursor: default !important;
}

.gradient-color-input-ctl .name {
    min-width: 66px;
    background-color: var(--content-header-nav-bg-color);
    border: 1px solid var(--border-inputs-border-color);
    border-top-left-radius: 3px;
    border-bottom-left-radius: 3px;
    border-right: 1px solid var(--border-inputs-border-color);
}

.gradient-color-input-ctl .name,
.gradient-color-input-ctl .preview {
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: var(--content-text-tip-text-size);
}

.gradient-color-input-ctl .value,
.gradient-color-input-ctl .preview {
    flex: 1;
    border: 1px solid var(--border-inputs-border-color);
    border-left: 0px;
    border-right: 1px solid var(--border-inputs-border-color);
    border-top-right-radius: 3px;
    border-bottom-right-radius: 3px;
}

.gradient-color-input-ctl .value {
    padding: 0px 8px;
    width: 137px;
    text-align: left;
    font-size: var(--content-text-subtitle-size);
}
</style>