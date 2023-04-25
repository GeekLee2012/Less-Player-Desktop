<script setup>
import { inject } from 'vue';
import { useAppCommonStore } from '../store/appCommonStore';
import EventBus from '../../common/EventBus';
import { toYyyymmddHhMmSs } from "../../common/Times";
import { useUserProfileStore } from '../store/userProfileStore';
import { usePlayStore } from '../store/playStore';



const { visitCustomPlaylist, visitCustomPlaylistEdit,
    visitBatchCustomPlaylist } = inject('appRoute')

const props = defineProps({
    index: Number,
    data: Object
})

const { hideAllCtxMenus, showToast } = useAppCommonStore()
const { getCustomPlaylist, removeCustomPlaylist } = useUserProfileStore()
const { resetQueue, playNextTrack, addTracks } = usePlayStore()

const toastAndHideMenu = (text) => {
    showToast(text)
    hideAllCtxMenus()
}

const visitItem = () => {
    const { id } = props.data
    visitCustomPlaylist(id)
}

const playItem = () => {
    const { id } = props.data
    const playlist = getCustomPlaylist(id)
    if (!playlist || playlist.data.length < 1) return
    resetQueue()
    addTracks(playlist.data)
    showToast("即将为您播放歌单！")
    playNextTrack()
}

const editItem = () => visitCustomPlaylistEdit(props.data.id)

const visitBatch = () => visitBatchCustomPlaylist(props.data.id)

const removeItem = () => {
    const { id } = props.data
    removeCustomPlaylist(id)
    toastAndHideMenu("歌单已删除！")
}

const showContextMenu = (event) => {
    event.preventDefault()
    EventBus.emit("commonCtxMenu-init", 3)
    EventBus.emit("commonCtxMenu-show", { event, value: props.data })
}
</script>

<template>
    <div class="custom-playlist-item" @contextmenu="showContextMenu">
        <div class="sqno">{{ index + 1 }}</div>
        <div class="cover" @click="visitItem">
            <img v-lazy="data.cover" />
        </div>
        <div class="title-wrap spacing1">
            <div class="content" @click="visitItem">
                <div class="title"><span v-html="data.title"></span></div>
                <div class="size">{{ data.data.length }} 首歌曲</div>
            </div>
            <div class="action">
                <svg @click.stop="playItem" width="17" height="17" viewBox="0 0 139 139" xml:space="preserve"
                    xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                    <path
                        d="M117.037,61.441L36.333,14.846c-2.467-1.424-5.502-1.424-7.972,0c-2.463,1.423-3.982,4.056-3.982,6.903v93.188  c0,2.848,1.522,5.479,3.982,6.9c1.236,0.713,2.61,1.067,3.986,1.067c1.374,0,2.751-0.354,3.983-1.067l80.704-46.594  c2.466-1.422,3.984-4.054,3.984-6.9C121.023,65.497,119.502,62.866,117.037,61.441z" />
                </svg>
                <svg @click.stop="editItem" width="16" height="16" class="spacing1" viewBox="0 0 992.3 992.23"
                    xmlns="http://www.w3.org/2000/svg">
                    <g id="Layer_2" data-name="Layer 2">
                        <g id="Layer_1-2" data-name="Layer 1">
                            <path
                                d="M428.27,992.13c-88.16,0-176.32.28-264.48-.1-56.56-.24-101.65-23.86-134.6-69.78A150.76,150.76,0,0,1,.34,833.37C0,743.21.19,653.05.18,562.89c0-88-.5-176,.17-264C.82,236.36,29,188.83,82.63,156.81c25.32-15.11,53.25-21.18,82.69-21.15q161,.15,322,.06c26.66,0,45.78,15.33,50.38,40,5,26.58-15,53-41.88,55.53-3.31.31-6.66.42-10,.42q-159.75,0-319.49-.06c-25.45,0-45.64,9.41-59.78,30.75-7.47,11.29-10.42,23.92-10.41,37.45q.09,229.23,0,458.47,0,35.25,0,70.5c.06,38.34,29,67.32,67.42,67.33q264.74,0,529.47,0c38.53,0,67.21-28.52,67.44-67.25.21-32.66.05-65.33.05-98q0-112.74,0-225.49c0-19.14,7-34.41,23.5-44.58,30.3-18.63,70.25,2.33,72.32,37.83.13,2.17.21,4.33.21,6.5q0,161.24,0,322.48c0,47.47-16.82,87.91-51.29,120.5-30,28.4-66.18,43.56-107.53,43.81-89.83.52-179.66.16-269.49.16Z" />
                            <path
                                d="M417,473.1c1.08-20.29,2.1-40.59,3.27-60.88a46.93,46.93,0,0,1,11.63-28.62c1.74-2,3.64-3.89,5.53-5.78L798.28,16.91c22.51-22.5,50.7-22.57,73.22-.07q52.15,52.11,104.27,104.27c22,22,22.06,50.57.07,72.54Q794.42,374.91,613,556.14c-10.34,10.34-22.49,15.36-37,16.06q-50.93,2.47-101.8,5.69c-14.62.91-28.69.35-40.88-9.11-12.48-9.69-19.48-22.41-19.12-38.27.43-19.15,1.73-38.28,2.65-57.41Zm95.78,6.38c13.28-.76,25.7-1.6,38.15-2.09a12.52,12.52,0,0,0,9.12-4q156.09-156.07,312.3-312c1.26-1.26,2.43-2.58,3.23-3.43l-41.31-41.26-72.48,72.49Q640.15,310.8,518.56,432.44c-1.44,1.45-3.22,3.37-3.35,5.18C514.19,451.23,513.55,464.86,512.74,479.48Z" />
                        </g>
                    </g>
                </svg>
                <svg @click.stop="visitBatch" width="16" height="16" class="spacing1" viewBox="0 0 160 125"
                    xmlns="http://www.w3.org/2000/svg">
                    <g id="Layer_2" data-name="Layer 2">
                        <g id="Layer_1-2" data-name="Layer 1">
                            <path
                                d="M55,20h95a10,10,0,0,0,0-20H55a10,10,0,0,0,0,20ZM20,0H10a10,10,0,0,0,0,20H20A10,10,0,0,0,20,0ZM55,70h75a10,10,0,0,0,0-20H55a10,10,0,0,0,0,20ZM20,50H10a10,10,0,0,0,0,20H20a10,10,0,0,0,0-20Zm130,55H55a10,10,0,0,0,0,20h95a10,10,0,0,0,0-20ZM20,105H10a10,10,0,0,0,0,20H20a10,10,0,0,0,0-20Z" />
                        </g>
                    </g>
                </svg>
                <svg @click.stop="removeItem" width="16" height="16" class="spacing1" viewBox="0 0 256 256"
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
            </div>
        </div>
        <div class="time spacing1">
            <span>{{ toYyyymmddHhMmSs(data.updated) }}</span>
        </div>
        <div class="time spacing1">
            <span>{{ toYyyymmddHhMmSs(data.created) }}</span>
        </div>
    </div>
</template>

<style scoped>
.custom-playlist-item {
    width: 100%;
    height: 73px;
    display: flex;
    flex-direction: row;
    flex: 1;
    margin-bottom: 3px;
}

.custom-playlist-item:hover {
    background-color: var(--list-item-hover);
}

.custom-playlist-item>div {
    vertical-align: middle;
    font-size: 16px;
}

.custom-playlist-item .spacing1 {
    margin-left: 12px;
}

.custom-playlist-item .sqno {
    width: 35px;
    padding-left: 5px;
    text-align: left;
    /*
    display: flex;
    flex-direction: column;
    justify-content: center;
    */
    margin: auto 0px;
}

.custom-playlist-item .cover {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-left: 3px;
    cursor: pointer;
}

.custom-playlist-item .cover img {
    width: 52px;
    height: 52px;
    -webkit-user-drag: none;
}

.custom-playlist-item .title-wrap {
    flex: 1;
    position: relative;
    text-align: left;
}

.custom-playlist-item .content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    cursor: pointer;
    margin-right: 8px;
}

.custom-playlist-item .content>div {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.custom-playlist-item .title-wrap span {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    margin-bottom: 6px;
    /*cursor: pointer;*/
}

.custom-playlist-item .title-wrap .size {
    /*font-size: var(--text-sub-size);
    font-size: 13px;*/
    font-size: var(--tip-text-size);
    font-weight: 520;
    color: var(--text-sub-color);
}

.custom-playlist-item .action {
    z-index: 2;
    height: 100%;

    position: absolute;
    top: 0px;
    left: 158px;
    left: 50%;

    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;

    padding-left: 10px;
    padding-right: 10px;

    /*background: var(--list-item-hover);*/
    visibility: hidden;
}

.custom-playlist-item .action svg {
    fill: var(--svg-color);
    cursor: pointer;
}

.custom-playlist-item .action svg:hover {
    fill: var(--hl-color);
    fill: var(--svg-hover-color);
}

.custom-playlist-item .title-wrap:hover .action {
    visibility: visible;
}

.custom-playlist-item .title-wrap:hover span {
    width: 158px;
    width: 50%;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
}

.custom-playlist-item .time {
    width: 22%;
    display: flex;
    flex-direction: column;
    justify-content: center;
}
</style>