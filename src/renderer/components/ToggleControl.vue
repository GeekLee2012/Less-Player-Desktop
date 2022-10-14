<script setup>
import { ref } from 'vue';
const props = defineProps({
    value: Boolean
})

const active = ref(props.value || false)

const toggle = () => {
    active.value = !active.value
}
</script>

<template>
    <div class="toggle-ctl" :class="{ 'toggle-ctl-active': active }" @click.stop="toggle">
        <div class="thumb"></div>
    </div>
</template>

<style>
.toggle-ctl {
    width: 40px;
    height: 20px;
    border-radius: 10rem;
    border: 1px solid var(--toggle-btn-border-color);
    display: flex;
    flex-direction: column;
    justify-content: center;
    cursor: pointer;
    background: var(--toggle-btn-bg);
}

.toggle-ctl .thumb {
    margin: 1px;
    width: 16px;
    height: 16px;
    border-radius: 10rem;
    background: var(--toggle-thumb-bg);
}

.toggle-ctl-active {
    background: var(--toggle-btn-active-bg);
    align-items: flex-end;
}

.toggle-ctl-active .thumb {
    background: var(--toggle-active-thumb-bg) !important;
}
</style>