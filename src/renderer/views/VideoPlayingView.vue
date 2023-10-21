<script setup>
import { inject, onActivated, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';
import { usePlayStore } from '../store/playStore';
import EventBus from '../../common/EventBus';
import WinTrafficLightBtn from '../components/WinTrafficLightBtn.vue';
import { useUseCustomTrafficLight } from '../../common/Utils';
import WinNonMacOSControlBtn from '../components/WinNonMacOSControlBtn.vue';



const { useWindowsStyleWinCtl } = inject('appCommon')

//是否使用自定义交通灯控件
const useCustomTrafficLight = useUseCustomTrafficLight()

const { hideVideoPlayingView, normalize } = useAppCommonStore()
const { isMaxScreen, videoPlayingViewShow } = storeToRefs(useAppCommonStore())
const { isSimpleLayout, isQuitVideoAfterEndedEnable } = storeToRefs(useSettingStore())
const { videoSrc } = storeToRefs(usePlayStore())
const { setVideoSrc } = usePlayStore()


const initVideoPlayer = () => {
    const videoEls = document.querySelectorAll('.video-holder')
    let index = 0 //正常情况，只有 1个
    //异常情况
    if (videoEls.length == 2) index = isSimpleLayout.value ? 0 : 1
    EventBus.emit('video-init', videoEls[index])
}

const stopVideo = (callback) => {
    if (videoSrc.value) {
        setVideoSrc(null)
        EventBus.emit('video-stop')
    }
    if (callback && typeof (callback) == 'function') callback()
}

const quitVideo = (callback) => {
    if (!videoPlayingViewShow.value) return stopVideo()
    normalize()
    setTimeout(() => {
        hideVideoPlayingView()
        stopVideo(callback)

        sidebarShow.value = false
    }, 666)
}

const sidebarShow = ref(false)
const toggleSidebarShow = () => sidebarShow.value = !sidebarShow.value

EventBus.on("app-beforeRoute", quitVideo)
EventBus.on("video-ended", event => {
    if (isQuitVideoAfterEndedEnable.value) quitVideo()
})

onActivated(initVideoPlayer)
</script>

<template>
    <div class="video-playing-view">
        <div class="header">
            <div class="win-ctl-wrap" v-show="!useWindowsStyleWinCtl">
                <WinTrafficLightBtn :hideMaxBtn="isSimpleLayout" :showCollapseBtn="true" :collapseAction="quitVideo">
                </WinTrafficLightBtn>
            </div>
            <div class="action" :class="{ 'winstyle-action': useWindowsStyleWinCtl }" v-show="false">
                <div class="list-btn text-btn btn">
                    <svg width="20" height="20" viewBox="0 0 853.72 597.61" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M426.61,85.57q-190,0-379.93,0C28.3,85.62,13.75,78.93,5,62.38-10.17,33.53,10.85.27,44.37.11,87.52-.1,130.68.05,173.84.05q316.7,0,633.4,0c14.25,0,26.73,4,36,15.17,11.31,13.69,13.64,29.22,6.27,45.33-7.78,17-22,24.94-40.43,25-33.66.13-67.32,0-101,0Z" />
                                <path
                                    d="M597.58,426.29q0-63.24,0-126.48c0-23.54,15.67-41,39-43.45,11.28-1.21,21.31,2.4,30.32,9.17q48.34,36.32,96.74,72.57c23.58,17.68,47.22,35.29,70.75,53.06C854,405.93,859.31,429.57,847,449a52.32,52.32,0,0,1-12.55,13.33q-83.76,63.21-167.86,126c-26.14,19.51-61.85,6-68.28-25.54a56.17,56.17,0,0,1-.72-10.94Q597.55,489,597.58,426.29Z" />
                                <path
                                    d="M277.61,256.05q116,0,232,0c21,0,37.47,11.44,43.21,29.83,8.84,28.27-11.83,55.54-42.45,55.63-46.16.14-92.33,0-138.49,0q-163,0-326,0c-18.41,0-32.75-7.17-41.19-23.9-14.6-28.91,6.53-61.44,39.93-61.58,38.17-.15,76.33,0,114.49,0Z" />
                                <path
                                    d="M277.31,512.06q116,0,232,0c21.39,0,37.83,11.39,43.56,30,8.66,28.14-11.86,55.25-42.21,55.44-31,.19-62,0-93,0H46.2c-20.87,0-36.72-10.16-43.28-27.66-10.76-28.69,10.22-57.75,41.92-57.81q80-.14,160,0Z" />
                            </g>
                        </g>
                    </svg>
                    <span v-show="false">当前播放</span>
                </div>
                <div class="search-video-btn btn spacing">
                    <svg width="25" height="21" viewBox="0 0 1024 753.07" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M0,110.05c1.62-7.78,2.77-15.69,4.93-23.3C19.26,36.32,65.9.28,118.3.17q208.5-.44,417-.13,123,0,246,0c60.07,0,108.83,40,120.19,98.93a127.69,127.69,0,0,1,2,23.86c.17,59,.1,118,.09,177,0,1.62-.15,3.23-.26,5.55-58.91-34.91-120.89-43.71-186.17-24.34-43,12.76-78.82,36.91-107.48,71.34-33.35,40.06-50.86,86.38-52.32,138.44-1.45,51.83,13.72,98.73,44.87,141.67h-6.26q-236.75,0-473.49,0C63.1,632.42,15.18,594,2.59,536.74c-1-4.53-1.73-9.12-2.59-13.68Zm376.79,86V436.57L569.08,316.29Z" />
                                <path
                                    d="M1024,728.06c-.36.91-.79,1.79-1.06,2.72-6.69,22.72-34,29.9-50.63,13-15.63-15.94-30.76-32.37-46.1-48.59q-26.28-27.78-52.55-55.56c-.68-.72-1.44-1.37-2.3-2.17-43.23,25.74-89.08,32.37-137.31,17.68-39.13-11.92-69.48-35.85-91.44-70.34-42.77-67.15-29.78-158.62,29.93-211.12,62.14-54.64,153.15-56.34,215.9-4.57C953.1,422.43,971,521.42,915.86,596.5c9.06,9.61,18.16,19.29,27.28,28.94,23.7,25.06,47.57,50,71,75.29,4.23,4.57,6.63,10.84,9.88,16.33ZM888.39,497.27A105.32,105.32,0,1,0,783,602.3,105.22,105.22,0,0,0,888.39,497.27Z" />
                            </g>
                        </g>
                    </svg>
                </div>
            </div>
            <div class="win-ctl-wrap" v-show="useWindowsStyleWinCtl">
                <WinNonMacOSControlBtn :showCollapseBtn="true" :collapseAction="quitVideo" :isMaximized="isMaxScreen">
                </WinNonMacOSControlBtn>
            </div>
        </div>
        <div class="center">
            <video class="video-holder" controls controlslist="nodownload" disablepictureinpicture="true"
                disableRemotePlayback="true">
                <source :src="videoSrc" type="video/mp4">
            </video>
        </div>
        <div class="sidebar-btn" :class="{ 'sidebar-collapse-btn': sidebarShow }" @click="toggleSidebarShow">
            <svg width="18" height="18" v-show="!sidebarShow" viewBox="0 0 455.71 818.05"
                xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <path
                            d="M101.17,405.1c2.89,1.94,5,2.89,6.47,4.41Q274.29,576.23,440.9,743c13.06,13.06,18.24,28.17,12.47,46-9.58,29.54-46.92,38.79-69.57,17.37-7.87-7.44-15.35-15.29-23-23L15.22,437.44C-5,417.2-5.07,392.34,15,372.23Q193.44,193.58,371.81,14.88C380.93,5.74,391.29-.19,404.44,0c17.18.25,30.24,8,37.94,23.27,7.79,15.43,6.19,30.66-3.89,44.78a60.83,60.83,0,0,1-6.7,7.4Q269.45,238,107.05,400.5C105.77,401.78,104.18,402.76,101.17,405.1Z" />
                    </g>
                </g>
            </svg>
            <svg width="18" height="18" v-show="sidebarShow" viewBox="0 0 455.71 818.08" xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <g id="Layer_2-2" data-name="Layer 2">
                            <g id="Layer_1-2-2" data-name="Layer 1-2">
                                <path
                                    d="M354.54,413c-2.89-1.94-5-2.89-6.47-4.41Q181.42,241.85,14.81,75.08C1.75,62-3.43,46.91,2.34,29.08,11.92-.46,49.26-9.71,71.91,11.71c7.87,7.44,15.35,15.29,23,23L440.49,380.64c20.22,20.24,20.29,45.1.22,65.21Q262.27,624.5,83.9,803.2c-9.12,9.14-19.48,15.07-32.63,14.88-17.18-.25-30.24-8-37.94-23.27C5.54,779.38,7.14,764.15,17.22,750a61.07,61.07,0,0,1,6.7-7.4q162.34-162.55,324.74-325C349.94,416.3,351.53,415.32,354.54,413Z" />
                            </g>
                        </g>
                    </g>
                </g>
            </svg>
        </div>
        <div class="sidebar" v-show="sidebarShow">
            <span>路漫漫其修远兮，<br> 吾将上下而求索！</span>
        </div>
    </div>
</template>

<style>
.video-playing-view {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    --view-bg: #000;
    --sidebar-btn-bg: #373737;
    --sidebar-bg: var(--sidebar-btn-bg);
    --sidebar-btn-svg-color: #fff;
    --sidebar-collapse-btn-svg-color: #fff;
    background: var(--view-bg);
}

.video-playing-view .spacing {
    margin-left: 20px;
}

.video-playing-view .header {
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 56px;
    min-height: 56px;
    display: flex;
    align-items: center;
    -webkit-app-region: drag;
    /*z-index: 89;*/
    z-index: 90;
    background: var(--view-bg);
}

.video-playing-view .header .win-ctl-wrap {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    /*width: 105px;*/
    margin-left: var(--others-win-ctl-margin-left);
}

.video-playing-view .header .action {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    flex: 1;
    padding-right: 20px;
}

.video-playing-view .header .winstyle-action {
    padding-right: 202px;
    padding-bottom: 8px;
}

.video-playing-view .header .action .btn {
    color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
}

.video-playing-view .search-video-btn svg {
    position: relative;
    top: 2px;
}

.video-playing-view .search-video-btn svg,
.video-playing-view .list-btn svg {
    fill: #fff;
    stroke: #fff;
}

.video-playing-view .header .action .text-btn:hover {
    color: var(--content-highlight-color);
}

.video-playing-view .header .action .text-btn:hover svg {
    fill: var(--content-highlight-color);
    stroke: var(--content-highlight-color);
}

.video-playing-view .header svg:hover,
.video-playing-view .collapse-btn:hover,
.video-playing-view .collapse-btn:hover svg {
    fill: var(--content-highlight-color) !important;
    cursor: pointer;
}

.video-playing-view .collapse-btn svg {
    fill: #fff !important;
    stroke: #fff !important;
}

.video-playing-view .center {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--view-bg);
}

.video-playing-view .center video {
    flex: 1;
    width: 100%;
    background: var(--view-bg);
}

.video-playing-view .sidebar-btn {
    position: absolute;
    right: 0px;
    top: calc(50% - 57px);
    width: 30px;
    height: 114px;
    background: var(--sidebar-btn-bg);
    display: flex;
    justify-content: center;
    align-items: center;
    visibility: hidden;
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
    z-index: 99;
    opacity: 0.68;
    cursor: pointer;
}

.video-playing-view:hover .sidebar-btn {
    visibility: visible;
}

.video-playing-view .sidebar-btn svg {
    fill: var(--sidebar-btn-svg-color);
}

.video-playing-view .sidebar-btn:hover {
    opacity: 1;
}

.video-playing-view .sidebar-collapse-btn {
    visibility: visible;
    right: 403px;
    opacity: 1;
    z-index: 100;
    background: var(--sidebar-bg);
    /*
    border-right: 1px solid transparent;
    box-shadow: -3px 0px 3px #222;
    */
}

.video-playing-view .sidebar-collapse-btn svg {
    fill: var(--sidebar-collapse-btn-svg-color);
}

.video-playing-view .sidebar {
    position: absolute;
    right: 0px;
    top: 0px;
    display: flex;
    background: var(--sidebar-bg);
    width: 404px;
    height: 100%;
    z-index: 99;
    box-shadow: -1px 0px 3px #000;

    color: var(--sidebar-collapse-btn-svg-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--content-text-module-title3-size);
    line-height: 43px;
}
</style>