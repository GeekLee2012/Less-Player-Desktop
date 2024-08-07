<script setup>
import DefaultMainLeft from './DefaultMainLeft.vue';
import DefaultMainCenter from './DefaultMainCenter.vue';
import Popovers from '../Popovers.vue';
import { useSettingStore } from '../store/settingStore';
import { storeToRefs } from 'pinia';



const { isDefaultOldLayout, } = storeToRefs(useSettingStore())
</script>

<template>
    <div class="default-layout" :class="{ 'default-old-layout': isDefaultOldLayout }" >
        <DefaultMainLeft></DefaultMainLeft>
        <DefaultMainCenter></DefaultMainCenter>
        <Popovers></Popovers>
    </div>
</template>

<style scoped>
.default-layout {
    flex: 1;
    display: flex;
}
</style>