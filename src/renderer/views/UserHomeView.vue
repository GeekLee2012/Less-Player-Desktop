<script setup>
import { onActivated, ref, shallowRef, watch, reactive, inject, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useUserProfileStore } from '../store/userProfileStore';
import { useRecentsStore } from '../store/recentsStore';
import { usePlatformStore } from '../store/platformStore';
import { usePlayStore } from '../store/playStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';
import EventBus from '../../common/EventBus';
import AlbumListControl from '../components/AlbumListControl.vue';
import PlayAddAllBtn from '../components/PlayAddAllBtn.vue';
import SongListControl from '../components/SongListControl.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import CreatePlaylistBtn from '../components/CreatePlaylistBtn.vue';
import PlaylistsControl from '../components/PlaylistsControl.vue';
import CustomPlaylistListControl from '../components/CustomPlaylistListControl.vue';
import ArtistListControl from '../components/ArtistListControl.vue';
import BatchActionBtn from '../components/BatchActionBtn.vue';
import { coverDefault } from '../../common/Utils';




const { currentRoutePath, visitCommonRoute,
    visitUserInfoEdit, visitCustomPlaylistCreate } = inject('appRoute')
const { showConfirm } = inject('appCommon')

const tabs = [{
    code: 'favorites',
    name: '我的收藏',
    text: '',
    hasSubTabs: true
},
{
    code: 'custom-playlist',
    name: '创建的歌单',
    text: '共0个歌单',
    hasSubTabs: false
},
{
    code: 'favorite-artists',
    name: '关注的歌手',
    text: '共0个歌手',
    hasSubTabs: false
},
{
    code: 'recents',
    name: '最近播放',
    text: '',
    hasSubTabs: true
}]

const { currentPlatformCode } = storeToRefs(usePlatformStore())
const { updateCurrentPlatform, getPreferTypeTabs,
    isAllSongsTab, isPlaylistsTab, isAlbumsTab, isFMRadiosTab, } = usePlatformStore()
const { addTracks, playNextTrack, resetQueue } = usePlayStore()
const { playingViewShow, isUserHomeMode, routerCtxCacheItem } = storeToRefs(useAppCommonStore())
const { showToast, hideAllCtxMenus } = useAppCommonStore()
const { getFavoriteSongs, getFavoritePlaylilsts,
    getFavoriteAlbums, getFavoriteRadios,
    getCustomPlaylists, getFollowArtists,
    decoration, getUserCover,
    getUserNickName, getUserAbout } = storeToRefs(useUserProfileStore())
const { removeAllFavorites, nextDecoration } = useUserProfileStore()
const { getRecentSongs, getRecentPlaylilsts,
    getRecentAlbums, getRecentRadios } = storeToRefs(useRecentsStore())
const { removeAllRecents } = useRecentsStore()
const { isShowDialogBeforeClearRecents } = storeToRefs(useSettingStore())

const typeTabs = getPreferTypeTabs()

const currentTabView = shallowRef(null)
const tabData = reactive([])
const tabTipText = ref("")
let offset = 0, page = 1, limit = 30
let markScrollTop = 0
const loading = ref(false)
const activeTab = ref(0)
const activeSubTab = ref(0)
const subTabShow = ref(true)
const subTabTipText = ref("")
let isDiffTab = true
const dataType = ref(2)
const userProfileRef = ref(null)
const back2TopBtnRef = ref(null)

const visitTab = (index) => {
    if (loading.value) return
    isDiffTab = (activeTab.value != index)
    setActiveTab(index)
    switchTab()
}

const playAllSongs = () => {
    if (tabData.length < 1) return
    resetQueue()
    addAllSongs("即将为您播放全部")
    playNextTrack()
}

const addAllSongs = (text) => {
    if (tabData.length < 1) return
    addTracks(tabData)
    showToast(text || "歌曲已全部添加")
}

const switchTab = () => {
    tabData.length = 0
    currentTabView.value = null
    const platform = currentPlatformCode.value
    if (activeTab.value == 1) {
        tabData.push(...getCustomPlaylists.value)
        currentTabView.value = CustomPlaylistListControl
    } else if (activeTab.value == 2) {
        tabData.push(...getFollowArtists.value(platform))
        currentTabView.value = ArtistListControl
    }
    //TODO
    tabTipText.value = tabs[activeTab.value].text.replace('0', tabData.length)

    //子标签页
    subTabTipText.value = ""
    if (subTabShow.value) visitSubTab(activeSubTab.value)
}

const setActiveTab = (index) => {
    activeTab.value = index
    subTabShow.value = tabs[activeTab.value].hasSubTabs
    if (isDiffTab) activeSubTab.value = 0
    dataType.value = (index == 3) ? 5 : 2
}

const visitSubTab = (index) => {
    if (loading.value) return
    setActiveSubTab(index)
    switchSubTab()
}

const setActiveSubTab = (index) => {
    activeSubTab.value = index
}

const switchSubTab = () => {
    tabData.length = 0
    currentTabView.value = null
    subTabTipText.value = ""
    const platform = currentPlatformCode.value
    const { code: typeCode } = typeTabs[activeSubTab.value]
    if (isAllSongsTab(typeCode)) {
        if (activeTab.value == 0) tabData.push(...getFavoriteSongs.value(platform))
        if (activeTab.value == 3) tabData.push(...getRecentSongs.value(platform))
        currentTabView.value = SongListControl
    } else if (isPlaylistsTab(typeCode)) {
        if (activeTab.value == 0) tabData.push(...getFavoritePlaylilsts.value(platform))
        if (activeTab.value == 3) tabData.push(...getRecentPlaylilsts.value(platform))
        currentTabView.value = PlaylistsControl
    } else if (isAlbumsTab(typeCode)) {
        if (activeTab.value == 0) tabData.push(...getFavoriteAlbums.value(platform))
        if (activeTab.value == 3) tabData.push(...getRecentAlbums.value(platform))
        currentTabView.value = AlbumListControl
    } else if (isFMRadiosTab(typeCode)) {
        if (activeTab.value == 0) tabData.push(...getFavoriteRadios.value(platform))
        if (activeTab.value == 3) tabData.push(...getRecentRadios.value(platform))
        currentTabView.value = PlaylistsControl
    }
    subTabTipText.value = typeTabs[activeSubTab.value].text.replace('0', tabData.length)
    //TODO 偷下懒
    tabTipText.value = subTabTipText.value
}

const visitBatchActionView = () => {
    const source = tabs[activeTab.value].code
    visitCommonRoute(`/userhome/batch/${source}/0`)
}

const batchRemoveAll = async () => {
    const index = activeTab.value
    //if(index == 0) clearFavorites()
    if (index == 3) {
        let ok = true
        if (isShowDialogBeforeClearRecents.value) ok = await showConfirm({ msg: '确定要清空最近播放吗？' })
        if (!ok) return
        clearRecents()
    }
}

//TODO
const clearAll = () => {
    ["userProfile", "user", "profile"].forEach(key => localStorage.removeItem(key))
    const store = useUserProfileStore()
    const { nickname, about, cover } = store.user
    store.$reset()
    EventBus.emit("userProfile-reset")
    visitTab(0)
    showToast("全部数据已清空")
    //updateUser(nickname, about, cover)
    store.$patch({ user: { nickname, about, cover } })
}

const clearFavorites = () => {
    removeAllFavorites()
    showToast("我的收藏已清空")
}

const clearRecents = () => {
    removeAllRecents()
    showToast("最近播放已清空")
}

const refresh = () => {
    visitTab(activeTab.value)
    //TODO
    //cleanUpAllSongs()
}

const isAvailableSongTab = () => {
    if (tabData.length < 1) return false
    const tabIndex = activeTab.value
    const subTabIndex = activeSubTab.value
    return subTabIndex == 0 && (tabIndex == 0 || tabIndex == -1)
}

const resetBack2TopBtn = () => {
    if (back2TopBtnRef.value) {
        back2TopBtnRef.value.setScrollTarget(userProfileRef.value)
    }
}

const markScrollState = () => {
    if (!userProfileRef.value) return
    markScrollTop = userProfileRef.value.scrollTop
}

const restoreScrollState = () => {

    if (!userProfileRef.value) return
    if (markScrollTop < 1) return
    userProfileRef.value.scrollTop = markScrollTop
}

const scrollToLoad = () => {
    markScrollState()
    hideAllCtxMenus()
}

//TODO
const onScroll = () => {
    scrollToLoad()
}

const dataListId = computed(() => {
    return activeTab.value + '-' + (activeSubTab.value || 0)
})


const visitRecentsTab = () => visitTab(3)

const visitRouterCtxCacheItem = () => {
    if (!routerCtxCacheItem.value) return
    const { id } = routerCtxCacheItem.value
    if (id == 'visitRecents') visitRecentsTab()
}

/* 生命周期、监听 */
onActivated(() => {
    resetBack2TopBtn()
    restoreScrollState()

    refresh()
    visitRouterCtxCacheItem()
})

watch(playingViewShow, (nv, ov) => {
    if (!nv) refresh()
})

watch(currentPlatformCode, (nv, ov) => {
    const path = currentRoutePath()
    if (!isUserHomeMode.value && path.includes("/batch/")) return
    refresh()
})

EventBus.on("userHome-refresh", refresh)
EventBus.on("userHome-visitRecentsTab", visitRecentsTab)
</script>
    
<template>
    <div id="user-profile-view" ref="userProfileRef" @scroll="onScroll">
        <div class="decoration">
            <img :src="`deco_${decoration.current}.png`" @click="nextDecoration" />
        </div>
        <div class="header">
            <div>
                <img class="cover" v-lazy="coverDefault(getUserCover)" />
            </div>
            <div class="right">
                <div class="titleWrap">
                    <div @click="visitUserInfoEdit">
                        <svg width="18" height="18" viewBox="0 0 992.3 992.23" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M428.27,992.13c-88.16,0-176.32.28-264.48-.1-56.56-.24-101.65-23.86-134.6-69.78A150.76,150.76,0,0,1,.34,833.37C0,743.21.19,653.05.18,562.89c0-88-.5-176,.17-264C.82,236.36,29,188.83,82.63,156.81c25.32-15.11,53.25-21.18,82.69-21.15q161,.15,322,.06c26.66,0,45.78,15.33,50.38,40,5,26.58-15,53-41.88,55.53-3.31.31-6.66.42-10,.42q-159.75,0-319.49-.06c-25.45,0-45.64,9.41-59.78,30.75-7.47,11.29-10.42,23.92-10.41,37.45q.09,229.23,0,458.47,0,35.25,0,70.5c.06,38.34,29,67.32,67.42,67.33q264.74,0,529.47,0c38.53,0,67.21-28.52,67.44-67.25.21-32.66.05-65.33.05-98q0-112.74,0-225.49c0-19.14,7-34.41,23.5-44.58,30.3-18.63,70.25,2.33,72.32,37.83.13,2.17.21,4.33.21,6.5q0,161.24,0,322.48c0,47.47-16.82,87.91-51.29,120.5-30,28.4-66.18,43.56-107.53,43.81-89.83.52-179.66.16-269.49.16Z" />
                                    <path
                                        d="M417,473.1c1.08-20.29,2.1-40.59,3.27-60.88a46.93,46.93,0,0,1,11.63-28.62c1.74-2,3.64-3.89,5.53-5.78L798.28,16.91c22.51-22.5,50.7-22.57,73.22-.07q52.15,52.11,104.27,104.27c22,22,22.06,50.57.07,72.54Q794.42,374.91,613,556.14c-10.34,10.34-22.49,15.36-37,16.06q-50.93,2.47-101.8,5.69c-14.62.91-28.69.35-40.88-9.11-12.48-9.69-19.48-22.41-19.12-38.27.43-19.15,1.73-38.28,2.65-57.41Zm95.78,6.38c13.28-.76,25.7-1.6,38.15-2.09a12.52,12.52,0,0,0,9.12-4q156.09-156.07,312.3-312c1.26-1.26,2.43-2.58,3.23-3.43l-41.31-41.26-72.48,72.49Q640.15,310.8,518.56,432.44c-1.44,1.45-3.22,3.37-3.35,5.18C514.19,451.23,513.55,464.86,512.74,479.48Z" />
                                </g>
                            </g>
                        </svg>
                    </div>
                    <div class="title" v-html="getUserNickName"></div>
                </div>
                <div class="about" v-html="getUserAbout"></div>
                <div class="action">
                    <PlayAddAllBtn v-show="isAvailableSongTab()" class="spacing" :leftAction="playAllSongs"
                        :rightAction="addAllSongs">
                    </PlayAddAllBtn>
                    <CreatePlaylistBtn :leftAction="visitCustomPlaylistCreate" class="spacing">
                    </CreatePlaylistBtn>
                    <BatchActionBtn v-show="activeTab == 0 || activeTab == 3" class="spacing" :deleteBtn="activeTab == 3"
                        :leftAction="visitBatchActionView" :rightAction="batchRemoveAll">
                    </BatchActionBtn>
                </div>
            </div>
        </div>
        <div class="center">
            <div class="tab-nav">
                <span class="tab" v-for="(tab, index) in tabs"
                    :class="{ active: activeTab == index, 'content-text-highlight': activeTab == index }"
                    @click="visitTab(index)" v-html="tab.name">
                </span>
                <span class="tab-tip content-text-highlight" v-html="tabTipText"></span>
            </div>
            <div class="sub-tab-nav" v-show="subTabShow">
                <span class="sub-tab" v-for="(tab, index) in typeTabs"
                    :class="{ active: activeSubTab == index, 'content-text-highlight': activeSubTab == index }"
                    @click="visitSubTab(index)" v-html="tab.name">
                </span>
                <span class="tip-text" v-show="false">暂不支持本地歌曲</span>
            </div>
            <component :is="currentTabView" :data="tabData" :artistVisitable="true" :albumVisitable="true"
                :dataType="dataType" :id="dataListId">
            </component>
            <div v-show="loading">
                <div class="loading-mask" v-for="i in 12"
                    style="width: 100%;  height: 36px; margin-bottom: 5px; display: inline-block;"></div>
            </div>
        </div>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>
    
<style scoped>
#user-profile-view {
    display: flex;
    flex-direction: column;
    padding: 20px 33px 15px 33px;
    flex: 1;
    overflow: scroll;
    overflow-x: hidden;
    position: relative;
}

#user-profile-view .header {
    display: flex;
    flex-direction: row;
    margin-bottom: 20px;
}

#user-profile-view .header .right {
    flex: 1;
    margin-left: 20px;
}

#user-profile-view .header .titleWrap {
    margin-top: 5px;
    margin-bottom: 10px;
    display: flex;
    flex-direction: row;
    align-items: center;
}

#user-profile-view .header .titleWrap svg {
    fill: var(--button-icon-btn-color);
    cursor: pointer;
}

#user-profile-view .header .titleWrap svg:hover {
    fill: var(--content-highlight-color);
}

#user-profile-view .header .title {
    text-align: left;
    /*font-size: 30px;*/
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
    margin-left: 10px;
    overflow: hidden;
    word-wrap: break-all;
    white-space: pre-wrap;
    line-break: anywhere;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
}

#user-profile-view .header .about {
    text-align: left;
    min-height: 80px;
    margin-bottom: 15px;
    line-height: var(--content-text-line-height);
    font-size: var(--content-text-subtitle-size);
    color: var(--content-subtitle-text-color);
    overflow: hidden;
    word-wrap: break-all;
    white-space: pre-wrap;
    line-break: anywhere;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
}

#user-profile-view .header .cover {
    width: 202px;
    height: 202px;
    border-radius: 10rem;
    box-shadow: 0px 0px 1px #161616;
}

#user-profile-view .action {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
}

#user-profile-view .spacing {
    margin-right: 20px;
    margin-bottom: 10px;
}

#user-profile-view .tab-nav {
    position: relative;
    display: flex;
    height: 36px;
    margin-bottom: 8px;
    margin-left: 2px;
    border-bottom: 1px solid transparent;
}

#user-profile-view .tab {
    font-size: var(--content-text-tab-title-size);
    /*padding-left: 10px;
    padding-right: 10px;
    margin-right: 15px;
    */
    margin-right: 36px;
    border-bottom: 3px solid transparent;
    cursor: pointer;
}

#user-profile-view .tab-tip {
    position: absolute;
    right: 10px;
    font-weight: bold;
}

#user-profile-view .tab-nav .active {
    font-weight: bold;
    border-color: var(--content-highlight-color);
}

#user-profile-view .sub-tab-nav {
    position: relative;
    display: flex;
    height: 20px;
    margin: 12px 0px 6px 2px;
}

#user-profile-view .sub-tab {
    /*font-size: 14px;*/
    font-size: var(--content-text-subtitle-size);
    font-weight: 520;
    /*padding-left: 6px;
    padding-right: 6px;
    margin-right: 15px;*/
    margin-right: 30px;
    cursor: pointer;
}

#user-profile-view .sub-tab-nav .active {
    /*color: var(--content-highlight-color);*/
    font-weight: bold;
}

#user-profile-view .sub-tab-nav .tip-text {
    position: absolute;
    right: 0px;
    display: flex;
    align-items: center;
    justify-content: center;
}

#user-profile-view .songlist {
    display: flex;
    flex-direction: column;
}

#user-profile-view .decoration {
    position: absolute;
    top: 5px;
    right: 10px;
    z-index: 3px;
}

#user-profile-view .decoration img {
    width: 68px;
    height: 68px;
    cursor: pointer;
}
</style>