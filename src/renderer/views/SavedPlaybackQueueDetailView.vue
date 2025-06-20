<script setup>
import { onMounted, onActivated, ref, reactive, watch, onUpdated, inject, nextTick, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlayStore } from '../store/playStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { usePlaybackQueueStore } from '../store/playbackQueueStore';
import { useSettingStore } from '../store/settingStore';
import SongListControl from '../components/SongListControl.vue';
import LoadingMask from '../components/LoadingMask.vue';
import PlayAddAllBtn from '../components/PlayAddAllBtn.vue';
import DeleteAllBtn from '../components/DeleteAllBtn.vue';
import BatchActionBtn from '../components/BatchActionBtn.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import SearchBarExclusiveModeControl from '../components/SearchBarExclusiveModeControl.vue';
import { coverDefault, isSupportedImage, randomTextWithinAlphabetNums, toYyyymmddHhMmSs } from '../../common/Utils';
import { onEvents, emitEvents, offEvents } from '../../common/EventBusWrapper';


const { visitPlaylistQueueEdit, backward } = inject('appRoute')
const { showConfirm } = inject('apiExpose')

const props = defineProps({
    exploreMode: String,
    id: String
})

const contentRef = ref(null)
const back2TopBtnRef = ref(null)
const detail = reactive({})
let offset = 0, page = 1, limit = 1000, total = 0
let markScrollTop = 0
const isLoading = ref(true)
const dataListId = ref(null)
const searchKeyword = ref(null)
const timeIndex = ref(1)
const setLoading = (value) => (isLoading.value = value)
const setSearchKeyword = (value) => (searchKeyword.value = value)
const setDataListId = (value) => (dataListId.value = value)
const setTimeIndex = (value) => (timeIndex.value = value)

const { addTracks, resetQueue, playNextTrack } = usePlayStore()
const { showToast, updateCommonCtxItem } = useAppCommonStore()
const { getQueue, getQueueAsync, updateQueue, removeQueue, } = usePlaybackQueueStore()
const { isShowDialogBeforeBatchDelete, isSearchForCustomPlaylistShow, 
    isMiniNavBarMode, isShowDialogBeforeDeletePlaybackQueue, } = storeToRefs(useSettingStore())

const resetView = () => {
    Object.assign(detail, { cover: '', title: '', about: '', data: [] })
    offset = 0
    page = 1
    total = 0
}

const nextPage = () => {
    if (detail.data.length >= total) return false
    offset = page * limit
    page = page + 1
    return true
}

const filterSongsWithKeyword = (list) => {
    let keyword = searchKeyword.value
    let result = list
    if (keyword) {
        keyword = keyword.toLowerCase()
        result = result.filter(item => {
            const { title, artist, album } = item
            if (title.toLowerCase().includes(keyword)) {
                return true
            }
            if (album && album.name) {
                if (album.name.toLowerCase().includes(keyword)) {
                    return true
                }
            }
            if (artist) {
                for (var i = 0; i < artist.length; i++) {
                    const { name } = artist[i]
                    if (name && name.toLowerCase().includes(keyword)) {
                        return true
                    }
                }
            }
            return false
        })
    }
    return result
}

const loadContent = async () => {
    setLoading(true)
    const queue = await getQueueAsync(props.id)
    if (!queue) {
        const _now = Date.now()
        Object.assign(detail, { 
            title: '播放队列找不到啦', 
            about: '神秘空间：404', 
            data: [], 
            created: _now,
            updated: _now
        })
        return
    }
    Object.assign(detail, { ...queue })
    updateCommonCtxItem(queue)
    let { data } = queue
    Object.assign(detail, { data: filterSongsWithKeyword(data) })
    setDataListId(randomTextWithinAlphabetNums(16))
    setLoading(false)
}

const loadMoreContent = () => {
    if (nextPage()) {
        loadContent()
    }
}

const getAbout = () => {
    return (detail.about && detail.about.trim().length > 0) ?
        detail.about.trim() : "还没有简介 ~ "
}

const playAll = () => {
    if (!detail.data || detail.data.length < 1) return
    resetQueue()
    addAll("即将为您播放全部")
    playNextTrack()
}

const addAll = (text) => {
    if (!detail.data || detail.data.length < 1) return
    addTracks(detail.data)
    showToast(text || "歌曲已全部添加")
}

const removePlaybackQueue = async () => {
    if (isShowDialogBeforeDeletePlaybackQueue.value) {
        const ok = await showConfirm('确定要删除播放队列吗？')
        if (!ok) return
    }
    removeQueue(detail)
    backward()
    showToast("播放队列已删除")
}


const markScrollState = () => {
    markScrollTop = contentRef.value.scrollTop
}

const resetScrollState = () => {
    markScrollTop = 0
    contentRef.value.scrollTop = markScrollTop
}

const restoreScrollState = () => {
    if (markScrollTop < 1) return
    contentRef.value.scrollTop = markScrollTop
}

const scrollToLoad = () => {
    const scrollTop = contentRef.value.scrollTop
    const scrollHeight = contentRef.value.scrollHeight
    const clientHeight = contentRef.value.clientHeight
    markScrollState()
    if ((scrollTop + clientHeight) >= scrollHeight) {
        loadMoreContent()
    }
}

const onScroll = () => {
    scrollToLoad()
}

const resetBack2TopBtn = () => {
    if (!back2TopBtnRef.value || !contentRef.value) return
    back2TopBtnRef.value.setScrollTarget(contentRef.value)
}

const titleRef = ref(null)
const isTwoLinesTitle = ref(false)
const setTwoLinesTitle = (value) => isTwoLinesTitle.value = value
const detectTitleHeight = () => {
    const titleEl = titleRef.value
    if (!titleEl) return
    const { clientHeight } = titleEl
    if (!clientHeight) return
    setTwoLinesTitle(clientHeight > 50)
}

const filterContent = (keyword) => {
    setSearchKeyword(keyword)
    loadContent()
}

const queueCoverOnDrop = (event) => {
    event.preventDefault()
    const { files } = event.dataTransfer

    if (files.length < 1) return

    const { path } = files[0]
    let isEventStopped = true
    if (isSupportedImage(path)) {
        const { id, title, about } = detail
        const cover = path
        updateQueue({ id, title, about, cover }) 
            && Object.assign(detail, { cover })
    } else {
        isEventStopped = false
    }
    if (isEventStopped) event.stopPropagation()
}



/* 生命周期、监听 */
watch(() => props.id, () => {
    resetView()
    resetScrollState()
    resetBack2TopBtn()
    loadContent()
})

watch(isMiniNavBarMode, () => nextTick(detectTitleHeight))

const eventsRegistration = {
    'app-resize': detectTitleHeight, 
    'playbackQueue-removed': (id) => {
        if(props.id == id) backward()
    }
}

onMounted(() => {
    onEvents(eventsRegistration)
    resetView()
    resetBack2TopBtn()
    loadContent()
})

onActivated(() => {
    restoreScrollState()
    nextTick(detectTitleHeight)
    loadContent()
})

onUnmounted(() => offEvents(eventsRegistration))
onUpdated(() => resetBack2TopBtn())
</script>

<template>
    <div id="saved-playbackQueue-detail-view" ref="contentRef" @scroll="onScroll">
        <div class="header">
            <div>
                <img class="cover" v-lazy="coverDefault(detail.cover)" 
                @dragover="e => e.preventDefault()" @drop="queueCoverOnDrop" />
            </div>
            <div class="right" v-show="!isLoading">
                <div class="title" v-html="detail.title" ref="titleRef"></div>
                <div class="about" v-html="getAbout()" :class="{ 'short-about': isTwoLinesTitle }"></div>
                <div class="edit-wrap">
                    <div class="edit-btn" @click="() => visitPlaylistQueueEdit(id)">
                        <svg width="19" height="19" viewBox="0 0 992.3 992.23" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M428.27,992.13c-88.16,0-176.32.28-264.48-.1-56.56-.24-101.65-23.86-134.6-69.78A150.76,150.76,0,0,1,.34,833.37C0,743.21.19,653.05.18,562.89c0-88-.5-176,.17-264C.82,236.36,29,188.83,82.63,156.81c25.32-15.11,53.25-21.18,82.69-21.15q161,.15,322,.06c26.66,0,45.78,15.33,50.38,40,5,26.58-15,53-41.88,55.53-3.31.31-6.66.42-10,.42q-159.75,0-319.49-.06c-25.45,0-45.64,9.41-59.78,30.75-7.47,11.29-10.42,23.92-10.41,37.45q.09,229.23,0,458.47,0,35.25,0,70.5c.06,38.34,29,67.32,67.42,67.33q264.74,0,529.47,0c38.53,0,67.21-28.52,67.44-67.25.21-32.66.05-65.33.05-98q0-112.74,0-225.49c0-19.14,7-34.41,23.5-44.58,30.3-18.63,70.25,2.33,72.32,37.83.13,2.17.21,4.33.21,6.5q0,161.24,0,322.48c0,47.47-16.82,87.91-51.29,120.5-30,28.4-66.18,43.56-107.53,43.81-89.83.52-179.66.16-269.49.16Z" />
                                    <path
                                        d="M417,473.1c1.08-20.29,2.1-40.59,3.27-60.88a46.93,46.93,0,0,1,11.63-28.62c1.74-2,3.64-3.89,5.53-5.78L798.28,16.91c22.51-22.5,50.7-22.57,73.22-.07q52.15,52.11,104.27,104.27c22,22,22.06,50.57.07,72.54Q794.42,374.91,613,556.14c-10.34,10.34-22.49,15.36-37,16.06q-50.93,2.47-101.8,5.69c-14.62.91-28.69.35-40.88-9.11-12.48-9.69-19.48-22.41-19.12-38.27.43-19.15,1.73-38.28,2.65-57.41Zm95.78,6.38c13.28-.76,25.7-1.6,38.15-2.09a12.52,12.52,0,0,0,9.12-4q156.09-156.07,312.3-312c1.26-1.26,2.43-2.58,3.23-3.43l-41.31-41.26-72.48,72.49Q640.15,310.8,518.56,432.44c-1.44,1.45-3.22,3.37-3.35,5.18C514.19,451.23,513.55,464.86,512.74,479.48Z" />
                                </g>
                            </g>
                        </svg>
                    </div>
                    <div class="time">
                        <div v-show="timeIndex == 0"><span @click="setTimeIndex(1)">创建时间</span>：{{ toYyyymmddHhMmSs(detail.created) }}</div>
                        <div v-show="timeIndex == 1"><span @click="setTimeIndex(0)">最后更新</span>：{{ toYyyymmddHhMmSs(detail.updated) }}</div>
                    </div>
                </div>
                <div class="action">
                    <PlayAddAllBtn class="btn-spacing" 
                        :leftAction="playAll" 
                        :rightAction="() => addAll()">
                    </PlayAddAllBtn>
                    <DeleteAllBtn class="btn-spacing" 
                        text="删除队列"
                        :leftAction="removePlaybackQueue" >
                    </DeleteAllBtn>
                </div>
            </div>
            <div class="right" v-show="isLoading">
                <div class="title">
                     <LoadingMask :loading="isLoading" width="88%" height="36px" />
                </div>
                <div class="about">
                    <LoadingMask :loading="isLoading" :count="3" width="100%" height="23px" />
                </div>
                <div class="edit-wrap">
                    <LoadingMask :loading="isLoading" width="288px" height="23px" />
                </div>
                <div class="action">
                    <LoadingMask :loading="isLoading" :count="2" 
                        :classList="{ 'btn-spacing': true }" 
                        width="188px" height="36px" />
                </div>
            </div>
        </div>
        <div class="center">
            <div class="list-title">
                <span class="size-text content-text-highlight" v-show="!isLoading">列表({{ detail.data.length }})</span>
                <SearchBarExclusiveModeControl class="search-wrap" v-show="!isLoading && isSearchForCustomPlaylistShow"
                    :onKeywordChanged="filterContent">
                </SearchBarExclusiveModeControl>

                <LoadingMask :loading="isLoading" width="150px" height="28px" />
                <LoadingMask :loading="isLoading && isSearchForCustomPlaylistShow"
                    :classList="{ 'search-wrap': true }" 
                    width="168px" height="28px" marginRight="10px" />
            </div>
            <SongListControl
                :id="dataListId"
                :data="detail.data" 
                :artistVisitable="true" 
                :albumVisitable="true" 
                :loading="isLoading"
                :dataType="12">
            </SongListControl>
        </div>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style>
#saved-playbackQueue-detail-view {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 20px 33px 10px 33px;
    overflow: scroll;
    overflow-x: hidden;
}

#saved-playbackQueue-detail-view .header {
    display: flex;
    flex-direction: row;
    margin-bottom: 16px;
    --cover-size: 239px;
    height: var(--cover-size);
}

#saved-playbackQueue-detail-view .header .right {
    flex: 1;
    margin-left: 30px;
}

#saved-playbackQueue-detail-view .header .title,
#saved-playbackQueue-detail-view .header .about {
    text-align: left;
    margin-bottom: 10px;
}

#saved-playbackQueue-detail-view .header .title {
    font-size: var(--content-text-module-title-size);
    font-weight: bold;

    overflow: hidden;
    word-wrap: break-all;
    white-space: pre-wrap;
    line-break: anywhere;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
}

#saved-playbackQueue-detail-view .header .about {
    height: 106px;
    /*line-height: 21px;*/
    line-height: var(--content-text-line-height);
    color: var(--content-subtitle-text-color);
    overflow: hidden;
    word-wrap: break-all;
    white-space: pre-wrap;
    line-break: anywhere;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
    line-clamp: 4;
    margin-bottom: 10px;
    /*font-size: 15px;*/
    letter-spacing: calc(var(--content-text-letter-spacing) + 0.5px);
}

#saved-playbackQueue-detail-view .header .short-about {
    height: 60px;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    margin-bottom: 10px;
}

#saved-playbackQueue-detail-view .right .edit-wrap {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 10px;
}

#saved-playbackQueue-detail-view .right .edit-wrap .edit-btn {
    display: flex;
    align-items: center;
    margin-right: 8px;
}

#saved-playbackQueue-detail-view .edit-btn svg {
    fill: var(--button-icon-btn-color);
    cursor: pointer;
    transform: translateY(-1px);
}

#saved-playbackQueue-detail-view .edit-btn svg:hover {
    fill: var(--content-highlight-color);
}

#saved-playbackQueue-detail-view .time {
    /*font-size: 13px;*/
    font-size: var(--content-text-tip-text-size);
    font-weight: 520;
    color: var(--content-subtitle-text-color);
    text-align: left;
}

#saved-playbackQueue-detail-view .time:hover span {
    cursor: pointer;
    color: var(--content-highlight-color);
    font-weight: bold;
}

#saved-playbackQueue-detail-view .header .cover {
    width: var(--cover-size);
    height: var(--cover-size);
    border-radius: 6px;
    box-shadow: 0px 0px 1px #161616;
}

#saved-playbackQueue-detail-view .action {
    display: flex;
    flex-direction: row;
}

#saved-playbackQueue-detail-view .btn-spacing {
    margin-right: 20px;
}

#saved-playbackQueue-detail-view .list-title {
    margin-bottom: 6px;
    text-align: left;
    font-weight: bold;
    display: flex;
    position: relative;
    align-items: center;
}

#saved-playbackQueue-detail-view .list-title .size-text {
    margin-left: 3px;
    padding-bottom: 6px;
    border-bottom: 3px solid var(--content-highlight-color);
    font-size: var(--content-text-tab-title-size);
}

#saved-playbackQueue-detail-view .list-title .search-wrap {
    font-size: calc(var(--content-text-tab-title-size) - 1.5px);
    position: absolute;
    right: -10px;
    font-weight: bold;
}
</style>