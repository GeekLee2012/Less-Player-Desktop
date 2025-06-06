<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'LocalMusicView'
}
</script>

<script setup>
import { inject, onMounted, ref, toRaw } from 'vue';
import { storeToRefs } from 'pinia';
import CreatePlaylistBtn from '../components/CreatePlaylistBtn.vue';
import { useLocalMusicStore } from '../store/localMusicStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';
import PlaylistsControl from '../components/PlaylistsControl.vue';
import BatchActionBtn from '../components/BatchActionBtn.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import { isDevEnv, ipcRendererInvoke, isSupportedImage } from "../../common/Utils";



const { visitLocalPlaylistCreate, visitBatchLocalMusic } = inject('appRoute')
const { showConfirm } = inject('apiExpose')

const { localPlaylists, importTaskCount } = storeToRefs(useLocalMusicStore())
const { addLocalPlaylist, updateLocalPlaylist, resetAll,
    increaseImportTaskCount, decreaseImportTaskCount } = useLocalMusicStore()
const { showToast, showFailToast, hideAllCtxMenus, showPlaylistExportToolbar } = useAppCommonStore()
const { isUseDndForCreateLocalPlaylistEnable,
    isUseDeeplyScanForDirectoryEnable,
    isShowDialogBeforeClearLocalMusics,
    isLocalMusicViewTipsShow, 
    isLocalMusicViewPlaylistTipsShow,
    isUseDndForExportLocalPlaylistEnable, } = storeToRefs(useSettingStore())

const localMusicRef = ref(null)
const back2TopBtnRef = ref(null)

const isLoading = ref(false)
const setLoading = (value) => isLoading.value = value

const resetBack2TopBtn = () => {
    if (back2TopBtnRef.value) back2TopBtnRef.value.setScrollTarget(localMusicRef.value)
}

const onScroll = () => {
    hideAllCtxMenus()
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
        if (success) showToast(msg)
        if (!success) showFailToast(msg)
        refreshTime.value = Date.now()
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
    refreshTime.value = Date.now()
}

const playlistOnDrop = (event, item, index) => {
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

const playlistOnDrag = (event, item, index) => {
    const { title, data } = item || { }
    if(!title || !data) return
    const exportCfg = { data: [{ title, data: toRaw(data)}], noJson: true, title: '导出本地歌单' }
    showPlaylistExportToolbar(exportCfg)
}

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
onMounted(() => resetBack2TopBtn())
</script>

<template>
    <div id="local-music-view" ref="localMusicRef" @scroll="onScroll" @dragover="e => e.preventDefault()" @drop="onDrop">
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
                <CreatePlaylistBtn :leftAction="visitLocalPlaylistCreate">
                </CreatePlaylistBtn>
                <SvgTextButton text="导入歌单" :leftAction="importPlaylist" :disabled="importTaskCount > 0" class="spacing">
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
                </SvgTextButton>
                <BatchActionBtn :deleteBtn="true" :leftAction="visitBatchLocalMusic" :rightAction="removeAll"
                    popover-hint="圾桶图标按钮，点击后将清空全部本地歌单，请谨慎操作" class="spacing">
                </BatchActionBtn>
            </div>
        </div>
        <div class="center">
            <div class="list-title">
                <div class="size-text content-text-highlight">歌单列表({{ localPlaylists.length }})</div>
            </div>
            <PlaylistsControl 
                :data="localPlaylists" 
                :playable="true" 
                :customLoadingCount="importTaskCount"
                :tileOnDropFn="playlistOnDrop" 
                :draggable="isUseDndForExportLocalPlaylistEnable" 
                :tileOnDragEndFn="playlistOnDrag">
            </PlaylistsControl>
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
</style>