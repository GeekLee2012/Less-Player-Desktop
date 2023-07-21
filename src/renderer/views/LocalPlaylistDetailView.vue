<script setup>
import { onMounted, onActivated, ref, reactive, watch, onUpdated, inject, onDeactivated, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlayStore } from '../store/playStore';
import SongListControl from '../components/SongListControl.vue';
import { useAppCommonStore } from '../store/appCommonStore';
import { useLocalMusicStore } from '../store/localMusicStore';
import { useSettingStore } from '../store/settingStore';
import { toYyyymmddHhMmSs } from '../../common/Times';
import PlayAddAllBtn from '../components/PlayAddAllBtn.vue';
import AddFolderFileBtn from '../components/AddFolderFileBtn.vue';
import BatchActionBtn from '../components/BatchActionBtn.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import { usePlatformStore } from '../store/platformStore';
import { useIpcRenderer } from "../../common/Utils";



const props = defineProps({
    exploreMode: String,
    id: String
})

const { visitLocalPlaylistEdit, visitBatchLocalPlaylist } = inject('appRoute')
const { showConfirm } = inject('appCommon')

const ipcRenderer = useIpcRenderer()

const { addTracks, resetQueue, playNextTrack } = usePlayStore()
const { showToast, updateCommonCtxItem,
    hideAllCtxMenus, showFailToast,
    setSearchBarExclusiveAction } = useAppCommonStore()
const { searchBarExclusiveAction } = storeToRefs(useAppCommonStore())
const { getLocalPlaylist, addToLocalPlaylist,
    removeFromLocalPlaylist, removeAllFromLocalPlaylist } = useLocalMusicStore()
const { currentPlatformCode } = storeToRefs(usePlatformStore())
const { isUseDndForAddLocalTracksEnable, isUseDeeplyScanForDirectoryEnable,
    isSearchForLocalPlaylistShow, isShowDialogBeforeBatchDelete,
    getPaginationStyleIndex } = storeToRefs(useSettingStore())

const playlistDetailRef = ref(null)
const back2TopBtnRef = ref(null)
const detail = reactive({})
let offset = 0, page = 1, limit = 1000, total = 0
let markScrollTop = 0
const isLoading = ref(false)
const setLoading = (value) => isLoading.value = value
const searchKeyword = ref(null)
const setSearchKeyword = (value) => searchKeyword.value = value

const resetView = () => {
    Object.assign(detail, { cover: 'default_cover.png', title: '', tags: null, about: '', data: [] })
    offset = 0
    page = 1
    total = 0
}

const nextPage = () => {
    //if (detail.data.length >= total) return false
    //offset = page * limit
    //page = page + 1
    return false
}

const filterSongsWithKeyword = (list) => {
    let keyword = searchKeyword.value
    let result = list
    if (keyword) {
        keyword = keyword.toLowerCase()
        result = result.filter(item => {
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
    return result
}

const loadContent = () => {
    setLoading(true)
    const playlist = getLocalPlaylist(props.id)
    if (!playlist) {
        Object.assign(detail, { title: '当前歌单找不到啦', about: '神秘代码：404', data: [], updated: Date.now() })
        return
    }
    Object.assign(detail, { ...playlist })
    updateCommonCtxItem(playlist)
    //const platform = currentPlatformCode.value
    const { data } = playlist
    const filtredData = filterSongsWithKeyword(data)
    Object.assign(detail, { data: filtredData })
    setLoading(false)
}

const loadMoreContent = () => {
    if (nextPage()) {
        loadContent()
    }
}

const getAbout = () => {
    return (detail.about && detail.about.trim().length > 0) ?
        detail.about.trim() : "还没有简介 ~"
}

const playAll = () => {
    if (detail.data.length < 1) return
    resetQueue()
    addAll("即将为您播放全部！")
    playNextTrack()
}

const addAll = (text) => {
    if (detail.data.length < 1) return
    addTracks(detail.data)
    showToast(text || "歌曲已全部添加！")
}

const markScrollState = () => {
    markScrollTop = playlistDetailRef.value.scrollTop
}

const resetScrollState = () => {
    markScrollTop = 0
    playlistDetailRef.value.scrollTop = markScrollTop
}

const restoreScrollState = () => {
    if (markScrollTop < 1) return
    playlistDetailRef.value.scrollTop = markScrollTop
}

const scrollToLoad = () => {
    const scrollTop = playlistDetailRef.value.scrollTop
    const scrollHeight = playlistDetailRef.value.scrollHeight
    const clientHeight = playlistDetailRef.value.clientHeight
    markScrollState()
    if ((scrollTop + clientHeight) >= scrollHeight) {
        loadMoreContent()
    }
}

const onScroll = () => {
    hideAllCtxMenus()
    scrollToLoad()
}

const resetBack2TopBtn = () => {
    if (!back2TopBtnRef.value || !playlistDetailRef.value) return
    back2TopBtnRef.value.setScrollTarget(playlistDetailRef.value)
}

const removeAll = async () => {
    if (!detail.data || detail.data.length < 1) return

    let ok = true
    if (isShowDialogBeforeBatchDelete.value) ok = await showConfirm({ msg: '确定要清空歌单吗？' })
    if (!ok) return

    removeAllFromLocalPlaylist(props.id)
    detail.data.length = 0
    showToast("全部歌曲已删除！")
}

const addFolders = async () => {
    if (!ipcRenderer) return
    const dirs = await ipcRenderer.invoke('open-dirs')
    let msg = '文件夹添加失败！', success = false
    if (!dirs) return
    setLoading(true)
    const result = await ipcRenderer.invoke('open-audio-dirs', dirs, isUseDeeplyScanForDirectoryEnable.value)
    if (result && result.length > 0) {
        let count = 0
        result.forEach(({ data }) => data.forEach(item => {
            addToLocalPlaylist(props.id, item)
            ++count
        }))
        msg = `文件夹添加成功！<br>共新增${count}首歌曲！`
        success = true
    }
    if (success) showToast(msg)
    if (!success) showFailToast(msg)
    setLoading(false)
}

const addFiles = async () => {
    if (!ipcRenderer) return
    const result = await ipcRenderer.invoke('open-audios')
    if (!result || result.length < 1) return
    //let msg = '文件添加失败！', success = false
    result.forEach(item => addToLocalPlaylist(props.id, item))
    const msg = `文件添加成功！<br>共新增${result.length}首歌曲！`
    showToast(msg)
    //success = true
    //if (success) showToast(msg)
    //if (!success) showFailToast(msg)
}

const onDrop = async (event) => {
    if (!ipcRenderer) return
    if (!isUseDndForAddLocalTracksEnable.value) {
        showFailToast('拖拽还没有启用哦！<br>请重新检查设置。')
        return
    }
    event.preventDefault()

    const { files } = event.dataTransfer
    if (files.length > 1) {
        showFailToast('还不支持多文件拖拽！')
        return
    }
    const { name, path } = files[0]
    setLoading(true)
    const result = await ipcRenderer.invoke('dnd-open-audios', path, isUseDeeplyScanForDirectoryEnable.value)
    let msg = '添加操作失败！', success = false
    if (result && result.length > 0) {
        let count = 0
        result.forEach(({ data }) => data.forEach(item => {
            addToLocalPlaylist(props.id, item)
            ++count
        }))
        msg = `添加操作成功！<br>共新增${count}首歌曲！`
        success = true
    }
    setLoading(false)
    if (success) showToast(msg)
    if (!success) showFailToast(msg)
}

const toggleUseSearchBar = () => {
    if (!isSearchForLocalPlaylistShow.value) return
    const action = searchBarExclusiveAction.value ? null : setSearchKeyword
    setSearchBarExclusiveAction(action)
}

onActivated(() => {
    restoreScrollState()
    loadContent()
})

watch(() => props.id, () => {
    resetView()
    resetScrollState()
    resetBack2TopBtn()
    loadContent()
})

watch([currentPlatformCode, searchKeyword], loadContent)

onMounted(() => {
    resetView()
    resetBack2TopBtn()
    loadContent()
})


//TODO
onUpdated(() => {
    resetBack2TopBtn()
})

onDeactivated(() => {
    setSearchBarExclusiveAction(null)
    setSearchKeyword(null)
})
</script>

<template>
    <div id="local-playlist-detail-view" ref="playlistDetailRef" @scroll="onScroll" @dragover="e => e.preventDefault()"
        @drop="onDrop">
        <div class="header">
            <div>
                <img class="cover" v-lazy="detail.cover" />
            </div>
            <div class="right">
                <div class="title" v-html="detail.title"></div>
                <div class="about" v-html="getAbout()"></div>
                <div class="edit">
                    <div @click="() => visitLocalPlaylistEdit(id)" v-show="detail.id">
                        <svg width="16" height="16" viewBox="0 0 992.3 992.23" xmlns="http://www.w3.org/2000/svg">
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
                    <div class="time spacing">
                        <span>最后更新：{{ toYyyymmddHhMmSs(detail.updated) }}</span>
                    </div>
                </div>
                <div class="action">
                    <PlayAddAllBtn class="btn-spacing" :leftAction="playAll" :rightAction="() => addAll()"
                        :disabled="isLoading">
                    </PlayAddAllBtn>
                    <AddFolderFileBtn :leftAction="addFolders" :rightAction="addFiles" class="btn-spacing"
                        :disabled="isLoading">
                    </AddFolderFileBtn>
                    <BatchActionBtn :deleteBtn="true" :leftAction="() => visitBatchLocalPlaylist(id)"
                        :rightAction="removeAll" :disabled="isLoading">
                    </BatchActionBtn>
                </div>
            </div>
        </div>
        <div class="center">
            <div class="list-title">
                <span class="content-text-highlight">歌曲({{ detail.data.length }})</span>
                <div class="search-wrap checkbox text-btn" @click="toggleUseSearchBar"
                    v-show="isSearchForLocalPlaylistShow">
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
            </div>
            <SongListControl :data="detail.data" :artistVisitable="true" :albumVisitable="true" :dataType="1" :id="id"
                :loading="isLoading" :paginationStyleType="getPaginationStyleIndex" :pageLimit="30"
                :onPageLoaded="resetScrollState">
            </SongListControl>
        </div>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style scoped>
#local-playlist-detail-view {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 20px 33px 10px 33px;
    overflow: scroll;
    overflow-x: hidden;
}

#local-playlist-detail-view .header {
    display: flex;
    flex-direction: row;
    margin-bottom: 25px;
}

#local-playlist-detail-view .header .right {
    flex: 1;
    margin-left: 30px;
}

#local-playlist-detail-view .header .title,
#local-playlist-detail-view .header .about {
    text-align: left;
    margin-bottom: 10px;
}

#local-playlist-detail-view .header .title {
    /*font-size: 30px;*/
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
}

#local-playlist-detail-view .header .about {
    min-height: 99px;
    /*line-height: 21px;*/
    line-height: var(--content-text-line-height);
    color: var(--content-subtitle-text-color);
    overflow: hidden;
    word-wrap: break-all;
    white-space: pre-wrap;
    line-break: anywhere;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 5;
    margin-bottom: 10px;
    /*font-size: 15px;*/
}

#local-playlist-detail-view .right .edit {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 15px;
}

#local-playlist-detail-view .spacing {
    margin-left: 6px;
}

#local-playlist-detail-view .edit svg {
    fill: var(--button-icon-btn-color);
    cursor: pointer;
}

#local-playlist-detail-view .edit svg:hover {
    fill: var(--content-highlight-color);
}

#local-playlist-detail-view .time {
    /*font-size: 13px;*/
    font-size: var(--content-text-tip-text-size);
    font-weight: 520;
    color: var(--content-subtitle-text-color);
    text-align: left;
}

#local-playlist-detail-view .header .cover {
    width: 233px;
    height: 233px;
    border-radius: 6px;
    box-shadow: 0px 0px 1px #161616;
}

#local-playlist-detail-view .action {
    display: flex;
    flex-direction: row;
}

#local-playlist-detail-view .btn-spacing {
    margin-right: 20px;
}

#local-playlist-detail-view .list-title {
    position: relative;
    margin-left: 3px;
    margin-bottom: 10px;
    text-align: left;
    font-size: 16px;
    font-weight: bold;
    display: flex;
}

#local-playlist-detail-view .checkbox {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-left: 8px;
    margin-right: 15px;
    cursor: pointer;
}

#local-playlist-detail-view .search-wrap {
    position: absolute;
    right: -10px;
    display: flex;
    align-items: center;
    font-weight: bold;
}
</style>