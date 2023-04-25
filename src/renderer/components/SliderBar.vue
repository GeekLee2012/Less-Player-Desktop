<script setup>
import { onMounted, ref } from 'vue';
//TODO 组件代码写得乱，后期再梳理

const props = defineProps({
    initValue: Number, //0.0 - 1.0
    onseek: Function,
    onscroll: Function,
    ondrag: Function
})

const sliderCtlRef = ref(null)
const progressRef = ref(null)
const thumbRef = ref(null)
let onDrag = false
let value = parseFloat(props.initValue).toFixed(2)

//点击改变进度
const seekProgress = (e) => {
    if (thumbRef.value.contains(e.target)) {
        updateProgressByDeltaWidth(e.offsetX)
    } else {
        updateProgressByWidth(e.offsetX)
    }
    if (props.onseek) props.onseek(value)
}

//滚轮改变进度
const scrollProgress = (e) => {
    if (e.deltaY == 0) return
    const direction = e.deltaY > 0 ? -1 : 1
    const step = 1 * direction
    let tmp = value * 100
    tmp += step
    const percent = (tmp / 100).toFixed(2)
    updateProgress(percent)
    if (props.onscroll) props.onscroll(value)
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

const startDrag = (e) => {
    onDrag = true
    document.addEventListener("mousemove", dragMove)
    document.addEventListener("mouseup", endDrag)
}

const dragMove = (e) => {
    if (!onDrag) return
    const progress = e.clientX - sliderCtlRef.value.offsetLeft
    const width = sliderCtlRef.value.clientWidth
    updateProgress(progress / width)
    if (props.ondrag) props.onseek(value)
}

/* 以下为拖动滑块改变进度相关 */
const endDrag = (e) => {
    onDrag = false
    document.removeEventListener("mousemove", dragMove)
    document.removeEventListener("mouseup", endDrag)
}

//对外提供API
defineExpose({
    updateProgress,
    toggleProgress
})

onMounted(() => {

})
</script>

<template>
    <div class="slider-bar" @mousewheel="scrollProgress">
        <div class="slider-bar-ctl" ref="sliderCtlRef" @click="seekProgress">
            <div class="progress" ref="progressRef"></div>
            <div class="thumb" ref="thumbRef" @mousedown="startDrag"></div>
        </div>
    </div>
</template>

<style scoped>
.slider-bar {
    height: 10px;
    background: transparent;
    -webkit-app-region: none;
}

.slider-bar .slider-bar-ctl {
    height: 3px;
    border-radius: 10rem;
    background: var(--progress-track-bg);
    cursor: pointer;
    display: flex;
    flex-direction: row;
    align-items: center;
    position: relative;
}

.slider-bar .progress {
    width: 50%;
    height: 3px;
    border-radius: 10rem;
    background: var(--progress-bg);
    z-index: 1;
    position: absolute;
}

.slider-bar .thumb {
    width: 10px;
    height: 10px;
    border-radius: 10rem;
    background-color: var(--slider-thumb-bg);
    z-index: 2;
    position: absolute;
    left: 50%;
    -webkit-app-region: none;
}
</style>