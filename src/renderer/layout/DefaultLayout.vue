<script setup>
import DefaultMainLeft from './DefaultMainLeft.vue';
import DefaultMainCenter from './DefaultMainCenter.vue';
import Popovers from '../Popovers.vue';
</script>

<template>
    <div class="default-layout">
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