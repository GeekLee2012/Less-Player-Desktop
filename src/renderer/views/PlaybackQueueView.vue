<script setup>
import { computed, inject, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import PlaybackQueueItem from '../components/PlaybackQueueItem.vue';
import { usePlayStore } from '../store/playStore';
import { useSettingStore } from '../store/settingStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { smoothScroll, stringEqualsIgnoreCase } from '../../common/Utils';
import { onEvents, emitEvents, offEvents } from '../../common/EventBusWrapper';
import EmptyControl from '../components/EmptyControl.vue';



const { visitRecents, visitBatchPlaybackQueue, visitPlaybackQueueSave } = inject('appRoute')

const { queueTracks, playingIndex, queueTracksSize } = storeToRefs(usePlayStore())
const { resetQueue, moveTrack, } = usePlayStore()
const { 
    showToast, hidePlaybackQueueView,
    hidePlayingView, hideAllCtxMenus,
    setRouterCtxCacheItem, 
} = useAppCommonStore()
const { 
    isPlaybackQueueAutoPositionOnShow, isPlaybackQueueCloseBtnShow,
    isPlaybackQueueHistoryBtnShow, isPlaybackQueuePositionBtnShow, 
    isPlaybackQueueBatchActionBtnShow, isPlaybackQueueViewTipsShow,
    isPlaybackQueueBtnIconMode, isPlaybackQueueSaveBtnShow,
} = storeToRefs(useSettingStore())
const { playbackQueueViewShow } = storeToRefs(useAppCommonStore())


const pbqRef = ref(null)
const listRef = ref(null)

const targetPlaying = () => {
    if (queueTracksSize.value < 1) return
    const queueItemsWrap = document.querySelector('.playback-queue-view .center')
    const queueItems = document.querySelectorAll('.playback-queue-view .center .item')
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

const onQueueEmpty = () => {
    if (queueTracksSize.value > 0) return
    showToast("当前播放已清空", () => {
        hidePlaybackQueueView()
        hidePlayingView()
    })
}

const clearAll = () => {
    if (queueTracksSize.value < 1) return
    resetQueue()
    onQueueEmpty()
}

const queueState = () => {
    const total = queueTracks.value.length
    let current = Math.min(Math.max(playingIndex.value + 1, 0), total)
    //TODO dragOverIndex有些情况下不准确
    if (dragOverIndex.value > -1) current = Math.min(Math.max(dragOverIndex.value + 1, 1), total)
    return total > 0 ? (current > 0 ? `${current} / ${total}首` : `${total}首`) : '0首'
}

let isUserMouseWheel = false, isPendingTargetPlaying = false
let userMouseWheelTimer = null
const onUserMouseWheel = () => {
    isUserMouseWheel = true
    if (userMouseWheelTimer) clearTimeout(userMouseWheelTimer)
    userMouseWheelTimer = setTimeout(() => {
        isUserMouseWheel = false
        if (isPendingTargetPlaying) targetPlaying()
        isPendingTargetPlaying = false
    }, 3000)
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

const isBtnWithIconMode = computed(() => {
    let iconNums = 1  //固定显示清空按钮
    if (isPlaybackQueuePositionBtnShow.value) ++iconNums
    if (isPlaybackQueueBatchActionBtnShow.value) ++iconNums
    if (isPlaybackQueueHistoryBtnShow.value) ++iconNums
    if (isPlaybackQueueSaveBtnShow.value) ++iconNums
    return isPlaybackQueueBtnIconMode.value || iconNums > 3
})

const saveQueue = () => {
    if (queueTracksSize.value < 1) return
    visitPlaybackQueueSave()
}


const tutorialList = [{
    title: '设置页 - 播放选项',
    artist: [ { id:'', name: '教程 - 当前播放' }],
    color: '#17b978',
}, {
    title: '关闭当前播放的教程提示',
    artist: [ { id:'', name: '教程 - 设置页 - 提示 - 当前播放提示' }],
    color: '#17b978',
}, {
    title: '非封面区域，拖拽移动排序',
    artist: [ { id:'', name: '教程 - 当前播放' }],
    color: '#17b978',
}, {
    title: '封面区域，拖拽保存',
    artist: [ { id:'', name: '教程 - 当前播放' }],
    color: '#17b978',
}, {
    title: '右键菜单：当前应用普遍支持',
    artist: [ { id:'', name: '教程' }],
    color: '#dff5f2',
}, {
    title: '右键菜单：任意位置',
    artist: [ { id:'', name: '教程  - 歌曲资源搜索' }],
    color: '#dff5f2',
}, {
    title: '右键关闭：迷你布局 - 歌词按钮',
    artist: [ { id:'', name: '教程  - 设置页 - 布局 - 迷你 - 关闭歌词' }],
    color: '#dff5f2',
}, {
    title: '格式：png、jpg、jpeg',
    artist: [ { id:'', name: '教程 - 图片 - 支持格式' }],
    color: '#ff9a3c',
}, {
    title: '格式：bmp、gif、webp、avif',
    artist: [ { id:'', name: '教程 - 图片 - 支持格式' }],
    color: '#ff9a3c',
}, {
    title: '拖拽图片到封面，更新封面',
    artist: [ { id:'', name: '教程 - 拖拽' }],
    color: '#7dace4',
}, {
    title: '拖拽图片到新建 / 编辑页',
    artist: [ { id:'', name: '教程 - 拖拽' }],
    color: '#7dace4',
}, {
    title: '拖拽大封面保存本地',
    artist: [ { id:'', name: '教程 - 拖拽' }],
    color: '#7dace4',
}, {
    title: '拖拽删除：音效 - 均衡器 - 自定义',
    artist: [ { id:'', name: '教程 - 拖拽' }],
    color: '#7dace4',
}, {
    title: '拖拽删除：视频播放 - 播放历史',
    artist: [ { id:'', name: '教程 - 拖拽' }],
    color: '#7dace4',
}, {
    title: '播放页 - 歌词 - 右键菜单',
    artist: [ { id:'', name: '教程 - 播放页' }],
    color: '#cbb4d4',
}, {
    title: '播放页 - 歌词 - 拖拽保存',
    artist: [ { id:'', name: '教程 - 播放页' }],
    color: '#cbb4d4',
}, {
    title: '播放页 - 播放到指定歌词行',
    artist: [ { id:'', name: '教程 - 播放页' }],
    color: '#cbb4d4',
}, {
    title: '播放页 - 频谱 - 左键',
    artist: [ { id:'', name: '教程 - 播放页 - 动感频谱' }],
    color: '#cbb4d4',
}, {
    title: '播放页 - 封面 - 右键',
    artist: [ { id:'', name: '教程 - 播放页 - 动感频谱' }],
    color: '#cbb4d4',
}, {
    title: '内存占用高，请降低图片清晰度',
    artist: [ { id:'', name: '教程 - 设置页 - 通用 - 图片清晰度' }],
    color: '#30e8bf',
}, {
    title: '窗口闪动：请开启“锁定为初始值”',
    artist: [ { id:'', name: '教程 - 设置页 - 通用 - 窗口缩放' }],
    color: '#30e8bf',
}, {
    title: '关闭时不退出：开启菜单栏图标',
    artist: [ { id:'', name: '教程 - 设置页 - 菜单栏' }],
    color: '#30e8bf',
}, {
    title: '带图标的元素，一般均可交互',
    artist: [ { id:'', name: '教程 - 交互 - 图标' }],
    color: '#d66d75',
}, {
    title: '左侧导航，带图标的标题 - 点击',
    artist: [ { id:'', name: '教程 - 交互 - 图标' }],
    color: '#d66d75',
}, {
    title: '左侧导航，当前应用Logo - 点击',
    artist: [ { id:'', name: '教程 - 交互 - 图标' }],
    color: '#d66d75',
}]


/* 生命周期、监听 */
watch([playbackQueueViewShow, playingIndex], ([isShow, index]) => {
    if (isShow && isPlaybackQueueAutoPositionOnShow.value) {
        if (isUserMouseWheel) {
            isPendingTargetPlaying = true
        } else {
            nextTick(targetPlaying)
        }
    }
}, { immediate: true })


const eventsRegistration = {
    'playbackQueue-empty': onQueueEmpty,
    'playbackQueue-targetPlaying': targetPlaying, 
}
onMounted(() => {
    onEvents(eventsRegistration)
    if (pbqRef.value) pbqRef.value.addEventListener('click', hideAllCtxMenus)
    if (listRef.value) listRef.value.addEventListener('scroll', hideAllCtxMenus)
})

onUnmounted(() => offEvents(eventsRegistration))
</script>

<template>
    <!-- click事件: 必须阻止冒泡，因为document全局监听click事件 -->
    <div class="playback-queue-view" @click.stop="" ref="pbqRef">
        <div class="container">
            <div class="header">
                <div class="title-wrap">
                    <div class="title content-text-highlight">当前播放</div>
                    <div class="action" v-show="isPlaybackQueueCloseBtnShow">
                        <div class="close-btn btn" @click="hidePlaybackQueueView">
                            <svg width="12" height="12" viewBox="0 0 593.14 593.11" data-name="Layer 1"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z"
                                    transform="translate(-663.4 -243.46)" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="detail">
                    <div class="subtitle" v-html="queueState()"></div>
                    <div class="action" :class="{ 'icon-mode': isBtnWithIconMode }">
                        <div class="save-btn btn text-btn" 
                            v-show="isPlaybackQueueSaveBtnShow"
                            @click="saveQueue">
                            <svg width="15" height="15" viewBox="0 0 853.61 853.59" xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M426.39,853.55h-199c-32.66,0-65.33.12-98,0C69.66,853.23,19.5,815.14,4.57,758.06A138.7,138.7,0,0,1,.21,723.51Q-.18,426.78.06,130.05c0-64,42.59-115.66,105-127.71A135.26,135.26,0,0,1,130.43.14q232-.19,464-.14c13.93,0,25.46,4.72,35.34,14.64Q733.72,118.89,838,222.83c10.58,10.53,15.62,22.58,15.61,37.48-.13,154,.12,308-.2,462-.1,53.18-24.09,92.8-71.21,117.81-18.61,9.87-38.86,13.47-59.83,13.47Q574.38,853.52,426.39,853.55Zm-170-640h6.94q143.49,0,287,0c3,0,6,0,9,.23,22.36,1.7,40.48,23.55,38,45.78-2.61,23.46-20.15,39.22-43.88,39.22q-168.49,0-337,0c-27.74,0-45.64-17.9-45.64-45.63q0-80.73,0-161.48V85.85c-16.65,0-32.66-.59-48.59.31-6,.33-12.33,3.23-17.49,6.55-13.7,8.82-19.26,22-19.25,38.28q.18,295.72.08,591.45c0,1.67,0,3.33.06,5,.74,18.92,14,35.43,32.57,39.27,7.24,1.5,14.89,1.14,22.36,1.29,9.94.19,19.88,0,30.26,0v-6.49q0-144.49,0-289c0-28,17.85-45.78,46-45.78h420c28.4,0,46,17.71,46,46.22V768c13.88,0,27,0,40.19,0,27.25,0,45-17.78,45-45q0-222.22.08-444.46a10.66,10.66,0,0,0-3.39-8.3q-90.8-90.57-181.37-181.34A10.63,10.63,0,0,0,575,85.48q-156.49.12-313,.07h-5.71Zm340.86,554.3V512.5H256.41V767.85Z" />
                                    </g>
                                </g>
                            </svg>
                            <span>保存</span>
                        </div>
                        <div class="batch-action-btn text-btn" 
                            @click="visitBatchPlaybackQueue" 
                            v-show="isPlaybackQueueBatchActionBtnShow">
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
                        <div class="history-btn text-btn" 
                            @click="visitRecents" 
                            v-show="isPlaybackQueueHistoryBtnShow">
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
                        <div class="target-btn text-btn" 
                            @click="targetPlaying" 
                            v-show="isPlaybackQueuePositionBtnShow">
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
                        <div class="more-btn" v-show="false">
                            <svg width="14" height="14" viewBox="0 0 106.42 666" xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path d="M0,53a53.21,53.21,0,1,1,53.14,53.41A53,53,0,0,1,0,53Z" />
                                        <path d="M106.42,309.4A53.21,53.21,0,1,1,53.28,256,53,53,0,0,1,106.42,309.4Z" />
                                        <path d="M106.42,565.42A53.21,53.21,0,1,1,53.3,512,53,53,0,0,1,106.42,565.42Z" />
                                    </g>
                                </g>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
            <div class="center" ref="listRef" :onmousewheel="onUserMouseWheel">
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
                <PlaybackQueueItem v-for="(item, index) in tutorialList"
                    v-show="isPlaybackQueueViewTipsShow && queueTracks.length < 1"
                    class="item" 
                    :data="item"
                    :index="index">
                </PlaybackQueueItem>
                <EmptyControl marginTop="168px"
                    v-show="!isPlaybackQueueViewTipsShow && queueTracks.length < 1">
                </EmptyControl>
            </div>
        </div>
    </div>
</template>

<style>
.playback-queue-view {
    display: flex;
    -webkit-app-region: none;
    overflow: hidden;
}

.playback-queue-view .container {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    background: var(--content-bg-color);
    background: var(--content-bg-color-no-transparent);
}

.playback-queue-view .header {
    padding: 20px 15px 10px 10px;
    border-bottom: none;
}


.playback-queue-view .header .title-wrap {
    display: flex;
    flex-direction: row;
}

.playback-queue-view .header .title {
    text-align: left;
    /*font-size: 23px;*/
    font-size: var(--content-text-module-subtitle-size);
    font-weight: bold;
}

.playback-queue-view .header .title-wrap .subtitle {
    color: var(--content-subtitle-text-color);
}

.playback-queue-view .header .title-wrap .action {
    display: flex;
    flex-direction: row;
    position: absolute;
    right: 18px;
    top: 18px;
}

.playback-queue-view .detail {
    margin-top: 8px;
    margin-left: 3px;
    text-align: left;
    font-size: var(--content-text-tip-text-size);
    display: flex;
}

.playback-queue-view .detail .subtitle {
    color: var(--content-subtitle-text-color);
}

.playback-queue-view .detail .action {
    display: flex;
    flex-direction: row;
    position: absolute;
    right: 18px;
}

.playback-queue-view .detail .action.icon-mode span {
    display: none;
}

.playback-queue-view .detail .action.icon-mode svg {
    width: 17px;
    height: 17px;
}

.playback-queue-view .detail .action.icon-mode .target-btn svg {
    width: 18.5px;
    height: 18.5px;
}

.playback-queue-view .text-btn {
    text-align: left;
    font-size: var(--content-text-tip-text-size);
    display: flex;
    align-items: center;
    justify-items: center;
    cursor: pointer;
    margin-left: 20px;
}

.playback-queue-view .more-btn {
    cursor: pointer;
    margin-top: 4px;
    margin-left: 15px;
}

.playback-queue-view .more-btn:hover svg {
    fill: var(--content-highlight-color);
}

.playback-queue-view .center {
    position: relative;
    flex: 1;
    overflow: scroll;
    overflow-x: hidden;
}

.playback-queue-view .center .item {
    position: relative;
}

.playback-queue-view .center .item.drag-target {
    background: var(--content-list-item-hover-bg-color);
}

.playback-queue-view .center .item.drag-over-mark::before {
    content: "";
    display: block;
    width: 100%;
    height: 0px;
    border-bottom: 2.5px solid var(--content-highlight-color);
    position: absolute;
    top: -1px;
    z-index: 3;
}

.playback-queue-view .center .item.first.drag-over-mark::before {
    top: 0px;
}
</style>