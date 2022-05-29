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
    border: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    justify-content: center;
    cursor: pointer;
    background-color: #a0a0a0;
}

.toggle-ctl .thumb {
    margin: 1px;
    width: 16px;
    height: 16px;
    border-radius: 10rem;
    border: 1px solid transparent;
    background-color: var(--text-color);
}

.toggle-ctl-active {
    background-color: var(--text-color);
    align-items: flex-end;
}

.toggle-ctl-active .thumb {
    background: var(--btn-bg) !important;
}
</style>