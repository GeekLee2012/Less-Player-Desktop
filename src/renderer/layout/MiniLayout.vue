<script setup>
import { inject, onMounted, onUnmounted, ref, watch, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlayStore } from '../store/playStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';
import AppPopovers from '../AppPopovers.vue';
import ArtistControl from '../components/ArtistControl.vue';
import PlaybackQueueItem from '../components/PlaybackQueueItem.vue';
import LyricControl from '../components/LyricControl.vue';
import { Track } from '../../common/Track';
import { onEvents, emitEvents } from '../../common/EventBusWrapper';
import { toTrimString, ipcRendererSend, smoothScroll, } from '../../common/Utils';




const { progressState, mmssCurrentTime, currentTimeState,
    favoritedState, toggleFavoritedState,
    preseekTrack, mmssPreseekTime, mmssDurationLeft, } = inject('player')
const { applyDocumentStyle } = inject('appStyle')
const { showConfirm } = inject('apiExpose')
const { visitRecents, visitBatchPlaybackQueue } = inject('appRoute')


const { desktopLyricShow, lyricToolbarShow } = storeToRefs(useAppCommonStore())
const { quit, hideAllCtxMenus, hideLyricToolbar, toggleDesktopLyricShow } = useAppCommonStore()
const { currentTrack, playing, loading, 
    queueTracks, playingIndex, queueTracksSize, 
} = storeToRefs(usePlayStore())
const { resetQueue, moveTrack } = usePlayStore()
const { isHideToTrayOnMinimized, isTrayShow, isShowDialogBeforeQuitApp,
    getWindowZoom, isUseWinCenterStrict, isPlaybackQueueHistoryBtnShow, 
    isPlaybackQueuePositionBtnShow, isPlaybackQueueBatchActionBtnShow,
 } = storeToRefs(useSettingStore())
const { switchToFallbackLayout } = useSettingStore()


const isPlayCtlShow = ref(false)
const isQueueShow = ref(false)
const isFullLyricShow = ref(false)
const listRef = ref(null)
const pinState = ref(false)
const lyricLayoutMode = ref(0)
const pendingFullLyric = ref(false)
const setPlayCtlShow = (value) => (isPlayCtlShow.value = value)
const setQueueShow = (value) => (isQueueShow.value = value)
const setFullLyricShow = (value) => (isFullLyricShow.value = value)
const setLyricLayoutMode = (value) => (lyricLayoutMode.value = value)
const setPendingFullLyric = (value) => (pendingFullLyric.value = value)
const switchLyricLayoutMode = () => {
    const mode = lyricLayoutMode.value
    setLyricLayoutMode((mode + 1) % 4)
}


const doQuit = async () => {
    if(!isTrayShow.value && !desktopLyricShow.value && isShowDialogBeforeQuitApp.value) {
        const ok = await showConfirm('确定要退出应用吗?')
        if(!ok) return
    }
    quit()
}

const quitMiniLayout = () => {
    hideAllCtxMenus()
    switchToFallbackLayout()
    ipcRendererSend('app-mainWin-alwaysOnTop', false)
}

const toggleMiniStyle = () => {
    const appEl = document.querySelector('#app')
    const miniClass = 'mini'
    if(appEl.classList.contains(miniClass)) {
        appEl.classList.remove(miniClass)
        document.body.classList.remove(miniClass)
    } else {
        appEl.classList.add(miniClass)
        document.body.classList.add(miniClass)
    }
}

const toggleExpand = (expand) => {
    hideLyricToolbar()
    hideAllCtxMenus()

    const zoom = getWindowZoom.value
    const isInit = false
    const useCenterStrict = isUseWinCenterStrict.value
    ipcRendererSend('app-layout-mini-toggleExpand', { zoom, isInit, useCenterStrict, expand })
}

const toggleQueue = () => {
    setFullLyricShow(false)
    setQueueShow(!isQueueShow.value)
    toggleExpand(isQueueShow.value || (lyricLayoutMode.value == 2))
    if(!isQueueShow.value) setFullLyricShow(lyricLayoutMode.value == 2)

    if (listRef.value) listRef.value.addEventListener('scroll', hideAllCtxMenus)
}

const toggleLyric = (noSwitch) => {
    const oldMode = lyricLayoutMode.value
    if(!noSwitch) switchLyricLayoutMode()
    const currentMode = lyricLayoutMode.value

    setQueueShow(isQueueShow.value && currentMode != 2)
    setFullLyricShow(currentMode == 2)
    toggleExpand(isQueueShow.value || isFullLyricShow.value)
    setPendingFullLyric(false)

    if(oldMode ==  3 || currentMode == 3) {
        toggleDesktopLyricShow()
    }
}

const hideLyric = () => {
    setLyricLayoutMode(0)
    setFullLyricShow(lyricLayoutMode.value == 2)
    toggleExpand(isQueueShow.value || isFullLyricShow.value)
    if(desktopLyricShow.value) toggleDesktopLyricShow()
}

const targetPlaying = () => {
    if (queueTracksSize.value < 1) return
    const queueItemsWrap = document.querySelector('.mini-layout .playback-queue .list-content')
    const queueItems = document.querySelectorAll('.mini-layout .playback-queue .list-content .item')
    //算法1：基于百分比的定位，不够准确
    //const { clientHeight, scrollHeight } = queueItemsWrap
    //const maxScroll = scrollHeight - clientHeight
    //queueItemsWrap.scrollTop = maxScroll * (playingIndex.value / (queueTracksSize.value - 1))

    //算法2：基于offsetTop，实现真正（播放器内）垂直居中
    const { clientHeight } = document.documentElement
    const queueItem = queueItems[playingIndex.value]
    const { clientHeight: itemHeight, offsetTop: itemOffsetTop } = queueItem
    const { offsetTop: itemWrapOffsetTop } = queueItemsWrap
    const adjustHeight = itemHeight ? itemHeight / 2 : 0
    const destScrollTop = itemOffsetTop - (clientHeight / 2 - itemWrapOffsetTop) + adjustHeight
    smoothScroll(queueItemsWrap, destScrollTop, 314, 8)
}

const onMouseOver = (event) => {
    setPlayCtlShow(true)
}

const onMouseOut = (event) => {
    setPlayCtlShow(false)
}

const queueState = () => {
    const total = queueTracks.value.length
    let current = Math.min(Math.max(playingIndex.value + 1, 0), total)
    return total > 0 ? (current > 0 ? `${current} / ${total}首` : `${total}首`) : '0首'
}

const clearAll = () => {
    if (queueTracksSize.value < 1) return
    resetQueue()
    //onQueueEmpty()
}

const onLyricUserMouseWheel = (event) => emitEvents('lyric-userMouseWheel', event)

const setLyricToolbarPos = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const el = document.querySelector('#lyric-toolbar')
    if (!el) return
    const { clientWidth: eWidth, clientHeight: eHeight } = el
    const top = (clientHeight - eHeight) / 2
    el.style.top = `${top + 20}px`
    el.style.right = '23px'
}

const togglePin = () => {
  pinState.value = !pinState.value
  ipcRendererSend('app-mainWin-alwaysOnTop', pinState.value)
}

/* 拖拽移动重排序 */
const dragTargetIndex = ref(-1)
const dragOverIndex = ref(-1)
const dragging = ref(false)
const setDragTargetIndex = (value) => dragTargetIndex.value = value
const setDragOverIndex = (value) => dragOverIndex.value = value
const setDragging = (value) => dragging.value = value

//重置状态
const resetDragState = () => {
    setDragging(false)
    setDragOverIndex(-1)
    setDragTargetIndex(-1)
}

const markDragStart = (event, item, index) => {
    setDragging(true)
    //当前拖拽对象index
    setDragTargetIndex(index)
    //仅为改变默认鼠标样式
    const { dataTransfer } = event
    if (dataTransfer) dataTransfer.effectAllowed = 'move'
}

const markDragOver = (event, item, index) => {
    if (!dragging.value) return
    //拖拽悬停时所在的Item对象对应的index
    setDragOverIndex(index)
}

const moveDragItem = (event) => {
    if (!dragging.value) return
    moveTrack(dragTargetIndex.value, dragOverIndex.value)
}



watch(progressState, (nv, ov) => {
    const percent = nv * 100
    //const progressEffect = `conic-gradient(var(--content-highlight-color) ${percent}%, var(--button-icon-btn-color) ${percent - 50}%)`
    const progressEffect = `conic-gradient(var(--content-highlight-color) ${percent}%, #292929 ${percent - 50}%)`
    applyDocumentStyle({
        '--others-mini-layout-cover-progress-bg': progressEffect,
    })
})

watch(lyricToolbarShow, () => nextTick(setLyricToolbarPos))
watch(desktopLyricShow, (nv, ov) => {
    if(!nv && lyricLayoutMode.value == 3) switchLyricLayoutMode()
})

onMounted(toggleMiniStyle)
onUnmounted(toggleMiniStyle)
</script>

<template>
    <div class="mini-layout">
        <div class="header">
            <div class="cover-wrap">
                <img class="cover" 
                    :class="{
                        rotation: playing, 
                    }"
                    v-lazy="Track.coverDefault(currentTrack)" />
            </div>
        </div>
        <div class="center">
            <div class="content">
                <div class="win-ctl-wrap">
                    <svg class="quit-btn" @click="doQuit" width="12" height="12" viewBox="0 0 1004.78 1003.64" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M510.76,407c19.71-20,38.9-39.67,58.35-59.1Q725,192.26,881,36.76c20-20,44.11-25.92,70.75-18.24,27.47,7.92,45,26.79,51.17,54.83,5.67,25.64-1.48,48.2-19.73,67-15.34,15.78-31.06,31.17-46.62,46.72L618,505.59c-1.39,1.39-2.72,2.84-4.83,5.05,11.75,11.48,23.43,22.61,34.8,34.05Q807.53,705.07,967,865.52c21,21.12,27.13,51.81,15.58,78.83-12.08,28.22-37.87,45.28-67.89,44.81-20.19-.32-37.11-8.21-51.28-22.37q-67-67-134-134-108-108-216-216c-1.29-1.29-2.34-2.82-3.83-4.64-1.85,1.76-3.17,3-4.42,4.2q-183,183-365.91,365.92c-28.16,28.17-72,28.59-101.18.92C9.43,956,7.84,911.93,34.48,882.42c1.89-2.1,3.91-4.1,5.92-6.1Q221,695.66,401.73,515c1.52-1.52,3.27-2.8,6.76-5.76-2.68-1.55-4.74-2.25-6.12-3.62Q212.44,315.85,22.65,125.93C2.21,105.47-5.08,80.7,3.6,53.05S31.05,7.17,60,1.49c25.6-5,47.76,2.82,66.13,21.15Q205.4,101.75,284.54,181L506.28,402.74C507.44,403.89,508.67,405,510.76,407Z"/></g></g></svg>
                    <svg class="quit-mini-btn" @click="quitMiniLayout" width="13" height="13" viewBox="0 0 1019 1019" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M0,962V503a24.12,24.12,0,0,0,.86-3.77c2.43-31.82,26.64-54.36,58.5-54.39,21.49,0,43,0,64.46,0,1.75,0,3.5-.14,5.67-.24v-7.5q.18-188.61.35-377.22c0-28.4,14.83-48.4,41.95-56.89A45.21,45.21,0,0,0,178,0H969a65,65,0,0,0,6.86,2.75c21,6,34.13,19.66,40.16,40.47.86,3,2,5.85,3,8.78V837a28.45,28.45,0,0,0-1.9,4.46c-7.47,31.14-28.49,47.71-60.65,47.71H571.84v6.12c0,21,.07,42,0,63-.13,29.91-17,51.36-45.87,58.66-2,.52-4,1.37-6,2.06H51a32.14,32.14,0,0,0-4.91-2.06c-22.53-5.41-37-19.19-43.25-41.49C1.61,971,.93,966.49,0,962ZM249.22,118V447H513c34.42,0,57.07,20.41,60,54.56.92,10.77.91,21.63.92,32.45q.1,114.74,0,229.48v6H900.75V118ZM453.87,564.49H118.26V900.71H453.87Z" />
                            </g>
                        </g>
                    </svg>
                    <div class="pin-btn" :class="{ active: pinState }" @click="togglePin">
                        <svg width="14" height="14" v-show="!pinState" viewBox="0 0 883.92 883.44" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                d="M272.88,677.42c-1.64,2.3-2.52,4-3.79,5.26Q208.85,743,148.57,803.28c-9.91,9.93-21.64,15.64-35.69,15.26-19.95-.54-34.85-10-43.12-28.1s-5.39-35.41,7.11-51A69.63,69.63,0,0,1,82,734Q141.6,674.46,201.2,614.91a42.23,42.23,0,0,1,4.36-3.34l.73-2.17c-1.72-1-3.74-1.76-5.12-3.13Q113.42,518.67,25.74,431C7.31,412.62-1.89,390.86.33,364.78c1.95-22.95,12.42-41.55,30.29-55.91C71,276.46,116.14,254.42,167.46,246a256.88,256.88,0,0,1,103.66,4.06c4.06,1,6.57.47,9.55-2.52Q391.21,136.74,501.89,26.1c14.94-15,32.33-24.38,53.6-25.87,22.56-1.57,42.89,4.73,59.15,20.4,28.08,27.06,55.41,54.9,83,82.46q80.46,80.41,160.9,160.85c14.87,14.84,23.86,32.31,25.19,53.39,1.4,22.19-4.91,42.13-20.12,58.3-18.49,19.65-37.9,38.45-57,57.55Q721.81,518.06,636.9,602.86c-2,2-3.38,3.64-2.44,6.85,15,51.08,10,101.12-8.23,150.37-12.16,32.89-29.43,63-50.66,90.84-29.75,39-83.23,43.52-119.2,10.36-7.35-6.77-14.27-14-21.34-21.08Q356.36,761.56,277.7,682.87C276.41,681.57,275.27,680.13,272.88,677.42ZM561.09,102.91c-1.32,1.25-2.65,2.47-3.92,3.75L448.64,215.18q-62.22,62.2-124.45,124.39C309,354.7,289,358.79,270,350.54c-17.67-7.69-36.21-11.25-55.33-11.82-39.71-1.2-75.3,11.24-107.94,33.16a5,5,0,0,0-1.27,1.18Q307.84,575.44,509.91,777.53c12-18,22.23-37.57,29.11-58.73,10.93-33.59,12.21-66.95-3.25-99.74-11.35-24.09-8-42.75,10.94-61.69L777.18,326.89c1.37-1.37,2.68-2.8,3.86-4Z" />
                            </g>
                            </g>
                        </svg>
                        <svg width="14" height="15" v-show="pinState" viewBox="0 0 769.97 933.48" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                d="M432.47,706.53c.47,2.8,1,4.6,1,6.41q.08,85.24.06,170.5c0,14-4.24,26.35-14.44,36-14.49,13.72-31.7,17.59-50.36,10.63s-28.86-21.23-31-41.08a69.19,69.19,0,0,1-.18-7.49q0-84.24,0-168.5a40.52,40.52,0,0,1,.71-5.44l-1-2.05c-1.94.49-3.88,1.4-5.83,1.4q-124,.11-248,.11c-26,0-47.91-8.84-64.78-28.85C3.82,660.59-1.92,640,.56,617.24c5.61-51.44,22-99,52.3-141.23A256.82,256.82,0,0,1,129,405.59c3.58-2.17,5-4.32,5-8.54q-.18-156.49-.15-313c0-21.15,5.62-40.1,19.61-56.19C168.3,10.79,187.13.88,209.71.46c39-.73,78-.37,117-.38Q440.46,0,554.22,0c21,0,39.72,6,55.56,19.94,16.68,14.7,26.32,33.26,27,55.45.82,27,.39,54,.4,81q0,120,0,240c0,2.81.17,5,3.12,6.57,46.75,25.49,78.55,64.45,100.5,112.15,14.66,31.86,23.76,65.38,28.41,100.06,6.53,48.6-28.08,89.63-77,91.62-10,.4-20,.18-30,.18q-111.26,0-222.5,0C437.9,707,436.07,706.76,432.47,706.53ZM230,96.5c0,1.82-.12,3.62-.12,5.43q0,76.74,0,153.47,0,88,0,176c0,21.42-11.32,38.5-30.55,46.07-17.94,7.05-33.56,17.65-47.49,30.76-28.92,27.23-45.29,61.2-52.87,99.78a5.75,5.75,0,0,0-.07,1.73l572,0c-4.21-21.24-10.84-42.28-20.94-62.11-16-31.48-38.71-56-72.83-68.23-25.06-9-35.89-24.57-35.89-51.36q0-163,0-325.94c0-1.94-.08-3.88-.11-5.58Z" />
                            </g>
                            </g>
                        </svg>
                    </div>
                </div>
                <div class="duration-wrap">
                    <div class="duration" v-html="mmssDurationLeft"></div>
                </div>
                <div class="play-ctl-wrap" v-show="isPlayCtlShow"
                    @mouseenter="onMouseOver" @mouseleave="onMouseOut">
                    <div class="favorite-btn" @click="toggleFavoritedState">
                        <svg v-show="!favoritedState" width="21" height="21" viewBox="0 -50 1024 937.46"
                            xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M1024,299.77c-.89,7.24-1.74,14.5-2.67,21.74-5.4,41.95-19.53,81-39,118.35-24.74,47.39-56.62,89.8-91.22,130.27-48.69,57-101.85,109.6-156.46,160.77C661.69,799.26,588.19,867,514.93,935.05c-.85.78-1.75,1.49-2.85,2.41-1.09-.89-2.14-1.65-3.09-2.52q-101.8-92.36-203.56-184.77c-58.71-53.61-116.12-108.59-168.2-168.81-39.12-45.23-74.7-92.93-100.8-147.1-18.8-39-31.17-79.91-35.23-123.16-.32-3.45-.8-6.89-1.2-10.33v-36c1-7.74,1.79-15.5,2.86-23.23,8.06-57.93,30.88-109.28,71.21-151.7,67.09-70.55,150.24-98.35,246.11-86,75.62,9.71,138.64,44.83,189.43,101.75.74.82,1.61,1.52,2.53,2.39.91-1,1.61-1.66,2.26-2.4a297.6,297.6,0,0,1,98.07-74.34C690-5.4,769.66-11.19,849.33,21.27,948,61.45,1004.25,136.62,1021.1,241.55c1.24,7.69,1.95,15.47,2.9,23.21ZM922.22,282.9c-1.08-10.76-1.48-21.64-3.33-32.27-10-57.28-39.78-101.12-91.95-127.45-54.58-27.54-110.52-27-165.67-1.07-44.78,21.07-78.08,53.89-96.65,100.47-1.2,3-2.93,3.41-5.65,3.4-29.5-.06-59-.1-88.49.05-3.58,0-5.17-1.2-6.63-4.39C430.29,148.12,342.54,89.86,249.42,105.81c-41,7-76.09,25.21-103.36,56.83-38.87,45.08-49.77,97.9-40.53,155.58,5.72,35.66,20,68.21,38.16,99.15C171,463.93,205.43,505,242,544.39c57.44,61.87,119.67,118.78,182.1,175.48,28,25.43,56.23,50.62,84.27,76,5.68,5.15,6.89,5.4,12.43.28C568,752.47,615.47,709.05,662.35,665c54.55-51.26,108-103.64,156.07-161.17C846.69,470,872.66,434.6,892.47,395,910.12,359.76,921.42,322.79,922.22,282.9Z" />
                                </g>
                            </g>
                        </svg>
                        <svg v-show="favoritedState" class="love-btn" width="21" height="21" viewBox="0 0 1024 937.53"
                            xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M1024,264.78v35c-.41,3.45-.89,6.89-1.23,10.34-3.89,39.7-15.25,77.26-32.22,113.22-23.28,49.33-54.76,93.24-89.46,135-49.41,59.44-104,113.93-160.28,166.77-74.94,70.39-150.55,140-225.89,210-.93.87-2,1.58-3.1,2.42-1.47-1.32-2.72-2.41-3.93-3.54-20.27-18.82-40.33-37.87-60.84-56.43C396.63,832,345.74,786.88,295.54,741c-52.69-48.1-103.88-97.76-151.07-151.36-37.41-42.48-71.92-87-98.75-137.15C23.93,411.83,8.38,369.06,2.64,323,1.71,315.62.88,308.2,0,300.79v-36c1-7.74,1.79-15.51,2.86-23.24,8.06-57.92,30.88-109.28,71.21-151.7C141.16,19.28,224.31-8.52,320.18,3.78c75.62,9.71,138.64,44.83,189.43,101.76.74.82,1.61,1.52,2.53,2.39.91-1,1.61-1.66,2.26-2.4a297.49,297.49,0,0,1,98.07-74.35C690-5.4,769.66-11.19,849.33,21.27,948,61.46,1004.25,136.63,1021.1,241.57,1022.34,249.26,1023.05,257,1024,264.78Z" />
                                </g>
                            </g>
                        </svg>
                    </div>
                    <PlayControl class="spacing" :toggleQueueAction="toggleQueue">
                    </PlayControl>
                    <div class="lyric-btn spacing" 
                        :class="{ 'content-text-highlight': lyricLayoutMode > 0 }"
                        @click="() => toggleLyric()"
                        @contextmenu.stop="hideLyric">
                        词
                    </div>
                </div>
                <div class="meta-wrap" v-show="lyricLayoutMode != 1 && !isPlayCtlShow"
                    @mouseenter="onMouseOver" @mouseleave="onMouseOut">
                    <div class="audio-title" v-html="currentTrack.title">
                    </div>
                    <ArtistControl class="audio-artist"
                        :visitable="true" 
                        :platform="currentTrack.platform" 
                        :data="currentTrack.artist"
                        :trackId="toTrimString(currentTrack.id)">
                    </ArtistControl>
                </div>
                <div class="mini-lyric-wrap" v-if="lyricLayoutMode == 1 && !isPlayCtlShow"
                    @mouseenter="onMouseOver" @mouseleave="onMouseOut">
                    <LyricControl :track="currentTrack" 
                        :currentTime="currentTimeState" 
                        :hiddenMeta="true"
                        :layoutMode="0"
                        keyName="miniLayout"
                        v-show="!loading" >
                    </LyricControl>
                    <div class="loading-tip" v-if="loading">歌曲努力加载中 <span>......</span></div>
                </div>
            </div>
            <div class="playback-queue" v-show="isQueueShow">
                <div class="list-header">
                    <div class="title content-text-highlight">当前播放</div>
                    <div class="subtitle" v-html="queueState()"></div>
                    <div class="action" :class="{ 'icon-mode': true }">
                        <div class="batch-action-btn text-btn" @click="visitBatchPlaybackQueue" v-show="isPlaybackQueueBatchActionBtnShow">
                            <svg width="15" height="15" viewBox="0 0 160 125" xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M55,20h95a10,10,0,0,0,0-20H55a10,10,0,0,0,0,20ZM20,0H10a10,10,0,0,0,0,20H20A10,10,0,0,0,20,0ZM55,70h75a10,10,0,0,0,0-20H55a10,10,0,0,0,0,20ZM20,50H10a10,10,0,0,0,0,20H20a10,10,0,0,0,0-20Zm130,55H55a10,10,0,0,0,0,20h95a10,10,0,0,0,0-20ZM20,105H10a10,10,0,0,0,0,20H20a10,10,0,0,0,0-20Z" />
                                    </g>
                                </g>
                            </svg>
                            <span>批量</span>
                        </div>
                        <div class="history-btn text-btn" @click="visitRecents" v-show="isPlaybackQueueHistoryBtnShow">
                            <svg width="15" height="15" viewBox="0 0 767.87 750.82" xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M140.66,202c17,14.91,33.66,29.54,50.38,44.06,5.55,4.82,9.76,10.45,11.8,17.56C209.3,286.17,192.77,306.88,168,307q-66,.17-132,0a56,56,0,0,1-6.47-.49C13.13,304.51.3,291,.2,274.47c-.24-40.67-.31-81.33,0-122,.11-13.31,7.33-23.06,19.3-28.65,12.59-5.88,24.78-4.2,35.62,4.44,9.25,7.37,18.08,15.26,27.1,22.92,2.26,1.92,4.54,3.81,7.15,6,1.38-1.8,2.49-3.21,3.55-4.64C149.48,76.28,224.12,27.65,316.89,8c196.27-41.54,392.59,82.56,440,277.46a375.14,375.14,0,0,1,9.95,118c-12.17,158.3-121.5,290.34-271.65,332.89-45.22,12.82-91.3,17.43-138,12.63C209.7,733.79,90.48,640.5,39,501.48c-8-21.55,3.81-43,23.59-47.36,16.81-3.74,33.51,5.57,39.53,22.58,16.56,46.84,42.52,87.65,78.73,121.72,47.47,44.66,103.51,72,168.09,81.26C508.72,702.5,658.43,598.36,693,440.61c35.9-164-68.83-328.57-232.36-365.12C341,48.77,220.44,93.7,147.66,192.12,145.38,195.19,143.24,198.36,140.66,202Z" />
                                        <path
                                            d="M324.24,323.68c0-28.5-.11-57,.05-85.49.09-16.1,12.4-30.31,27.77-32.61,17.53-2.63,33.33,6.83,38.22,23.23a44.12,44.12,0,0,1,1.6,12.29q.17,71,0,142c0,4,1.18,6.12,4.88,7.95,37.12,18.42,74.11,37.09,111.19,55.61,9.25,4.62,16.14,11.35,18.88,21.42,3.78,13.92.58,26.28-10.62,35.63s-23.9,10.55-36.91,4.19c-22.13-10.8-44.07-22-66.09-33q-34.37-17.21-68.73-34.4c-13.6-6.77-20.27-17.67-20.25-32.81q.06-42,0-84Z" />
                                    </g>
                                </g>
                            </svg>
                            <span>历史</span>
                        </div>
                        <div class="target-btn text-btn" @click="targetPlaying" v-show="isPlaybackQueuePositionBtnShow">
                            <svg width="16" height="16" viewBox="0 -1 24 24" xmlns="http://www.w3.org/2000/svg">
                                <g id="aim">
                                    <path d="M12,8a4,4,0,1,0,4,4A4,4,0,0,0,12,8Zm0,6a2,2,0,1,1,2-2A2,2,0,0,1,12,14Z" />
                                    <path
                                        d="M23,11H22A10,10,0,0,0,13,2.05V1a1,1,0,0,0-2,0v1a10,10,0,0,0-8.95,9H1a1,1,0,0,0,0,2h1a10,10,0,0,0,9,9V23a1,1,0,0,0,2,0V22A10,10,0,0,0,22,13H23A1,1,0,0,0,23,11ZM13,19.93V19a1,1,0,0,0-2,0v.93A8,8,0,0,1,4.07,13H5a1,1,0,0,0,0-2H4.07A8,8,0,0,1,11,4.07V5a1,1,0,0,0,2,0V4.07A8,8,0,0,1,19.93,11H19a1,1,0,0,0,0,2h.93A8,8,0,0,1,13,19.93Z" />
                                </g>
                            </svg>
                            <span>定位</span>
                        </div>
                        <div class="clear-btn text-btn" @click="clearAll">
                            <svg width="15" height="15" viewBox="0 0 256 256" data-name="Layer 1"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M1040,669H882c-12.79-4.93-17.16-14.62-17.1-27.83.26-52.77.11-105.55.11-158.32V477c-6,0-11.42-.32-16.84.09-6.54.48-11.66-1.39-15.17-7.08v-7c3.16-5.7,8-7.48,14.44-7.36,18.29.32,36.58.12,54.88.1,1.75,0,3.5-.16,5.48-.25,0-7.76,0-14.91,0-22.05a18.56,18.56,0,0,1,6.6-14.52c2.85-2.39,6.37-4,9.59-5.92h73c13.83,5.64,17.27,10.84,17.25,26.08,0,5.41,0,10.82,0,16.68h7.53c17.61,0,35.21.2,52.81-.12,6.43-.12,11.27,1.63,14.41,7.36v7c-3.5,5.7-8.63,7.56-15.17,7.08-5.41-.4-10.89-.09-16.84-.09v6.36c0,52.6-.15,105.2.11,157.8C1057.17,654.36,1052.81,664.08,1040,669ZM886.24,477.29V640.4c0,8.44-.49,7.34,7.11,7.35q67.95,0,135.9,0c6.51,0,6.52,0,6.52-6.43v-164Zm106.5-42.78H929.37v21h63.37Z"
                                    transform="translate(-833 -413)" />
                                <path
                                    d="M950.29,562.2c0-13.47,0-26.94,0-40.41,0-7.94,4.25-12.84,10.82-12.77,6.36.07,10.59,5,10.6,12.52,0,27.28,0,54.55,0,81.83,0,5.13-1.71,9.17-6.5,11.36-7.39,3.36-14.87-2.16-14.94-11.11-.11-13.81,0-27.61,0-41.42Z"
                                    transform="translate(-833 -413)" />
                                <path
                                    d="M1014.25,562.63c0,13.48,0,27,0,40.42,0,7.88-4.3,12.82-10.87,12.64-6.29-.18-10.35-5.13-10.36-12.75q0-41.16,0-82.33c0-5.91,3-9.91,8-11.26a10.29,10.29,0,0,1,11.85,5.16,16.06,16.06,0,0,1,1.33,6.71c.12,13.8.06,27.61.06,41.41Z"
                                    transform="translate(-833 -413)" />
                                <path
                                    d="M929,562.53q0,21,0,41.92c0,4.8-2.09,8.39-6.49,10.29-4.21,1.81-8.49,1.25-11.43-2.23a13.57,13.57,0,0,1-3.17-8c-.23-28.1-.19-56.21-.12-84.32,0-6.74,4.63-11.34,10.74-11.19s10.41,4.78,10.44,11.59C929.05,534.59,929,548.56,929,562.53Z"
                                    transform="translate(-833 -413)" />
                            </svg>
                            <span>清空</span>
                        </div>
                    </div>
                </div>
                <div class="list-content" ref="listRef">
                    <template v-for="(item, index) in queueTracks">
                        <PlaybackQueueItem class="item"
                            :data="item" 
                            :index="index"
                            :actionable="true"
                            :active="playingIndex == index"
                            :class="{ 
                                'drag-target': (dragTargetIndex == index), 
                                'drag-over-mark': (dragOverIndex == index), 
                                'first': (dragOverIndex == 0) 
                            }"
                            :draggable="true" 
                            @dragstart="(event) => markDragStart(event, item, index)"
                            @dragenter="(event) => markDragOver(event, item, index)" 
                            @drop="moveDragItem"
                            @dragend="resetDragState">
                        </PlaybackQueueItem>
                    </template>
                </div>
            </div>
            <div class="lyric-wrap" v-if="isFullLyricShow">
                <LyricControl :track="currentTrack" 
                    :currentTime="currentTimeState" 
                    :hiddenMeta="true"
                    @mousewheel="onLyricUserMouseWheel" 
                    keyName="miniLayout">
                </LyricControl>
            </div>
        </div>
        <AppPopovers v-show="isQueueShow || isFullLyricShow">
        </AppPopovers>
    </div>
</template>

<style>
#app.mini, 
#app.mini #app-main-content,
.mini-layout {
    background: none !important;
}

.mini-layout {
    display: flex;
    flex: 1;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 4px;
    --cover-size: 90px;
    --others-lyric-ctl-extra-btn-bottom: 36px;
    --others-lyric-ctl-extra-btn-right: 20px;
}

.mini-layout .spacing {
    margin-left: 25px;
}

.mini-layout svg {
    -webkit-app-region: no-drag;
    cursor: pointer;
    fill: var(--button-icon-btn-color);
}

.mini-layout .active svg,
.mini-layout svg:hover {
    fill: var(--content-highlight-color);
}

.mini-layout > .header {
    position: fixed;
    top: 0px;
    left: 36px;
    border-radius: 10em;
    z-index: 99;

    width: calc(var(--cover-size) + 10px);
    height: calc(var(--cover-size) + 10px);
    background: var(--button-icon-btn-color);
    -webkit-app-region: drag;
    display: flex;
    align-items: center;
    justify-content: center;
}

.mini-layout > .header .cover-wrap {
    width: 100%; 
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--others-mini-layout-cover-progress-bg);
    border-radius: 10em;
}

.mini-layout > .header .cover {
    width: var(--cover-size);
    height: var(--cover-size);
    border-radius: 10em;
    animation: rotate360 10s linear infinite;
    animation-play-state: paused;
}

.mini-layout > .header .cover.rotation {
    animation-play-state: running !important;
}

.mini-layout > .center {
    width: calc(100% - 8px);
    height: calc(100% - 47px + 4px);
    border-radius: var(--border-app-win-border-radius);
    /*background: var(--app-bg-color);*/
    background-color: var(--app-bg-color);
    background-image: var(--app-bg-image);
    background-repeat: no-repeat;
    background-size: cover;
    display: flex;
    flex-direction: column;
    box-shadow: 0px 0px 4px #393939;
    overflow: hidden;
}

.mini-layout > .center > .content {
    -webkit-app-region: drag;
    width: 100%;
    height: 92px;
    display: flex;
    flex-direction: row;
    background: var(--content-bg-color);
}


.mini-layout > .center > .content .win-ctl-wrap {
    width: min-content;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding-top: 1px;
    padding-left: 12px;
    padding-right: 10px;
}

.mini-layout > .center > .content .win-ctl-wrap .quit-mini-btn {
    margin-top: 12px;
    transform: scale(1.03);
}

.mini-layout > .center > .content .win-ctl-wrap .pin-btn {
    margin-top: 12px;
}

.mini-layout > .center > .content .duration-wrap {
    flex: 1;
    display: flex;
    align-items: flex-end;
    justify-content: center;
}

.mini-layout > .center > .content .duration-wrap .duration {
    margin-bottom: 12px;
    font-size: calc(var(--content-text-tip-text-size) - 1px);
}

.mini-layout > .center > .content .play-ctl-wrap {
    flex: 4;
    display: flex;
    align-items: center;
    justify-content: center;
}

.mini-layout > .center > .content .play-ctl-wrap .favorite-btn {
    transform: translateY(1px);
}

.mini-layout > .center > .content .play-ctl-wrap .love-btn {
    fill: var(--content-highlight-color) !important;
    transform: translateY(1px);
}

.mini-layout > .center > .content .play-ctl-wrap .lyric-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    font-weight: bold;
    font-size: 20px;
    color: var(--button-icon-btn-color);
}

.mini-layout > .center > .content .meta-wrap {
    flex: 4;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    display: flex;
}

.mini-layout > .center > .content .meta-wrap .audio-title {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    text-align: left;
    word-wrap: break-word;
    line-break: anywhere;
    font-size: calc(var(--content-text-size) + 1px);
}

.mini-layout > .center > .content .meta-wrap .audio-artist {
    margin-top: 6px;
    font-size: calc(var(--content-text-size) - 2px);
    color: var(--content-subtitle-text-color);
}

.mini-layout > .center > .content .meta-wrap .audio-title,
.mini-layout > .center > .content .meta-wrap .audio-artist {
    margin-left: 25px;
    margin-right: 25px;
}

.mini-layout > .center > .content .mini-lyric-wrap {
    flex: 4;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    display: flex;
    overflow: hidden;
}

.mini-layout > .center > .content .mini-lyric-wrap .lyric-ctl .center {
    -webkit-mask-image: none;
    mask-image: none;
}

.mini-layout > .center > .content .mini-lyric-wrap .no-lyric,
.mini-layout > .center > .content .mini-lyric-wrap .line {
    font-size: calc(var(--content-text-size) + 2px) !important;
    line-height: calc(var(--content-text-size) + 3px) !important;
    font-weight: normal !important;
    color: var(--content-text-color) !important;
    margin: 0px 12px !important;

    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
}

.mini-layout > .center > .content .mini-lyric-wrap .lyric-ctl .extra-text
.mini-layout > .center > .content .mini-lyric-wrap .lyric-ctl .extra-btn,
.mini-layout > .center > .content .mini-lyric-wrap .lyric-ctl .scroll-locator {
    display: none !important;
}

.mini-layout > .center > .content .mini-lyric-wrap .loading-tip {
    margin-left: 30px;
    font-size: calc(var(--content-text-size) + 2px);
}

.mini-layout > .center > .content .mini-lyric-wrap .loading-tip span {
    animation-duration: 1.6s;
    animation-fill-mode: forwards;
    animation-iteration-count: infinite;
    animation-name: waitingsPoints;
    animation-timing-function: ease-in-out;
    display: inline-block;
    overflow: hidden;
}


.mini-layout > .center .playback-queue {
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    overflow: hidden;
    background: var(--content-bg-color);
}

.mini-layout > .center .playback-queue .list-header {
    display: flex;
    width: 100%;
    padding: 8px;
    padding-left: 33px;
    text-align: left;
    font-size: var(--content-text-tip-text-size);
    display: flex;
    align-items: center;
}

.mini-layout > .center .playback-queue .list-header .title {
    font-size: calc(var(--content-text-module-subtitle-size) - 2px);
    font-weight: bold;
}

.mini-layout > .center .playback-queue .list-header .subtitle {
    /*color: var(--content-subtitle-text-color);*/
    font-size: calc(var(--content-text-tip-text-size) - 2px);
    margin-left: 10px;
    margin-top: 8px;
}

.mini-layout > .center .playback-queue .list-header .action {
    display: flex;
    flex-direction: row;
    position: absolute;
    right: 18px;
}

.mini-layout > .center .playback-queue .list-header .action.icon-mode span {
    display: none;
}

.mini-layout > .center .playback-queue .list-header .action.icon-mode svg {
    width: 17px;
    height: 17px;
}

.mini-layout > .center .playback-queue .list-header .action.icon-mode .target-btn svg {
    width: 19px;
    height: 19px;
}

.mini-layout > .center .playback-queue .list-header .text-btn {
    text-align: left;
    font-size: var(--content-text-tip-text-size);
    display: flex;
    align-items: center;
    justify-items: center;
    cursor: pointer;
    margin-left: 20px;
}

.mini-layout > .center .playback-queue .list-content {
    width: 100%;
    flex: 1;
    overflow: scroll;
    overflow-x: hidden;
}

.mini-layout > .center .playback-queue .list-content .item {
    position: relative;
}

.mini-layout > .center .playback-queue .list-content .item.drag-target {
    background: var(--content-list-item-hover-bg-color);
}

.mini-layout > .center .playback-queue .list-content .item.drag-over-mark::before {
    content: "";
    display: block;
    width: 100%;
    height: 0px;
    border-bottom: 2.5px solid var(--content-highlight-color);
    position: absolute;
    top: -1px;
    z-index: 3;
}

.mini-layout > .center .playback-queue .list-content .item.first.drag-over-mark::before {
    top: 0px;
}

.mini-layout > .center .lyric-wrap {
    width: calc(100% - 36px);
    flex: 1;
    display: flex;
    padding-left: 18px;
    padding-right: 18px;
    overflow: scroll;
    overflow-x: hidden;
    background: var(--content-bg-color);
}

.mini-layout > .center .lyric-wrap .lyric-ctl,
.mini-layout > .center .lyric-wrap .center {
    width: 100%;
}

.mini-layout > .center .lyric-wrap .center {
    padding-right: 0px;
} 

.mini-layout > .center .lyric-wrap .line {
    width: calc(100% - 5px);
    padding-left: 5px;
}

.mini-layout > .center .lyric-wrap .scroll-locator {
    right: 20px;
}

.mini-layout > .center .lyric-wrap .scroll-locator-left {
    right: auto;
    left: 20px;
    margin-left: 0px;
}

@keyframes waitingsPoints {
    from {
        width: 0px;
    }

    to {
        width: 32px;
    }
}
</style>