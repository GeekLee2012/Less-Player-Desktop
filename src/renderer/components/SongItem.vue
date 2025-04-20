<script setup>
import { ref, watch, inject, computed, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlayStore } from '../store/playStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { usePlatformStore } from '../store/platformStore';
import { useSettingStore } from '../store/settingStore';
import { Track } from '../../common/Track';
import ArtistControl from './ArtistControl.vue';
import AlbumControl from './AlbumControl.vue';
import { toTrimString, escapeHtml } from '../../common/Utils';
import { Playlist } from '../../common/Playlist';
import { onEvents, emitEvents, offEvents } from '../../common/EventBusWrapper';



const props = defineProps({
    index: Number,
    artistVisitable: Boolean,
    albumVisitable: Boolean,
    data: Object, //Track
    deleteFn: Function,
    dataType: Number,
    checkbox: Boolean,
    checked: Boolean,
    ignoreCheckAllEvent: Boolean,
    checkChangedFn: Function,
    draggable: Boolean,
    resourceMode: Boolean
})

const { playVideoItem, dndSaveTrack, loadTrackUrl, loadTrackLyric, notifyLyricLoaded  } = inject('player')
const { showContextMenu } = inject('appCommon')

const { playing, currentTrack } = storeToRefs(usePlayStore())
const { addTrack, playTrack, togglePlay } = usePlayStore()
const { commonCtxMenuCacheItem, workingTrackForResourceToolView } = storeToRefs(useAppCommonStore())
const { showToast, showFailToast } = useAppCommonStore()
const { track, isHighlightCtxMenuItemEnable, isDndSaveEnable, isSongItemIndexShow } = storeToRefs(useSettingStore())
const { isLocalMusic } = usePlatformStore()


const isChecked = ref(props.checked)
const toggleCheck = () => {
    const { checkbox, checkChangedFn, checked } = props
    if (!checkbox) return
    setChecked(!isChecked.value)
    if (checkChangedFn) checkChangedFn(isChecked.value, { index: props.index, ...props.data })
}

const setChecked = (value) => isChecked.value = value

const playItem = () => {
    playTrack(props.data)
}

const addItem = () => {
    addTrack(props.data)
    showToast("歌曲添加成功")
}

const deleteItem = () => {
    const { deleteFn, index, data } = props
    if (deleteFn) {
        deleteFn(index)
        showToast("歌曲已删除")
    }
}

const onContextMenu = (event) => {
    if (props.checkbox || props.resourceMode) return
    const { data, dataType, index, contextMenuCallback } = props
    showContextMenu(event, data, dataType || 0, index)
}

const getItemTrackUrl = async () => {
    const { data } = props
    const workingTrack = workingTrackForResourceToolView.value || currentTrack.value
    if(!workingTrack) return 
    let result = data 
    if(!Track.hasUrl(result)) result = await loadTrackUrl(data)
    if(!Track.hasUrl(result)) return showFailToast('当前歌曲无音源')
    const { url } = result
    //更新音源url
    Object.assign(workingTrack, { url })
    playTrack(workingTrack)
    showToast('音源已加载<br>即将为您播放')
}

const getItemCover = () => {
    const { data } = props
    const { cover } = data
    const workingTrack = workingTrackForResourceToolView.value || currentTrack.value
    if(!workingTrack) return 
    Object.assign(workingTrack, { cover })
}

const getItemLyric = async () => {
    const { data } = props
    const workingTrack = workingTrackForResourceToolView.value || currentTrack.value
    if(!workingTrack) return 
    let result = data 
    if(!Track.hasLyric(result)) result = await loadTrackLyric(data)
    const { lyric, lyricTrans, lyricRoma } = result
    if(!Track.hasLyric(result)) return showFailToast('当前歌曲无歌词资源')
    //更新歌词
    Object.assign(workingTrack, { lyric, lyricTrans, lyricRoma  })
    notifyLyricLoaded(workingTrack)
    showToast('歌词资源已加载')
}




watch(() => props.checked, (nv, ov) => {
    if (props.ignoreCheckAllEvent) return
    setChecked(nv)
})

const isExtra1Available = () => {
    const { extra1 } = props.data
    if (typeof extra1 === 'string') {
        return extra1 ? extra1.trim().length > 0 : false
    }
    return false
}

const isExtra2Available = () => {
    const { extra2 } = props.data
    if (typeof extra2 === 'string') {
        return extra2 ? extra2.trim().length > 0 : false
    }
    return false
}

const showVipFlag = (data) => {
    return track.value.vipFlagShow && Track.isVip(data)
}

const showAudioTypeFlag = (data) => {
    return track.value.audioTypeFlagShow && hasAudioType(data)
}

const hasAudioType = (data) => {
    return getAudioTypeFlagText(data)
}

const getAudioTypeFlagText = (data) => {
    const { platform, url } = data
    if (!isLocalMusic(platform)) return null
    const index = url.lastIndexOf('.')
    if (index > 0) return url.substring(index + 1).toUpperCase()
    return null
}

const isDraggable = computed(() => {
    const { data, draggable } = props
    const { platform } = data
    return draggable
        && isDndSaveEnable.value
        && !isLocalMusic(platform)
        && !Playlist.isFMRadioType(data)
})


/* 生命周期、监听 */
const eventsRegistration = {
    'checkbox-refresh': () => setChecked(false), 
}
onMounted(() => onEvents(eventsRegistration))
onUnmounted(() => offEvents(eventsRegistration))
</script>

<template>
    <div class="song-item" 
        :class="{ 
            'list-item-ctx-menu-trigger': isHighlightCtxMenuItemEnable 
                && (commonCtxMenuCacheItem == data 
                    || workingTrackForResourceToolView == data),
            'selection-mode': checkbox,
            'resouces-mode': resourceMode,
        }"
        @click="toggleCheck" 
        @contextmenu.stop="onContextMenu"
        :draggable="isDraggable" 
        @dragstart="(event) => dndSaveTrack(event, data)">
        <div v-show="checkbox" class="checkbox">
            <svg v-show="!isChecked" width="16" height="16" viewBox="0 0 731.64 731.66" xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <path
                            d="M365.63,731.65q-120.24,0-240.47,0c-54.2,0-99.43-30.93-117.6-80.11A124.59,124.59,0,0,1,0,608q0-242.21,0-484.42C.11,60.68,43.7,10.45,105.88,1.23A128.67,128.67,0,0,1,124.81.06q241-.09,481.93,0c61.43,0,110.72,39.85,122.49,99.08a131.72,131.72,0,0,1,2.3,25.32q.19,241.47.07,482.93c0,60.87-40.25,110.36-99.18,121.9a142.56,142.56,0,0,1-26.83,2.29Q485.61,731.81,365.63,731.65ZM48.85,365.45q0,121.76,0,243.5c0,41.57,32.38,73.82,73.95,73.83q243,.06,486,0c41.57,0,73.93-32.24,73.95-73.84q.11-243.24,0-486.49c0-41.3-32.45-73.55-73.7-73.57q-243.24-.06-486.49,0a74.33,74.33,0,0,0-14.89,1.42c-34.77,7.2-58.77,36.58-58.8,72.1Q48.76,244,48.85,365.45Z" />
                    </g>
                </g>
            </svg>
            <svg v-show="isChecked" class="checked-svg" width="16" height="16" viewBox="0 0 767.89 767.94"
                xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <path
                            d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                    </g>
                </g>
            </svg>
        </div>
        <div v-show="!checkbox && isSongItemIndexShow" class="sqno">{{ index + 1 }}</div>
        <div class="vipflag textflag" v-show="showVipFlag(data)" :class="{ spacing: !checkbox || !resourceMode }">
            <span>VIP</span>
        </div>
        <div class="mv" v-show="!checkbox && Track.hasMv(data) && !resourceMode" :class="{ spacing: !(checkbox || showVipFlag(data) || resourceMode) }">
            <svg @click="playVideoItem(data)" width="18" height="15" viewBox="0 0 1024 853.52" xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <path
                            d="M1024,158.76v536c-.3,1.61-.58,3.21-.92,4.81-2.52,12-3.91,24.43-7.76,36-23.93,72-88.54,117.91-165.13,117.92q-338.19,0-676.4-.1a205.81,205.81,0,0,1-32.3-2.69C76,840.18,19.81,787.63,5,723.14c-2.15-9.35-3.36-18.91-5-28.38v-537c.3-1.26.66-2.51.89-3.79,1.6-8.83,2.52-17.84,4.85-26.48C26.32,51.12,93.47.05,173.29,0Q512,0,850.72.13a200.6,200.6,0,0,1,31.8,2.68C948.44,13.47,1004,65.66,1019.09,130.88,1021.21,140.06,1022.39,149.46,1024,158.76ZM384,426.39c0,45.66-.09,91.32,0,137,.07,24.51,19.76,43.56,43.38,42.47,8.95-.42,15.83-5.3,23.06-9.86q69.25-43.74,138.74-87.11,40.63-25.42,81.44-50.6c23.18-14.34,23.09-49-.25-63.14-3.27-2-6.69-3.72-9.93-5.74q-30.08-18.81-60.08-37.69Q522.2,302.46,444,253.2a34.65,34.65,0,0,0-26.33-4.87c-19.87,4.13-33.64,21.28-33.68,42.09Q383.9,358.42,384,426.39Z" />
                    </g>
                </g>
            </svg>
        </div>
        <div class="audio-type-flag textflag" v-show="!checkbox && showAudioTypeFlag(data)"
            :class="{ spacing: !(checkbox || showVipFlag(data) || Track.hasMv(data) || resourceMode) }">
            <span v-html="getAudioTypeFlagText(data)"></span>
        </div>
        <div class="title-wrap"
            :class="{ spacing: !(checkbox || Track.hasMv(data) || showVipFlag(data) || showAudioTypeFlag(data) || resourceMode) }">
            <span v-html="escapeHtml(data.filename || data.title)" :class="{ limitedSpan: !checkbox }"></span>
            <div class="action" :class="{ hidden: checkbox }">
                <svg @click="playItem" width="18" height="18" v-show="!resourceMode" class="play-btn" viewBox="0 0 139 139" xml:space="preserve"
                    xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                    <path
                        d="M117.037,61.441L36.333,14.846c-2.467-1.424-5.502-1.424-7.972,0c-2.463,1.423-3.982,4.056-3.982,6.903v93.188  c0,2.848,1.522,5.479,3.982,6.9c1.236,0.713,2.61,1.067,3.986,1.067c1.374,0,2.751-0.354,3.983-1.067l80.704-46.594  c2.466-1.422,3.984-4.054,3.984-6.9C121.023,65.497,119.502,62.866,117.037,61.441z" />
                </svg>
                <svg @click="addItem" width="15" height="15" v-show="!resourceMode" class="add-btn spacing2" viewBox="0 0 682.65 682.74"
                    xmlns="http://www.w3.org/2000/svg">
                    <g id="Layer_2" data-name="Layer 2">
                        <g id="Layer_1-2" data-name="Layer 1">
                            <path
                                d="M298.59,384.15h-7.06q-123.24,0-246.49,0c-21.63,0-38.69-12.57-43.64-31.94-7-27.56,13.21-53.29,42.33-53.51,25.33-.18,50.66,0,76,0H298.59v-6.44q0-123.49,0-247c0-20.39,10.77-36.44,28.49-42.71C355-7.34,383.55,13,384,43.16c.26,16.33,0,32.67,0,49V298.65h6.82q123.49,0,247,0c21.52,0,38.61,12.77,43.43,32.19,6.75,27.26-13.06,52.7-41.62,53.25-11.16.22-22.33,0-33.49,0H384.09v6.69q0,123.5,0,247c0,21.59-12.66,38.65-32.06,43.53-27.59,6.95-53.24-13.31-53.39-42.46-.17-32.66,0-65.33,0-98V384.15Z" />
                        </g>
                    </g>
                </svg>
                <svg @click="deleteItem" width="16" height="16" v-show="!resourceMode" class="delete-btn spacing2" viewBox="0 0 256 256"
                    data-name="Layer 1" xmlns="http://www.w3.org/2000/svg">
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
                <svg @click="getItemTrackUrl" width="17" height="17" v-show="resourceMode" class="audio-file-btn spacing2" viewBox="0 0 866 976.19" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M0,829.18v-683C1,139,1.86,131.77,3,124.6,13.74,55.6,78.28.25,148.07.16Q230,.05,312,0,412.71,0,513.41.18c36.23.07,68.4,11.46,95.45,35.78,12.62,11.35,24.54,23.5,36.56,35.5q88.25,88.11,176.33,176.37C842.33,268.49,856,293.14,862,321.78c1.75,8.38,2.72,16.92,4,25.38v483a32.55,32.55,0,0,0-.86,4.22c-2.76,37.47-16.65,70.16-43.19,96.83-30.14,30.27-67.13,44.9-109.75,44.92q-278.93.12-557.86,0c-6,0-12-.3-17.94-.86-66.73-6.2-122.22-57.76-133.46-124C1.7,844,1,836.54,0,829.18ZM515.49,87.33H510c-24.83-.06-49.66-.17-74.49-.16q-140.47,0-280.95.15C115.67,87.34,88,114.9,88,153.65V824.08C88,860.6,116.36,889,153,889q66.24.11,132.48.16,188.47,0,376.94-.16c17.17,0,34.33.11,51.49,0A64,64,0,0,0,778,824.66q.11-86.24.15-172.47,0-145.23-.15-290.46V356h-6.5c-34,0-68,.1-102-.07a187,187,0,0,1-23.89-1.65c-73.38-9.95-129.1-72.52-130-146.4-.47-36-.09-72-.09-107.95Zm87.35,69.27c0,1.23,0,2.82,0,4.42,0,14.15.14,28.31.15,42.47,0,37,27.21,64.49,64.16,64.81,14.65.13,29.31,0,44,0,1.16,0,2.32-.28,4.7-.58C677.61,230.15,640.27,193.43,602.84,156.6Z"/><path d="M532.32,596.07v-84L369,533v6.08q0,72,0,144c0,36-22.1,64.39-57.35,71.46-43.06,8.63-80-14.31-88.76-55.23-5.76-26.93,5.59-48.1,26.8-64.23C266.07,622.6,284.64,617,306,620v-5.81q0-85,0-170c0-20.68,11.72-33.91,32.2-37.06,37.56-5.77,75.07-11.84,112.62-17.7,31-4.83,62-9.71,93-14.14,8.43-1.2,17.39-2.4,25.58-.84C585.55,377.52,596,392,596,408.49q0,125.75,0,251.47c0,33.07-23.58,62.64-55.93,70.18-42.82,10-84.25-17.66-90.72-61.09-3.16-21.25,6-38.16,21.08-52.41,13.67-13,29.89-20.21,48.73-21.21C523.43,595.21,527.74,595.82,532.32,596.07Z"/></g></g></svg>
                <svg @click="getItemCover" width="17" height="17" v-show="resourceMode" class="cover-btn spacing2" viewBox="0 0 853.56 853.59" xmlns="http://www.w3.org/2000/svg">
                    <g id="Layer_2" data-name="Layer 2">
                        <g id="Layer_1-2" data-name="Layer 1">
                            <path d="M853.53,426.66q0,127,0,254c-.1,70.81-40.78,132.35-105.23,159.63a170.56,170.56,0,0,1-67.16,13.26q-254.46,0-508.93-.06C89,853.35,19.52,796.26,3.4,715.11A177.18,177.18,0,0,1,.17,680.86q-.3-254-.11-507.93C.1,100,42.58,37.94,110.39,11.29,130.31,3.47,151.1.05,172.44.05q254.22,0,508.44,0c83.47.07,153.14,57,169.26,138.38a191.21,191.21,0,0,1,3.25,36.24C853.66,258.68,853.53,342.67,853.53,426.66ZM768,428.5V280.77c0-36.16-.09-72.32,0-108.48,0-16.9-3.59-32.8-12.76-47-17.49-27.19-42.86-39.75-75-39.74q-253.46.08-506.92,0-3.5,0-7,.11a77.22,77.22,0,0,0-32.73,8c-32.29,16.31-48.11,43-48.14,78.89q-.15,191,0,381.94c0,1.59.15,3.17.27,5.56,1.89-1.67,3.25-2.8,4.53-4,33.73-32,67.35-64.1,101.23-95.94,40-37.6,97.31-40.84,141.42-8.22q36.17,26.73,72.21,53.62c12.45,9.26,21.74,8.62,32.71-2.35q65.91-65.93,131.83-131.87c39.6-39.57,101-39.59,140.75-.07q26.4,26.26,52.68,52.66C764.43,425.14,765.76,426.34,768,428.5ZM426.93,768q126.22,0,252.44-.07a104.31,104.31,0,0,0,21.35-1.79c40.61-8.62,67-41.61,67.26-83.93q.32-64.23-.1-128.47a12.12,12.12,0,0,0-3.4-7.62q-56.37-56.73-113-113.19c-7.9-7.9-14.78-7.87-22.74.08Q563,498.79,497.21,564.52c-39.27,39.16-97.72,43.18-142.08,10.06q-36.63-27.35-73.46-54.43c-10.88-8-21.84-7.3-31.63,2Q169.51,598.47,89,674.8A9.6,9.6,0,0,0,85.59,683c2.22,45,41.17,85.64,87.9,85.22C258,767.49,342.45,768,426.93,768Z"/>
                            <path d="M233.64,298.78c-35.64-.12-64.83-29.55-64.61-65.14s29.65-64.83,65.21-64.6a64.87,64.87,0,0,1-.6,129.74Z"/>
                        </g>
                    </g>
                </svg>
                <svg @click="getItemLyric" width="17" height="17" v-show="resourceMode" class="lyric-btn spacing2" viewBox="0 0 852.18 916" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M0,458.22q0-173.48,0-347C0,58,35.78,13.53,87.64,2.54A103.7,103.7,0,0,1,108.93.26Q376.16,0,643.39,0c56.72,0,101,36.86,111.07,92.55A98.56,98.56,0,0,1,756,109.44c.14,30.83.32,61.67,0,92.49-.19,16.81-7.78,29.95-23,37.53s-30.18,6.22-43.87-3.75c-11.53-8.4-16.9-20.36-17-34.54-.11-28,0-56-.07-84a66.46,66.46,0,0,0-.86-10.92C668.68,92.12,659.2,84.17,644.74,84c-8.5-.08-17,0-25.5,0H134.78c-7.33,0-14.66-.24-22-.12C95.59,84.14,84,95.86,84,113q0,344.73,0,689.45C84,821.33,94.62,832,113.41,832H645.87c17.93,0,26.13-8.34,26.14-26.51q0-172.48,0-345c0-20.88,11.37-37.2,29.64-42.7A42,42,0,0,1,756,456.37c.08,1.67,0,3.33,0,5q0,173.24,0,346.47c0,54.54-36.18,97.66-89.81,106.79a110,110,0,0,1-18.41,1.31q-268.23.1-536.46,0C48.83,916,.07,867.29,0,804.7Q-.06,631.45,0,458.22Z"/><path d="M660.18,354.22v6q-.07,142.49-.16,285c0,83.72-61.63,157.26-144,171.94-95.94,17.09-186.75-44.76-204.51-140.5-17.9-96.51,44.19-186,138.12-204.77,43.55-8.69,84.34-1.95,122.7,20.24,1,.56,2,1.08,3.7,2,0-2.4,0-4.14,0-5.89q.08-73,.2-146c.06-19,4.37-36.65,17.1-51.45C609.78,271.68,643.11,255,678,270c48.68,21,95.26,45.43,135.83,80a304.15,304.15,0,0,1,27.31,26.3,40.92,40.92,0,0,1,6.31,46.95c-8,15.48-23.82,24.2-41.71,22.63a38.89,38.89,0,0,1-25.58-12.27c-26.91-28.76-59.36-49.7-94.2-67.31-6.68-3.38-13.45-6.57-20.2-9.8C664.19,355.79,662.51,355.19,660.18,354.22ZM576,644.54c0-50.84-41.42-92.38-92.12-92.38C434,552.17,392.23,594,392.18,644c0,50.39,41.55,92,92,92S576,694.65,576,644.54Z"/><path d="M345.51,276c-58.32,0-116.64.13-175-.09-17.46-.06-30.94-8.07-38.48-24-7.33-15.47-5.34-30.62,5.17-44.15,8.52-11,20.27-15.79,34.08-15.79H428.25c31.32,0,62.65-.31,94,.12,17,.23,30.26,8.21,37.66,23.7S565.41,246.43,555,260c-8.59,11.17-20.52,16-34.5,16Z"/><path d="M297.88,404q-63.49,0-127,0c-24.32-.05-42.94-18.42-42.86-42A41.78,41.78,0,0,1,170,320c27.83-.13,55.66,0,83.49,0q85.76,0,171.49,0c25.24,0,44,19.15,43.16,43.75-.74,22.2-19.51,40.16-42.27,40.21Q361.88,404.09,297.88,404Z"/><path d="M217.69,532c-16,0-32,.14-48,0a41.95,41.95,0,0,1-28.25-72.78,40.9,40.9,0,0,1,28.16-11.11c32.31-.19,64.62-.25,96.93,0A41.72,41.72,0,0,1,308,489.94c0,23.25-18.3,41.72-41.87,42C250,532.16,233.84,532,217.69,532Z"/></g></g></svg>
                <!--
                <svg width="17" height="17" class="spacing" viewBox="0 0 1016.14 1016.1" xmlns="http://www.w3.org/2000/svg" ><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M855.35,134.55q23.42-24,46.82-47.91c6.59-6.74,14.31-8.93,23.23-5.48,8.24,3.18,12.69,10.31,12.7,20.15q.06,57,0,114,0,33.49,0,67c0,14-8.28,22.46-22.36,22.47q-90.5.09-181,0c-10.7,0-17.88-4.41-21.12-12.85-3.55-9.25-.61-16.75,6.14-23.5,20.64-20.6,41.13-41.35,61.93-62.31a20,20,0,0,0-2-2.21c-57.49-50.33-123.7-83-199-95.71C467.07,89,362.61,112.61,269.37,180.43c-83.05,60.41-137,141.45-157.78,242.16-26.92,130.72,2.28,248.84,89,350.94,56.55,66.57,128.32,109.92,213.54,130C605,948.46,798.31,854.19,880.52,676.35A390.93,390.93,0,0,0,914.21,556.2c3.36-29.3,24.65-48.78,52.66-48,28.86.77,52.2,27.58,49,56.25-23.63,209.77-175.59,383.91-380.38,435.94a507.7,507.7,0,0,1-178.46,13C250.67,992.07,76.68,846.67,19.72,647.81A498.26,498.26,0,0,1,2.91,455.41C17.55,320.13,77.17,208.27,180.28,120,246.77,63,324.09,27.56,409.73,10.1A490.72,490.72,0,0,1,556.41,2.33q157.29,15.45,279.36,116c6.05,5,11.88,10.21,17.82,15.31.11.09.31.08.46.11Z"/><path d="M407.78,508q0-91.2,0-182.41c0-3.14,0-6.45.94-9.38,3.77-11.85,19-15.17,28-6.11,5.28,5.31,10.19,11,15.25,16.53Q528.83,410.82,605.63,495c7.79,8.54,8,16.88.35,25.32q-83.93,92.22-168,184.33c-8.22,9-20.92,9-27-.47-2.24-3.5-3.13-8.43-3.14-12.71-.2-56.64-.14-113.28-.14-169.92Z"/></g></g></svg>
                <svg width="17" height="17" class="spacing" viewBox="0 0 1024 937.46" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M1024,299.77c-.89,7.24-1.74,14.5-2.67,21.74-5.4,41.95-19.53,81-39,118.35-24.74,47.39-56.62,89.8-91.22,130.27-48.69,57-101.85,109.6-156.46,160.77C661.69,799.26,588.19,867,514.93,935.05c-.85.78-1.75,1.49-2.85,2.41-1.09-.89-2.14-1.65-3.09-2.52q-101.8-92.36-203.56-184.77c-58.71-53.61-116.12-108.59-168.2-168.81-39.12-45.23-74.7-92.93-100.8-147.1-18.8-39-31.17-79.91-35.23-123.16-.32-3.45-.8-6.89-1.2-10.33v-36c1-7.74,1.79-15.5,2.86-23.23,8.06-57.93,30.88-109.28,71.21-151.7,67.09-70.55,150.24-98.35,246.11-86,75.62,9.71,138.64,44.83,189.43,101.75.74.82,1.61,1.52,2.53,2.39.91-1,1.61-1.66,2.26-2.4a297.6,297.6,0,0,1,98.07-74.34C690-5.4,769.66-11.19,849.33,21.27,948,61.45,1004.25,136.62,1021.1,241.55c1.24,7.69,1.95,15.47,2.9,23.21ZM922.22,282.9c-1.08-10.76-1.48-21.64-3.33-32.27-10-57.28-39.78-101.12-91.95-127.45-54.58-27.54-110.52-27-165.67-1.07-44.78,21.07-78.08,53.89-96.65,100.47-1.2,3-2.93,3.41-5.65,3.4-29.5-.06-59-.1-88.49.05-3.58,0-5.17-1.2-6.63-4.39C430.29,148.12,342.54,89.86,249.42,105.81c-41,7-76.09,25.21-103.36,56.83-38.87,45.08-49.77,97.9-40.53,155.58,5.72,35.66,20,68.21,38.16,99.15C171,463.93,205.43,505,242,544.39c57.44,61.87,119.67,118.78,182.1,175.48,28,25.43,56.23,50.62,84.27,76,5.68,5.15,6.89,5.4,12.43.28C568,752.47,615.47,709.05,662.35,665c54.55-51.26,108-103.64,156.07-161.17C846.69,470,872.66,434.6,892.47,395,910.12,359.76,921.42,322.79,922.22,282.9Z"/></g></g></svg>
                <svg width="17" height="17" class="spacing" viewBox="0 0 767.96 895.83" xmlns="http://www.w3.org/2000/svg" ><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M458.7,677.8,274.75,559.58c-35.29,34.33-77.25,51.15-126.42,47.61C104,604,67.35,584.86,38.16,551.38c-53.89-61.79-50.31-156.85,8.26-216.25,60.08-60.95,162.47-65.53,228.41.79L458.59,217.83c-17.32-49.24-14-96.72,13.09-141.57,19.67-32.52,47.82-55.37,83.9-67.49,75.65-25.39,155.7,5.8,193.1,74.7C785.34,151,768.21,236,708.87,284.05c-60.76,49.2-153.42,49.49-215.57-12.43l-184,118.25a161.11,161.11,0,0,1,0,115.78l184,118.23c64.15-64.7,163-61.37,223-6C774.44,671.56,785,760.17,740.5,825.46c-44.86,65.91-131.3,89-202.23,54.35C466.68,844.85,428.1,760.37,458.7,677.8ZM512,159.4a96,96,0,1,0,96.37-95.62A96.09,96.09,0,0,0,512,159.4Zm0,576a96,96,0,1,0,96.36-95.62A96.08,96.08,0,0,0,512,735.4ZM160.36,351.78A96,96,0,1,0,256,448.11,96,96,0,0,0,160.36,351.78Z"/></g></g></svg>
                -->
            </div>
        </div>
        <div class="artist spacing1" v-show="!isExtra1Available()">
            <ArtistControl :visitable="artistVisitable && !checkbox" 
                :platform="data.platform" 
                :data="data.artist"
                :trackId="toTrimString(data.id)">
            </ArtistControl>
        </div>
        <div class="album spacing1" v-show="!isExtra2Available()">
            <AlbumControl :visitable="albumVisitable && !checkbox" 
                :platform="data.platform" 
                :data="data.album">
            </AlbumControl>
        </div>
        <div class="extra1 spacing1" v-show="isExtra1Available()" v-html="data.extra1"></div>
        <div class="extra2 spacing1" v-show="isExtra2Available()" v-html="data.extra2"></div>
        <div class="duration spacing1">{{ Track.mmssDuration(data) }}</div>
    </div>
</template>

<style scoped>
.song-item {
    width: 100%;
    display: flex;
    flex-direction: row;
    flex: 1;
    margin-bottom: 3px;
    border-radius: var(--border-inputs-border-radius);
    border-radius: var(--border-list-item-vertical-border-radius);
    border-radius: calc(var(--border-list-item-vertical-border-radius) - 2px);
}

.song-item.selection-mode {
    cursor: pointer;
}

.song-item:hover {
    /*border-radius: 3px;*/
    background: var(--content-list-item-hover-bg-color);
}

.song-item .hidden {
    display: none !important;
}

.song-item>div {
    line-height: 50px;
    line-height: 59px;
    vertical-align: middle;
    /*font-size: var(--content-text-size);*/
}

.song-item .spacing {
    margin-left: 12px;
}

.song-item .spacing1 {
    /*margin-left: 8px;*/
    margin-left: 20px;
}

.song-item .spacing2 {
    margin-left: 15px;
}

.song-item .title-wrap,
.song-item .artist,
.song-item .album {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    text-align: left;
    word-wrap: break-word;
    line-break: anywhere;
}

/*
.song-item .artist span,
.song-item .album span {
    cursor: pointer;
}

.song-item .artist span:hover,
.song-item .album span:hover {
    background: var(--content-text-highlight-color);
    -webkit-background-clip: text;
    color: transparent;
}
*/

.song-item .sqno,
.song-item .checkbox {
    width: 35px;
    padding-left: 8px;
    text-align: left;
}

.song-item .sqno {
    color: var(--content-subtitle-text-color);
}

.song-item .checkbox {
    width: 30px;
}

.song-item .checkbox svg {
    margin-bottom: -3px;
}

.song-item .title-wrap {
    flex: 1;
    position: relative;
    text-align: left;
    margin-top: 1px;
}

.song-item.resouces-mode .title-wrap {
    min-width: 33% !important;
}


.song-item .title-wrap span {
    z-index: 1;
    word-wrap: break-word;
    line-break: anywhere;
}

/* .song-item .mv span, */
.song-item .textflag span {
    background: var(--content-text-highlight-color);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent !important;

    border-radius: 3px;
    border: 1.3px solid var(--content-highlight-color);
    padding: 1px 3px;
    font-size: 12px;
    font-weight: bold;
    margin-right: 5px;
}

/*
.song-item .mv span {
    cursor: pointer;
}
*/

.song-item .mv {
    display: flex;
    flex-direction: column;
    margin-right: 5px;
    margin-top: 1px;
    align-items: center;
    justify-content: center;
}

.song-item .mv svg {
    fill: var(--button-icon-btn-color);
    cursor: pointer;
}

.song-item .artist,
.song-item .extra1 {
    width: 25%;
}

.song-item .album,
.song-item .extra2 {
    width: 25%;
}

.song-item .extra1,
.song-item .extra2 {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    text-align: left;
    word-wrap: break-word;
    line-break: anywhere;
}

.song-item .duration {
    width: 53px;
    padding-right: 8px;
    text-align: right;
}

.song-item .action {
    z-index: 2;
    height: 100%;

    position: absolute;
    top: 0px;
    left: 158px;
    left: 51%;

    display: flex;
    flex-direction: row;
    align-items: center;

    padding-left: 10px;
    padding-right: 10px;

    visibility: hidden;
}

.song-item .action .delete-btn {
    visibility: hidden;
}

.song-item .action svg {
    fill: var(--button-icon-btn-color);
    cursor: pointer;
}

.song-item .mv svg:hover,
.song-item .action svg:hover {
    fill: var(--content-highlight-color);
}

.song-item .title-wrap:hover .action {
    visibility: visible;
}

.song-item .title-wrap:hover .limitedSpan {
    width: 158px;
    width: 50%;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    word-wrap: break-word;
    line-break: anywhere;
}
</style>