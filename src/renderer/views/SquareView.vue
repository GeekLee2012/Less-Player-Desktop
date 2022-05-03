<script setup>
import { onActivated, onDeactivated, onMounted, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import EventBus from '../../common/EventBus';
import { useSquareViewStore } from '../store/squareViewStore';
import CategoryBar from '../components/CategoryBar.vue';
import PlaylistsControl from '../components/PlaylistsControl.vue';

const squareContentRef = ref(null)

//全部分类
const categories = reactive([])
const playlists = reactive([])
const pagination = { offset: 0, limit: 35, page: 1 }
let markScrollTop = 0

const { currentPlatformCode, currentCategoryCode } = storeToRefs(useSquareViewStore())
const { currentVender, currentCategory, 
        putCategory, resetCurrentCategoryItem 
    } = useSquareViewStore()

const resetPagination = () => {
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
    //console.log("cached: " + cached)
    if(!cached) {
        const vender = currentVender()
        if(!vender) return 
        vender.categories().then(result => {
            putCategory(result.platform, result.data)
            //TODO
            categories.push(...result.data)
            EventBus.emit('category-update')
        })
    } else {
        categories.push(...cached)
        EventBus.emit('category-update')
    }
}

const loadContent = () => {
    const vender = currentVender()
    if(!vender) return
    const cate = currentCategoryCode.value
    const offset = pagination.offset
    const limit = pagination.limit
    const page = pagination.page
    vender.square(cate, offset, limit, page).then(result => {
        console.log(result)
        playlists.push(...result.data)
    })
}

const loadData = () => {
    loadCategories()
    loadContent()
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
    //console.log("markScrollState: " + markScrollTop)
}

const resetScrollState = () => {
    markScrollTop = 0
}

const restoreScrollState = () => {
    if(markScrollTop < 1) return 
    squareContentRef.value.scrollTop = markScrollTop
}

/*-------------- 各种监听 --------------*/
onMounted(() => {
    resetPagination()
    loadData()
    bindScrollListener()
})

onActivated(() => {
    restoreScrollState()
})

watch(currentPlatformCode, (nv, ov) => {
    playlists.length = 0
    resetCurrentCategoryItem()
    resetPagination()
    resetScrollState()
    loadData()
})

watch(currentCategoryCode, (nv, ov) => {
    playlists.length = 0
    resetPagination()
    loadContent()
})
</script>

<template>
    <div id="square-content" ref="squareContentRef">
        <CategoryBar :data="categories" v-show="categories.length > 0"></CategoryBar>
        <PlaylistsControl :data="playlists"></PlaylistsControl>
    </div>
</template>

<style scoped>
#square-content {
    padding: 25px 33px 15px 33px;
    overflow: auto;
}
</style>