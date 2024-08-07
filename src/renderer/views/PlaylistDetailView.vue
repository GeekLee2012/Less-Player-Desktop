<script setup>
import { onActivated, reactive, ref, watch, inject, nextTick, onDeactivated, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { useUserProfileStore } from '../store/userProfileStore';
import { usePlatformStore } from '../store/platformStore'
import { usePlayStore } from '../store/playStore';
import { useSettingStore } from '../store/settingStore';
import { usePlaylistSquareStore } from '../store/playlistSquareStore';
import SongListControl from '../components/SongListControl.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import PlayAddAllBtn from '../components/PlayAddAllBtn.vue';
import FavoriteShareBtn from '../components/FavoriteShareBtn.vue';
import SearchBarExclusiveModeControl from '../components/SearchBarExclusiveModeControl.vue';
import { Playlist } from '../../common/Playlist';
import { coverDefault, isBlank, trimExtraChars } from '../../common/Utils';
import { onEvents, emitEvents, offEvents } from '../../common/EventBusWrapper';



const props = defineProps({
    platform: String,
    id: String
})

const { addAndPlayTracks, playPlaylist, addPlaylistToQueue, dndSaveCover } = inject('player')
const { searchDefault, } = inject('appCommon')

const { getVendor } = usePlatformStore()
const { addTracks } = usePlayStore()
const { routerCtxCacheItem, } = storeToRefs(useAppCommonStore())
const { showToast, hideAllCtxMenus,  } = useAppCommonStore()
const { isSearchForOnlinePlaylistShow, isDndSaveEnable } = storeToRefs(useSettingStore())
const { currentCategoryCode, currentOrder } = storeToRefs(usePlaylistSquareStore())


const detail = reactive({ cover: '', title: '', about: '', data: [] })
const filteredData = ref(null)
const listTitle = ref('歌曲')
const listSizeText = ref('0')
const playlistDetailRef = ref(null)
const back2TopBtnRef = ref(null)
let offset = 0, page = 1, limit = 1000
let markScrollTop = 0
const isLoading = ref(true)
const setLoading = (value) => isLoading.value = value
const titleRef = ref(null)
const isTwoLinesTitle = ref(false)
const setTwoLinesTitle = (value) => isTwoLinesTitle.value = value

const setListTitle = (detail) => {
    let title = '歌曲'
    if (Playlist.isAnchorRadioType(detail)) {
        title = '列表'
    }
    listTitle.value = title
}

const updateListSizeText = () => {
    //const length = filteredData.value ? filteredData.value.length : detail.data.length
    //const text = total > length ? `${length} / ${total}` : length
    let text = '0'
    if (filteredData.value) {
        text = filteredData.value.length
    } else {
        const { data, total, totalPage } = detail
        text = (page < totalPage) ?
            (total >= 0 ?
                (data.length < total ? `${data.length} / ${total}` : data.length)
                : `${data.length}+`)
            : data.length
    }
    listSizeText.value = text
}

const resetView = () => {
    Object.assign(detail, { cover: '', title: '', about: '', data: [] })
    offset = 0
    page = 1
    detail.total = 0
    updateListSizeText()
}

/*
const nextPage = () => {
    //TODO
    if (detail.total < 1) return false
    offset = page * limit
    page = page + 1
    return true
}
*/
const nextPage = () => {
    if (page >= detail.totalPage) return false
    offset = page * limit
    page = page + 1
    return true
}

const loadContent = async (noLoadingMask) => {
    if (!noLoadingMask) setLoading(true)
    checkFavorite()

    const vendor = getVendor(props.platform)
    if (!vendor || !vendor.playlistDetail) return
    let maxRetry = 3, retry = 0, success = false, result = null
    do {
        result = await vendor.playlistDetail(props.id, offset, limit, page,
            currentCategoryCode.value, currentOrder.value.value)
        if (!result || result.data.length < 1) {
            ++retry
            continue
        }
        if (page > 1) result.data.unshift(...detail.data)
        if (!result.total) detail.total = 0
        Object.assign(detail, result)
        setListTitle(detail)
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
        playPlaylist(detail, '即将为您播放全部')
    }
}

const addAll = (text) => {
    if (filteredData.value) {
        addTracks(filteredData.value)
        showToast(text || "歌曲已全部添加")
    } else {
        addPlaylistToQueue(detail, (text || "歌曲已全部添加"))
    }
}

//TODO
const { addFavoritePlaylist, removeFavoritePlaylist, isFavoritePlaylist } = useUserProfileStore()
const favorited = ref(false)
const toggleFavorite = () => {
    favorited.value = !favorited.value
    let text = "歌单收藏成功"
    if (favorited.value) {
        const { title, cover } = detail
        addFavoritePlaylist(props.id, props.platform, title, cover, Playlist.NORMAL_TYPE)
    } else {
        removeFavoritePlaylist(props.id, props.platform)
        text = "歌单已取消收藏"
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
    if (back2TopBtnRef.value) {
        back2TopBtnRef.value.setScrollTarget(playlistDetailRef.value)
    }
}

const filterSongsWithKeyword = (list, keyword) => {
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

const filterContent = (keyword) => {
    const { data } = detail
    const listData = filterSongsWithKeyword(data, keyword)
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

const visitLinkItem = (title) => {
    if(isBlank(title)) return
    searchDefault(`@:${title}`)
}

const visitRouterCtxCacheItem = () => {
    if (!routerCtxCacheItem.value) return
    const { id, title } = routerCtxCacheItem.value
    if (id == 'linkItem')  setTimeout(() => visitLinkItem(title), 202)
}


/* 生命周期、监听 */
watch(() => props.id, () => {
    resetView()
    resetScrollState()
    //resetBack2TopBtn()
    loadContent()
}, { immediate: true })

watch(isLoading, () => nextTick(detectTitleHeight))

const eventsRegistration = {
    'refresh-favorite': checkFavorite,
    'app-resize': detectTitleHeight, 
    //'playlist-linkItem': visitLinkItem
}
onMounted(() => onEvents(eventsRegistration))
onUnmounted(() => offEvents(eventsRegistration))

onActivated(() => {
    restoreScrollState()
    detectTitleHeight()
    resetBack2TopBtn()
    //visitRouterCtxCacheItem()
})
</script>

<template>
    <div id="playlist-detail-view" ref="playlistDetailRef" @scroll="onScroll">
        <div class="header">
            <div>
                <img class="cover" v-lazy="coverDefault(detail.cover)" :class="{ 'draggable': isDndSaveEnable }"
                    :draggable="isDndSaveEnable" @dragstart="(event) => dndSaveCover(event, detail)" />
            </div>
            <div class="right" v-show="!isLoading">
                <div class="title" v-html="detail.title" ref="titleRef"></div>
                <div class="about" v-html="trimExtraChars(detail.about)" :class="{ 'short-about': isTwoLinesTitle }"></div>
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
                <div class="size-text content-text-highlight" v-show="!isLoading">{{ listTitle }}({{ listSizeText }})</div>
                <SearchBarExclusiveModeControl class="search-wrap" v-show="!isLoading && isSearchForOnlinePlaylistShow"
                    :onKeywordChanged="filterContent">
                </SearchBarExclusiveModeControl>
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

#playlist-detail-view .header .short-about {
    /*
    height: 105px;
    -webkit-line-clamp: 4;
    */
    height: 80px;
    margin-bottom: 23px;
    -webkit-line-clamp: 3;
}

#playlist-detail-view .header .cover {
    width: 236px;
    height: 236px;
    border-radius: 6px;
    box-shadow: 0px 0px 1px #161616;
}

#playlist-detail-view .header .cover.draggable {
    -webkit-user-drag: auto !important;
}

#playlist-detail-view .action {
    display: flex;
    flex-direction: row;
}

#playlist-detail-view .btn-spacing {
    margin-right: 20px;
}

#playlist-detail-view .list-title {
    margin-bottom: 6px;
    text-align: left;
    font-size: var(--content-text-tab-title-size);
    /*font-size: calc(var(--content-text-tab-title-size) - 1px);*/
    font-weight: bold;
    display: flex;
    align-items: center;
    position: relative;
}

#playlist-detail-view .list-title .size-text {
    margin-left: 2px;
    padding-bottom: 5px;
    border-bottom: 3px solid var(--content-highlight-color);
}

#playlist-detail-view .list-title .search-wrap {
    font-size: calc(var(--content-text-tab-title-size) - 1.5px);
}

#playlist-detail-view .checkbox {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-left: 8px;
    margin-right: 15px;
    cursor: pointer;
}

/*
#playlist-detail-view .checkbox svg {
    fill: var(--button-icon-btn-color);
    cursor: pointer;
}

#playlist-detail-view .checkbox .checked-svg {
    fill: var(--content-highlight-color);
}
*/


#playlist-detail-view .search-wrap {
    position: absolute;
    right: -10px;
    font-weight: bold;
}
</style>