<script setup>
import MainLeft from './DefaultMainLeft.vue';
import MainCenter from './DefaultMainCenter.vue';
import Popovers from '../Popovers.vue';

</script>

<template>
    <div class="default-layout">
        <MainLeft></MainLeft>
        <MainCenter></MainCenter>
        <Popovers></Popovers>
    </div>
</template>

<style scoped>
.default-layout {
    flex: 1;
    display: flex;
}
</style>