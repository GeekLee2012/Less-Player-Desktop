<script setup>
import DefaultMainLeft from './DefaultMainLeft.vue';
import DefaultMainCenter from './DefaultMainCenter.vue';
import AppPopovers from '../AppPopovers.vue';
import ClassicMainBottom from './ClassicMainBottom.vue';
import DefaultNewMainBottom from './DefaultNewMainBottom.vue';

</script>

<template>
    <div class="default-layout default-new-layout">
        <div class="center">
            <DefaultMainLeft></DefaultMainLeft>
            <DefaultMainCenter></DefaultMainCenter>
        </div>
        <div class="bottom">
            <DefaultNewMainBottom></DefaultNewMainBottom>
        </div>
        <AppPopovers></AppPopovers>
    </div>
</template>

<style>
.default-new-layout {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    --main-bottom-height: 88px;
}

.default-new-layout > .center {
    flex: 1;
    display: flex;
    overflow: auto;
}

.default-new-layout > .center #main-left .header {
    flex-direction: column;
    margin-bottom: 52px;
}

.default-new-layout > .center #main-left .top-logo {
    margin-top: 41px;
    margin-left: 20px;
}

/*
.default-new-layout > .center #main-left .top-logo .app-name {
    font-size: 23px;
}
*/

.default-new-layout > .center #main-left .bottom,
.default-new-layout > .center #default-main-bottom {
    display: none;
}

.default-new-layout > .bottom {
    height: var(--main-bottom-height);
}


/* classic main bottom */
.default-new-layout > .bottom .classic-main-bottom {
    padding-top: 0px !important;
    background: var(--content-bg-color);
}

.default-new-layout > .bottom .classic-main-bottom .play-ctl .spacing {
    margin-left: 23px;
}

.default-new-layout > .bottom .classic-main-bottom .play-ctl .play-btn {
    height: 45px;
    width: 45px;
}

.default-new-layout > .bottom .classic-main-bottom #play-nav {
    padding-left: 20px;
}

.default-new-layout > .bottom .classic-main-bottom #play-nav .cover-wrap,
.default-new-layout > .bottom .classic-main-bottom #play-nav .audio-cover,
.default-new-layout > .bottom .classic-main-bottom #play-nav .cover-mask {
    width: 50px !important;
    height: 50px !important;
}

/* default new bottom */
.default-new-layout > .bottom .default-new-main-bottom .play-ctl .play-btn {
    height: 39px;
    width: 39px;
}

.default-new-layout > .bottom .default-new-main-bottom .play-ctl .play-btn:hover {
    transform: scale(1.05);
}

.default-new-layout > .bottom .default-new-main-bottom .play-ctl .spacing {
    margin-left: 25px !important;
}

.default-new-layout > .bottom .default-new-main-bottom #play-nav {
    padding-left: 18px;
}

.default-new-layout > .bottom .default-new-main-bottom #play-nav .cover-wrap,
.default-new-layout > .bottom .default-new-main-bottom #play-nav .audio-cover,
.default-new-layout > .bottom .default-new-main-bottom #play-nav .cover-mask {
    width: 60px !important;
    height: 60px !important;
}
</style>