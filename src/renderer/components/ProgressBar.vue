<script setup>
import { onMounted, ref, watch } from 'vue';
import { smoothAnimation } from '../../common/Utils';



const barRef = ref(null)
const barValueRef = ref(null)

const props = defineProps({
    value: Number,
    seekable: Boolean,
    onseek: Function,
    smooth: Boolean
})

const seek = (e) => {
    if (!props.seekable) return
    const offsetX = e.offsetX
    const offsetWidth = barRef.value.offsetWidth
    const percent = (offsetX / offsetWidth).toFixed(3)
    updateProgress(percent)
    if (props.onseek) props.onseek(percent)
}

//太耗性能，玩不起
const smoothUpdate = (dest, start) => {
    const target = barValueRef.value
    smoothAnimation(target, start, dest, 300, 10, (value => {
        target.style.width = value + "%"
    }))
}

const updateProgress = (percent, prevPercent) => {
    percent = percent * 100
    barValueRef.value.style.width = percent + "%"
}
/*
const updateProgress = (percent, prevPercent) => {
    prevPercent = prevPercent || percent
    percent = percent * 100
    prevPercent = prevPercent * 100
    if (props.smooth) {
        smoothUpdate(percent, prevPercent)
    } else {
        barValueRef.value.style.width = percent + "%"
    }
}
*/

watch(() => props.value, (nv, ov) => {
    updateProgress(nv, ov)
})

onMounted(() => updateProgress(props.value))

defineExpose({ updateProgress })
</script>

<template>
    <div class="progressbar" :class="{ handcur: seekable }" ref="barRef" @click.stop="seek">
        <div class="progress" ref="barValueRef"></div>
    </div>
</template>

<style scoped>
.progressbar {
    height: var(--others-progressbar-height);
    border-radius: 10rem;
    /*background: linear-gradient(to right, #464646, #666) !important;*/
    background: var(--others-progressbar-bg-color);
    -webkit-app-region: none;
}

.progressbar .progress {
    width: 0%;
    height: 100%;
    border-radius: 10rem;
    background: var(--content-text-highlight-color);
}

.handcur {
    cursor: pointer;
}
</style>