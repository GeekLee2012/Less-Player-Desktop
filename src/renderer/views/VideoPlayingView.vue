<script setup>
import { onActivated } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';
import { usePlayStore } from '../store/playStore';
import EventBus from '../../common/EventBus';
import WinTrafficLightBtn from '../components/WinTrafficLightBtn.vue';
import { useUseCustomTrafficLight } from '../../common/Utils';



//是否使用自定义交通灯控件
const useCustomTrafficLight = useUseCustomTrafficLight()

const { hideVideoPlayingView } = useAppCommonStore()
const { isSimpleLayout } = storeToRefs(useSettingStore())
const { videoSrc } = storeToRefs(usePlayStore())
const { setVideoSrc } = usePlayStore()

const initVideoPlayer = () => {
    const videoEls = document.querySelectorAll('.video-holder')
    let index = 0 //正常情况，只有 1个
    //异常情况
    if (videoEls.length == 2) index = isSimpleLayout.value ? 0 : 1
    EventBus.emit('video-init', videoEls[index])
}

const quitVideo = () => {
    setVideoSrc(null)
    EventBus.emit('video-stop')
    hideVideoPlayingView()
}

EventBus.on("app-beforeRoute", quitVideo)

onActivated(() => {
    initVideoPlayer()
})
</script>

<template>
    <div class="video-playing-view">
        <div class="header">
            <div class="win-ctl-wrap">
                <WinTrafficLightBtn v-show="useCustomTrafficLight" :hideMaxBtn="isSimpleLayout" :showCollapseBtn="true"
                    :collapseAction="quitVideo">
                </WinTrafficLightBtn>
            </div>
        </div>
        <div class="center">
            <video class="video-holder" controls controlslist="nodownload" disablepictureinpicture="true"
                disableRemotePlayback="true">
                <source :src="videoSrc" type="video/mp4">
            </video>
        </div>
    </div>
</template>

<style>
.video-playing-view {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    --view-bg: #000;
    background: var(--view-bg);
}

.video-playing-view .spacing {
    margin-left: 15px;
}

.video-playing-view .header {
    height: 56px;
    min-height: 56px;
    display: flex;
    -webkit-app-region: drag;
    z-index: 89;
    background: var(--view-bg);
}

.video-playing-view .header .win-ctl-wrap {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    /*width: 105px;*/
    margin-left: var(--others-win-ctl-margin-left);
}

.video-playing-view .header svg:hover,
.video-playing-view .collapse-btn:hover,
.video-playing-view .collapse-btn:hover svg {
    fill: var(--content-highlight-color) !important;
    cursor: pointer;
}

.video-playing-view .collapse-btn svg {
    fill: #fff !important;
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
</style>