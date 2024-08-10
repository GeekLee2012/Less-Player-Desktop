<script setup>
import DefaultMainLeft from './DefaultMainLeft.vue';
import DefaultMainCenter from './DefaultMainCenter.vue';
import Popovers from '../Popovers.vue';
import ClassicMainBottom from './ClassicMainBottom.vue';

</script>

<template>
    <div class="default-layout default-new-layout">
        <div class="center">
            <DefaultMainLeft></DefaultMainLeft>
            <DefaultMainCenter></DefaultMainCenter>
        </div>
        <div class="bottom">
            <ClassicMainBottom></ClassicMainBottom>
        </div>
        <Popovers></Popovers>
    </div>
</template>

<style>
.default-new-layout {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.default-new-layout > .center {
    display: flex;
    flex: 1;
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

.default-new-layout > .center #main-left .bottom {
    display: none;
}

.default-new-layout > .center #default-main-bottom {
    display: none;
}

.default-new-layout > .bottom {
    height: 82px;
}

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
    /*border-radius: 10rem;*/
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


/*
.default-new-layout > .bottom .classic-main-bottom .play-ctl .play-btn svg {
    width: 66;
    height: 66;
}
*/
</style>