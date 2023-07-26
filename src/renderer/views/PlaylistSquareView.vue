<script setup>
import { onActivated, onDeactivated, onMounted, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import EventBus from '../../common/EventBus';
import { usePlaylistSquareStore } from '../store/playlistSquareStore';
import PlaylistCategoryBar from '../components/PlaylistCategoryBar.vue';
import PlaylistsControl from '../components/PlaylistsControl.vue';
import AlbumListControl from '../components/AlbumListControl.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import { useAppCommonStore } from '../store/appCommonStore';
import PlaylistCategoryFlowBtn from '../components/PlaylistCategoryFlowBtn.vue';
import { toTrimString } from '../../common/Utils';
import { useSettingStore } from '../store/settingStore';


//TODO 需要梳理优化, 前期缺少设计，现在全是坑
const squareContentRef = ref(null)
const back2TopBtnRef = ref(null)
const playlistCategoryFlowBtnRef = ref(null)

//全部分类
const categories = reactive([])
const orders = reactive([])
const playlists = reactive([])
const pagination = { offset: 0, limit: 35, page: 1 }
let markScrollTop = 0
const isAlbumType = ref(false)
const setAlbumType = (value) => isAlbumType.value = value || false

const { currentPlatformCode, currentCategoryCode, currentOrder } = storeToRefs(usePlaylistSquareStore())
const { currentVender, currentPlatformCategories, putCategories,
    putOrders, currentPlatformOrders,
    resetOrder, updateCurrentOrderByValue } = usePlaylistSquareStore()
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
    setLoadingCategories(true)
    setLoadingContent(true)
    resetOrder()
    let cachedCates = currentPlatformCategories()
    let cachedOrders = currentPlatformOrders()
    if (!cachedCates) {
        const vendor = currentVender()
        if (!vendor || !vendor.categories) return
        const result = await vendor.categories()
        if (!result || result.data.length < 1) return
        cachedCates = result.data
        cachedOrders = result.orders
        if (!cachedCates) return
        putCategories(result.platform, cachedCates)
        if (cachedOrders) putOrders(result.platform, result.orders)
    }
    categories.push(...cachedCates)
    if (cachedOrders) orders.push(...cachedOrders)
    EventBus.emit('playlistCategory-update')
    setLoadingCategories(false)
}

const loadContent = async (noLoadingMask, offset, limit, page) => {
    const vendor = currentVender()
    if (!vendor || !vendor.square) return
    if (!noLoadingMask) setLoadingContent(true)

    const cate = currentCategoryCode.value
    const order = currentOrder.value.value
    const result = await vendor.square(cate, offset, limit, page, order)

    if (!result) return
    const { platform: rPlatform, cate: rCate, order: rOrder, dataType, data, total } = result

    if (currentPlatformCode.value != rPlatform) return
    if (toTrimString(currentCategoryCode.value) != toTrimString(rCate)) return

    if (rOrder && order != rOrder) {
        updateCurrentOrderByValue(rOrder)
    }

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
    return loadContent(!isNormalType, offset, limit, page)
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
}

const restoreScrollState = () => {
    //EventBus.emit("imageTextTiles-update")
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
    resetFlowBtns()
}

const refreshPendingMark = ref(0)
const refreshData = async () => {
    resetCommom()
    setLoadingContent(true)
    refreshPendingMark.value = Date.now()
    //loadContent()
}


/* 生命周期、监听 */
watch(currentPlatformCode, (nv, ov) => {
    if (!isPlaylistMode.value) return
    if (!nv) reurn
    resetCommom()
    loadCategories()
})

EventBus.on("playlistSquare-refresh", refreshData)
</script>

<template>
    <div class="playlist-square-view" ref="squareContentRef" @scroll="onScroll">
        <PlaylistCategoryBar :data="categories" :loading="isLoadingCategories">
        </PlaylistCategoryBar>
        <PlaylistsControl :loading="isLoadingContent" :paginationStyleType="getPaginationStyleIndex"
            :limit="pagination.limit" :loadPage="loadPageContent" :nextPagePendingMark="nextPagePendingMark"
            :refreshPendingMark="refreshPendingMark" v-show="!isAlbumType">
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