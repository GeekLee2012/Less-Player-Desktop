<script setup>
import { ref, watch, inject } from 'vue';
import { storeToRefs } from 'pinia';
import { Track } from '../../common/Track';
import ArtistControl from './ArtistControl.vue';
import AlbumControl from './AlbumControl.vue';
import { usePlayStore } from '../store/playStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';
import EventBus from '../../common/EventBus';



const { playMv } = inject('player')

const { playing } = storeToRefs(usePlayStore())
const { addTrack, playTrack, togglePlay } = usePlayStore()
const { showToast, hidePlaybackQueueView, toggleVideoPlayingView } = useAppCommonStore()
const { track } = storeToRefs(useSettingStore())

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
    checkChangedFn: Function
})

const isChecked = ref(props.checked)
const toggleCheck = () => {
    const { checkbox, checkChangedFn, checked } = props
    if (!checkbox) return
    setChecked(!isChecked.value)
    if (checkChangedFn) checkChangedFn(isChecked.value, { index: props.index, ...props.data })
}

const setChecked = (value) => {
    isChecked.value = value
}

const playItem = () => {
    playTrack(props.data)
}

const addItem = () => {
    addTrack(props.data)
    showToast("歌曲已添加成功！")
}

const deleteItem = () => {
    if (props.deleteFn) {
        props.deleteFn(props.index)
        showToast("歌曲已删除！")
    }
}

const showContextMenu = (event) => {
    event.preventDefault()
    if (props.checkbox) return
    hidePlaybackQueueView()
    const { data, dataType } = props
    setTimeout(() => {
        EventBus.emit("commonCtxMenu-init", dataType || 0)
        EventBus.emit("commonCtxMenu-show", { event, value: data })
    }, 99)
}

//TODO
const toString = (value) => {
    return value ? value.toString() : value
}

watch(() => props.checked, (nv, ov) => {
    if (props.ignoreCheckAllEvent) return
    setChecked(nv)
})

const isExtra1Available = () => {
    const { extra1 } = props.data
    if (typeof (extra1) === 'string') {
        return extra1 ? extra1.trim().length > 0 : false
    }
    return false
}

const isExtra2Available = () => {
    const { extra2 } = props.data
    if (typeof (extra2) === 'string') {
        return extra2 ? extra2.trim().length > 0 : false
    }
    return false
}

const showVipFlag = (data) => {
    return track.value.vipFlagShow && Track.isVip(data)
}

EventBus.on("checkbox-refresh", () => setChecked(false))
</script>

<template>
    <div class="song-item" @click="toggleCheck" @contextmenu="showContextMenu">
        <div v-show="checkbox" class="sqno">
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
        <div v-show="!checkbox" class="sqno">{{ index + 1 }}</div>
        <div class="vipflag" v-show="showVipFlag(data)" :class="{ spacing: !checkbox }">
            <span>VIP</span>
        </div>
        <div class="mv" v-show="!checkbox && Track.hasMv(data)" :class="{ spacing: !(checkbox || showVipFlag(data)) }">
            <svg @click="playMv(data)" width="18" height="15" viewBox="0 0 1024 853.52" xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <path
                            d="M1024,158.76v536c-.3,1.61-.58,3.21-.92,4.81-2.52,12-3.91,24.43-7.76,36-23.93,72-88.54,117.91-165.13,117.92q-338.19,0-676.4-.1a205.81,205.81,0,0,1-32.3-2.69C76,840.18,19.81,787.63,5,723.14c-2.15-9.35-3.36-18.91-5-28.38v-537c.3-1.26.66-2.51.89-3.79,1.6-8.83,2.52-17.84,4.85-26.48C26.32,51.12,93.47.05,173.29,0Q512,0,850.72.13a200.6,200.6,0,0,1,31.8,2.68C948.44,13.47,1004,65.66,1019.09,130.88,1021.21,140.06,1022.39,149.46,1024,158.76ZM384,426.39c0,45.66-.09,91.32,0,137,.07,24.51,19.76,43.56,43.38,42.47,8.95-.42,15.83-5.3,23.06-9.86q69.25-43.74,138.74-87.11,40.63-25.42,81.44-50.6c23.18-14.34,23.09-49-.25-63.14-3.27-2-6.69-3.72-9.93-5.74q-30.08-18.81-60.08-37.69Q522.2,302.46,444,253.2a34.65,34.65,0,0,0-26.33-4.87c-19.87,4.13-33.64,21.28-33.68,42.09Q383.9,358.42,384,426.39Z" />
                    </g>
                </g>
            </svg>
            <!--
                <span @click="playMv">MV</span>
                -->
        </div>
        <div class="title-wrap" :class="{ spacing: !(checkbox || Track.hasMv(data) || showVipFlag(data)) }">
            <span v-html="data.title" :class="{ limitedSpan: !checkbox }"></span>
            <div class="action" :class="{ hidden: checkbox }">
                <svg @click="playItem" width="18" height="18" class="play-btn" viewBox="0 0 139 139" xml:space="preserve"
                    xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                    <path
                        d="M117.037,61.441L36.333,14.846c-2.467-1.424-5.502-1.424-7.972,0c-2.463,1.423-3.982,4.056-3.982,6.903v93.188  c0,2.848,1.522,5.479,3.982,6.9c1.236,0.713,2.61,1.067,3.986,1.067c1.374,0,2.751-0.354,3.983-1.067l80.704-46.594  c2.466-1.422,3.984-4.054,3.984-6.9C121.023,65.497,119.502,62.866,117.037,61.441z" />
                </svg>
                <svg @click="addItem" width="15" height="15" class="add-btn spacing" viewBox="0 0 682.65 682.74"
                    xmlns="http://www.w3.org/2000/svg">
                    <g id="Layer_2" data-name="Layer 2">
                        <g id="Layer_1-2" data-name="Layer 1">
                            <path
                                d="M298.59,384.15h-7.06q-123.24,0-246.49,0c-21.63,0-38.69-12.57-43.64-31.94-7-27.56,13.21-53.29,42.33-53.51,25.33-.18,50.66,0,76,0H298.59v-6.44q0-123.49,0-247c0-20.39,10.77-36.44,28.49-42.71C355-7.34,383.55,13,384,43.16c.26,16.33,0,32.67,0,49V298.65h6.82q123.49,0,247,0c21.52,0,38.61,12.77,43.43,32.19,6.75,27.26-13.06,52.7-41.62,53.25-11.16.22-22.33,0-33.49,0H384.09v6.69q0,123.5,0,247c0,21.59-12.66,38.65-32.06,43.53-27.59,6.95-53.24-13.31-53.39-42.46-.17-32.66,0-65.33,0-98V384.15Z" />
                        </g>
                    </g>
                </svg>
                <svg @click="deleteItem" width="16" height="16" class="delete-btn spacing" viewBox="0 0 256 256"
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
                <!--
                    <svg width="17" height="17" class="spacing" viewBox="0 0 1016.14 1016.1" xmlns="http://www.w3.org/2000/svg" ><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M855.35,134.55q23.42-24,46.82-47.91c6.59-6.74,14.31-8.93,23.23-5.48,8.24,3.18,12.69,10.31,12.7,20.15q.06,57,0,114,0,33.49,0,67c0,14-8.28,22.46-22.36,22.47q-90.5.09-181,0c-10.7,0-17.88-4.41-21.12-12.85-3.55-9.25-.61-16.75,6.14-23.5,20.64-20.6,41.13-41.35,61.93-62.31a20,20,0,0,0-2-2.21c-57.49-50.33-123.7-83-199-95.71C467.07,89,362.61,112.61,269.37,180.43c-83.05,60.41-137,141.45-157.78,242.16-26.92,130.72,2.28,248.84,89,350.94,56.55,66.57,128.32,109.92,213.54,130C605,948.46,798.31,854.19,880.52,676.35A390.93,390.93,0,0,0,914.21,556.2c3.36-29.3,24.65-48.78,52.66-48,28.86.77,52.2,27.58,49,56.25-23.63,209.77-175.59,383.91-380.38,435.94a507.7,507.7,0,0,1-178.46,13C250.67,992.07,76.68,846.67,19.72,647.81A498.26,498.26,0,0,1,2.91,455.41C17.55,320.13,77.17,208.27,180.28,120,246.77,63,324.09,27.56,409.73,10.1A490.72,490.72,0,0,1,556.41,2.33q157.29,15.45,279.36,116c6.05,5,11.88,10.21,17.82,15.31.11.09.31.08.46.11Z"/><path d="M407.78,508q0-91.2,0-182.41c0-3.14,0-6.45.94-9.38,3.77-11.85,19-15.17,28-6.11,5.28,5.31,10.19,11,15.25,16.53Q528.83,410.82,605.63,495c7.79,8.54,8,16.88.35,25.32q-83.93,92.22-168,184.33c-8.22,9-20.92,9-27-.47-2.24-3.5-3.13-8.43-3.14-12.71-.2-56.64-.14-113.28-.14-169.92Z"/></g></g></svg>
                    <svg width="17" height="17" class="spacing" viewBox="0 0 1024 937.46" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M1024,299.77c-.89,7.24-1.74,14.5-2.67,21.74-5.4,41.95-19.53,81-39,118.35-24.74,47.39-56.62,89.8-91.22,130.27-48.69,57-101.85,109.6-156.46,160.77C661.69,799.26,588.19,867,514.93,935.05c-.85.78-1.75,1.49-2.85,2.41-1.09-.89-2.14-1.65-3.09-2.52q-101.8-92.36-203.56-184.77c-58.71-53.61-116.12-108.59-168.2-168.81-39.12-45.23-74.7-92.93-100.8-147.1-18.8-39-31.17-79.91-35.23-123.16-.32-3.45-.8-6.89-1.2-10.33v-36c1-7.74,1.79-15.5,2.86-23.23,8.06-57.93,30.88-109.28,71.21-151.7,67.09-70.55,150.24-98.35,246.11-86,75.62,9.71,138.64,44.83,189.43,101.75.74.82,1.61,1.52,2.53,2.39.91-1,1.61-1.66,2.26-2.4a297.6,297.6,0,0,1,98.07-74.34C690-5.4,769.66-11.19,849.33,21.27,948,61.45,1004.25,136.62,1021.1,241.55c1.24,7.69,1.95,15.47,2.9,23.21ZM922.22,282.9c-1.08-10.76-1.48-21.64-3.33-32.27-10-57.28-39.78-101.12-91.95-127.45-54.58-27.54-110.52-27-165.67-1.07-44.78,21.07-78.08,53.89-96.65,100.47-1.2,3-2.93,3.41-5.65,3.4-29.5-.06-59-.1-88.49.05-3.58,0-5.17-1.2-6.63-4.39C430.29,148.12,342.54,89.86,249.42,105.81c-41,7-76.09,25.21-103.36,56.83-38.87,45.08-49.77,97.9-40.53,155.58,5.72,35.66,20,68.21,38.16,99.15C171,463.93,205.43,505,242,544.39c57.44,61.87,119.67,118.78,182.1,175.48,28,25.43,56.23,50.62,84.27,76,5.68,5.15,6.89,5.4,12.43.28C568,752.47,615.47,709.05,662.35,665c54.55-51.26,108-103.64,156.07-161.17C846.69,470,872.66,434.6,892.47,395,910.12,359.76,921.42,322.79,922.22,282.9Z"/></g></g></svg>
                    <svg width="17" height="17" class="spacing" viewBox="0 0 767.96 895.83" xmlns="http://www.w3.org/2000/svg" ><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M458.7,677.8,274.75,559.58c-35.29,34.33-77.25,51.15-126.42,47.61C104,604,67.35,584.86,38.16,551.38c-53.89-61.79-50.31-156.85,8.26-216.25,60.08-60.95,162.47-65.53,228.41.79L458.59,217.83c-17.32-49.24-14-96.72,13.09-141.57,19.67-32.52,47.82-55.37,83.9-67.49,75.65-25.39,155.7,5.8,193.1,74.7C785.34,151,768.21,236,708.87,284.05c-60.76,49.2-153.42,49.49-215.57-12.43l-184,118.25a161.11,161.11,0,0,1,0,115.78l184,118.23c64.15-64.7,163-61.37,223-6C774.44,671.56,785,760.17,740.5,825.46c-44.86,65.91-131.3,89-202.23,54.35C466.68,844.85,428.1,760.37,458.7,677.8ZM512,159.4a96,96,0,1,0,96.37-95.62A96.09,96.09,0,0,0,512,159.4Zm0,576a96,96,0,1,0,96.36-95.62A96.08,96.08,0,0,0,512,735.4ZM160.36,351.78A96,96,0,1,0,256,448.11,96,96,0,0,0,160.36,351.78Z"/></g></g></svg>
                    -->
            </div>
        </div>
        <div class="artist spacing1" v-show="!isExtra1Available()">
            <ArtistControl :visitable="artistVisitable && !checkbox" :platform="data.platform" :data="data.artist"
                :trackId="toString(data.id)">
            </ArtistControl>
        </div>
        <div class="album spacing1" v-show="!isExtra2Available()">
            <AlbumControl :visitable="albumVisitable && !checkbox" :platform="data.platform" :data="data.album">
            </AlbumControl>
        </div>
        <div class="extra1 spacing1" v-show="isExtra1Available()">{{ data.extra1 }}</div>
        <div class="extra2 spacing1" v-show="isExtra2Available()">{{ data.extra2 }}</div>
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
}

.song-item:hover {
    background: var(--list-item-hover);
}

.song-item .hidden {
    display: none !important;
}

.song-item>div {
    line-height: 50px;
    line-height: 59px;
    vertical-align: middle;
    font-size: var(--text-size);
}

.song-item .spacing {
    margin-left: 12px;
}

.song-item .spacing1 {
    margin-left: 8px;
}

.song-item .title-wrap,
.song-item .artist,
.song-item .album {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    text-align: left;
}

/*
.song-item .artist span,
.song-item .album span {
    cursor: pointer;
}

.song-item .artist span:hover,
.song-item .album span:hover {
    background: var(--hl-text-bg);
    -webkit-background-clip: text;
    color: transparent;
}
*/

.song-item .sqno {
    width: 35px;
    padding-left: 8px;
    text-align: left;
}

.song-item .sqno svg {
    margin-bottom: -3px;
    fill: var(--svg-color);
}

.song-item .sqno .checked-svg {
    fill: var(--hl-color) !important;
}

.song-item .title-wrap {
    flex: 1;
    position: relative;
    text-align: left;
    margin-top: 1px;
}

.song-item .title-wrap span {
    z-index: 1;
}

/* .song-item .mv span, */
.song-item .vipflag span {
    color: var(--hl-color);
    border-radius: 3px;
    border: 1.3px solid var(--hl-color);
    padding: 1px 3px;
    font-size: 10px;
    font-weight: 600;
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
    fill: var(--svg-color);
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
    -webkit-box-orient: vertical;
    text-align: left;
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

    /* background: var(--list-item-hover); */
    visibility: hidden;
}

.song-item .action .delete-btn {
    visibility: hidden;
}

.song-item .action svg {
    fill: var(--svg-color);
    cursor: pointer;
}

.song-item .mv svg:hover,
.song-item .action svg:hover {
    fill: var(--svg-hover-color);
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
    -webkit-box-orient: vertical;
}
</style>