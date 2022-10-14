<script setup>
import { onActivated, onMounted, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import EventBus from '../../common/EventBus';
import { useArtistSquareViewStore } from '../store/artistSquareViewStore';
import ArtistCategoryBar from '../components/ArtistCategoryBar.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import ArtistListControl from '../components/ArtistListControl.vue';
import { useMainViewStore } from '../store/mainViewStore';

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
    = storeToRefs(useArtistSquareViewStore())
const { currentVender, currentCategory, 
        putCategory, putAlphabet } = useArtistSquareViewStore()
const { isArtistMode } = storeToRefs(useMainViewStore())

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

const nextPage = () =>  {
    pagination.offset = pagination.page * pagination.limit
    pagination.page = pagination.page + 1
}

const addArtistData = (data) => {
    if(!data || data.length < 1) return 
    data.forEach(item => {
        const index = artists.findIndex(ar => (ar.id == item.id && ar.platform == item.platform))
        if(index < 0) artists.push(item)
    })
}

//TODO
const loadCategories = () => {
    setLoadingCategories(true)
    setLoadingContent(true)
    categories.length = 0
    let cached = currentCategory()
    if(!cached) {
        const vender = currentVender()
        if(!vender) return 
        vender.artistCategories().then(result => {
            result.data.push(result.alphabet)
            putCategory(result.platform, result.data)
            categories.push(...result.data)
            putAlphabet(result.platform, result.alphabet)
            setLoadingCategories(false)
            EventBus.emit('artistCategory-update')
        })
    } else {
        categories.push(...cached)
        setLoadingCategories(false)
        EventBus.emit('artistCategory-update')
    }
}

const loadContent = (noLoadingMask) => {
    if(!noLoadingMask) setLoadingContent(true)
    const vender = currentVender()
    if(!vender) return
    const cate = currentCategoryItems.value
    const offset = pagination.offset
    const limit = pagination.limit
    const page = pagination.page
    const platform = currentPlatformCode.value
    vender.artistSquare(cate, offset, limit, page).then(result => {
        pagination.page = result.page
        if(platform != result.platform || cate != result.cate) return 
        addArtistData(result.data)
        setLoadingContent(false)
    })
}

const loadMoreContent = () => {
    nextPage()
    loadContent(true)
}

const scrollToLoad = () => {
    const scrollTop = squareRef.value.scrollTop
    const scrollHeight = squareRef.value.scrollHeight
    const clientHeight = squareRef.value.clientHeight
    markScrollState()
    if((scrollTop + clientHeight) >= scrollHeight) {
       loadMoreContent()
    }
}

const onScroll = () => {
    scrollToLoad()
}

const markScrollState = () => {
    markScrollTop = squareRef.value.scrollTop
}

const resetScrollState = () => {
    markScrollTop = 0
    squareRef.value.scrollTop = markScrollTop
}

const restoreScrollState = () => {
    EventBus.emit("imageTextTile-load")
    if(markScrollTop < 1) return 
    squareRef.value.scrollTop = markScrollTop
}

const resetBack2TopBtn = () => {
    back2TopBtnRef.value.setScrollTarget(squareRef.value)
}

const refreshData = () => {
    resetCommom()
    loadContent()
}

/*-------------- 各种监听 --------------*/
/*
onMounted(() => {
    loadCategories()
    bindScrollListener()
    resetBack2TopBtn()
})
*/

onActivated(() => {
    loadCategories()
    resetBack2TopBtn()
    restoreScrollState()
})

const resetCommom = ()=> {
    resetPagination()
    resetScrollState()
    resetBack2TopBtn()
}

//TODO
watch(currentPlatformCode, (nv, ov) => {
    if(!isArtistMode.value) return
    loadCategories()
})

EventBus.on("artistSquare-refresh", refreshData)
</script>

<template>
    <div class="artist-square-view" ref="squareRef" @scroll="onScroll">
        <ArtistCategoryBar :data="categories" :alphabet="currentAlphabet" :loading="isLoadingCategories" >
        </ArtistCategoryBar>
        <ArtistListControl :data="artists" :loading="isLoadingContent"></ArtistListControl>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style scoped>
.artist-square-view {
    padding: 25px 33px 15px 33px;
    overflow: auto;
}
</style>