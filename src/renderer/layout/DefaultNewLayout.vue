<script setup>
import { storeToRefs } from 'pinia';
import { useSettingStore } from '../store/settingStore';
import DefaultMainLeft from './DefaultMainLeft.vue';
import DefaultMainCenter from './DefaultMainCenter.vue';
import AppPopovers from '../AppPopovers.vue';
import DefaultNewMainBottom from './DefaultNewMainBottom.vue';



const { isFontAutoWeight, isMiniNavBarMode } = storeToRefs(useSettingStore())
</script>

<template>
    <div class="default-layout default-new-layout"
        :class="{
            'contrast-mode': isFontAutoWeight,
            'mini-navbar-mode': isMiniNavBarMode
        }">
        <div class="center">
            <DefaultMainLeft :hideBottom="true"></DefaultMainLeft>
            <DefaultMainCenter :hideBottom="true"></DefaultMainCenter>
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
    --main-bottom-height: 90px;
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
    margin-top: 39px;
    margin-left: 20px;
}


.default-new-layout > .bottom {
    height: var(--main-bottom-height);
    background: var(--content-bg-color);
    display: flex;
    flex-direction: column;
    justify-content: center;
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
    height: 47px;
    width: 47px;
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
.default-new-layout > .bottom .default-new-main-bottom .play-ctl .spacing {
    margin-left: 28px !important;
}

.default-new-layout > .bottom .default-new-main-bottom svg {
    transform: scale(1.06);
}

.default-new-layout > .bottom .default-new-main-bottom .love-btn svg {
    transform: translateY(0.5px);
}

.default-new-layout > .bottom .default-new-main-bottom .lyric-btn svg {
    transform: scaleY(1.16);
}

.default-new-layout > .bottom .default-new-main-bottom .equalizer-btn svg {
    transform: scale(1.01);
}

/*
.default-new-layout > .bottom .default-new-main-bottom .equalizer-btn svg {
    transform: scale(1);
}
*/

.default-new-layout > .bottom .default-new-main-bottom .play-ctl svg {
    transform: scale(1.05);
}

/*
.default-new-layout > .bottom .default-new-main-bottom .play-ctl .play-btn {
    transform: scale(1.06);
}
*/

.default-new-layout > .bottom .default-new-main-bottom #play-nav {
    /*padding-left: 18px;*/
    padding-left: 21px;
}

.default-new-layout > .bottom .default-new-main-bottom #play-nav .cover-wrap,
.default-new-layout > .bottom .default-new-main-bottom #play-nav .audio-cover,
.default-new-layout > .bottom .default-new-main-bottom #play-nav .cover-mask {
    width: 56px !important;
    height: 56px !important;
}

.default-new-layout > .bottom .default-new-main-bottom #play-nav .title-wrap {
    height: 50px !important;
}

.default-new-layout.mini-navbar-mode > .center #main-left .top-logo {
    /*margin-top: 41px;*/
    margin-left: 0px;
}
</style>