<script setup>
import { computed, inject, nextTick, onActivated, onMounted, onUnmounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';
import { videoThemeNames, useVideoPlayStore } from '../store/videoPlayStore';
import WinTrafficLightBtn from '../components/WinTrafficLightBtn.vue';
import WinNonMacOSControlBtn from '../components/WinNonMacOSControlBtn.vue';
import { PlayAction, PlayState } from '../../common/Constants';
import { onEvents, emitEvents, offEvents } from '../../common/EventBusWrapper';



const { useWindowsStyleWinCtl } = inject('appCommon')
const { dndSaveVideo, playVideo } = inject('player')

const { hideVideoPlayingView, normalize } = useAppCommonStore()
const { isMaxScreen, videoPlayingViewShow } = storeToRefs(useAppCommonStore())
const { isSimpleLayout, isQuitVideoAfterEndedEnable, isDndSaveEnable } = storeToRefs(useSettingStore())
const { setPlaying, removeVideo, playNextVideo, resetQueue, switchVideoThemeIndex } = useVideoPlayStore()
const { playingIndex, currentVideo, queueVideos, queueVideosSize, videoThemeIndex } = storeToRefs(useVideoPlayStore())


let videoNode = null
const initVideoPlayer = () => {
    const videoEls = document.querySelectorAll('.video-node')
    let index = 0 //正常情况，只有 1个
    //异常情况
    if (videoEls.length == 2) index = isSimpleLayout.value ? 0 : 1
    videoNode = videoEls[index]
    emitEvents('video-init', videoNode)
    setupVideoTheme()
}

const setupVideoTheme = () => {
    const rootEl = document.querySelector('.video-playing-view')
    const el = document.querySelector('.video-node.video-js')

    const themeIndex = videoThemeIndex.value
    videoThemeNames.forEach((theme, index) => {
        const _theme = theme.replace('vjs-', '')
        if(themeIndex == index) {
            rootEl && rootEl.classList.add(_theme)
            el && el.classList.add(theme)
        } else {
            rootEl && rootEl.classList.remove(_theme)
            el && el.classList.remove(theme)
        }
    })
}

const stopVideo = (callback) => {
    if (currentVideo.value) {
        setPlaying(false)
        removeVideo(currentVideo.value)
        emitEvents('video-stop')
    }
    if (callback && (typeof callback == 'function')) callback()
}

const quitVideo = (callback) => {
    if (!videoPlayingViewShow.value) return stopVideo()
    normalize()
    setTimeout(() => {
        hideVideoPlayingView()
        stopVideo(callback)
        resetQueue()
        sidebarShow.value = false
    }, 666)
}

const currentVideoTitle = computed(() => {
    if(!currentVideo.value) return ''
    const { title, cTitle } = currentVideo.value
    return cTitle ? `${cTitle} - ${title}` : title
})

const sidebarShow = ref(false)
const toggleSidebarShow = () => sidebarShow.value = !sidebarShow.value

const handleSpaceKeyEvents = (event) => {
    event.preventDefault()
    if (!videoNode || !currentVideo.value) return
    emitEvents('video-togglePlay')
}

const playItem = (item, index) => {
    playVideo(item)
} 

const computedCollectionTitle = computed(() => {
    const video = currentVideo.value
    if(!video) return ''
    const { cTitle } = currentVideo.value
    const size = queueVideosSize.value
    return cTitle && size > 1 && `${cTitle} ( ${queueVideosSize.value} )` 
})

const playNext = () => {
    const size = queueVideosSize.value
    const index = playingIndex.value
    if(size > 1 && index < (size - 1)) playNextVideo()
}

const preventFullScreen = (event) => {
    event.preventDefault()
    event.stopPropagation()
    return false
}


/* 生命周期、监听 */
watch(videoThemeIndex, setupVideoTheme)

const eventsRegistration = {
    'app-beforeRoute': quitVideo,
    'video-state':  ({ state, video }) => {
        if (state == PlayState.END) {
            const size = queueVideosSize.value
            if(isQuitVideoAfterEndedEnable.value && size <= 1) return quitVideo()
            
            playNext()
        }
    },
    'video-action': ({ action, event, video, data }) => {
        if(action == PlayAction.NEXT) {
            playNext()
        } else if(action == PlayAction.CHANGE_RATE) {
            const el = document.querySelector('.vjs-playback-rate .vjs-playback-rate-value')
            el && data && (el.textContent = `${data}x`)
        }
    }
}
onMounted(() => onEvents(eventsRegistration))
onUnmounted(() => offEvents(eventsRegistration))
onActivated(initVideoPlayer)
</script>

<template>
    <div class="video-playing-view" @keyup.space="handleSpaceKeyEvents">
        <div class="header" @dblclick.prevent="">
            <div class="win-ctl-wrap" v-show="!useWindowsStyleWinCtl">
                <WinTrafficLightBtn :hideMaxBtn="isSimpleLayout" :showCollapseBtn="true" :collapseAction="quitVideo"
                    :isMaximized="isMaxScreen">
                </WinTrafficLightBtn>
            </div>
            <div class="title" v-html="currentVideoTitle"></div>
            <div class="action" :class="{ 'winstyle-action': useWindowsStyleWinCtl }" v-show="true">
                <div class="btn theme-btn" @click="switchVideoThemeIndex">
                    <svg width="18" height="18" viewBox="0 -10 940.66 926.15" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M697.39,926.15H245.3a14.77,14.77,0,0,0-2.77-.86C190,919.2,153.12,877.8,153.12,824.84V547.51c-3-.55-5.23-1-7.52-1.4-36.41-6.3-72.85-12.4-109.21-19C14.07,523.11.15,506.26.13,483.52c-.1-99-.27-198,.09-297,.12-34.94,16-61.27,47.23-77.57,8.39-4.36,17.28-7.79,26-11.44Q183.53,51.59,293.6,5.66c21.22-8.91,39.62-5.77,56.55,9.91C383.38,46.36,417,76.76,450.41,107.31c6.95,6.35,13.95,12.66,20.93,19l4.16-3.78,120.8-110c14.74-13.43,31.27-16,49.46-8,11,4.82,21.9,9.74,32.84,14.63,70.76,31.66,141.65,63,212.23,95.09,31.49,14.3,49.13,39.56,49.37,74.25.71,98.49.41,197,.35,295.47,0,22.47-14,39.1-36.08,43.19-24.55,4.54-49.18,8.64-73.78,12.93l-41.12,7.12c0,2.14,0,3.95,0,5.76.11,13.49.34,27,.32,40.48q-.1,117.24-.32,234.47c-.07,41-27.26,79.11-66.15,92.07C715,922.8,706.08,924.13,697.39,926.15ZM853.58,447.77v-5.88q0-121.75.14-243.52c0-4.72-1.71-6.59-5.67-8.35Q743.41,143.48,638.89,96.59c-2.86-1.28-4.56-1.15-6.89,1q-26.61,24.59-53.46,48.91c-25.6,23.35-51.13,46.77-76.85,70C490.73,226.38,477.91,231,463,228c-10-2-17.92-7.62-25.29-14.35q-63.44-58-126.93-115.94c-2.46-2.24-4.38-3.12-7.81-1.68Q197.31,140.24,91.49,184.09c-3.58,1.48-4.47,3.39-4.46,7q.15,125.51.08,251v5.48l66,11.49v-6.36c0-45-.07-90,0-135,0-21.06,15.76-39.07,36.64-42.46,20.31-3.29,40.76,8.44,47,27.95a75.22,75.22,0,0,1,3.2,22.6q.27,247.77.14,495.54a51.79,51.79,0,0,0,.21,6.48c.71,5.62,3.79,9.11,9.31,10.35a34.18,34.18,0,0,0,7.42.7q214.29.06,428.58,0a34.47,34.47,0,0,0,5-.24c8.14-1.19,11.59-5.11,11.89-13.37.07-1.83,0-3.67,0-5.5q.16-250.51.34-501c0-24.77,18.7-43.72,43-43.74,24.76,0,43.59,18.77,43.68,43.66q.2,58.74.34,117.49c0,7.3,0,14.59,0,22.49Z" />
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
            <!--
            <video class="video-node" controls controlslist="nodownload" disablepictureinpicture="true"
                disableRemotePlayback="true" @click.prevent="" @dblclick.prevent="handleVideoDoubleClick">
                <source :src="currentVideoUrl" type="video/mp4">
            </video>
            -->
            <video class="video-node video-js vjs-theme-city"
                controls controlslist="nodownload" preload="auto" data-setup="{}">
                <!--
                <source :src="currentVideoUrl" type="video/mp4">
                -->
            </video>
        </div>
        <!--
        <div class="play-next-btn btn">
            <svg width="15" height="15" viewBox="0 0 892.89 974.72" xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <path
                            d="M0,487.1q0-214.48.11-429c0-10.43.55-21.09,2.72-31.24C7.49,5.16,21.25-3.21,43,1.09A75.6,75.6,0,0,1,71.71,13.35Q238,129.06,404.36,244.75,551,346.75,697.57,448.84c14.66,10.26,20.1,26.31,19.71,43.82-.43,19.08-8.14,34.53-24.32,45.64Q386.35,748.89,79.78,959.58a131.15,131.15,0,0,1-19.56,11c-26.27,12-54-3.06-59-32.1A96.76,96.76,0,0,1,.06,922.05Q0,704.58,0,487.1Z" />
                        <path
                            d="M794,486.76q0-217.47,0-434.95c0-23.46,12.26-41.43,32.93-48.47,30-10.21,60.81,8,65.73,39.13.64,4-.13,8.26-.13,12.4q0,432.21.09,864.41c0,14-2.45,26.8-11.92,37.6a49.8,49.8,0,0,1-55.1,13.81c-19.25-7.11-31.56-25-31.57-46.47q-.12-133.49,0-267Z" />
                    </g>
                </g>
            </svg>
        </div>
        -->
        <div class="sidebar-btn" v-show="!sidebarShow" @click="toggleSidebarShow">
            <svg width="18" height="18" viewBox="0 0 455.71 818.05" xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <path
                            d="M101.17,405.1c2.89,1.94,5,2.89,6.47,4.41Q274.29,576.23,440.9,743c13.06,13.06,18.24,28.17,12.47,46-9.58,29.54-46.92,38.79-69.57,17.37-7.87-7.44-15.35-15.29-23-23L15.22,437.44C-5,417.2-5.07,392.34,15,372.23Q193.44,193.58,371.81,14.88C380.93,5.74,391.29-.19,404.44,0c17.18.25,30.24,8,37.94,23.27,7.79,15.43,6.19,30.66-3.89,44.78a60.83,60.83,0,0,1-6.7,7.4Q269.45,238,107.05,400.5C105.77,401.78,104.18,402.76,101.17,405.1Z" />
                    </g>
                </g>
            </svg>
        </div>
        <!--
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
        -->
        <transition name="fade-ex">
            <div class="sidebar" v-show="sidebarShow">
                <div class="sidebar-btn sidebar-collapse-btn" @click="toggleSidebarShow">
                    <svg width="18" height="18" viewBox="0 0 455.71 818.08" xmlns="http://www.w3.org/2000/svg">
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
                <div class="header">
                    <div class="title" v-show="computedCollectionTitle" 
                        v-html="computedCollectionTitle">
                    </div>
                </div>
                <div class="content">
                    <div v-show="queueVideosSize <= 1" class="slogan-item" :draggable="isDndSaveEnable" 
                        @dragstart="(event) => dndSaveVideo(event, currentVideo)">
                        路漫漫其修远兮，<br> 吾将上下而求索！
                    </div>
                    <div v-show="queueVideosSize > 1" class="video-item" v-for="(item, index) in queueVideos" 
                        :class="{ active: (playingIndex == index)}"
                        v-html="item.title" @click="() => playItem(item, index)">
                    </div>
                </div>
            </div>
        </transition>
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

.video-playing-view > .header {
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

.video-playing-view > .header .win-ctl-wrap {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    /*width: 105px;*/
    margin-left: var(--others-win-ctl-margin-left);
    z-index: 91;
    height: 100%;
}

.video-playing-view > .header .title {
    position: fixed;
    width: 520px;
    left: calc(50% - 260px);
    top: 13px;
    font-weight: bold;
    color: var(--content-subtitle-text-color);
    text-align: center;

    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    align-items: center;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    word-wrap: break-word;
    line-break: anywhere;

    color: #ccc;
}

.video-playing-view > .header .action {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    flex: 1;
    padding-right: 22px;
    z-index: 3;
}

.video-playing-view > .header .winstyle-action {
    padding-right: 175px;
    padding-bottom: 8px;
}

.video-playing-view > .header .action .btn {
    color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
}

.video-playing-view .search-video-btn svg {
    position: relative;
    top: 2px;
}

.video-playing-view .action .btn svg {
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
    right: 403px;
    opacity: 1;
    z-index: 100;
    background: var(--sidebar-bg);
    /*
    border-right: 1px solid transparent;
    box-shadow: -3px 0px 3px #222;
    */
    border-left: 0.1px solid #000;
    border-top: 0.1px solid #000;
    border-bottom: 0.1px solid #000;
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
}

.video-playing-view .sidebar-collapse-btn svg {
    fill: var(--sidebar-collapse-btn-svg-color);
}

.video-playing-view .sidebar {
    position: absolute;
    right: 0px;
    top: 0px;
    background: var(--sidebar-bg);
    width: 404px;
    height: 100%;
    z-index: 99;
    border-top-right-radius: var(--border-app-win-border-radius);
    border-bottom-right-radius: var(--border-app-win-border-radius);
    box-shadow: 0px 0px 3px #000;

    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;

    padding: 15px 0px;
}

.video-playing-view .sidebar > .header {
    display: flex;
    color: #ccc;
    font-size: var(--content-text-module-title3-size);
    font-weight: bold;
    padding: 5px 10px;
    margin-left: 10px;
    margin-bottom: 15px;
}

.video-playing-view .sidebar > .content {
    color: var(--sidebar-collapse-btn-svg-color);
    color: #ccc;
    font-size: var(--content-text-module-title3-size);
    /*flex: 1;*/
    width: 100%;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    overflow: scroll;
    padding-bottom: 22px;
}

.video-playing-view .sidebar>.content .slogan-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 168px;
    line-height: 36px;
}

.video-playing-view .sidebar>.content .video-item {
    /*
    display: flex;
    align-items: center;
    justify-content: center;
    */
    width: 89px;
    height: 39px;
    line-height: 39px;
    padding: 3px 6px;
    cursor: pointer;
    margin: 0px 0px 20px 20px;
    font-size: var(--content-text-size);
    border-radius: 5px;

    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    text-align: center;
    word-wrap: break-word;
    line-break: anywhere;
}

.video-playing-view .sidebar>.content .video-item:hover {
    background: #666666;
    color: #ccc;
}

.video-playing-view .sidebar>.content .video-item.active {
    background: var(--content-highlight-color);
    color: #fff;
}

/************************ VideoJS Style ************************/
/* vjs-common */
.video-playing-view .c-vjs-play-next-btn .vjs-icon-placeholder {
    font-family: VideoJS;
    font-weight: 400;
    font-style: normal;
    display: block;
}

.video-playing-view .c-vjs-play-next-btn .vjs-icon-placeholder::before {
    content: "\f123";
    cursor: pointer;
    text-align: center;
}

.video-playing-view .vjs-playback-rate {
    display: flex !important;
    order: 0 !important;
}

.video-playing-view .vjs-paused .vjs-big-play-button,
.video-playing-view .vjs-paused.vjs-has-started .vjs-big-play-button {
    display: block;
}

/* vjs-theme-city */
.video-playing-view .vjs-theme-city .c-vjs-play-next-btn {
    flex: 1;
}

.video-playing-view .vjs-theme-city .c-vjs-play-next-btn .vjs-icon-placeholder::before {
    font-size: 2.9em;
    line-height: 50px;
    padding-left: 1em;
    padding-right: 1em;
}

.video-playing-view .vjs-theme-city .vjs-control-bar {
    padding-top: 23px;
}

.video-playing-view .vjs-theme-city .vjs-play-control {
    outline: none;
    margin-right: 1em;
}

.video-playing-view .vjs-theme-city .vjs-control-bar .vjs-time-tooltip {
    font-size: 0.8em;
}

.video-playing-view .vjs-theme-city .vjs-remaining-time {
    padding-left: 2.5em;
    flex: 1;
    line-height: 50px;
    padding-right: 0em;
    font-size: 1.6em;
    /*
    flex-grow: 3;
    flex-shrink: 1;
    flex-basis: 0%;
    */
}

.video-playing-view .vjs-theme-city .vjs-playback-rate {
    font-size: 1.2em;
    flex: 1;
}

.video-playing-view .vjs-theme-city .vjs-playback-rate .vjs-playback-rate-value {
    line-height: 50px;
}

.video-playing-view .vjs-theme-city .vjs-playback-rate .vjs-menu .vjs-menu-content {
    bottom: 25px;
    width: 80px;
    max-height: max-content;
}

.video-playing-view .vjs-theme-city .vjs-picture-in-picture-control .vjs-icon-placeholder {
    font-size: 1.35em;
}

.video-playing-view .vjs-theme-city .vjs-picture-in-picture-control[title^='Exit'] .vjs-icon-placeholder {
    font-size: 1.1em;
}

.video-playing-view .vjs-theme-city .vjs-fullscreen-control .vjs-icon-placeholder {
    font-size: 1.75em;
}

.video-playing-view.theme-city .sidebar>.content .video-item.active {
    background: #bf3b4d;
}

.video-playing-view.theme-city .header svg:hover,
.video-playing-view.theme-city .collapse-btn:hover,
.video-playing-view.theme-city .collapse-btn:hover svg {
    fill: #bf3b4d !important;
    cursor: pointer;
}

/* vjs-theme-sea */
.video-playing-view .vjs-theme-sea .c-vjs-play-next-btn .vjs-icon-placeholder::before {
    font-size: 2.1em;
    line-height: 2.2;
    display: flex;
    align-items: center;
    justify-content: center;
}

.video-playing-view .vjs-theme-sea .vjs-control-bar .vjs-time-tooltip {
    font-size: 0.88em;
}

.video-playing-view .vjs-theme-sea .vjs-remaining-time {
    font-size: 1.35em;
    line-height: 2.2;
    display: flex;
    align-items: center;
    justify-content: center;
}

.video-playing-view .vjs-theme-sea .vjs-playback-rate {
    font-size: 1.1em;
    width: 40px;
    line-height: 2.2;
    
    display: flex;
    align-items: center;
    justify-content: center;
}

.video-playing-view .vjs-theme-sea .vjs-playback-rate-value {
    margin-top: 0.2em;
}

.video-playing-view .vjs-theme-sea .vjs-hover .vjs-playback-rate-value {
    color: #4176bc;
    z-index: 1;
}

.video-playing-view .vjs-theme-sea .vjs-playback-rate .vjs-menu .vjs-menu-content {
    bottom: 23px;
    width: 80px;
    max-height: max-content;
}

.video-playing-view .vjs-theme-sea .vjs-playback-rate .vjs-menu li {
    font-size: 1.5em;
    padding: 6px;
}

.video-playing-view.theme-sea .sidebar>.content .video-item.active {
    background: #4176bc;
}

.video-playing-view.theme-sea .header svg:hover,
.video-playing-view.theme-sea .collapse-btn:hover,
.video-playing-view.theme-sea .collapse-btn:hover svg {
    fill: #4176bc !important;
    cursor: pointer;
}


/* vjs-theme-forest */
.video-playing-view .vjs-theme-forest .c-vjs-play-next-btn {
   /*flex: 1;*/
}

.video-playing-view .vjs-theme-forest .c-vjs-play-next-btn .vjs-icon-placeholder::before {
    font-size: 3em;
    margin-top: -8px;
    /*
    line-height: 50px;
    padding-left: 1em;
    padding-right: 1em;
    */
}

.video-playing-view .vjs-theme-forest .vjs-control-bar {
    /*line-height: 50px;*/
}

.video-playing-view .vjs-theme-forest .vjs-play-control {
    outline: none;
    margin-left: 5px;
    /*margin-right: 1em;*/
}

.video-playing-view .vjs-theme-forest .vjs-play-control .vjs-icon-placeholder::before {
    font-size: 1.88em;
}

.video-playing-view .vjs-theme-forest .vjs-control-bar .vjs-time-tooltip {
    font-size: 1.3em;
}

.video-playing-view .vjs-theme-forest .vjs-remaining-time {
    /*padding-left: 2.5em;
    flex: 1;
    line-height: 50px;
    padding-right: 0em;*/
    font-size: 1.6em;
    margin-top: -8px;
}

.video-playing-view .vjs-theme-forest .vjs-playback-rate {
    font-size: 1.2em;
    margin-top: -3px;
    /*flex: 1;*/
}

.video-playing-view .vjs-theme-forest .vjs-playback-rate .vjs-menu .vjs-menu-content {
    bottom: 10px;
    width: 80px;
    max-height: max-content;
}

.video-playing-view .vjs-theme-forest .vjs-picture-in-picture-control {
    margin-top: -3px;
}

.video-playing-view .vjs-theme-forest .vjs-picture-in-picture-control[title^='Exit'] {
    margin-top: 0px;
}

.video-playing-view .vjs-theme-forest .vjs-picture-in-picture-control .vjs-icon-placeholder {
    font-size: 1.35em;
}

.video-playing-view .vjs-theme-forest .vjs-picture-in-picture-control[title^='Exit'] .vjs-icon-placeholder {
    font-size: 1.1em;
}

.video-playing-view .vjs-theme-forest .vjs-fullscreen-control {
    margin-top: -7px;
    margin-left: 2px;
}

.video-playing-view .vjs-theme-forest .vjs-fullscreen-control .vjs-icon-placeholder {
    font-size: 1.65em;
}

.video-playing-view.theme-forest .sidebar>.content .video-item.active {
    background: #6fb04e;
}

.video-playing-view.theme-forest .header svg:hover,
.video-playing-view.theme-forest .collapse-btn:hover,
.video-playing-view.theme-forest .collapse-btn:hover svg {
    fill: #6fb04e !important;
    cursor: pointer;
}
</style>