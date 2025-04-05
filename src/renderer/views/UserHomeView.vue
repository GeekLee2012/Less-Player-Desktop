<script setup>
import { onActivated, ref, shallowRef, watch, reactive, inject, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useUserProfileStore } from '../store/userProfileStore';
import { useRecentsStore } from '../store/recentsStore';
import { usePlatformStore } from '../store/platformStore';
import { usePlayStore } from '../store/playStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';
import AlbumListControl from '../components/AlbumListControl.vue';
import PlayAddAllBtn from '../components/PlayAddAllBtn.vue';
import SongListControl from '../components/SongListControl.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import CreatePlaylistBtn from '../components/CreatePlaylistBtn.vue';
import PlaylistsControl from '../components/PlaylistsControl.vue';
import CustomPlaylistListControl from '../components/CustomPlaylistListControl.vue';
import ArtistListControl from '../components/ArtistListControl.vue';
import BatchActionBtn from '../components/BatchActionBtn.vue';
import { coverDefault, isSupportedImage, randomTextWithinAlphabetNums } from '../../common/Utils';
import { onEvents, emitEvents, offEvents } from '../../common/EventBusWrapper';




const { currentRoutePath, visitCommonRoute,
    visitUserInfoEdit, visitCustomPlaylistCreate } = inject('appRoute')
const { showConfirm } = inject('apiExpose')

const tabs = [{
    code: 'favorites',
    name: '我的收藏',
    text: '',
    hasSubTabs: true
},
{
    code: 'custom-playlist',
    name: '创建的歌单',
    text: '0个歌单',
    hasSubTabs: false
},
{
    code: 'favorite-artists',
    name: '关注的歌手',
    text: '0个歌手',
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
const { removeAllFavorites, nextDecoration, resetDecoration, updateUser } = useUserProfileStore()
const { getRecentSongs, getRecentPlaylilsts,
    getRecentAlbums, getRecentRadios } = storeToRefs(useRecentsStore())
const { removeAllRecents } = useRecentsStore()
const { isShowDialogBeforeClearRecents, isSingleLineAlbumTitleStyle } = storeToRefs(useSettingStore())

const typeTabs = getPreferTypeTabs()
const typeIcons = [
    //songs
    '<svg width="15" height="15" style="transform: translateY(-1px) scale(0.93);" viewBox="0 0 736 831.94" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M320,447.93V441.7q0-196.23,0-392.47c0-29.06,22.88-51.48,51.13-49,9.79.84,19.43,4.34,29,7.2Q549.54,52.05,698.89,96.94c22.84,6.85,36.94,24.46,37.11,46.39.24,31.8-29.73,55.44-60.32,46.71-39.82-11.37-79.4-23.6-119.08-35.5q-67.39-20.21-134.77-40.49c-1.72-.52-3.49-.89-5.82-1.47v6.77q0,252,0,503.95A208.19,208.19,0,0,1,244.9,828.59C134.4,848.76,26.46,775.72,4.19,665.71c-21.25-104.94,40.19-209.48,142.1-240.43,59.18-18,115.84-10.79,169.31,20.54,1,.59,2,1.18,3,1.76A9.82,9.82,0,0,0,320,447.93ZM207.87,511.85A112,112,0,1,0,320,623.58,112,112,0,0,0,207.87,511.85Z"/></g></g></svg>',
    //playlists
    '<svg width="15" height="15" style="transform: scale(1.08);" viewBox="0 -20 895.95 703.92" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M640,424.12v-6.58q0-88.74,0-177.47c.06-28.13,23.63-50.33,51.42-47.73,9.63.9,19.09,4.34,28.48,7.13,46.39,13.79,92.63,28.15,139.14,41.53,33.47,9.63,46.39,45.87,29.44,72.69a47.22,47.22,0,0,1-53,20.5c-31-8.94-61.86-18.42-92.77-27.67-2-.61-4.09-1.17-6.75-1.92V311q0,124.49,0,249a144,144,0,0,1-287.25,13.81C441,495,499,424.34,577.75,416.75,598.8,414.71,619.24,417.27,640,424.12ZM592,608a48,48,0,1,0-48-48A48.07,48.07,0,0,0,592,608Z" /><path d="M400,96Q224.5,96,49,96C20.9,96-.62,74.16,0,46.47.59,21.86,21,1.09,45.57.05c1.33-.06,2.67,0,4,0H750.48c25.24,0,44.59,16.1,48.86,40.56,4.81,27.6-16.74,54.18-44.92,55.38-2,.08-4,0-6,0Z" /><path d="M287.78,352q-119.47,0-238.95,0C20.79,352-.7,330,0,302.29.66,277.7,21.13,257,45.75,256c1.17,0,2.34,0,3.5,0q238.71,0,477.42,0c27.85,0,49.4,21.12,49.31,48.2A47.92,47.92,0,0,1,528.74,352c-22,.2-44,0-66,0Z" /><path d="M191.69,608c-47.82,0-95.65.07-143.47,0A48,48,0,0,1,0,559.19C.31,533.67,21.27,512.47,46.84,512c11.5-.2,23,0,34.49,0q127,0,253.94,0c27.18,0,48.64,21.16,48.71,47.79A48,48,0,0,1,335.65,608Q263.67,608.1,191.69,608Z" /></g></g></svg>',
    //albums
    '<svg width="15" height="15" style="transform: scale(1.04);" viewBox="0 0 853.47 853.5" xmlns="http://www.w3.org/2000/svg" ><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M426.8,0C662.36.12,853.54,191.36,853.47,426.8S662,853.64,426.67,853.5C191.13,853.35-.11,662.05,0,426.67.11,191.14,191.42-.12,426.8,0ZM85.5,426.47C85.26,615.09,238,767.94,426.71,768c188.49,0,341-152.31,341.26-341S615.52,85.53,426.76,85.5C238.23,85.47,85.75,237.82,85.5,426.47Z"/><path d="M426.46,256c-47.09,1-87.6,17.3-120.63,50.49-32.87,33-49,73.41-49.87,120.08H171.28c-3.29-136.12,114-257.59,255.18-255.36Z"/><path d="M512,426.48a85.66,85.66,0,1,1-85.11-85.83A85.42,85.42,0,0,1,512,426.48Z"/></g></g></svg>',
    //radios
    '<svg width="15" height="15" style="transform: translateY(-0.5px);" viewBox="0 0 939.22 940.41" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M939.22,475.3c-.9,97-31.58,190.79-93.23,274.28-11,14.94-26,21.46-44.17,17.57-17.94-3.83-29.16-15.54-32.91-33.58-2.65-12.76.67-24.36,8.51-34.79a372.54,372.54,0,0,0,44.34-76.25c24.06-55.71,34.77-113.84,30.76-174.43-7.32-110.58-53.46-202-137.95-273.46C660.59,129,597.94,101.17,528,90.57,439.57,77.16,355.88,92.18,278.55,137c-94.46,54.71-156.23,135.6-181.76,241.82C69.1,494,91.05,600.56,160.19,696.88c14.52,20.23,11.94,42,1.08,55.39-17.84,22-50.46,21.2-67.82-1.74a456.73,456.73,0,0,1-49.39-82C11,597.9-3.13,523.54.58,445.77,9.4,261.1,128.39,97.23,301.09,31.32,363.79,7.39,428.63-3.29,495.52.89Q670.41,11.81,797.09,133.48c70,67.1,113.13,148.84,132.87,243.31C936.29,407,939,437.72,939.22,475.3Z" /><path d="M469.62,341.83c73-.14,131.64,61.47,127.53,134.23-1.79,31.61-13.84,59.07-35.88,81.92-2.63,2.73-3.35,5-2.4,8.71q40.49,158.88,80.7,317.82c6.34,25.08-7.8,48.55-32.47,54.44-23.71,5.67-47.05-9.34-52.73-34-3.66-15.89-7.33-31.78-10.76-47.72-.62-2.91-1.74-3.72-4.59-3.72q-69.75.12-139.49,0c-3,0-3.85,1.14-4.44,3.88-3.49,16.1-7.16,32.16-10.84,48.22C379.4,926.8,362,940.86,341.38,940.4c-22.11-.5-39.81-14.87-43.33-36.22a48.47,48.47,0,0,1,1.1-19.2q40.07-159.24,80.71-318.33c.95-3.74.11-5.93-2.43-8.7-34-37.1-45.18-80.27-29.43-128.1s50.13-76.5,99.75-86.33a118.4,118.4,0,0,1,12.88-1.65C463.61,341.62,466.62,341.83,469.62,341.83ZM521,768.14,478.31,597.58c-4.38,0-8.41.36-12.34-.09-4.74-.54-6.48,1.21-7.61,5.84-10.73,43.79-21.75,87.5-32.68,131.24-2.76,11.08-5.47,22.18-8.28,33.57ZM426.66,469.63a42.7,42.7,0,0,0,85.4.13c.17-23.46-19.47-43.1-42.89-42.88A42.89,42.89,0,0,0,426.66,469.63Z" /><path d="M464.77,170.81c147.44.55,270,100.94,297.32,240.39C776.35,484,764.9,553,728.54,617.69c-10.23,18.21-29.86,26.37-49.34,20.88-18.8-5.3-32-23-30.56-42.89a50,50,0,0,1,5.92-19.81c13.67-25,23.17-51.31,26.41-79.59,6.66-58.08-7.16-111-43.06-157.24-36.1-46.54-84-73.64-142.43-81.16C392,244.55,292.93,310,264.53,410.32c-16.5,58.32-9.28,114,20.61,166.81,15,26.51.78,58-28.88,64a42.13,42.13,0,0,1-44.08-19.9c-22.42-38.17-36.09-79.28-39.93-123.43-7-80.53,14.44-152.85,65.09-215.8,46.4-57.68,106.82-92.67,179.56-106.32,6.87-1.29,13.81-2.33,20.76-3C448.27,171.71,458.92,171.2,464.77,170.81Z" /></g></g></svg>'
]

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
const singleLineTitleStyle = ref(false)
const refreshId = ref(0)
const setRefreshId = (value) => (refreshId.value = value)


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
    singleLineTitleStyle.value = false
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
    singleLineTitleStyle.value = false
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
        singleLineTitleStyle.value = isSingleLineAlbumTitleStyle.value
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
        if (isShowDialogBeforeClearRecents.value) {
            const ok = await showConfirm('确定要清空最近播放吗？')
            if(!ok) return 
        }
        clearRecents()
    }
}

//TODO
const clearAll = () => {
    ["userProfile", "user", "profile"].forEach(key => localStorage.removeItem(key))
    const store = useUserProfileStore()
    const { nickname, about, cover } = store.user
    store.$reset()
    emitEvents("userProfile-reset")
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

const refresh = (newMode) => {
    visitTab(activeTab.value)
    if(newMode) setRefreshId(randomTextWithinAlphabetNums(8))
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
        + '-' + refreshId.value
})


const visitRecentsTab = () => visitTab(3)

const visitRouterCtxCacheItem = () => {
    if (!routerCtxCacheItem.value) return
    const { id } = routerCtxCacheItem.value
    if (id == 'visitRecents') visitRecentsTab()
}

const userCoverOnDrop = (event) => {
    event.preventDefault()
    const { files } = event.dataTransfer

    if (files.length < 1) return

    const { path } = files[0]
    let isEventStopped = true
    if (isSupportedImage(path)) {
        updateUser(getUserNickName.value, getUserAbout.value, path)
    } else {
        isEventStopped = false
    }
    if (isEventStopped) event.stopPropagation()
} 

const decoAnimated = ref(false)
const toggleDecorationAnimated = () => {
    decoAnimated.value = !decoAnimated.value
}

const computedDecoAnimated = computed(() => {
    const { current } = decoration.value
    return decoAnimated.value && current == 1001
})


/* 生命周期、监听 */
watch(playingViewShow, (nv, ov) => {
    if (!nv) refresh(true)
})

watch(currentPlatformCode, (nv, ov) => {
    const path = currentRoutePath()
    if (!isUserHomeMode.value && path.includes("/batch/")) return
    refresh(true)
})

const eventsRegistration = {
    'userHome-refresh': (args) => {
        const { scope, action } = args || {}
        const isRecentsTab = (activeTab.value == 3)
        if(scope == 'recents' && !isRecentsTab) return
        
        refresh(true)
    },
    'userHome-visitRecentsTab': visitRecentsTab,
}
/* 生命周期、监听 */
onMounted(() => onEvents(eventsRegistration))
onUnmounted(() => offEvents(eventsRegistration))

onActivated(() => {
    resetBack2TopBtn()
    restoreScrollState()

    refresh()
    visitRouterCtxCacheItem()
})
</script>

<template>
    <div id="user-profile-view" ref="userProfileRef" @scroll="onScroll">
        <div class="decoration" :class="{ animated: computedDecoAnimated }">
            <img :src="`deco_${decoration.current}.png`" 
                @error="resetDecoration" 
                @click="nextDecoration"
                @contextmenu="toggleDecorationAnimated" />
        </div>
        <div class="header">
            <div>
                <img class="cover" v-lazy="coverDefault(getUserCover)"
                    @dragover="e => e.preventDefault()" @drop="userCoverOnDrop" />
            </div>
            <div class="right">
                <div class="title-wrap">
                    <div class="edit-btn" @click="visitUserInfoEdit">
                        <svg width="19" height="19" viewBox="0 0 992.3 992.23" xmlns="http://www.w3.org/2000/svg">
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
                    <BatchActionBtn v-show="activeTab == 0 || activeTab == 3" class="spacing"
                        :deleteBtn="activeTab == 3" :leftAction="visitBatchActionView" :rightAction="batchRemoveAll">
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
                <div class="sub-tab" v-for="(tab, index) in typeTabs"
                    :class="{ active: activeSubTab == index, 'content-text-highlight': activeSubTab == index }"
                    @click="visitSubTab(index)">
                    <span class="tab-icon" v-html="typeIcons[index]"></span>
                    <span v-html="tab.name"></span>
                </div>
                <span class="tip-text" v-show="false">暂不支持本地歌曲</span>
            </div>
            <component 
                :id="dataListId"
                :is="currentTabView" 
                :data="tabData" 
                :artistVisitable="true" 
                :albumVisitable="true"
                :dataType="dataType" 
                :singleLineTitleStyle="singleLineTitleStyle"
                :playable="true"
                :needReset="true" >
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
    margin-bottom: 16px;
}

#user-profile-view .header .right {
    flex: 1;
    margin-left: 20px;
}

#user-profile-view .header .title-wrap {
    margin-top: 5px;
    margin-bottom: 10px;
    display: flex;
    flex-direction: row;
    align-items: center;
}

#user-profile-view .header .title-wrap .edit-btn {
    display: flex;
    align-items: center;
}

#user-profile-view .header .title-wrap .edit-btn svg {
    fill: var(--button-icon-btn-color);
    cursor: pointer;
    transform: translateY(1.5px);
}

#user-profile-view .header .title-wrap .edit-btn svg:hover {
    fill: var(--content-highlight-color);
}

#user-profile-view .header .title {
    text-align: left;
    /*font-size: 30px;*/
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
    margin-left: 6px;
    overflow: hidden;
    word-wrap: break-all;
    white-space: pre-wrap;
    line-break: anywhere;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    line-clamp: 1;
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
    line-clamp: 3;
    letter-spacing: calc(var(--content-text-letter-spacing) + 0.5px);
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
    align-items: center;
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
    padding-bottom: 5px;
    border-bottom: 3px solid transparent;
    cursor: pointer;
}

#user-profile-view .tab-tip {
    position: absolute;
    right: 10px;
    font-weight: bold;
    padding-bottom: 5px;
}

#user-profile-view .tab-nav .active {
    font-weight: bold;
    border-color: var(--content-highlight-color);
}

#user-profile-view .sub-tab-nav {
    position: relative;
    display: flex;
    /*height: 21px;*/
    margin: 8px 0px 3px 3px;
}

#user-profile-view .sub-tab-nav .sub-tab {
    font-size: calc(var(--content-text-subtitle-size) + 1px);
    /*font-weight: bold;*/
    margin-right: 33px;
    display: flex;
    align-items: center;
    cursor: pointer;
}

#user-profile-view .sub-tab-nav .sub-tab .tab-icon {
    margin-right: 5px;
    transform: translateY(2px);
    fill: var(--button-icon-btn-color);
}

#user-profile-view .sub-tab-nav .active {
    /*color: var(--content-highlight-color);*/
    font-weight: bold;
}

#user-profile-view .sub-tab-nav .active .tab-icon {
    fill: var(--content-highlight-color);
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

#user-profile-view .decoration.animated img {
    animation: sway-anim 5s linear infinite;
    transform-origin: top center;
}

@keyframes sway-anim {
    0% {
        transform: rotate(0deg);
    }

    25% {
        transform: rotate(-12deg);
    }

    50% {
        transform: rotate(0deg);
    }

    75% {
        transform: rotate(12deg);
    }   

    100% {
        transform: rotate(0deg);
    }
}
</style>