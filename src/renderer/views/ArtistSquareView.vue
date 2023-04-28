<script setup>
import { onActivated, onMounted, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import EventBus from '../../common/EventBus';
import { useArtistSquareStore } from '../store/artistSquareStore';
import ArtistCategoryBar from '../components/ArtistCategoryBar.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import ArtistListControl from '../components/ArtistListControl.vue';
import { useAppCommonStore } from '../store/appCommonStore';



const squareRef = ref(null)
const back2TopBtnRef = ref(null)

//全部分类
const categories = reactive([])
const artists = reactive([])
const pagination = { offset: 0, limit: 35, page: 1 }
let markScrollTop = 0
const isLoadingCategories = ref(true)
const isLoadingContent = ref(true)

const { currentPlatformCode, currentCategoryItems, currentAlphabet }
    = storeToRefs(useArtistSquareStore())
const { currentVender, currentCategory,
    putCategory, putAlphabet } = useArtistSquareStore()
const { isArtistMode } = storeToRefs(useAppCommonStore())

const setLoadingCategories = (value) => {
    isLoadingCategories.value = value
}

const setLoadingContent = (value) => {
    isLoadingContent.value = value
}

const resetPagination = () => {
    artists.length = 0
    pagination.offset = 0
    pagination.page = 1
}

const nextPage = () => {
    pagination.offset = pagination.page * pagination.limit
    pagination.page = pagination.page + 1
}

const addArtistData = (data) => {
    if (!data || data.length < 1) return
    data.forEach(item => {
        const index = artists.findIndex(ar => (ar.id == item.id && ar.platform == item.platform))
        if (index < 0) artists.push(item)
    })
}

const loadCategories = async () => {
    setLoadingCategories(true)
    setLoadingContent(true)
    categories.length = 0
    let cached = currentCategory()
    if (!cached) {
        const vendor = currentVender()
        if (!vendor || !vendor.artistCategories) return
        const result = await vendor.artistCategories()
        if (!result) return
        result.data.push(result.alphabet)
        cached = result.data
        putCategory(result.platform, cached)
        putAlphabet(result.platform, result.alphabet)
    }

    categories.push(...cached)
    setLoadingCategories(false)
    EventBus.emit('artistCategory-update')
}

const loadContent = async (noLoadingMask) => {
    if (!noLoadingMask) setLoadingContent(true)
    const vendor = currentVender()
    if (!vendor || !vendor.artistSquare) return
    const cate = currentCategoryItems.value
    const offset = pagination.offset
    const limit = pagination.limit
    const page = pagination.page
    const result = await vendor.artistSquare(cate, offset, limit, page)
    if (!result) return
    if (currentPlatformCode.value != result.platform)
        if (currentCategoryItems.value != result.cate) return
    pagination.page = result.page
    addArtistData(result.data)
    setLoadingContent(false)
}

const loadMoreContent = () => {
    nextPage()
    loadContent(true)
}

const scrollToLoad = () => {
    if (!squareRef.value) return
    const scrollTop = squareRef.value.scrollTop
    const scrollHeight = squareRef.value.scrollHeight
    const clientHeight = squareRef.value.clientHeight
    markScrollState()
    if ((scrollTop + clientHeight) >= scrollHeight) {
        loadMoreContent()
    }
}

const onScroll = () => {
    scrollToLoad()
}

const markScrollState = () => {
    if (!squareRef.value) return
    markScrollTop = squareRef.value.scrollTop
}

const resetScrollState = () => {
    markScrollTop = 0
    if (!squareRef.value) return
    squareRef.value.scrollTop = markScrollTop
}

const restoreScrollState = () => {
    //EventBus.emit("imageTextTiles-update")
    if (markScrollTop < 1) return
    if (!squareRef.value) return
    squareRef.value.scrollTop = markScrollTop
}

const resetBack2TopBtn = () => {
    if (back2TopBtnRef.value) back2TopBtnRef.value.setScrollTarget(squareRef.value)
}

const resetCommom = () => {
    resetPagination()
    resetScrollState()
    resetBack2TopBtn()
}

const refreshData = () => {
    resetCommom()
    loadContent()
}

/* 生命周期、监听 */
onActivated(() => {
    loadCategories()
    resetBack2TopBtn()
    restoreScrollState()
})

//TODO
watch(currentPlatformCode, (nv, ov) => {
    if (!isArtistMode.value) return
    loadCategories()
})

EventBus.on("artistSquare-refresh", refreshData)
</script>

<template>
    <div class="artist-square-view" ref="squareRef" @scroll="onScroll">
        <ArtistCategoryBar :data="categories" :alphabet="currentAlphabet" :loading="isLoadingCategories">
        </ArtistCategoryBar>
        <ArtistListControl :data="artists" :loading="isLoadingContent"></ArtistListControl>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style scoped>
.artist-square-view {
    padding: 25px 33px 15px 33px;
    overflow: scroll;
    overflow-x: hidden;
}
</style>