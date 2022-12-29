<script setup>
import { onMounted, ref, toRef, watch } from 'vue';
//TODO 组件代码写得乱，后期再梳理



const props = defineProps({
    value: Number, //0.0 - 1.0
    onseek: Function,
    onscroll: Function,
    ondrag: Function
})

const sliderCtlRef = ref(null)
const progressRef = ref(null)
const thumbRef = ref(null)
let onDrag = false
let value = parseFloat(props.value || 0.5).toFixed(2)

//点击改变进度
const seekProgress = (e) => {
    if (thumbRef.value.contains(e.target)) {
        updateProgressByDeltaHeight(e.offsetY)
    } else if (sliderCtlRef.value == e.target) {
        updateProgressByHeight(e.offsetY, true)
    } else {
        updateProgressByHeight(e.offsetY)
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

const updateProgress = (percent, noUpdate) => {
    percent = percent * 100
    percent = percent > 0 ? percent : 0
    percent = percent < 100 ? percent : 100
    progressRef.value.style.height = percent + "%"
    thumbRef.value.style.top = (100 - percent) + "%"
    if (noUpdate) return
    value = (percent / 100).toFixed(2)
}

//快捷操作
const toggleProgress = () => {
    updateProgress(value > 0 ? 0 : 1)
    return value
}

const updateProgressByHeight = (height, needReverse) => {
    const totalHeight = sliderCtlRef.value.offsetHeight
    let oPercent = parseFloat(progressRef.value.style.height.replace('%', '')) / 100
    if (isNaN(oPercent)) oPercent = 0.5
    const oHeight = totalHeight * oPercent
    let percent = height / totalHeight
    if (needReverse) {
        percent = 1 - percent
    } else {
        if (oHeight >= height) percent = (oHeight - height) / totalHeight
    }
    updateProgress(percent)
}

const updateProgressByDeltaHeight = (delta) => {
    if (delta == 0) return
    const totalHeight = sliderCtlRef.value.offsetHeight
    let oPercent = parseFloat(progressRef.value.style.height.replace('%', '')) / 100
    if (isNaN(oPercent)) oPercent = 0.5
    let oHeight = totalHeight * oPercent
    updateProgressByHeight(oHeight + delta)
}

const startDrag = (e) => {
    onDrag = true
    document.addEventListener("mousemove", dragMove)
    document.addEventListener("mouseup", endDrag)
}

const dragMove = (e) => {
    if (!onDrag) return
    const progress = e.offsetY
    const totalHeight = sliderCtlRef.value.clientHeight
    const percent = progress / totalHeight
    //updateProgress(percent)
    //if(props.ondrag)  props.onseek(value)
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

watch(() => props.value, (nv, ov) => updateProgress(nv, true))
</script>

<template>
    <!--
        <input type="range" ></input>
    -->
    <div class="vertical-slider-bar" @mousewheel="scrollProgress">
        <div class="vertical-slider-bar-ctl" ref="sliderCtlRef" @click="seekProgress">
            <div class="progress" ref="progressRef"></div>
            <div class="thumb" ref="thumbRef" @mousedown="startDrag"></div>
        </div>
    </div>
</template>

<style scoped>
.vertical-slider-bar {
    height: 168px;
    background: transparent;
    -webkit-app-region: none;
}

.vertical-slider-bar .vertical-slider-bar-ctl {
    width: 3px;
    height: 100%;
    border-radius: 10rem;
    background: var(--progress-track-bg);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    position: relative;
}

.vertical-slider-bar .progress {
    width: 3px;
    height: 50%;
    border-radius: 10rem;
    background: var(--progress-bg);
    z-index: 1;
    position: absolute;
}

.vertical-slider-bar .thumb {
    width: 10px;
    height: 10px;
    border-radius: 10rem;
    background-color: var(--slider-thumb-bg);
    background: var(--progress-bg);
    z-index: 2;
    position: absolute;
    top: 50%;
}
</style>