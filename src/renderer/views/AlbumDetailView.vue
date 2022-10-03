<!--
<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'AlbumDetailView'
}
</script>
-->

<script setup>
import { storeToRefs } from 'pinia';
import { onMounted, onActivated, ref, reactive, shallowRef, watch } from 'vue';
import PlayAddAllBtn from '../components/PlayAddAllBtn.vue';
import SongListControl from '../components/SongListControl.vue';
import TextListControl from '../components/TextListControl.vue';
import { useAlbumDetailStore } from '../store/albumDetailStore';
import { usePlatformStore } from '../store/platformStore';
import { usePlayStore } from '../store/playStore';
import FavouriteShareBtn from '../components/FavouriteShareBtn.vue';
import { useMainViewStore } from '../store/mainViewStore';
import { useUserProfileStore } from '../store/userProfileStore';

const props = defineProps({
    platform: String,
    id: String
})

const { albumId, albumName, albumCover, 
        artistName, publishTime, company,
        activeTab, tabs, tabTipText, 
        allSongs, about
    } = storeToRefs(useAlbumDetailStore())
const { setActiveTab, updateTabTipText, 
        isAllSongsTab, isAboutTab,
        isAllSongsTabLoaded, isAlbumDetailLoaded,
        updateAllSongs, updateAlbum, 
        updateAbout, resetAll
    } = useAlbumDetailStore()

const { getVender } = usePlatformStore()
const { addTracks, playNextTrack, resetQueue } = usePlayStore()
const { showToast, hideAllCtxMenus } = useMainViewStore()
const { addRecentAlbum } = useUserProfileStore()

let currentTabView = shallowRef(null)
const tabData = ref([])
const detail = reactive({})

const visitTab = (index) => {
    setActiveTab(index)
    switchTab()
}

//目前以加入当前播放列表为参考标准
const traceRecentPlay = () => {
    const { id, platform, title, cover, publishTime } = detail
    addRecentAlbum(id, platform, title, cover, publishTime)
}

const playAll = () => {
    resetQueue()
    addAll("即将为您播放全部！")
    playNextTrack()
}

const addAll = (text) => {
    addTracks(allSongs.value)
    showToast(text || "歌曲已全部添加！")
    traceRecentPlay()
} 

//TODO
const { addFavouriteAlbum, removeFavouriteAlbum, isFavouriteAlbum } = useUserProfileStore()
const favourited = ref(false)
const toggleFavourite = () => {
    favourited.value = !favourited.value
    let text = "专辑收藏成功！"
    if(favourited.value) {
        const { title, cover, publishTime } = detail
        addFavouriteAlbum(props.id, props.platform, title, cover, publishTime)
    } else {
        removeFavouriteAlbum(props.id, props.platform)
        text = "专辑已取消收藏！"
    }
    showToast(text)
}

const checkFavourite = () => {
    favourited.value = isFavouriteAlbum(props.id, props.platform)
}

const updateTabData = (data) => {
    tabData.value.length = 0
    if(typeof(data) == 'string') {
        tabData.value.push(data)
        updateTabTipText(0)
    } else {
        tabData.value.push(...data)
        updateTabTipText(tabData.value.length)
    }
}

const getAlbumDetail = () => {
    if(isAlbumDetailLoaded()) {
        return 
    }
    const vender = getVender(props.platform)
    if(!vender) return
    const id = props.id || albumId.value
    vender.albumDetail(id).then(result => {
        const artistName = result.artist.length > 0 ? (result.artist[0].name) : ''
        updateAlbum(result.title, result.cover, artistName, result.company, result.publishTime)
        updateAbout(result.about)
        Object.assign(detail, result)
        if(result.hasTracks()) {
            updateAllSongs(result.data)
            updateTabData(allSongs.value)
            currentTabView.value = SongListControl
            return 
        }
    })
}

const loadAllSongs = ()=> {
    if(isAllSongsTabLoaded()) {
        updateTabData(allSongs.value)
        currentTabView.value = SongListControl
        return 
    }
    const vender = getVender(props.platform)
    if(!vender) return
    const id = props.id || albumId.value
    vender.albumDetailAllSongs(id, 0, 100).then(result => {
        updateAllSongs(result.data)
        updateTabData(allSongs.value)
        currentTabView.value = SongListControl
    })
}

const loadAbout = () => {
    updateTabData(about.value)
    currentTabView.value = TextListControl
}

const detailRef = ref(null)
const bindScrollListener = () => {
    if(!detailRef.value) return
    detailRef.value.removeEventListener('scroll', hideAllCtxMenus)
    detailRef.value.addEventListener('scroll', hideAllCtxMenus)
}

const scrollToTop = () => {
    const view = document.querySelector('#album-detail')
    view.scrollTop = 0
    bindScrollListener()
}

const reloadAll = () =>  {
    resetAll()
    loadAll()
}

const loadAll = () =>  {
    scrollToTop()
    visitTab(0)
}

const resetView = () => {
    currentTabView.value = null
    updateTabTipText(0)
    checkFavourite()
}

const switchTab = () => {
    resetView()
    getAlbumDetail()
    if(isAllSongsTab()) {
        loadAllSongs()
    } else if(isAboutTab()) {
        loadAbout()
    }
}

//TODO 后期需要梳理优化，容易出现重复加载Bug
onMounted(() => loadAll())
onActivated(() => loadAll())
watch(activeTab, (nv,ov) => switchTab())
watch(()=> props.id, (nv, ov) => reloadAll())
</script>

<template>
    <div id="album-detail" ref="detailRef">
        <div class="header">
            <div>
                <img class="cover" v-lazy="albumCover" />
            </div>
            <div class="right">
                <div class="title" v-html="albumName"></div>
                <div class="info">
                    <div class="info-row">
                        <span><b>歌手:</b> {{ artistName }} </span>
                    </div>
                    <div class="info-row">
                        <span class="col1"><b>发行时间:</b> {{ publishTime }} </span>
                        <span class="col2"><b>发行公司:</b> {{ company }} </span>
                    </div>
                </div>
                <div class="action">
                    <PlayAddAllBtn :leftAction="playAll" :rightAction="() => addAll()"></PlayAddAllBtn>
                    <FavouriteShareBtn :favourited="favourited" :leftAction="toggleFavourite" class="spacing">
                    </FavouriteShareBtn>
                </div>
            </div>
        </div>
        <div class="center">
            <div class="tab-nav">
                <span class="tab" :class="{ active: activeTab == index }"
                    v-for="(tab,index) in tabs" 
                    @click="visitTab(index)"
                    v-html="tab.name" >
                </span>
                <span class="tab-tip" v-html="tabTipText" ></span>
            </div>
            <component :is="currentTabView" :data="tabData" 
                :artistVisitable="true" 
                :albumVisitable="true" >
            </component>
        </div>
    </div>
</template>

<style>
#album-detail {
    display: flex;
    flex-direction: column;
    padding: 25px 33px 15px 33px;
    flex: 1;
    overflow: auto;
}

#album-detail .header {
    display: flex;
    flex-direction: row;
    margin-bottom: 20px;
}

#album-detail .header .right {
    flex: 1;
    margin-left: 20px;
}

#album-detail .header .title {
    text-align: left;
    margin-top: 5px;
    font-size: 25px;
    font-weight: bold;
}

#album-detail .header .cover {
    width: 175px;
    height: 175px;
    border-radius: 6px;
    box-shadow: 0px 0px 10px #161616;
}

#album-detail .header .info {
    margin-top: 15px;
    margin-bottom: 30px;
    font-size: 16px;
    text-align: left;
}

#album-detail .header .info-row {
    margin-top: 10px;
}

#album-detail .header .info-row span {
    color: #ababab;
    color: var(--text-sub-color);
}

#album-detail .header .info-row b {
    margin-right: 8px;
}

#album-detail .header .info-row .col1 {
    width: 200px;
    display: inline-block;
}

#album-detail .header .info-row .col2 {
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    text-align: left;
}

#album-detail .action {
    display: flex;
    flex-direction: row;
}

#album-detail .spacing {
    margin-left: 20px;
}

#album-detail .tab-nav {
    position: relative;
    display: flex;
    height: 30px;
    margin-bottom: 3px;
    border-bottom: 1px solid var(--border-color);
}

#album-detail .tab {
    font-size: var(--tab-title-text-size);
    padding-left: 6px;
    padding-right: 6px;
    margin-right: 15px;
    border-bottom: 2px solid transparent;
    cursor: pointer;
}

#album-detail .tab-nav .active {
    border-color: #28c83f;
    border-color: var(--hl-color);
}

#album-detail .tab-tip {
    position: absolute;
    right: 10px;
    font-size: 16px;
    background: var(--hl-text-bg);
    -webkit-background-clip: text;
    color: transparent;
}

#album-detail  .songlist {
    display: flex;
    flex-direction: column;
}

#album-detail .text-ctl p {
    margin-top: 15px;
    margin-bottom: 5px;
}
</style>