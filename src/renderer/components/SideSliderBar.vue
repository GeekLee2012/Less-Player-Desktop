<script setup>
import { watch, ref, onMounted } from 'vue';


//“中间 -> 单边（两边）”滑动条
const props = defineProps({
    value: Number,      //0.0 - 1.0
    disable: Boolean,
    disableScroll: Boolean,
    //属性disableOptimize，已废弃，不灵活且目前名称不够清晰易懂
    //Boolean方式虽然简单，但不够灵活
    //为确保功能更灵活、更明确，采用数据值方式
    //参见属性thumbAutoHideDelay
    //disableOptimize: Boolean, 
    onSeek: Function,
    onScroll: Function,
    onScrollFinish: Function,
    onDragStart: Function,
    onDragMove: Function,
    onDragRelease: Function,
    thumbStyle: Number,  //0 => 默认， 1 => 加大
    thumbAutoHideDelay: Number, //单位ms, 默认1000
})

const sliderCtlRef = ref(null)
const progressRef = ref(null)
const thumbRef = ref(null)
let onDrag = ref(false)
let value = parseFloat(props.value).toFixed(2)
const onUserScroll = ref(false)
let userScrollTimer = null

//点击改变进度
const seekProgress = (event) => {
    if (userScrollTimer) {
        clearTimeout(userScrollTimer)
        onUserScroll.value = false
    }
    const { disable, onSeek } = props
    if (disable) return
    if (onDrag.value) return

    const { target, offsetX } = event
    if (thumbRef.value.contains(target)) {
        updateProgressByDeltaWidth(offsetX)
    } else if (progressRef.value.contains(target)) {
        const { offsetWidth } = sliderCtlRef.value
        const sign = value > 0.5 ? 1 : -1
        const width = offsetWidth / 2 + offsetX * sign
        updateProgressByWidth(width)
    } else {
        updateProgressByWidth(offsetX)
    }

    if (onSeek) onSeek(value)
}

//滚轮改变进度
const scrollProgress = (event) => {
    onUserScroll.value = true
    if (userScrollTimer) clearTimeout(userScrollTimer)

    const { disable, disableScroll, onScroll, onScrollFinish } = props
    if (disable || disableScroll) return
    if (event.deltaY == 0) return
    const direction = event.deltaY > 0 ? -1 : 1
    const step = 1 * direction
    let tmp = value * 100
    tmp += step

    const percent = (tmp / 100).toFixed(2)
    updateProgress(percent)

    if (onScroll) onScroll(value)
    if (onScrollFinish) {
        userScrollTimer = setTimeout(() => {
            onScrollFinish(value)
            onUserScroll.value = false
        }, 200)
    } else {
        onUserScroll.value = false
    }
}

const updateProgress = (percent) => {
    percent = Number(percent) * 100
    percent = percent > 0 ? percent : 0
    percent = percent < 100 ? percent : 100

    if (percent == 50) {
        progressRef.value.style.width = '0%'
    } else if (percent > 50) {
        progressRef.value.style.width = `${percent - 50}%`
        progressRef.value.style.left = '50%'
    } else {
        progressRef.value.style.width = `${50 - percent}%`
        progressRef.value.style.left = `${percent}%`
    }
    thumbRef.value.style.left = `${percent}%`

    value = (percent / 100).toFixed(2)
}

//快捷操作
const toggleProgress = () => {
    updateProgress(value > 0 ? 0 : 1)
    return value
}

const updateProgressByWidth = (width) => {
    const { clientWidth: sliderWidth } = sliderCtlRef.value
    const percent = width / sliderWidth
    updateProgress(percent)
}

const updateProgressByDeltaWidth = (delta) => {
    //if (delta == 0) return
    const { offsetWidth: sWidth } = sliderCtlRef.value
    const { offsetWidth: pWidth } = progressRef.value
    const sign = value >= 0.5 ? 1 : -1
    const width = sWidth / 2 + (pWidth + delta) * sign
    updateProgressByWidth(width)
}

const startDrag = (event) => {
    event.stopPropagation()
    if (props.disable) return
    onDrag.value = true
    document.addEventListener("mousemove", dragMove)
    document.addEventListener("mouseup", releaseDrag)
    const { onDragStart } = props
    if (onDragStart) onDragStart(value, event)
}

const dragMove = (event) => {
    event.stopPropagation()
    if (props.disable) return
    if (!onDrag.value) return

    const { offsetLeft, clientWidth: sliderWidth } = sliderCtlRef.value
    const percent = Number(value) + event.movementX / sliderWidth

    updateProgress(percent)
    const { onDragMove } = props
    if (onDragMove) onDragMove(value, event)
}

/* 以下为拖动滑块改变进度相关 */
const releaseDrag = (event) => {
    event.stopPropagation()
    if (props.disable) return
    //onDrag.value = false
    document.removeEventListener("mousemove", dragMove)
    document.removeEventListener("mouseup", releaseDrag)
    const { onDragRelease } = props
    setTimeout(() => {
        onDrag.value = false
        if (onDragRelease) onDragRelease(value, event)
    }, 200);
}

//优化拖动体验
const thumbShow = ref(false)
let thumbHideTimer = null
const showThumb = () => {
    if (props.disable) return
    if (thumbHideTimer) clearTimeout(thumbHideTimer)
    thumbShow.value = true
}

const hideThumb = () => {
    //const delay = props.disableOptimize ? 0 : 1000

    let delay = props.thumbAutoHideDelay
    if (typeof delay == 'undefined') delay = 1000
    delay = Math.max(delay, 0)
    thumbHideTimer = setTimeout(() => {
        thumbShow.value = false
    }, delay)
}

watch(() => props.value, (nv, ov) => {
    if (onDrag.value || onUserScroll.value) return
    updateProgress(nv, ov)
}, { immediate: true })

onMounted(() => updateProgress(props.value))

//对外提供API
defineExpose({
    updateProgress,
    toggleProgress
})
</script>

<template>
    <div class="side-slider-bar" @mousewheel="scrollProgress" @mouseenter="showThumb" @mouseleave="hideThumb">
        <div class="side-slider-bar-ctl"
            :class="{ 'side-slider-bar-ctl-ondrag': onDrag, 'side-slider-bar-ctl-with-thumb': thumbShow, 'side-slider-bar-ctl-disable': disable }"
            ref="sliderCtlRef" @click.stop="seekProgress">
            <div class="progress" ref="progressRef"></div>
            <div class="thumb" :class="{ 'big-thumb': (thumbStyle == 1) }" ref="thumbRef" @mousedown.stop="startDrag">
            </div>
        </div>
    </div>
</template>

<style scoped>
.side-slider-bar {
    height: 3px;
    background: transparent;
    -webkit-app-region: none;
}

.side-slider-bar .side-slider-bar-ctl {
    height: var(--others-sliderbar-ctl-height);
    border-radius: 10rem;
    background: var(--others-progressbar-bg-color);
    cursor: pointer;
    display: flex;
    flex-direction: row;
    align-items: center;
    position: relative;
}

.side-slider-bar .side-slider-bar-ctl-disable {
    cursor: default;
}

.side-slider-bar .progress {
    width: 0%;
    height: 100%;
    border-radius: 10rem;
    background: var(--content-text-highlight-color);
    z-index: 1;
    position: absolute;
    left: 50%;
}

.side-slider-bar .thumb {
    width: 13px;
    height: 13px;
    border-radius: 10rem;
    /*background-color: var(--others-volumebar-thumb-color);*/
    background-color: var(--content-highlight-color);
    z-index: 2;
    position: absolute;
    left: 0%;
    -webkit-app-region: none;
    visibility: visible;
}

.side-slider-bar .big-thumb {
    border: 1px solid var(--content-highlight-color);
}

/*.side-slider-bar:hover .thumb,*/
.side-slider-bar .side-slider-bar-ctl-with-thumb .thumb,
.side-slider-bar .side-slider-bar-ctl-ondrag .thumb {
    visibility: visible;
}
</style>