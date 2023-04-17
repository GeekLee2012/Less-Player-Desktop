<script setup>
import { onMounted } from 'vue';

const props = defineProps({
    current: String,
    duration: String
})
</script>

<template>
    <div class="audio-time">
        <span class="t-current">{{ current }}</span>
        <span class="t-sp">/</span>
        <span class="t-duration">{{ duration }}</span>
    </div>
</template>

<style scoped>
.audio-time span {
    vertical-align: middle;
    text-align: left;
}

.audio-time .t-sp {
    text-align: center;
    padding-left: 3px;
    padding-right: 3px;
}
</style>