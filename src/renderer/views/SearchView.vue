<script setup>
import { computed, inject, onActivated, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useSearchStore } from '../store/searchStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { usePlatformStore } from '../store/platformStore';
import AlbumListControl from '../components/AlbumListControl.vue';
import ArtistListControl from '../components/ArtistListControl.vue';
import SongListControl from '../components/SongListControl.vue';
import PlaylistsControl from '../components/PlaylistsControl.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import { LESS_MAGIC_CODE } from '../../common/Constants';
import { toTrimString } from '../../common/Utils';
import { onEvents, emitEvents, offEvents } from '../../common/EventBusWrapper';




const props = defineProps({
    keyword: String
})

const { platforms, tabs, activeTab, activeTabCode,
    currentPlatformIndex, tabTipText
} = storeToRefs(useSearchStore())
const { setActiveTab,
    setCurrentPlatformIndex,
    updateTabTipText,
    currentVender,
    currentPlatform,
    updateTabs,
    getTabIndex,
} = useSearchStore()
const { togglePlatformCategoryView, hideAllCtxMenus, hidePlaybackQueueView } = useAppCommonStore()
const { isLocalMusic, isAllSongsTab, isPlaylistsTab, isAlbumsTab, isArtistsTab, isVideosTab, } = usePlatformStore()


const currentTabView = shallowRef(null)
const tabData = ref([])
let offset = 0, limit = 50, page = 1
const isLoading = ref(false)
const videoStyle = ref(false)
const setVideoStyle = (value) => videoStyle.value = value
const setLoading = (value) => isLoading.value = value
const back2TopBtnRef = ref(null)


const computedKeyword = computed(() => {
    //忽略魔法字符
    return (toTrimString(props.keyword) == LESS_MAGIC_CODE) ? '' : props.keyword
})

const visitTab = (index, code, force) => {
    if (!force && (index < 0 || activeTab.value == index)) return
    setActiveTab(index, code)
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
    if (!isAllSongsTab(activeTabCode.value) || !result) return
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
    if (!isPlaylistsTab(activeTabCode.value) || !result) return
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
    if (!isAlbumsTab(activeTabCode.value) || !result) return
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
    if (!isArtistsTab(activeTabCode.value) || !result) return
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
    if (!isVideosTab(activeTabCode.value) || !result) return
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
    resetTabView()
    if (!computedKeyword.value) return
    setLoading(true)

    const code = activeTabCode.value
    if (isAllSongsTab(code)) {
        loadSongs()
    } else if (isPlaylistsTab(code)) {
        loadPlaylists()
    } else if (isAlbumsTab(code)) {
        loadAlbums()
    } else if (isArtistsTab(code)) {
        loadArtists()
    } else if (isVideosTab(code)) {
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
    //emitEvents("imageTextTiles-update")
    if (markScrollTop < 1) return
    if (searchViewRef.value) searchViewRef.value.scrollTop = markScrollTop
}

const resetBack2TopBtn = () => {
    if (back2TopBtnRef.value) {
        back2TopBtnRef.value.setScrollTarget(searchViewRef.value)
    }
}

const togglePlatformCategory = () => {
    hidePlaybackQueueView()
    togglePlatformCategoryView()
}


/* 生命周期、监听 */
watch(currentPlatformIndex, (nv, ov) => {
    updateTabs()

    //tabs被更新，需要重新检查index、code是否匹配
    const index = activeTab
    const code = activeTabCode.value
    const _index = getTabIndex(code)
    if (_index == -1) return resetTabView()
    if (_index != index) setActiveTab(_index, code)

    loadTab()
})
watch(activeTab, (nv, ov) => visitTab(nv))
watch(() => props.keyword, (nv, ov) => {
    loadTab()
})

const eventsRegistration = {
    'modules-toggleSearchPlatform': () => visitTab(0, null, true),
}
onMounted(() => {
    onEvents(eventsRegistration)
    updateTabs()
    visitTab(0, null, true)
})

onActivated(() => {
    restoreScrollState()
    resetBack2TopBtn()
})

onUnmounted(() => offEvents(eventsRegistration))
</script>

<template>
    <div id="search-view" ref="searchViewRef" @scroll="onScroll">
        <div class="header">
            <div class="keyword">
                <b>搜 </b><span class="text content-text-highlight">{{ computedKeyword }}</span>
            </div>
            <div class="platform">
                <span class="more-platform-btn">
                    <svg @click.stop="togglePlatformCategory" width="17" height="17" viewBox="0 0 29.3 29.3">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M23.51,15.66H17.3a1.55,1.55,0,0,0-.56.11,1.45,1.45,0,0,0-1.11,1.41v6.38a5.77,5.77,0,0,0,5.76,5.76h2.16a5.76,5.76,0,0,0,5.75-5.76V21.41a5.76,5.76,0,0,0-5.77-5.75Zm2.85,7.91a2.86,2.86,0,0,1-2.85,2.86H21.35a2.86,2.86,0,0,1-2.85-2.86v-5h5a2.86,2.86,0,0,1,2.85,2.86ZM12.52,15.76a1.55,1.55,0,0,0-.56-.11H5.75A5.76,5.76,0,0,0,0,21.41v2.15a5.76,5.76,0,0,0,5.75,5.76H7.91a5.78,5.78,0,0,0,5.72-5.76V17.18A1.47,1.47,0,0,0,12.52,15.76Zm-1.76,7.8a2.86,2.86,0,0,1-2.85,2.86H5.75A2.86,2.86,0,0,1,2.9,23.56V21.41a2.86,2.86,0,0,1,2.85-2.86h5Zm-5-9.89H12a1.55,1.55,0,0,0,.56-.11,1.45,1.45,0,0,0,1.1-1.42V5.76A5.77,5.77,0,0,0,7.87,0H5.75A5.76,5.76,0,0,0,0,5.76V7.91a5.77,5.77,0,0,0,5.75,5.75ZM2.9,5.76A2.86,2.86,0,0,1,5.75,2.9H7.91a2.86,2.86,0,0,1,2.85,2.86v5h-5A2.86,2.86,0,0,1,2.91,7.9ZM23.51,0H21.35a5.78,5.78,0,0,0-5.72,5.76v6.38a1.45,1.45,0,0,0,1.15,1.42,1.55,1.55,0,0,0,.56.11h6.21A5.76,5.76,0,0,0,29.3,7.91V5.76A5.76,5.76,0,0,0,23.54,0Zm2.85,7.91a2.86,2.86,0,0,1-2.85,2.86h-5v-5a2.86,2.86,0,0,1,2.85-2.86h2.16a2.86,2.86,0,0,1,2.85,2.86Z" />
                            </g>
                        </g>
                    </svg>
                </span>
                <span class="item" :class="{ active: currentPlatformIndex == index }" v-for="(item, index) in platforms"
                    @click="byPlatform(index)" v-html="item.name">
                </span>
            </div>
        </div>
        <div class="center">
            <div class="tab-nav">
                <span class="tab" :class="{ active: activeTab == index, 'content-text-highlight': activeTab == index }"
                    v-for="(tab, index) in tabs" @click="visitTab(index, tab.code)" v-html="tab.name">
                </span>
                <span class="tab-tip content-text-highlight" v-html="tabTipText" v-show="tabs.length > 0"></span>
            </div>
            <component :is="currentTabView" :data="tabData" :artistVisitable="true" :albumVisitable="true"
                :isAlbumArtistSutitle="true" :loading="isLoading" :videoStyle="videoStyle">
            </component>
        </div>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
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
    margin-bottom: 16px;
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
    /*margin-top: 20px;*/
    margin-top: 13px;
    margin-left: 3px;
    text-align: left;
    height: 40px;
    /*display: flex;
    align-items: center;*/
    overflow: hidden;
    /*flex-wrap: wrap;*/
}

#search-view .platform .more-platform-btn {
    margin-right: 15px;
    line-height: 40px;
    display: inline-flex;
    align-items: center;
}

#search-view .platform .more-platform-btn svg {
    fill: var(--button-icon-btn-color);
    cursor: pointer;
    transform: translateY(3px);
}

#search-view .platform .more-platform-btn svg:hover {
    fill: var(--content-highlight-color);
}

#search-view .platform .item {
    /*margin-top: 10px;*/
    /*margin-right: 20px;*/
    margin-right: 15px;
    border-radius: 10rem;
    padding: 8px 18px;
    line-height: 40px;
    /* border: 1px solid var(--border-color); */
    cursor: pointer;
    white-space: nowrap;
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
    align-items: center;
    position: relative;
    height: 36px;
    margin-left: 2px;
    margin-bottom: 6px;
    border-bottom: 1px solid var(--border-color);
    border-bottom: 1px solid transparent;
}

#search-view .tab {
    font-size: var(--content-text-tab-title-size);
    /*padding-left: 12px;
    padding-right: 12px;
    margin-right: 15px;*/
    margin-right: 36px;
    padding-bottom: 5px;
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