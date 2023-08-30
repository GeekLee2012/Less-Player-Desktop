<script setup>
import { computed, ref, toRaw, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { useIpcRenderer, isWinOS, toTrimString } from '../../common/Utils';



const ipcRenderer = useIpcRenderer()

const { playlistExportContextItem } = storeToRefs(useAppCommonStore())
const { showToast, hidePlaylistExportToolbar } = useAppCommonStore()

const title = ref('导出Playlist')
const setTitle = (value) => {
    title.value = value || '导出Playlist'
}

const playlistFormats = [{
    id: 'm3u',
    name: 'm3u',
}, {
    id: 'pls',
    name: 'pls',
}, {
    id: 'json',
    name: 'json',
}]

const formatIndex = ref(0)
const setPlaylistFormat = (item, index) => {
    formatIndex.value = index
}

const filteredPlaylistFormats = ref(playlistFormats)

const exportPathRef = ref(null)
const selectDir = async () => {
    if (!ipcRenderer || !exportPathRef.value) return
    const result = await ipcRenderer.invoke('open-dirs')
    if (result) {
        exportPathRef.value.value = result[0]
    }
}

const exportNameRef = ref(null)
const exportPlaylist = async () => {
    if (!ipcRenderer || !exportPathRef.value) return
    const path = toTrimString(exportPathRef.value.value)
    //const name = toTrimString(exportNameRef.value.value)
    if (!path || path.length < 1) return
    //if (!name || name.length < 1) return

    const format = playlistFormats[formatIndex.value].id
    let { data, formatFn } = playlistExportContextItem.value
    if (formatFn) data = formatFn(data, format)
    data = toRaw(data)

    const result = await ipcRenderer.invoke('export-playlists', { path, format, data })
    let msg = '导出失败！'
    if (result) {
        hidePlaylistExportToolbar()
        msg = '导出成功！'
    }
    showToast(msg)
}

watch(playlistExportContextItem, (nv, ov) => {
    if (!nv) return
    const { noJson, title } = nv
    setTitle(title)
    const key = noJson ? 'json' : 'uuundefined'
    filteredPlaylistFormats.value = playlistFormats.filter(item => (item.id != key))
}, { immediate: true })
</script>

<template>
    <div class="playlist-export-toolbar" v-gesture-dnm="{ trigger: '.header' }" @keydown.stop="">
        <div class="container" :class="{ 'container-win-style': isWinOS() }">
            <div class="header">
                <div class="action left-action">
                    <div class="close-btn btn" @click="hidePlaylistExportToolbar">
                        <svg width="12" height="12" viewBox="0 0 593.14 593.11" data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z"
                                transform="translate(-663.4 -243.46)" />
                        </svg>
                    </div>
                </div>
                <div class="title-wrap">
                    <div class="title" v-html="title"></div>
                </div>
                <div class="action right-action">
                    <div class="save-btn text-btn" @click="exportPlaylist">
                        <svg width="15" height="15" viewBox="0 0 853.61 853.59" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M426.39,853.55h-199c-32.66,0-65.33.12-98,0C69.66,853.23,19.5,815.14,4.57,758.06A138.7,138.7,0,0,1,.21,723.51Q-.18,426.78.06,130.05c0-64,42.59-115.66,105-127.71A135.26,135.26,0,0,1,130.43.14q232-.19,464-.14c13.93,0,25.46,4.72,35.34,14.64Q733.72,118.89,838,222.83c10.58,10.53,15.62,22.58,15.61,37.48-.13,154,.12,308-.2,462-.1,53.18-24.09,92.8-71.21,117.81-18.61,9.87-38.86,13.47-59.83,13.47Q574.38,853.52,426.39,853.55Zm-170-640h6.94q143.49,0,287,0c3,0,6,0,9,.23,22.36,1.7,40.48,23.55,38,45.78-2.61,23.46-20.15,39.22-43.88,39.22q-168.49,0-337,0c-27.74,0-45.64-17.9-45.64-45.63q0-80.73,0-161.48V85.85c-16.65,0-32.66-.59-48.59.31-6,.33-12.33,3.23-17.49,6.55-13.7,8.82-19.26,22-19.25,38.28q.18,295.72.08,591.45c0,1.67,0,3.33.06,5,.74,18.92,14,35.43,32.57,39.27,7.24,1.5,14.89,1.14,22.36,1.29,9.94.19,19.88,0,30.26,0v-6.49q0-144.49,0-289c0-28,17.85-45.78,46-45.78h420c28.4,0,46,17.71,46,46.22V768c13.88,0,27,0,40.19,0,27.25,0,45-17.78,45-45q0-222.22.08-444.46a10.66,10.66,0,0,0-3.39-8.3q-90.8-90.57-181.37-181.34A10.63,10.63,0,0,0,575,85.48q-156.49.12-313,.07h-5.71Zm340.86,554.3V512.5H256.41V767.85Z" />
                                </g>
                            </g>
                        </svg>
                        <span>确定</span>
                    </div>
                </div>
            </div>
            <div class="center">
                <div class="row first">
                    <div class="cate-name">文件格式：</div>
                    <div class="row-content">
                        <span v-for="(item, index) in filteredPlaylistFormats" class="list-item"
                            :class="{ active: index == formatIndex }" @click="setPlaylistFormat(item, index)"
                            v-html="item.name">
                        </span>
                    </div>
                </div>
                <div class="row">
                    <div class="cate-name">存储目录：</div>
                    <div class="row-content">
                        <div class="dir-input-ctl">
                            <input class="text-input-ctl" ref="exportPathRef" placeholder="文件存储目录" />
                            <div class="select-btn" @click="selectDir">选择</div>
                        </div>
                    </div>
                </div>
                <!--
                <div class="row" v-show="false">
                    <div class="cate-name">文件名称：</div>
                    <div class="row-content">
                        <div class="name-input-ctl">
                            <input class="text-input-ctl" ref="exportNameRef" placeholder="文件名称" />
                        </div>
                    </div>
                </div>
                -->
            </div>
        </div>
    </div>
</template>

<style scoped>
.playlist-export-toolbar {
    display: flex;
    /*flex-direction: column;*/
    overflow: hidden;
    border-radius: 15px;
    -webkit-app-region: none;
}

.playlist-export-toolbar .container {
    display: flex;
    flex: 1;
    flex-direction: column;
}

.playlist-export-toolbar .spacing {
    margin-left: 15px;
}

.playlist-export-toolbar .header,
.playlist-export-toolbar .center,
.playlist-export-toolbar .header .title-wrap,
.playlist-export-toolbar .center .bands {
    display: flex;
    flex-direction: row;
}

.playlist-export-toolbar .header {
    padding: 10px 18px 10px 6px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--content-header-nav-bg-color);
    border-bottom: 1px solid var(--border-color);
}

.playlist-export-toolbar .header .action {
    display: flex;
}

.playlist-export-toolbar .header .action .close-btn {
    width: 30px;
}

.playlist-export-toolbar .header .title-wrap {
    margin-left: 6px;
    flex: 1;
    display: flex;
}

.playlist-export-toolbar .header .title {
    font-size: var(--content-text-size);
}

.playlist-export-toolbar .text-btn {
    text-align: left;
    font-size: var(--content-text-tip-text-size);
    display: flex;
    align-items: center;
    justify-items: center;
    margin-left: 33px;
    cursor: pointer;
}


.playlist-export-toolbar .center {
    padding: 0px 33px;
    flex: 1;
    background: var(--content-bg-color);
    overflow: hidden;
    align-items: flex-start;
    display: flex;
    flex-direction: column;
    overflow: scroll;
    overflow-x: hidden;
}

.playlist-export-toolbar .center .first {
    margin-top: 25px;
}

.playlist-export-toolbar .center .row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    margin-bottom: 30px;
}

.playlist-export-toolbar .center .row .cate-name {
    width: 99px;
    text-align: left;
    margin-right: 10px;
    margin-top: 3px;
}

.playlist-export-toolbar .center .row-content {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
    flex: 1;
}

.playlist-export-toolbar .center .row-content .list-item {
    min-width: 68px;
    padding: 6px;
    text-align: center;
    border-radius: 10rem;
    margin-right: 20px;
    border: 0px solid var(--border-color);
    cursor: pointer;
}

.playlist-export-toolbar .center .row-content .active {
    background: var(--button-icon-text-btn-bg-color) !important;
    color: var(--button-icon-text-btn-icon-color) !important;
}

.playlist-export-toolbar .center .dir-input-ctl {
    display: flex;
    align-items: center;
}

.playlist-export-toolbar .center .dir-input-ctl .text-input-ctl {
    border-top-right-radius: 0px !important;
    border-bottom-right-radius: 0px !important;
}

.playlist-export-toolbar .center .dir-input-ctl .select-btn {
    background: var(--button-icon-text-btn-bg-color);
    color: var(--button-icon-text-btn-icon-color);
    width: 68px;
    height: 37.5px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--button-icon-text-btn-bg-color);
    border-top-right-radius: 3px;
    border-bottom-right-radius: 3px;
    font-size: var(--content-text-tip-text-size);
    cursor: pointer;
}

/* 别扭挖坑的方式 */
.playlist-export-toolbar .container-win-style .dir-input-ctl .select-btn {
    height: 40px;
}

/*
.playlist-export-toolbar .name-input-ctl .text-input-ctl {
    width: 325px;
}
*/
</style>