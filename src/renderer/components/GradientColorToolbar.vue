<script setup>
import { inject, ref } from 'vue';
import { useAppCommonStore } from '../store/appCommonStore';
import ColorInputControl from '../components/ColorInputControl.vue';
import GradientColorInputControl from '../components/GradientColorInputControl.vue';



const { useWindowsStyleWinCtl } = inject('appCommon')


const { hideGradientColorToolbar } = useAppCommonStore()

const gradient = ref(null)
const hDirectionIndex = ref(0)
const vDirectionIndex = ref(0)
const hDirections = [{
    name: '不设置',
    value: null,
}, {
    name: '左边',
    value: 'left'
}, {
    name: '右边',
    value: 'right'
}]
const vDirections = [{
    name: '不设置',
    value: null,
}, {
    name: '顶部',
    value: 'top'
}, {
    name: '底部',
    value: 'bottom'
}]
const setGradient = (value) => gradient.value = value
const setHDirectionIndex = (value) => hDirectionIndex.value = value
const setVDirectionIndex = (value) => vDirectionIndex.value = value

const setHDirection = (item, index) => {
    setHDirectionIndex(index)
    updateValue()
}

const setVDirection = (item, index) => {
    setVDirectionIndex(index)
    updateValue()
}

const colorStops = ref([])
const gradientInputRef = ref(null)

const doUpdateValue = (value, fromGradientInput) => {
    setGradient(value)
    if (!fromGradientInput && gradientInputRef.value) {
        gradientInputRef.value.updateValue(value)
    }
}

const resolveGradientText = (value) => {
    if (value.startsWith('linear-gradient(')) {
        value = value.substring('linear-gradient('.length)
        value = value.substring(0, value.length - 1)
    }
    const gradientParts = []
    while (value.length > 0) {
        if (value.startsWith('#')) {
            const hexa = value.split(',')[0]
            gradientParts.push(hexa)
            value = value.substring(hexa.length + 1).trim()
        } else if (value.startsWith('rgb')) {
            let rgba = value.split(')')[0]
            if (!rgba.trim().endsWith(')')) rgba = rgba + ')'
            gradientParts.push(rgba)
            value = value.substring(rgba.length + 1).trim()
        } else {
            const other = value.split(',')[0]
            gradientParts.push(other)
            value = value.substring(other.length + 1).trim()
        }
    }
    return gradientParts
}

const updateRelativeUI = () => {
    const { value } = gradient
    let _value = (value || '').trim()
    let hasDirections = false, gradientParts = []
    if (_value.length > 0) {
        gradientParts = resolveGradientText(_value)
    }
    if (gradientParts.length > 0) {
        const part0 = gradientParts[0].toLowerCase().trim()
        hasDirections = !part0.startsWith('#') && !part0.startsWith('rgb')
        //渐变方向
        if (hasDirections) {
            const directrionsText = part0
            let hIndex = 0, vIndex = 0, found = 0
            for (var i = 1; i < hDirections.length; i++) {
                if (directrionsText.includes(hDirections[i].value)) {
                    hIndex = i
                    ++found
                }
                if (directrionsText.includes(vDirections[i].value)) {
                    vIndex = i
                    ++found
                }
                if (found >= 2) break
            }
            setHDirectionIndex(hIndex)
            setVDirectionIndex(vIndex)
        }
    }
    const colorStopStartIndex = hasDirections ? 1 : 0
    //颜色区间
    colorStops.value.length = 0
    for (var i = colorStopStartIndex; i < gradientParts.length; i++) {
        const part = gradientParts[i].trim()
        if (!part.startsWith('#') && !part.startsWith('rgb')) continue
        let color = null, stop = null
        if (part.startsWith('#')) {
            const colorStopParts = part.split(' ')
            color = colorStopParts[0].trim()
            colorStopParts.splice(0, 1)
            stop = colorStopParts.length > 0 ? colorStopParts.join(' ') : null
        } else if (part.startsWith('rgb')) {
            const colorStopParts = part.split(')')
            color = colorStopParts[0].trim() + ')'
            stop = colorStopParts.length > 0 ? colorStopParts[1].trim() : null
        }
        if (color) {
            colorStops.value.push({
                color,
                stop
            })
        }

    }
}

const updateFromGradientInput = (value) => {
    setGradient(value)
    updateRelativeUI()
}

const updateValue = (value) => {
    if (value) {
        doUpdateValue(value)
        return
    }
    const { value: vDirection } = vDirections[vDirectionIndex.value]
    const { value: hDirection } = hDirections[hDirectionIndex.value]
    let sideOrCorner = '', colors = '', hasDirection = false
    if (vDirection || hDirection) {
        hasDirection = true
        sideOrCorner = `to ${hDirection} ${vDirection} `.replace('null', '').trim().replace(/\s\s/g, ' ')
    }
    for (var i = 0; i < colorStops.value.length; i++) {
        const { color, stop } = colorStops.value[i]
        colors += `,${color} ${stop}`.replace('null', '').trim()
    }
    if (colors.length > 0) {
        value = `linear-gradient(${sideOrCorner},${colors})`
            .replace(',,', ',').replace('(,', '(')
    }
    //if (colorStops.length == 1) value = `${colorStops[0].color}`
    doUpdateValue(value)
}

const appendColorStop = () => {
    colorStops.value.push({ color: '#FFFFFF', stop: null })
    updateValue()
}

const removeColorStop = (item, index) => {
    if (colorStops.value.length < 1) return
    colorStops.value.splice(index, 1)
    updateValue()
}

const updateStopColor = (color, index) => {
    Object.assign(colorStops.value[index], { color })
    updateValue()
}

const updateColorStop = (item, index) => {
    const stopEls = document.querySelectorAll('.gradient-color-toolbar .center .color-stops .stop')
    if (!stopEls) return
    const { color } = item
    const stopValue = stopEls[index].value
    //colorStops.value.splice(index, 1, { color, stop: stopValue })
    Object.assign(colorStops.value[index], { color, stop: `${stopValue}` })
    updateValue()
}

let onChangeSaved = null
const saveGradient = () => {
    if (onChangeSaved) onChangeSaved(gradient.value)
    hideGradientColorToolbar()
}

const removeGradient = () => {
    if(!gradientInputRef.value) return 
    const value = ''
    gradientInputRef.value.updateValue(value)
    updateFromGradientInput(value)
}



/* 生命周期、监听 */
defineExpose({
    init: ({ onChanged, value }) => {
        onChangeSaved = onChanged
        doUpdateValue(value)
        updateRelativeUI()
    }
})
</script>

<template>
    <div class="gradient-color-toolbar" v-gesture-dnm="{ trigger: '.header' }">
        <div class="container">
            <div class="header">
                <div class="action left-action" v-show="!useWindowsStyleWinCtl">
                    <div class="close-btn btn" @click="hideGradientColorToolbar">
                        <svg width="12" height="12" viewBox="0 0 593.14 593.11" data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z"
                                transform="translate(-663.4 -243.46)" />
                        </svg>
                    </div>
                </div>
                <div class="title-wrap">
                    <div class="title">渐变设置</div>
                </div>
                <div class="action right-action">
                    <div class="clear-btn text-btn" @click="removeGradient">
                        <svg width="15" height="15" viewBox="0 0 256 256" data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M1040,669H882c-12.79-4.93-17.16-14.62-17.1-27.83.26-52.77.11-105.55.11-158.32V477c-6,0-11.42-.32-16.84.09-6.54.48-11.66-1.39-15.17-7.08v-7c3.16-5.7,8-7.48,14.44-7.36,18.29.32,36.58.12,54.88.1,1.75,0,3.5-.16,5.48-.25,0-7.76,0-14.91,0-22.05a18.56,18.56,0,0,1,6.6-14.52c2.85-2.39,6.37-4,9.59-5.92h73c13.83,5.64,17.27,10.84,17.25,26.08,0,5.41,0,10.82,0,16.68h7.53c17.61,0,35.21.2,52.81-.12,6.43-.12,11.27,1.63,14.41,7.36v7c-3.5,5.7-8.63,7.56-15.17,7.08-5.41-.4-10.89-.09-16.84-.09v6.36c0,52.6-.15,105.2.11,157.8C1057.17,654.36,1052.81,664.08,1040,669ZM886.24,477.29V640.4c0,8.44-.49,7.34,7.11,7.35q67.95,0,135.9,0c6.51,0,6.52,0,6.52-6.43v-164Zm106.5-42.78H929.37v21h63.37Z"
                                transform="translate(-833 -413)" />
                            <path
                                d="M950.29,562.2c0-13.47,0-26.94,0-40.41,0-7.94,4.25-12.84,10.82-12.77,6.36.07,10.59,5,10.6,12.52,0,27.28,0,54.55,0,81.83,0,5.13-1.71,9.17-6.5,11.36-7.39,3.36-14.87-2.16-14.94-11.11-.11-13.81,0-27.61,0-41.42Z"
                                transform="translate(-833 -413)" />
                            <path
                                d="M1014.25,562.63c0,13.48,0,27,0,40.42,0,7.88-4.3,12.82-10.87,12.64-6.29-.18-10.35-5.13-10.36-12.75q0-41.16,0-82.33c0-5.91,3-9.91,8-11.26a10.29,10.29,0,0,1,11.85,5.16,16.06,16.06,0,0,1,1.33,6.71c.12,13.8.06,27.61.06,41.41Z"
                                transform="translate(-833 -413)" />
                            <path
                                d="M929,562.53q0,21,0,41.92c0,4.8-2.09,8.39-6.49,10.29-4.21,1.81-8.49,1.25-11.43-2.23a13.57,13.57,0,0,1-3.17-8c-.23-28.1-.19-56.21-.12-84.32,0-6.74,4.63-11.34,10.74-11.19s10.41,4.78,10.44,11.59C929.05,534.59,929,548.56,929,562.53Z"
                                transform="translate(-833 -413)" />
                        </svg>
                        <span>移除渐变</span>
                    </div>
                    <div class="append-btn text-btn" @click="appendColorStop">
                        <svg width="13" height="13" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M504,0h16a4,4,0,0,0,1.29.68c27.76,3.24,55.12,28.84,54.94,67.5-.61,124.49-.23,249-.22,373.49V448h6.84q188,0,376,0c29.9,0,54.71,18.45,62.71,46.42.91,3.16,1.64,6.38,2.45,9.57v16c-.24.42-.65.83-.7,1.28-3.36,28-28.85,55.08-67,54.92-124.83-.53-249.66-.2-374.49-.19H576v5.33q0,59.51,0,119,0,129.49,0,259c0,29.4-18.69,54.33-46.41,62.22-3.16.9-6.38,1.64-9.57,2.45H504c-.43-.24-.83-.65-1.28-.7-27.7-3.37-55.08-28.54-54.92-67,.53-124.49.2-249,.2-373.47V576H385.68q-160.24,0-320.48,0c-25.47,0-44.94-11.29-57.3-33.55C4.11,535.58,2.57,527.51,0,520V504a4,4,0,0,0,.68-1.29c3.32-27.94,29-55.08,67-54.92,124.5.55,249,.21,373.49.21H448V335.66q0-135.24,0-270.49C448,42,457.45,23.23,477,10.78,485,5.64,494.92,3.5,504,0Z" />
                                </g>
                            </g>
                        </svg>
                        <span>追加颜色区间</span>
                    </div>
                    <div class="save-btn text-btn" @click="saveGradient">
                        <svg width="15" height="15" viewBox="0 0 853.61 853.59" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M426.39,853.55h-199c-32.66,0-65.33.12-98,0C69.66,853.23,19.5,815.14,4.57,758.06A138.7,138.7,0,0,1,.21,723.51Q-.18,426.78.06,130.05c0-64,42.59-115.66,105-127.71A135.26,135.26,0,0,1,130.43.14q232-.19,464-.14c13.93,0,25.46,4.72,35.34,14.64Q733.72,118.89,838,222.83c10.58,10.53,15.62,22.58,15.61,37.48-.13,154,.12,308-.2,462-.1,53.18-24.09,92.8-71.21,117.81-18.61,9.87-38.86,13.47-59.83,13.47Q574.38,853.52,426.39,853.55Zm-170-640h6.94q143.49,0,287,0c3,0,6,0,9,.23,22.36,1.7,40.48,23.55,38,45.78-2.61,23.46-20.15,39.22-43.88,39.22q-168.49,0-337,0c-27.74,0-45.64-17.9-45.64-45.63q0-80.73,0-161.48V85.85c-16.65,0-32.66-.59-48.59.31-6,.33-12.33,3.23-17.49,6.55-13.7,8.82-19.26,22-19.25,38.28q.18,295.72.08,591.45c0,1.67,0,3.33.06,5,.74,18.92,14,35.43,32.57,39.27,7.24,1.5,14.89,1.14,22.36,1.29,9.94.19,19.88,0,30.26,0v-6.49q0-144.49,0-289c0-28,17.85-45.78,46-45.78h420c28.4,0,46,17.71,46,46.22V768c13.88,0,27,0,40.19,0,27.25,0,45-17.78,45-45q0-222.22.08-444.46a10.66,10.66,0,0,0-3.39-8.3q-90.8-90.57-181.37-181.34A10.63,10.63,0,0,0,575,85.48q-156.49.12-313,.07h-5.71Zm340.86,554.3V512.5H256.41V767.85Z" />
                                </g>
                            </g>
                        </svg>
                        <span>保存</span>
                    </div>
                    <div class="close-btn btn" @click="hideGradientColorToolbar" v-show="useWindowsStyleWinCtl">
                        <svg width="12" height="12" viewBox="0 0 593.14 593.11" data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z"
                                transform="translate(-663.4 -243.46)" />
                        </svg>
                    </div>
                </div>
            </div>
            <div class="center">
                <div class="row first">
                    <div class="cate-name">渐变值</div>
                    <div class="row-content">
                        <div class="tip-text">提示：设置后的效果预览，也可点击下"预览"切换为"直接编辑"模式<br>
                            不想设置渐变，也可以切换到“直接编辑”模式下，删除渐变值<br>
                            CSS线性渐变格式：linear-gradient(渐变值)；颜色格式: HEXA、RGBA
                        </div>
                        <div class="item">
                            <GradientColorInputControl class="gradient-input-ctl" ref="gradientInputRef" :noToolbar="true"
                                :onChanged="updateFromGradientInput">
                            </GradientColorInputControl>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="cate-name">渐变方向</div>
                    <div class="row-content">
                        <div class="item">
                            <div class="name">水平方向 - 往：</div>
                            <div class="directrion">
                                <span v-for="(item, index) in hDirections" :class="{ active: index == hDirectionIndex }"
                                    @click="setHDirection(item, index)" v-html="item.name">
                                </span>
                            </div>
                        </div>
                        <div class="item">
                            <div class="name">垂直方向 - 往：</div>
                            <div class="directrion">
                                <span v-for="(item, index) in vDirections" :class="{ active: index == vDirectionIndex }"
                                    @click="setVDirection(item, index)" v-html="item.name">
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row color-stops">
                    <div class="cate-name">颜色区间</div>
                    <div class="row-content">
                        <div class="tip-text">提示：没有颜色区间时，请点击窗口标题栏右侧的"追加颜色区间"按钮。<br>
                            区间值: 值为百分数，可不设置，格式：[起点值 终点值]，中间必须以空格分隔。
                            示例：设置值为: 0% 20%，或者50%
                        </div>
                        <div class="item" v-for="(item, index) in colorStops" @keydown.stop="">
                            <ColorInputControl :value="item.color" :colorMode="true"
                                :onChanged="color => updateStopColor(color, index)"></ColorInputControl>
                            <input class="text-input-ctl stop" :value="item.stop" placeholder="区间值"
                                @keydown.enter="updateColorStop(item, index)" />
                            <div class="action">
                                <div class="remove-btn text-btn" v-show="(colorStops.length > 0)"
                                    @click="removeColorStop(item, index)">
                                    <svg width="15" height="15" viewBox="0 0 256 256" data-name="Layer 1"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M1040,669H882c-12.79-4.93-17.16-14.62-17.1-27.83.26-52.77.11-105.55.11-158.32V477c-6,0-11.42-.32-16.84.09-6.54.48-11.66-1.39-15.17-7.08v-7c3.16-5.7,8-7.48,14.44-7.36,18.29.32,36.58.12,54.88.1,1.75,0,3.5-.16,5.48-.25,0-7.76,0-14.91,0-22.05a18.56,18.56,0,0,1,6.6-14.52c2.85-2.39,6.37-4,9.59-5.92h73c13.83,5.64,17.27,10.84,17.25,26.08,0,5.41,0,10.82,0,16.68h7.53c17.61,0,35.21.2,52.81-.12,6.43-.12,11.27,1.63,14.41,7.36v7c-3.5,5.7-8.63,7.56-15.17,7.08-5.41-.4-10.89-.09-16.84-.09v6.36c0,52.6-.15,105.2.11,157.8C1057.17,654.36,1052.81,664.08,1040,669ZM886.24,477.29V640.4c0,8.44-.49,7.34,7.11,7.35q67.95,0,135.9,0c6.51,0,6.52,0,6.52-6.43v-164Zm106.5-42.78H929.37v21h63.37Z"
                                            transform="translate(-833 -413)" />
                                        <path
                                            d="M950.29,562.2c0-13.47,0-26.94,0-40.41,0-7.94,4.25-12.84,10.82-12.77,6.36.07,10.59,5,10.6,12.52,0,27.28,0,54.55,0,81.83,0,5.13-1.71,9.17-6.5,11.36-7.39,3.36-14.87-2.16-14.94-11.11-.11-13.81,0-27.61,0-41.42Z"
                                            transform="translate(-833 -413)" />
                                        <path
                                            d="M1014.25,562.63c0,13.48,0,27,0,40.42,0,7.88-4.3,12.82-10.87,12.64-6.29-.18-10.35-5.13-10.36-12.75q0-41.16,0-82.33c0-5.91,3-9.91,8-11.26a10.29,10.29,0,0,1,11.85,5.16,16.06,16.06,0,0,1,1.33,6.71c.12,13.8.06,27.61.06,41.41Z"
                                            transform="translate(-833 -413)" />
                                        <path
                                            d="M929,562.53q0,21,0,41.92c0,4.8-2.09,8.39-6.49,10.29-4.21,1.81-8.49,1.25-11.43-2.23a13.57,13.57,0,0,1-3.17-8c-.23-28.1-.19-56.21-.12-84.32,0-6.74,4.63-11.34,10.74-11.19s10.41,4.78,10.44,11.59C929.05,534.59,929,548.56,929,562.53Z"
                                            transform="translate(-833 -413)" />
                                    </svg>
                                    <span>移除</span>
                                </div>
                                <div class="append-btn text-btn" v-show="(index == (colorStops.length - 1))"
                                    @click="appendColorStop">
                                    <svg width="14" height="14" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                                        <g id="Layer_2" data-name="Layer 2">
                                            <g id="Layer_1-2" data-name="Layer 1">
                                                <path
                                                    d="M504,0h16a4,4,0,0,0,1.29.68c27.76,3.24,55.12,28.84,54.94,67.5-.61,124.49-.23,249-.22,373.49V448h6.84q188,0,376,0c29.9,0,54.71,18.45,62.71,46.42.91,3.16,1.64,6.38,2.45,9.57v16c-.24.42-.65.83-.7,1.28-3.36,28-28.85,55.08-67,54.92-124.83-.53-249.66-.2-374.49-.19H576v5.33q0,59.51,0,119,0,129.49,0,259c0,29.4-18.69,54.33-46.41,62.22-3.16.9-6.38,1.64-9.57,2.45H504c-.43-.24-.83-.65-1.28-.7-27.7-3.37-55.08-28.54-54.92-67,.53-124.49.2-249,.2-373.47V576H385.68q-160.24,0-320.48,0c-25.47,0-44.94-11.29-57.3-33.55C4.11,535.58,2.57,527.51,0,520V504a4,4,0,0,0,.68-1.29c3.32-27.94,29-55.08,67-54.92,124.5.55,249,.21,373.49.21H448V335.66q0-135.24,0-270.49C448,42,457.45,23.23,477,10.78,485,5.64,494.92,3.5,504,0Z" />
                                            </g>
                                        </g>
                                    </svg>
                                    <span>追加</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.gradient-color-toolbar {
    display: flex;
    /*flex-direction: column;*/
    overflow: hidden;
    -webkit-app-region: none;
}

.gradient-color-toolbar .container {
    display: flex;
    flex: 1;
    flex-direction: column;
}

.gradient-color-toolbar .spacing {
    margin-left: 15px;
}

.gradient-color-toolbar .spacing1 {
    margin-left: 50px;
}

.gradient-color-toolbar .header,
.gradient-color-toolbar .center,
.gradient-color-toolbar .header .title-wrap,
.gradient-color-toolbar .center .bands {
    display: flex;
    flex-direction: row;
}

.gradient-color-toolbar .header {
    padding: 10px 15px 10px 6px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--content-header-nav-bg-color);
    border-bottom: 1px solid var(--border-color);
}

.gradient-color-toolbar .header .action {
    display: flex;
}

.gradient-color-toolbar .header .action .close-btn {
    width: 30px;
}

.gradient-color-toolbar .header .title-wrap {
    margin-left: 6px;
    flex: 1;
    display: flex;
}

.gradient-color-toolbar .header .title {
    font-size: var(--content-text-size);
}

.gradient-color-toolbar .header #toggle-ctl {
    cursor: default;
    -webkit-app-region: none;
}

.gradient-color-toolbar .text-btn {
    text-align: left;
    font-size: var(--content-text-tip-text-size);
    display: flex;
    align-items: center;
    justify-items: center;
    margin-left: 33px;
    cursor: pointer;
}

.gradient-color-toolbar .tip-text {
    margin-bottom: 15px;
    text-align: left;
}

.gradient-color-toolbar .gradient-input-ctl {
    width: 539px;
}

.gradient-color-toolbar .center {
    padding: 0px 33px 66px 33px;
    flex: 1;
    background: var(--content-bg-color);
    overflow: hidden;
    align-items: flex-start;
    display: flex;
    flex-direction: column;
    overflow: scroll;
    overflow-x: hidden;
}

.gradient-color-toolbar .center .first {
    margin-top: 36px;
}

.gradient-color-toolbar .center .row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    margin-bottom: 36px;
}

.gradient-color-toolbar .center .last {
    margin-bottom: 68px;
    border: 1px solid transparent;
}

.gradient-color-toolbar .center .row .cate-name {
    font-size: var(--content-text-tab-title-size);
    width: 118px;
    text-align: left;
    margin-right: 10px;
    margin-top: 3px;
}

.gradient-color-toolbar .center .row-content {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
    flex: 1;
}

.gradient-color-toolbar .center .row-content .item {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    text-align: left;
    margin-bottom: 33px;
    flex: 1;
}

.gradient-color-toolbar .center .row-content .item .name {
    width: 158px;
}

.gradient-color-toolbar .center .row-content .directrion {
    display: flex;
}

.gradient-color-toolbar .center .row-content .directrion span {
    min-width: 88px;
    padding: 6px;
    text-align: center;
    /*border-radius: 10rem;*/
    border-radius: var(--border-list-item-border-radius);
    margin-right: 20px;
    border: 0px solid var(--border-color);
    cursor: pointer;
}

.gradient-color-toolbar .center .row-content .directrion span:hover {
    background-color: var(--content-list-item-hover-bg-color);
}

.gradient-color-toolbar .center .row-content .directrion .active {
    background: var(--button-icon-text-btn-bg-color) !important;
    color: var(--button-icon-text-btn-icon-color) !important;
}

.gradient-color-toolbar .center .row-content .item .stop {
    margin-left: 15px;
    min-width: 128px;
    width: 128px;
    height: 16px;
}

.gradient-color-toolbar .center .row-content .item .action {
    display: flex;
}

.gradient-color-toolbar .center .row-content .item .action .text-btn {
    margin-left: 15px;
}
</style>