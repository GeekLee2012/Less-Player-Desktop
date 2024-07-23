<script setup>
import { onActivated, reactive, ref, watch, inject, nextTick, onDeactivated } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { usePlatformStore } from '../store/platformStore'
import Back2TopBtn from '../components/Back2TopBtn.vue';
import { coverDefault, md5, trimExtraChars } from '../../common/Utils';
import { onEvents, emitEvents } from '../../common/EventBusWrapper';
import { useVideoPlayStore } from '../store/videoPlayStore';



const props = defineProps({
    platform: String,
    id: String,
    href: String,
})

const { getVendor } = usePlatformStore()
const { showToast, hideAllCtxMenus,  } = useAppCommonStore()
const { resetQueue, addVideo, playNextVideo, playVideoByIndex } = useVideoPlayStore()


const detail = reactive({ cover: '', title: '', about: '', data: [] })
const filteredData = ref(null)
const listTitle = ref('视频')
const listSizeText = ref('0')
const videoDetailRef = ref(null)
const back2TopBtnRef = ref(null)
let offset = 0, page = 1, limit = 1000
let markScrollTop = 0
const isLoading = ref(true)
const setLoading = (value) => isLoading.value = value
const titleRef = ref(null)
const isTwoLinesTitle = ref(false)
const setTwoLinesTitle = (value) => isTwoLinesTitle.value = value


const updateListSizeText = () => {
    const { data } = detail
    listSizeText.value = data.length
}

const resetView = () => {
    Object.assign(detail, { cover: '', title: '', about: '', data: [] })
    offset = 0
    page = 1
    detail.total = 0
    updateListSizeText()
}


const nextPage = () => {
    if (page >= detail.totalPage) return false
    offset = page * limit
    page = page + 1
    return true
}

const loadContent = async (noLoadingMask) => {
    if (!noLoadingMask) setLoading(true)
    //checkFavorite()

    const vendor = getVendor(props.platform)
    if (!vendor || !vendor.videoDetail) return
    let maxRetry = 3, retry = 0, success = false, result = null
    const { id, platform, href } = props
    const _href = href ? href.replace(/@/g, '/') : ''
    do {
        result = await vendor.videoDetail(id, { id, platform, href: _href })
        if (!result || result.data.length < 1) {
            ++retry
            continue
        }
        if (page > 1) result.data.unshift(...detail.data)
        if (!result.total) detail.total = 0
        if (!result.totalPage) detail.totalPage = 1
        Object.assign(detail, result)
        updateListSizeText()
        setLoading(false)
        success = true
        break
    } while (retry > 0 && retry < maxRetry)
    if (!success) { //回退分页信息，并提示
        page = page - 1
        offset = page * limit
        if (offset < detail.total) showToast('网络异常！请稍候重试')
    }
}

const loadMoreContent = () => {
    nextPage() && loadContent(true)
}

const playAll = () => {
    const { id, platform, title, cover, data,  } = detail
    if(!data || data.length < 1) return

    showToast('即将为您播放全部视频')
    resetQueue()
    data.forEach(item => addVideo({
        ...item,
        id: md5(item.title),
        platform, 
        cTitle: title, 
        cover,
    }))
    playNextVideo()
}


const markScrollState = () => {
    if (videoDetailRef.value) markScrollTop = videoDetailRef.value.scrollTop
}

const resetScrollState = () => {
    markScrollTop = 0
    if (videoDetailRef.value) videoDetailRef.value.scrollTop = markScrollTop
}

const restoreScrollState = () => {
    if (markScrollTop < 1) return
    if (videoDetailRef.value) videoDetailRef.value.scrollTop = markScrollTop
    checkFavorite()
}

const scrollToLoad = () => {
    if (isLoading.value) return
    const scrollTop = videoDetailRef.value.scrollTop
    const scrollHeight = videoDetailRef.value.scrollHeight
    const clientHeight = videoDetailRef.value.clientHeight
    markScrollState()
    const allowedError = 3 //允许误差
    if ((scrollTop + clientHeight + allowedError) >= scrollHeight) {
        loadMoreContent()
    }
}

//TODO
const onScroll = () => {
    hideAllCtxMenus()
    scrollToLoad()
}

const resetBack2TopBtn = () => {
    if (back2TopBtnRef.value) {
        back2TopBtnRef.value.setScrollTarget(videoDetailRef.value)
    }
}

const detectTitleHeight = () => {
    const titleEl = titleRef.value
    if (!titleEl) return
    const { clientHeight } = titleEl
    if (!clientHeight) return
    setTwoLinesTitle(clientHeight > 50)
}

const playItem = (item, index) => {
    const { id, platform, title, cover, data,  } = detail
    if(!data || data.length < 1) return

    showToast('即将为您播放视频')
    resetQueue()
    data.forEach(item => {
        addVideo({
            ...item,
            id: md5(item.title),
            platform, 
            cTitle: title, 
            cover,
        })
    })
    playVideoByIndex(index)
}

/* 生命周期、监听 */
onActivated(() => {
    restoreScrollState()
    detectTitleHeight()
    resetBack2TopBtn()
    //visitRouterCtxCacheItem()
})

watch(() => props.id, () => {
    resetView()
    resetScrollState()
    //resetBack2TopBtn()
    loadContent()
}, { immediate: true })

watch(isLoading, () => nextTick(detectTitleHeight))

onEvents({
    'app-resize': detectTitleHeight, 
    //'playlist-linkItem': visitLinkItem
})
</script>

<template>
    <div id="video-detail-view" ref="videoDetailRef" @scroll="onScroll">
        <div class="header">
            <div>
                <img class="cover" v-lazy="coverDefault(detail.cover)" />
            </div>
            <div class="right" v-show="!isLoading">
                <div class="title" v-html="detail.title" ref="titleRef"></div>
                <div class="about" v-html="trimExtraChars(detail.about)" :class="{ 'short-about': isTwoLinesTitle }"></div>
                <div class="action">
                    <SvgTextButton :leftAction="() => playAll()" text="播放全部"  class="btn-spacing">
                        <template #left-img>
                            <svg width="18" height="18" viewBox="0 0 139 139" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"
                                xmlns:xlink="http://www.w3.org/1999/xlink">
                                <path
                                    d="M117.037,61.441L36.333,14.846c-2.467-1.424-5.502-1.424-7.972,0c-2.463,1.423-3.982,4.056-3.982,6.903v93.188  c0,2.848,1.522,5.479,3.982,6.9c1.236,0.713,2.61,1.067,3.986,1.067c1.374,0,2.751-0.354,3.983-1.067l80.704-46.594  c2.466-1.422,3.984-4.054,3.984-6.9C121.023,65.497,119.502,62.866,117.037,61.441z" />
                            </svg>
                        </template>
                    </SvgTextButton>
                </div>
            </div>
            <div class="right" v-show="isLoading">
                <div class="title">
                    <div class="loading-mask" style="width: 88%; height: 39px; display: inline-block;"></div>
                </div>
                <div class="about">
                    <div class="loading-mask" v-for="i in 3" style="width: 100%; height: 23px; display: inline-block;">
                    </div>
                </div>
                <div class="action">
                    <div class="loading-mask btn-spacing" v-for="i in 1"
                        style="width: 188px; height: 36px; display: inline-block;"></div>
                </div>
            </div>
        </div>
        <div class="center">
            <div class="list-title">
                <div class="size-text content-text-highlight" v-show="!isLoading">{{ listTitle }}({{ listSizeText }})</div>
                <div class="loading-mask" v-show="isLoading"
                    style="text-align: left;width: 150px; height: 28px; display: inline-block;"></div>
            </div>
            <div class="video-list" v-show="!isLoading">
                <div v-for="(item, index) in detail.data" class="item" v-html="item.title" 
                    @click="() => playItem(item, index)">  
                </div>
            </div>
            <div class="video-list" v-show="isLoading" >
                <div class="loading-mask item"  v-for="i in 30">
                </div>
            </div>
            
        </div>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style>
#video-detail-view {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 20px 33px 10px 33px;
    overflow: scroll;
    overflow-x: hidden;
}

#video-detail-view .header {
    display: flex;
    flex-direction: row;
    margin-bottom: 25px;
}

#video-detail-view .header .right {
    flex: 1;
    margin-left: 25px;
}

#video-detail-view .header .title,
#video-detail-view .header .about {
    text-align: left;
    margin-bottom: 10px;
}

#video-detail-view .header .title {
    /*font-size: 30px;*/
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
    margin-bottom: 3px;

    overflow: hidden;
    word-wrap: break-all;
    white-space: pre-wrap;
    line-break: anywhere;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}

#video-detail-view .header .about {
    height: 139px;
    /*line-height: 23px;*/
    line-height: var(--content-text-line-height);
    font-size: var(--content-text-subtitle-size);
    color: var(--content-subtitle-text-color);
    letter-spacing: calc(var(--content-text-letter-spacing) + 0.5px);

    overflow: hidden;
    word-wrap: break-word;
    line-break: anywhere;
    /*white-space: pre-wrap;*/
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 5;
}

#video-detail-view .header .short-about {
    height: 105px;
    -webkit-line-clamp: 4;
}

#video-detail-view .header .cover {
    width: 236px;
    height: 236px;
    border-radius: 6px;
    box-shadow: 0px 0px 1px #161616;
}

#video-detail-view .header .cover.draggable {
    -webkit-user-drag: auto !important;
}

#video-detail-view .action {
    display: flex;
    flex-direction: row;
}

#video-detail-view .btn-spacing {
    margin-right: 20px;
}

#video-detail-view .list-title {
    margin-bottom: 6px;
    text-align: left;
    font-size: var(--content-text-tab-title-size);
    /*font-size: calc(var(--content-text-tab-title-size) - 1px);*/
    font-weight: bold;
    display: flex;
    align-items: center;
    position: relative;
}

#video-detail-view .list-title .size-text {
    margin-left: 2px;
    padding-bottom: 5px;
    border-bottom: 3px solid var(--content-highlight-color);
}

#video-detail-view .center .video-list {
    display: flex;
    flex-wrap: wrap;
    margin: 15px 0px;
}

#video-detail-view .center .video-list .item {
    display: flex;
    width: 101px;
    height: 39px;
    padding: 3px;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin: 0px 20px 20px 0px;
    font-size: var(--content-text-size);
    border-radius: 5px;
}

#video-detail-view .center .video-list .item:hover {
    background: var(--content-list-item-hover-bg-color);
}
</style>