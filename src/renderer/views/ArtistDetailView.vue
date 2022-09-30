<!--
<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'ArtistDetailView'
}
</script>
-->

<script setup>
import { storeToRefs } from 'pinia';
import { onMounted, onActivated ,ref, shallowRef, watch, reactive } from 'vue';
import AlbumListControl from '../components/AlbumListControl.vue';
import TextListControl from '../components/TextListControl.vue';
import PlayAddAllBtn from '../components/PlayAddAllBtn.vue';
import SongListControl from '../components/SongListControl.vue';
import { useArtistDetailStore } from '../store/artistDetailStore';
import { usePlatformStore } from '../store/platformStore';
import { usePlayStore } from '../store/playStore';
import { useMainViewStore } from '../store/mainViewStore';
import FavouriteShareBtn from '../components/FavouriteShareBtn.vue';
import EventBus from '../../common/EventBus';
import { useUserProfileStore } from '../store/userProfileStore';

const props = defineProps({
    platform: String,
    id: String
})

const { artistId, artistName, artistCover, 
        artistAlias, tabTipText, activeTab, 
        tabs, hotSongs, allSongs, 
        albums, about
    } = storeToRefs(useArtistDetailStore())
const { setActiveTab, updateArtist,
        updateHotSongs, updateAllSongs, appendAllSongs, 
        updateAlbums, updateAbout, 
        resetAll, updateTabTipText,
        isHotSongsTab, isAllSongsTab, 
        isAlbumsTab, isAboutTab,
        isHotSongsTabLoaded,
        isAllSongsTabLoaded,
        isAlbumsTabLoaded,
        isAboutTabLoaded,
        isArtistDetailLoaded
    } = useArtistDetailStore()

const { getVender } = usePlatformStore()
const { addTracks, playNextTrack, resetQueue } = usePlayStore()
const { showToast, hideAllCtxMenus } = useMainViewStore() 

const artistDetailRef = ref(null)
const currentTabView = shallowRef(null)
const tabData = ref([])
const detail = reactive({})
let offset = 0
let page = 1
let limit = 30
const loadingDetail = ref(false)
const loading = ref(false)

const visitTab = (index) => {
    if(loading.value) return
    setActiveTab(index)
    switchTab()
}

const playHotSongs = () => {
    resetQueue()
    addHotSongs("即将为您播放全部！")
    playNextTrack()
}

const addHotSongs = (text) => {
    addTracks(hotSongs.value)
    showToast(text || "歌曲已全部添加！")
}

const playAllSongs = () => {
    resetQueue()
    addAllSongs("即将为您播放全部！")
    playNextTrack()
}

const addAllSongs = (text) => {
    addTracks(allSongs.value)
    showToast(text || "歌曲已全部添加！")
}

//TODO
const { addFollowArtist, removeFollowArtist, isFollowArtist } = useUserProfileStore()
const follow = ref(false)
const toggleFollow = () => {
    follow.value = !follow.value
    let text = "歌手关注成功！"
    if(follow.value) {
        const { title, cover } = detail
        addFollowArtist(props.id, props.platform, title, cover)
    } else {
        removeFollowArtist(props.id, props.platform)
        text = "歌手已被取消关注！"
    }
    showToast(text)
}

const checkFollow = () => {
    follow.value = isFollowArtist(props.id, props.platform)
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

const getArtistDetail = () => {
    checkFollow()
    if(isArtistDetailLoaded()) {
        return 
    }
    const vender = getVender(props.platform)
    if(!vender) return
    loadingDetail.value = true
    const id = artistId.value
    vender.artistDetail(id).then(result => {
        updateArtist(result.title, result.cover)
        if(result.about) {
            updateAbout(result.about)
        }
        Object.assign(detail, result)
        loadingDetail.value = false
    })
}

const loadHotSongs = () => {
    if(isHotSongsTabLoaded()) {
        updateTabData(hotSongs.value)
        currentTabView.value = SongListControl
        loading.value = false
        return 
    }
    loading.value = true
    const vender = getVender(props.platform)
    if(!vender) return
    const id = artistId.value
    vender.artistDetailHotSongs(id).then(result => {
        if(result.name && result.cover) updateArtist(result.name, result.cover)
        updateHotSongs(result.data)
        updateTabData(hotSongs.value)
        currentTabView.value = SongListControl

        loading.value = false
    })
}

const loadMoreSongs = () => {
    const vender = getVender(props.platform)
    if(!vender) return
    const id = artistId.value
    vender.artistDetailAllSongs(id, offset, limit, page).then(result => {
        appendAllSongs(result.data)
        updateTabData(allSongs.value)
        currentTabView.value = SongListControl
    })
    offset = page++ * limit
}

const loadAllSongs = () => {
    if(isAllSongsTabLoaded()) {
        updateTabData(allSongs.value)
        currentTabView.value = SongListControl
        loading.value = false
        return 
    }
    const vender = getVender(props.platform)
    if(!vender) return
    loading.value = true
    const id = artistId.value
    vender.artistDetailAllSongs(id, offset, limit, page).then(result => {
        updateAllSongs(result.data)
        updateTabData(allSongs.value)
        currentTabView.value = SongListControl
        loading.value = false
    })
    offset = page++ * limit
}

const loadAlbums = () => {
    loadingDetail.value = false
    loading.value = false
    if(isAlbumsTabLoaded()) {
        updateTabData(albums.value)
        currentTabView.value = AlbumListControl
        return 
    }
    const vender = getVender(props.platform)
    if(!vender) return
    const id = artistId.value
    //TODO
    vender.artistDetailAlbums(id, 0, 365, 1).then(result => {
        updateAlbums(result.data)
        updateTabData(albums.value)
        currentTabView.value = AlbumListControl
    })
}

const loadAbout = () => {
    loadingDetail.value = false
    loading.value = false
    if(isAboutTabLoaded()) {
        updateTabData(about.value)
        updateTabTipText(0)
        currentTabView.value = TextListControl
        return 
    }
    const vender = getVender(props.platform)
    if(!vender) return
    const id = artistId.value
    vender.artistDetailAbout(id).then(result => {
        updateAbout(result)
        updateTabData(result)
        updateTabTipText(0)
        currentTabView.value = TextListControl
    })
}

const scrollToTop = () => {
    artistDetailRef.value.scrollTop = 0
}

const scrollToLoad = () => {
    const scrollTop = artistDetailRef.value.scrollTop
    const scrollHeight = artistDetailRef.value.scrollHeight
    const clientHeight = artistDetailRef.value.clientHeight
    if((scrollTop + clientHeight) >= scrollHeight) {
       loadMoreSongs()
    }
    //TODO
    hideAllCtxMenus()
}

const resetTabView = () => {
    currentTabView.value = null
    artistDetailRef.value.removeEventListener('scroll', scrollToLoad)
    updateTabTipText(0)
}

const bindScrollListener = (handle) => {
    if(!artistDetailRef.value) return 
    artistDetailRef.value.removeEventListener('scroll', handle)
    artistDetailRef.value.addEventListener('scroll', handle)
}

const switchTab = () => {
    resetTabView()
    loading.value = true
    getArtistDetail()
    if(isHotSongsTab()) {
        loadHotSongs()
        bindScrollListener(hideAllCtxMenus)
    } else if(isAllSongsTab()) {
        loadAllSongs()
        bindScrollListener(scrollToLoad)
    } else if(isAlbumsTab()) {
        loadAlbums()
    } else if(isAboutTab()) {
        loadAbout()
    }
}

const resetPagination = () => {
    offset = 0
    page = 1
}

const reloadAll = () =>  {
    resetAll()
    loadAll()
}

const loadAll = () => {
    scrollToTop()
    resetPagination()
    visitTab(0)
    EventBus.emit("imageTextTile-load")
}

//TODO 后期需要梳理优化，容易出现重复加载Bug
/*-------------- 各种监听 --------------*/
onMounted(() => loadAll())
onActivated(() => loadAll())
//watch(artistId, (nv, ov) => reloadAll())
watch(activeTab, (nv,ov) => switchTab())
watch(() => props.id , (nv, ov) => reloadAll())
</script>

<template>
    <div id="artist-detail" ref="artistDetailRef">
        <div class="header">
            <div>
                <img class="cover" v-lazy="artistCover" />
            </div>
            <div class="right" v-show="!loading">
                <div class="title" v-html="artistName" ></div>
                <div class="alias" v-html="artistAlias" ></div>
                <div class="action">
                    <PlayAddAllBtn :leftAction="playHotSongs" :rightAction="() => addHotSongs()" v-show="isHotSongsTab()" text="播放热门歌曲" class="spacing"></PlayAddAllBtn>
                    <PlayAddAllBtn :leftAction="playAllSongs" :rightAction="() => addAllSongs()" v-show="isAllSongsTab()" class="spacing"></PlayAddAllBtn>
                    <FavouriteShareBtn :favourited="follow" actionText="关注" :leftAction="toggleFollow" class="spacing">
                    </FavouriteShareBtn>
                </div>
            </div>
            <div class="right" v-show="loading">
                <div class="title" v-show="loadingDetail">
                    <div class="loading-mask" style="width: 36%; height: 36px; display: inline-block;"></div>
                </div>
                <div class="title" v-show="!loadingDetail">
                    <div class="loading-mask" style="width: 36%; height: 36px; display: inline-block;"></div>
                </div>
                <div class="action">
                    <div class="loading-mask spacing" v-for="i in 2" style="width: 168px; height: 30px; display: inline-block;"></div>
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
            <component :is="currentTabView" 
                :data="tabData"
                :platform="platform"
                :artistVisitable="true" 
                :albumVisitable="true" >
            </component>
            <div v-show="loading">
                <div class="loading-mask" v-for="i in 12" style="width: 100%;  height: 36px; margin-bottom: 5px; display: inline-block;"></div>
            </div>
        </div>
    </div>
</template>

<style>
#artist-detail {
    display: flex;
    flex-direction: column;
    padding: 25px 33px 15px 33px;
    flex: 1;
    overflow: auto;
}

#artist-detail .header {
    display: flex;
    flex-direction: row;
    margin-bottom: 20px;
}

#artist-detail .header .right {
    flex: 1;
    margin-left: 20px;
}

#artist-detail .header .title{
    text-align: left;
    margin-top: 5px;
    margin-bottom: 20px;
    font-size: 25px;
    font-weight: bold;
    height: 39px;
}

#artist-detail .header .alias{
    display: none;
}

#artist-detail .header .cover {
    width: 168px;
    height: 168px;
    border-radius: 10rem;
    box-shadow: 0px 0px 10px #161616;
}

#artist-detail .action {
    display: flex;
    flex-direction: row;
}

#artist-detail .spacing {
    margin-right: 20px;
}

#artist-detail .tab-nav {
    position: relative;
    display: flex;
    height: 30px;
    margin-bottom: 3px;
    border-bottom: 1px solid var(--border-color);
}

#artist-detail .tab {
    font-size: var(--tab-title-text-size);
    padding-left: 6px;
    padding-right: 6px;
    margin-right: 15px;
    border-bottom: 2px solid transparent;
    cursor: pointer;
}

#artist-detail .tab-tip {
    position: absolute;
    right: 10px;
    font-size: 16px;
    background: linear-gradient(to top right, #1ca388, #28c83f);
    background: var(--hl-text-bg);
    -webkit-background-clip: text;
    color: transparent;
}

#artist-detail .tab-nav .active {
    border-color: #28c83f;
    border-color: var(--hl-color);
}

#artist-detail .songlist {
    display: flex;
    flex-direction: column;
}
</style>