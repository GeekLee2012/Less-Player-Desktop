<script setup>
import { inject, onMounted, watch } from 'vue';
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
    updateCurrentTime, setPlaying,
    resetQueue, addTracks, 
    addTrack, } = usePlayStore()
const { getVendor, isLocalMusic } = usePlatformStore()
const { playingViewShow ,videoPlayingViewShow, 
    playingViewThemeIndex, spectrumIndex } = storeToRefs(useAppCommonStore())
const { showPlayNotification, hidePlayNotification, 
    togglePlaybackQueueView, toggleVideoPlayingView, 
    showFailToast, toggleLyricToolbar,
    showToast } = useAppCommonStore()
const { addRecentSong, addRecentRadio, addRecentPlaylist } = useUserProfileStore()
const { isStorePlayStateBeforeQuit, isStoreLocalMusicBeforeQuit, 
    theme, layout } = storeToRefs(useSettingStore())
const { getCurrentThemeHlColor } = useSettingStore()

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
        if(!Track.hasUrl(track)) { //VIP收费歌曲或其他
            if(queueTracksSize.value < 2 
                && !Playlist.isNormalRadioType(track)) { //非电台歌曲，且没有下一曲
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
        toastCnt = 0 //重置连跳计数
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

const traceRecentTrack = (track) => {
    const { platform } = track
    if(isLocalMusic(platform)) return
    if(Playlist.isFMRadioType(track)) {
        addRecentRadio(track)
    } else {
        addRecentSong(track)
    }
    EventBus.emit("userHome-refresh")
}

const setupRadioPlayer = () => {
    EventBus.emit('radio-init', document.querySelector('.audio-node'))
}

const retry = (track) => {
    if(!track) { //超出最大重试次数
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

//目前以加入当前播放列表为参考标准
const traceRecentPlaylist = (playlist) => {
    const { id, platform, title, cover, type } = playlist
    addRecentPlaylist(id, platform, title, cover, type)
}

const tryPlayPlaylist = async(playlist, text) => {
    try {
        playPlaylist(playlist, text)
    } catch(error) {
        console.log(error)
        showFailToast('网络异常！请稍候重试')
        return
    }
}

//播放歌单
const playPlaylist = async (playlist, text) => {
    const { id, platform } = playlist
    if(Playlist.isFMRadioType(playlist)) { //FM广播电台
        const track = playlist.data[0]
        addTrack(track)
        playTrack(track)
        if(text) showToast(text)
        return
    } else if(Playlist.isNormalRadioType(playlist)) { //歌单电台
        if(text) showToast(text) //提示前置，避免因网络卡顿导致用户多次请求
        playNextPlaylistRadioTrack(platform, id)
        return
    }
    let maxRetry = 3, retry = 0
    while(!playlist || playlist.data.length < 1) {
        if(++retry > maxRetry) return
        //重试一次加载数据
        const vendor = getVendor(platform)
        if(!vendor) return 
        playlist = await vendor.playlistDetail(id, 0, 1000, 1)
    }
    if(!playlist || playlist.data.length < 1) {
        showFailToast('网络异常！请稍候重试')
        return
    }
    //普通歌单
    resetQueue()
    addTracks(playlist.data)
    showToast(text || "即将为您播放全部！")
    traceRecentPlaylist(playlist)
    playNextTrack()
}

//播放电台
const playNextPlaylistRadioTrack = async (platform, channel, track) => {
    const needReset = !Track.hasId(track)
    let maxRetry = 3, retry = 0
    do {
        const result = await getVendor(platform).nextPlaylistRadioTrack(channel, track)
        if(!Track.hasId(result)) {
            ++retry
            continue
        }
        retry = 0
        if(needReset) resetQueue()
        addTrack(result)
        playTrack(result)
    } while(retry > 0 && retry < maxRetry)
}

//频谱
let cachedFreqData = null, spectrumColor = null, stroke = null
const drawSpectrum = (canvas, freqData, alignment) => {
    spectrumColor = getCurrentThemeHlColor()
    stroke = spectrumColor

    const dataLen = freqData.length
    const WIDTH = canvas.width, HEIGHT = canvas.height

    const canvasCtx = canvas.getContext("2d")
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT)

    canvasCtx.fillStyle = 'transparent'
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT)

    if(!freqData || freqData.length < 1) return 
    let barWidth = 1/2,barHeight, x = 2, spacing = 3
    //barWidth = (WIDTH / (dataLen * 3))

    for(var i = 0; i < dataLen; i++) {
        //if( (x + barWidth + spacing) >= WIDTH) break

        barHeight = freqData[i]/ 255 * HEIGHT 
        barHeight = barHeight > 0 ? barHeight : 1

        canvasCtx.fillStyle = spectrumColor
        canvasCtx.strokeStyle = stroke
        canvasCtx.shadowBlur = stroke
        canvasCtx.shadowColor = stroke

        //roundedRect(canvasCtx, x, HEIGHT - barHeight, barWidth, barHeight, 5)
        let y = (HEIGHT - barHeight) //alignment => bottom
        if(alignment == 'top') y = 0
        else if(alignment == 'center') y = (HEIGHT - barHeight)/2

        canvasCtx.fillRect(x, y, barWidth, barHeight)
        if(barHeight > 0) canvasCtx.strokeRect(x, y, barWidth, barHeight)
        
        x += barWidth + spacing
    }
}

const drawGridSpectrum = (canvas, freqData, alignment) => {
    spectrumColor = getCurrentThemeHlColor()
    stroke = spectrumColor
    const WIDTH = canvas.width, HEIGHT = canvas.height
    const canvasCtx = canvas.getContext("2d")

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT)

    canvasCtx.fillStyle = 'transparent'
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT)

    if(!freqData || freqData.length < 1) return 
    let barWidth = 6, barHeight, cellHeight = 2, x = 2, hspacing = 2, vspacing = 1

    for(var i = 0; i < 100; i++) {
        if( (x + barWidth + hspacing) >= WIDTH) break

        barHeight = freqData[i]/ 255 * HEIGHT 
        barHeight = barHeight > 0 ? barHeight : cellHeight
        const cellSize = Math.floor(barHeight / (cellHeight + vspacing))
        
        canvasCtx.fillStyle = spectrumColor
        canvasCtx.strokeStyle = stroke
        canvasCtx.shadowBlur = stroke
        canvasCtx.shadowColor = stroke

        for(var j = 0; j < cellSize; j++) {
            const barHeight = j * (cellHeight + vspacing)
            let y = HEIGHT - barHeight //alignment => bottom
            if(alignment == 'top') y = barHeight 
            else if(alignment == 'center') y = y/2

            canvasCtx.fillRect(x, y, barWidth, cellHeight)
            //canvasCtx.strokeRect(x, y, barWidth, cellHeight)
        }
        
        x += barWidth + hspacing
    }
}

const drawCanvasSpectrum = () => {
    const canvas = document.querySelector(".spectrum-canvas")
    if(!canvas) return
    const index = spectrumIndex.value
    let alignment = 'bottom'
    switch(index) {
        case 1:
        case 3:
            drawGridSpectrum(canvas, cachedFreqData, alignment)
            break
        case 2:
            alignment = 'center'
        default:
            drawSpectrum(canvas, cachedFreqData, alignment)
            break
    }
}


//FM广播
EventBus.on('radio-play', track => traceRecentTrack(track))
EventBus.on('radio-state', state => setPlaying(state))
//普通歌曲
EventBus.on('track-changed', track => {
    traceRecentTrack(track)
    bootstrapTrack(track, track => {
        playTrack(track)
        loadLyric(track)
    })
})
EventBus.on('track-restoreInit', track => {
    traceRecentTrack(track)
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
//歌单电台
EventBus.on('track-nextPlaylistRadioTrack', track => 
    playNextPlaylistRadioTrack(track.platform, track.channel, track))
EventBus.on('track-playMv', track => {
    if(!Track.hasMv(track)) return
    const { platform, mv } = track
    getVideoDetail(platform, mv).then(result => {
        if(playing.value) togglePlay()
        toggleVideoPlayingView()
        EventBus.emit('video-play', result)
        traceRecentTrack(track)
    }, reason => showFailToast('当前MV无法播放！'))
})

EventBus.on("track-freqUnit8Data", freqData => {
    cachedFreqData = freqData
    if(playingViewThemeIndex.value != 1 && layout.value.index != 2) return
    drawCanvasSpectrum()
})

//歌单
EventBus.on('playlist-play', item => {
    const { playlist, text } = item
    tryPlayPlaylist(playlist, text)
})

const restoreTrack = () => {
    EventBus.emit("track-restoreInit", currentTrack.value)
}

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
    setupRadioPlayer()
    restoreTrack()
})

//TODO
watch(theme, () => {
    if(playing.value || (playingViewThemeIndex.value != 1 
            && layout.value.index != 2)) {
        return
    }
    drawCanvasSpectrum()
}, { deep: true })
</script>

<template>
    <!-- FM广播audio -->
    <audio class="audio-node" crossOrigin="anonymous"></audio>
    <slot></slot>
</template>
<style>
.radio-holder {
  visibility: hidden;
}
</style>