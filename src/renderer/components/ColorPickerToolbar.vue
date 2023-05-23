<script setup>
import { nextTick, onMounted, ref, toRef, watch } from 'vue';
import { ColorPicker } from 'vue-color-kit';
import 'vue-color-kit/dist/vue-color-kit.css';
import { useAppCommonStore } from '../store/appCommonStore';


/*
const props = defineProps({
    value: String,
   onChanged: Function
})
*/

const { hideColorPickerToolbar } = useAppCommonStore()

const colorPickerRef = ref(null)
//const value = toRef(props, 'value')

// vue-color-kit对外开放API太少
// 且只支持HEX，不支持HEXA
// 做些hack小动作，实属无奈，不得已而为之
const VueColorKitHack = {
    hexaInput: null,
    rgbaInput: null,
    isFromHexaInput: false,
    value: {},
    onChanged: null,
    setOnChanged(onChanged) {
        this.onChanged = onChanged
    },
    selectColor(color) {
        if (colorPickerRef.value) colorPickerRef.value.selectColor(color)
    },
    reformatHexaInput() {
        const { value } = this.hexaInput
        let _value = value || ''.trim()
        if (_value.length < 1) return
        if (!_value.startsWith('#')) _value = '#' + _value
        if (_value.length == 4) {
            const parts = _value.split('')
            _value = `#${parts[1]}${parts[1]}${parts[2]}${parts[2]}${parts[3]}${parts[3]}`
        }
        Object.assign(this.hexaInput, { value: _value.toUpperCase() })
    },
    updateRgbaInput() {
        const { value } = this.hexaInput
        if (!value) return
        let _value = value.trim()
        if (_value.length < 1) return
        if (!_value.startsWith('#')) return
        if (_value.length == 4) {
            const parts = _value.split('')
            _value = `#${parts[1]}${parts[1]}${parts[2]}${parts[2]}${parts[3]}${parts[3]}`
        }
        if (_value.length < 7 || _value.length == 8) {
            return
        }
        if (/(#[0-9A-Fa-f]{6,8})/g.test(_value)) {
            _value = _value.substring(1)
            const rStr = _value.substring(0, 2)
            const gStr = _value.substring(2, 4)
            const bStr = _value.substring(4, 6)
            const aStr = _value.length > 6 ? _value.substring(6, 8) : 'FF'
            const r = Number.parseInt(`0x${rStr}`, 16)
            const g = Number.parseInt(`0x${gStr}`, 16)
            const b = Number.parseInt(`0x${bStr}`, 16)
            let a = (Number.parseInt(`0x${aStr}`, 16) / 255).toFixed(2).replace('.00', '')
            if (a.endsWith('0') && a.length > 1) a = a.substring(0, a.length - 1)
            Object.assign(this.rgbaInput, { value: `${r}, ${g}, ${b}, ${a}` })
            this.selectColor(this.rgbaInput.value)
        }
    },
    setHexaInput(elem) {
        this.hexaInput = elem

        this.hexaInput.oninput = () => {
            this.isFromHexaInput = true
            this.updateRgbaInput()
        }
        this.hexaInput.onblur = () => {
            this.reformatHexaInput()
            this.updateRgbaInput()
            this.isFromHexaInput = false
        }
        this.hexaInput.onkeyup = (event) => {
            event.stopPropagation()
            if (event.key.toLowerCase() === 'enter') {
                this.reformatHexaInput()
                this.updateRgbaInput()
            }
        }
    },
    setRgbaInput(elem) {
        this.rgbaInput = elem
    },
    hack() {
        const colorTypes = document.querySelectorAll('.color-type')
        if (colorTypes.length < 2) return

        const [hexEl, rgbaEl] = colorTypes
        const hexaEl = hexEl.cloneNode(true)
        hexEl.style.display = 'none' //鸟尽弓藏
        rgbaEl.parentElement.insertBefore(hexaEl, rgbaEl)

        //设置名称
        hexaEl.querySelector('span').innerHTML = 'HEXA'

        this.setHexaInput(hexaEl.querySelector('input'))
        this.setRgbaInput(rgbaEl.querySelector('input'))
    },
    changeColor({ rgba, hsv, hex }) {
        let { value: hexa } = this.hexaInput
        if (!this.isFromHexaInput) {
            const alpha = parseInt(255 * rgba.a)
            const hexAlpha = Number(alpha).toString(16).toUpperCase().replace('FF', '').replace('0', '00')
            hexa = `${hex}${hexAlpha}`
            nextTick(() => Object.assign(this.hexaInput, { value: hexa }))
        }
        Object.assign(this.value, { rgba, hsv, hex, hexa })
    },
    applyChange() {
        const { onChanged, value } = this
        if (onChanged) onChanged(value)
        hideColorPickerToolbar()
    }
}

const onVueColorKitColorChanged = ({ rgba, hsv, hex }) => VueColorKitHack.changeColor({ rgba, hsv, hex })
const applyChange = () => VueColorKitHack.applyChange()

onMounted(() => VueColorKitHack.hack())

defineExpose({
    init: ({ onChanged, value }) => {
        VueColorKitHack.setOnChanged(onChanged)
        VueColorKitHack.selectColor(value)
    }
})
</script>

<template>
    <div class="color-picker-toolbar" v-gesture-dnm="{ trigger: '.header' }">
        <div class="header">
            <div class="close-btn btn" @click="hideColorPickerToolbar">
                <svg width="11" height="11" viewBox="0 0 593.14 593.11" data-name="Layer 1"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z"
                        transform="translate(-663.4 -243.46)" />
                </svg>
            </div>
            <div class="title">颜色设置</div>
            <div class="save-btn btn" @click="applyChange">
                <svg width="15" height="15" viewBox="0 0 1024 750.33" xmlns="http://www.w3.org/2000/svg">
                    <g id="Layer_2" data-name="Layer 2">
                        <g id="Layer_1-2" data-name="Layer 1">
                            <path
                                d="M1024,60.15c-3.08,16.34-13.48,28-24.48,39.59Q848.7,259.13,698.18,418.85,550.64,575.17,403.1,731.48c-18.5,19.59-43.21,24.28-65.31,12.35a64.27,64.27,0,0,1-12.09-8.77Q172.42,597.92,19.17,460.7C8.91,451.53,3.06,440.24,0,427.15v-15A11.58,11.58,0,0,0,1,410c8.93-41,55.92-56.55,87.33-28.86,16.74,14.76,33.26,29.78,49.89,44.67l219.3,196.39c.62.56,1.28,1.06,2.24,1.86q11.34-12,22.64-23.89L812.2,144.64Q871.89,81.39,931.61,18.17c20.65-21.81,51.1-24.21,73.3-6,9.48,7.8,15.28,17.87,18,29.78a32.87,32.87,0,0,0,1.08,3.17Z" />
                        </g>
                    </g>
                </svg>
            </div>
        </div>
        <ColorPicker theme="light" ref="colorPickerRef" :sucker-hide="false" @changeColor="onVueColorKitColorChanged" />
    </div>
</template>

<style scoped>
.color-picker-toolbar {
    width: 218px;
    height: 369px;
    border-radius: 5px;
    -webkit-app-region: none;
}

.color-picker-toolbar .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 5px;
    border-radius: 5px;
    border-bottom-left-radius: 0px;
    border-bottom-right-radius: 0px;
    background-color: var(--content-header-nav-bg-color);
    border-bottom: 1px solid var(--border-color);
}

.color-picker-toolbar .header .title {
    flex: 1;
    font-weight: bold;
    padding-right: 9px;
    font-size: var(--content-text-tip-text-size);
    font-size: 14.5px;
}

.color-picker-toolbar .header .btn {
    cursor: pointer;
    width: 30px;
}

.color-picker-toolbar .header .btn svg {
    fill: var(--button-icon-btn-color);
}

.color-picker-toolbar .header .btn:hover {
    fill: var(--content-highlight-color);
}
</style>