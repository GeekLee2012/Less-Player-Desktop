<script setup>
import { onActivated, onMounted, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlaylistSquareStore } from '../store/playlistSquareStore';
import PlaylistCategoryBar from '../components/PlaylistCategoryBar.vue';
import PlaylistsControl from '../components/PlaylistsControl.vue';
import AlbumListControl from '../components/AlbumListControl.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import { useAppCommonStore } from '../store/appCommonStore';
import PlaylistCategoryFlowBtn from '../components/PlaylistCategoryFlowBtn.vue';
import { toTrimString } from '../../common/Utils';
import { useSettingStore } from '../store/settingStore';
import { onEvents, emitEvents } from '../../common/EventBusWrapper';


//TODO 需要梳理优化, 前期缺少设计，现在全是坑
const squareContentRef = ref(null)
const back2TopBtnRef = ref(null)
const playlistCategoryFlowBtnRef = ref(null)

//全部分类
const categories = reactive([])
const orders = reactive([])
const isWhiteWrap = ref(false)
const playlists = reactive([])
const pagination = { offset: 0, limit: 35, page: 1 }
let markScrollTop = 0
const isAlbumType = ref(false)
const setAlbumType = (value) => isAlbumType.value = value || false
const setWhiteWrap = (value) => isWhiteWrap.value = value || false

const { currentPlatformCode, currentCategoryCode, currentOrder } = storeToRefs(usePlaylistSquareStore())
const { currentVender, currentPlatformCategories, putCategories,
    putOrders, currentPlatformOrders,
    resetOrder, updateCurrentOrderByValue,
    currentPlatformWhiteWrap, putWhiteWrap, } = usePlaylistSquareStore()
const { isPlaylistMode } = storeToRefs(useAppCommonStore())
const { getPaginationStyleIndex } = storeToRefs(useSettingStore())


const isLoadingCategories = ref(true)
const isLoadingContent = ref(true)

const setLoadingCategories = (value) => {
    isLoadingCategories.value = value
}

const setLoadingContent = (value) => {
    isLoadingContent.value = value
}

/*
const resetPagination = () => {
    playlists.length = 0
    pagination.offset = 0
    pagination.page = 1
}

const nextPage = () => {
    pagination.offset = pagination.page * pagination.limit
    pagination.page = pagination.page + 1
    return false
}
*/

const loadCategories = async () => {
    categories.length = 0
    orders.length = 0
    setWhiteWrap(false)
    setLoadingCategories(true)
    setLoadingContent(true)
    resetOrder()
    let cachedCates = currentPlatformCategories()
    let cachedOrders = currentPlatformOrders()
    let cachedWhiteWrap = currentPlatformWhiteWrap() || false
    if (!cachedCates) {
        const vendor = currentVender()
        if (!vendor || !vendor.categories) return
        let result = null, retry = 1
        do {
            result = await vendor.categories()
        } while (!result && retry++ <= 3)
        if (!result || result.data.length < 1) return

        const { platform, data, orders, isWhiteWrap } = result
        if (currentPlatformCode.value != platform || !data) return
    
        cachedCates = data
        cachedOrders = orders
        cachedWhiteWrap = isWhiteWrap

        putCategories(platform, cachedCates)
        if (cachedOrders) putOrders(platform, orders)
        putWhiteWrap(platform, isWhiteWrap)
    }
    categories.push(...cachedCates)
    if (cachedOrders) orders.push(...cachedOrders)
    setWhiteWrap(cachedWhiteWrap)
    emitEvents('playlistCategory-update')
    setLoadingCategories(false)
}

const loadContent = async (noLoadingMask, offset, limit, page) => {
    const vendor = currentVender()
    if (!vendor || !vendor.square) return
    if (!noLoadingMask) setLoadingContent(true)

    const cate = currentCategoryCode.value
    const order = currentOrder.value.value
    let result = null, retry = 1
    do {
        result = await vendor.square(cate, offset, limit, page, order)
    } while (!result && retry++ <= 3)
    if (!result) return
    const { platform: rPlatform, cate: rCate, order: rOrder, dataType, data, total } = result

    if (currentPlatformCode.value != rPlatform) return
    if (toTrimString(currentCategoryCode.value) != toTrimString(rCate)) return

    if (rOrder && order != rOrder) updateCurrentOrderByValue(rOrder)

    setAlbumType(dataType)
    if (isAlbumType) {
        playlists.length = 0
        playlists.push(...data)
    }

    setLoadingContent(false)
    return { data, total, limit }
}

/*
const loadMoreContent = () => {
    if (nextPage()) {
        loadContent(true)
    }
}
*/

const loadPageContent = async ({ offset, page, limit }) => {
    const isNormalType = getPaginationStyleIndex.value === 0
    if (isNormalType) resetScrollState()
    return loadContent((!isNormalType && page > 1), offset, limit, page)
}

const nextPagePendingMark = ref(0)
const scrollToLoad = () => {
    if (isLoadingContent.value) return
    const { scrollTop, scrollHeight, clientHeight } = squareContentRef.value
    markScrollState()
    const allowedError = 10 //允许误差
    if ((scrollTop + clientHeight + allowedError) >= scrollHeight) {
        //loadMoreContent()
        nextPagePendingMark.value = Date.now()
    }
}

const onScroll = (event) => {
    scrollToLoad(event)
}

const markScrollState = () => {
    if (squareContentRef.value) markScrollTop = squareContentRef.value.scrollTop
}

const resetScrollState = () => {
    markScrollTop = 0
    if (squareContentRef.value) squareContentRef.value.scrollTop = markScrollTop
    resetFlowBtns()
}

const restoreScrollState = () => {
    //emitEvents("imageTextTiles-update")
    if (markScrollTop < 1) return
    if (squareContentRef.value) squareContentRef.value.scrollTop = markScrollTop
}

const resetFlowBtns = () => {
    if (playlistCategoryFlowBtnRef.value) playlistCategoryFlowBtnRef.value.setScrollTarget(squareContentRef.value)
    if (back2TopBtnRef.value) back2TopBtnRef.value.setScrollTarget(squareContentRef.value)
}

/*-------------- 各种监听 --------------*/
onMounted(() => {
    resetCommom()
    loadCategories()
})

onActivated(() => {
    restoreScrollState()
})

const resetCommom = () => {
    //resetPagination()
    resetScrollState()
}

const refreshAllPendingMark = ref(0)
const refreshData = async () => {
    resetCommom()
    setLoadingContent(true)
    refreshAllPendingMark.value = Date.now()
    //loadContent()
}


/* 生命周期、监听 */
watch(currentPlatformCode, (nv, ov) => {
    if (!isPlaylistMode.value) return
    if (!nv) reurn
    resetCommom()
    loadCategories()
})

onEvents({
    'playlistSquare-refresh': refreshData,
})
</script>

<template>
    <div class="playlist-square-view" ref="squareContentRef" @scroll="onScroll">
        <PlaylistCategoryBar :data="categories" :loading="isLoadingCategories" :isWhiteWrap="isWhiteWrap">
        </PlaylistCategoryBar>
        <PlaylistsControl :loading="isLoadingCategories || isLoadingContent" :paginationStyleType="getPaginationStyleIndex"
            :limit="pagination.limit" :loadPage="loadPageContent" :nextPagePendingMark="nextPagePendingMark"
            :refreshAllPendingMark="refreshAllPendingMark" v-show="!isAlbumType">
        </PlaylistsControl>
        <AlbumListControl :data="playlists" :loading="isLoadingContent" v-show="isAlbumType">
        </AlbumListControl>
        <PlaylistCategoryFlowBtn ref="playlistCategoryFlowBtnRef">
        </PlaylistCategoryFlowBtn>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style scoped>
.playlist-square-view {
    padding: 20px 33px 15px 33px;
    overflow: scroll;
    overflow-x: hidden;
}
</style>