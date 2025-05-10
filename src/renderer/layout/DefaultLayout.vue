<script setup>
import { storeToRefs } from 'pinia';
import { useSettingStore } from '../store/settingStore';
import DefaultMainLeft from './DefaultMainLeft.vue';
import DefaultMainCenter from './DefaultMainCenter.vue';
import AppPopovers from '../AppPopovers.vue';



const { isDefaultOldLayout, isFontAutoWeight, isMiniNavBarMode } = storeToRefs(useSettingStore())
</script>

<template>
    <div class="default-layout" 
        :class="{ 
            'default-old-layout': isDefaultOldLayout,
            'contrast-mode': isFontAutoWeight,
            'mini-navbar-mode': isMiniNavBarMode
        }" >
        <DefaultMainLeft></DefaultMainLeft>
        <DefaultMainCenter></DefaultMainCenter>
        <AppPopovers></AppPopovers>
    </div>
</template>

<style scoped>
.default-layout {
    flex: 1;
    display: flex;
    overflow: hidden;
}
</style>