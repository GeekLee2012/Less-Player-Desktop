<script setup>
import { storeToRefs } from 'pinia';
import PlaybackQueueItem from '../components/PlaybackQueueItem.vue';
import { usePlayStore } from '../store/playStore';
import { usePlatformStore } from '../store/platformStore';
import { United } from '../../vendor/united';
import EventBus from '../../common/EventBus';

const { queueTracks, playingIndex, queueTracksSize } = storeToRefs(usePlayStore())
const { resetQueue, playTrack } = usePlayStore()
const { getVender } = usePlatformStore()

const targetPlaying = () => {
    if(queueTracksSize < 1) return 
    const queueItemsWrap = document.querySelector('.playback-queue .center')
    const clientHeight = queueItemsWrap.clientHeight
    const scrollHeight = queueItemsWrap.scrollHeight
    const maxScroll = scrollHeight - clientHeight
    queueItemsWrap.scrollTop = maxScroll * (playingIndex.value / (queueTracksSize.value - 1))
} 

const clearAll = () => {
    resetQueue()
}

const loadLyric = (track) => {
    if(!track) return 
    if(track.hasLyric()) {
        EventBus.emit('track-lyricLoaded', track)
        return 
    }
    const platform = track.platform
    const vender = getVender(platform);
    if(!vender) return 
    vender.lyric(track.id, track).then(result => assignLyric(track, result))
}

const assignLyric = (track, lyric) => {
    //track.lyric = result
    if(!track) return
    if(!lyric) return
    Object.assign(track, { lyric })
    EventBus.emit('track-lyricLoaded', track)
}

const initAndPlayTrack = (track) => {
    if(!track) return 
    const platform = track.platform
    const vender = getVender(platform);
    if(!vender) return
    vender.playDetail(track.id, track).then(async result => {
        if(!track.hasUrl()) track.url = result.url
        //if(!track.hasUrl()) track = await United.transferTrack(track) 
        if(!track.hasUrl()) {
            //TODO 频繁切换下一曲，对音乐平台不友好
            //if(queueTracksSize.value > 1) playNextTrack()
            return
        }
        if(!track.hasLyric()) assignLyric(track, result.lyric)
        if(!track.hasCover()) Object.assign(track, { cover: result.cover })
        if(track.artistNotCompleted && result.artist) {
            Object.assign(track, { artist: result.artist })
            EventBus.emit('track-artistUpdated', { trackId: track.id, artist: track.artist })
        }
        playTrack(track)
        loadLyric(track)
    })
}

EventBus.on('track-changed', track => initAndPlayTrack(track))
EventBus.on('track-loadLyric', track => loadLyric(track))
</script>

<template>
    <!-- click事件: 必须阻止冒泡，因为document全局监听click事件 -->
    <div class="playback-queue" @click.stop="">
        <div class="header">
            <div class="title">当前播放</div>
            <div class="detail">
                <div id="size-text">共{{ queueTracks.length }}首歌曲</div>
                <div class="action">
                    <div class="target-btn text-btn" @click="targetPlaying">
                        <svg width="16" height="15" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g id="aim"><path d="M12,8a4,4,0,1,0,4,4A4,4,0,0,0,12,8Zm0,6a2,2,0,1,1,2-2A2,2,0,0,1,12,14Z"/><path d="M23,11H22A10,10,0,0,0,13,2.05V1a1,1,0,0,0-2,0v1a10,10,0,0,0-8.95,9H1a1,1,0,0,0,0,2h1a10,10,0,0,0,9,9V23a1,1,0,0,0,2,0V22A10,10,0,0,0,22,13H23A1,1,0,0,0,23,11ZM13,19.93V19a1,1,0,0,0-2,0v.93A8,8,0,0,1,4.07,13H5a1,1,0,0,0,0-2H4.07A8,8,0,0,1,11,4.07V5a1,1,0,0,0,2,0V4.07A8,8,0,0,1,19.93,11H19a1,1,0,0,0,0,2h.93A8,8,0,0,1,13,19.93Z"/></g></svg>
                        <span>定位</span>
                    </div>
                    <div class="clear-btn text-btn" @click="clearAll">
                        <svg width="14" height="14" viewBox="0 0 256 256" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg"><path d="M1040,669H882c-12.79-4.93-17.16-14.62-17.1-27.83.26-52.77.11-105.55.11-158.32V477c-6,0-11.42-.32-16.84.09-6.54.48-11.66-1.39-15.17-7.08v-7c3.16-5.7,8-7.48,14.44-7.36,18.29.32,36.58.12,54.88.1,1.75,0,3.5-.16,5.48-.25,0-7.76,0-14.91,0-22.05a18.56,18.56,0,0,1,6.6-14.52c2.85-2.39,6.37-4,9.59-5.92h73c13.83,5.64,17.27,10.84,17.25,26.08,0,5.41,0,10.82,0,16.68h7.53c17.61,0,35.21.2,52.81-.12,6.43-.12,11.27,1.63,14.41,7.36v7c-3.5,5.7-8.63,7.56-15.17,7.08-5.41-.4-10.89-.09-16.84-.09v6.36c0,52.6-.15,105.2.11,157.8C1057.17,654.36,1052.81,664.08,1040,669ZM886.24,477.29V640.4c0,8.44-.49,7.34,7.11,7.35q67.95,0,135.9,0c6.51,0,6.52,0,6.52-6.43v-164Zm106.5-42.78H929.37v21h63.37Z" transform="translate(-833 -413)"/><path d="M950.29,562.2c0-13.47,0-26.94,0-40.41,0-7.94,4.25-12.84,10.82-12.77,6.36.07,10.59,5,10.6,12.52,0,27.28,0,54.55,0,81.83,0,5.13-1.71,9.17-6.5,11.36-7.39,3.36-14.87-2.16-14.94-11.11-.11-13.81,0-27.61,0-41.42Z" transform="translate(-833 -413)"/><path d="M1014.25,562.63c0,13.48,0,27,0,40.42,0,7.88-4.3,12.82-10.87,12.64-6.29-.18-10.35-5.13-10.36-12.75q0-41.16,0-82.33c0-5.91,3-9.91,8-11.26a10.29,10.29,0,0,1,11.85,5.16,16.06,16.06,0,0,1,1.33,6.71c.12,13.8.06,27.61.06,41.41Z" transform="translate(-833 -413)"/><path d="M929,562.53q0,21,0,41.92c0,4.8-2.09,8.39-6.49,10.29-4.21,1.81-8.49,1.25-11.43-2.23a13.57,13.57,0,0,1-3.17-8c-.23-28.1-.19-56.21-.12-84.32,0-6.74,4.63-11.34,10.74-11.19s10.41,4.78,10.44,11.59C929.05,534.59,929,548.56,929,562.53Z" transform="translate(-833 -413)"/></svg>
                        <span>清空</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="center">
            <div v-for="(item, index) in queueTracks">
                <PlaybackQueueItem :data="item" :active="playingIndex == index">
                </PlaybackQueueItem>
            </div>
        </div>
    </div>
</template>

<style>
.playback-queue {
    display: flex;
    flex-direction: column;
    -webkit-app-region: none;
}

.playback-queue .header {
    padding: 20px 15px 10px 10px;
    border-bottom: 0.1px solid #464646;
}

.playback-queue .detail {
    margin-top: 8px;
    margin-left: 3px;
    text-align: left;
    font-size: 14px;
    display: flex;
}

.playback-queue .action {
    display: flex;
    flex-direction: row;
    position: absolute;
    right: 18px;
}

.playback-queue .text-btn {
    text-align: left;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-items: center;
    cursor: pointer;
    margin-left: 20px;
}

.playback-queue .text-btn svg {
    margin-right: 3px;
    fill: var(--svg-color);
}

.playback-queue .text-btn:hover,
.playback-queue .text-btn:hover svg {
    color: #28c83f;
    fill: #28c83f;
}

/*
.playback-queue .text-btn span {
    display: none;
}

.playback-queue .target-btn:hover span,
.playback-queue .clear-btn:hover span {
    display: flex;
}
*/

.playback-queue .header .title {
    text-align: left;
    font-size: 21px;
    font-weight: bold;
    background: linear-gradient(to top right, #28c83f, #1ca388);
    -webkit-background-clip: text;
    color: transparent;
}

.playback-queue .center {
    flex: 1;
    overflow: auto;
}
</style>