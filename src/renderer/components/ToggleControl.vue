<script setup>
import { toRef } from 'vue';



const props = defineProps({
    value: Boolean,
    disabled: Boolean
})

const active = toRef(props, 'value')
</script>

<template>
    <div class="toggle-ctl" :class="{ 'toggle-ctl-active': active }" @click.stop="">
        <div class="thumb"></div>
    </div>
</template>

<style>
.toggle-ctl {
    /*
    --button-toggle-btn-bg-color: var(--content-secondary-text-color);
    --button-toggle-btn-thumb-color: var(--button-icon-text-btn-text-color);
    */
    width: 40px;
    height: 20px;
    /*border-radius: 10rem;*/
    border-radius: var(--border-btn-border-radius);
    border: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    justify-content: center;
    cursor: pointer;
    background: var(--button-toggle-btn-bg-color);
}

.toggle-ctl .thumb {
    margin: 1px;
    width: 16px;
    height: 16px;
    /*border-radius: 10rem;*/
    border-radius: var(--border-btn-border-radius);
    background: var(--button-toggle-btn-thumb-color);
}

.toggle-ctl-active {
    background: var(--button-icon-text-btn-bg-color);
    align-items: flex-end;
}

.toggle-ctl-active .thumb {
    background: var(--button-icon-text-btn-text-color) !important;
}
</style>