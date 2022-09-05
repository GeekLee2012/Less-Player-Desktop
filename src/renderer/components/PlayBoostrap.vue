<script setup>
import { usePlayStore } from '../store/playStore';
import { useMainViewStore } from '../store/mainViewStore';
import { usePlatformStore } from '../store/platformStore';
import EventBus from '../../common/EventBus';
import { Track } from '../../common/Track';

const { playTrack, playNextTrack } = usePlayStore()
const { getVender } = usePlatformStore()
const { showPlayNotification, hidePlayNotification } = useMainViewStore()

const loadLyric = (track) => {
    if(!track) return 
    if(Track.hasLyric(track)) {
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

let playNextTimer = null
const toastNotification = (callback) => {
    showPlayNotification()
    playNextTimer = setTimeout(() => {
        hidePlayNotification()
        if(callback) callback()
    }, 2000)
}

const tryCancelPlayNextTimer = () => {
    try {
        if(playNextTimer) clearTimeout(playNextTimer)
    } catch(e) {
        //Do nothing
    } finally {
        hidePlayNotification()
    }
}

const bootstrapTrack = (track, callback) => {
    if(!track) return 
    const platform = track.platform
    const vender = getVender(platform);
    if(!vender || track.isFMRadio) return
    vender.playDetail(track.id, track).then(async result => {
        if(!Track.hasUrl(track)) Object.assign(track, { url: result.url })
        tryCancelPlayNextTimer()
        //if(!track.hasUrl()) track = await United.transferTrack(track)
        if(!Track.hasUrl(track)) { //VIP收费歌曲或其他
            //TODO 频繁切换下一曲，体验不好，对音乐平台也不友好
            toastNotification(playNextTrack)
            return
        }
        if(!Track.hasLyric(track)) assignLyric(track, result.lyric)
        if(!Track.hasCover(track)) Object.assign(track, { cover: result.cover })
        if(track.artistNotCompleted && result.artist) {
            Object.assign(track, { artist: result.artist })
            EventBus.emit('track-artistUpdated', { trackId: track.id, artist: track.artist })
        }
        if(callback) callback(track)
    }).catch(e => {
        console.log(e)
        //toastNotification(playNextTrack)
    })
}

EventBus.on('track-changed', track => bootstrapTrack(track, track => {
        playTrack(track)
        loadLyric(track)
    }))
EventBus.on('track-init', track => bootstrapTrack(track, track => {
        EventBus.emit("track-restore", track)
    }))
EventBus.on('track-loadLyric', track => loadLyric(track))
</script>
<template>

</template>
<style>

</style>