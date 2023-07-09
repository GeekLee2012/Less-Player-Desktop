<script setup>
import { onMounted, onActivated, reactive, ref, watch, inject, nextTick, onDeactivated } from 'vue';
import { storeToRefs } from 'pinia';
import EventBus from '../../common/EventBus';
import { useAppCommonStore } from '../store/appCommonStore';
import { useUserProfileStore } from '../store/userProfileStore';
import { usePlatformStore } from '../store/platformStore'
import { usePlayStore } from '../store/playStore';
import { useSettingStore } from '../store/settingStore';
import SongListControl from '../components/SongListControl.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import PlayAddAllBtn from '../components/PlayAddAllBtn.vue';
import FavoriteShareBtn from '../components/FavoriteShareBtn.vue';



const props = defineProps({
    platform: String,
    id: String
})

const { addAndPlayTracks, playPlaylist } = inject('player')

const { getVendor } = usePlatformStore()
const { addTracks } = usePlayStore()
const { showToast, hideAllCtxMenus, setSearchBarExclusiveAction } = useAppCommonStore()
const { searchBarExclusiveAction } = storeToRefs(useAppCommonStore())
const { isSearchForOnlinePlaylistShow } = storeToRefs(useSettingStore())



const detail = reactive({})
const filteredData = ref(null)
const listSizeText = ref("0")
const playlistDetailRef = ref(null)
const back2TopBtnRef = ref(null)
let offset = 0, page = 1, limit = 1000
let markScrollTop = 0
const isLoading = ref(true)
const setLoading = (value) => isLoading.value = value
const searchKeyword = ref(null)
const setSearchKeyword = (value) => searchKeyword.value = value
const titleRef = ref(null)
const isTwoLinesTitle = ref(false)
const setTwoLinesTitle = (value) => isTwoLinesTitle.value = value


const updateListSizeText = () => {
    const total = detail.total
    const length = filteredData.value ? filteredData.value.length : detail.data.length
    const text = total > length ? `${length} / ${total}` : length
    listSizeText.value = text
}

const resetView = () => {
    Object.assign(detail, { cover: 'default_cover.png', title: '', about: '', data: [] })
    offset = 0
    page = 1
    detail.total = 0
    updateListSizeText()
}

const nextPage = () => {
    //TODO
    if (detail.total < 1) return false
    offset = page * limit
    page = page + 1
    return true
}

const loadContent = async (noLoadingMask) => {
    if (!noLoadingMask) setLoading(true)
    checkFavorite()

    const vendor = getVendor(props.platform)
    if (!vendor || !vendor.playlistDetail) return
    let maxRetry = 3, retry = 0, success = false
    do {
        const result = await vendor.playlistDetail(props.id, offset, limit, page)
        if (!result || result.data.length < 1) {
            ++retry
            continue
        }
        if (page > 1) result.data.unshift(...detail.data)
        if (!result.total) detail.total = 0
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
    if (nextPage()) {
        loadContent(true)
    }
}

const playAll = () => {
    if (filteredData.value) {
        addAndPlayTracks(filteredData.value, true)
    } else {
        playPlaylist(detail)
    }
}

const addAll = (text) => {
    addTracks(filteredData.value || detail.data)
    showToast(text || "歌曲已全部添加！")
}

//TODO
const { addFavoritePlaylist, removeFavoritePlaylist, isFavoritePlaylist } = useUserProfileStore()
const favorited = ref(false)
const toggleFavorite = () => {
    favorited.value = !favorited.value
    let text = "歌单收藏成功！"
    if (favorited.value) {
        const { title, cover } = detail
        addFavoritePlaylist(props.id, props.platform, title, cover)
    } else {
        removeFavoritePlaylist(props.id, props.platform)
        text = "歌单已取消收藏！"
    }
    showToast(text)
}

const checkFavorite = () => {
    favorited.value = isFavoritePlaylist(props.id, props.platform)
}

const markScrollState = () => {
    if (playlistDetailRef.value) markScrollTop = playlistDetailRef.value.scrollTop
}

const resetScrollState = () => {
    markScrollTop = 0
    if (playlistDetailRef.value) playlistDetailRef.value.scrollTop = markScrollTop
}

const restoreScrollState = () => {
    if (markScrollTop < 1) return
    if (playlistDetailRef.value) playlistDetailRef.value.scrollTop = markScrollTop
    checkFavorite()
}

const scrollToLoad = () => {
    if (isLoading.value) return
    const scrollTop = playlistDetailRef.value.scrollTop
    const scrollHeight = playlistDetailRef.value.scrollHeight
    const clientHeight = playlistDetailRef.value.clientHeight
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
    if (back2TopBtnRef.value) back2TopBtnRef.value.setScrollTarget(playlistDetailRef.value)
}

//TODO
const trimExtraHtml = (text) => {
    text = (text || '').trim()
    //TODO 暂时不处理html空白格式信息
    return text
}

const toggleUseSearchBar = () => {
    if (!isSearchForOnlinePlaylistShow.value) return
    const action = searchBarExclusiveAction.value ? null : setSearchKeyword
    setSearchBarExclusiveAction(action)
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

const filterContent = () => {
    const { data } = detail
    const listData = filterSongsWithKeyword(data)
    filteredData.value = null
    if (listData && listData.length != data.length) {
        filteredData.value = listData
    }
    updateListSizeText()
}

const detectTitleHeight = () => {
    const titleEl = titleRef.value
    if (!titleEl) return
    const { clientHeight } = titleEl
    if (!clientHeight) return
    setTwoLinesTitle(clientHeight > 50)
}


/* 生命周期、监听 */
onActivated(() => {
    restoreScrollState()
    detectTitleHeight()
})

onDeactivated(() => {
    setSearchBarExclusiveAction(null)
    setSearchKeyword(null)
})

watch(() => props.id, () => {
    resetView()
    resetScrollState()
    resetBack2TopBtn()
    loadContent()
}, { immediate: true })

watch(searchKeyword, filterContent)
watch(isLoading, () => nextTick(detectTitleHeight))

EventBus.on("refresh-favorite", checkFavorite)
EventBus.on('app-resize', detectTitleHeight)
</script>

<template>
    <div id="playlist-detail-view" ref="playlistDetailRef" @scroll="onScroll">
        <div class="header">
            <div>
                <img class="cover" v-lazy="detail.cover" />
            </div>
            <div class="right" v-show="!isLoading">
                <div class="title" v-html="detail.title" ref="titleRef"></div>
                <div class="about" v-html="trimExtraHtml(detail.about)" :class="{ 'short-about': isTwoLinesTitle }"></div>
                <div class="action">
                    <PlayAddAllBtn :leftAction="() => playAll()" :rightAction="() => addAll()" class="btn-spacing">
                    </PlayAddAllBtn>
                    <FavoriteShareBtn :favorited="favorited" :leftAction="toggleFavorite">
                    </FavoriteShareBtn>
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
                    <div class="loading-mask btn-spacing" v-for="i in 2"
                        style="width: 188px; height: 36px; display: inline-block;"></div>
                </div>
            </div>
        </div>
        <div class="center">
            <div class="list-title">
                <div class="size-text content-text-highlight" v-show="!isLoading">列表({{ listSizeText }})</div>
                <div class="search-wrap checkbox text-btn" v-show="!isLoading && isSearchForOnlinePlaylistShow"
                    @click="toggleUseSearchBar">
                    <svg v-show="!searchBarExclusiveAction" width="16" height="16" viewBox="0 0 731.64 731.66"
                        xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M365.63,731.65q-120.24,0-240.47,0c-54.2,0-99.43-30.93-117.6-80.11A124.59,124.59,0,0,1,0,608q0-242.21,0-484.42C.11,60.68,43.7,10.45,105.88,1.23A128.67,128.67,0,0,1,124.81.06q241-.09,481.93,0c61.43,0,110.72,39.85,122.49,99.08a131.72,131.72,0,0,1,2.3,25.32q.19,241.47.07,482.93c0,60.87-40.25,110.36-99.18,121.9a142.56,142.56,0,0,1-26.83,2.29Q485.61,731.81,365.63,731.65ZM48.85,365.45q0,121.76,0,243.5c0,41.57,32.38,73.82,73.95,73.83q243,.06,486,0c41.57,0,73.93-32.24,73.95-73.84q.11-243.24,0-486.49c0-41.3-32.45-73.55-73.7-73.57q-243.24-.06-486.49,0a74.33,74.33,0,0,0-14.89,1.42c-34.77,7.2-58.77,36.58-58.8,72.1Q48.76,244,48.85,365.45Z" />
                            </g>
                        </g>
                    </svg>
                    <svg v-show="searchBarExclusiveAction" class="checked-svg" width="16" height="16"
                        viewBox="0 0 767.89 767.94" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                            </g>
                        </g>
                    </svg>
                    <span>独占搜索框模式</span>
                </div>
                <div class="loading-mask" v-show="isLoading"
                    style="text-align: left;width: 150px; height: 28px; display: inline-block;"></div>
                <div class="loading-mask search-wrap" v-show="isLoading && isSearchForOnlinePlaylistShow"
                    style="text-align: left;width: 188px; height: 28px; display: inline-block;margin-right: 10px;"></div>
            </div>
            <SongListControl :data="filteredData || detail.data" :artistVisitable="true" :albumVisitable="true"
                :loading="isLoading">
            </SongListControl>
        </div>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style>
#playlist-detail-view {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 20px 33px 10px 33px;
    overflow: scroll;
    overflow-x: hidden;
}

#playlist-detail-view .header {
    display: flex;
    flex-direction: row;
    margin-bottom: 25px;
}

#playlist-detail-view .header .right {
    flex: 1;
    margin-left: 25px;
}

#playlist-detail-view .header .title,
#playlist-detail-view .header .about {
    text-align: left;
    margin-bottom: 10px;
}

#playlist-detail-view .header .title {
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

#playlist-detail-view .header .about {
    height: 139px;
    /*line-height: 23px;*/
    line-height: var(--content-text-line-height);
    font-size: var(--content-text-subtitle-size);
    color: var(--content-subtitle-text-color);
    /* font-size: 15px; */
    overflow: hidden;
    word-wrap: break-word;
    /*white-space: pre-wrap;
    line-break: anywhere;*/
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 5;
}

#playlist-detail-view .header .short-about {
    height: 105px;
    -webkit-line-clamp: 4;
}

#playlist-detail-view .header .cover {
    width: 236px;
    height: 236px;
    border-radius: 6px;
    box-shadow: 0px 0px 1px #161616;
}

#playlist-detail-view .action {
    display: flex;
    flex-direction: row;
}

#playlist-detail-view .btn-spacing {
    margin-right: 20px;
}

#playlist-detail-view .list-title {
    margin-bottom: 10px;
    text-align: left;
    font-size: 16px;
    font-weight: bold;
    display: flex;
    position: relative;
}

#playlist-detail-view .list-title .size-text {
    margin-left: 3px;
}

#playlist-detail-view .checkbox {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-left: 8px;
    margin-right: 15px;
    cursor: pointer;
}

#playlist-detail-view .checkbox svg {
    fill: var(--button-icon-btn-color);
    cursor: pointer;
}

#playlist-detail-view .checkbox .checked-svg {
    fill: var(--content-highlight-color);
}


#playlist-detail-view .search-wrap {
    position: absolute;
    right: -10px;
    display: flex;
    align-items: center;
    font-weight: bold;
}

#playlist-detail-view .search-wrap svg {
    margin-top: 1px;
}
</style>