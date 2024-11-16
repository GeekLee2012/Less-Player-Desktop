<script setup>
import { computed, inject, } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlayStore } from '../store/playStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';
import { usePlatformStore } from '../store/platformStore';
import ArtistControl from './ArtistControl.vue';
import { Track } from '../../common/Track';
import { Playlist } from '../../common/Playlist';
import { coverDefault, toTrimString } from '../../common/Utils';



const { playVideoItem, dndSaveTrack, mmssCurrentTime } = inject('player')
const { visitPlaylist, visitRadio, visitAlbum } = inject('appRoute')
const { showContextMenu, } = inject('appCommon')

const { queueTracksSize, playing } = storeToRefs(usePlayStore())
const { playTrack, removeTrack, isCurrentTrack, togglePlay } = usePlayStore()
const { commonCtxMenuCacheItem } = storeToRefs(useAppCommonStore())
const { showToast, setRouterCtxCacheItem } = useAppCommonStore()
const { isHighlightCtxMenuItemEnable, isPlaybackQueueMvBtnShow, isDndSaveEnable } = storeToRefs(useSettingStore())
const { isLocalMusic } = usePlatformStore()


const props = defineProps({
    data: Object, //Track
    active: Boolean,
    index: Number,
    actionable: Boolean,
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
    const { pid, title, platform, album } = track
    if (Track.hasPid(track)) {
        if (Playlist.isAnchorRadioType(track)) {
            /*
            visitPlaylist(platform, pid, 'radios', () => setRouterCtxCacheItem({ id: 'linkItem', title }), true)
                .catch(error => {
                    if (error == 'sameRoute') emitEvents('playlist-linkItem', title)
                })
            */
           visitPlaylist(platform, pid, 'radios')
        } else if (album && toTrimString(album.id) == toTrimString(pid)) {
            visitAlbum({ platform, id: pid })
        } else {
            /*
            visitPlaylist(platform, pid, null, () => setRouterCtxCacheItem({ id: 'linkItem', title }), true)
                .catch(error => {
                    if (error == 'sameRoute') emitEvents('playlist-linkItem', title)
                })
            */
            visitPlaylist(platform, pid)
        }
    } else if (Playlist.isFMRadioType(track)) {
        visitRadio(platform)
    }
}

const removeItem = () => {
    const { data: track } = props
    removeTrack(track)
    if (queueTracksSize.value > 0) {
        let msg = "歌曲已删除"
        if (Playlist.isFMRadioType(track)) msg = "电台已删除"
        else if (Playlist.isAnchorRadioType(track)) msg = "音频已删除"
        showToast(msg)
    }
}

const onContextMenu = (event) => {
    const { data, index, actionable } = props
    if(!actionable) return 
    showContextMenu(event, data, 9, index, true)
}

const isMvBtnShow = computed(() => {
    return isPlaybackQueueMvBtnShow.value && props.data.mv
})

const isDraggable = computed(() => {
    const { platform } = props.data
    return isDndSaveEnable.value
        && !isLocalMusic(platform)
        && !Playlist.isFMRadioType(props.data)
})

const playingState = computed(() => {
    const track = props.data
    if (!isCurrentTrack(track)) return false
    return playing.value
})
</script>

<template>
    <div class="playback-queue-item"
        :class="{ 
            'playback-queue-item-active': active, 
            'list-item-ctx-menu-trigger': isHighlightCtxMenuItemEnable && (commonCtxMenuCacheItem == data),
            actionable,
            'ex-action': isMvBtnShow,
        }"
        @dblclick="" 
        @contextmenu="onContextMenu">
        <div class="item-wrap">
            <div class="left" :draggable="isDraggable" @dragstart.stop="(event) => dndSaveTrack(event, data)">
                <img class="cover" v-show="!data.color"
                    :class="{ 'obj-fit-contain': (data.coverFit == 1) }" 
                    v-lazy="coverDefault(data.cover)" />
                <div class="cover color-mode" v-show="data.color" 
                    :style="{ background: data.color }">
                </div>
            </div>
            <div class="right">
                <div class="data">
                    <div class="title" :class="{ 'content-text-highlight': active }" v-html="data.title"></div>
                    <div class="textflag mvflag" v-show="isMvBtnShow">
                        <span>MV</span>
                    </div>
                    <div class="bottom">
                        <div class="artist" :class="{ 'content-text-highlight': active }">
                            <ArtistControl :visitable="actionable" :platform="data.platform" :data="data.artist"
                                :trackId="data.id">
                            </ArtistControl>
                        </div>
                        <span class="duration" v-show="active && Playlist.isFMRadioType(data)" :class="{ 'content-text-highlight': active }">{{ mmssCurrentTime }}</span>
                        <span class="duration" v-show="!Playlist.isFMRadioType(data)" :class="{ 'content-text-highlight': active }">{{ Track.mmssDuration(data)}}</span>
                    </div>
                </div>
                <div class="action" v-show="actionable">
                    <svg v-show="isMvBtnShow" @click="playVideoItem(data)" width="18" height="18" viewBox="0 0 1024 853.52"
                        xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M1024,158.76v536c-.3,1.61-.58,3.21-.92,4.81-2.52,12-3.91,24.43-7.76,36-23.93,72-88.54,117.91-165.13,117.92q-338.19,0-676.4-.1a205.81,205.81,0,0,1-32.3-2.69C76,840.18,19.81,787.63,5,723.14c-2.15-9.35-3.36-18.91-5-28.38v-537c.3-1.26.66-2.51.89-3.79,1.6-8.83,2.52-17.84,4.85-26.48C26.32,51.12,93.47.05,173.29,0Q512,0,850.72.13a200.6,200.6,0,0,1,31.8,2.68C948.44,13.47,1004,65.66,1019.09,130.88,1021.21,140.06,1022.39,149.46,1024,158.76ZM384,426.39c0,45.66-.09,91.32,0,137,.07,24.51,19.76,43.56,43.38,42.47,8.95-.42,15.83-5.3,23.06-9.86q69.25-43.74,138.74-87.11,40.63-25.42,81.44-50.6c23.18-14.34,23.09-49-.25-63.14-3.27-2-6.69-3.72-9.93-5.74q-30.08-18.81-60.08-37.69Q522.2,302.46,444,253.2a34.65,34.65,0,0,0-26.33-4.87c-19.87,4.13-33.64,21.28-33.68,42.09Q383.9,358.42,384,426.39Z" />
                            </g>
                        </g>
                    </svg>
                    <svg :class="{ spacing2: isMvBtnShow }" v-show="!playingState" @click="playItem" width="18" height="18" viewBox="0 0 139 139"
                        xmlns="http://www.w3.org/2000/svg" xml:space="preserve" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <path
                            d="M117.037,61.441L36.333,14.846c-2.467-1.424-5.502-1.424-7.972,0c-2.463,1.423-3.982,4.056-3.982,6.903v93.188  c0,2.848,1.522,5.479,3.982,6.9c1.236,0.713,2.61,1.067,3.986,1.067c1.374,0,2.751-0.354,3.983-1.067l80.704-46.594  c2.466-1.422,3.984-4.054,3.984-6.9C121.023,65.497,119.502,62.866,117.037,61.441z" />
                    </svg>
                    <svg :class="{ spacing2: isMvBtnShow }" v-show="playingState" @click="playItem" width="18" height="15" viewBox="0 0 658.53 1006.16"
                        xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M196.43,503.09q0,200.21,0,400.41c0,20.63-4.42,39.93-15.66,57.45-21.43,33.42-62.66,50.43-102.18,42.14-39.72-8.34-70.5-39.72-76.82-78.67A130.29,130.29,0,0,1,.08,903.55Q-.06,501.88,0,100.21C0,48.38,35,8.27,86.47.9,136.62-6.29,186.73,30.61,194.7,80.79a135,135,0,0,1,1.66,20.88Q196.49,302.37,196.43,503.09Z" />
                                <path
                                    d="M462.09,503q0-200.72,0-401.42c0-46.91,29.11-85.51,72.86-97,63.42-16.69,123.47,30.29,123.52,96.79q.12,169,0,337.92,0,232.95,0,465.9c0,38.9-15.56,69.86-50.23,88.7-60,32.57-134.91-2.14-145.21-73a117,117,0,0,1-.9-17Q462.05,703.43,462.09,503Z" />
                            </g>
                        </g>
                    </svg>
                    <svg @click="linkItem" width="16" height="16" class="spacing1" viewBox="0 0 80 80"
                        xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Capa_1" data-name="Capa 1">
                                <path
                                    d="M29.3,63.47l-4.05,4a9.05,9.05,0,0,1-12.72,0,8.8,8.8,0,0,1,0-12.51l14.9-14.79c3.08-3.06,8.89-7.57,13.13-3.37a5,5,0,1,0,7-7c-7.19-7.14-17.83-5.82-27.1,3.37L5.54,47.94a18.72,18.72,0,0,0,0,26.59,19,19,0,0,0,26.7,0l4-4a5,5,0,1,0-7-7ZM74.45,6C66.72-1.63,55.92-2,48.76,5.06l-5,5a5,5,0,0,0,7,7l5-5c3.71-3.69,8.57-2.16,11.73,1a8.79,8.79,0,0,1,0,12.52L51.58,41.37c-7.27,7.21-10.68,3.83-12.14,2.38a5,5,0,0,0-7,7,15.61,15.61,0,0,0,11.14,5c4.89,0,10-2.46,15-7.34l15.9-15.77A18.71,18.71,0,0,0,74.45,6Z" />
                            </g>
                        </g>
                    </svg>
                    <svg @click="removeItem" width="16" height="16" class="spacing1" viewBox="0 0 256 256"
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
    /*padding-left: 12.5px;*/
    height: var(--item-height);
    display: flex;
    flex: 1;
    align-items: center;
    border-left: 2.5px solid transparent;
}

.playback-queue-item:hover {
    background: var(--content-list-item-hover-bg-color);
}

.playback-queue-item .spacing {
    margin-left: 12px;
}

.playback-queue-item .spacing1 {
    margin-left: 15px;
}

.playback-queue-item .spacing2 {
    margin-left: 18px;
}

.playback-queue-item-active .item-wrap {
    border-image: var(--content-border-image) 0 0 0 2.5;
}

.playback-queue-item-active .title,
.playback-queue-item-active .artist,
.playback-queue-item-active .duration {
    font-weight: bold;
}

.playback-queue-item .cover {
    width: var(--cover-size);
    height: var(--cover-size);
    -webkit-user-drag: none;
    box-shadow: 0px 0px 1px #161616;
    border-radius: var(--border-img-small-border-radius);
    margin-right: 10px;
    margin-left: 12.5px;
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
    line-clamp: 1;
}

.playback-queue-item .title {
    width: 258px;
    width: 77%;
    width: 95%;
}

.playback-queue-item .artist,
.playback-queue-item .duration {
    color: var(--content-subtitle-text-color);
    /*
    font-size: 14px;
    bottom: 10px;
    */
    font-size: 13px;
    bottom: 12px;
    font-weight: 520;
}

.playback-queue-item .duration {
    font-size: var(--content-text-tip-text-size);
}

.playback-queue-item .artist {
    position: absolute;
    left: 0px;
    width: 210px;
    width: 62.68%;
    width: 93.5%;
}

.playback-queue-item .artist span {
    cursor: pointer;
}

.playback-queue-item .artist span:hover {
    background: var(--content-text-highlight-color);
    -webkit-background-clip: text;
    background-clip: text;
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
    right: 0px;

    display: flex;
    align-items: center;

    padding-left: 20px;
    padding-right: 20px;

    /*background: var(--content-list-item-hover-bg-color);*/
    visibility: hidden;
}

.playback-queue-item .action svg {
    fill: var(--button-icon-btn-color);
    cursor: pointer;
}

.playback-queue-item .action svg:hover {
    fill: var(--content-highlight-color);
}

.playback-queue-item.actionable .title {
    width: 77%;
}

.playback-queue-item.actionable .artist {
    width: 62.68%;
    cursor: pointer;
}

.playback-queue-item.actionable:hover .title,
.playback-queue-item.actionable:hover .artist {
    width: 59%;
}

.playback-queue-item.actionable.ex-action:hover .title,
.playback-queue-item.actionable.ex-action:hover .artist {
    width: 49%;
}

.playback-queue-item.actionable:hover .action {
    visibility: visible;
}


.playback-queue-item:hover .duration {
    visibility: hidden;
}

.playback-queue-item .textflag span {
    background: var(--content-text-highlight-color);
    background: var(--content-subtitle-text-color);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent !important;

    border-radius: var(--border-inputs-border-radius);
    border: 1.3px solid var(--content-subtitle-text-color);
    padding: 1px 3px;
    font-size: 10px;
    font-weight: bold;
    margin-right: 5px;
}

.playback-queue-item .mvflag {
    position: absolute;
    right: 15px;
    top: 9px;
}

.playback-queue-item:hover .mvflag {
    visibility: hidden;
}

.playback-queue-item-active .textflag span {
    background: var(--content-text-highlight-color);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent !important;
    border: 1.3px solid var(--content-highlight-color);
}
</style>