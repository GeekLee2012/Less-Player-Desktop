<script>
//定义名称，方便用于<keep-alive>
export default {  name: 'LocalMusicView' }
</script>

<script setup>
import { computed, inject, onActivated, onMounted, onUnmounted, reactive, ref, shallowRef, toRaw, watch } from 'vue';
import { storeToRefs } from 'pinia';
import CreatePlaylistBtn from '../components/CreatePlaylistBtn.vue';
import { useLocalMusicStore } from '../store/localMusicStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';
import AlbumListControl from '../components/AlbumListControl.vue';
import ArtistListControl from '../components/ArtistListControl.vue';
import PlaylistsControl from '../components/PlaylistsControl.vue';
import BatchActionBtn from '../components/BatchActionBtn.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import { isDevEnv, ipcRendererInvoke, isSupportedImage, 
    isBlank, toTrimString, stringEquals, pinyinOfFirstChar, 
    ALPHABET_FILTER, stringEqualsIgnoreCase,
    isChineseChar, isEnglishChar, toUpperCaseTrimString, nextInt,
    shuffle,
} from "../../common/Utils";
import { Playlist } from '../../common/Playlist';
import { LocalMusic } from '../../vendor/localmusic';
import { offEvents, onEvents } from '../../common/EventBusWrapper';



const { visitLocalPlaylistCreate, visitBatchLocalMusic } = inject('appRoute')
const { showConfirm } = inject('apiExpose')
const { playTracks } = inject('player')

const { localPlaylists, importTaskCount } = storeToRefs(useLocalMusicStore())
const { addLocalPlaylist, updateLocalPlaylist, resetAll,
    increaseImportTaskCount, decreaseImportTaskCount } = useLocalMusicStore()
const { showToast, showFailToast, hideAllCtxMenus, showPlaylistExportToolbar } = useAppCommonStore()
const { isUseDndForCreateLocalPlaylistEnable,
    isUseDeeplyScanForDirectoryEnable,
    isShowDialogBeforeClearLocalMusics,
    isLocalMusicViewTipsShow, 
    isLocalMusicViewPlaylistTipsShow,
    isUseDndForExportLocalPlaylistEnable,
    isSingleLineAlbumTitleStyle, } = storeToRefs(useSettingStore())

const localMusicRef = ref(null)
const back2TopBtnRef = ref(null)
let markScrollTop = 0
let resultTimer = null
const currentTab = shallowRef(null)
const tabData = reactive([])
const activeTypeIndex = ref(0)
const isLoading = ref(false)
const isAralFilterShow = ref(false)
const aralFilterName = ref('#')
const singleLineTitleStyle = ref(false)
const isAlbumArtistSutitle = ref(false)
const setCurrentTab = (value) => (currentTab.value = value)
const setActiveTypeIndex = (value) => (activeTypeIndex.value = value)
const setLoading = (value) => (isLoading.value = value)
const setTabData = (value, expertedType) => {
    if(expertedType != activeTypeIndex.value) return 
    tabData.length = 0 
    if(Array.isArray(value)) tabData.push(...value)
}
const setAralFilterShow = (value) => (isAralFilterShow.value = value)
const toggleAralFilterShow = () => setAralFilterShow(!isAralFilterShow.value)
const setAralFilterName = (value) => (aralFilterName.value = value)
const setSingleLineTitleStyle = (value) => (singleLineTitleStyle.value = value)
const setAlbumArtistSutitle = (value) => (isAlbumArtistSutitle.value = value)

const getRefreshTimout = (num) => (Math.min(Math.max(num * 10, 168), 2588))

const resetBack2TopBtn = () => {
    if (back2TopBtnRef.value) back2TopBtnRef.value.setScrollTarget(localMusicRef.value)
}

const markScrollState = () => {
    if (localMusicRef.value) markScrollTop = localMusicRef.value.scrollTop
}

const resetScrollState = () => {
    markScrollTop = 0
    if (localMusicRef.value) localMusicRef.value.scrollTop = markScrollTop
    resetBack2TopBtn()
}

const restoreScrollState = () => {
    if (markScrollTop < 1) return
    if (localMusicRef.value) localMusicRef.value.scrollTop = markScrollTop
}

const resetView = () => {
    setCurrentTab(null)
    tabData.length = 0 
    if(resultTimer) clearTimeout(resultTimer)

    setLoading(true)
    setAralFilterShow(false)
    resetScrollState()
    setSingleLineTitleStyle(false)
    setAlbumArtistSutitle(false)
}

const loadContent = () => {
    resetView()
    //切换视图时，重置Filter，显示全部数据
    //从性能方面考虑，不重置为好，不必每次都显示全量数据，按需/延迟显示；
    //从用户体验上考虑，重置虽保守一些，但可避免用户误解当前显示即为全部数据
    setAralFilterName('#')
    switch(activeTypeIndex.value) {
        case 0:
            loadPlaylists()
            break
        case 1:
            filterByName()
            break
        case 2:
            filterByName()
            break
    }
}

const loadPlaylists = async () => {
    setCurrentTab(PlaylistsControl)
    const playlists = localPlaylists.value
    const total = playlists.length
    if(total < 1) return setLoading(false)
    const timeout = getRefreshTimout(total)
    resultTimer = setTimeout(() => {
         setTabData(playlists, 0)
         setLoading(false)
    }, timeout)
}

const filterByName = (name) => {
    let loadDataFn = null
    switch(activeTypeIndex.value) {
        case 1:
            loadDataFn = loadAlbums
            break
        case 2:
            loadDataFn = loadArtists
            break
    }
    if(!loadDataFn) return 

    name = name || aralFilterName.value || '#'

    resetView()
    loadDataFn(title => {
        const ch = title.substring(0, 1)
        if(stringEquals(name, '#')) {
            return true
        } else if(stringEquals(name, '%')) {
            return !isEnglishChar(ch) && !isChineseChar(ch)
        }
        return toUpperCaseTrimString(pinyinOfFirstChar(ch)).startsWith(name)
    })
}

const loadAlbums = async (filter) => {
    setCurrentTab(AlbumListControl)
    setSingleLineTitleStyle(isSingleLineAlbumTitleStyle.value)
    setAlbumArtistSutitle(true)
    const playlists = localPlaylists.value
    if(playlists.length < 1) return setLoading(false)
    const albums = []
    if(playlists && playlists.length > 0) {
        const platform = LocalMusic.CODE
        const type = Playlist.ALBUM_TYPE

        playlists.forEach(playlist => {
            const  { data } = playlist
            if(!data || data.length < 1) return
            data.forEach(item => {
                const { artist, album, cover } = item
                if(!album) return 
                const { name } = album
                if(isBlank(name)) return
                const title = toTrimString(name)
                const id = title
                if(typeof filter == 'function' && !filter(title)) return
                const index = albums.findIndex(album => (stringEquals(album.id, id)))
                if(index < 0)  albums.push({ id, title, platform, cover, artist, type })
            })
        })
        albums.sort((d1, d2) => (pinyinOfFirstChar(d1.id) <= pinyinOfFirstChar(d2.id) ? -1 : 1))
    }
 
    const timeout = getRefreshTimout(albums.length)
    resultTimer = setTimeout(() => {
        setTabData(albums, 1)
        setLoading(false)
    }, timeout)
}

const loadArtists = async (filter) => {
    setCurrentTab(ArtistListControl)
    setSingleLineTitleStyle(false)
    setAlbumArtistSutitle(false)
    const playlists = localPlaylists.value
    if(playlists.length < 1) return setLoading(false)
    const artists = []
    if(playlists && playlists.length > 0) {
        const platform = LocalMusic.CODE

        playlists.forEach(playlist => {
            const  { data } = playlist
            if(!data || data.length < 1) return
            data.forEach(item => {
                const { artist, cover } = item
                if(!artist) return 
                artist.forEach(ar => {
                    const { name } = ar
                    if(isBlank(name)) return
                    const title = toTrimString(name)
                    const id = title
                    if(typeof filter == 'function' && !filter(title)) return
                    const index = artists.findIndex(artist => (stringEquals(artist.id, id)))
                    if(index < 0) artists.push({ id, title, platform, cover })
                })
            })
        })
        artists.sort((d1, d2) => (pinyinOfFirstChar(d1.id) <= pinyinOfFirstChar(d2.id) ? -1 : 1))
    }
    
    const timeout = getRefreshTimout(artists.length)
    resultTimer = setTimeout(() => {
        setTabData(artists, 2)
        setLoading(false)
    }, timeout)
}


const onScroll = () => {
    markScrollState()
    hideAllCtxMenus()
    setAralFilterShow(false)
}

const onDrop = async (event) => {
    event.preventDefault()
    if (!isUseDndForCreateLocalPlaylistEnable.value) {
        showFailToast('拖拽还没有启用哦！<br>请重新检查设置')
        return
    }
    if (importTaskCount.value > 0) return

    const { files } = event.dataTransfer
    if (files.length > 1) {
        showFailToast('还不支持多文件拖拽')
        return
    }
    const { path } = files[0]
    increaseImportTaskCount()
    const result = await ipcRendererInvoke('dnd-open-audio-playlist', path, isUseDeeplyScanForDirectoryEnable.value)
    if (!result) return decreaseImportTaskCount()
    let msg = '导入歌单失败', success = false
    const { name, data, total, cover } = result
    if (name && data && data.length > 0) {
        try {
            addLocalPlaylist(name, null, null, cover, data)
        } catch (error) {
            if (isDevEnv()) console.log(error)
        }
        const numText = total ? `${data.length} / ${total}` : `${data.length}`
        msg = `导入歌单已完成！<br>共${numText}首歌曲`
        success = true
    }
    decreaseImportTaskCount()
    success ? showToast(msg) : showFailToast(msg)
    if(success) loadContent()
}

const refreshTime = ref(0)
const importPlaylist = async () => {
    const file = await ipcRendererInvoke('open-audio-playlist')
    if (file) {
        increaseImportTaskCount()
        const result = await ipcRendererInvoke('parse-audio-playlist', file)
        let msg = '导入歌单失败', success = false
        if (result) {
            const { name, data, total } = result
            if (name && data && data.length > 0) {
                try {
                    addLocalPlaylist(name, null, null, null, data)
                } catch (error) {
                    if (isDevEnv()) console.log(error)
                }
                const numText = total ? `${data.length} / ${total}` : `${data.length}`
                msg = `导入歌单已完成！<br>共${numText}首歌曲`
                success = true
            }
        }
        decreaseImportTaskCount()
        success ? showToast(msg) : showFailToast(msg)
        refreshTime.value = Date.now()
        if(success) loadContent()
    }
}

const removeAll = async () => {
    if (localPlaylists.value.length < 1) return

    if (isShowDialogBeforeClearLocalMusics.value) {
        const ok = await showConfirm('确定要清空本地歌曲吗？')
        if (!ok) return
    }
    
    showToast('本地歌曲已全部清空')
    resetAll()
    //refreshTime.value = Date.now()
    loadContent()
}

const randomPlay = async () => {
    const playlists = localPlaylists.value
    if(!playlists || playlists.length < 1) return 

    let total = 0
    const plSizes = playlists.map(item => {
        const { data } = item
        const size = data ? data.length : 0
        total += size
        return size
    })
    /*
    const total = plSizes.reduce((prev, curr, index, array) => {
        curr = prev + array[index]
        return curr
    }, 0)*/
    const num = Math.min(nextInt(20) + 10, total)
    const indexes = []
    let count = 0, accSize = 0, plIndex = 0, miss = 0
    const maxMiss = 2 * num
    do {
        const index = nextInt(total)
        if(!indexes.includes(index)) {
            indexes.push(index)
            ++count
        } else if (++miss >= maxMiss){
            break
        }
    } while(count < num)
    const errorMsg = '发生未知错误<br>无法为您播放歌曲'
    if (miss >= maxMiss) return showFailToast(errorMsg)
    const tracks = indexes.sort((e1, e2) => (e1 - e2))
        .map(index => {
            for(let i = plIndex; i < plSizes.length; i++ ) {
                const size = plSizes[i]
                if (index < (accSize + size)) {
                    const { data } = playlists[i]
                    const tIndex = index - accSize
                    if (data && data[tIndex]) return data[tIndex]
                }
                accSize += size
                ++plIndex
            }
        })
    if (!tracks || tracks.length < 1) return showFailToast(errorMsg)
    playTracks(shuffle(tracks))
    showToast('即将为您播放歌曲')
}


const tileOnDrop = (event, item, index) => {
    if(!item) return 
    event.preventDefault()
    const { files } = event.dataTransfer

    if (files.length < 1) return

    const { path } = files[0]
    let isEventStopped = true
    if (isSupportedImage(path)) {
        const { id, platform, title, tags, about, } = item
        const cover = path
        updateLocalPlaylist(id, title, tags, about, cover) && Object.assign(item, { cover })
    } else {
        isEventStopped = false
    }
    if (isEventStopped) event.stopPropagation()
}

const tileOnDrag = (event, item, index) => {
    const { title, data } = item || { }
    if(!title || !data) return
    const exportCfg = { data: [{ title, data: toRaw(data)}], noJson: true, title: '导出本地歌单' }
    showPlaylistExportToolbar(exportCfg)
}

const computedDraggable = computed(() => {
    return isUseDndForExportLocalPlaylistEnable.value
        && activeTypeIndex.value == 0
})

const computedAralFilterName = computed(() => {
    const name = aralFilterName.value
    return name.replace('%', '未知')
            .replace('#', '全部')
})

const tutorialList = [{
    title: '设置页-本地歌曲，开启其他功能',
    color: '#fc5185'
}, {
    title: '拖拽目录到当前页面，导入歌单',
    color: '#3fc1c9'
}, {
    title: '拖拽图片到当前控件，更新封面',
    color: '#3f72af'
}, {
    title: '轻轻拖拽当前控件，导出歌单',
    color: '#f08a5d'
}]



/* 生命周期、监听 */
const eventsRegistration = {
    'batchAction-localPlaylist-removed': loadContent
}

//watch(localPlaylists, loadContent, { deep: true })
watch(activeTypeIndex, loadContent)
watch(aralFilterName, filterByName)
watch(isSingleLineAlbumTitleStyle, (nv, ov) => {
    if(activeTypeIndex.value == 1) {
        setSingleLineTitleStyle(nv)
        //setAlbumArtistSutitle(nv)
    }
})

onMounted(() => {
    onEvents(eventsRegistration)
    loadContent()
})
onActivated(restoreScrollState)
onUnmounted(offEvents(eventsRegistration))
</script>

<template>
    <div id="local-music-view" 
        ref="localMusicRef" 
        @scroll="onScroll" 
        @dragover="e => e.preventDefault()" 
        @drop="onDrop"
        @click="() => setAralFilterShow(false)">
        <div class="header">
            <div class="title">本地歌曲</div>
            <div class="about" v-show="isLocalMusicViewTipsShow">
                <p>支持音频格式：mp3、flac、ogg、wav、aac、m4a、wma、ape等</p>
                <p>支持歌单格式：m3u、m3u8、pls</p>
                <p>歌单导入、导出，主要为兼容当前设备下的其他应用，不支持跨设备共享使用</p>
                <p>最近播放、收藏，暂时不支持本地歌曲</p>
                <p>歌曲信息乱码时，建议用第三方音乐标签工具修正后，再重新添加到当前应用</p>
            </div>
            <div class="action" :class="{ 'none-about': !isLocalMusicViewTipsShow }">
                <!--
                <CreatePlaylistBtn :leftAction="visitLocalPlaylistCreate">
                </CreatePlaylistBtn>
                -->
                <SvgTextButton text="导入歌单" 
                    :leftAction="importPlaylist" 
                    :rightAction="visitLocalPlaylistCreate"
                    :disabled="importTaskCount > 0">
                    <template #left-img>
                        <svg width="17" height="15" viewBox="0 0 853.89 768.02" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M426.89,768q-148.75,0-297.49,0C69.87,767.93,19.57,729.67,4.61,672.5a140.41,140.41,0,0,1-4.31-34c-.44-55.67-.29-111.33-.21-167,0-31.15,27.63-51.88,56.33-42.52,17.88,5.83,29.09,22.14,29.12,42.72q.1,65.51.06,131c0,11.66,0,23.33,0,35,.13,27.13,18,45.07,45.21,45.08q143,.07,286,0,152.49,0,305,0c10.8,0,20.87-2.11,29.52-8.91,11.68-9.19,16.88-21.33,16.83-36.16-.15-43,0-86,0-129,0-12.83-.15-25.66,0-38.49.26-17.27,7.72-30.64,23.12-38.64,14.61-7.57,29.38-6.72,43.18,2.34,12.62,8.29,19,20.52,19,35.47.17,57.83.86,115.67-.21,173.49-1.18,63.32-47.07,114.32-109.5,123.77a141.79,141.79,0,0,1-20.92,1.3Q574.88,768.07,426.89,768Z" />
                                    <path
                                        d="M394.63,450.06v-5.88q0-199.47,0-398.94c0-20.15,9.91-35.63,26.85-42.21,28.37-11,58.2,9.24,58.3,40,.19,62,.06,124,.06,186V451.28c2-1.84,3.34-3,4.57-4.19Q535.69,395.84,587,344.6c18.84-18.76,47.07-18,63.7,1.39a42.31,42.31,0,0,1-1.2,56.56c-8.5,9.16-17.56,17.79-26.4,26.63Q546,506.25,468.93,583.3c-15.5,15.47-36.33,18.46-53.8,7.71a51.86,51.86,0,0,1-9.31-7.48q-89.51-89.35-178.88-178.84c-13.46-13.48-17.06-31.76-9.79-48.24a42.62,42.62,0,0,1,41.2-25.38c11.71.55,21.35,5.62,29.57,13.87q40.38,40.57,80.91,81c8.22,8.23,16.38,16.53,24.57,24.8Z" />
                                </g>
                            </g>
                        </svg>
                    </template>
                    <template #right-img>
                        <svg width="18" height="18" viewBox="0 -50 768.02 554.57" xmlns="http://www.w3.org/2000/svg">
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
                <SvgTextButton text="随缘听" 
                    :leftAction="randomPlay"
                    class="spacing">
                    <template #left-img>
                        <svg width="16" height="16" viewBox="0 0 768.11 768.93" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path d="M384.2,509.12c-5.62,8.58-10.61,17-16.38,24.87-42.57,58-99.37,92.91-170.52,104A234.9,234.9,0,0,1,163,640.81c-43.5.32-87,.21-130.5.12C14.67,640.89.6,627.39.06,610.2-.53,591.75,13.72,577,32.51,577q63-.13,126,0c38.3,0,73.92-9.69,105.81-31,51.79-34.55,81.47-83,86.79-145.17A190.91,190.91,0,0,0,200.48,197.4c-14.06-3-28.73-4.05-43.14-4.24-41.65-.55-83.33-.1-125-.24-22.79-.08-38.09-22-30.3-43.11,4.44-12,15.83-20.7,28.59-20.74,46.67-.14,93.44-2,140,.48,92.18,4.86,162.42,48.2,210.63,127l2.76,4.54,3.21-5.28c42.17-69.24,103.1-111,183.24-123.77,15.53-2.49,31.5-2.64,47.29-3,21.65-.48,43.32-.12,66.19-.12-1.76-1.89-2.87-3.14-4-4.32-23.09-23.11-46.27-46.12-69.26-69.33C593.09,37.61,599.81,9,623.12,1.69,634.93-2,645.93.29,654.56,9c30.27,30.54,60.79,60.86,90.07,92.32,32.47,34.89,30.87,88.23-2.4,122.16Q699.53,267,656.63,310.4c-13.11,13.24-32.42,14.13-45.44,2.38-13.84-12.49-14.41-33.17-1-46.71C633,243.13,656,220.4,678.92,197.57c1.24-1.24,2.39-2.56,4.3-4.61h-4.29c-24.49,0-49-.21-73.49.08a192.07,192.07,0,0,0-182.25,139.8c-30.93,109.57,40,221.92,152.33,241.16a198.36,198.36,0,0,0,30.29,2.8c25.65.39,51.31.13,78.16.13-1.85-1.89-3-3.13-4.24-4.32q-34.37-33.51-68.71-67c-10.48-10.27-13.19-24.09-7.54-36.64a31.81,31.81,0,0,1,51.45-9.7c20.42,19.87,40.39,40.22,60.54,60.37,8.72,8.71,17.54,17.34,26.12,26.2,35.35,36.5,35.24,90.32-.31,126.63Q699,715.67,656.37,758.63c-18.25,18.36-48,11.12-54.62-13.24-3.35-12.28,0-23,9-32q34-33.84,68-67.76c1.26-1.25,2.45-2.57,4.48-4.71h-6.22c-24.33,0-48.7.78-73-.17-94.75-3.73-167.09-46.24-217-126.91Z"/>
                                </g>
                            </g>
                        </svg>
                    </template>
                </SvgTextButton>
                <BatchActionBtn :deleteBtn="true" :leftAction="visitBatchLocalMusic" :rightAction="removeAll"
                    popover-hint="圾桶图标按钮，点击后将清空全部本地歌单，请谨慎操作" class="spacing">
                </BatchActionBtn>
            </div>
        </div>
        <div class="center">
            <div class="list-title">
                <div class="size-text content-text-highlight">列表({{ tabData.length }})</div>
                <div class="action to-right">
                    <div class="filter-btn btn text-btn" 
                        v-show="activeTypeIndex > 0"
                        @click.stop="toggleAralFilterShow">
                        <svg width="17" height="17" viewBox="0 0 29.3 29.3">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M23.51,15.66H17.3a1.55,1.55,0,0,0-.56.11,1.45,1.45,0,0,0-1.11,1.41v6.38a5.77,5.77,0,0,0,5.76,5.76h2.16a5.76,5.76,0,0,0,5.75-5.76V21.41a5.76,5.76,0,0,0-5.77-5.75Zm2.85,7.91a2.86,2.86,0,0,1-2.85,2.86H21.35a2.86,2.86,0,0,1-2.85-2.86v-5h5a2.86,2.86,0,0,1,2.85,2.86ZM12.52,15.76a1.55,1.55,0,0,0-.56-.11H5.75A5.76,5.76,0,0,0,0,21.41v2.15a5.76,5.76,0,0,0,5.75,5.76H7.91a5.78,5.78,0,0,0,5.72-5.76V17.18A1.47,1.47,0,0,0,12.52,15.76Zm-1.76,7.8a2.86,2.86,0,0,1-2.85,2.86H5.75A2.86,2.86,0,0,1,2.9,23.56V21.41a2.86,2.86,0,0,1,2.85-2.86h5Zm-5-9.89H12a1.55,1.55,0,0,0,.56-.11,1.45,1.45,0,0,0,1.1-1.42V5.76A5.77,5.77,0,0,0,7.87,0H5.75A5.76,5.76,0,0,0,0,5.76V7.91a5.77,5.77,0,0,0,5.75,5.75ZM2.9,5.76A2.86,2.86,0,0,1,5.75,2.9H7.91a2.86,2.86,0,0,1,2.85,2.86v5h-5A2.86,2.86,0,0,1,2.91,7.9ZM23.51,0H21.35a5.78,5.78,0,0,0-5.72,5.76v6.38a1.45,1.45,0,0,0,1.15,1.42,1.55,1.55,0,0,0,.56.11h6.21A5.76,5.76,0,0,0,29.3,7.91V5.76A5.76,5.76,0,0,0,23.54,0Zm2.85,7.91a2.86,2.86,0,0,1-2.85,2.86h-5v-5a2.86,2.86,0,0,1,2.85-2.86h2.16a2.86,2.86,0,0,1,2.85,2.86Z" />
                                </g>
                            </g>
                        </svg>
                        <span v-html="computedAralFilterName"></span>
                    </div>
                    <div class="btn-group spacing1">
                        <div class="btn text-btn group-item first" 
                            :class="{ active: activeTypeIndex == 0 }"
                            @click="setActiveTypeIndex(0)">
                            <svg width="16" height="16" viewBox="0 -20 895.95 703.92" xmlns="http://www.w3.org/2000/svg">
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
                            <span>歌单</span>
                        </div>
                        <div class="btn text-btn group-item"
                            :class="{ active: activeTypeIndex == 1 }"
                            @click="setActiveTypeIndex(1)">
                            <svg width="16" height="16" viewBox="0 0 853.47 853.5" xmlns="http://www.w3.org/2000/svg" ><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M426.8,0C662.36.12,853.54,191.36,853.47,426.8S662,853.64,426.67,853.5C191.13,853.35-.11,662.05,0,426.67.11,191.14,191.42-.12,426.8,0ZM85.5,426.47C85.26,615.09,238,767.94,426.71,768c188.49,0,341-152.31,341.26-341S615.52,85.53,426.76,85.5C238.23,85.47,85.75,237.82,85.5,426.47Z"/><path d="M426.46,256c-47.09,1-87.6,17.3-120.63,50.49-32.87,33-49,73.41-49.87,120.08H171.28c-3.29-136.12,114-257.59,255.18-255.36Z"/><path d="M512,426.48a85.66,85.66,0,1,1-85.11-85.83A85.42,85.42,0,0,1,512,426.48Z"/></g></g></svg>
                            <span>专辑</span>
                        </div>
                        <div class="btn text-btn group-item last"
                            :class="{ active: activeTypeIndex == 2 }"
                            @click="setActiveTypeIndex(2)">
                            <svg width="16" height="16" viewBox="0 0 810 854.54" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M385,0c117.88.3,213.35,96.08,213,213.66-.38,118.12-95.71,213.26-213.49,213.07s-213.49-96.16-213-213.58C172,95,267.43-.3,385,0Zm-.58,341.47c70.36.28,127.94-56.94,128.31-127.5a128,128,0,1,0-256-.64C256.5,283.64,313.83,341.19,384.37,341.47Z"/><path d="M640.7,682.51v-20q0-74,0-148c0-19.27,8.52-33,25.74-41.6,27.27-13.56,54.42-27.36,81.76-40.78,25.87-12.7,55.2,1.93,61,30.15,3.72,18-5.84,37.41-22.29,45.6-18.92,9.41-37.7,19.1-56.66,28.43-3.37,1.66-4.38,3.6-4.38,7.23q.17,107.74.09,215.48c0,46.09-36,88-81.81,93.46-20.79,2.51-42,3.79-62.43-2.85-38.64-12.58-61.61-39.33-68.54-79.37-.83-4.8.79-10.24,2.08-15.17a97.51,97.51,0,0,1,100-72.67C623.48,682.9,631.8,682.51,640.7,682.51Z"/><path d="M312.19,512q56.49,0,113,0c21.61,0,38.67,12.73,43.48,32.1,6.92,27.84-13.42,53.25-43,53.34-46.49.15-93,0-139.46,0-25.33,0-50.66-.34-76,.16-65,1.29-119.65,52.93-123.4,117.82-1.79,30.89-.74,61.95-.8,92.94,0,9.06-1.78,17.5-6.67,25.2a42.56,42.56,0,0,1-47,18.26C14.33,847,1,831.09.85,812.66c-.32-32.49-1.95-65.13.39-97.45,6.53-89.82,52.23-152.77,135-188.31,25.72-11,53.08-14.93,81-14.92Z"/></g></g></svg>
                            <span>歌手</span>
                        </div>
                    </div>
                </div>
            </div>
            <transition name="fade-ex">
                <div class="aral-filter" v-show="isAralFilterShow"
                    @contextmenu.stop="" >
                    <ul>
                        <li class="item" v-for="(item, index) in ALPHABET_FILTER.split('')"
                            :class="{ first: (index == 0), active: (item == aralFilterName) }"
                            v-html="item" 
                            @click.stop="setAralFilterName(item)">
                        </li>
                    </ul>
                </div>
            </transition>
            <component 
                :is="currentTab"
                :data="tabData"
                :singleLineTitleStyle="singleLineTitleStyle"
                :isAlbumArtistSutitle="isAlbumArtistSutitle"
                :singleLineTitleStyleIgnoreArtistSutitle="true"
                :playable="true" 
                :loading="isLoading"
                :customLoadingCount="importTaskCount"
                :tileOnDropFn="tileOnDrop" 
                :draggable="computedDraggable" 
                :tileOnDragEndFn="tileOnDrag">
            </component>
            <PlaylistsControl 
                :data="tutorialList" 
                :playable="false"
                :tutorial="true"  
                v-show="isLocalMusicViewPlaylistTipsShow 
                    && localPlaylists.length < 1
                    && importTaskCount < 1">
            </PlaylistsControl>
        </div>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style>
#local-music-view {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 20px 33px;
    overflow: scroll;
    overflow-x: hidden;
}

#local-music-view .spacing {
    margin-left: 20px;
}

#local-music-view .spacing1 {
    margin-left: 30px;
}

#local-music-view .header {
    display: flex;
    flex-direction: column;
    margin-bottom: 15px;
}

#local-music-view .header .title {
    text-align: left;
    margin-bottom: 5px;
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
}

#local-music-view .header .about {
    text-align: left;
    margin-left: 5px;
    margin-bottom: 12px;
    line-height: 29px;
    color: var(--content-subtitle-text-color);
}

#local-music-view .header .action {
    display: flex;
}

#local-music-view .header .action.none-about {
    margin-top: 6px;
}

#local-music-view .center .list-title {
    margin-bottom: 0px;
    text-align: left;
    font-weight: bold;
    display: flex;
    position: relative;
}

#local-music-view .list-title .size-text {
    margin-left: 3px;
    padding-bottom: 6px;
    border-bottom: 3px solid var(--content-highlight-color);
    font-size: var(--content-text-tab-title-size);
}

#local-music-view .list-title .action {
    display: flex;
    align-items: center;
    font-weight: normal !important;
}

#local-music-view .list-title .action.to-right {
    position: absolute;
    right: 6px;
}

#local-music-view .list-title .action .filter-btn {
    display: flex;
    align-items: center;
}

#local-music-view .list-title .btn-group {
    display: flex;
    align-items: center;
    --btn-group-border-radius: var(--border-list-item-vertical-border-radius);
    /*border-radius: var(--border-inputs-border-radius);*/
    border-radius: var(--btn-group-border-radius);
    background: var(--content-list-item-hover-bg-color);
}

#local-music-view .list-title .group-item {
    padding: 6px 10px;
    display: flex;
    align-items: center;
}

#local-music-view .list-title .btn-group .group-item.first {
    margin-left: 0px;
    border-top-left-radius: var(--btn-group-border-radius);
    border-bottom-left-radius: var(--btn-group-border-radius);
}

#local-music-view .list-title .group-item.last {
    border-top-right-radius: var(--btn-group-border-radius);
    border-bottom-right-radius: var(--btn-group-border-radius);
}

#local-music-view .list-title .btn-group .group-item.active {
    font-weight: bold;
    background: var(--button-icon-text-btn-bg-color);
    color: var(--button-icon-text-btn-text-color);
}

#local-music-view .list-title .btn-group .group-item.active svg {
    fill: var(--button-icon-text-btn-icon-color);
}

#local-music-view .aral-filter {
    --height-factor: 20px;
    position: fixed;
    top: calc(var(--main-top-height) + 3px + var(--app-win-custom-shadow-size) + var(--height-factor) / 2 - 10px);
    right: calc(0px + var(--app-win-custom-shadow-size));
    height: calc(100% - var(--main-top-height) - var(--main-bottom-height) - 6px - 30px + 10px - var(--app-win-custom-shadow-size) * 2 - var(--height-factor));
    padding: 20px 0px;
    background: var(--app-bg-color);
    z-index: 99;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    overflow: auto;
    overflow-x: hidden;
    box-shadow: var(--box-shadow);
    border-top-left-radius: var(--border-popover-border-radius);
    border-bottom-left-radius: var(--border-popover-border-radius);
}

#local-music-view .aral-filter ul {
    padding: 0px 15px;
    background: transparent;
}

#local-music-view .aral-filter li {
    list-style: none;
    padding: 8px 0px;
    width: 108px;
    margin-top: 8px;
    text-align: center;
    font-size: calc(var(--content-text-size) - 1px);
    border-radius: var(--border-list-item-vertical-border-radius);
    cursor: pointer;
}

#local-music-view .aral-filter li.first {
    margin-top: 0px;
}

#local-music-view .aral-filter li.active {
    background: var(--content-list-item-hl-bg-color) !important;
    color: var(--content-list-item-hl-text-color) !important;
    transform: scale(1.03);
}

#local-music-view .aral-filter li:hover {
    background: var(--content-list-item-hover-bg-color);
}


/* 防抖：统一样式 */
#local-music-view .center .playlists-ctl,
#local-music-view .center .albumlist-ctl,
#local-music-view .center .artistlist-ctl {
    margin-top: 2px;
}

.contrast-mode #local-music-view .aral-filter li.active {
    font-weight: bold;
}
</style>