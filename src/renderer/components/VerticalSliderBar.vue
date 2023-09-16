<script setup>
import { nextTick, ref, watch } from 'vue';



const props = defineProps({
    value: Number, //0 - 1
    precision: Number, //精度，保留小数位数
    onseek: Function,
    onscroll: Function,
    onDragStart: Function,
    onDragMove: Function,
    onDragRelease: Function
})

const sliderCtlRef = ref(null)
const progressRef = ref(null)
const thumbRef = ref(null)
const precision = parseInt(props.precision || 2)
let value = null
const setValue = (percent) => value = parseFloat(percent || 0).toFixed(precision)
let onDrag = false, dragReleasing = false

//点击改变进度
const seekProgress = (event) => {
    if (onDrag || dragReleasing) return
    const { target, offsetY } = event
    let trigger = 0 //在滑动轨道上触发
    if (progressRef.value.contains(target)) { //在当前进度内（高亮色区域）触发
        trigger = 1
    } else if (thumbRef.value.contains(target)) { //在滑块上触发
        trigger = 2
    }
    updateProgressByHeight(offsetY, trigger)
    const { onseek } = props
    if (onseek) onseek(value)
}

//滚轮改变进度
const scrollProgress = (e) => {
    if (onDrag || e.deltaY == 0) return
    const direction = e.deltaY > 0 ? -1 : 1
    const step = 1 * direction
    let tmp = value * 100
    tmp += step
    const percent = (tmp / 100).toFixed(precision)
    updateProgress(percent)
    const { onscroll } = props
    if (onscroll) onscroll(value)
}

const updateProgress = (percent, noUpdate) => {
    let height = (percent || 0) * 100
    height = height > 0 ? height : 0
    height = height < 100 ? height : 100

    progressRef.value.style.height = `${height}%`
    thumbRef.value.style.bottom = `${height}%`

    if (!noUpdate) setValue(height / 100)
}

//快捷操作
const toggleProgress = () => {
    updateProgress(value > 0 ? 0 : 1)
    return value
}

const updateProgressByHeight = (height, trigger) => {
    const { clientHeight: sliderHeight } = sliderCtlRef.value
    const oProgressHeight = (value || 0) * sliderHeight
    const thumbHeight = 10
    //默认滑动轨道内触发
    let nProgressHeight = sliderHeight - height
    switch (trigger) {
        case 1: //当前进度内触发（高亮色区域）
            nProgressHeight = oProgressHeight - height
            break
        case 2: //滑块触发
            nProgressHeight = oProgressHeight + thumbHeight - height
            break
    }

    const percent = nProgressHeight / sliderHeight
    updateProgress(percent)
}

let fromY = -1, dragReleaseTimer = null
const startDrag = (event) => {
    event.stopPropagation()
    onDrag = true
    dragReleasing = false
    clearTimeout(dragReleaseTimer)
    fromY = event.screenY

    document.addEventListener("mousemove", dragMove)
    document.addEventListener("mouseup", releaseDrag)
    const { onDragStart } = props
    if (onDragStart) onDragStart(value, event)
}

const dragMove = (event) => {
    if (!onDrag) return
    const { clientHeight: sliderHeight } = sliderCtlRef.value
    const oProgressHeight = (value || 0) * sliderHeight
    const { screenY: currentY } = event
    const nProgressHeight = oProgressHeight + (fromY - currentY)
    const percent = nProgressHeight / sliderHeight
    updateProgress(percent)
    fromY = currentY
    const { onDragMove } = props
    if (onDragMove) onDragMove(value, event)
}

const releaseDrag = (event) => {
    onDrag = false
    dragReleasing = true

    document.removeEventListener("mousemove", dragMove)
    document.removeEventListener("mouseup", releaseDrag)
    const { onDragRelease } = props
    if (onDragRelease) onDragRelease(value, event)

    dragReleaseTimer = setTimeout(() => {
        dragReleasing = false
    }, 1288)
}

//对外提供API
defineExpose({
    updateProgress,
    toggleProgress
})

watch(() => props.value, (nv, ov) => {
    nextTick(() => updateProgress(nv))
}, { immediate: true })
</script>

<template>
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
    background: var(--others-progressbar-bg-color);
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
    background: var(--content-text-highlight-color);
    z-index: 1;
    position: absolute;
}

.vertical-slider-bar .thumb {
    width: 13px;
    height: 13px;
    border-radius: 10rem;
    background-color: var(--content-highlight-color);
    z-index: 2;
    position: absolute;
    bottom: 50%;
}
</style>