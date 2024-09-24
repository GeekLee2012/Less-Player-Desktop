<script setup>
import { computed } from 'vue';

const props = defineProps({
    current: String,
    duration: String,
    hideDuration: Boolean,
})
</script>

<template>
    <div class="audio-time">
        <span class="t-current" v-html="current"></span>
        <span class="t-sp" v-show="!hideDuration">/</span>
        <span class="t-duration" v-show="!hideDuration" v-html="duration"></span>
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