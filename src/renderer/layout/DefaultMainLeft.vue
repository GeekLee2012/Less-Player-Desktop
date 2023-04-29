<script setup>
import { storeToRefs } from 'pinia'
import { usePlatformStore } from '../store/platformStore';
import WinTrafficLightBtn from '../components/WinTrafficLightBtn.vue';
import { useAppCommonStore } from '../store/appCommonStore';
import EventBus from '../../common/EventBus';
import { useUseCustomTrafficLight } from '../../common/Utils';
import path from 'path';
import { useUserProfileStore } from '../store/userProfileStore';
import { inject, ref } from 'vue';
import { useSettingStore } from '../store/settingStore';



const { visitRoute, visitArtist, visitHome,
    visitFavoritePlaylist, visitCustomPlaylist,
    visitCustomPlaylistCreate, } = inject('appRoute')

//是否使用自定义交通灯控件
const useCustomTrafficLight = useUseCustomTrafficLight()

const { platforms, currentPlatformIndex,
    currentPlatformCode } = storeToRefs(usePlatformStore())
const { updateCurrentPlatform, isLocalMusic } = usePlatformStore()
const { isPlaylistMode, isArtistMode, isRadioMode, isUserHomeMode,
    exploreModeCode, exitToHomeBtnShow } = storeToRefs(useAppCommonStore())
const { nextExploreMode, setPlaylistExploreMode, setRadioExploreMode } = useAppCommonStore()
const { getCustomPlaylists, getFavoritePlaylilsts, getFollowArtists } = storeToRefs(useUserProfileStore())
const { navigation } = storeToRefs(useSettingStore())

const activeCustomPlaylistIndex = ref(-1)
const activeFavoritePlaylistIndex = ref(-1)
const activeArtistIndex = ref(-1)
const isFavoritePlaylistsCollapsed = ref(false)

let isUserMouseWheel = ref(false), userMouseWheelCancelTimer = null

//TODO
const updatePlatformIndex = (index, isSwitchMode) => {
    updateCurrentPlatform(index)
    activeCustomPlaylistIndex.value = -1
    activeArtistIndex.value = -1

    const platform = currentPlatformCode.value
    const exploreMode = exploreModeCode.value
    let path = null
    if (isLocalMusic(platform)) {
        path = `/${platform}`
    } else if (isUserHomeMode.value && isSwitchMode) {
        path = `/${exploreMode}/${platform}`
    } else if (isPlaylistMode.value || isArtistMode.value || isRadioMode.value) {
        path = `/${exploreMode}/square/${platform}`
    }
    visitRoute(path)
}

const switchExploreMode = () => {
    nextExploreMode()
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

const visitCustomItem = (item, index) => {
    activeCustomPlaylistIndex.value = index
    updateCurrentPlatform(-1)
    visitCustomPlaylist(item.id)
}

const showContextMenu = (item, index, event, dataType) => {
    event.preventDefault()
    EventBus.emit("commonCtxMenu-init", dataType)
    EventBus.emit("commonCtxMenu-show", { event, value: item })
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
    if (isPlaylistMode.value) {
        return navigation.value.customPlaylistsShow
            || navigation.value.favoritePlaylistsShow
    } else if (isArtistMode.value) {
        return navigation.value.followArtistsShow
    }
    return false
}

EventBus.on("navigation-refreshCustomPlaylistIndex", (index) => {
    activeCustomPlaylistIndex.value = index
})

EventBus.on("toggleRadioMode", toggleRadioMode)
</script>

<template>
    <div id="main-left" :class="{ mousewheelViewpoint: isUserMouseWheel }">
        <div class="header">
            <WinTrafficLightBtn v-show="useCustomTrafficLight"></WinTrafficLightBtn>
        </div>
        <div class="center" @scroll="onUserMouseWheel">
            <div id="explore-mode">
                <div class="mode-item" v-show="isPlaylistMode" @click="switchExploreMode">
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
                    <span>分类歌单</span>
                </div>
                <div class="mode-item" v-show="isArtistMode" @click="switchExploreMode">
                    <svg width="16" height="16" viewBox="0 0 810 854.54" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M385,0c117.88.3,213.35,96.08,213,213.66-.38,118.12-95.71,213.26-213.49,213.07s-213.49-96.16-213-213.58C172,95,267.43-.3,385,0Zm-.58,341.47c70.36.28,127.94-56.94,128.31-127.5a128,128,0,1,0-256-.64C256.5,283.64,313.83,341.19,384.37,341.47Z" />
                                <path
                                    d="M640.7,682.51v-20q0-74,0-148c0-19.27,8.52-33,25.74-41.6,27.27-13.56,54.42-27.36,81.76-40.78,25.87-12.7,55.2,1.93,61,30.15,3.72,18-5.84,37.41-22.29,45.6-18.92,9.41-37.7,19.1-56.66,28.43-3.37,1.66-4.38,3.6-4.38,7.23q.17,107.74.09,215.48c0,46.09-36,88-81.81,93.46-20.79,2.51-42,3.79-62.43-2.85-38.64-12.58-61.61-39.33-68.54-79.37-.83-4.8.79-10.24,2.08-15.17a97.51,97.51,0,0,1,100-72.67C623.48,682.9,631.8,682.51,640.7,682.51Z" />
                                <path
                                    d="M312.19,512q56.49,0,113,0c21.61,0,38.67,12.73,43.48,32.1,6.92,27.84-13.42,53.25-43,53.34-46.49.15-93,0-139.46,0-25.33,0-50.66-.34-76,.16-65,1.29-119.65,52.93-123.4,117.82-1.79,30.89-.74,61.95-.8,92.94,0,9.06-1.78,17.5-6.67,25.2a42.56,42.56,0,0,1-47,18.26C14.33,847,1,831.09.85,812.66c-.32-32.49-1.95-65.13.39-97.45,6.53-89.82,52.23-152.77,135-188.31,25.72-11,53.08-14.93,81-14.92Z" />
                            </g>
                        </g>
                    </svg>
                    <span>万千歌手</span>
                </div>
                <div class="mode-item" v-show="isRadioMode" @click="switchExploreMode">
                    <svg width="16" height="16" viewBox="0 0 938.74 981.44" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M476.39,0c2.69.76,5.42,1.39,8.05,2.3,15.69,5.44,24.48,16.58,26.93,32.87.36,2.44.54,4.9.74,6.72,19.41,3.54,38.41,6.19,57,10.54,89.44,21,167,63.79,231.84,128.85Q901.73,282.38,930.06,422.6a457.13,457.13,0,0,1,6.63,132.33c-8.77,95-42.81,180-103.22,253.84C764,893.67,675.19,947.59,568,971a458.45,458.45,0,0,1-135.68,8.85c-95.93-7.8-182.07-41.18-257.07-101.65C91,810.29,36.65,723.19,12,617.79A458.55,458.55,0,0,1,2.16,468.84q15.36-160.9,125-279.8a141.26,141.26,0,0,1,12.76-12.67c17.46-14.54,41.38-12.8,57.2,3.9,15.55,16.4,16,40.21.56,56.92C176.56,260,157.38,284.28,141.38,311c-32.6,54.38-52.25,113-55.11,176.48-6.33,140.25,46.51,253.29,159.28,337.22,48.09,35.8,102.71,57.63,162,66.42,115.51,17.11,219.49-10.11,309.52-85,69.49-57.79,113-132.06,129.3-221,21.42-116.61-4.79-222.22-79.63-314.37C708.56,199.1,633,154.88,542.32,136.88c-9.76-1.93-19.64-3.26-30-4.95-.12,2.3-.29,3.91-.29,5.53,0,25,.06,50-.09,75,0,3.76.71,5.37,4.89,6.08,64.95,10.95,120.84,39.69,166.78,86.88s73.68,103.63,81.87,169.15C782.08,607.09,712.18,731.52,591,785.29,543.07,806.54,492.8,814,440.65,809.23c-122.58-11.14-225.82-95.79-258.23-214.55-26.87-98.47-8.66-188.69,56-268.56,7.1-8.77,15.29-16.75,23.6-24.42,17.27-16,41.35-15.18,57.95,1.36,16.29,16.24,16.87,40.17,1.78,57.75-10.62,12.37-21.91,24.37-31,37.83-64.85,96.2-35.88,231.45,62.36,293.25,81.32,51.16,186.61,43.78,257.88-19.28,50.35-44.53,74-101.58,71.36-168.5C679.45,431.33,646,374.85,586,334c-21.68-14.78-45.68-24.54-71.23-30.47-.63-.15-1.29-.2-2.72-.4v5c0,26.67.06,53.33-.07,80,0,3.33.9,4.87,4.17,6.11,54.13,20.41,86.3,72.77,80.48,130.68-6.08,60.45-49,105.34-108.77,113.87-68.74,9.81-130-33.16-144-100.95-12.52-60.81,19.74-120.7,77.31-143,4.64-1.79,5.64-4.1,5.64-8.66q-.18-169.76-.05-339.53a68.62,68.62,0,0,1,1.15-14.41C431.67,15,442.41,4.62,459.68,1a19.65,19.65,0,0,0,2.71-1ZM426.58,511.42c-.47,25.28,16.56,42.86,42.07,43.44,25.24.57,42.93-16.47,43.55-42,.61-25.27-16.39-43-41.82-43.65S427.06,485.74,426.58,511.42Z" />
                            </g>
                        </g>
                    </svg>
                    <span>相约电波</span>
                </div>
                <div class="mode-item excluded-mode-item" v-show="isUserHomeMode" @click="">
                    <svg width="17" height="17" viewBox="0 0 938.47 938.5" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M0,469C.33,209.53,210.36-.32,469.38,0,729.05.32,939.22,210.78,938.47,469.76c-.76,259.7-211.12,469.66-469.63,468.74C208.87,937.57-.33,728.06,0,469Zm453.81,128,.12-.34-1.95-.2c-53.39-5.09-94.44-29.95-122-76.3-14.75-24.84-23-52-27.21-80.35-4.62-31.1-6.87-62.34-.49-93.46,10.07-49.16,36-87.34,80.26-111.88,32.13-17.8,67-23.53,103.32-20.28,46.06,4.12,84.22,23.72,113.49,59.63,24.9,30.54,37.7,66,39.88,105.16,2.3,41.55-2.47,82.21-19,120.79-19.26,44.86-51.57,75.78-98.75,90.18a171.59,171.59,0,0,1-18,4.28c-6,1.14-12.07,1.77-19.36,2.8,2.76.19,4.26.35,5.75.38,39.17.82,78.23,3.08,117,8.94,33.49,5.07,66.42,12.41,97.94,25.1,27.78,11.19,53.28,25.93,73.53,48.57,2.16,2.43,4.24,4.93,6.42,7.46,100.84-141.58,96.84-361.06-57.33-502.35C576.61,46.82,340.65,52.88,196.73,198.77,51.56,345.94,60.23,558.41,153.79,687.36c2.07-2.44,4.06-4.88,6.15-7.22,23.12-25.8,52.64-41.45,84.68-52.86,50.51-18,103.12-24.68,156.28-28C418.51,598.18,436.17,597.7,453.81,596.94Zm15.45,85.56c-55,0-99.89,3.54-143.71,11.75C299.3,699.17,273.61,706,250,719c-13.9,7.67-26.18,17.11-33.23,32-1.83,3.88-1.62,6.33,1.92,9.29,86,71.89,184.71,102.35,296.12,90,74.25-8.24,140.09-37.15,198-84.26,12.85-10.45,12.94-12.24,2.41-25.61-9-11.4-20.9-19-33.75-25.16-25-12-51.65-18.4-78.78-23C558.52,684.74,513.94,682.83,469.26,682.5ZM383.5,389.86c1,11.78,1.58,23.6,3,35.32a178.07,178.07,0,0,0,4.84,24c10.64,39.94,33.24,60,72.16,62.46,39.11,2.43,67.94-13.22,81.51-52.5,9.63-27.85,11.93-56.79,7.84-85.82-3.8-26.92-16.6-49.06-40.58-63.43C495,299.51,476.06,297,456.38,299.32c-31.89,3.81-55.18,19.38-66.8,50.18C384.68,362.46,383.45,376,383.5,389.86Z" />
                            </g>
                        </g>
                    </svg>
                    <span>我的主页</span>
                </div>
                <div class="exit-btn" v-show="isUserHomeMode" @click="() => visitHome()">
                    <svg width="15" height="15" viewBox="0 0 640.23 768.15" xmlns="http://www.w3.org/2000/svg">
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
            <div id="platform-list">
                <div class="subtitle" v-show="isSubtitleVisible()">
                    <span>音乐平台</span>
                </div>
                <ul>
                    <li v-for="(item, index) in platforms()" :class="{ active: (currentPlatformIndex == index) }"
                        @click="updatePlatformIndex(index)" v-html="item.name">
                    </li>
                </ul>
            </div>
            <div id="custom-playlist-list" v-show="isPlaylistMode && navigation.customPlaylistsShow">
                <div class="subtitle">
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
                        @contextmenu="(e) => showContextMenu(item, index, e, 3)" v-html="item.title">
                    </li>
                </ul>
            </div>
            <div id="favorite-playlist-list" v-show="isPlaylistMode && navigation.favoritePlaylistsShow">
                <div class="subtitle">
                    <span>收藏的歌单</span>
                    <!--
                                                                                                                    <svg v-show="isFavoritePlaylistsCollapsed" class="expand-btn" @click="setFavoritePlaylistsCollapsed(false)" width="11" height="11" viewBox="0 0 763.32 424.57" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M380.47,322.11c27.6-27.5,54-53.68,80.23-80Q575,127.75,689.38,13.4C708.7-5.81,735-2.92,750.83,12.91c17,17,16.57,43.39-.9,60.87L414.1,409.61c-19.89,19.89-45,20-64.9.08Q180.9,241.45,12.66,73.15A42.53,42.53,0,1,1,72.85,13Q224.7,164.87,376.48,316.73A46.1,46.1,0,0,1,380.47,322.11Z"/></g></g></svg>
                                                                                                                    <svg v-show="!isFavoritePlaylistsCollapsed" class="collapse-btn" @click="setFavoritePlaylistsCollapsed(true)" width="11" height="11" viewBox="0 0 640.13 352.15" xmlns="http://www.w3.org/2000/svg" ><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><g id="Layer_2-2" data-name="Layer 2"><g id="Layer_1-2-2" data-name="Layer 1-2"><path d="M319.64,76.3c-1.91,2.59-3,4.52-4.51,6Q186,211.6,56.78,340.8c-8.31,8.34-17.87,12.87-29.65,10.88-12.51-2.12-21.24-9.34-25.29-21.48-4.12-12.35-1.23-23.43,7.71-32.7C19.73,287,30.24,276.72,40.61,266.35L289.12,17.84c2.94-2.94,5.74-6,8.75-8.91a32.1,32.1,0,0,1,44.28-.15c3.15,3,6.05,6.2,9.11,9.26Q490,156.79,628.78,295.5c10.11,10.1,14.13,21.64,9.33,35.44a31.75,31.75,0,0,1-48.49,15.2,58.8,58.8,0,0,1-7.07-6.31Q453.85,211.22,325.2,82.51C323.68,81,322.32,79.3,319.64,76.3Z"/></g></g></g></g></svg>
                                                                                                                    -->
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
                        @contextmenu="(e) => showContextMenu(item, index, e, 8)" v-html="item.title">
                    </li>
                </ul>
            </div>
            <div id="follow-artist-list" v-show="isArtistMode && navigation.followArtistsShow">
                <div class="subtitle">
                    <span>关注的歌手</span>
                </div>
                <ul>
                    <li v-for="(item, index) in getFollowArtists()" :class="{ active0: (activeArtistIndex == index) }"
                        @click="visitArtistItem(item, index)" v-html="item.title">
                    </li>
                </ul>
            </div>
        </div>
        <div class="bottom">
            <div id="app-logo">
                <span>L</span>
            </div>
            <div id="app-name">Less Player</div>
        </div>
    </div>
</template>

<style>
#main-left {
    width: 211px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-shadow: 0px 0px 3px var(--main-left-border-color);
    background: var(--main-left-bg);
}

#main-left ::-webkit-scrollbar-thumb {
    background: transparent;
    border: 1px solid transparent;
}

.mousewheelViewpoint ::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb-bg) !important;
    border: 1px solid var(--scrollbar-thumb-bg) !important;
}

#main-left .subtitle {
    /*font-size: 13px;*/
    font-size: var(--tip-text-size);
    text-align: left;
    color: var(--text-subtitle-color);
    padding-left: 22%;
    padding-left: 19.5%;
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
    height: 72px;
    margin-bottom: 8px;
    display: flex;
}

#main-left .header .win-traffic-light-btn {
    margin-top: 17px;
    margin-left: 20px;
}

#main-left .header .logo-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    left: 16%;
    top: 60px;
    display: none;
}

#main-left .center {
    flex: 1;
    padding-bottom: 36px;
    overflow: scroll;
}

#explore-mode {
    margin-bottom: 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    /* color: var(--text-sub-color); */
}

#explore-mode svg,
#custom-playlist-list svg {
    fill: var(--text-sub-color);
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
    padding: 3px 6px;
    /*font-size: 19px;*/
    font-size: var(--text-main4-title-size);
    font-weight: bold;
    color: var(--text-sub-color);
    margin-right: 23%;
}

#explore-mode .mode-item:hover span {
    color: var(--hl-title-color);
}

#explore-mode .mode-item:hover svg {
    fill: var(--svg-hover-color);
}

#explore-mode .exit-btn {
    position: absolute;
    top: 8px;
    right: 20px;
}

#explore-mode .exit-btn:hover svg {
    fill: var(--svg-hover-color);
    cursor: pointer;
}

#explore-mode .excluded-mode-item {
    cursor: default !important;
}

#explore-mode .excluded-mode-item:hover span {
    color: var(--text-sub-color) !important;
}

#explore-mode .excluded-mode-item:hover svg {
    fill: var(--svg-color) !important;
}

#custom-playlist-list,
#favorite-playlist-list,
#follow-artist-list {
    margin-top: 36px;
    position: relative;
}

#main-left .center .add-custom-btn,
#main-left .center .collapse-btn,
#main-left .center .expand-btn {
    fill: var(--text-sub-color);
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
    fill: var(--hl-color);
}

#main-left ul {
    list-style: none;
    text-align: left;
    line-height: var(--main-left-nav-line-height);
    padding-left: 13%;
    padding-left: 10%;
}

#main-left li {
    text-decoration: none;
    width: 60%;
    width: 128px;
    margin-bottom: 10.5px;
    padding-left: 20px;
    padding-right: 20px;
    cursor: pointer;
    border-radius: 5px;
    text-align: left;
    overflow: hidden;
    word-wrap: break-all;
    white-space: pre-wrap;
    line-break: anywhere;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
}

#main-left li:hover {
    background: var(--list-item-hover);
}

#favorite-playlist-list li {
    padding-left: 15px;
    padding-right: 15px;
    /* width: 127px; */
    width: 138px;
}

#main-left .active {
    background: var(--list-item-active-bg) !important;
    color: var(--svg-btn-color);
}

#main-left .bottom {
    height: 72px;
    height: 60px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin-right: 22px;
}

#app-logo {
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10rem 0 10rem 10rem;
    border: 0px solid;
    font-weight: bold;
    background: var(--logo-bg);
    /*color: var(--logo-color);*/
}

#app-logo span {
    width: 16px;
    height: 16px;
    line-height: 16px;
    font-size: 13px;
    justify-content: center;
    border-radius: 10rem;
    background: var(--logo-text-bg);
    color: var(--logo-text-color);
}

#app-name {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 10px;
    font-size: 18px;
    font-weight: bold;
    background: var(--logo-bg);
    -webkit-background-clip: text;
    color: transparent;
}
</style>