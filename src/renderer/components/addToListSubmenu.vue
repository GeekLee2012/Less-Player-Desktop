<script setup>
import { storeToRefs } from 'pinia';
import { inject, onMounted, reactive, toRaw } from 'vue';
import EventBus from '../../common/EventBus';
import { Playlist } from '../../common/Playlist';
import { useAppCommonStore } from '../store/appCommonStore';
import { usePlayStore } from '../store/playStore';
import { useUserProfileStore } from '../store/userProfileStore';
import CommonContextSubmenu from './CommonContextSubmenu.vue';


const { visitCustomPlaylistCreate } = inject('appRoute')

const props = defineProps({
    posStyle: Object
})

const { queueTracks } = storeToRefs(usePlayStore())
const { addTrack } = usePlayStore()
const { commonCtxItem, commonCtxMenuCacheItem } = storeToRefs(useAppCommonStore())
const { showToast, hideAllCtxMenus, setCommonNotificationType, hidePlaybackQueueView } = useAppCommonStore()
const { customPlaylists } = storeToRefs(useUserProfileStore())
const { addToCustomPlaylist, moveToCustomPlaylist } = useUserProfileStore()
const customData = reactive([])

const toastAndHideMenu = (text) => {
    showToast(text)
    hideAllCtxMenus()
}

const addToQueue = () => {
    addTrack(commonCtxMenuCacheItem.value)
    toastAndHideMenu("歌曲已添加成功！")
}

const createCustom = () => {
    visitCustomPlaylistCreate('userhome')
    hidePlaybackQueueView()
}

const MenuItems = {
    sp: {
        separator: true
    },
    playbackQueue: {
        name: '当前播放',
        icon: '<svg width="13" height="13" viewBox="0 0 682.28 597.06" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M597.41,348.87v-7.12q0-148.73,0-297.45c0-21.61,12.87-38.33,33-43.16,25.6-6.14,51,13.32,51.67,39.64.14,5.33.07,10.66.07,16,0,136.81.29,273.62-.14,410.42-.17,54.89-25.81,95.18-75.43,118.3-76.43,35.63-167.21-14.9-178.41-98.26C418.79,417.15,465.4,354,535,342.85a119,119,0,0,1,56.75,4.31C593.32,347.67,594.9,348.11,597.41,348.87Z"/><path d="M255.64,84.82q-104.73,0-209.46.06c-13.1,0-24.79-3.21-33.93-12.94C.19,59.1-3.13,44,3,27.57S21.6,2,39.19.34c2.65-.25,5.32-.29,8-.29Q255.89,0,464.6,0c9.48,0,18.54,1.16,26.81,6.3,15.55,9.68,23.33,28.26,19,45.77-4.53,18.37-19.25,31-37.85,32.44-3.15.24-6.32.29-9.48.29Q359.36,84.84,255.64,84.82Z"/><path d="M234.76,255.4q-95.46,0-190.92,0c-21.35,0-38.21-13.2-42.57-32.94A42.4,42.4,0,0,1,41,170.69c1.33-.06,2.66-.07,4-.07q189.66,0,379.33,0c21.48,0,38,12.15,43.2,31.67,7.08,26.38-12.46,52.85-39.81,53-64.3.27-128.61.09-192.91.09Z"/><path d="M170.39,341.48c42.81,0,85.62-.11,128.42,0,21.15.08,38,14.74,41.44,35.38a42.3,42.3,0,0,1-40.09,49.26c-1.33.07-2.67.07-4,.07q-125.67,0-251.35,0C24.12,426.22,8,414.9,2.16,396.47c-8.51-26.86,11.14-54.69,39.31-54.89,43-.3,85.94-.08,128.92-.08Z"/><path d="M170.48,596.82c-41.64,0-83.28-.08-124.92,0-17.84,0-31.81-6.75-40.39-22.64-14.51-26.86,3.62-59.55,34.07-61.89,2.32-.18,4.66-.28,7-.28q124.41,0,248.84-.06c18.44,0,32.79,6.84,41.31,23.55,13.68,26.81-4.47,58.93-34.5,60.88-12.44.81-25,.37-37.46.39Q217.46,596.87,170.48,596.82Z"/></g></g></svg>',
        action: addToQueue,
    },
    create: {
        name: '新建歌单',
        icon: '<svg width="16" height="16" viewBox="0 0 768.02 554.57" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M341.9,0q148,0,296,0C659,0,675,11.28,680.8,30.05c8.34,26.78-11.43,54.43-39.45,55.18-1.17,0-2.33,0-3.5,0q-296.46,0-592.93,0C22.37,85.25,5.32,71.87.87,50.78-4.36,26,14.59,1.39,39.94.12c2.49-.13,5-.11,7.5-.11Z"/><path d="M554.64,426.5h-6.72c-26.49,0-53,.17-79.47-.1a41.87,41.87,0,0,1-39.06-27.7,42.4,42.4,0,0,1,11.2-46.19,41.85,41.85,0,0,1,29.11-11.25q39.49,0,79,0h6V335c0-26-.12-52,0-78,.15-25.3,19.44-44.3,44.06-43.72,23.23.55,41.24,19.54,41.37,43.92.13,25.82,0,51.65,0,77.48v6.57h5.67c26.65,0,53.31-.11,80,.05,20.38.12,37.94,14.9,41.51,34.49,3.74,20.57-7.15,40.65-26.59,47.73a53.72,53.72,0,0,1-17.56,2.85c-25.66.3-51.32.13-77,.13h-6v6.36c0,26,.1,52,0,78-.11,20.74-13.1,37.68-32.17,42.41-27.42,6.8-53-13.28-53.24-42.11-.22-26-.05-52-.05-78Z"/><path d="M234.37,256q-94.73,0-189.44,0c-21.55,0-38.62-12.68-43.5-32.09-6.74-26.8,12.45-52.1,40.47-53.35,1.33-.06,2.67-.05,4-.05H423.78c21.17,0,37.53,11.12,43.49,29.46,9.15,28.13-11.52,55.87-42,56-36.32.15-72.64,0-109,0Z"/><path d="M170.91,426.5c-42.48,0-85,.07-127.45,0-20.94-.06-37.61-13.2-42.21-32.85-6.18-26.41,13.5-52,40.6-52.3,23.82-.27,47.65-.07,71.47-.07q92.46,0,184.93,0c24.55,0,43.52,19.37,43.12,43.58-.38,23.41-19.15,41.53-43.51,41.61-40,.12-80,0-120,0Z"/></g></g></svg>',
        action: createCustom,
    },
}


const handleClick = (item, mode) => {
    const track = commonCtxMenuCacheItem.value
    let text = "歌曲已添加成功！"
    if (mode < 3 && Playlist.isFMRadioType(track)) {
        text = "FM电台无法加入歌单！"
        setCommonNotificationType(1)
        toastAndHideMenu(text)
        return
    }
    let success = false
    if (mode == 1) {
        const { id } = commonCtxItem.value
        success = moveToCustomPlaylist(item.id, id, track)
        text = "歌曲已移动成功！"
    } else if (mode == 2) {
        success = addToCustomPlaylist(item.id, track)
    } else if (mode == 3) { //添加当前播放列表
        //TODO 暂时先简单处理，不考虑异常情况
        const queue = toRaw(queueTracks.value)
        queue.forEach(qItem => {
            if (Playlist.isFMRadioType(qItem)) return
            addToCustomPlaylist(item.id, qItem)
        })
        success = true
        text = "全部歌曲已添加成功！"
    }
    text = success ? text : "歌曲已存在！"
    setCommonNotificationType(success ? 0 : 1)
    toastAndHideMenu(text)
}

const initData = (mode) => {
    customData.length = 0
    const fixedItems = [MenuItems.playbackQueue, MenuItems.create]
    if (mode >= 1) { //移动模式 或 其他无当前播放的模式
        customData.push(fixedItems[1])
    } else {
        customData.push(...fixedItems)
    }
    customPlaylists.value.forEach(item => {
        customData.push({
            name: item.title,
            action: (event) => handleClick(item, mode),
        })
    })
}

onMounted(() => initData())

EventBus.on("addToListSubmenu-init", (mode) => initData(mode))
</script>

<template>
    <CommonContextSubmenu :data="customData" :posStyle="posStyle">
    </CommonContextSubmenu>
</template>

<style></style>