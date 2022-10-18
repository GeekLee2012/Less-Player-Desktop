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
import { useAppCommonStore } from '../store/appCommonStore';
import FavouriteShareBtn from '../components/FavouriteShareBtn.vue';
import EventBus from '../../common/EventBus';
import { useUserProfileStore } from '../store/userProfileStore';
import Back2TopBtn from '../components/Back2TopBtn.vue';

const props = defineProps({
    exploreMode: String,
    platform: String,
    id: String
})

const { artistId, artistName, artistCover, platform,
        artistAlias, tabTipText, activeTab, 
        tabs, hotSongs, allSongs, 
        albums, about, hasHotSongTab, hasAllSongTab
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
const { showToast, hideAllCtxMenus } = useAppCommonStore() 

const artistDetailRef = ref(null)
const currentTabView = shallowRef(null)
const tabData = reactive([])
const detail = reactive({})
let offset = 0,  page = 1, limit = 30
const isLoadingDetail = ref(false)
const isLoadingSongs = ref(false)
const isLoadingAlbums = ref(false)
const isLoading = ref(false)
const back2TopBtnRef = ref(null)
let markScrollTop = 0

const setLoadingDetail = (value) => {
    isLoadingDetail.value = value
}

const setLoading = (value) => {
    isLoading.value = value
}

const setLoadingSongs = (value) => {
    isLoadingSongs.value = value
    setLoading(value)
}

const setLoadingAlbums = (value) => {
    isLoadingAlbums.value = value
    setLoading(value)
}

const visitTab = (index, isClick) => {
    if(isLoading.value && isClick) return
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
    if(typeof(data) == 'string') {
        tabData.length = 0
        tabData.push(data)
        updateTabTipText(0)
    } else {
        tabData.length = 0
        tabData.push(...data)
        updateTabTipText(tabData.length)
    }
}

const getArtistDetail = () => {
    checkFollow()
    if(isArtistDetailLoaded()) {
        setLoadingDetail(false)
        return 
    }
    const vender = getVender(platform.value)
    if(!vender) return
    setLoadingDetail(true)
    const id = artistId.value
    vender.artistDetail(id).then(result => {
        updateArtist(result.title, result.cover)
        if(result.about) {
            updateAbout(result.about)
        }
        Object.assign(detail, result)
        setLoadingDetail(false)
    })
}

const loadHotSongs = () => {
    setLoadingSongs(true)
    if(isHotSongsTabLoaded()) {
        updateTabData(hotSongs.value)
        setLoadingSongs(false)
        return 
    }
    const vender = getVender(platform.value)
    if(!vender) return
    const id = artistId.value
    vender.artistDetailHotSongs(id).then(result => {
        if(result.name && result.cover) updateArtist(result.name, result.cover)
        updateHotSongs(result.data)
        updateTabData(hotSongs.value)
        setLoadingSongs(false)
    })
}

//TODO
const loadMoreSongs = () => {
    const vender = getVender(platform.value)
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
    setLoadingSongs(true)
    if(isAllSongsTabLoaded()) {
        updateTabData(allSongs.value)
        setLoadingSongs(false)
        return 
    }
    const vender = getVender(platform.value)
    if(!vender) return
    const id = artistId.value
    vender.artistDetailAllSongs(id, offset, limit, page).then(result => {
        updateAllSongs(result.data)
        updateTabData(allSongs.value)
        setLoadingSongs(false)
    })
    offset = page++ * limit
}

const loadAlbums = () => {
    setLoadingDetail(false)
    setLoadingAlbums(true)
    if(isAlbumsTabLoaded()) {
        //TODO
        setTimeout(() => {
            updateTabData(albums.value)
            setLoadingAlbums(false)
        }, 0)
        return 
    }
    const vender = getVender(platform.value)
    if(!vender) return
    const id = artistId.value
    //TODO
    vender.artistDetailAlbums(id, 0, 365, 1).then(result => {
        updateAlbums(result.data)
        updateTabData(albums.value)
        setLoadingAlbums(false)
    })
}

const loadAbout = () => {
    setLoadingDetail(false)
    setLoadingSongs(false)
    setLoadingAlbums(false)
    if(isAboutTabLoaded()) {
        updateTabData(about.value)
        updateTabTipText(0)
        return 
    }
    const vender = getVender(platform.value)
    if(!vender) return
    const id = artistId.value
    vender.artistDetailAbout(id).then(result => {
        updateAbout(result)
        updateTabData(result)
        updateTabTipText(0)
    })
}

const scrollToLoad = () => {
    if(isLoading.value) return
    const scrollTop = artistDetailRef.value.scrollTop
    const scrollHeight = artistDetailRef.value.scrollHeight
    const clientHeight = artistDetailRef.value.clientHeight
    markScrollState()
    if((scrollTop + clientHeight) >= scrollHeight) {
       loadMoreSongs()
    }
    //TODO
    hideAllCtxMenus()
}

const resetTabView = () => {
    currentTabView.value = null
    tabData.length = 0
    updateTabTipText(0)
}

const onScroll = () => {
    hideAllCtxMenus()
    if(isAllSongsTab()) {
        scrollToLoad()
    } else {
        markScrollState()
    }
}

const switchTab = () => {
    setLoading(true)
    resetTabView()
    getArtistDetail()
    if(isHotSongsTab()) {
        currentTabView.value = SongListControl
        loadHotSongs()
    } else if(isAllSongsTab()) {
        currentTabView.value = SongListControl
        loadAllSongs()
    } else if(isAlbumsTab()) {
        currentTabView.value = AlbumListControl
        loadAlbums()
    } else if(isAboutTab()) {
        currentTabView.value = TextListControl
        loadAbout()
    }
}

const isAvailableTab = (btnType) => {
    const isPlayHotSongBtn = (btnType === 0)
    const isPlayAllSongBtn = (btnType === 1)
    if(isPlayHotSongBtn) {
        if(isAllSongsTab()) return false
        else if(hasAllSongTab.value) return false
    } else if(isPlayAllSongBtn) {
        if(isHotSongsTab()) return false
        else if(hasHotSongTab.value) return false
    }
    return true
}

const resetBack2TopBtn = () => {
    back2TopBtnRef.value.setScrollTarget(artistDetailRef.value)
}

const resetScrollState = () => {
    markScrollTop = 0
    artistDetailRef.value.scrollTop = markScrollTop
}

const markScrollState = () => {
    markScrollTop = artistDetailRef.value.scrollTop
}

const restoreScrollState = () => {
    if(markScrollTop < 1) return 
    artistDetailRef.value.scrollTop = markScrollTop
}

const resetPagination = () => {
    offset = 0
    page = 1
}

const reloadAll = () =>  {
    setLoadingDetail(true)
    setLoadingSongs(true)
    resetBack2TopBtn()
    resetAll()
    loadAll()
}

const loadAll = () => {
    resetPagination()
    resetScrollState()
    visitTab(0)
    EventBus.emit("imageTextTile-load")
}

//TODO 后期需要梳理优化，容易出现重复加载Bug
/*-------------- 各种监听 --------------*/
onMounted(() => {
    resetBack2TopBtn()  
    resetScrollState()
    loadAll()
})
onActivated(() => {
    getArtistDetail()
    restoreScrollState()
})
watch(activeTab, switchTab)
watch(artistId, reloadAll)
</script>

<template>
    <div id="artist-detail" ref="artistDetailRef" @scroll="onScroll">
        <div class="header">
            <div>
                <img class="cover" v-lazy="artistCover" />
            </div>
            <div class="right" v-show="!isLoading">
                <div class="title" v-html="artistName" ></div>
                <div class="alias" v-html="artistAlias" ></div>
                <div class="action">
                    <PlayAddAllBtn :leftAction="playHotSongs" :rightAction="() => addHotSongs()" v-show="isAvailableTab(0)" text="播放热门歌曲" class="spacing"></PlayAddAllBtn>
                    <PlayAddAllBtn text="播放歌曲" :leftAction="playAllSongs" :rightAction="() => addAllSongs()" v-show="isAvailableTab(1)" class="spacing"></PlayAddAllBtn>
                    <FavouriteShareBtn :favourited="follow" actionText="关注" :leftAction="toggleFollow" class="spacing">
                    </FavouriteShareBtn>
                </div>
            </div>
            <div class="right" v-show="isLoading">
                <div class="title" v-show="isLoadingDetail">
                    <div class="loading-mask" style="width: 36%; height: 39px; display: inline-block;"></div>
                </div>
                <div class="title" v-html="artistName" v-show="!isLoadingDetail"></div>
                <div class="action" v-show="isLoadingDetail">
                    <div class="loading-mask spacing" v-for="i in 2" style="width: 168px; height: 36px; display: inline-block;"></div>
                </div>
                <div class="action" v-show="!isLoadingDetail">
                    <PlayAddAllBtn :leftAction="playHotSongs" :rightAction="() => addHotSongs()" v-show="isAvailableTab(0)" text="播放热门歌曲" class="spacing"></PlayAddAllBtn>
                    <PlayAddAllBtn text="播放歌曲" :leftAction="playAllSongs" :rightAction="() => addAllSongs()" v-show="isAvailableTab(1)" class="spacing"></PlayAddAllBtn>
                    <FavouriteShareBtn :favourited="follow" actionText="关注" :leftAction="toggleFollow" class="spacing">
                    </FavouriteShareBtn>
                </div>
            </div>
        </div>
        <div class="center">
            <div class="tab-nav">
                <span class="tab" :class="{ active: activeTab == index }"
                    v-for="(tab,index) in tabs" 
                    @click="visitTab(index, true)"
                    v-html="tab.name" >
                </span>
                <span class="tab-tip" v-html="tabTipText" ></span>
            </div>
            <component :is="currentTabView" 
                :data="tabData"
                :platform="platform"
                :artistVisitable="true" 
                :albumVisitable="true" 
                :loading="isLoading" >
            </component>
        </div>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
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
    margin-left: 30px;
}

#artist-detail .header .title{
    text-align: left;
    margin-top: 5px;
    margin-bottom: 20px;
    margin-bottom: 39px;
    font-size: 30px;
    font-weight: bold;
    height: 39px;

    overflow: hidden;
    word-wrap: break-all;
    white-space: pre-wrap;
    line-break: anywhere;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
}

#artist-detail .header .alias{
    display: none;
}

#artist-detail .header .cover {
    width: 233px;
    height: 233px;
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