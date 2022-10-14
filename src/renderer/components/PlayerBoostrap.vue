<script setup>
import { usePlayStore } from '../store/playStore';
import { useMainViewStore } from '../store/mainViewStore';
import { usePlatformStore } from '../store/platformStore';
import EventBus from '../../common/EventBus';
import { Track } from '../../common/Track';
import { storeToRefs } from 'pinia';
import { useUserProfileStore } from '../store/userProfileStore';
import { onMounted } from 'vue';
import { useIpcRenderer } from '../../common/Utils';
import { PLAY_STATE, TRAY_ACTION } from '../../common/Constants';
import { useRouter } from 'vue-router';
import { useSettingStore } from '../store/settingStore';

const router = useRouter()
const ipcRenderer = useIpcRenderer()

const { queueTracksSize } = storeToRefs(usePlayStore())
const { playTrack, playNextTrack, 
    setAutoPlaying, playPrevTrack, 
    togglePlay, switchPlayMode,
    toggleVolumeMute, updateVolumeByOffset,
    updateCurrentTime, setPlaying  } = usePlayStore()
const { getVender } = usePlatformStore()
const { showPlayNotification, hidePlayNotification, 
    hidePlayingView, hidePlaybackQueueView, togglePlaybackQueueView } = useMainViewStore()
const { addRecentSong, addRecentRadio, addRecentAlbum } = useUserProfileStore()
const { isStorePlayStateBeforeQuit, isStoreLocalMusicBeforeQuit } = storeToRefs(useSettingStore())

const visitRoute = (path) => {
    hidePlayingView()
    hidePlaybackQueueView()
    router.push(path)
}

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

//TODO 用户手动干预，即主动点击上/下一曲时，产生体验上的Bug
let playNextTimer = null
const showToast = (callback) => {
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
    const { id, platform, isFMRadio, isRadioType, artistNotCompleted }= track
    const vender = getVender(platform);
    if(!vender || isFMRadio) return
    vender.playDetail(id, track).then(result => {
        const { lyric, cover, artist, url } = result
        if(Track.hasUrl(result)) Object.assign(track, { url })
        //TODO 流程待优化完善
        tryCancelPlayNextTimer()
        //if(!Track.hasUrl(track)) track = await United.transferTrack(track)
        if(!Track.hasUrl(track)) { //VIP收费歌曲或其他
            if(queueTracksSize.value < 2 && !isRadioType) { //非电台歌曲，且没有下一曲
                if(!noToast) showToast()
            } else if(toastCnt < 9) { 
                setAutoPlaying(true)
                //TODO 频繁切换下一曲，体验不好，对音乐平台也不友好
                if(!noToast) showToast(playNextTrack)
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
    }).catch(e => {
        console.log(e)
        //showToast(playNextTrack)
    })
}

const traceRecentPlay = (track) => {
    const { isFMRadio } = track
    if(isFMRadio) {
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
    //进度在更新，状态必为plyaing
    setPlaying(true)
    updateCurrentTime(secs)
})

//注册ipcMain消息监听器
const registryIpcRenderderListeners = () => {
    if(!ipcRenderer) return 
    //Tray事件
    ipcRenderer.on("tray-action", (e, value) => {
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
                visitRoute('/')
                break
            case TRAY_ACTION.USERHOME:
                visitRoute('/userhome/all')
                break
            case TRAY_ACTION.SETTING:
                visitRoute('/setting')
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
    ipcRenderer.on('globalShortcut-visitSetting', () => visitRoute('/setting'))
    ipcRenderer.on('globalShortcut-togglePlaybackQueue', togglePlaybackQueueView)

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

onMounted(initRadioPlayer)
</script>
<template>
    <!-- FM广播audio -->
    <audio class="radio-holder"></audio>
    <slot></slot>
</template>
<style>
.radio-holder {
  visibility: hidden;
}
</style>