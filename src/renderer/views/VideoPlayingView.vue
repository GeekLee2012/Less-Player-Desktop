<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlatformStore } from '../store/platformStore';
import { useAppCommonStore } from '../store/appCommonStore';
import EventBus from '../../common/EventBus';
import WinTrafficLightBtn from '../components/WinTrafficLightBtn.vue';
import { useUserProfileStore } from '../store/userProfileStore';
import { useUseCustomTrafficLight } from '../../common/Utils';

//是否使用自定义交通灯控件
const useCustomTrafficLight = useUseCustomTrafficLight()

const { videoPlayingViewShow } = storeToRefs(useAppCommonStore())
const { hideVideoPlayingView, minimize, showToast } = useAppCommonStore()
const { getVendor } = usePlatformStore()

const initVideoPlayer = () => {
    EventBus.emit('video-init', document.querySelector('.video-holder'))
}

const loadVideo = (platform, id) => {
    const vendor = getVendor(platform)
    if(!vendor) return 
    const quality = '1080'
    vendor.videoDetail(id, quality).then(result => {
        if(!result.url || result.url.trim().length < 1) return 
        EventBus.emit('video-play', result)
    })
}

const quitVideo = () => {
    EventBus.emit('video-stop')
    hideVideoPlayingView()
}

EventBus.on('video-load', ({ platform , id }) => loadVideo(platform, id))

onMounted(() => initVideoPlayer())
</script>

<template>
    <div class="video-playing-view">
        <div class="header">
            <WinTrafficLightBtn v-show="useCustomTrafficLight"></WinTrafficLightBtn>
            <div class="close-btn" @click="minimize">
                <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 593.14 593.11"><path d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z" transform="translate(-663.4 -243.46)"/></svg>
            </div>
            <div class="collapse-btn" @click="quitVideo">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640.13 352.15"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><g id="Layer_2-2" data-name="Layer 2"><g id="Layer_1-2-2" data-name="Layer 1-2"><path d="M319.64,76.3c-1.91,2.59-3,4.52-4.51,6Q186,211.6,56.78,340.8c-8.31,8.34-17.87,12.87-29.65,10.88-12.51-2.12-21.24-9.34-25.29-21.48-4.12-12.35-1.23-23.43,7.71-32.7C19.73,287,30.24,276.72,40.61,266.35L289.12,17.84c2.94-2.94,5.74-6,8.75-8.91a32.1,32.1,0,0,1,44.28-.15c3.15,3,6.05,6.2,9.11,9.26Q490,156.79,628.78,295.5c10.11,10.1,14.13,21.64,9.33,35.44a31.75,31.75,0,0,1-48.49,15.2,58.8,58.8,0,0,1-7.07-6.31Q453.85,211.22,325.2,82.51C323.68,81,322.32,79.3,319.64,76.3Z"/></g></g></g></g></svg>
            </div>
        </div>
        <div class="center">
            <video class="video-holder" controls 
                controlslist="nodownload" 
                disablepictureinpicture="true" 
                disableRemotePlayback="true" >
            </video>
        </div>
    </div>
</template>

<style scoped>
.video-playing-view {
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.video-playing-view .spacing {
    margin-left: 15px;
}

.video-playing-view .header {
    height: 39px;
    display: flex;
    -webkit-app-region: drag;
    z-index: 89;
    background-color: #000;
}

.video-playing-view .close-btn {
    width: 14px;
    height: 14px;
    margin-top: 20px;
    margin-left: 25px;
    cursor: pointer;
    display: none;
}

.video-playing-view .collapse-btn {
    width: 18px;
    height: 18px;
    margin-top: 15px;
    /* margin-left: 15px; */
    position: absolute;
    left: 80px;
    cursor: pointer;
    -webkit-app-region: none;
}

.video-playing-view .header svg {
    fill: var(--svg-color);
    fill: #fff !important;
}

.video-playing-view .header svg:hover, 
.video-playing-view .collapse-btn:hover svg {
    fill: var(--hl-color);
    fill: var(--svg-hover-color);
    cursor: pointer;
}

.video-playing-view .center {
    flex: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
}

.video-playing-view .center video {
    background-color: #000;
}
</style>