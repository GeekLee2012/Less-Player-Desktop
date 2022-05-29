<script setup>
import { onActivated, onMounted, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import EventBus from '../../common/EventBus';
import { useArtistSquareViewStore } from '../store/artistSquareViewStore';
import ArtistCategoryBar from '../components/ArtistCategoryBar.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import ArtistListControl from '../components/ArtistListControl.vue';

const squareRef = ref(null)
const back2TopBtnRef = ref(null)

//全部分类
const categories = reactive([])
const artists = reactive([])
const pagination = { offset: 0, limit: 35, page: 1}
let markScrollTop = 0

const { currentPlatformCode, currentCategoryItems, currentAlphabet } 
    = storeToRefs(useArtistSquareViewStore())
const { currentVender, currentCategory, 
        putCategory, resetCurrentCategoryItems,
        putAlphabet
    } = useArtistSquareViewStore()

const resetPagination = () => {
    artists.length = 0
    pagination.offset = 0
    pagination.page = 1
}

const nextPage = () =>  {
    pagination.offset = pagination.page * pagination.limit
    pagination.page = pagination.page + 1
}

//TODO
const addArtistData = (data) => {
    if(!data || data.length < 1) return 
    data.forEach(item => {
        if(JSON.stringify(artists).includes(JSON.stringify(item))) return 
        artists.push(item)
    })
}

//TODO
const loadCategories = () => {
    return new Promise((resolve, reject) => {
        categories.length = 0
        let cached = currentCategory()
        if(!cached) {
            const vender = currentVender()
            if(!vender || !vender.artistCategories) return 
            vender.artistCategories().then(result => {
                result.data.push(result.alphabet)
                putCategory(result.platform, result.data)
                categories.push(...result.data)
                putAlphabet(result.platform, result.alphabet)
                EventBus.emit('artistCategory-update')
                resolve(categories)
            })
        } else {
            categories.push(...cached)
            EventBus.emit('artistCategory-update')
            resolve(categories)
        }
    })
}

const loadContent = () => {
    const vender = currentVender()
    if(!vender) return
    const cate = currentCategoryItems.value
    const offset = pagination.offset
    const limit = pagination.limit
    const page = pagination.page
    const platform = currentPlatformCode.value
    vender.artistSquare(cate, offset, limit, page).then(result => {
        pagination.page = result.page
        if(platform != result.platform) return 
        if(cate != result.cate) return 
        addArtistData(result.data)
    })
}

const loadData = () => {
    loadCategories().then(cates => {
        loadContent()
    })
}

const loadMoreContent = () => {
    nextPage()
    loadContent()
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

const bindScrollListener = () => {
    squareRef.value.removeEventListener('scroll', scrollToLoad)
    squareRef.value.addEventListener('scroll', scrollToLoad)
}

const markScrollState = () => {
    markScrollTop = squareRef.value.scrollTop
}

const resetScrollState = () => {
    markScrollTop = 0
}

const restoreScrollState = () => {
    if(markScrollTop < 1) return 
    squareRef.value.scrollTop = markScrollTop
}

const resetBack2TopBtn = () => {
    back2TopBtnRef.value.setScrollTarget(squareRef.value)
}

/*-------------- 各种监听 --------------*/
onMounted(() => {
    resetCurrentCategoryItems()
    resetCommom()
    loadData()
    bindScrollListener()
    resetBack2TopBtn()
})

onActivated(() => restoreScrollState())

const resetCommom = ()=> {
    resetPagination()
    resetScrollState()
    resetBack2TopBtn()
}

//TODO
watch(currentPlatformCode, (nv, ov) => {
    resetCurrentCategoryItems()
    resetCommom()
    loadData()
})

watch(currentCategoryItems, (nv, ov) => {
    resetCommom()
    loadContent()
}, { deep: true })
</script>

<template>
    <div class="artist-square-view" ref="squareRef">
        <ArtistCategoryBar :data="categories"
            :alphabet="currentAlphabet"
            v-show="categories.length > 0" >
        </ArtistCategoryBar>
        <ArtistListControl :data="artists"></ArtistListControl>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style scoped>
.artist-square-view {
    padding: 25px 33px 15px 33px;
    overflow: auto;
}
</style>