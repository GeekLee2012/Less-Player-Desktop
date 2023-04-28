<script setup>
import { onActivated, onDeactivated, onMounted, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import EventBus from '../../common/EventBus';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import { useAppCommonStore } from '../store/appCommonStore';
import RadioCategoryBar from '../components/RadioCategoryBar.vue';
import { useRadioSquareStore } from '../store/radioSquareStore';
import PlaylistsControl from '../components/PlaylistsControl.vue';



const squareContentRef = ref(null)
const back2TopBtnRef = ref(null)

//全部分类
const categories = reactive([])
const orders = reactive([])
const radios = reactive([])
const pagination = { offset: 0, limit: 35, page: 1 }
let markScrollTop = 0

const { currentPlatformCode, currentCategoryCode,
    currentOrder, multiSelectMode,
    currentCategoryItems } = storeToRefs(useRadioSquareStore())
const { currentVender, currentPlatformCategories, putCategories,
    putOrders, currentPlatformOrders, setMultiSelectMode } = useRadioSquareStore()
const { isRadioMode } = storeToRefs(useAppCommonStore())

const isLoadingCategories = ref(true)
const isLoadingContent = ref(true)

const setLoadingCategories = (value) => {
    isLoadingCategories.value = value
}

const setLoadingContent = (value) => {
    isLoadingContent.value = value
}

const resetPagination = () => {
    radios.length = 0
    pagination.offset = 0
    pagination.page = 1
}

const nextPage = () => {
    pagination.offset = pagination.page * pagination.limit
    pagination.page = pagination.page + 1
}

//TODO
const loadCategories = async () => {
    categories.length = 0
    orders.length = 0
    setLoadingCategories(true)
    setLoadingContent(true)
    let cachedCates = currentPlatformCategories()
    let cachedOrders = currentPlatformOrders()
    if (!cachedCates) {
        const vendor = currentVender()
        if (!vendor || !vendor.radioCategories) return
        const result = await vendor.radioCategories()
        if (!result) return
        const multiSelectMode = (result.multiMode === true)
        cachedCates = { data: result.data, multiSelectMode }
        cachedOrders = result.orders

        if (!cachedCates) return
        putCategories(result.platform, cachedCates)
        if (cachedOrders) {
            putOrders(result.platform, cachedOrders)
        }
    }

    setMultiSelectMode(cachedCates.multiSelectMode)
    categories.push(...cachedCates.data)
    if (cachedOrders) orders.push(...cachedOrders)
    EventBus.emit('radioCategory-update')
    setLoadingCategories(false)
}

const loadContent = async (noLoadingMask) => {
    const vendor = currentVender()
    if (!vendor || !vendor.radioSquare) return
    if (!noLoadingMask) setLoadingContent(true)
    let cate = multiSelectMode.value ? currentCategoryItems.value : currentCategoryCode.value
    const offset = pagination.offset
    const limit = pagination.limit
    const page = pagination.page
    const order = currentOrder.value.value
    const result = await vendor.radioSquare(cate, offset, limit, page, order)
    if (currentPlatformCode.value != result.platform) return
    //重新再获取一次，确保没有变更
    cate = multiSelectMode.value ? currentCategoryItems.value : currentCategoryCode.value
    if (cate != result.cate) return
    radios.push(...result.data)
    setLoadingContent(false)
}


const loadMoreContent = () => {
    nextPage()
    loadContent(true)
}

const scrollToLoad = () => {
    if (isLoadingContent.value) return
    if (!squareContentRef.value) return
    const scrollTop = squareContentRef.value.scrollTop
    const scrollHeight = squareContentRef.value.scrollHeight
    const clientHeight = squareContentRef.value.clientHeight
    markScrollState()
    if ((scrollTop + clientHeight) >= scrollHeight) {
        loadMoreContent()
    }
}

const onScroll = () => {
    scrollToLoad()
}

const markScrollState = () => {
    if (squareContentRef.value)
        markScrollTop = squareContentRef.value.scrollTop
}

const resetScrollState = () => {
    markScrollTop = 0
    if (!squareContentRef.value) return
    squareContentRef.value.scrollTop = markScrollTop
}

const restoreScrollState = () => {
    //EventBus.emit("imageTextTiles-update")
    if (markScrollTop < 1) return
    if (!squareContentRef.value) return
    squareContentRef.value.scrollTop = markScrollTop
}

const resetBack2TopBtn = () => {
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
    resetBack2TopBtn()
}

const refreshData = () => {
    resetCommom()
    loadContent()
}

watch(currentPlatformCode, (nv, ov) => {
    if (!isRadioMode.value) return
    resetCommom()
    loadCategories()
})

EventBus.on("radioSquare-refresh", refreshData)
</script>

<template>
    <div class="radio-square-view" ref="squareContentRef" @scroll="onScroll">
        <RadioCategoryBar :data="categories" :loading="isLoadingCategories"></RadioCategoryBar>
        <PlaylistsControl :data="radios" :loading="isLoadingContent"></PlaylistsControl>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style scoped>
.radio-square-view {
    padding: 25px 33px 15px 33px;
    overflow: scroll;
    overflow-x: hidden;
}
</style>