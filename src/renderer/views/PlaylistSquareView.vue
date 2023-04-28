<script setup>
import { onActivated, onDeactivated, onMounted, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import EventBus from '../../common/EventBus';
import { usePlaylistSquareStore } from '../store/playlistSquareStore';
import PlaylistCategoryBar from '../components/PlaylistCategoryBar.vue';
import PlaylistsControl from '../components/PlaylistsControl.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import { useAppCommonStore } from '../store/appCommonStore';
import PlaylistCategoryFlowBtn from '../components/PlaylistCategoryFlowBtn.vue';



const squareContentRef = ref(null)
const back2TopBtnRef = ref(null)
const playlistCategoryFlowBtnRef = ref(null)

//全部分类
const categories = reactive([])
const orders = reactive([])
const playlists = reactive([])
const pagination = { offset: 0, limit: 35, page: 1 }
let markScrollTop = 0

const { currentPlatformCode, currentCategoryCode, currentOrder } = storeToRefs(usePlaylistSquareStore())
const { currentVender, currentPlatformCategories, putCategories,
    putOrders, currentPlatformOrders } = usePlaylistSquareStore()
const { isPlaylistMode } = storeToRefs(useAppCommonStore())

const isLoadingCategories = ref(true)
const isLoadingContent = ref(true)

const setLoadingCategories = (value) => {
    isLoadingCategories.value = value
}

const setLoadingContent = (value) => {
    isLoadingContent.value = value
}

const resetPagination = () => {
    playlists.length = 0
    pagination.offset = 0
    pagination.page = 1
}

const nextPage = () => {
    pagination.offset = pagination.page * pagination.limit
    pagination.page = pagination.page + 1
}

const loadCategories = async () => {
    categories.length = 0
    orders.length = 0
    setLoadingCategories(true)
    setLoadingContent(true)
    let cachedCates = currentPlatformCategories()
    let cachedOrders = currentPlatformOrders()
    if (!cachedCates) {
        const vendor = currentVender()
        if (!vendor || !vendor.categories) return
        const result = await vendor.categories()
        if (!result) return
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

const loadContent = async (noLoadingMask) => {
    const vendor = currentVender()
    if (!vendor || !vendor.square) return
    if (!noLoadingMask) setLoadingContent(true)
    const cate = currentCategoryCode.value
    const offset = pagination.offset
    const limit = pagination.limit
    const page = pagination.page
    const order = currentOrder.value.value
    const result = await vendor.square(cate, offset, limit, page, order)

    if (!result) return
    if (currentPlatformCode.value != result.platform) return
    if (currentCategoryCode.value != result.cate) return
    playlists.push(...result.data)
    setLoadingContent(false)
}


const loadMoreContent = () => {
    nextPage()
    loadContent(true)
}

const scrollToLoad = () => {
    if (isLoadingContent.value) return
    const scrollTop = squareContentRef.value.scrollTop
    const scrollHeight = squareContentRef.value.scrollHeight
    const clientHeight = squareContentRef.value.clientHeight
    markScrollState()
    const allowedError = 10 //允许误差
    if ((scrollTop + clientHeight + allowedError) >= scrollHeight) {
        loadMoreContent()
    }
}

const onScroll = () => {
    scrollToLoad()
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


//TODO 后期需要梳理优化
/*-------------- 各种监听 --------------*/
onMounted(() => {
    resetCommom()
    loadCategories()
})

onActivated(() => {
    restoreScrollState()
})

const resetCommom = () => {
    resetPagination()
    resetScrollState()
    resetFlowBtns()
}

const refreshData = () => {
    resetCommom()
    loadContent()
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
        <PlaylistsControl :data="playlists" :loading="isLoadingContent"></PlaylistsControl>
        <PlaylistCategoryFlowBtn ref="playlistCategoryFlowBtnRef">
        </PlaylistCategoryFlowBtn>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style scoped>
.playlist-square-view {
    padding: 25px 33px 15px 33px;
    overflow: scroll;
    overflow-x: hidden;
}
</style>