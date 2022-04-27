<script setup>
import { ref } from 'vue';

const props = defineProps({
    initValue: Number,
    onseek: Function
})

const sliderRef = ref(null)
const progressRef = ref(null)
const thumbRef = ref(null)
let onDrag = false
let fromX = -1
let value = props.initValue

const seekProgress = (e)=> {
    if(thumbRef.value.contains(e.target)) {
        updateProgressByDelta(e.offsetX)
    } else {
        updateProgressByWidth(e.offsetX)
    }
    if(props.onseek) {
        props.onseek(value)
    }
}

const updateProgress = (percent) => {
    percent = percent * 100
    percent = percent > 0 ? percent : 0
    percent = percent < 100 ? percent : 100
    //console.log("adjust percent: " + percent)
    progressRef.value.style.width = percent + "%"
    thumbRef.value.style.left = percent + "%"
    value = (percent / 100).toFixed(2)
}

const toggleProgress = () => {
    updateProgress(value > 0 ? 0 : 1)
    return value
}

const updateProgressByWidth = (width) => {
    const totalWidth = sliderRef.value.offsetWidth
    let percent = width / totalWidth
    //console.log("percent: " + percent)
    updateProgress(percent)
}

const updateProgressByDelta = (delta) => {
    if(delta == 0) return 
    const totalWidth = sliderRef.value.offsetWidth
    const oPercent = parseFloat(progressRef.value.style.width.replace('%', '')) / 100
    if(isNaN(oPercent)) return 
    let oWidth = totalWidth * oPercent
    //console.log("old: " + oPercent + ", width: " + oWidth + ", delta: " + delta)
    updateProgressByWidth(oWidth + delta)
}

const startDrag = (e)=> {
    onDrag = true
    fromX = e.screenX

    console.log("->")
}

const endDrag = (e)=> {
    onDrag = false
    fromX = -1

    console.log("[-")
}

const dragProgress = (e)=> {
    //e.preventDefault()
    //e.stopPropagation()
    if(onDrag) {
        //console.log(e)
        const deltaX = e.screenX - fromX
        console.log(deltaX)
        updateProgressByDelta(deltaX)
        fromX = e.screenX
    }
}

defineExpose({
    updateProgress,
    toggleProgress
})

</script>

<template>
    <div class="slider-bar" ref="sliderRef" @click="seekProgress">
        <div class="progress" ref="progressRef"></div>
        <div class="thumb" ref="thumbRef" @mousedown="startDrag"></div>
    </div>
</template>

<style scoped>
.slider-bar {
    height: 10px;
    border-radius: 10rem;
    background: linear-gradient(to right, #464646, #666) !important;
    cursor: pointer;
    display: flex;
    flex-direction: row;
    align-items: center;
    position: relative;
}

.slider-bar, 
.slider-bar .progress, 
.slider-bar .thumb {
    -webkit-app-region: none;
}

.slider-bar .progress {
    width: 50%;
    height: 3px;
    border-radius: 10rem;
    background: linear-gradient(to top right, #28c83f, #1ca388);
    z-index: 1;
    position: absolute;
}

.slider-bar .thumb {
    width: 10px;
    height: 10px;
    border-radius: 10rem;
    background-color: var(--text-color);
    z-index: 2;
    position: absolute;
    left: 50%;
}
</style>