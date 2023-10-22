<script setup>
import { inject, provide, onMounted, watch, ref, computed, toRaw } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlayStore } from './store/playStore';
import { useAppCommonStore } from './store/appCommonStore';
import { usePlatformStore } from './store/platformStore';;
import { useUserProfileStore } from './store/userProfileStore';
import { useRecentsStore } from './store/recentsStore';
import { useSettingStore } from './store/settingStore';
import EventBus from '../common/EventBus';
import { Track } from '../common/Track'
import { coverDefault, isBlank, isDevEnv, toTrimString, useIpcRenderer } from '../common/Utils';
import { PLAY_STATE, TRAY_ACTION, IMAGE_PROTOCAL } from '../common/Constants';
import { Playlist } from '../common/Playlist';
import { toMmss } from '../common/Times';
import { Lyric } from '../common/Lyric';
import { United } from '../vendor/united';
import { useVideoPlayStore } from './store/videoPlayStore';




const ipcRenderer = useIpcRenderer()

const { currentTrack, queueTracksSize,
    playingIndex, playing } = storeToRefs(usePlayStore())
const { playTrack, playNextTrack,
    setAutoPlaying, playPrevTrack,
    togglePlay, switchPlayMode,
    toggleVolumeMute, updateVolumeByOffset,
    setPlaying, resetQueue, addTracks,
    addTrack, playTrackDirectly,
    isCurrentTrack, isPlaying,
    setAudioOutputDevices, playTrackLater } = usePlayStore()
const { getVendor, isLocalMusic,
    isRadioCN, isXimalaya, isFreeFM } = usePlatformStore()
const { playingViewShow, videoPlayingViewShow,
    playingViewThemeIndex, spectrumIndex, } = storeToRefs(useAppCommonStore())
const { togglePlaybackQueueView, toggleVideoPlayingView,
    showFailToast, toggleLyricToolbar,
    showToast, isCurrentTraceId,
    setDesktopLyricShow, setCurrentTraceId } = useAppCommonStore()
const { addFavoriteTrack, removeFavoriteSong,
    isFavoriteSong, addFavoriteRadio,
    removeFavoriteRadio, isFavoriteRadio } = useUserProfileStore()
const { theme, layout, isStoreRecentPlay,
    isSimpleLayout, isVipTransferEnable,
    isResumePlayAfterVideoEnable, isPauseOnPlayingVideoEnable,
    selectedAudioOutputDeviceId, } = storeToRefs(useSettingStore())
const { getCurrentThemeHighlightColor, setupStateRefreshFrequency,
    setupSpectrumRefreshFrequency, setupTray,
    syncSettingFromDesktopLyric, getCurrentTheme,
    setAudioOutputDeviceId, setupAudioOutputDevice } = useSettingStore()
const { addRecentSong, addRecentRadio,
    addRecentPlaylist, addRecentAlbum } = useRecentsStore()
const { playVideoNow } = useVideoPlayStore()
const { currentVideo } = storeToRefs(useVideoPlayStore())


const { visitHome, visitUserHome, visitSetting } = inject('appRoute')

const playState = ref(PLAY_STATE.NONE)
const setPlayState = (value) => playState.value = value
const pendingPlay = ref(false)
const setPendingPlay = (value) => pendingPlay.value = value
let desktopLyricShowState = false, trackRetry = 0
const TRACK_MAX_RETRY = 1

/* 记录最近播放 */
//歌曲、电台、MV、视频
const traceRecentTrack = (track) => {
    if (!isStoreRecentPlay.value) return
    const { platform } = track
    if (isLocalMusic(platform)) return
    if (Playlist.isFMRadioType(track)) {
        addRecentRadio(track)
    } else if (Playlist.isVideoType(track)) {
        //TODO 纯MV、或纯视频，暂时不记录
    } else { //歌曲、MV关联的歌曲
        addRecentSong(track)
    }
    EventBus.emit("userHome-refresh")
}

//歌单
const traceRecentPlaylist = (playlist) => {
    if (!isStoreRecentPlay.value) return
    if (Playlist.isCustomType(playlist)) return
    if (Playlist.isFMRadioType(playlist)) return
    const { id, platform, title, cover, type } = playlist
    if (isLocalMusic(platform)) return
    addRecentPlaylist(id, platform, title, cover, type)
}

//专辑
const traceRecentAlbum = (album) => {
    if (!isStoreRecentPlay.value) return
    const { id, platform, title, cover, publishTime } = album
    if (isLocalMusic(platform)) return
    addRecentAlbum(id, platform, title, cover, publishTime)
}


/* 歌词获取 */
const loadLyric = (track) => {
    if (!track) {
        if (isCurrentTrack(track)) EventBus.emit('track-noLyric', track)
        return
    }
    if (!isCurrentTrack(track)) return
    if (Track.hasLyric(track)) {
        if (isCurrentTrack(track)) EventBus.emit('track-lyricLoaded', track)
        return
    }
    //检查有效性
    const platform = track.platform
    const vendor = getVendor(platform)
    if (!vendor || !vendor.lyric
        || Playlist.isAnchorRadioType(track)) {
        if (isCurrentTrack(track)) EventBus.emit('track-noLyric', track)
        return
    }
    //获取歌词
    vendor.lyric(track.id, track).then(result => {
        //再次确认，可能歌曲已经被切走
        if (isCurrentTrack(track)) updateLyric(track, result)
    })
}

const updateLyric = (track, { lyric, roma, trans }) => {
    if (track || Lyric.hasData(lyric)) Object.assign(track, { lyric })
    if (track || Lyric.hasData(roma)) Object.assign(track, { lyricRoma: roma })
    if (track || Lyric.hasData(trans)) Object.assign(track, { lyricTrans: trans })
    EventBus.emit('track-lyricLoaded', track)
}


//处理不可播放歌曲
const AUTO_PLAY_NEXT_MSG = '当前歌曲无法播放<br>即将为您播放下一曲'
const NO_NEXT_MSG = '当前歌曲无法播放<br>列表无可播放歌曲'
const OVERTRY_MSG = '尝试播放次数太多<br>请手动播放其他歌曲吧'
const TRY_TRANSFRER_MSG = '当前歌曲无法播放<br>即将尝试切换其他版本'
const TRANSFRER_OK_MSG = '版本切换已完成<br>即将为您播放歌曲'
const TRANSFRER_FAIL_MSG = '没有其他版本切换<br>即将为您播放下一曲'

//连跳计数器
let autoSkipCnt = 0
//重置连跳计数
const resetAutoSkip = () => autoSkipCnt = 0


//提示并播放下一曲
const toastAndPlayNext = (track, msg) => {
    //前提条件：必须是当前歌曲
    if (isCurrentTrack(track)) {
        showFailToast(msg || AUTO_PLAY_NEXT_MSG, () => {
            if (isCurrentTrack(track)) playNextTrack()
        })
    }
}

//用户手动干预，即主动点击上/下一曲时，产生体验上的Bug
//目前实现方式已稍作处理
const handleUnplayableTrack = (track, msg) => {
    ++autoSkipCnt
    const queueSize = queueTracksSize.value
    if (Playlist.isNormalRadioType(track)) { //普通歌单电台
        toastAndPlayNext(track, msg)
        return
    } else if (autoSkipCnt >= queueSize) { //非电台歌曲，且没有下一曲
        resetPlayState()
        resetAutoSkip()
        showFailToast(NO_NEXT_MSG)
        return
    }
    //普通歌曲
    //频繁切换下一曲，体验不好，对音乐平台也不友好
    if (autoSkipCnt <= 10) {
        toastAndPlayNext(track, msg)
        return
    }
    resetPlayState()
    //10连跳啦，暂停一下吧
    resetAutoSkip()
    showFailToast(OVERTRY_MSG)
}

//获取和设置歌曲播放信息
const bootstrapTrack = (track) => {
    return new Promise(async (resolve, reject) => {
        if (!track) {
            return reject('none')
        }
        //FM电台
        if (Playlist.isFMRadioType(track) && Track.hasUrl(track)) {
            return resolve(track)
        }
        const { id, platform, artistNotCompleted } = track
        //平台服务
        const vendor = getVendor(platform)
        if (!vendor || !vendor.playDetail) {
            return reject('noService')
        }
        //播放相关数据
        const result = await vendor.playDetail(id, track)
        if (!result) return reject('noUrl')
        const { lyric, cover, artist, url } = result
        //覆盖设置url，音乐平台可能有失效机制，即url只在允许的时间内有效，而非永久性url
        if (Track.hasUrl(result)) Object.assign(track, { url })
        //无法获取到有效url，VIP收费歌曲或其他
        if (!Track.hasUrl(track)) return reject('noUrl')
        setAutoPlaying(false)
        //设置歌词
        if (Track.hasLyric(result)) {
            updateLyric(track, { lyric })
        }
        //设置封面
        if (Track.hasCover(result)) Object.assign(track, { cover })
        //设置歌手信息
        //TODO 部分音乐平台artist信息无法在同一API中完整获取
        if (artistNotCompleted && artist) {
            Object.assign(track, { artist })
            EventBus.emit('track-artistUpdated', { trackId: id, artist })
        }
        resolve(track)
    })
}

//添加到播放列表，并开始播放
const addAndPlayTracks = (tracks, needReset, text, traceId) => {
    if (!tracks || !Array.isArray(tracks) || tracks.length < 1) return
    if (traceId && !isCurrentTraceId(traceId)) return

    if (needReset) resetQueue()
    showToast(text || '即将为您播放全部')
    addTracks(tracks)
    if (needReset) {
        playNextTrack()
    } else {
        playTrack(tracks[0])
    }
}

//重试次数
const isTrackOverretry = () => (trackRetry >= TRACK_MAX_RETRY)
const resetTrackRetry = () => trackRetry = 0
const increaseTrackRetry = () => ++trackRetry

//播放错误时重试
const onPlayerErrorRetry = ({ track, currentTime, radio }) => {
    if (isDevEnv()) console.log({ track, currentTime, radio })
    if (!track) return

    const { platform, duration } = track
    //本地歌曲，偶尔也会播放失败
    if (isLocalMusic(platform) || isFreeFM(platform)) {
        return handleUnplayableTrack(track)
    }
    //尝试继续播放
    if (isTrackOverretry()) {
        //超出最大重试次数
        return handleUnplayableTrack(track)
    } else { //普通歌曲、广播电台
        increaseTrackRetry()

        if (duration > 0 && !radio) { //TODO 尝试恢复播放进度
            const percent = currentTime / duration
            markTrackSeekPending(percent)
        }
        //再次检查确认，避免被强行重置url，导致数据异常无法播放
        if (isLocalMusic(platform) || isFreeFM(platform)) return

        //强行重置url，并尝试重新获取
        if (!radio || isRadioCN(platform) || isXimalaya(platform)) track.url = ''
        if (!radio) track.isCandidate = false
        EventBus.emit('track-changed', track)
    }
}

/* 播放歌单 */
const playPlaylist = async (playlist, text, traceId) => {
    if (!traceId) setCurrentTraceId(null)

    try {
        doPlayPlaylist(playlist, text, traceId)
    } catch (error) {
        if (isDevEnv) console.log(error)
        if (traceId && !isCurrentTraceId(traceId)) return
        showFailToast('网络异常！请稍候重试')
    }
}

//获取歌单歌曲数据
const loadPlaylist = async (playlist, text, traceId) => {
    const { id, platform } = playlist
    if (Playlist.isNormalType(playlist)
        || Playlist.isAnchorRadioType(playlist)) {
        let maxRetry = 3, retry = 0
        while (!playlist.data || playlist.data.length < 1) {
            if (traceId && !isCurrentTraceId(traceId)) return

            if (++retry > maxRetry) break
            //重试一次加载数据
            const vendor = getVendor(platform)
            if (!vendor || !vendor.playlistDetail) break
            //TODO 暂时限制为1000首歌曲，当前播放列表太长容易卡顿
            playlist = await vendor.playlistDetail(id, 0, 1000, 1)
        }
    }
    return playlist
}

//添加歌单到当前播放
const addPlaylistToQueue = async (playlist, text, traceId, limit) => {
    if (traceId && !isCurrentTraceId(traceId)) return

    playlist = await loadPlaylist(playlist, text, traceId)
    if (!playlist.data || playlist.data.length < 1) {
        const failMsg = Playlist.isCustomType(playlist) ? '歌单里还没有歌曲'
            : '网络异常！请稍候重试'
        if (traceId && !isCurrentTraceId(traceId)) return
        return showFailToast(failMsg)
    }

    if (traceId && !isCurrentTraceId(traceId)) return
    /*
    const total = playlist.data.length
    limit = limit || total
    if (total > limit) {
        showFailToast('添加到当前播放失败！<br>歌单歌曲数量超过限制')
        return
    }
    */
    traceRecentPlaylist(playlist)
    addTracks(playlist.data)
    if (text) showToast(text)
    return playlist
}

//播放歌单
const doPlayPlaylist = async (playlist, text, traceId) => {
    if (traceId && !isCurrentTraceId(traceId)) return

    const { id, platform } = playlist
    if (Playlist.isFMRadioType(playlist)) { //FM广播电台
        showToast(text || '即将为您收听电台')
        const track = playlist.data ? playlist.data[0] : playlist
        playTrack(track)
        return
    } else if (Playlist.isNormalRadioType(playlist)) { //歌单电台
        //提示前置，避免因网络卡顿导致用户多次请求
        showToast(text || '即将为您播放电台')
        playNextPlaylistRadioTrack(platform, id, null, traceId)
        return
    } else if (Playlist.isVideoType(playlist)) { //视频
        showToast(text || '即将为您播放视频', () => {
            playMv({ ...playlist, mv: playlist.vid }, '当前视频无法播放')
        }, 666)
        return
    } else if (Playlist.isNormalType(playlist)
        || Playlist.isAnchorRadioType(playlist)) {
        playlist = await loadPlaylist(playlist, text, traceId)
    }
    //检查数据，再次确认
    if (!playlist.data || playlist.data.length < 1) {
        const failMsg = Playlist.isCustomType(playlist) ? '歌单里还没有歌曲'
            : '网络异常！请稍候重试'
        if (traceId && !isCurrentTraceId(traceId)) return
        showFailToast(failMsg)
        return
    }

    if (traceId && !isCurrentTraceId(traceId)) return

    //可播放状态, 记录到最近播放，并开始播放
    traceRecentPlaylist(playlist)
    addAndPlayTracks(playlist.data, true, text || '即将为您播放歌单', traceId)
}

//添加FM广播电台到当前播放
const addFmRadioToQueue = async (playlist, text, traceId) => {
    if (traceId && !isCurrentTraceId(traceId)) return

    if (Playlist.isFMRadioType(playlist)) { //FM广播电台
        const track = playlist.data ? playlist.data[0] : playlist
        addTrack(track)
        traceRecentPlaylist(playlist)
        if (text) showToast(text)
    }
}

//播放电台
const playNextPlaylistRadioTrack = async (platform, channel, track, traceId) => {
    if (traceId && !isCurrentTraceId(traceId)) return

    const vendor = getVendor(platform)
    if (!vendor || !vendor.nextPlaylistRadioTrack) {
        showFailToast('服务异常！请稍候重试')
        return
    }
    const needReset = !Track.hasId(track)
    let maxRetry = 3, retry = 0, success = false
    do {
        if (traceId && !isCurrentTraceId(traceId)) return

        const result = await vendor.nextPlaylistRadioTrack(channel, track)
        if (!Track.hasId(result)) {
            ++retry
            continue
        }
        if (needReset) resetQueue()
        addTrack(result)
        playTrack(result)
        success = true
        break
    } while (retry > 0 && retry < maxRetry)

    if (!success) {
        if (traceId && !isCurrentTraceId(traceId)) return
        showFailToast('网络异常！请稍候重试')
    }
}

//播放专辑
const playAlbum = (album, text, traceId) => {
    if (!traceId) setCurrentTraceId(null)

    try {
        doPlayAlbum(album, text, traceId)
    } catch (error) {
        if (isDevEnv()) console.log(error)
        if (traceId && !isCurrentTraceId(traceId)) return
        showFailToast('网络异常！请稍候重试')
    }
}

//获取专辑歌曲数据
const loadAlbum = async (album, text, traceId) => {
    if (traceId && !isCurrentTraceId(traceId)) return

    const { id, platform } = album
    let maxRetry = 3, retry = 0
    while (!album.data || album.data.length < 1) {
        if (traceId && !isCurrentTraceId(traceId)) return

        if (++retry > maxRetry) return
        //重试一次加载数据
        const vendor = getVendor(platform)
        if (!vendor || !vendor.albumDetail) return
        album = await vendor.albumDetail(id)
        if ((!album.data || album.data.length < 1) && vendor.albumDetailAllSongs) {
            const result = await vendor.albumDetailAllSongs(id, 0, 100)
            if (result.data && result.data.length > 0) {
                album.data.push(...result.data)
            }
        }
    }
    return album
}

//添加专辑到当前播放
const addAlbumToQueue = async (album, text, traceId) => {
    if (traceId && !isCurrentTraceId(traceId)) return

    album = await loadAlbum(album, text, traceId)
    if (!album || !album.data || album.data.length < 1) {
        if (traceId && !isCurrentTraceId(traceId)) return
        showFailToast('网络异常！请稍候重试')
        return
    }

    if (traceId && !isCurrentTraceId(traceId)) return
    traceRecentPlaylist(album)
    addTracks(album.data)
    if (text) showToast(text)
    return album
}

//播放专辑
const doPlayAlbum = async (album, text, traceId) => {
    if (traceId && !isCurrentTraceId(traceId)) return

    album = await loadAlbum(album, text, traceId)
    if (!album || !album.data || album.data.length < 1) {
        if (traceId && !isCurrentTraceId(traceId)) return
        showFailToast('网络异常！请稍候重试')
        return
    }

    if (traceId && !isCurrentTraceId(traceId)) return
    traceRecentAlbum(album)
    addAndPlayTracks(album.data, true, text || '即将为您播放专辑')
}



/* 频谱 */
let cachedSpectrumFreqData = null, spectrumColor = null, stroke = null
const drawSpectrum = (canvas, freqData, alignment) => {
    //TODO
    spectrumColor = getCurrentThemeHighlightColor()
    stroke = spectrumColor

    const dataLen = freqData.length
    const WIDTH = canvas.width, HEIGHT = canvas.height

    const canvasCtx = canvas.getContext("2d")
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT)

    canvasCtx.fillStyle = 'transparent'
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT)

    if (!freqData || freqData.length < 1) return
    let barWidth = 1 / 2, barHeight, x = 2, spacing = 3
    //barWidth = (WIDTH / (dataLen * 3))

    for (var i = 0; i < dataLen; i++) {
        //if( (x + barWidth + spacing) >= WIDTH) break

        barHeight = freqData[i] / 255 * HEIGHT
        barHeight = barHeight > 0 ? barHeight : 1

        canvasCtx.fillStyle = spectrumColor
        canvasCtx.strokeStyle = stroke
        canvasCtx.shadowBlur = stroke
        canvasCtx.shadowColor = stroke

        //roundedRect(canvasCtx, x, HEIGHT - barHeight, barWidth, barHeight, 5)
        let y = (HEIGHT - barHeight) //alignment => bottom
        if (alignment == 'top') y = 0
        else if (alignment == 'center') y = (HEIGHT - barHeight) / 2

        canvasCtx.fillRect(x, y, barWidth, barHeight)
        if (barHeight > 0) canvasCtx.strokeRect(x, y, barWidth, barHeight)

        x += barWidth + spacing
    }
}

const drawGridSpectrum = (canvas, freqData, alignment) => {
    spectrumColor = getCurrentThemeHighlightColor()
    stroke = spectrumColor
    const WIDTH = canvas.width, HEIGHT = canvas.height
    const canvasCtx = canvas.getContext("2d")

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT)

    canvasCtx.fillStyle = 'transparent'
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT)

    if (!freqData || freqData.length < 1) return
    let barWidth = 6, barHeight, cellHeight = 2, x = 2, hspacing = 2, vspacing = 1

    for (var i = 0; i < 100; i++) {
        if ((x + barWidth + hspacing) >= WIDTH) break

        barHeight = freqData[i] / 255 * HEIGHT
        barHeight = barHeight > 0 ? barHeight : cellHeight
        const cellSize = Math.floor(barHeight / (cellHeight + vspacing))

        canvasCtx.fillStyle = spectrumColor
        canvasCtx.strokeStyle = stroke
        canvasCtx.shadowBlur = stroke
        canvasCtx.shadowColor = stroke

        for (var j = 0; j < cellSize; j++) {
            const barHeight = j * (cellHeight + vspacing)
            let y = HEIGHT - barHeight //alignment => bottom
            if (alignment == 'top') y = barHeight
            else if (alignment == 'center') y = y / 2

            canvasCtx.fillRect(x, y, barWidth, cellHeight)
            //canvasCtx.strokeRect(x, y, barWidth, cellHeight)
        }

        x += barWidth + hspacing
    }
}

const drawCanvasSpectrum = () => {
    const canvas = document.querySelector(".spectrum-canvas")
    if (!canvas) return
    const index = spectrumIndex.value
    let alignment = 'bottom'
    switch (index) {
        case 1:
        case 3:
            drawGridSpectrum(canvas, cachedSpectrumFreqData, alignment)
            break
        case 2:
            alignment = 'center'
        default:
            drawSpectrum(canvas, cachedSpectrumFreqData, alignment)
            break
    }
}

//获取视频信息 
const getVideoDetail = (id, platform) => {
    return new Promise((resolve, reject) => {
        if (!platform) return reject('noService')
        const vendor = getVendor(platform)
        if (!vendor || !vendor.videoDetail) {
            return reject('noService')
        }
        const quality = null
        vendor.videoDetail(id, quality).then(result => {
            if (!result || isBlank(result.url)) {
                return reject('noUrl')
            }
            resolve(result)
        })
    })
}

const setupCurrentMediaSession = async () => {
    if ("mediaSession" in navigator) {
        const track = currentVideo.value || currentTrack.value
        if (!track) return
        const { title, cover } = track
        //TODO 本地歌曲可能使用在线封面，会导致数据不一致
        // 暂时忽略，仍然使用旧封面，不去尝试进行更新，得不偿失
        let coverSrc = cover
        if (cover && cover.startsWith(IMAGE_PROTOCAL.prefix)) {
            if (ipcRenderer) coverSrc = await ipcRenderer.invoke('open-image-base64', cover)
        }
        navigator.mediaSession.metadata = new MediaMetadata({
            title,
            artist: Track.artistName(track),
            album: Track.albumName(track),
            artwork: [{
                src: coverDefault(coverSrc),
                sizes: "500x500",
                type: "image/png",
            }]
        })

        navigator.mediaSession.setActionHandler("previoustrack", playPrevTrack)
        navigator.mediaSession.setActionHandler("nexttrack", playNextTrack)
    }
}

/* EventBus事件 */
//FM广播
EventBus.on('radio-play', traceRecentTrack)
EventBus.on('radio-state', ({ state, track, currentTime, radio }) => {
    checkFavoritedState()

    switch (state) {
        case PLAY_STATE.PLAYING:
            setPlaying(true)
            setupCurrentMediaSession()
            break
        case PLAY_STATE.PAUSE:
            setPlaying(false)
            break
        case PLAY_STATE.PLAY_ERROR:
            setPlaying(false)
            onPlayerErrorRetry({ track, currentTime, radio })
            break
        default:
            break
    }

})
//普通歌曲
EventBus.on('track-changed', track => {
    bootstrapTrack(track).then(track => {
        if (isCurrentTrack(track)) {
            playTrackDirectly(track)
        }
    }, async (reason) => {
        if (reason == 'noUrl') { //TODO
            if (!isVipTransferEnable.value || isLocalMusic(track.platform)
                || Playlist.isFMRadioType(track)) {
                handleUnplayableTrack(track)
                return
            }
            showFailToast(TRY_TRANSFRER_MSG)
            const candidate = await United.transferTrack(track)
            if (!Track.hasUrl(candidate)) {
                handleUnplayableTrack(track, TRANSFRER_FAIL_MSG)
                return
            }
            if (!isCurrentTrack(track)) return
            if (isDevEnv()) console.log(candidate)
            const { url, lyric, lyricTrans, lyricRoma, duration, isCandidate } = candidate
            Object.assign(track, { url, lyric, lyricTrans, lyricRoma, duration, isCandidate })
            showToast(TRANSFRER_OK_MSG, () => {
                if (isCurrentTrack(track)) {
                    loadLyric(track)
                    playTrackDirectly(track)
                }
            })
        }
    })
})
EventBus.on('track-play', track => {
    //resetAutoSkip()
    traceRecentTrack(track)
    //loadLyric(track)
})

EventBus.on('track-error', onPlayerErrorRetry)
EventBus.on('track-state', ({ state, track, currentTime }) => {
    //播放刚开始时，更新MediaSession
    if (playState.value == PLAY_STATE.INIT && state == PLAY_STATE.PLAYING) {
        setupCurrentMediaSession()
        resetAutoSkip()
    }

    setPlayState(state)
    switch (state) {
        case PLAY_STATE.INIT:
            resetPlayState(true)
            checkFavoritedState()
            break
        case PLAY_STATE.PLAYING:
            setPlaying(true)
            break
        case PLAY_STATE.PAUSE:
            setPlaying(false)
            break
        case PLAY_STATE.END:
            playNextTrack()
            break
        case PLAY_STATE.LOAD_ERROR:
        case PLAY_STATE.PLAY_ERROR:
            setPlaying(false)
            onPlayerErrorRetry({ track, currentTime })
            break
        default:
            break
    }
})
//播放进度
const mmssCurrentTime = ref('00:00')
const mmssPreseekTime = ref(null) //格式: 00:00
const currentTimeState = ref(0) //单位: 秒
const progressState = ref(0)

const resetPlayState = (ignore) => {
    currentTimeState.value = 0
    mmssCurrentTime.value = '00:00'
    mmssPreseekTime.value = null
    progressState.value = 0
    if (!ignore) setPlayState(PLAY_STATE.NONE)

    setProgressSeekingState(false)
}

EventBus.on('track-pos', secs => {
    if (videoPlayingViewShow.value && isPlaying()
        && isPauseOnPlayingVideoEnable.value) {
        togglePlay()
        return
    }
    const track = currentTrack.value
    const currentTime = secs * 1000
    mmssCurrentTime.value = toMmss(currentTime)
    currentTimeState.value = secs
    const duration = track.duration || 0
    progressState.value = duration > 0 ? (currentTime / duration) : 0
})

EventBus.on("track-spectrumData", freqData => {
    cachedSpectrumFreqData = freqData
    //简约布局、可视化播放页
    if (isSimpleLayout.value || (playingViewShow.value && playingViewThemeIndex.value == 1)) {
        drawCanvasSpectrum()
    }
})

//歌单电台 - 下一曲
EventBus.on('track-nextPlaylistRadioTrack', track => {
    playNextPlaylistRadioTrack(track.platform, track.channel, track)
})


//播放进度
const progressSeekingState = ref(false)
const setProgressSeekingState = (value) => progressSeekingState.value = value

const seekTrack = (percent) => {
    //清除预备状态
    mmssPreseekTime.value = null

    if (isPlaying()) {
        seekTrackDirectly(percent)
    } else { //非播放状态
        markTrackSeekPending(percent)
        //播放歌曲
        if (playState.value == PLAY_STATE.PAUSE) {
            togglePlay()
        } else {
            playTrackDirectly(currentTrack.value)
        }
    }
    setProgressSeekingState(false)
    //setTimeout(() => seekTrackDirectly(percent), delay)
}

const seekTrackDirectly = (percent) => EventBus.emit('track-seek', percent)
const markTrackSeekPending = (percent) => EventBus.emit('track-markSeekPending', percent)
EventBus.on('track-seekFinish', () => {
    //清除预备状态
    mmssPreseekTime.value = null
    setProgressSeekingState(false)
})

//播放进度，更新预备状态
const preseekTrack = (percent) => {
    const track = currentTrack.value
    if (!track) return
    const duration = track ? track.duration : 0
    if (duration <= 0) return
    mmssPreseekTime.value = toMmss(duration * percent)
    setProgressSeekingState(true)
}

const isTrackSeekable = computed(() => {
    return playing.value && !Playlist.isFMRadioType(currentTrack.value)
})

//播放MV
const playMv = (video, failText) => {
    const { platform, mv } = video
    if (!mv || !platform) return
    getVideoDetail(mv, platform).then(result => {
        playVideo({ ...video, ...result })
        traceRecentTrack(video)
    }, reason => showFailToast(failText || '当前MV无法播放'))
}

//video => { title, cover, url }
const playVideo = async (video) => {
    try {
        //是否需要暂停音频播放并挂起
        const playing = isPlaying()
        const pending = playing && isPauseOnPlayingVideoEnable.value
        if (pending) togglePlay()
        setPendingPlay(pending)

        //开始播放视频
        if (!videoPlayingViewShow.value) toggleVideoPlayingView()
        playVideoNow(video)
        setupCurrentMediaSession()
    } catch (error) {
        showFailToast('当前视频无法播放')
    }
}

const resumeTrackPendingPlay = () => {
    if (isResumePlayAfterVideoEnable.value
        && !isPlaying.value && pendingPlay.value) {
        togglePlay()
        setPendingPlay(false)
    }
}

EventBus.on('video-stop', resumeTrackPendingPlay)

//应用启动时，恢复歌曲信息
const restoreTrack = (callback) => {
    bootstrapTrack(currentTrack.value, true).then(track => {
        EventBus.emit("track-restore", track)
        if (callback && typeof (callback) == 'function') callback()
    }).catch(error => {
        if (isDevEnv()) console.log(error)
        if (callback && typeof (callback) == 'function') callback()
    })
}

//歌曲收藏
const favoritedState = ref(false)
const setFavoritedState = (value) => favoritedState.value = value

const toggleFavoritedState = () => {
    if (playingIndex.value < 0) {
        setFavoritedState(false)
        return
    }
    const track = currentTrack.value
    if (!track) return
    const { id, platform } = track
    if (isLocalMusic(platform)) {
        return
    }
    setFavoritedState(!favoritedState.value)
    const isFMRadioType = Playlist.isFMRadioType(track)
    let text = "歌曲收藏成功"
    if (favoritedState.value) {
        if (isFMRadioType) {
            addFavoriteRadio(track)
            text = "FM电台收藏成功"
        } else {
            addFavoriteTrack(track)
        }
    } else {
        text = "歌曲已取消收藏"
        if (isFMRadioType) {
            text = "FM电台已取消收藏"
            removeFavoriteRadio(id, platform)
        } else {
            removeFavoriteSong(id, platform)
        }
    }
    showToast(text)
}

const checkFavoritedState = () => {
    const track = currentTrack.value
    if (!track) {
        setFavoritedState(false)
        return
    }
    const { id, platform } = track
    const favorited = isFavoriteSong(id, platform) || isFavoriteRadio(id, platform)
    setFavoritedState(favorited)
}
//TODO 
EventBus.on("userProfile-reset", checkFavoritedState)
EventBus.on("track-refreshFavoritedState", checkFavoritedState)

//注册ipcRenderer消息监听器
const registryIpcRendererListeners = () => {
    if (!ipcRenderer) return
    //Tray事件
    ipcRenderer.on("tray-action", (event, action) => {
        //TODO 视频播放中，暂时不允许中断
        if (videoPlayingViewShow.value) return
        switch (action) {
            case TRAY_ACTION.RESTORE:
                setupTray()
                break
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
                setupTray()
                break
            case TRAY_ACTION.USERHOME:
                visitUserHome()
                setupTray()
                break
            case TRAY_ACTION.SETTING:
                visitSetting()
                setupTray()
                break
            case TRAY_ACTION.DESKTOP_LYRIC_OPEN:
                setDesktopLyricShow(true, true)
                break
            case TRAY_ACTION.DESKTOP_LYRIC_CLOSE:
                setDesktopLyricShow(false, true)
                break
            case TRAY_ACTION.DESKTOP_LYRIC_LOCK:
            case TRAY_ACTION.DESKTOP_LYRIC_UNLOCK:
                postMessageToDesktopLryic('s-desktopLyric-lockState')
                break
            case TRAY_ACTION.DESKTOP_LYRIC_PIN:
            case TRAY_ACTION.DESKTOP_LYRIC_UNPIN:
                postMessageToDesktopLryic('s-desktopLyric-pinState')
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
        if (playingViewShow.value) toggleLyricToolbar()
    })

    //其他事件
    ipcRenderer.on('app-desktopLyric-showSate', (event, isShow) => {
        desktopLyricShowState = isShow
        EventBus.emit('desktopLyric-showState', desktopLyricShowState)
    })
    ipcRenderer.on('app-messagePort-channel', (event, channel) => {
        setupMessagePort(channel, () => {
            EventBus.emit('desktopLyric-messagePort', messagePort)
        })
        ipcRenderer.send('app-messagePort-pair')
    })
}
registryIpcRendererListeners()

const handleStartupPlay = () => {
    if (!ipcRenderer) return
    ipcRenderer.on('app-startup-playTracks', (event, tracks) => {
        if (!tracks || !Array.isArray(tracks) || tracks.length < 1) return
        //addAndPlayTracks(tracks, false, '即将为您播放歌曲')
        //紧跟在当前歌曲后面播放，不扰乱当前播放列表进度
        tracks.forEach(track => playTrackLater(track))
        playTrack(tracks[0])
        showToast('即将为您播放歌曲')
        ipcRenderer.send('app-startup-playDone', tracks)
    })

    ipcRenderer.send('app-startup-playReady')
}


let messagePort = null
const setupMessagePort = (channel, callback) => {
    if (!ipcRenderer) return
    ipcRenderer.on(channel, event => {
        messagePort = event.ports[0]

        messagePort.onmessage = (event) => {
            const { action, data } = event.data
            handleMessageFromDesktopLyric(action, data)
        }

        if (callback) callback()
    })
}


const postMessageToDesktopLryic = (action, data) => {
    if (!desktopLyricShowState) return
    if (messagePort) messagePort.postMessage({ action, data })
}

const handleMessageFromDesktopLyric = (action, data) => {
    if (action === 'c-setting-visit') {
        if (!ipcRenderer) return
        ipcRenderer.send('app-mainWin-show')
        visitSetting()
        ipcRenderer.invoke('find-in-page', '桌面歌词')
    } else if (action === 'c-setting-sync') {
        syncSettingFromDesktopLyric(data)
    } else if (action === 'c-track-seek') {
        seekTrack(data)
    } else if (action === 'c-track-togglePlay') {
        togglePlay()
    } else if (action === 'c-track-playPrev') {
        playPrevTrack()
    } else if (action === 'c-track-playNext') {
        playNextTrack()
    } else if (action === 'c-track-init-retry') {
        postMessageToDesktopLryic('s-track-init-retry', toRaw(currentTrack.value))
    } else if (messagePort.onPlayerMessage) { //必须放在最后
        messagePort.onPlayerMessage(action, data)
    }
}

EventBus.on('setting-syncToDesktopLyric', data => {
    postMessageToDesktopLryic('s-setting-sync', toRaw(data))
})

//设置音频输出设备
const setupOutputDevices = () => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
        const audioOutputDevices = devices.filter(device => (device.kind == 'audiooutput'))
        setAudioOutputDevices(audioOutputDevices)

        //检查并设置音频输出设备
        const index = audioOutputDevices.findIndex(item => (item.deviceId == selectedAudioOutputDeviceId.value))
        if (index < 0) setAudioOutputDeviceId(audioOutputDevices[0].deviceId)
        else setupAudioOutputDevice()
    })
}

onMounted(() => {
    setupStateRefreshFrequency()
    setupSpectrumRefreshFrequency()

    restoreTrack(handleStartupPlay)

    //setupOutputDevices()
})

watch(queueTracksSize, (nv, ov) => {
    if (nv < 1) {
        resetPlayState()
        setFavoritedState(false)
        EventBus.emit('playbackQueue-empty')
    }
})

watch(playing, (nv, ov) => {
    if (ipcRenderer) ipcRenderer.send('app-playState', nv)
})

/*
watch(desktopLyricShow, (nv, ov) => {
    if (ipcRenderer) ipcRenderer.send('app-desktopLyricOpenState', nv)
})
*/

//TODO
watch(theme, () => {
    if (!isPlaying() && (playingViewThemeIndex.value == 1
        || layout.value.index == 2)) {
        drawCanvasSpectrum()
    }
    postMessageToDesktopLryic('s-theme-apply', toRaw(getCurrentTheme()))
}, { deep: true })

/*
watch(videoPlayingViewShow, (nv, ov) => {
    if (!nv) resumeTrackPendingPlay()
})
*/

//TODO
watch(playingIndex, (nv, ov) => resetTrackRetry())

//播放器API
provide('player', {
    seekTrack,
    playPlaylist,
    addPlaylistToQueue,
    addFmRadioToQueue,
    playAlbum,
    addAlbumToQueue,
    playMv,
    playVideo,
    addAndPlayTracks,
    loadLyric,
    mmssCurrentTime,
    currentTimeState,
    progressState,
    playState,
    favoritedState,
    toggleFavoritedState,
    preseekTrack,
    mmssPreseekTime,
    isTrackSeekable,
    progressSeekingState,
})
</script>

<template>
    <slot></slot>
</template>

<style></style>