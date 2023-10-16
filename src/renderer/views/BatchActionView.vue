<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'BatchActionView'
}
</script>

<script setup>
import { storeToRefs } from 'pinia';
import { inject, onMounted, onUnmounted, reactive, ref, shallowRef, toRaw, watch } from 'vue';
import EventBus from '../../common/EventBus';
import Mousetrap from 'mousetrap';
import { useAppCommonStore } from '../store/appCommonStore';
import { usePlatformStore } from '../store/platformStore';
import { usePlayStore } from '../store/playStore';
import { useUserProfileStore } from '../store/userProfileStore';
import { useRecentsStore } from '../store/recentsStore';
import { useLocalMusicStore } from '../store/localMusicStore';
import { useFreeFMStore } from '../store/freeFMStore';
import { useSettingStore } from '../store/settingStore';
import AlbumListControl from '../components/AlbumListControl.vue';
import PlaylistsControl from '../components/PlaylistsControl.vue';
import SongListControl from '../components/SongListControl.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import { useIpcRenderer } from '../../common/Utils';
import { toYyyymmddHhMmSs } from '../../common/Times';




const props = defineProps({
    source: String, //数据源，所属功能/模块
    id: String //记录ID
})


const { currentRoutePath, backward } = inject('appRoute')
const { showConfirm } = inject('appCommon')
const ipcRenderer = useIpcRenderer()

const { getFavoriteSongs, getFavoritePlaylilsts,
    getFavoriteAlbums, getFavoriteRadios, } = storeToRefs(useUserProfileStore())
const { removeFavoriteSong, removeFavoritePlaylist,
    removeFavoriteAlbum, removeFavoriteRadio,
    getCustomPlaylist, removeFromCustomPlaylist } = useUserProfileStore()
const { addTracks, playTrack } = usePlayStore()
const { commonCtxMenuShow, commonCtxItem, searchBarExclusiveAction } = storeToRefs(useAppCommonStore())
const { showToast, updateCommonCtxItem,
    hideAllCtxMenus, setSearchBarExclusiveAction,
    showPlaylistExportToolbar, updateCommonCtxMenuCacheItem } = useAppCommonStore()
const { currentPlatformCode } = storeToRefs(usePlatformStore())
const { updateCurrentPlatform } = usePlatformStore()
const { localPlaylists } = storeToRefs(useLocalMusicStore())
const { getLocalPlaylist, removeFromLocalPlaylist, removeLocalPlaylist } = useLocalMusicStore()
const { freeRadios } = storeToRefs(useFreeFMStore())
const { removeFreeRadio } = useFreeFMStore()
const { isSearchForBatchActionShow, isShowDialogBeforeBatchDelete } = storeToRefs(useSettingStore())
const { getRecentSongs, getRecentPlaylilsts,
    getRecentAlbums, getRecentRadios } = storeToRefs(useRecentsStore())
const { removeRecentSong, removeRecentPlaylist,
    removeRecentAlbum, removeRecentRadio, } = useRecentsStore()


const isFavorites = () => props.source == "favorites"
const isRecents = () => props.source == "recents"
const isCustomPlaylist = () => props.source == "custom"
const isLocalMusic = () => props.source == "local"
const isFreeFM = () => props.source == "freefm"

const typeTabs = [{
    code: 'songs',
    name: '歌曲',
    text: '已选择0首歌曲'
},
{
    code: 'playlists',
    name: '歌单',
    text: '已选择0个歌单'
},
{
    code: 'albums',
    name: '专辑',
    text: '已选择0张专辑'
},
{
    code: 'radios',
    name: 'FM电台',
    text: '已选择0个FM电台'
}]

const title = ref("")
const subtitle = ref("")
const activeTab = ref(0)
const tabTipText = ref("")
const currentTabView = shallowRef(null)
const tabData = reactive([])
const searchKeyword = ref(null)
const setSearchKeyword = (value) => searchKeyword.value = value

//TODO
const actionShowCtl = reactive({
    playBtn: false,
    addToBtn: false,
    moveToBtn: false,
    addToQueueBtn: false,
    deleteBtn: true,
    exportBtn: false
})
const checkedData = reactive([])
const checkedAll = ref(false)
const ignoreCheckAllEvent = ref(false)
const sourceItem = reactive({})

const updateTitle = () => {
    let text = "", subtext = ""
    if (isFavorites()) text = "我的收藏"
    if (isRecents()) text = "最近播放"
    if (isCustomPlaylist()) {
        text = "创建的歌单"
        subtext = sourceItem.title
    }
    if (isLocalMusic()) {
        text = "本地歌曲"
        subtext = sourceItem.title
    }
    if (isFreeFM()) {
        text = "自由FM"
    }
    title.value = text
    subtitle.value = subtext
}

const isTabsVisible = (tab, index) => {
    if (isFavorites()) return true
    if (isRecents()) return true
    if (isCustomPlaylist() && index == 0) return true
    if (isLocalMusic() && props.id !== '0' && index == 0) return true
    if (isLocalMusic() && props.id === '0' && index == 1) return true
    if (isFreeFM() && props.id === '0' && index == 3) return true
    return false
}

const getFirstVisibleTabIndex = () => {
    if (isLocalMusic() && props.id === '0') {
        return 1
    } else if (isFreeFM()) {
        return 3
    }
    return 0
}

//shift快速选择功能，当前区间边界Index
let shiftRangeCurrentIndex = -1
const fastSelectByShiftKey = (item) => {
    if (!shiftPressed.value) return
    const { index } = item
    if (shiftRangeCurrentIndex < 0) {
        checkedData.push(item)
    } else {
        const start = Math.min(shiftRangeCurrentIndex, index)
        const end = Math.max(shiftRangeCurrentIndex, index) + 1
        const rangeData = tabData.slice(start, end)
        for (var i = start; i < end; i++) {
            if (i === shiftRangeCurrentIndex) continue
            checkedData.push({
                index: i,
                ...rangeData[i]
            })
        }
    }
    shiftRangeCurrentIndex = index
}

const onCheckChanged = (checked, item) => {
    if (checked) {
        checkedData.push(item)
    } else {
        const index = checkedData.findIndex(e => (item.id == e.id && item.platform == e.platform))
        if (index > -1) checkedData.splice(index, 1)
    }
    ignoreCheckAllEvent.value = true
    checkedAll.value = (checkedData.length == tabData.length)
    updateTipText()
}

const resetTab = () => {
    tabData.length = 0
    checkedData.length = 0
    currentTabView.value = null
    ignoreCheckAllEvent.value = false
    checkedAll.value = false
    Object.assign(actionShowCtl, {
        playBtn: false,
        addToBtn: false,
        moveToBtn: false,
        addToQueueBtn: false,
        exportBtn: false,
        deleteBtn: true
    })
    EventBus.emit("checkbox-refresh")
}

const updateTipText = () => {
    tabTipText.value = typeTabs[activeTab.value].text.replace('0', checkedData.length)
}

const switchTab = () => {
    resetTab()
    const platform = currentPlatformCode.value
    if (activeTab.value == 0) {
        Object.assign(actionShowCtl, {
            playBtn: true,
            addToBtn: true,
            deleteBtn: true
        })
        if (isFavorites()) tabData.push(...filterSongsWithKeyword(getFavoriteSongs.value(platform)))
        if (isRecents()) tabData.push(...filterRecentSongs())
        if (isCustomPlaylist()) {
            Object.assign(actionShowCtl, {
                playBtn: true,
                addToBtn: true,
                moveToBtn: true,
                deleteBtn: true,
            })
            tabData.push(...loadCustomPlaylist(platform))
        }
        if (isLocalMusic()) {
            Object.assign(actionShowCtl, {
                playBtn: true,
                addToQueueBtn: true,
                addToBtn: true,
                moveToBtn: true,
                deleteBtn: true
            })
            tabData.push(...loadLocalPlaylist())
        }
        currentTabView.value = SongListControl
    } else if (activeTab.value == 1) {
        if (isFavorites()) tabData.push(...filterByTitleWithKeyword(getFavoritePlaylilsts.value(platform)))
        if (isRecents()) tabData.push(...filterByTitleWithKeyword(getRecentPlaylilsts.value(platform)))
        if (isLocalMusic()) {
            Object.assign(actionShowCtl, {
                addToQueueBtn: true,
                deleteBtn: true,
                exportBtn: true
            })
            tabData.push(...filterByTitleWithKeyword(localPlaylists.value))
        }
        currentTabView.value = PlaylistsControl
    } else if (activeTab.value == 2) {
        if (isFavorites()) tabData.push(...filterByTitleWithKeyword(getFavoriteAlbums.value(platform)))
        if (isRecents()) tabData.push(...filterByTitleWithKeyword(getRecentAlbums.value(platform)))
        currentTabView.value = AlbumListControl
    } else if (activeTab.value == 3) {
        if (isFavorites()) tabData.push(...filterByTitleWithKeyword(getFavoriteRadios.value(platform)))
        if (isRecents()) tabData.push(...filterByTitleWithKeyword(getRecentRadios.value(platform)))
        if (isFreeFM()) {
            Object.assign(actionShowCtl, {
                deleteBtn: true,
                exportBtn: true
            })
            tabData.push(...filterByTitleAndTagsWithKeyword(freeRadios.value))
        }
        currentTabView.value = PlaylistsControl
    }
    updateTipText()
    //TODO
    EventBus.emit("batchView-show")
}

const visitTab = (index) => {
    activeTab.value = index
    switchTab()
}

const filterWithKeyword = (list, filterFn) => {
    let keyword = searchKeyword.value
    let result = list
    if (keyword) {
        keyword = keyword.trim().toLowerCase()
        result = result.filter(item => {
            if (filterFn) return filterFn(keyword, item)
            return true
        })
    }
    return result
}

const filterSongsWithKeyword = (list) => {
    return filterWithKeyword(list, (keyword, item) => {
        const { title, artist, album } = item
        if (title.toLowerCase().includes(keyword)) {
            return true
        }
        if (album && album.name) {
            if (album.name.toLowerCase().includes(keyword)) {
                return true
            }
        }
        if (artist) {
            for (var i = 0; i < artist.length; i++) {
                const { name } = artist[i]
                if (name && name.toLowerCase().includes(keyword)) {
                    return true
                }
            }
        }
        return false
    })
}

const filterRecentSongs = () => {
    let platform = currentPlatformCode.value
    if (!platform || platform.trim() == 'all') platform = null
    return filterSongsWithKeyword(getRecentSongs.value(platform))
}

const filterByTitleWithKeyword = (list) => {
    return filterWithKeyword(list, (keyword, item) => (item.title.toLowerCase().includes(keyword)))
}

const filterByTitleAndTagsWithKeyword = (list) => {
    return filterWithKeyword(list, (keyword, item) => {
        const { title, tags } = item
        const _tags = tags || ''
        if (title.toLowerCase().includes(keyword)) {
            return true
        }
        return _tags.toLowerCase().includes(keyword)
    })
}

const loadCustomPlaylist = (platform) => {
    const playlist = getCustomPlaylist(props.id)
    Object.assign(sourceItem, { ...playlist })
    updateCommonCtxItem(playlist)
    if (!platform || platform.trim() === 'all') platform = null
    const songs = playlist.data.filter(item => (!platform || item.platform === platform))
    return filterSongsWithKeyword(songs)
}

const loadLocalPlaylist = () => {
    const playlist = getLocalPlaylist(props.id)
    Object.assign(sourceItem, { ...playlist })
    updateCommonCtxItem(playlist)
    return filterSongsWithKeyword(playlist.data)
}

const toggleSelectAll = () => {
    if (tabData.length < 1) return
    ignoreCheckAllEvent.value = false
    checkedAll.value = !checkedAll.value
    checkedData.length = 0
    if (checkedAll.value) {
        checkedData.push(...tabData)
    }
    updateTipText()
}

const selectAll = () => {
    ignoreCheckAllEvent.value = false
    checkedAll.value = true
    checkedData.length = 0
    if (checkedAll.value) {
        checkedData.push(...tabData)
    }
    updateTipText()
}

const sortCheckData = () => {
    if (checkedData.length < 1) return
    return checkedData.sort((a, b) => (a.index - b.index))
}

const playChecked = () => {
    const sortedData = sortCheckData()
    addTracks(sortedData)
    playTrack(sortedData[0])
    showToast("即将为您播放歌曲！")
    refresh()
}

const addToQueue = () => {
    if (!actionShowCtl.addToQueueBtn) return
    const sortedData = sortCheckData()
    addTracks(sortedData)
    showToast("歌曲添加成功！")
    refresh()
}

//TODO
/*
const showAddToList = (event, dataType, elSelector, actionType) => {
    event.stopPropagation()
    const el = document.querySelector(elSelector)
    const clientRect = el.getBoundingClientRect()
    const { x, y, width, height, bottom } = clientRect
    const { clientX, clientY } = event
    EventBus.emit("commonCtxMenu-init", { dataType, actionType })
    EventBus.emit("commonCtxMenu-show", {
        event: { x, y: (bottom + 3), clientX, clientY },
        data: sortCheckData()
    })
}
*/

const showAddToList = (event, dataType, elSelector, actionType) => {
    event.stopPropagation()
    const el = document.querySelector(elSelector)
    const clientRect = el.getBoundingClientRect()
    const { x, y, width, height, bottom } = clientRect
    const { clientX, clientY } = event
    updateCommonCtxMenuCacheItem(sortCheckData())
    EventBus.emit("addToListSubmenu-init", {
        mode: (actionType || 0),
        dataType,
        callback: ({ total }) => {
            EventBus.emit("addToListSubmenu-show", {
                event: { x, y: (bottom + 3), clientX, clientY },
                total
            })
        }
    })
}

let eventMode = 0
const doToggleCheckedPopupMenu = (event, actionType) => {
    const mode = isLocalMusic() ? 10 : 6
    const elSelector = (actionType == 1) ? "#batch-action-view .moveToBtn" : "#batch-action-view .addToBtn"
    if (commonCtxMenuShow.value && eventMode == mode) {
        hideAllCtxMenus()
    } else {
        hideAllCtxMenus()
        showAddToList(event, mode, elSelector, actionType)
    }
    eventMode = mode
}

const toggleAddCheckedMenu = (event) => {
    doToggleCheckedPopupMenu(event)
}

const toggleMoveCheckedMenu = (event) => {
    doToggleCheckedPopupMenu(event, 1)
}

const removeChecked = async () => {
    if (checkedData.length < 1) return
    let ok = true
    if (isShowDialogBeforeBatchDelete.value) ok = await showConfirm({ msg: '确定要删除所选数据吗？' })
    if (!ok) return

    let deleteFn = null
    if (activeTab.value == 0) {
        if (isFavorites()) deleteFn = removeFavoriteSong
        if (isRecents()) deleteFn = removeRecentSong
        if (isCustomPlaylist()) deleteFn = removeFromCustomPlaylist
        if (isLocalMusic()) deleteFn = removeFromLocalPlaylist
    } else if (activeTab.value == 1) {
        if (isFavorites()) deleteFn = removeFavoritePlaylist
        if (isRecents()) deleteFn = removeRecentPlaylist
        if (isLocalMusic()) deleteFn = removeLocalPlaylist
    } else if (activeTab.value == 2) {
        if (isFavorites()) deleteFn = removeFavoriteAlbum
        if (isRecents()) deleteFn = removeRecentAlbum
    } else if (activeTab.value == 3) {
        if (isFavorites()) deleteFn = removeFavoriteRadio
        if (isRecents()) deleteFn = removeRecentRadio
        if (isFreeFM()) deleteFn = removeFreeRadio
    }
    if (deleteFn) {
        if (isFavorites()) checkedData.forEach(item => deleteFn(item.id, item.platform))
        //else if (isRecents()) checkedData.forEach(item => deleteFn(item))
        else if (activeTab.value == 0 && (isCustomPlaylist() || isLocalMusic())) {
            const { id } = commonCtxItem.value
            checkedData.forEach(item => deleteFn(id, item))
        } else if (activeTab.value == 1 && isLocalMusic()) {
            checkedData.forEach(item => deleteFn(item.id))
        } else { //默认情况
            checkedData.forEach(item => deleteFn(item))
        }
        refresh()
        showToast("删除操作成功!")
    }
}

/*
const exportRadios = async (radios) => {
    if (!radios || radios.length < 1) return
    if (!ipcRenderer) return
    const now = Date.now()
    const radioData = []
    radios.forEach(item => {
        const { platform, type, title, cover, tags, about, data } = item
        if (data && data.length > 0) {
            const { url, streamType } = data[0]
            radioData.push({ title, url, streamType, cover, tags, about })
        }
    })
    const timestamp = toYyyymmddHhMmSs(now).replace(/-/g, '').replace(/ /g, '-').replace(/:/g, '')
    const filename = `FreeRadios-${timestamp}.json`
    const result = await ipcRenderer.invoke('save-file', {
        title: 'FM电台导出',
        name: filename,
        data: JSON.stringify({ created: now, data: radioData })
    })
    if (result) showToast('FM电台导出成功！')
    else showFailToast('FM电台导出失败！')
}
*/
const formatRadios = (radios, format) => {
    if (!radios || radios.length < 1) return
    if (!ipcRenderer) return
    const now = Date.now()
    const radioData = []
    radios.forEach(item => {
        const { platform, type, title, cover, tags, about, data } = item
        if (data && data.length > 0) {
            const { url, streamType } = data[0]
            radioData.push({ title, url, streamType, cover, tags, about })
        }
    })
    const timestamp = toYyyymmddHhMmSs(now).replace(/-/g, '').replace(/ /g, '-').replace(/:/g, '')
    const filename = `FreeRadios-${timestamp}`
    const presetData = {
        json: JSON.stringify({ created: now, data: radioData })
    }
    return [{
        title: filename,
        data: presetData[format] || radioData
    }]
}

const exportChecked = () => {
    let exportCfg = null
    if (isLocalMusic()) {
        exportCfg = { data: checkedData, noJson: true, title: '导出本地歌单' }
    } else if (isFreeFM()) {
        exportCfg = { data: checkedData, formatFn: formatRadios, title: '导出FM电台', looseMode: true }
    }
    if (exportCfg) showPlaylistExportToolbar(exportCfg)
}

//TODO
const refresh = () => {
    EventBus.emit("checkbox-refresh")
    visitTab(activeTab.value)
}

//TODO
const contentRef = ref(null)
const back2TopBtnRef = ref(null)
const onScroll = () => {
    hideAllCtxMenus()
}

const resetBack2TopBtn = () => {
    if (back2TopBtnRef.value) back2TopBtnRef.value.setScrollTarget(contentRef.value)
}

const shiftPressed = ref(false)
const setShiftPressed = (value) => shiftPressed.value = value
//注册/取消当前页面快捷键
const registryLocalKeys = (unbind) => {
    if (unbind) { //取消注册
        Mousetrap.unbind(['ctrl+a', 'command+a'])
        Mousetrap.unbind(['shift'])
        shiftRangeCurrentIndex = - 1
    } else { //注册
        //全选
        Mousetrap.bind(['ctrl+a', 'command+a'], selectAll)
        //开启/关闭快速选择
        Mousetrap.bind(['shift'], () => setShiftPressed(true), 'keydown')
        Mousetrap.bind(['shift'], () => {
            setShiftPressed(false)
            shiftRangeCurrentIndex = - 1
        }, 'keyup')
    }
}

const toggleUseSearchBar = () => {
    if (!isSearchForBatchActionShow.value) return
    const action = searchBarExclusiveAction.value ? null : setSearchKeyword
    setSearchBarExclusiveAction(action)
}

onMounted(() => {
    updateCurrentPlatform(0)
    visitTab(getFirstVisibleTabIndex())
    updateTitle()
    resetBack2TopBtn()
    registryLocalKeys()
    setSearchKeyword(null)
    toggleUseSearchBar()
})

onUnmounted(() => {
    registryLocalKeys(true)
    setSearchBarExclusiveAction(null)
    setSearchKeyword(null)
})

watch([currentPlatformCode, searchKeyword], () => {
    const path = currentRoutePath()
    if (path.includes("/batch/")) refresh()
})

EventBus.on("commonCtxMenuItem-finish", refresh)
</script>

<template>
    <div id="batch-action-view">
        <div class="header">
            <div class="title-wrap">批量操作
                <div class="title">
                    <span class="subtitle" v-html="subtitle"></span>{{ title }}
                </div>
            </div>
            <div class="tabs">
                <span class="tab" v-for="(tab, index) in typeTabs"
                    :class="{ active: activeTab == index, 'content-text-highlight': activeTab == index }"
                    @click="visitTab(index)" v-show="isTabsVisible(tab, index)" v-html="tab.name">
                </span>
                <div class="search-wrap checkbox text-btn" @click="toggleUseSearchBar" v-show="isSearchForBatchActionShow">
                    <svg v-show="!searchBarExclusiveAction" width="16" height="16" viewBox="0 0 731.64 731.66"
                        xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M365.63,731.65q-120.24,0-240.47,0c-54.2,0-99.43-30.93-117.6-80.11A124.59,124.59,0,0,1,0,608q0-242.21,0-484.42C.11,60.68,43.7,10.45,105.88,1.23A128.67,128.67,0,0,1,124.81.06q241-.09,481.93,0c61.43,0,110.72,39.85,122.49,99.08a131.72,131.72,0,0,1,2.3,25.32q.19,241.47.07,482.93c0,60.87-40.25,110.36-99.18,121.9a142.56,142.56,0,0,1-26.83,2.29Q485.61,731.81,365.63,731.65ZM48.85,365.45q0,121.76,0,243.5c0,41.57,32.38,73.82,73.95,73.83q243,.06,486,0c41.57,0,73.93-32.24,73.95-73.84q.11-243.24,0-486.49c0-41.3-32.45-73.55-73.7-73.57q-243.24-.06-486.49,0a74.33,74.33,0,0,0-14.89,1.42c-34.77,7.2-58.77,36.58-58.8,72.1Q48.76,244,48.85,365.45Z" />
                            </g>
                        </g>
                    </svg>
                    <svg v-show="searchBarExclusiveAction" class="checked-svg" width="16" height="16"
                        viewBox="0 0 767.89 767.94" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                            </g>
                        </g>
                    </svg>
                    <span>独占搜索框模式</span>
                </div>
                <span class="tab-tip content-text-highlight" v-html="tabTipText"></span>
            </div>
        </div>
        <div class="center">
            <div class="action">
                <div class="checkbox checkall" :class="{ 'button-disabled': (tabData.length < 1) }"
                    @click="toggleSelectAll">
                    <svg v-show="!checkedAll" width="16" height="16" viewBox="0 0 731.64 731.66"
                        xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M365.63,731.65q-120.24,0-240.47,0c-54.2,0-99.43-30.93-117.6-80.11A124.59,124.59,0,0,1,0,608q0-242.21,0-484.42C.11,60.68,43.7,10.45,105.88,1.23A128.67,128.67,0,0,1,124.81.06q241-.09,481.93,0c61.43,0,110.72,39.85,122.49,99.08a131.72,131.72,0,0,1,2.3,25.32q.19,241.47.07,482.93c0,60.87-40.25,110.36-99.18,121.9a142.56,142.56,0,0,1-26.83,2.29Q485.61,731.81,365.63,731.65ZM48.85,365.45q0,121.76,0,243.5c0,41.57,32.38,73.82,73.95,73.83q243,.06,486,0c41.57,0,73.93-32.24,73.95-73.84q.11-243.24,0-486.49c0-41.3-32.45-73.55-73.7-73.57q-243.24-.06-486.49,0a74.33,74.33,0,0,0-14.89,1.42c-34.77,7.2-58.77,36.58-58.8,72.1Q48.76,244,48.85,365.45Z" />
                            </g>
                        </g>
                    </svg>
                    <svg v-show="checkedAll" class="checked-svg" width="16" height="16" viewBox="0 0 767.89 767.94"
                        xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                            </g>
                        </g>
                    </svg>
                    <span>{{ (checkedAll ? "取消全选" : "全选") }}</span>
                </div>
                <SvgTextButton :disabled="checkedData.length < 1" text="播放" class="spacing" v-show="actionShowCtl.playBtn"
                    :leftAction="playChecked" :rightAction="addToQueue">
                    <template #left-img>
                        <svg width="16" height="16" viewBox="0 0 139 139" xml:space="preserve"
                            xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                            <path
                                d="M117.037,61.441L36.333,14.846c-2.467-1.424-5.502-1.424-7.972,0c-2.463,1.423-3.982,4.056-3.982,6.903v93.188  c0,2.848,1.522,5.479,3.982,6.9c1.236,0.713,2.61,1.067,3.986,1.067c1.374,0,2.751-0.354,3.983-1.067l80.704-46.594  c2.466-1.422,3.984-4.054,3.984-6.9C121.023,65.497,119.502,62.866,117.037,61.441z" />
                        </svg>
                    </template>
                    <template #right-img>
                        <svg v-show="actionShowCtl.addToQueueBtn" width="16" height="16" viewBox="0 0 768.02 554.57"
                            xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M341.9,0q148,0,296,0C659,0,675,11.28,680.8,30.05c8.34,26.78-11.43,54.43-39.45,55.18-1.17,0-2.33,0-3.5,0q-296.46,0-592.93,0C22.37,85.25,5.32,71.87.87,50.78-4.36,26,14.59,1.39,39.94.12c2.49-.13,5-.11,7.5-.11Z" />
                                    <path
                                        d="M554.64,426.5h-6.72c-26.49,0-53,.17-79.47-.1a41.87,41.87,0,0,1-39.06-27.7,42.4,42.4,0,0,1,11.2-46.19,41.85,41.85,0,0,1,29.11-11.25q39.49,0,79,0h6V335c0-26-.12-52,0-78,.15-25.3,19.44-44.3,44.06-43.72,23.23.55,41.24,19.54,41.37,43.92.13,25.82,0,51.65,0,77.48v6.57h5.67c26.65,0,53.31-.11,80,.05,20.38.12,37.94,14.9,41.51,34.49,3.74,20.57-7.15,40.65-26.59,47.73a53.72,53.72,0,0,1-17.56,2.85c-25.66.3-51.32.13-77,.13h-6v6.36c0,26,.1,52,0,78-.11,20.74-13.1,37.68-32.17,42.41-27.42,6.8-53-13.28-53.24-42.11-.22-26-.05-52-.05-78Z" />
                                    <path
                                        d="M234.37,256q-94.73,0-189.44,0c-21.55,0-38.62-12.68-43.5-32.09-6.74-26.8,12.45-52.1,40.47-53.35,1.33-.06,2.67-.05,4-.05H423.78c21.17,0,37.53,11.12,43.49,29.46,9.15,28.13-11.52,55.87-42,56-36.32.15-72.64,0-109,0Z" />
                                    <path
                                        d="M170.91,426.5c-42.48,0-85,.07-127.45,0-20.94-.06-37.61-13.2-42.21-32.85-6.18-26.41,13.5-52,40.6-52.3,23.82-.27,47.65-.07,71.47-.07q92.46,0,184.93,0c24.55,0,43.52,19.37,43.12,43.58-.38,23.41-19.15,41.53-43.51,41.61-40,.12-80,0-120,0Z" />
                                </g>
                            </g>
                        </svg>
                    </template>
                </SvgTextButton>
                <SvgTextButton :disabled="checkedData.length < 1" text="添加到" class="spacing addToBtn"
                    v-show="actionShowCtl.addToBtn" :leftAction="toggleAddCheckedMenu" :useEvent="true">
                    <template #left-img>
                        <svg width="16" height="16" viewBox="0 -50 768.02 554.57" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M341.9,0q148,0,296,0C659,0,675,11.28,680.8,30.05c8.34,26.78-11.43,54.43-39.45,55.18-1.17,0-2.33,0-3.5,0q-296.46,0-592.93,0C22.37,85.25,5.32,71.87.87,50.78-4.36,26,14.59,1.39,39.94.12c2.49-.13,5-.11,7.5-.11Z" />
                                    <path
                                        d="M554.64,426.5h-6.72c-26.49,0-53,.17-79.47-.1a41.87,41.87,0,0,1-39.06-27.7,42.4,42.4,0,0,1,11.2-46.19,41.85,41.85,0,0,1,29.11-11.25q39.49,0,79,0h6V335c0-26-.12-52,0-78,.15-25.3,19.44-44.3,44.06-43.72,23.23.55,41.24,19.54,41.37,43.92.13,25.82,0,51.65,0,77.48v6.57h5.67c26.65,0,53.31-.11,80,.05,20.38.12,37.94,14.9,41.51,34.49,3.74,20.57-7.15,40.65-26.59,47.73a53.72,53.72,0,0,1-17.56,2.85c-25.66.3-51.32.13-77,.13h-6v6.36c0,26,.1,52,0,78-.11,20.74-13.1,37.68-32.17,42.41-27.42,6.8-53-13.28-53.24-42.11-.22-26-.05-52-.05-78Z" />
                                    <path
                                        d="M234.37,256q-94.73,0-189.44,0c-21.55,0-38.62-12.68-43.5-32.09-6.74-26.8,12.45-52.1,40.47-53.35,1.33-.06,2.67-.05,4-.05H423.78c21.17,0,37.53,11.12,43.49,29.46,9.15,28.13-11.52,55.87-42,56-36.32.15-72.64,0-109,0Z" />
                                    <path
                                        d="M170.91,426.5c-42.48,0-85,.07-127.45,0-20.94-.06-37.61-13.2-42.21-32.85-6.18-26.41,13.5-52,40.6-52.3,23.82-.27,47.65-.07,71.47-.07q92.46,0,184.93,0c24.55,0,43.52,19.37,43.12,43.58-.38,23.41-19.15,41.53-43.51,41.61-40,.12-80,0-120,0Z" />
                                </g>
                            </g>
                        </svg>
                    </template>
                </SvgTextButton>
                <SvgTextButton :disabled="checkedData.length < 1" text="移动到" class="spacing moveToBtn"
                    v-show="actionShowCtl.moveToBtn" :leftAction="toggleMoveCheckedMenu" :useEvent="true">
                    <template #left-img>
                        <svg width="16" height="16" viewBox="0 0 896.41 896.43" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M415.82,109.83l-48,48.05q-11.67,11.67-23.34,23.33c-14.07,14-33.73,14.73-46.83,1.73s-12.53-32.9,1.73-47.17q59-59.06,118.08-118.09c2.82-2.83,5.51-5.8,8.4-8.56,12.57-12,32.28-12.27,44.62,0q64.28,64.05,128.23,128.43a31.73,31.73,0,0,1,0,45.37c-12.6,12.5-32.34,12.53-45.37-.36-22.87-22.61-45.53-45.44-68.25-68.21-1.29-1.3-2.32-2.85-4.48-3.71V415.9H786.3c-1.58-1.7-2.72-3-3.95-4.25-22.74-22.76-45.57-45.41-68.2-68.27-17.51-17.69-10.76-46.49,12.53-53.62,12.85-3.94,23.94-.4,33.33,9q55.34,55.33,110.67,110.65c5.3,5.3,10.7,10.51,16,15.83,12.84,12.93,13.06,32.88.24,45.72q-63.58,63.68-127.36,127.18c-13.4,13.34-33.4,13.48-46.1.58s-12.39-32.47.78-45.74q33.82-34.05,67.88-67.87a42.32,42.32,0,0,1,4.34-3.38l-.68-1.09H480.5V786.38c1.78-1.66,3.1-2.82,4.34-4.06,22.75-22.74,45.39-45.59,68.27-68.2,17.57-17.36,46-10.82,53.41,12.18,4.13,12.82.82,24-8.56,33.42Q563.39,794.43,528.69,829q-28.62,28.66-57.19,57.36c-13.28,13.32-33.2,13.4-46.44.15q-63.24-63.3-126.45-126.67c-15.18-15.23-13.55-38.16,3.41-49.93,13-9,29.71-7.37,41.5,4.36q34,33.84,67.88,67.87c1.28,1.27,2.3,2.8,4.44,3.56V480.48H110c1.59,1.68,2.73,2.93,3.92,4.13,22.74,22.75,45.56,45.42,68.2,68.26,16.12,16.26,12.33,41.91-7.47,51.9-12.65,6.39-27,4-37.65-6.56-15.15-15-30.17-30.16-45.27-45.23Q51,512.36,10.27,471.77C-3.29,458.26-3.46,438.41,10,425q63.14-63.06,126.31-126.1c12.29-12.27,29-14.12,42.24-4.83,16.7,11.76,18.39,34.58,3.47,49.61-22.55,22.71-45.23,45.27-67.85,67.91-1.25,1.25-2.43,2.57-4.12,4.37H415.82Z" />
                                </g>
                            </g>
                        </svg>
                    </template>
                </SvgTextButton>
                <SvgTextButton :disabled="checkedData.length < 1" text="导出" class="spacing" v-show="actionShowCtl.exportBtn"
                    :leftAction="exportChecked">
                    <template #left-img>
                        <svg width="16" height="16" viewBox="0 0 853.89 768.12" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M426.89,768.1q-148.75,0-297.49,0C69.87,768,19.57,729.77,4.61,672.61a140,140,0,0,1-4.3-34.06c-.45-55.66-.3-111.33-.22-167,0-31.16,27.63-51.89,56.33-42.53,17.88,5.84,29.09,22.14,29.12,42.72q.1,65.5.06,131c0,11.67,0,23.33,0,35,.13,27.13,18,45.07,45.21,45.09q143,.06,286,0,152.49,0,305,0c10.8,0,20.87-2.1,29.52-8.91,11.68-9.19,16.88-21.33,16.83-36.16-.15-43,0-86,0-129,0-12.84-.15-25.67,0-38.5.26-17.26,7.72-30.64,23.12-38.63,14.61-7.58,29.38-6.73,43.18,2.34,12.62,8.28,19,20.51,19,35.46.17,57.83.86,115.68-.21,173.49-1.18,63.32-47.07,114.32-109.5,123.77a140.44,140.44,0,0,1-20.92,1.3Q574.88,768.17,426.89,768.1Z" />
                                    <path
                                        d="M479.85,146.1v6.79q0,200,0,400c0,22.17-13.11,39-33.73,43.58-25.55,5.68-51-13.5-51.27-39.67-.5-42.15-.2-84.32-.2-126.48q0-139.23,0-278.46v-5.69c-2,1.8-3.26,2.89-4.46,4.09Q338.89,201.45,287.62,252.7c-14.1,14.06-32.63,17.57-49.5,9.65a42.57,42.57,0,0,1-14.66-65.86c1.39-1.67,2.9-3.23,4.43-4.76Q316.62,103,405.36,14.27C420.27-.62,439.53-4.17,456.94,5.1a51.57,51.57,0,0,1,11.87,9Q558,103.05,647,192.21c12.33,12.34,17,27,11.88,43.87-4.83,16-15.89,26-32.26,29.38-15.32,3.13-28.58-1.47-39.64-12.55q-39-39.1-78.12-78.14Q496.52,162.41,484.14,150C483,148.91,481.8,147.88,479.85,146.1Z" />
                                </g>
                            </g>
                        </svg>
                    </template>
                </SvgTextButton>
                <SvgTextButton :disabled="checkedData.length < 1" text="删除" class="spacing" v-show="actionShowCtl.deleteBtn"
                    :leftAction="removeChecked">
                    <template #left-img>
                        <svg width="16" height="16" viewBox="0 0 256 256" data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M1040,669H882c-12.79-4.93-17.16-14.62-17.1-27.83.26-52.77.11-105.55.11-158.32V477c-6,0-11.42-.32-16.84.09-6.54.48-11.66-1.39-15.17-7.08v-7c3.16-5.7,8-7.48,14.44-7.36,18.29.32,36.58.12,54.88.1,1.75,0,3.5-.16,5.48-.25,0-7.76,0-14.91,0-22.05a18.56,18.56,0,0,1,6.6-14.52c2.85-2.39,6.37-4,9.59-5.92h73c13.83,5.64,17.27,10.84,17.25,26.08,0,5.41,0,10.82,0,16.68h7.53c17.61,0,35.21.2,52.81-.12,6.43-.12,11.27,1.63,14.41,7.36v7c-3.5,5.7-8.63,7.56-15.17,7.08-5.41-.4-10.89-.09-16.84-.09v6.36c0,52.6-.15,105.2.11,157.8C1057.17,654.36,1052.81,664.08,1040,669ZM886.24,477.29V640.4c0,8.44-.49,7.34,7.11,7.35q67.95,0,135.9,0c6.51,0,6.52,0,6.52-6.43v-164Zm106.5-42.78H929.37v21h63.37Z"
                                transform="translate(-833 -413)" />
                            <path
                                d="M950.29,562.2c0-13.47,0-26.94,0-40.41,0-7.94,4.25-12.84,10.82-12.77,6.36.07,10.59,5,10.6,12.52,0,27.28,0,54.55,0,81.83,0,5.13-1.71,9.17-6.5,11.36-7.39,3.36-14.87-2.16-14.94-11.11-.11-13.81,0-27.61,0-41.42Z"
                                transform="translate(-833 -413)" />
                            <path
                                d="M1014.25,562.63c0,13.48,0,27,0,40.42,0,7.88-4.3,12.82-10.87,12.64-6.29-.18-10.35-5.13-10.36-12.75q0-41.16,0-82.33c0-5.91,3-9.91,8-11.26a10.29,10.29,0,0,1,11.85,5.16,16.06,16.06,0,0,1,1.33,6.71c.12,13.8.06,27.61.06,41.41Z"
                                transform="translate(-833 -413)" />
                            <path
                                d="M929,562.53q0,21,0,41.92c0,4.8-2.09,8.39-6.49,10.29-4.21,1.81-8.49,1.25-11.43-2.23a13.57,13.57,0,0,1-3.17-8c-.23-28.1-.19-56.21-.12-84.32,0-6.74,4.63-11.34,10.74-11.19s10.41,4.78,10.44,11.59C929.05,534.59,929,548.56,929,562.53Z"
                                transform="translate(-833 -413)" />
                        </svg>
                    </template>
                </SvgTextButton>
                <SvgTextButton text="完成" :leftAction="backward" class="to-right"></SvgTextButton>
            </div>
            <div class="content" ref="contentRef" @scroll="onScroll">
                <component :is="currentTabView" :data="tabData" :checkbox="true" :checkedAll="checkedAll"
                    :checkChangedFn="onCheckChanged" :ignoreCheckAllEvent="ignoreCheckAllEvent" :checkedData="checkedData">
                </component>
            </div>
        </div>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style>
#batch-action-view {
    padding: 20px 0px 15px 0px;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

#batch-action-view .header,
#batch-action-view .center .action,
#batch-action-view .center .content {
    padding-left: 33px;
    padding-right: 33px;
}

#batch-action-view .spacing {
    margin-right: 20px;
}

#batch-action-view .header {
    text-align: left;
    margin-bottom: 15px;
}

#batch-action-view .header .title-wrap {
    text-align: left;
    /*font-size: 30px;*/
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
    position: relative;
}

#batch-action-view .header .title {
    position: absolute;
    top: 8px;
    right: 10px;
    text-align: right;
    margin-left: 25px;
    /*font-size: 23px;*/
    font-size: var(--content-text-module-subtitle-size);
    font-weight: bold;
}

#batch-action-view .header .subtitle {
    font-size: 17px;
    font-weight: bold;
    margin-right: 25px;
    color: var(--content-subtitle-text-color);
}

#batch-action-view .header .tabs {
    display: flex;
    align-items: center;
    text-align: left;
    padding-bottom: 0px;
    border-bottom: 1px solid var(--border-color);
    border-bottom: 1px solid transparent;
    margin-top: 8px;
    position: relative;
}

#batch-action-view .header .tab {
    font-size: var(--content-text-tab-title-size);
    padding: 8px 15px;
    border-bottom: 3px solid transparent;
    cursor: pointer;
}

#batch-action-view .header .active {
    font-weight: bold;
    border-bottom: 3px solid var(--content-highlight-color);
}

#batch-action-view .header .search-wrap {
    position: absolute;
    right: 202px;
    display: flex;
    align-items: center;
    font-weight: bold;
}

#batch-action-view .header .search-wrap svg {
    margin-top: 1px;
}

#batch-action-view .header .tab-tip {
    position: absolute;
    right: 10px;
    font-weight: bold;
}

#batch-action-view .center {
    display: flex;
    flex-direction: column;
}

#batch-action-view .action {
    display: flex;
    flex-direction: row;
    position: relative;
    margin-bottom: 10px;
}

#batch-action-view .action svg {
    fill: var(--button-icon-text-btn-text-color);
}

#batch-action-view .action .to-right {
    position: absolute;
    right: 33px;
}

#batch-action-view .action .checkbox {
    flex-direction: row;
    margin-left: 8px;
    margin-right: 15px;
}

/*
#batch-action-view .header .checkbox svg,
#batch-action-view .action .checkbox svg {
    fill: var(--button-icon-btn-color);
    cursor: pointer;
}

#batch-action-view .header .checkbox .checked-svg,
#batch-action-view .action .checkbox .checked-svg {
    fill: var(--content-highlight-color);
}
*/

#batch-action-view .action .checkbox>span {
    text-align: left;
    margin: 0px 20px;
    /*width: 65px;*/
    min-width: 80px;
    cursor: pointer;
}

#batch-action-view .action .checkall span {
    margin-left: 13px;
}

#batch-action-view .content {
    overflow: scroll;
}

#batch-action-view .pagination-tiles .pag-action {
    margin-bottom: 39px;
}
</style>