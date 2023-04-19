<script setup>
import { onMounted, ref, watch } from 'vue';



const barRef = ref(null)
const barValueRef = ref(null)

const props = defineProps({
    value: Number,
    seekable: Boolean,
    onseek: Function
})

const seek = (e) => {
    if (!props.seekable) return
    const offsetX = e.offsetX
    const offsetWidth = barRef.value.offsetWidth
    const percent = (offsetX / offsetWidth).toFixed(3)
    updateProgress(percent)
    if (props.onseek) props.onseek(percent)
}

const updateProgress = (percent) => {
    percent = percent * 100
    barValueRef.value.style.width = percent + "%"
}

watch(() => props.value, (nv, ov) => {
    updateProgress(nv)
})

onMounted(() => updateProgress(props.value))

defineExpose({ updateProgress })
</script>

<template>
    <div class="progress-bar" :class="{ handcur: seekable }" ref="barRef" @click="seek">
        <div class="progress" ref="barValueRef"></div>
    </div>
</template>

<style scoped>
.progress-bar {
    height: 3px;
    border-radius: 10rem;
    /*background: linear-gradient(to right, #464646, #666) !important;*/
    background: var(--progress-track-bg);
    -webkit-app-region: none;
}

.progress-bar .progress {
    width: 0%;
    height: 100%;
    border-radius: 10rem;
    background: var(--hl-text-bg);
    background: var(--progress-bg);
}

.handcur {
    cursor: pointer;
}
</style>