<!--
<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'ArtistDetailView'
}
</script>
-->

<script setup>
import { onMounted, onActivated, ref, shallowRef, watch, reactive, inject } from 'vue';
import { storeToRefs } from 'pinia';
import { useArtistDetailStore } from '../store/artistDetailStore';
import { usePlatformStore } from '../store/platformStore';
import { usePlayStore } from '../store/playStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { useUserProfileStore } from '../store/userProfileStore';
import AlbumListControl from '../components/AlbumListControl.vue';
import TextListControl from '../components/TextListControl.vue';
import PlayAddAllBtn from '../components/PlayAddAllBtn.vue';
import SongListControl from '../components/SongListControl.vue';
import FavoriteShareBtn from '../components/FavoriteShareBtn.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import EventBus from '../../common/EventBus';



const props = defineProps({
    exploreMode: String,
    platform: String,
    id: String
})

const { addAndPlayTracks } = inject('player')

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

const { getVendor } = usePlatformStore()
const { addTracks } = usePlayStore()
const { showToast, hideAllCtxMenus } = useAppCommonStore()

const artistDetailRef = ref(null)
const currentTabView = shallowRef(null)
const tabData = reactive([])
const detail = reactive({})
let offset = 0, page = 1, limit = 30
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
    if (isLoading.value && isClick) return
    setActiveTab(index)
    switchTab()
}

const playHotSongs = () => addAndPlayTracks(hotSongs.value, true)
const playAllSongs = () => addAndPlayTracks(allSongs.value, true)

const addHotSongs = (text) => {
    addTracks(hotSongs.value)
    showToast(text || "歌曲已全部添加！")
}

const addAllSongs = (text) => {
    addTracks(allSongs.value)
    showToast(text || "歌曲已全部添加！")
}

const { addFollowArtist, removeFollowArtist, isFollowArtist } = useUserProfileStore()
const follow = ref(false)
const toggleFollow = () => {
    follow.value = !follow.value
    let text = "歌手关注成功！"
    if (follow.value) {
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
    tabData.length = 0
    if (typeof (data) == 'string') {
        tabData.push(data)
        updateTabTipText(0)
    } else {
        tabData.push(...data)
        updateTabTipText(tabData.length)
    }
}

const getArtistDetail = async () => {
    checkFollow()
    if (isArtistDetailLoaded()) {
        setLoadingDetail(false)
        return
    }
    const vendor = getVendor(platform.value)
    if (!vendor || !vendor.artistDetail) return
    setLoadingDetail(true)
    const id = artistId.value
    const result = await vendor.artistDetail(id)
    if (!result) return
    updateArtist(result.title, result.cover)
    if (result.about) updateAbout(result.about)
    if (result.hotSongs) updateHotSongs(result.hotSongs)
    Object.assign(detail, result)
    setLoadingDetail(false)
}

const loadHotSongs = () => {
    setLoadingSongs(true)
    if (isHotSongsTabLoaded()) {
        updateTabData(hotSongs.value)
        setLoadingSongs(false)
        return
    }
    const vendor = getVendor(platform.value)
    if (!vendor || !vendor.artistDetailHotSongs) return
    const id = artistId.value
    vendor.artistDetailHotSongs(id).then(result => {
        if (!isHotSongsTab()) return
        if (!result) return
        if (result.name && result.cover) updateArtist(result.name, result.cover)
        updateHotSongs(result.data)
        updateTabData(hotSongs.value)
        setLoadingSongs(false)
    })
}

//TODO
const loadMoreSongs = () => {
    const vendor = getVendor(platform.value)
    if (!vendor || !vendor.artistDetailAllSongs) return
    const id = artistId.value
    vendor.artistDetailAllSongs(id, offset, limit, page).then(result => {
        appendAllSongs(result.data)
        updateTabData(allSongs.value)
        currentTabView.value = SongListControl
    })
    offset = page++ * limit
}

const loadAllSongs = () => {
    setLoadingSongs(true)
    if (isAllSongsTabLoaded()) {
        updateTabData(allSongs.value)
        setLoadingSongs(false)
        return
    }
    const vendor = getVendor(platform.value)
    if (!vendor || !vendor.artistDetailAllSongs) return
    const id = artistId.value
    vendor.artistDetailAllSongs(id, offset, limit, page).then(result => {
        if (!isAllSongsTab()) return
        if (!result) return
        updateAllSongs(result.data)
        updateTabData(allSongs.value)
        setLoadingSongs(false)
    })
    offset = page++ * limit
}

const loadAlbums = () => {
    setLoadingDetail(false)
    setLoadingAlbums(true)
    if (isAlbumsTabLoaded()) {
        //TODO
        setTimeout(() => {
            updateTabData(albums.value)
            setLoadingAlbums(false)
        }, 0)
        return
    }
    const vendor = getVendor(platform.value)
    if (!vendor || !vendor.artistDetailAlbums) return
    const id = artistId.value
    //TODO 分页加载全部
    vendor.artistDetailAlbums(id, 0, 365, 1).then(result => {
        if (!isAlbumsTab()) return
        if (!result) return
        updateAlbums(result.data)
        updateTabData(result.data)
        setLoadingAlbums(false)
    })
}

const loadAbout = () => {
    setLoadingDetail(false)
    setLoadingSongs(false)
    setLoadingAlbums(false)
    if (isAboutTabLoaded()) {
        updateTabData(about.value)
        updateTabTipText(0)
        return
    }
    const vendor = getVendor(platform.value)
    if (!vendor || !vendor.artistDetailAbout) return
    const id = artistId.value
    vendor.artistDetailAbout(id).then(result => {
        if (!isAboutTab()) return
        updateAbout(result)
        updateTabData(result)
        updateTabTipText(0)
    })
}

const scrollToLoad = () => {
    if (isLoading.value) return
    const scrollTop = artistDetailRef.value.scrollTop
    const scrollHeight = artistDetailRef.value.scrollHeight
    const clientHeight = artistDetailRef.value.clientHeight
    markScrollState()
    const allowedError = 3 //允许误差
    if ((scrollTop + clientHeight + allowedError) >= scrollHeight) {
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
    if (isAllSongsTab()) {
        scrollToLoad()
    } else {
        markScrollState()
    }
}

const switchTab = () => {
    setLoading(true)
    resetTabView()
    if (isHotSongsTab()) {
        currentTabView.value = SongListControl
        loadHotSongs()
    } else if (isAllSongsTab()) {
        currentTabView.value = SongListControl
        loadAllSongs()
    } else if (isAlbumsTab()) {
        currentTabView.value = AlbumListControl
        loadAlbums()
    } else if (isAboutTab()) {
        currentTabView.value = TextListControl
        loadAbout()
    }
}

const isAvailableTab = (btnType) => {
    const isPlayHotSongBtn = (btnType === 0)
    const isPlayAllSongBtn = (btnType === 1)
    if (isPlayHotSongBtn) {
        if (isAllSongsTab()) return false
        else if (hasAllSongTab.value) return false
    } else if (isPlayAllSongBtn) {
        if (isHotSongsTab()) return false
        else if (hasHotSongTab.value) return false
    }
    return true
}

const resetBack2TopBtn = () => {
    if (!back2TopBtnRef.value) return
    back2TopBtnRef.value.setScrollTarget(artistDetailRef.value)
}

const resetScrollState = () => {
    markScrollTop = 0
    if (!artistDetailRef.value) return
    artistDetailRef.value.scrollTop = markScrollTop
}

const markScrollState = () => {
    if (!artistDetailRef.value) return
    markScrollTop = artistDetailRef.value.scrollTop
}

const restoreScrollState = () => {
    //EventBus.emit("imageTextTiles-update")
    if (markScrollTop < 1) return
    if (!artistDetailRef.value) return
    artistDetailRef.value.scrollTop = markScrollTop
}

const resetPagination = () => {
    offset = 0
    page = 1
}

const reloadAll = () => {
    resetTabView()
    currentTabView.value = SongListControl

    setLoadingDetail(true)
    setLoadingSongs(true)
    resetBack2TopBtn()
    resetAll()
    loadAll()
}

const loadAll = async () => {
    resetPagination()
    resetScrollState()
    await getArtistDetail()
    visitTab(0)
}

/* 生命周期、监听 */
//TODO 需要梳理优化，容易出现重复加载Bug
onActivated(() => {
    restoreScrollState()
})
watch([platform, artistId], reloadAll, { immediate: true })
</script>

<template>
    <div id="artist-detail-view" ref="artistDetailRef" @scroll="onScroll">
        <div class="header">
            <div>
                <img class="cover" v-lazy="artistCover" />
            </div>
            <div class="right" v-show="!isLoading">
                <div class="title" v-html="artistName"></div>
                <div class="alias" v-html="artistAlias"></div>
                <div class="action">
                    <PlayAddAllBtn :leftAction="playHotSongs" :rightAction="() => addHotSongs()" v-show="isAvailableTab(0)"
                        text="播放热门歌曲" class="spacing"></PlayAddAllBtn>
                    <PlayAddAllBtn text="播放歌曲" :leftAction="playAllSongs" :rightAction="() => addAllSongs()"
                        v-show="isAvailableTab(1)" class="spacing"></PlayAddAllBtn>
                    <FavoriteShareBtn :favorited="follow" actionText="关注" :leftAction="toggleFollow" class="spacing">
                    </FavoriteShareBtn>
                </div>
            </div>
            <div class="right" v-show="isLoading">
                <div class="title" v-show="isLoadingDetail">
                    <div class="loading-mask" style="width: 36%; height: 39px; display: inline-block;"></div>
                </div>
                <div class="title" v-html="artistName" v-show="!isLoadingDetail"></div>
                <div class="action" v-show="isLoadingDetail">
                    <div class="loading-mask spacing" v-for="i in 2"
                        style="width: 168px; height: 36px; display: inline-block;"></div>
                </div>
                <div class="action" v-show="!isLoadingDetail">
                    <PlayAddAllBtn :leftAction="playHotSongs" :rightAction="() => addHotSongs()" v-show="isAvailableTab(0)"
                        text="播放热门歌曲" class="spacing"></PlayAddAllBtn>
                    <PlayAddAllBtn text="播放歌曲" :leftAction="playAllSongs" :rightAction="() => addAllSongs()"
                        v-show="isAvailableTab(1)" class="spacing"></PlayAddAllBtn>
                    <FavoriteShareBtn :favorited="follow" actionText="关注" :leftAction="toggleFollow" class="spacing">
                    </FavoriteShareBtn>
                </div>
            </div>
        </div>
        <div class="center">
            <div class="tab-nav">
                <span class="tab" :class="{ active: activeTab == index }" v-for="(tab, index) in tabs"
                    @click="visitTab(index, true)" v-html="tab.name">
                </span>
                <span class="tab-tip" v-html="tabTipText"></span>
            </div>
            <component :is="currentTabView" :data="tabData" :platform="platform" :artistVisitable="true"
                :albumVisitable="true" :loading="isLoading">
            </component>
        </div>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style scoped>
#artist-detail-view {
    display: flex;
    flex-direction: column;
    padding: 25px 33px 15px 33px;
    flex: 1;
    overflow: scroll;
    overflow-x: hidden;
}

#artist-detail-view .header {
    display: flex;
    flex-direction: row;
    margin-bottom: 20px;
}

#artist-detail-view .header .right {
    flex: 1;
    margin-left: 30px;
}

#artist-detail-view .header .title {
    text-align: left;
    margin-top: 5px;
    margin-bottom: 20px;
    margin-bottom: 39px;
    /*font-size: 30px;*/
    font-size: var(--text-main-title-size);
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

#artist-detail-view .header .alias {
    display: none;
}

#artist-detail-view .header .cover {
    width: 233px;
    height: 233px;
    border-radius: 10rem;
    box-shadow: 0px 0px 1px #161616;
}

#artist-detail-view .action {
    display: flex;
    flex-direction: row;
}

#artist-detail-view .spacing {
    margin-right: 20px;
}

#artist-detail-view .tab-nav {
    position: relative;
    display: flex;
    height: 30px;
    margin-bottom: 3px;
    border-bottom: 1px solid var(--border-color);
}

#artist-detail-view .tab {
    font-size: var(--tab-title-text-size);
    padding-left: 6px;
    padding-right: 6px;
    margin-right: 15px;
    border-bottom: 3px solid transparent;
    cursor: pointer;
}

#artist-detail-view .tab-tip {
    position: absolute;
    right: 10px;
    /*font-size: 16px;
    font-size: var(--text-sub-size);*/
    background: linear-gradient(to top right, #1ca388, #28c83f);
    background: var(--hl-text-bg);
    -webkit-background-clip: text;
    color: transparent;
}

#artist-detail-view .tab-nav .active {
    border-color: #28c83f;
    border-color: var(--hl-color);
}

#artist-detail-view .songlist {
    display: flex;
    flex-direction: column;
}
</style>