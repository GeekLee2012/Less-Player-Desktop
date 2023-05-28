<script setup>
import { watch, ref } from 'vue';
//TODO 组件代码写得乱，后期再梳理

const props = defineProps({
    value: Number, //0.0 - 1.0
    disable: Boolean,
    disableScroll: Boolean,
    onSeek: Function,
    onScroll: Function,
    onDragStart: Function,
    onDragMove: Function,
    onDragRelease: Function
})

const sliderCtlRef = ref(null)
const progressRef = ref(null)
const thumbRef = ref(null)
let onDrag = ref(false)
let value = parseFloat(props.value).toFixed(2)

//点击改变进度
const seekProgress = (event) => {
    if (props.disable) return
    if (thumbRef.value.contains(event.target)) {
        updateProgressByDeltaWidth(event.offsetX)
    } else {
        updateProgressByWidth(event.offsetX)
    }
    if (props.onSeek) props.onSeek(value)
}

//滚轮改变进度
const scrollProgress = (event) => {
    if (props.disable || props.disableScroll) return
    if (event.deltaY == 0) return
    const direction = event.deltaY > 0 ? -1 : 1
    const step = 1 * direction
    let tmp = value * 100
    tmp += step
    const percent = (tmp / 100).toFixed(2)
    updateProgress(percent)
    if (props.onScroll) props.onScroll(value)
}

const updateProgress = (percent) => {
    percent = percent * 100
    percent = percent > 0 ? percent : 0
    percent = percent < 100 ? percent : 100
    progressRef.value.style.width = percent + "%"
    thumbRef.value.style.left = percent + "%"
    value = (percent / 100).toFixed(2)
}

//快捷操作
const toggleProgress = () => {
    updateProgress(value > 0 ? 0 : 1)
    return value
}

const updateProgressByWidth = (width) => {
    const totalWidth = sliderCtlRef.value.offsetWidth
    let percent = width / totalWidth
    updateProgress(percent)
}

const updateProgressByDeltaWidth = (delta) => {
    if (delta == 0) return
    const totalWidth = sliderCtlRef.value.offsetWidth
    const oPercent = parseFloat(progressRef.value.style.width.replace('%', '')) / 100
    if (isNaN(oPercent)) return
    let oWidth = totalWidth * oPercent
    updateProgressByWidth(oWidth + delta)
}

const startDrag = (event) => {
    if (props.disable) return
    onDrag.value = true
    document.addEventListener("mousemove", dragMove)
    document.addEventListener("mouseup", releaseDrag)
    if (props.onDragStart) props.onDragStart(event)
}

const dragMove = (event) => {
    if (props.disable) return
    if (!onDrag.value) return
    const progress = event.clientX - sliderCtlRef.value.offsetLeft
    const width = sliderCtlRef.value.clientWidth
    updateProgress(progress / width)
    if (props.onDragMove) props.onDragMove(value, event)
}

/* 以下为拖动滑块改变进度相关 */
const releaseDrag = (event) => {
    if (props.disable) return
    onDrag.value = false
    document.removeEventListener("mousemove", dragMove)
    document.removeEventListener("mouseup", releaseDrag)
    if (props.onDragRelease) props.onDragRelease(value, event)
}

watch(() => props.value, (nv, ov) => {
    if (onDrag.value) return
    updateProgress(nv, ov)
})

//对外提供API
defineExpose({
    updateProgress,
    toggleProgress
})

</script>

<template>
    <div class="slider-bar" @mousewheel="scrollProgress">
        <div class="slider-bar-ctl" :class="{ 'slider-bar-ctl-ondrag': onDrag }" ref="sliderCtlRef" @click="seekProgress">
            <div class="progress" ref="progressRef"></div>
            <div class="thumb" ref="thumbRef" @mousedown="startDrag"></div>
        </div>
    </div>
</template>

<style scoped>
.slider-bar {
    height: 3px;
    background: transparent;
    -webkit-app-region: none;
}

.slider-bar .slider-bar-ctl {
    height: var(--others-sliderbar-ctl-height);
    border-radius: 10rem;
    background: var(--others-progressbar-bg-color);
    cursor: pointer;
    display: flex;
    flex-direction: row;
    align-items: center;
    position: relative;
}

.slider-bar .progress {
    width: 0%;
    height: 100%;
    border-radius: 10rem;
    background: var(--content-text-highlight-color);
    z-index: 1;
    position: absolute;
}

.slider-bar .thumb {
    width: 10px;
    height: 10px;
    border-radius: 10rem;
    background-color: var(--others-volumebar-thumb-color);
    z-index: 2;
    position: absolute;
    left: 50%;
    -webkit-app-region: none;
    visibility: hidden;
}

.slider-bar:hover .thumb,
.slider-bar .slider-bar-ctl-ondrag .thumb {
    visibility: visible;
}
</style>