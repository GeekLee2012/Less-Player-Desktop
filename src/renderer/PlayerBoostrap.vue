<script setup>
import { inject, onMounted } from 'vue';
import { usePlayStore } from './store/playStore';
import { useAppCommonStore } from './store/appCommonStore';
import { usePlatformStore } from './store/platformStore';
import EventBus from '../common/EventBus';
import { Track } from '../common/Track';
import { storeToRefs } from 'pinia';
import { useUserProfileStore } from './store/userProfileStore';
import { useIpcRenderer } from '../common/Utils';
import { PLAY_STATE, TRAY_ACTION } from '../common/Constants';
import { useSettingStore } from './store/settingStore';
import { Playlist } from '../common/Playlist';

const ipcRenderer = useIpcRenderer()

const { currentTrack, queueTracksSize, playing } = storeToRefs(usePlayStore())
const { playTrack, playNextTrack, 
    setAutoPlaying, playPrevTrack, 
    togglePlay, switchPlayMode,
    toggleVolumeMute, updateVolumeByOffset,
    updateCurrentTime, setPlaying  } = usePlayStore()
const { getVendor, isLocalMusic } = usePlatformStore()
const { playingViewShow ,videoPlayingViewShow, } = storeToRefs(useAppCommonStore())
const { showPlayNotification, hidePlayNotification, 
    togglePlaybackQueueView, toggleVideoPlayingView, 
    showFailToast, toggleLyricToolbar } = useAppCommonStore()
const { addRecentSong, addRecentRadio, addRecentAlbum } = useUserProfileStore()
const { isStorePlayStateBeforeQuit, isStoreLocalMusicBeforeQuit } = storeToRefs(useSettingStore())

const { visitHome, visitUserHome, visitSetting } = inject('appRoute')

const loadLyric = (track) => {
    if(!track) return 
    if(Track.hasLyric(track)) {
        EventBus.emit('track-lyricLoaded', track)
        return 
    }
    const platform = track.platform
    const vendor = getVendor(platform);
    if(!vendor) return 
    if(Playlist.isFMRadioType(track) || Playlist.isAnchorRadioType(track)) return 
    vendor.lyric(track.id, track).then(result => assignLyric(track, result))
}

const assignLyric = (track, lyric) => {
    //track.lyric = result
    if(!track) return
    if(!lyric) return
    Object.assign(track, { lyric })
    EventBus.emit('track-lyricLoaded', track)
}

//TODO 用户手动干预，即主动点击上/下一曲时，产生体验上的Bug
let playNextTimer = null
const showPlayToast = (callback) => {
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

let toastCnt = 0 //连跳计数器
const bootstrapTrack = (track, callback, noToast) => {
    if(!track) return 
    const { id, platform, artistNotCompleted }= track
    const vendor = getVendor(platform);
    if(!vendor || Playlist.isFMRadioType(track)) return
    vendor.playDetail(id, track).then(result => {
        const { lyric, cover, artist, url } = result
        if(Track.hasUrl(result)) Object.assign(track, { url })
        //TODO 流程待优化完善
        tryCancelPlayNextTimer()
        //if(!Track.hasUrl(track)) track = await United.transferTrack(track)
        if(!Track.hasUrl(track)) { //VIP收费歌曲或其他
            if(queueTracksSize.value < 2 && !Playlist.isNormalRadioType(track)) { //非电台歌曲，且没有下一曲
                if(!noToast) showPlayToast()
            } else if(toastCnt < 9) { 
                setAutoPlaying(true)
                //TODO 频繁切换下一曲，体验不好，对音乐平台也不友好
                if(!noToast) showPlayToast(playNextTrack)
                ++toastCnt
            } else { //10连跳啦，暂停一下吧
                toastCnt = 0 //重置连跳计数
                setAutoPlaying(false)
            }
            return
        }
        toastCnt =0 //重置连跳计数
        setAutoPlaying(false)
        
        if(Track.hasLyric(result)) assignLyric(track, lyric)
        if(Track.hasCover(result)) Object.assign(track, { cover })
        //TODO 部分音乐平台artist信息无法在同一API中完整获取
        if(artistNotCompleted && artist) { 
            Object.assign(track, { artist })
            EventBus.emit('track-artistUpdated', { trackId: id, artist })
        }
        if(callback) callback(track)
    }).catch(error => {
        console.log(error)
        //showPlayToast(playNextTrack)
    })
}

const traceRecentPlay = (track) => {
    const { platform } = track
    if(isLocalMusic(platform)) return
    if(Playlist.isFMRadioType(track)) {
        addRecentRadio(track)
    } else {
        addRecentSong(track)
    }
    EventBus.emit("userHome-refresh")
}

const initRadioPlayer = () => {
    EventBus.emit('radio-init', document.querySelector('.radio-holder'))
}

const retry = (track) => {
    if(!Track.hasUrl(track)) {
        playNextTrack()
    } else {
        EventBus.emit('track-changed', track)
    }
}

const getVideoDetail = (platform, id) => {
    return new Promise((resolve, reject) => {
        const vendor = getVendor(platform)
        if(!vendor) {
            if(reject) reject('NoVendor')
            return 
        }
        const quality = '1080'
        vendor.videoDetail(id, quality).then(result => {
            if(!result.url || result.url.trim().length < 1) {
                if(reject) reject('NoURL')
                return
            }
            resolve(result)
        })
    })
}

//FM广播
EventBus.on('radio-play', track => traceRecentPlay(track))
EventBus.on('radio-state', state => setPlaying(state))
//普通歌曲
EventBus.on('track-changed', track => {
    traceRecentPlay(track)
    bootstrapTrack(track, track => {
        playTrack(track)
        loadLyric(track)
    })
})
EventBus.on('track-restoreInit', track => {
    traceRecentPlay(track)
    bootstrapTrack(track, track => {
        EventBus.emit("track-restore", track)
    }, true)
})
EventBus.on('track-loadLyric', track => loadLyric(track))
EventBus.on('track-error', track => retry(track))
EventBus.on('track-state', state => {
    switch(state) {
        case PLAY_STATE.PLAYING:
            setPlaying(true)
            break;
        case PLAY_STATE.PAUSE:
            setPlaying(false)
            break;
        case PLAY_STATE.END:
            playNextTrack()
            break;
        default:
            break
    }
})
EventBus.on('track-pos', secs => {
    //setPlaying(true)
    updateCurrentTime(secs)
})

EventBus.on('track-playMv', track => {
    if(!Track.hasMv(track)) return
    const { platform, mv } = track
    getVideoDetail(platform, mv).then(result => {
        if(playing.value) togglePlay()
        toggleVideoPlayingView()
        EventBus.emit('video-play', result)
        traceRecentPlay(track)
    }, reason => showFailToast('当前MV无法播放！'))
})

//注册ipcMain消息监听器
const registryIpcRenderderListeners = () => {
    if(!ipcRenderer) return 
    //Tray事件
    ipcRenderer.on("tray-action", (e, value) => {
        //TODO 视频播放中，暂时不允许中断
        if(videoPlayingViewShow.value) return
        switch(value) {
            case TRAY_ACTION.PLAY: 
            case TRAY_ACTION.PAUSE:
                togglePlay()
                break
            case TRAY_ACTION.PLAY_PREV:
                playPrevTrack()
                break
            case TRAY_ACTION.PLAY_NEXT:
                playNextTrack()
                break
            case TRAY_ACTION.HOME:
                visitHome()
                break
            case TRAY_ACTION.USERHOME:
                visitUserHome()
                break
            case TRAY_ACTION.SETTING:
                visitSetting()
                break
        }
    })
    
    //全局快捷键
    ipcRenderer.on('globalShortcut-togglePlay', togglePlay)
    ipcRenderer.on('globalShortcut-switchPlayMode', switchPlayMode)
    ipcRenderer.on('globalShortcut-playPrev', playPrevTrack)
    ipcRenderer.on('globalShortcut-playNext', playNextTrack)
    ipcRenderer.on('globalShortcut-volumeUp', () => updateVolumeByOffset(0.05))
    ipcRenderer.on('globalShortcut-volumeDown', () => updateVolumeByOffset(-0.05))
    ipcRenderer.on('globalShortcut-toggleVolumeMute', toggleVolumeMute)
    ipcRenderer.on('globalShortcut-visitSetting', () => visitSetting())
    ipcRenderer.on('globalShortcut-togglePlaybackQueue', togglePlaybackQueueView)
    ipcRenderer.on('globalShortcut-toggleLyricToolbar', () => {
        if(playingViewShow.value) toggleLyricToolbar() 
    })
    
    //其他事件
    ipcRenderer.on('app-quit', () => {
        if(!isStorePlayStateBeforeQuit.value) {
            localStorage.removeItem('player')
        }
        if(!isStoreLocalMusicBeforeQuit.value) {
            localStorage.removeItem('localMusic')
        }
    })
}

registryIpcRenderderListeners()
onMounted(() => {
    EventBus.emit("track-restoreInit", currentTrack.value)
    initRadioPlayer()
})
</script>

<template>
    <!-- FM广播audio -->
    <audio class="radio-holder" crossOrigin="anonymous"></audio>
    <slot></slot>
</template>
<style>
.radio-holder {
  visibility: hidden;
}
</style>