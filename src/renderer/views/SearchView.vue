<script setup>
import { computed, onActivated, onMounted, ref, shallowRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useSearchStore } from '../store/searchStore';
import AlbumListControl from '../components/AlbumListControl.vue';
import ArtistListControl from '../components/ArtistListControl.vue';
import SongListControl from '../components/SongListControl.vue';
import PlaylistsControl from '../components/PlaylistsControl.vue';
import { useAppCommonStore } from '../store/appCommonStore';
import EventBus from '../../common/EventBus';
import { usePlatformStore } from '../store/platformStore';



const props = defineProps({
    keyword: String
})

const { platforms, tabs, activeTab,
    currentPlatformIndex, tabTipText
} = storeToRefs(useSearchStore())
const { setActiveTab,
    setCurrentPlatformIndex,
    updateTabTipText,
    isSongsTab,
    isPlaylistsTab,
    isAlbumsTab,
    isArtistsTab,
    isVideosTab,
    currentVender,
    currentPlatform
} = useSearchStore()
const { hideAllCtxMenus } = useAppCommonStore()
const { isKuGou, isLocalMusic } = usePlatformStore()


const currentTabView = shallowRef(null)
const tabData = ref([])
let offset = 0, limit = 50, page = 1
const isLoading = ref(false)
const videoStyle = ref(false)
const setVideoStyle = (value) => videoStyle.value = value


const setLoading = (value) => {
    isLoading.value = value
}

const visitTab = (index, force) => {
    if (!force && (index < 0 || activeTab.value == index)) return
    setActiveTab(index)
    loadTab()
}

const updateTabData = (data) => {
    tabData.value.length = 0
    tabData.value.push(...data)
    updateTabTipText(tabData.value.length)
}

const loadSongs = async () => {
    currentTabView.value = SongListControl
    setLoading(true)
    const vendor = currentVender()
    if (!vendor || !vendor.searchSongs) return
    let result = null, retry = 1
    do {
        result = await vendor.searchSongs(props.keyword, offset, limit, page)
    } while (!result && retry++ <= 3)
    if (!isSongsTab() || !result) return
    if (currentPlatform() != result.platform) return
    updateTabData(result.data)
    setLoading(false)
}

const loadPlaylists = async () => {
    currentTabView.value = PlaylistsControl
    setLoading(true)
    const vendor = currentVender()
    if (!vendor || !vendor.searchPlaylists) return
    let result = null, retry = 1
    do {
        result = await vendor.searchPlaylists(props.keyword, offset, limit, page)
    } while (!result && retry++ <= 3)
    if (!isPlaylistsTab() || !result) return
    if (currentPlatform() != result.platform) return
    updateTabData(result.data)
    setLoading(false)
}

const loadAlbums = async () => {
    currentTabView.value = AlbumListControl
    setLoading(true)
    const vendor = currentVender()
    if (!vendor || !vendor.searchAlbums) return
    let result = null, retry = 1
    do {
        result = await vendor.searchAlbums(props.keyword, offset, limit, page)
    } while (!result && retry++ <= 3)
    if (!isAlbumsTab() || !result) return
    if (currentPlatform() != result.platform) return
    updateTabData(result.data)
    setLoading(false)
}

const loadArtists = async () => {
    currentTabView.value = ArtistListControl
    setLoading(true)
    const vendor = currentVender()
    if (!vendor || !vendor.searchArtists) return
    let result = null, retry = 1
    do {
        result = await vendor.searchArtists(props.keyword, offset, limit, page)
    } while (!result && retry++ <= 3)
    if (!isArtistsTab() || !result) return
    if (currentPlatform() != result.platform) return
    updateTabData(result.data)
    setLoading(false)
}

const loadVideos = async () => {
    currentTabView.value = PlaylistsControl
    setVideoStyle(true)
    setLoading(true)
    const vendor = currentVender()
    if (!vendor || !vendor.searchVideos) return
    let result = null, retry = 1
    do {
        result = await vendor.searchVideos(props.keyword, offset, limit, page)
    } while (!result && retry++ <= 3)
    if (!isVideosTab() || !result) return
    if (currentPlatform() != result.platform) return
    updateTabData(result.data)
    setLoading(false)
}

const resetTabView = () => {
    currentTabView.value = null
    tabData.value.length = 0
    updateTabTipText(0)
    resetScrollState()
    setVideoStyle(false)
}

const loadTab = () => {
    setLoading(true)
    resetTabView()

    //不支持歌手
    if (isKuGou(currentPlatform()) && isArtistsTab()) {
        setActiveTab(0)
    }
    //不支持视频
    if (isLocalMusic(currentPlatform()) && isVideosTab()) {
        setActiveTab(0)
    }

    if (isSongsTab()) {
        loadSongs()
    } else if (isPlaylistsTab()) {
        loadPlaylists()
    } else if (isAlbumsTab()) {
        loadAlbums()
    } else if (isArtistsTab()) {
        loadArtists()
    } else if (isVideosTab()) {
        loadVideos()
    }
}

const byPlatform = (index) => {
    setCurrentPlatformIndex(index)
}

let markScrollTop = 0
const searchViewRef = ref(null)

//TODO
const onScroll = () => {
    hideAllCtxMenus()
    markScrollState()
}

const markScrollState = () => {
    if (searchViewRef.value) markScrollTop = searchViewRef.value.scrollTop
}

const resetScrollState = () => {
    markScrollTop = 0
    if (searchViewRef.value) searchViewRef.value.scrollTop = markScrollTop
    //resetFlowBtns()
}

const restoreScrollState = () => {
    //EventBus.emit("imageTextTiles-update")
    if (markScrollTop < 1) return
    if (searchViewRef.value) searchViewRef.value.scrollTop = markScrollTop
}


const computedTabShow = computed(() => {
    return (index) => {
        if (isKuGou(currentPlatform()) && index == 3) return false
        if (isLocalMusic(currentPlatform()) && index == 4) return false
        return true
    }
})

EventBus.on('modules-toggleSearchPlatform', () => visitTab(0, true))

onMounted(() => visitTab(0, true))
onActivated(() => {
    restoreScrollState()
})

watch(currentPlatformIndex, (nv, ov) => loadTab())
watch(activeTab, (nv, ov) => visitTab(nv))
watch(() => props.keyword, (nv, ov) => loadTab())
</script>

<template>
    <div id="search-view" ref="searchViewRef" @scroll="onScroll">
        <div class="header">
            <div class="keyword">
                <b>搜 </b><span class="text content-text-highlight">{{ keyword }}</span>
            </div>
            <div class="platform">
                <span class="item" :class="{ active: currentPlatformIndex == index }" v-for="(item, index) in platforms"
                    @click="byPlatform(index)" v-html="item.name">
                </span>
            </div>
        </div>
        <div class="center">
            <div class="tab-nav">
                <span class="tab" :class="{ active: activeTab == index, 'content-text-highlight': activeTab == index }"
                    v-for="(tab, index) in tabs" @click="visitTab(index)" v-html="tab.name" v-show="computedTabShow(index)">
                </span>
                <span class="tab-tip content-text-highlight" v-html="tabTipText"></span>
            </div>
            <component :is="currentTabView" :data="tabData" :artistVisitable="true" :albumVisitable="true"
                :loading="isLoading" :videoStyle="videoStyle">
            </component>
        </div>
    </div>
</template>

<style>
#search-view {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 20px 33px 15px 33px;
    overflow: scroll;
    overflow-x: hidden;
}

#search-view .header {
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;
}

#search-view .keyword {
    text-align: left;
    display: flex;
    font-size: 28px;
    font-weight: bold;
    line-height: 36px;
}

#search-view .keyword b {
    margin-right: 12px;
}

#search-view .keyword .text {


    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}

#search-view .platform {
    margin-top: 20px;
    margin-bottom: 6px;
    text-align: left;
}

#search-view .platform .item {
    margin-right: 20px;
    border-radius: 10rem;
    padding: 8px 18px;
    /* border: 1px solid var(--border-color); */
    cursor: pointer;
}

#search-view .platform .item:hover {
    color: var(--content-text-color);
    background: var(--content-list-item-hover-bg-color);
}

#search-view .platform .active {
    border-color: var(--content-highlight-color);
    /* background: var(--content-text-highlight-color) !important;
    color: var(--button-icon-text-btn-icon-color) !important; */
    background: var(--button-icon-text-btn-bg-color) !important;
    color: var(--button-icon-text-btn-icon-color) !important;
}

#search-view .tab-nav {
    display: flex;
    position: relative;
    height: 33px;
    margin-bottom: 3px;
    border-bottom: 1px solid var(--border-color);
    border-bottom: 1px solid transparent;
}

#search-view .tab {
    font-size: var(--content-text-tab-title-size);
    padding-left: 12px;
    padding-right: 12px;
    margin-right: 15px;
    border-bottom: 3px solid transparent;
    cursor: pointer;
}

#search-view .tab-nav .active {
    font-weight: bold;
    border-color: var(--content-highlight-color);
}

#search-view .tab-nav .tab-tip {
    position: absolute;
    right: 10px;
    font-weight: bold;
}
</style>