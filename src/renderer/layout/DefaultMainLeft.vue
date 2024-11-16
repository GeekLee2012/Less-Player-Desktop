<script setup>
import { computed, inject, onActivated, onDeactivated, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia'
import { usePlatformStore } from '../store/platformStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { useUserProfileStore } from '../store/userProfileStore';
import { useSettingStore } from '../store/settingStore';
import { isDevEnv, useUseCustomTrafficLight, isMacOS } from '../../common/Utils';
import WinTrafficLightBtn from '../components/WinTrafficLightBtn.vue';
import Navigator from '../components/Navigator.vue';
import SearchBar from '../components/SearchBar.vue';
import AppLogo from '../components/AppLogo.vue';
import { onEvents, emitEvents, offEvents } from '../../common/EventBusWrapper';



const props = defineProps({
    hideBottom: Boolean,
})

const { visitRoute, visitArtist, visitHome,
    visitFavoritePlaylist, visitCustomPlaylist,
    visitCustomPlaylistCreate, currentRoutePath,
    visitUserHome, visitSetting, } = inject('appRoute')
const { showContextMenu, useWindowsStyleWinCtl, 
    searchAction, searchBarPlaceholder, } = inject('appCommon')


const { platforms, currentPlatformIndex,
    currentPlatformCode, activePlatforms } = storeToRefs(usePlatformStore())
const { updateCurrentPlatform, isLocalMusic, isFreeFM, } = usePlatformStore()
const { isMaxScreen, isPlaylistMode, isArtistMode,
    isRadioMode, isUserHomeMode, exploreModeCode, 
    isCloudStorageMode, isArtistModeEnable,
    isRadioModeEnable, isCloudStorageModeEnable } = storeToRefs(useAppCommonStore())
const { nextExploreMode, setPlaylistExploreMode, 
    setRadioExploreMode, setCloudStorageExploreMode, 
    showFailToast } = useAppCommonStore()
const { getCustomPlaylists, getFavoritePlaylilsts, getFollowArtists } = storeToRefs(useUserProfileStore())
const { navigation, isDefaultOldLayout, isDefaultNewLayout, isAutoLayout, } = storeToRefs(useSettingStore())

const activeCustomPlaylistIndex = ref(-1)
const activeFavoritePlaylistIndex = ref(-1)
const activeArtistIndex = ref(-1)
const isFavoritePlaylistsCollapsed = ref(false)

let isUserMouseWheel = ref(false), userMouseWheelCancelTimer = null

//TODO
const updatePlatformIndex = (index, isSwitchMode) => {
    updateCurrentPlatform(index)
    activeCustomPlaylistIndex.value = -1
    activeFavoritePlaylistIndex.value = -1
    activeArtistIndex.value = -1

    const platform = currentPlatformCode.value
    const exploreMode = exploreModeCode.value
    const currentPath = currentRoutePath()
    if(!platform) return

    let path = null
    if (isLocalMusic(platform)) {
        path = `/${exploreMode}/${platform}`
    } else if (isCloudStorageMode.value) {
        path = `/${exploreMode}/${platform}`
    } else if (isFreeFM(platform) && !currentPath.includes('/batch/')) {
        path = `/${exploreMode}/${platform}`
    } else if (isUserHomeMode.value && isSwitchMode) {
        path = `/${exploreMode}/${platform}`
    } else if (isPlaylistMode.value || isArtistMode.value || isRadioMode.value) {
        path = `/${exploreMode}/square/${platform}`
    }
    if (!path) return
    
    visitRoute(path).catch(error => {
        if (isDevEnv() && error) console.log(error)
    })
}

const switchExploreMode = (noVisit) => {
    nextExploreMode()
    if(typeof noVisit == 'boolean' && noVisit) return
    updatePlatformIndex(0, true)
}

const toggleRadioMode = () => {
    if (!isRadioMode.value) {
        setRadioExploreMode()
    } else {
        setPlaylistExploreMode()
    }
    updatePlatformIndex(0, true)
}

const visitCloudStorageMode = () => {
    setCloudStorageExploreMode()
    updatePlatformIndex(0, true)
}

const visitCustomItem = (item, index) => {
    activeCustomPlaylistIndex.value = index
    activeFavoritePlaylistIndex.value = -1
    updateCurrentPlatform(-1)
    visitCustomPlaylist(item.id)
}

const onContextMenu = (event, data, dataType, index) => {
    showContextMenu(event, data, dataType, index)
}

const visitArtistItem = (item, index) => {
    activeArtistIndex.value = index
    const { platform } = item
    visitArtist({
        platform, item,
        onRouteReady: () => updateCurrentPlatform(-1)
    })
}

const visitFavourteItem = (item, index) => {
    activeCustomPlaylistIndex.value = -1
    //activeFavoritePlaylistIndex.value = index
    const { id, platform } = item
    visitFavoritePlaylist(platform, id)
}

const setFavoritePlaylistsCollapsed = (value) => {
    isFavoritePlaylistsCollapsed.value = value
}

const onUserMouseWheel = () => {
    isUserMouseWheel.value = true
    if (userMouseWheelCancelTimer) clearTimeout(userMouseWheelCancelTimer)
    userMouseWheelCancelTimer = setTimeout(() => {
        isUserMouseWheel.value = false
    }, 888)
}

const isSubtitleVisible = () => {
    const { customPlaylistsShow, favoritePlaylistsShow, followArtistsShow } = navigation.value
    if (isPlaylistMode.value) {
        return customPlaylistsShow || favoritePlaylistsShow
    } else if (isArtistMode.value) {
        return followArtistsShow
    }
    return false
}

/* 拖拽移动重排序 */
/*
const dragTargetIndex = ref(-1)
const dragOverIndex = ref(-1)
const dragging = ref(false)
const setDragTargetIndex = (value) => dragTargetIndex.value = value
const setDragOverIndex = (value) => dragOverIndex.value = value
const setDragging = (value) => dragging.value = value

//重置状态
const resetDragState = () => {
    setDragging(false)
    setDragOverIndex(-1)
    setDragTargetIndex(-1)
}

const markDragStart = (event, item, index) => {
    setDragging(true)
    //当前拖拽对象index
    setDragTargetIndex(index)
    //仅为改变默认鼠标样式
    const { dataTransfer } = event
    if (dataTransfer) dataTransfer.effectAllowed = 'move'
}

const markDragOver = (event, item, index) => {
    if (!dragging.value) return
    //拖拽悬停时所在的Item对象对应的index
    setDragOverIndex(index)
}

const moveDragItem = (event) => {
    if (!dragging.value) return
    movePlaylistPlatform(dragTargetIndex.value, dragOverIndex.value)
}


const sortedActivePlatforms = ref([])
const needReposition = () => (sortedActivePlatforms.value && sortedActivePlatforms.value.length > 0)

const setupSortedActivePlatforms = (value) => {
    //TODO 插件变动时，sortedActivePlatforms会被重置
    //sortedActivePlatforms.value = (value || [])
    const oValue = sortedActivePlatforms.value || []
    const _value = (value || [])
    const nValue = []
    //合并数据
    const part1 = oValue.filter(item => (_value.findIndex(e => e.code == item.code) != -1)) || []
    const part2 = _value.filter(item => (part1.findIndex(e => e.code == item.code) == -1)) || []
    nValue.push(...part1)
    nValue.push(...part2)
    sortedActivePlatforms.value = nValue
}

const repositionIndex = (index) => {
    const platfroms = sortedActivePlaylistPlatforms.value
    const { code } = platfroms[index]
    return activePlatforms.value().findIndex(item => item.code == code)
}

const movePlaylistPlatform = (from, to) => {
    if(from < 0 || to < 0 || from == to) return
    const platforms = sortedActivePlatforms.value || []
    const item = platforms[from]
    platforms.splice(from, 1)
    platforms.splice(to, 0, item)
}

const sortedActivePlaylistPlatforms = computed(() => {
    const _sPlatforms = sortedActivePlatforms.value
    if(_sPlatforms && _sPlatforms.length > 0) {
        return sortedActivePlatforms.value
    }
    return activePlatforms.value()
})

watch(() => activePlatforms.value(), setupSortedActivePlatforms)
*/


/* 生命周期、监听 */
watch(isArtistModeEnable, (nv) => {
    if(!nv && isArtistMode.value) switchExploreMode(true)
})

watch(isRadioModeEnable, (nv) => {
    if(!nv && isRadioMode.value) switchExploreMode(true)
})

watch(isCloudStorageModeEnable, (nv) => {
    if(!nv && isCloudStorageMode.value) switchExploreMode(true)
})

const eventsRegistration = {
    'navigation-refreshCustomPlaylistIndex': index => {
        activeCustomPlaylistIndex.value = index
    },
    toggleRadioMode,
    visitCloudStorageMode,
}

onMounted(() => onEvents(eventsRegistration))
onUnmounted(() => offEvents(eventsRegistration))
</script>

<template>
    <div id="main-left"
        :class="{
            'user-mousewheel': isUserMouseWheel, 
        }">
        <div class="header">
            <WinTrafficLightBtn v-show="!useWindowsStyleWinCtl" :isMaximized="isMaxScreen">
            </WinTrafficLightBtn>
            <div class="top-left-navigator-wrap" v-show="isDefaultOldLayout">
                <Navigator></Navigator>
            </div>
            <div class="top-logo" v-show="isDefaultNewLayout || (isAutoLayout && !isMacOS())">
                <AppLogo></AppLogo>
            </div>
        </div>
        <div class="search-wrap" v-show="isDefaultOldLayout">
            <SearchBar :submitAction="searchAction" :placeholder="searchBarPlaceholder">
            </SearchBar>
        </div>
        <div id="explore-mode">
            <div class="mode-item playlists-mode" v-show="isPlaylistMode" @click="switchExploreMode">
                <svg width="21" height="21" viewBox="0 -20 895.95 703.92" xmlns="http://www.w3.org/2000/svg">
                    <g id="Layer_2" data-name="Layer 2">
                        <g id="Layer_1-2" data-name="Layer 1">
                            <path
                                d="M640,424.12v-6.58q0-88.74,0-177.47c.06-28.13,23.63-50.33,51.42-47.73,9.63.9,19.09,4.34,28.48,7.13,46.39,13.79,92.63,28.15,139.14,41.53,33.47,9.63,46.39,45.87,29.44,72.69a47.22,47.22,0,0,1-53,20.5c-31-8.94-61.86-18.42-92.77-27.67-2-.61-4.09-1.17-6.75-1.92V311q0,124.49,0,249a144,144,0,0,1-287.25,13.81C441,495,499,424.34,577.75,416.75,598.8,414.71,619.24,417.27,640,424.12ZM592,608a48,48,0,1,0-48-48A48.07,48.07,0,0,0,592,608Z" />
                            <path
                                d="M400,96Q224.5,96,49,96C20.9,96-.62,74.16,0,46.47.59,21.86,21,1.09,45.57.05c1.33-.06,2.67,0,4,0H750.48c25.24,0,44.59,16.1,48.86,40.56,4.81,27.6-16.74,54.18-44.92,55.38-2,.08-4,0-6,0Z" />
                            <path
                                d="M287.78,352q-119.47,0-238.95,0C20.79,352-.7,330,0,302.29.66,277.7,21.13,257,45.75,256c1.17,0,2.34,0,3.5,0q238.71,0,477.42,0c27.85,0,49.4,21.12,49.31,48.2A47.92,47.92,0,0,1,528.74,352c-22,.2-44,0-66,0Z" />
                            <path
                                d="M191.69,608c-47.82,0-95.65.07-143.47,0A48,48,0,0,1,0,559.19C.31,533.67,21.27,512.47,46.84,512c11.5-.2,23,0,34.49,0q127,0,253.94,0c27.18,0,48.64,21.16,48.71,47.79A48,48,0,0,1,335.65,608Q263.67,608.1,191.69,608Z" />
                        </g>
                    </g>
                </svg>
                <!--
                    <svg width="17" height="16" viewBox="0 0 944.3 696.52" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M708.31,372.39v-8.34q0-156,0-311.93c0-25.37,16.52-45.95,40.82-50.95a44.53,44.53,0,0,1,8.93-.86c45.49-.06,91-.33,136.47.06,27.7.23,48.24,20.57,49.69,48C945.75,77,923,100,892.74,100.2c-26,.2-52,0-78,0h-6.44v6.9c0,141.63.32,283.27-.22,424.9-.14,38.73-14.05,73.31-38.94,103-36.08,43.09-82.64,63.69-138.6,61.24-77-3.37-141.93-59.23-158-134.59-16.91-79.43,26.49-160.86,101.88-191.25q65-26.21,129.76.45C705.42,371.43,706.66,371.8,708.31,372.39Zm-69.88,224.4c37.07.85,70.26-30.84,70-70.11-.26-37.75-32.14-69.39-69.9-69.37-37.42,0-69.8,31.56-69.73,70C568.85,564.54,600,597.35,638.43,596.79Z" />
                                <path
                                    d="M304.77.24q126,0,251.94,0c23.65,0,42.74,12.63,49.49,32.56,11.72,34.57-11.38,67.1-48.45,67.35-53,.35-106,.09-158.95.09q-172.2,0-344.41,0C42.76,100.3,31.93,98,22.2,91.4,4.59,79.46-2.15,62.24,1,42,4.37,20.61,17.81,6.63,39,1.85,48.29-.25,58.21.1,67.84.08Q186.31-.1,304.77,0Z" />
                                <path
                                    d="M304.75,313.65q-126.23,0-252.45,0C24,313.61,4.11,296.1.48,268.34c-3.67-28.15,19.64-54.3,49.43-54.6,37.16-.37,74.32-.09,111.47-.09q198.21,0,396.41,0c27.69,0,48.68,18.82,51.37,45.83,2.81,28.19-19.71,53.72-48.48,54-40.15.39-80.31.14-120.47.14Q372.49,313.67,304.75,313.65Z" />
                                <path
                                    d="M213.26,427.24c53.32,0,106.64.12,160-.07,17.11-.06,31.79,5.55,42.08,19.05,12.19,16,14.82,34.08,5.74,52.63-9.55,19.51-26.13,28.28-47.37,28.34-55.32.16-110.64.06-166,.06q-77.47,0-155,0c-19.57,0-35.63-7.47-45.64-24.61-19.34-33.09,2.91-74.14,41.2-75.06,40.63-1,81.3-.28,122-.31Z" />
                            </g>
                        </g>
                    </svg>
                    -->
                <span>分类歌单</span>
            </div>
            <div class="mode-item" v-show="isArtistMode" @click="switchExploreMode">
                <svg width="21" height="18" viewBox="0 0 829.44 853.21" xmlns="http://www.w3.org/2000/svg">
                    <g id="Layer_2" data-name="Layer 2">
                        <g id="Layer_1-2" data-name="Layer 1">
                            <path
                                d="M452.22,362.51c3.95,1.95,7.81,3.81,11.64,5.74q62.49,31.49,99.13,91.11c12.66,20.52,6.7,46.41-13.52,59-19.86,12.42-45.38,6.11-58.82-13.71-7.54-11.11-15.46-22.28-24.89-31.74C435.33,442.41,398,427.1,354.88,426.63c-36.66-.41-73.33-.2-110-.07-79.48.29-145.22,56.72-157.39,135.27a177.7,177.7,0,0,0-1.64,26.91q-.19,109.5-.09,219c0,21.7-12,38.5-31.05,43.81-28,7.8-54.27-12.63-54.39-42.6-.15-36.67,0-73.34,0-110,0-36.5-.71-73,.14-109.5,2.43-103.61,50-178.92,143-225.31.87-.43,1.71-.93,2.93-1.6C98.45,310.58,78.18,249.84,88.71,180.05c8.19-54.34,34.49-99.12,77.51-133.24,85.75-68,205.87-61.08,283.45,15.27C529.63,140.77,536.33,276.78,452.22,362.51ZM299.31,341.27C369.85,341,427.18,283.54,427,213.18a128,128,0,1,0-256,.54C171.28,284.15,229,341.53,299.31,341.27Z" />
                            <path
                                d="M655.22,588.85v-6.68q0-145.71,0-291.42c0-23.72,10.19-37.88,32.72-45.62,28-9.62,56-19.36,84-28.92,21.87-7.47,44.05,1.51,53.57,21.49,10.54,22.11-.86,49-24.49,57.64-18.59,6.81-37.17,13.63-55.82,20.23-3.35,1.19-4.6,2.7-4.6,6.36q.15,164,.13,327.92a14.75,14.75,0,0,0,1,5.79c16.25,36.64,8.11,69.07-17.86,97.7-22.07,24.32-50.65,37.47-82.44,43.62-42.92,8.31-84.29,3.54-123-17.53-25.15-13.68-45.3-32.63-54.83-60.35-11.71-34-2.87-64.06,20.89-89.94,22.09-24.07,50.44-37,82-43.54,28.2-5.84,56.28-4.72,84.18,2.22C651.93,588.14,653.21,588.4,655.22,588.85Z" />
                        </g>
                    </g>
                </svg>
                <span>万千歌手</span>
            </div>
            <div class="mode-item radios-mode" v-show="isRadioMode" @click="switchExploreMode">
                <svg width="19" height="19" viewBox="0 0 939.22 940.41" xmlns="http://www.w3.org/2000/svg">
                    <g id="Layer_2" data-name="Layer 2">
                        <g id="Layer_1-2" data-name="Layer 1">
                            <path
                                d="M939.22,475.3c-.9,97-31.58,190.79-93.23,274.28-11,14.94-26,21.46-44.17,17.57-17.94-3.83-29.16-15.54-32.91-33.58-2.65-12.76.67-24.36,8.51-34.79a372.54,372.54,0,0,0,44.34-76.25c24.06-55.71,34.77-113.84,30.76-174.43-7.32-110.58-53.46-202-137.95-273.46C660.59,129,597.94,101.17,528,90.57,439.57,77.16,355.88,92.18,278.55,137c-94.46,54.71-156.23,135.6-181.76,241.82C69.1,494,91.05,600.56,160.19,696.88c14.52,20.23,11.94,42,1.08,55.39-17.84,22-50.46,21.2-67.82-1.74a456.73,456.73,0,0,1-49.39-82C11,597.9-3.13,523.54.58,445.77,9.4,261.1,128.39,97.23,301.09,31.32,363.79,7.39,428.63-3.29,495.52.89Q670.41,11.81,797.09,133.48c70,67.1,113.13,148.84,132.87,243.31C936.29,407,939,437.72,939.22,475.3Z" />
                            <path
                                d="M469.62,341.83c73-.14,131.64,61.47,127.53,134.23-1.79,31.61-13.84,59.07-35.88,81.92-2.63,2.73-3.35,5-2.4,8.71q40.49,158.88,80.7,317.82c6.34,25.08-7.8,48.55-32.47,54.44-23.71,5.67-47.05-9.34-52.73-34-3.66-15.89-7.33-31.78-10.76-47.72-.62-2.91-1.74-3.72-4.59-3.72q-69.75.12-139.49,0c-3,0-3.85,1.14-4.44,3.88-3.49,16.1-7.16,32.16-10.84,48.22C379.4,926.8,362,940.86,341.38,940.4c-22.11-.5-39.81-14.87-43.33-36.22a48.47,48.47,0,0,1,1.1-19.2q40.07-159.24,80.71-318.33c.95-3.74.11-5.93-2.43-8.7-34-37.1-45.18-80.27-29.43-128.1s50.13-76.5,99.75-86.33a118.4,118.4,0,0,1,12.88-1.65C463.61,341.62,466.62,341.83,469.62,341.83ZM521,768.14,478.31,597.58c-4.38,0-8.41.36-12.34-.09-4.74-.54-6.48,1.21-7.61,5.84-10.73,43.79-21.75,87.5-32.68,131.24-2.76,11.08-5.47,22.18-8.28,33.57ZM426.66,469.63a42.7,42.7,0,0,0,85.4.13c.17-23.46-19.47-43.1-42.89-42.88A42.89,42.89,0,0,0,426.66,469.63Z" />
                            <path
                                d="M464.77,170.81c147.44.55,270,100.94,297.32,240.39C776.35,484,764.9,553,728.54,617.69c-10.23,18.21-29.86,26.37-49.34,20.88-18.8-5.3-32-23-30.56-42.89a50,50,0,0,1,5.92-19.81c13.67-25,23.17-51.31,26.41-79.59,6.66-58.08-7.16-111-43.06-157.24-36.1-46.54-84-73.64-142.43-81.16C392,244.55,292.93,310,264.53,410.32c-16.5,58.32-9.28,114,20.61,166.81,15,26.51.78,58-28.88,64a42.13,42.13,0,0,1-44.08-19.9c-22.42-38.17-36.09-79.28-39.93-123.43-7-80.53,14.44-152.85,65.09-215.8,46.4-57.68,106.82-92.67,179.56-106.32,6.87-1.29,13.81-2.33,20.76-3C448.27,171.71,458.92,171.2,464.77,170.81Z" />
                        </g>
                    </g>
                </svg>
                <!--
                    <svg width="16" height="16" viewBox="0 0 938.74 981.44" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M476.39,0c2.69.76,5.42,1.39,8.05,2.3,15.69,5.44,24.48,16.58,26.93,32.87.36,2.44.54,4.9.74,6.72,19.41,3.54,38.41,6.19,57,10.54,89.44,21,167,63.79,231.84,128.85Q901.73,282.38,930.06,422.6a457.13,457.13,0,0,1,6.63,132.33c-8.77,95-42.81,180-103.22,253.84C764,893.67,675.19,947.59,568,971a458.45,458.45,0,0,1-135.68,8.85c-95.93-7.8-182.07-41.18-257.07-101.65C91,810.29,36.65,723.19,12,617.79A458.55,458.55,0,0,1,2.16,468.84q15.36-160.9,125-279.8a141.26,141.26,0,0,1,12.76-12.67c17.46-14.54,41.38-12.8,57.2,3.9,15.55,16.4,16,40.21.56,56.92C176.56,260,157.38,284.28,141.38,311c-32.6,54.38-52.25,113-55.11,176.48-6.33,140.25,46.51,253.29,159.28,337.22,48.09,35.8,102.71,57.63,162,66.42,115.51,17.11,219.49-10.11,309.52-85,69.49-57.79,113-132.06,129.3-221,21.42-116.61-4.79-222.22-79.63-314.37C708.56,199.1,633,154.88,542.32,136.88c-9.76-1.93-19.64-3.26-30-4.95-.12,2.3-.29,3.91-.29,5.53,0,25,.06,50-.09,75,0,3.76.71,5.37,4.89,6.08,64.95,10.95,120.84,39.69,166.78,86.88s73.68,103.63,81.87,169.15C782.08,607.09,712.18,731.52,591,785.29,543.07,806.54,492.8,814,440.65,809.23c-122.58-11.14-225.82-95.79-258.23-214.55-26.87-98.47-8.66-188.69,56-268.56,7.1-8.77,15.29-16.75,23.6-24.42,17.27-16,41.35-15.18,57.95,1.36,16.29,16.24,16.87,40.17,1.78,57.75-10.62,12.37-21.91,24.37-31,37.83-64.85,96.2-35.88,231.45,62.36,293.25,81.32,51.16,186.61,43.78,257.88-19.28,50.35-44.53,74-101.58,71.36-168.5C679.45,431.33,646,374.85,586,334c-21.68-14.78-45.68-24.54-71.23-30.47-.63-.15-1.29-.2-2.72-.4v5c0,26.67.06,53.33-.07,80,0,3.33.9,4.87,4.17,6.11,54.13,20.41,86.3,72.77,80.48,130.68-6.08,60.45-49,105.34-108.77,113.87-68.74,9.81-130-33.16-144-100.95-12.52-60.81,19.74-120.7,77.31-143,4.64-1.79,5.64-4.1,5.64-8.66q-.18-169.76-.05-339.53a68.62,68.62,0,0,1,1.15-14.41C431.67,15,442.41,4.62,459.68,1a19.65,19.65,0,0,0,2.71-1ZM426.58,511.42c-.47,25.28,16.56,42.86,42.07,43.44,25.24.57,42.93-16.47,43.55-42,.61-25.27-16.39-43-41.82-43.65S427.06,485.74,426.58,511.42Z" />
                            </g>
                        </g>
                    </svg>
                    -->
                <span>相约电波</span>
            </div>
            <div class="mode-item cloud-storage-mode" v-show="isCloudStorageMode" @click="switchExploreMode">
                <svg width="18" height="18" viewBox="0 0 945.36 902.63" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M0,728.31v-39c1.16-6.32,2.29-12.65,3.5-19,7.89-41.22,27.3-76.11,57.75-104.91,2.61-2.46,5.38-4.74,8.38-7.37l-4.74-4.29Q17.58,511.05,4.54,448.68c-1.75-8.43-3-16.95-4.54-25.43v-41A20.28,20.28,0,0,0,.92,379c1.47-12.23,2.76-24.49,4.34-36.71C13.46,278.49,21.45,214.71,30.09,151c5.24-38.71,21.14-72.75,48.33-101C108.53,18.7,146.47,4.48,189,2.36,223.4.65,257.91.13,292.38.09Q510.15-.18,727.91.28a346.52,346.52,0,0,1,42.82,2.87c70.32,8.93,123.61,57.5,139.48,126.27,9.46,41,13.21,82.84,18.84,124.4,4.11,30.37,7.87,60.78,11.72,91.18,3.45,27.3,6.22,54.63,3.46,82.2-3.93,39.16-17.64,74.31-43.1,104.54-7.58,9-15.88,17.39-24,26.18,2.67,2.87,5.21,5.74,7.9,8.46,17.63,17.75,32.51,37.46,43,60.28,15.63,33.93,19.79,69.47,15.13,106.33-5.58,44.09-24.13,81.94-55.75,112.9-39.21,38.4-86.61,56.83-141.7,56.73q-260-.43-520-.15c-15.65,0-31.35-.06-46.94-1.24C136,898,97.82,882.88,65.5,854.33,36.15,828.41,18.38,795.21,7.23,758.2,4.28,748.4,2.38,738.28,0,728.31Zm472.55,82.85v-.34q134.51,0,269-.06a207.28,207.28,0,0,0,24.9-1.54C820,802.66,861.54,747,852.83,693.68c-8.83-54.1-51.33-90.22-106.2-90.22q-272.28,0-544.55.08a128.49,128.49,0,0,0-25.34,2.13c-43.89,8.93-72.06,35.84-82.08,78.87-9.89,42.46,4.23,78.29,38.51,105.38,20,15.83,43.71,21.25,68.85,21.24Zm.49-506.1v.16q-138,0-276,0c-30.25,0-56.14,10.14-76.82,32.34C98.33,361,88,389,92.51,420.93c7.78,54.82,50.59,91.3,106,91.31q275,0,550.05-.24a113,113,0,0,0,22.31-2.33c55.9-11.45,91.58-64.89,81.12-121.19-6.47-34.81-37.66-75.58-82.09-81.28-16.27-2.09-32.88-2-49.34-2.06Q596.8,304.87,473,305.06ZM111.29,231.67c2.2-.76,3.3-1.06,4.33-1.52,26.08-11.66,53.39-17,82-17q277.23.18,554.45.06c19.65,0,38.77,2.93,57.27,9.76,7.85,2.89,15.85,5.36,24,8.1a20.34,20.34,0,0,0,0-2.13c-4.06-26.32-7.57-52.74-12.33-78.93-5.15-28.27-32.34-53.15-60.39-55.53-20.22-1.72-40.56-3-60.84-3-110.65-.18-221.3.1-332,.2-40.49,0-81-.25-121.48.11-19.63.17-39.29,1-58.87,2.4C157,96.37,129.6,121.35,124,151.29q-3.66,19.64-6.75,39.37C115.15,204,113.36,217.29,111.29,231.67Z"/><path d="M600.91,661.46q63.26,0,126.51,0c25.75,0,45.67,18.75,46.93,43,1.42,27.11-18.6,47-44.29,48.71-1.66.11-3.33.13-5,.13-81.17,0-162.35.11-243.52-.14-8.55,0-17.48-.9-25.56-3.5-19.95-6.44-31.05-26.12-28.86-48.83,1.79-18.66,17.72-35.45,37.37-38.39,8.17-1.23,16.6-1.08,24.91-1.11,37.17-.1,74.34,0,111.5,0Z"/><path d="M170.87,707a45.65,45.65,0,0,1,45.86-45.65c25.88,0,46.33,20.82,46.13,47-.18,24.87-21.29,45.36-46.49,45.12C190.73,753.2,170.71,732.76,170.87,707Z"/><path d="M602.53,362.73H726c16.24,0,30.35,5.07,39.85,18.81,10.39,15,11.84,31.36,3.59,47.74s-22.14,24.83-40.28,24.87q-128.21.35-256.41.07c-24.07,0-43.54-17.69-45.8-41-2.31-23.91,12.84-44.73,36.22-49.45a63.6,63.6,0,0,1,12.42-1Q539.06,362.67,602.53,362.73Z"/><path d="M216.27,454.25c-25.54,0-45.33-20.4-45.25-46.59.07-24.88,20.39-44.73,46-44.92s45.9,20.36,45.86,46.09C262.83,434.18,242.21,454.28,216.27,454.25Z"/></g></g></svg>
                <span>网络存储</span>
            </div>
            <div class="mode-item userhome-mode" v-show="isUserHomeMode" @click="() => visitHome()">
                <!--
                    <svg width="20" height="19" viewBox="0 0 938.47 938.5" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M0,469C.33,209.53,210.36-.32,469.38,0,729.05.32,939.22,210.78,938.47,469.76c-.76,259.7-211.12,469.66-469.63,468.74C208.87,937.57-.33,728.06,0,469Zm453.81,128,.12-.34-1.95-.2c-53.39-5.09-94.44-29.95-122-76.3-14.75-24.84-23-52-27.21-80.35-4.62-31.1-6.87-62.34-.49-93.46,10.07-49.16,36-87.34,80.26-111.88,32.13-17.8,67-23.53,103.32-20.28,46.06,4.12,84.22,23.72,113.49,59.63,24.9,30.54,37.7,66,39.88,105.16,2.3,41.55-2.47,82.21-19,120.79-19.26,44.86-51.57,75.78-98.75,90.18a171.59,171.59,0,0,1-18,4.28c-6,1.14-12.07,1.77-19.36,2.8,2.76.19,4.26.35,5.75.38,39.17.82,78.23,3.08,117,8.94,33.49,5.07,66.42,12.41,97.94,25.1,27.78,11.19,53.28,25.93,73.53,48.57,2.16,2.43,4.24,4.93,6.42,7.46,100.84-141.58,96.84-361.06-57.33-502.35C576.61,46.82,340.65,52.88,196.73,198.77,51.56,345.94,60.23,558.41,153.79,687.36c2.07-2.44,4.06-4.88,6.15-7.22,23.12-25.8,52.64-41.45,84.68-52.86,50.51-18,103.12-24.68,156.28-28C418.51,598.18,436.17,597.7,453.81,596.94Zm15.45,85.56c-55,0-99.89,3.54-143.71,11.75C299.3,699.17,273.61,706,250,719c-13.9,7.67-26.18,17.11-33.23,32-1.83,3.88-1.62,6.33,1.92,9.29,86,71.89,184.71,102.35,296.12,90,74.25-8.24,140.09-37.15,198-84.26,12.85-10.45,12.94-12.24,2.41-25.61-9-11.4-20.9-19-33.75-25.16-25-12-51.65-18.4-78.78-23C558.52,684.74,513.94,682.83,469.26,682.5ZM383.5,389.86c1,11.78,1.58,23.6,3,35.32a178.07,178.07,0,0,0,4.84,24c10.64,39.94,33.24,60,72.16,62.46,39.11,2.43,67.94-13.22,81.51-52.5,9.63-27.85,11.93-56.79,7.84-85.82-3.8-26.92-16.6-49.06-40.58-63.43C495,299.51,476.06,297,456.38,299.32c-31.89,3.81-55.18,19.38-66.8,50.18C384.68,362.46,383.45,376,383.5,389.86Z" />
                            </g>
                        </g>
                    </svg>
                    -->
                <svg width="21" height="21" viewBox="0 0 938.36 854" xmlns="http://www.w3.org/2000/svg">
                    <g id="Layer_2" data-name="Layer 2">
                        <g id="Layer_1-2" data-name="Layer 1">
                            <path
                                d="M792.23,854h-646a16.5,16.5,0,0,0-2.64-1c-12.78-2.36-22.82-8.88-30-19.77-6.21-9.48-7-20-7-31.07q.25-204.24.1-408.47c0-1.72-.15-3.44-.27-6-2.71,2.11-4.67,3.59-6.58,5.12C89.56,401.07,79.38,409.42,69,417.5c-18.31,14.24-45.46,11.44-59.3-6-15-18.89-12.33-45,6.34-60.27,13-10.64,26.21-21.11,39.35-31.62Q242,170.43,428.5,21.16C440.21,11.79,451.55,2,467.23,0h4a62.83,62.83,0,0,1,28.6,13Q708.87,180.43,918,347.74a71.7,71.7,0,0,1,11.38,11.12c10.81,13.57,11.86,31.77,3.15,46.83a42,42,0,0,1-41.78,20.62c-10.21-1.23-18.4-6.27-26.13-12.58-10.53-8.59-21.22-17-32.88-26.28v7.38q0,203.43,0,406.87c0,1.83,0,3.67.1,5.5a44,44,0,0,1-27,42.8C800.8,851.68,796.45,852.68,792.23,854Zm-45.5-86v-5.45q.16-219,.42-438c0-3.76-1.2-6-4.08-8.31q-135.17-107.9-270.15-216c-2.66-2.13-4.32-2.44-7.17-.16Q331,208,196,315.72c-3,2.37-4.39,4.73-4.39,8.71q.17,219,.11,438c0,1.77.17,3.53.26,5.37H320.05V761q.09-113.74.2-227.49c.05-24,18.26-41.93,42.19-42.06,17-.09,34-.32,51-.31q80.74.09,161.49.31c25.46.05,43.27,17.89,43.32,43.48q.1,60.75.16,121.5,0,52.74,0,105.49v6ZM405.54,576.66V767.78H532.82V576.66Z" />
                        </g>
                    </g>
                </svg>
                <span>我的主页</span>
            </div>
            <div class="exit-btn" v-show="isUserHomeMode" @click="() => visitHome()">
                <svg width="17" height="17" viewBox="0 0 640.23 768.15" xmlns="http://www.w3.org/2000/svg">
                    <g id="Layer_2" data-name="Layer 2">
                        <g id="Layer_1-2" data-name="Layer 1">
                            <path
                                d="M512,85.7H85.8V682.57H512c0-2.09,0-4,0-6,.2-14.15-.46-28.39.81-42.45,1.89-20.83,20.72-36.7,41.89-36.75s40.69,15.86,41.85,36.66c1.27,23.06,2.24,46.53-.55,69.34-4.64,38-37.44,64.66-75.84,64.68q-221.51.1-443-.08a80.15,80.15,0,0,1-19.74-2.52C23,756.6.11,726.35.06,689.86Q-.09,585.61,0,481.37,0,280.63,0,79.88C0,43.63,20.56,14.09,53.67,4A92.41,92.41,0,0,1,80.21.28q207-.33,414-.12c12,0,24.12-.71,35.93.83,38.78,5.05,66,35.29,67.24,74.25.57,17.65.47,35.34,0,53-.57,23.31-16.68,40.19-39.7,42.42-20.07,1.94-39.48-12.22-44.31-32.66a61.57,61.57,0,0,1-1.32-13.37C511.91,111.81,512,99,512,85.7Z" />
                            <path
                                d="M489.48,340.39a36,36,0,0,1-4.44-3.26c-16.29-16.21-32.62-32.41-48.77-48.77-13.15-13.31-17.2-29.26-11.14-46.86s19.24-27.7,37.75-29.85c14.67-1.71,27.05,3.67,37.42,14.08q33.15,33.3,66.44,66.46l58,58c20.6,20.61,20.75,47.13.24,67.67q-62.33,62.44-124.79,124.75c-25.31,25.16-66,15.55-75.69-17.85-4.94-17.11-.68-32.28,11.9-44.94q23.43-23.58,47-47c1.27-1.27,2.49-2.6,4.85-5.06h-9.36q-131.46-.4-262.92-.81c-23.51-.08-40.64-14-44.58-36.25-4-22.64,12.66-46,35.54-48.39,11.87-1.25,24-.76,35.93-.73q121.21.33,242.43.79c1.09,0,2.18-.14,3.27-.21Z" />
                        </g>
                    </g>
                </svg>
            </div>
        </div>
        <div class="center" @scroll="onUserMouseWheel">
            <div class="platform-list">
                <div class="secondary-text" v-show="isSubtitleVisible()">
                    <span>音乐平台</span>
                </div>
                <ul>
                    <li v-for="(item, index) in activePlatforms()" 
                        @click="updatePlatformIndex(index)"
                        :class="{ active: (currentPlatformIndex == index)}" >
                        <span v-html="item.name"></span>
                    </li>
                </ul>
            </div>
            <div class="custom-playlist-list" v-show="isPlaylistMode && navigation.customPlaylistsShow">
                <div class="secondary-text">
                    <span>创建的歌单</span>
                    <svg class="add-custom-btn" @click="() => visitCustomPlaylistCreate()" width="11" height="11"
                        viewBox="0 0 682.65 682.74" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M298.59,384.15h-7.06q-123.24,0-246.49,0c-21.63,0-38.69-12.57-43.64-31.94-7-27.56,13.21-53.29,42.33-53.51,25.33-.18,50.66,0,76,0H298.59v-6.44q0-123.49,0-247c0-20.39,10.77-36.44,28.49-42.71C355-7.34,383.55,13,384,43.16c.26,16.33,0,32.67,0,49V298.65h6.82q123.49,0,247,0c21.52,0,38.61,12.77,43.43,32.19,6.75,27.26-13.06,52.7-41.62,53.25-11.16.22-22.33,0-33.49,0H384.09v6.69q0,123.5,0,247c0,21.59-12.66,38.65-32.06,43.53-27.59,6.95-53.24-13.31-53.39-42.46-.17-32.66,0-65.33,0-98V384.15Z" />
                            </g>
                        </g>
                    </svg>
                </div>
                <ul>
                    <li v-for="(item, index) in getCustomPlaylists"
                        :class="{ active: (activeCustomPlaylistIndex == index) }" @click="visitCustomItem(item, index)"
                        @contextmenu="(e) => onContextMenu(e, item, 3, index)" v-html="item.title">
                    </li>
                </ul>
            </div>
            <div class="favorite-playlist-list" v-show="isPlaylistMode && navigation.favoritePlaylistsShow">
                <div class="secondary-text">
                    <span>收藏的歌单</span>
                    <svg v-show="isFavoritePlaylistsCollapsed" class="expand-btn"
                        @click="setFavoritePlaylistsCollapsed(false)" width="11" height="11" viewBox="0 0 455.71 818.08"
                        xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <g id="Layer_2-2" data-name="Layer 2">
                                    <g id="Layer_1-2-2" data-name="Layer 1-2">
                                        <path
                                            d="M354.54,413c-2.89-1.94-5-2.89-6.47-4.41Q181.42,241.85,14.81,75.08C1.75,62-3.43,46.91,2.34,29.08,11.92-.46,49.26-9.71,71.91,11.71c7.87,7.44,15.35,15.29,23,23L440.49,380.64c20.22,20.24,20.29,45.1.22,65.21Q262.27,624.5,83.9,803.2c-9.12,9.14-19.48,15.07-32.63,14.88-17.18-.25-30.24-8-37.94-23.27C5.54,779.38,7.14,764.15,17.22,750a61.07,61.07,0,0,1,6.7-7.4q162.34-162.55,324.74-325C349.94,416.3,351.53,415.32,354.54,413Z" />
                                    </g>
                                </g>
                            </g>
                        </g>
                    </svg>
                    <svg v-show="!isFavoritePlaylistsCollapsed" class="collapse-btn"
                        @click="setFavoritePlaylistsCollapsed(true)" width="11" height="11" viewBox="0 0 763.32 424.57"
                        xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M380.47,322.11c27.6-27.5,54-53.68,80.23-80Q575,127.75,689.38,13.4C708.7-5.81,735-2.92,750.83,12.91c17,17,16.57,43.39-.9,60.87L414.1,409.61c-19.89,19.89-45,20-64.9.08Q180.9,241.45,12.66,73.15A42.53,42.53,0,1,1,72.85,13Q224.7,164.87,376.48,316.73A46.1,46.1,0,0,1,380.47,322.11Z" />
                            </g>
                        </g>
                    </svg>
                </div>
                <ul v-show="!isFavoritePlaylistsCollapsed">
                    <li v-for="(item, index) in getFavoritePlaylilsts()"
                        :class="{ active: (activeFavoritePlaylistIndex == index) }" @click="visitFavourteItem(item, index)"
                        @contextmenu="(e) => onContextMenu(e, item, 8, index)" v-html="item.title">
                    </li>
                </ul>
            </div>
            <div class="follow-artist-list" v-show="isArtistMode && navigation.followArtistsShow">
                <div class="secondary-text">
                    <span>关注的歌手</span>
                </div>
                <ul>
                    <li v-for="(item, index) in getFollowArtists()" :class="{ active0: (activeArtistIndex == index) }"
                        @click="visitArtistItem(item, index)" v-html="item.title">
                    </li>
                </ul>
            </div>
        </div>
        <div class="bottom" v-if="!hideBottom">
            <AppLogo ></AppLogo>
        </div>
    </div>
</template>

<style>
#main-left {
    width: var(--main-left-width);
    min-width: var(--main-left-width);
    max-width: calc(var(--main-left-width) * 1.25);
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    /*box-shadow: 0px 0px 3px var(--border-left-nav-border-color);*/
    border-right: 1px solid var(--border-left-nav-border-color);
    background: var(--content-left-nav-bg-color);
    --spacing-left: 25px;

    flex: 1;
}

#main-left ::-webkit-scrollbar-thumb {
    background: transparent;
    border: 1px solid transparent;
}

#main-left.user-mousewheel ::-webkit-scrollbar-thumb {
    background: var(--others-scrollbar-color);
    border: 1px solid var(--others-scrollbar-color);
}

#main-left .secondary-text {
    /*font-size: 13px;*/
    font-size: var(--content-text-tip-text-size);
    text-align: left;
    color: var(--content-secondary-text-color);
    /*padding-left: 22%;
    padding-left: 19.5%;*/
    padding-left: calc(var(--spacing-left) + 15px);
    margin-bottom: 10px;
    font-weight: 520;
}

#main-left .header,
#main-left .center,
#main-left .bottom {
    width: 100%;
}

#main-left .header {
    -webkit-app-region: drag;
    height: 68px;
    margin-bottom: 5px;
    display: flex;
    position: relative;
}

#main-left .header .win-traffic-light-btn {
    margin-top: 17px;
    margin-left: 20px;
    align-items: flex-start;
}

#main-left .header .top-left-navigator-wrap {
    position: absolute;
    right: 20px;
    top: 30px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
}

#main-left .center {
    flex: 1;
    padding-bottom: 36px;
    overflow: scroll;
    overflow-x: hidden;
}

#main-left .search-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 33px;
    margin-bottom: 15px;
}

#main-left .search-bar .keyword {
    width: 121px !important;
}

#explore-mode {
    width: 100%;
    margin-bottom: 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    /* color: var(--content-subtitle-text-color); */
}

#explore-mode svg,
#main-left .custom-playlist-list svg {
    fill: var(--content-subtitle-text-color);
    margin-right: 6px;
}

#explore-mode {
    position: relative;
}

#explore-mode .mode-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    cursor: pointer;
    font-size: var(--content-text-module-title2-size);
    font-weight: bold;
    color: var(--content-subtitle-text-color);
    /*margin-right: 23%;*/
    padding-left: var(--spacing-left);
    width: calc(100% - var(--spacing-left));
    height: 100%;
    margin-top: 3px;
    margin-bottom: 3px;
    overflow: hidden;
}

#explore-mode .mode-item:hover span {
    background: var(--content-text-highlight-color);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

#explore-mode .mode-item:hover svg {
    fill: var(--content-highlight-color);
}

#explore-mode .playlists-mode svg {
    transform: translateY(0.5px);
}

#explore-mode .radios-mode svg {
    transform: scale(0.96);
}

#explore-mode .userhome-mode svg {
    transform: translateY(-0.01px) scale(0.96);
}

/*
#explore-mode .cloud-storage-mode  svg {
    transform: rotateY(180deg);
}
*/

#explore-mode .exit-btn {
    position: absolute;
    /*top: 8px;*/
    right: 15px;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}

#explore-mode .exit-btn:hover svg {
    fill: var(--content-highlight-color);
    cursor: pointer;
}

#explore-mode .excluded-mode-item {
    cursor: default !important;
}

#explore-mode .excluded-mode-item:hover span {
    color: var(--content-subtitle-text-color) !important;
}

#explore-mode .excluded-mode-item:hover svg {
    fill: var(--content-subtitle-text-color) !important;
}

#main-left .custom-playlist-list,
#main-left .favorite-playlist-list,
#main-left .follow-artist-list {
    margin-top: 36px;
    position: relative;
}

#main-left .center .add-custom-btn,
#main-left .center .collapse-btn,
#main-left .center .expand-btn {
    fill: var(--content-subtitle-text-color);
    cursor: pointer;
    position: absolute;
    /* right: 15px; */
    right: 19px;
    top: 4px;
}

#main-left .center .collapse-btn,
#main-left .center .expand-btn {
    /* right: 22px; */
    right: 26px;
}

#main-left .center .add-custom-btn:hover {
    fill: var(--content-highlight-color);
}

#main-left ul {
    list-style: none;
    text-align: left;
    width: 100%;
    line-height: var(--content-left-nav-line-height);
}

#main-left li {
    text-decoration: none;
    padding-left: 20px;
    padding-right: 20px;
    margin-left: calc(var(--spacing-left) - 3px);
    margin-right: calc(var(--spacing-left) - 3px);
    margin-bottom: var(--content-left-nav-line-spacing);

    width: 60%;
    width: 128px;
    width: calc(100% - var(--spacing-left) * 2 - 36px + var(--others-scrollbar-width));

    cursor: pointer;
    border-radius: var(--border-list-item-vertical-border-radius);
    
    text-align: left;
    overflow: hidden;
    word-wrap: break-all;
    white-space: pre-wrap;
    line-break: anywhere;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    word-wrap: break-word;
    line-break: anywhere;
}

#main-left li:hover {
    background: var(--content-list-item-hover-bg-color);
}

#main-left .custom-playlist-list li,
#main-left .favorite-playlist-list li {
    font-size: var(--content-text-subtitle-size);
}

/*
#main-left .favorite-playlist-list li {
    padding-left: 15px;
    padding-right: 15px;
    width: 138px;
}
*/

#main-left .active {
    background: var(--button-icon-text-btn-bg-color) !important;
    color: var(--button-icon-text-btn-icon-color);
}

.contrast-mode #main-left .platform-list .active,
.contrast-mode #main-left .custom-playlist-list .active {
    font-weight: bold;
}

#main-left li.drag-target,
#main-left li.drag-over-mark {
    background: var(--content-list-item-hover-bg-color);
}

#main-left .bottom {
    height: 60px;
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    justify-content: flex-start;
    /*margin-right: 23px;*/
    padding-bottom: 18px;
    padding-left: calc(var(--spacing-left) + 18px);
    overflow: hidden;
}
</style>