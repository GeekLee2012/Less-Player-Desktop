<script setup>
import { onActivated, onDeactivated, onMounted, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import EventBus from '../../common/EventBus';
import { usePlaylistSquareViewStore } from '../store/playlistSquareViewStore';
import PlaylistCategoryBar from '../components/PlaylistCategoryBar.vue';
import PlaylistsControl from '../components/PlaylistsControl.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';

const squareContentRef = ref(null)
const back2TopBtnRef = ref(null)

//全部分类
const categories = reactive([])
const playlists = reactive([])
const pagination = { offset: 0, limit: 35, page: 1 }
let markScrollTop = 0

const { currentPlatformCode, currentCategoryCode } = storeToRefs(usePlaylistSquareViewStore())
const { currentVender, currentCategory, 
        putCategory, resetCurrentCategoryItem, 
        setNeedRefresh
    } = usePlaylistSquareViewStore()

const resetPagination = () => {
    playlists.length = 0
    pagination.offset = 0
    pagination.page = 1
}

const nextPage = () =>  {
    pagination.offset = pagination.page * pagination.limit
    pagination.page = pagination.page + 1
}

const loadCategories = () => {
    categories.length = 0
    let cached = currentCategory()
    if(!cached) {
        const vender = currentVender()
        if(!vender) return 
        vender.categories().then(result => {
            putCategory(result.platform, result.data)
            //TODO
            categories.push(...result.data)
            EventBus.emit('playlistCategory-update')
        })
    } else {
        categories.push(...cached)
        EventBus.emit('playlistCategory-update')
    }
}

const loadContent = () => {
    const vender = currentVender()
    if(!vender) return
    const cate = currentCategoryCode.value
    const offset = pagination.offset
    const limit = pagination.limit
    const page = pagination.page
    const platform = currentPlatformCode.value
    vender.square(cate, offset, limit, page).then(result => {
        if(platform != result.platform) return 
        if(cate != result.cate) return 
        playlists.push(...result.data)
    })
}


const loadMoreContent = () => {
    nextPage()
    loadContent()
}

const scrollToLoad = () => {
    const scrollTop = squareContentRef.value.scrollTop
    const scrollHeight = squareContentRef.value.scrollHeight
    const clientHeight = squareContentRef.value.clientHeight
    markScrollState()
    if((scrollTop + clientHeight) >= scrollHeight) {
       loadMoreContent()
    }
}

const bindScrollListener = () => {
    squareContentRef.value.removeEventListener('scroll', scrollToLoad)
    squareContentRef.value.addEventListener('scroll', scrollToLoad)
}

const markScrollState = () => {
    markScrollTop = squareContentRef.value.scrollTop
}

const resetScrollState = () => {
    markScrollTop = 0
}

const restoreScrollState = () => {
    if(markScrollTop < 1) return 
    squareContentRef.value.scrollTop = markScrollTop
}

const resetBack2TopBtn = () => {
    back2TopBtnRef.value.setScrollTarget(squareContentRef.value)
}

//TODO 后期需要梳理优化
/*-------------- 各种监听 --------------*/
onMounted(() => {
    resetPagination()
    loadCategories()
    bindScrollListener()
    resetBack2TopBtn()
})

onActivated(() => restoreScrollState())

const resetCommom = ()=> {
    resetPagination()
    resetScrollState()
    resetBack2TopBtn()
}

const refreshData = () => {
    resetCommom()
    loadContent()
}

watch(currentPlatformCode, (nv, ov) => {
    resetCommom()
    loadCategories()
})

EventBus.on("playlistSquare-refresh", () => refreshData())
</script>

<template>
    <div class="playlist-square-view" ref="squareContentRef">
        <PlaylistCategoryBar :data="categories" 
            v-show="categories.length > 0" >
        </PlaylistCategoryBar>
        <PlaylistsControl :data="playlists"></PlaylistsControl>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style scoped>
.playlist-square-view {
    padding: 25px 33px 15px 33px;
    overflow: auto;
}
</style>