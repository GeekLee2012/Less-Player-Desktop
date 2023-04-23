<script setup>
import { onActivated, onMounted, ref, shallowRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useSearchStore } from '../store/searchStore';
import AlbumListControl from '../components/AlbumListControl.vue';
import ArtistListControl from '../components/ArtistListControl.vue';
import SongListControl from '../components/SongListControl.vue';
import PlaylistsControl from '../components/PlaylistsControl.vue';
import { useAppCommonStore } from '../store/appCommonStore';



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
    currentVender,
    currentPlatform
} = useSearchStore()
const { hideAllCtxMenus } = useAppCommonStore()

const currentTabView = shallowRef(null)
const tabData = ref([])
let offset = 0, limit = 50, page = 1
const isLoading = ref(false)

const setLoading = (value) => {
    isLoading.value = value
}

const visitTab = (index) => {
    if (index < 0 || activeTab.value == index) return
    setActiveTab(index)
    loadTab()
}

const updateTabData = (data) => {
    tabData.value.length = 0
    tabData.value.push(...data)
    updateTabTipText(tabData.value.length)
}

const loadSongs = () => {
    currentTabView.value = SongListControl
    setLoading(true)
    const vendor = currentVender()
    if (!vendor || !vendor.searchSongs) return
    vendor.searchSongs(props.keyword, offset, limit, page).then(result => {
        if (!isSongsTab()) return
        if (currentPlatform() != result.platform) return
        updateTabData(result.data)
        setLoading(false)
    })
}

const loadPlaylists = () => {
    currentTabView.value = PlaylistsControl
    setLoading(true)
    const vendor = currentVender()
    if (!vendor || !vendor.searchPlaylists) return
    vendor.searchPlaylists(props.keyword, offset, limit, page).then(result => {
        if (!isPlaylistsTab()) return
        if (currentPlatform() != result.platform) return
        updateTabData(result.data)
        setLoading(false)
    })
}

const loadAlbums = () => {
    currentTabView.value = AlbumListControl
    setLoading(true)
    const vendor = currentVender()
    if (!vendor || !vendor.searchAlbums) return
    vendor.searchAlbums(props.keyword, offset, limit, page).then(result => {
        if (!isAlbumsTab()) return
        if (currentPlatform() != result.platform) return
        updateTabData(result.data)
        setLoading(false)
    })
}

const loadArtists = () => {
    currentTabView.value = ArtistListControl
    setLoading(true)
    const vendor = currentVender()
    if (!vendor || !vendor.searchArtists) return
    vendor.searchArtists(props.keyword, offset, limit, page).then(result => {
        if (!isArtistsTab()) return
        if (currentPlatform() != result.platform) return
        updateTabData(result.data)
        setLoading(false)
    })
}

const resetTabView = () => {
    currentTabView.value = null
    tabData.value.length = 0
    updateTabTipText(0)
}

const loadTab = () => {
    setLoading(true)
    resetTabView()
    if (isSongsTab()) {
        loadSongs()
    } else if (isPlaylistsTab()) {
        loadPlaylists()
    } else if (isAlbumsTab()) {
        loadAlbums()
    } else if (isArtistsTab()) {
        loadArtists()
    }
}

const byPlatform = (index) => {
    setCurrentPlatformIndex(index)
}

//TODO
const onScroll = () => {
    hideAllCtxMenus()
}

onActivated(() => visitTab(0))
watch(currentPlatformIndex, (nv, ov) => loadTab())
watch(activeTab, (nv, ov) => visitTab(nv))
watch(() => props.keyword, (nv, ov) => loadTab())
</script>

<template>
    <div id="search-view" @scroll="onScroll">
        <div class="header">
            <div class="keyword">
                <b>搜 </b><span class="text">{{ keyword }}</span>
            </div>
            <div class="platform">
                <span class="item" :class="{ active: currentPlatformIndex == index }" v-for="(item, index) in platforms"
                    @click="byPlatform(index)" v-html="item.name">
                </span>
            </div>
        </div>
        <div class="center">
            <div class="tab-nav">
                <span class="tab" :class="{ active: activeTab == index }" v-for="(tab, index) in tabs"
                    @click="visitTab(index)" v-html="tab.name">
                </span>
                <span class="tip" v-html="tabTipText"></span>
            </div>
            <component :is="currentTabView" :data="tabData" :artistVisitable="true" :albumVisitable="true"
                :loading="isLoading" ß>
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
    background: var(--hl-text-bg);
    background: var(--hl-color);
    -webkit-background-clip: text;
    color: transparent;

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
    padding: 6px 15px;
    /* border: 1px solid var(--border-color); */
    cursor: pointer;
}

#search-view .platform .item:hover {
    color: var(--text-color);
    background: var(--list-item-hover);
}

#search-view .platform .active {
    border-color: var(--hl-color);
    /* background: var(--hl-text-bg) !important;
    color: var(--svg-btn-color) !important; */
    background: var(--btn-bg) !important;
    color: var(--svg-btn-color) !important;
}

#search-view .tab-nav {
    display: flex;
    position: relative;
    height: 30px;
    margin-bottom: 3px;
    border-bottom: 1px solid var(--border-color);
}

#search-view .tab {
    font-size: 16px;
    padding-left: 6px;
    padding-right: 6px;
    margin-right: 15px;
    border-bottom: 2px solid transparent;
    cursor: pointer;
}

#search-view .tab-nav .active {
    border-color: var(--hl-color);
}

#search-view .tab-nav .tip {
    /* font-size: 15px; */
    position: absolute;
    right: 10px;

    /*background: var(--hl-text-bg);*/
    background: var(--btn-bg);
    background: var(--hl-color);
    -webkit-background-clip: text;
    color: transparent;
}
</style>