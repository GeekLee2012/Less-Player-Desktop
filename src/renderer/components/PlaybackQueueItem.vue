<script setup>
import { Track } from '../../common/Track';
import ArtistControl from './ArtistControl.vue';
import { usePlayStore } from '../store/playStore';
import { inject, onMounted, ref } from 'vue';
import EventBus from '../../common/EventBus';
import { useAppCommonStore } from '../store/appCommonStore';
import { storeToRefs } from 'pinia';



const { visitPlaylist } = inject('appRoute')

const { queueTracksSize } = storeToRefs(usePlayStore())
const { playTrack, removeTrack, isCurrentTrack, togglePlay } = usePlayStore()
const { showToast } = useAppCommonStore()

const props = defineProps({
    data: Object, //Track
    active: Boolean
})

const playItem = () => {
    const track = props.data
    if (isCurrentTrack(track)) {
        togglePlay()
        return
    }
    playTrack(track)
}

const linkItem = () => {
    const track = props.data
    if (!Track.hasPid(track)) return
    const { pid, platform } = track
    visitPlaylist(platform, pid)
}

const removeItem = () => {
    removeTrack(props.data)
    if (queueTracksSize.value > 0) {
        showToast("歌曲已删除！")
        return
    }
    EventBus.emit("playbackQueue-empty")
}

const showContextMenu = (event) => {
    event.preventDefault()
    EventBus.emit("commonCtxMenu-init", 9)
    EventBus.emit("commonCtxMenu-show", { event, value: props.data })
}
</script>

<template>
    <div class="playback-queue-item" :class="{ current: active }" @dblclick="" @contextmenu="showContextMenu">
        <div class="item-wrap">
            <div class="left">
                <img class="cover" v-lazy="data.cover" />
            </div>
            <div class="right">
                <div class="data">
                    <div class="title" v-html="data.title"></div>
                    <div class="bottom">
                        <div class="artist">
                            <ArtistControl :visitable="true" :platform="data.platform" :data="data.artist"
                                :trackId="data.id">
                            </ArtistControl>
                        </div>
                        <span class="duration">{{ Track.mmssDuration(data) }}</span>
                    </div>
                </div>
                <div class="action">
                    <svg @click="playItem" width="18" height="18" viewBox="0 0 139 139" xmlns="http://www.w3.org/2000/svg"
                        xml:space="preserve" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <path
                            d="M117.037,61.441L36.333,14.846c-2.467-1.424-5.502-1.424-7.972,0c-2.463,1.423-3.982,4.056-3.982,6.903v93.188  c0,2.848,1.522,5.479,3.982,6.9c1.236,0.713,2.61,1.067,3.986,1.067c1.374,0,2.751-0.354,3.983-1.067l80.704-46.594  c2.466-1.422,3.984-4.054,3.984-6.9C121.023,65.497,119.502,62.866,117.037,61.441z" />
                    </svg>
                    <svg @click="linkItem" width="16" height="16" class="spacing" viewBox="0 0 80 80"
                        xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Capa_1" data-name="Capa 1">
                                <path
                                    d="M29.3,63.47l-4.05,4a9.05,9.05,0,0,1-12.72,0,8.8,8.8,0,0,1,0-12.51l14.9-14.79c3.08-3.06,8.89-7.57,13.13-3.37a5,5,0,1,0,7-7c-7.19-7.14-17.83-5.82-27.1,3.37L5.54,47.94a18.72,18.72,0,0,0,0,26.59,19,19,0,0,0,26.7,0l4-4a5,5,0,1,0-7-7ZM74.45,6C66.72-1.63,55.92-2,48.76,5.06l-5,5a5,5,0,0,0,7,7l5-5c3.71-3.69,8.57-2.16,11.73,1a8.79,8.79,0,0,1,0,12.52L51.58,41.37c-7.27,7.21-10.68,3.83-12.14,2.38a5,5,0,0,0-7,7,15.61,15.61,0,0,0,11.14,5c4.89,0,10-2.46,15-7.34l15.9-15.77A18.71,18.71,0,0,0,74.45,6Z" />
                            </g>
                        </g>
                    </svg>
                    <svg @click="removeItem" width="16" height="16" class="spacing" viewBox="0 0 256 256"
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
        </div>
    </div>
</template>

<style scoped>
.playback-queue-item {
    border-bottom: 1px solid var(--border-color);
    --item-height: 66px;
    --cover-size: 43px;
}

.playback-queue-item .item-wrap {
    margin: 0px;
    padding-left: 10px;
    height: var(--item-height);
    display: flex;
    flex: 1;
    align-items: center;
    border-left: 2px solid transparent;
}

.playback-queue-item:hover {
    background: var(--list-item-hover);
}

.playback-queue-item .spacing {
    margin-left: 12px;
}

.current .item-wrap {
    border-image: var(--pbq-hl-border)
}

.current .title,
.current .artist,
.current .duration {
    background: var(--hl-text-bg);
    background: var(--pbq-hl-text-color);
    -webkit-background-clip: text;
    color: transparent !important;
    font-weight: 520;
}

.playback-queue-item .cover {
    width: var(--cover-size);
    height: var(--cover-size);
    margin-right: 8px;
    -webkit-user-drag: none;
    box-shadow: 0px 0px 1px #161616;
}

.playback-queue-item .left {
    height: 100%;
    display: flex;
    align-items: center;
}

.playback-queue-item .right {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
}

.playback-queue-item .right .data {
    height: var(--cover-size);
    z-index: 1;
    display: flex;
    flex-direction: column;
}

.playback-queue-item .title,
.playback-queue-item .artist {
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    line-break: anywhere;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
}

.playback-queue-item .title {
    width: 258px;
    width: 77%;
    top: 2px;
}

.playback-queue-item .bottom {
    /*position: relative;*/
}

.playback-queue-item .artist,
.playback-queue-item .duration {
    color: var(--text-sub-color);
    /*
    font-size: 14px;
    bottom: 10px;
    */
    font-size: 13px;
    bottom: 12px;
    font-weight: 520;
}

.playback-queue-item .duration {
    font-size: var(--tip-text-size);
}

.playback-queue-item .artist {
    position: absolute;
    left: 0px;
    width: 210px;
    width: 62.68%;
    cursor: pointer;
}

.playback-queue-item .artist span {
    cursor: pointer;
}

.playback-queue-item .artist span:hover {
    background: var(--hl-text-bg);
    -webkit-background-clip: text;
    color: transparent;
}

.playback-queue-item .duration {
    position: absolute;
    right: 20px;
}

.playback-queue-item .action {
    z-index: 2;
    height: 100%;

    position: absolute;
    top: 0px;
    right: 10px;

    display: flex;
    align-items: center;

    padding-left: 15px;
    padding-right: 15px;

    /*background: var(--list-item-hover);*/
    visibility: hidden;
}

.playback-queue-item .action svg {
    fill: var(--svg-color);
    cursor: pointer;
}

.playback-queue-item .action svg:hover {
    fill: var(--hl-color);
    fill: var(--svg-hover-color);
}

.playback-queue-item:hover .title,
.playback-queue-item:hover .artist {
    width: 158px;
    width: 47.16%;
}

.playback-queue-item:hover .action {
    visibility: visible;
}


.playback-queue-item:hover .duration {
    visibility: hidden;
}
</style>