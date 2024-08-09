<script setup>
import { watch, ref, onMounted, onUnmounted, onActivated, onDeactivated } from 'vue';
import { nextInt, randomTextWithinAlphabet } from '../../common/Utils';


//TODO 组件写得复杂化了，且效果一般
const props = defineProps({
    keyName: String,
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
    thumbStyle: Number,  //0 => 默认， 1 => 加大, 2 - logo形状
    thumbAutoHideDelay: Number, //单位ms, 默认1000
    scopeType: Number //类型，主界面为0，非主界面为1（比如弹窗）
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

    const { target, offsetX } = event
    if (thumbRef.value.contains(target)) {
        updateProgressByDeltaWidth(offsetX)
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
    percent = percent * 100
    percent = percent > 0 ? percent : 0
    percent = percent < 100 ? percent : 100

    if(progressRef.value) progressRef.value.style.width = `${percent}%`
    if(thumbRef.value) thumbRef.value.style.left = `${percent}%`

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
    if (delta == 0) return
    const totalWidth = sliderCtlRef.value.offsetWidth
    const oPercent = parseFloat(progressRef.value.style.width.replace('%', '')) / 100
    if (isNaN(oPercent)) return
    let oWidth = totalWidth * oPercent
    updateProgressByWidth(oWidth + delta)
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
    let percent = value
    const { offsetLeft, clientWidth: sliderWidth } = sliderCtlRef.value
    if (props.scopeType === 1) {
        percent = Number(value) + event.movementX / sliderWidth
    } else {
        percent = (event.clientX - offsetLeft) / sliderWidth
    }
    updateProgress(percent)
    const { onDragMove } = props
    if (onDragMove) onDragMove(value, event)
}

/* 以下为拖动滑块改变进度相关 */
const releaseDrag = (event) => {
    event.stopPropagation()
    if (props.disable) return
    onDrag.value = false
    document.removeEventListener("mousemove", dragMove)
    document.removeEventListener("mouseup", releaseDrag)
    const { onDragRelease } = props
    if (onDragRelease) onDragRelease(value, event)
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


/* 生命周期、监听 */
const watches = {}
const onWatches = () => {
    const watchKey = props.keyName || ('slider-' + Date.now())
    watches[watchKey] = watch(() => props.value, (nv, ov) => {
        if (onDrag.value || onUserScroll.value) return
        updateProgress(nv, ov)
    }, { immediate: true })
}

const unWatches = () => {
    Object.entries(watches).forEach(([key, unwatch]) => unwatch())
}

onMounted(() => onWatches())
onUnmounted(() => unWatches())

//对外提供API
defineExpose({
    updateProgress,
    toggleProgress
})
</script>

<template>
    <div class="slider-bar" @mousewheel="scrollProgress" @mouseenter="showThumb" @mouseleave="hideThumb">
        <div class="slider-bar-ctl"
            :class="{ 'slider-bar-ctl-ondrag': onDrag, 'slider-bar-ctl-with-thumb': thumbShow, 'slider-bar-ctl-disable': disable }"
            ref="sliderCtlRef" @click="seekProgress">
            <div class="progress" ref="progressRef"></div>
            <div class="thumb" :class="{ 'big-thumb': (thumbStyle == 1), 'logo-thumb': (thumbStyle == 2) }" ref="thumbRef" @mousedown="startDrag">
            </div>
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

.slider-bar .slider-bar-ctl-disable {
    cursor: default;
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
    width: 13px;
    height: 13px;
    border-radius: 10rem;
    /*border-top-right-radius: 0rem;*/
    /*background-color: var(--others-volumebar-thumb-color);*/
    background-color: var(--content-highlight-color);
    z-index: 2;
    position: absolute;
    left: 0%;
    -webkit-app-region: none;
    visibility: hidden;
}

.slider-bar .big-thumb {
    border: 1px solid var(--content-highlight-color);
}

.slider-bar .logo-thumb {
    border-top-right-radius: 0rem;
    /*
    background: url('/public/deco_1001.png');
    background-size: contain;
    width: 36px;
    height: 36px;
    */
}

/*.slider-bar:hover .thumb,*/
.slider-bar .slider-bar-ctl-with-thumb .thumb,
.slider-bar .slider-bar-ctl-ondrag .thumb {
    visibility: visible;
}
</style>