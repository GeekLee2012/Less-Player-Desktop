<script setup>
import { inject, provide, onMounted, watch, ref, computed, toRaw, nextTick, onDeactivated, onActivated, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlayStore } from './store/playStore';
import { useAppCommonStore } from './store/appCommonStore';
import { usePlatformStore } from './store/platformStore';;
import { useUserProfileStore } from './store/userProfileStore';
import { useRecentsStore } from './store/recentsStore';
import { useSettingStore } from './store/settingStore';
import { Track } from '../common/Track'
import { coverDefault, isBlank, isDevEnv, escapeHtml,
    useStartDrag, useDownloadsPath, 
    tryCall, toTrimString, useTrayAction,
    ipcRendererSend, ipcRendererInvoke, 
    onIpcRendererEvent, onIpcRendererEvents, toMmss, md5,
    isSupportedImage,
} from '../common/Utils';
import { PlayState, ImageProtocal, FILE_PREFIX, LESS_MAGIC_CODE } from '../common/Constants';
import { Playlist } from '../common/Playlist';
import { Lyric } from '../common/Lyric';
import { United } from '../vendor/united';
import { useVideoPlayStore } from './store/videoPlayStore';
import { useSoundEffectStore } from './store/soundEffectStore';
import { onEvents, emitEvents, offEvents } from '../common/EventBusWrapper';
import { Video } from '../common/Video';



const startDrag = useStartDrag()

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
const { getVendor, isLocalMusic, isFreeFM, isCloudStorage, isWebDav, isNavidrome, isJellyfin } = usePlatformStore()
const { playingViewShow, videoPlayingViewShow,
    playingViewThemeIndex, spectrumIndex,
    pendingPlay, pendingPlayPercent,
    exVisualCanvasShow, exVisualCanvasIndex,
    spectrumParams } = storeToRefs(useAppCommonStore())
const { togglePlaybackQueueView, toggleVideoPlayingView,
    showFailToast, toggleLyricToolbar,
    showToast, isCurrentTraceId,
    setDesktopLyricShow, setCurrentTraceId,
    setPendingPlay, setPendingPlayPercent,
    setSpectrumIndex, setSpectrumParams,
    setExVisualCanvasIndex, togglePlayingThemeListView,
    hideAllCtxMenus } = useAppCommonStore()
const { addFavoriteTrack, removeFavoriteSong,
    isFavoriteSong, addFavoriteRadio,
    removeFavoriteRadio, isFavoriteRadio } = useUserProfileStore()
const { theme, layout, isStoreRecentPlay,
    isSimpleLayout, isVipTransferEnable,
    isResumePlayAfterVideoEnable, isPauseOnPlayingVideoEnable,
    selectedAudioOutputDeviceId, isDndSaveEnable,
    isShowDialogBeforeClearPlaybackQueue, 
    isUseOnlineCoverEnable, isMiniLayout, } = storeToRefs(useSettingStore())
const { getCurrentThemeHighlightColor, setupStateRefreshFrequency,
    setupSpectrumRefreshFrequency, setupTray,
    syncSettingFromDesktopLyric, getCurrentTheme,
    setAudioOutputDeviceId, setupAudioOutputDevice,
    getDndSavePath, setDndSavePath,
    getCurrentThemeContentBgColor, switchToFallbackLayout, } = useSettingStore()
const { addRecentSong, addRecentRadio,
    addRecentPlaylist, addRecentAlbum } = useRecentsStore()
const { playVideoNow } = useVideoPlayStore()
const { currentVideo, playingIndex: videoPlayingIndex, currentVideoPlayingItem } = storeToRefs(useVideoPlayStore())
const { setupSoundEffect } = useSoundEffectStore()



const { visitHome, visitUserHome, visitSetting,
    visitModulesSetting, visitSearch,
    visitThemes, visitPlugins, visitRecents,
} = inject('appRoute')
const { hasExDrawSpectrumHandlers,drawExSpectrum, 
    toggleExVisualCanvas, showConfirm, } = inject('apiExpose')

const playState = ref(PlayState.NONE)
const setPlayState = (value) => playState.value = value
//const pendingPlay = ref(false)
//const setPendingPlay = (value) => pendingPlay.value = value
let desktopLyricShowState = false, trackRetry = 0
const TRACK_MAX_RETRY = 1
const pendingBootstrapTrack = ref(null)
const setPendingBootstrapTrack = (value) => pendingBootstrapTrack.value = value
const customDndPlayingCover = ref(null)
const setCustomDndPlayingCover = (value) => customDndPlayingCover.value = value


/* 记录最近播放 */
//歌曲、电台、MV、视频
const traceRecentTrack = (track) => {
    if (!isStoreRecentPlay.value) return
    const { platform } = track
    if (isLocalMusic(platform) || isCloudStorage(platform)) return

    if (Playlist.isFMRadioType(track)) {
        addRecentRadio(track)
    } else if (Playlist.isVideoType(track)) {
        //TODO 纯MV、单个视频，暂时不记录
    } else { //歌曲、MV关联的歌曲
        addRecentSong(track)
    }
    emitEvents("userHome-refresh")
}

//歌单
const traceRecentPlaylist = (playlist) => {
    if (!isStoreRecentPlay.value) return
    if (Playlist.isCustomType(playlist)) return
    if (Playlist.isFMRadioType(playlist)) return
    const { id, platform, title, cover, type } = playlist
    if (isLocalMusic(platform) || isCloudStorage(platform)) return

    addRecentPlaylist(id, platform, title, cover, type)
}

//专辑
const traceRecentAlbum = (album) => {
    if (!isStoreRecentPlay.value) return
    const { id, platform, title, cover, publishTime } = album
    if (isLocalMusic(platform) || isCloudStorage(platform)) return
    
    addRecentAlbum(id, platform, title, cover, publishTime)
}


/* 歌词获取 */
const loadLyric = (track) => {
    if (!track || !isCurrentTrack(track)) return
    //已有歌词、主播电台
    if (Track.hasLyric(track) || Playlist.isAnchorRadioType(track)) {
        return notifyLyricLoaded(track)
    }

    //检查有效性
    const { id, platform } = track
    const vendor = getVendor(platform)
    
    //当前平台不存在时，直接尝试从其他平台获取歌词
    //可能由于插件化原因，平台插件未加载、未启用或不支持获取歌词
    if (!vendor || !vendor.lyric) return loadLyricFromUnited(track)
    
    //当前平台存在时
    //获取歌词，优先顺序：当前平台 -> 其他平台
    vendor.lyric(id, track).then(result => {
        //再次确认，可能歌曲已经被切走
        if (!isCurrentTrack(track)) return
        //顺便更新封面
        const { cover } = result
        if (Track.hasCover(result, isUseOnlineCoverEnable.value)) {
            Object.assign(track, { cover })
        }
        //若当前平台获取到歌词，则直接更新
        if (Track.hasLyric(result)) {
            updateLyric(track, result)
        } else { //否则，尝试从其他平台获取歌词
            loadLyricFromUnited(track)
        }
    }, error => notifyLyricLoaded(track))
}

const loadLyricFromUnited = (track) => {
    if (!track || !isCurrentTrack(track)) return
    return United.transferTrack(track, { isGetLyric: true }).then(uResult => {
            //再次确认，可能歌曲已经被切走
            if (!isCurrentTrack(track)) return
            //仍然无法获取，直接返回
            if (!uResult) return notifyLyricLoaded(track)
            //更新歌词
            const { lyric, lyricRoma: roma, lyricTrans: trans, cover } = uResult
            updateLyric(track, { lyric, roma, trans })
            //顺便更新封面
            if (Track.hasCover(uResult, isUseOnlineCoverEnable.value)) {
                Object.assign(track, { cover })
            }
        }, error => notifyLyricLoaded(track))
}

const updateLyric = (track, { lyric, roma, trans }) => {
    //歌曲 - 普通歌词
    if (track && Lyric.hasData(lyric)) {
        //歌词元数据补全
        const { title, artist, album } = lyric
        if (isBlank(title)) Object.assign(lyric, { title: track.title })
        if (isBlank(artist)) Object.assign(lyric, { artist: Track.artistName(track) })
        if (isBlank(album)) Object.assign(lyric, { album: Track.albumName(track) })

        Object.assign(track, { lyric })
    }
    //TODO 暂未支持
    //歌曲 - 罗马音
    if (track && Lyric.hasData(roma)) Object.assign(track, { lyricRoma: roma })
    //歌曲 - 歌词翻译
    if (track && Lyric.hasData(trans)) Object.assign(track, { lyricTrans: trans })
    //歌词更新后，进行通知
    notifyLyricLoaded(track)
}

//通知歌词已更新
const notifyLyricLoaded = (track) => {
    if (isCurrentTrack(track)) emitEvents('track-lyricLoaded', track)
}


//处理不可播放歌曲
const AUTO_PLAY_NEXT_MSG = '当前歌曲无法播放<br>即将为您播放下一曲'
const NO_NEXT_MSG = '当前歌曲无法播放<br>列表无可播放歌曲'
const OVERTRY_MSG = '播放失败次数太多<br>请手动播放其他歌曲吧'
const TRY_TRANSFRER_MSG = '当前歌曲无法播放<br>即将尝试切换其他版本'
const TRANSFRER_OK_MSG = '版本切换完成<br>即将为您播放歌曲'
const TRANSFRER_FAIL_MSG = '没有合适版本切换<br>即将为您播放下一曲'

//连跳计数器
let autoSkipCnt = 0
//重置连跳计数
const resetAutoSkip = () => autoSkipCnt = 0


//提示失败并播放下一曲
const toastFailAndPlayNext = (track, msg, cnt) => {
    //歌曲已手动被切走，非当前歌曲
    if (!isCurrentTrack(track)) return
    //延时控制访问速度，避免频繁骚扰音乐平台
    const isRadio = Playlist.isFMRadioType(track)
    const _msg = isRadio ? AUTO_PLAY_NEXT_MSG.replace('歌曲', '电台') : AUTO_PLAY_NEXT_MSG
    showFailToast(msg || _msg, () => {
        //重新确认当前歌曲
        if (isCurrentTrack(track)) playNextTrack()
    }, 2233 + cnt * 100)
}

//用户手动干预，即主动点击上/下一曲时，产生体验上的Bug
//目前实现方式已稍作处理
const handleUnplayableTrack = (track, msg) => {
    ++autoSkipCnt
    const queueSize = queueTracksSize.value
    if (Playlist.isNormalRadioType(track)) { //普通歌单电台
        return toastFailAndPlayNext(track, msg, autoSkipCnt)
    } else if (autoSkipCnt >= queueSize) { //非电台歌曲，且没有下一曲
        resetPlayState()
        resetAutoSkip()
        return showFailToast(NO_NEXT_MSG)
    }
    //普通歌曲
    //频繁切换下一曲，体验不好，对音乐平台也不友好
    if (autoSkipCnt <= 10) return toastFailAndPlayNext(track, msg, autoSkipCnt)
    resetPlayState()
    //10连跳啦，暂停一下吧
    resetAutoSkip()
    showFailToast(OVERTRY_MSG)
}

//获取并更新歌曲播放信息
const bootstrapTrack = (track, options) => {
    const { noToast, keepCover } = (options || {})
    return new Promise(async (resolve, reject) => {
        if (!track) return reject('none')
        //FM电台
        if (Playlist.isFMRadioType(track) && Track.hasUrl(track)) {
            return resolve(track)
        }
        const { id, platform, artistNotCompleted } = track
        //平台服务
        const vendor = getVendor(platform)
        if (!vendor || !vendor.playDetail) return reject('noService')
        //播放相关数据
        const result = await vendor.playDetail(id, track)
        if (!result) return reject('noUrl')
        const { lyric, cover, artist, url } = result
        //覆盖设置url，音乐平台可能有失效机制，即url只在允许的时间内有效，而非永久性url
        if (Track.hasUrl(result)) Object.assign(track, { url })

        //更新歌词
        if (Track.hasLyric(result)) {
            updateLyric(track, { lyric })
        }
        //更新封面
        if (Track.hasCover(result, isUseOnlineCoverEnable.value) && !keepCover) {
            Object.assign(track, { cover })
        }
        //更新歌手
        //TODO 部分音乐平台artist信息无法在同一API中完整获取
        if (artistNotCompleted && artist) {
            Object.assign(track, { artist })
            emitEvents('track-artistUpdated', { trackId: id, artist })
        }

        //无法获取到有效url，VIP收费歌曲或其他原因
        if (!Track.hasUrl(track)) return reject('noUrl')
        resolve(track)
    })
}

const bootstrapTrackWithTransfer = async (track) => {
    return bootstrapTrack(track, { noToast: true }).catch(async (reason) => {
        if (reason == 'noUrl' || 'noService') {
            const { platform } = track
            if (isLocalMusic(platform) || Playlist.isFMRadioType(track)) return
            const candidate = await United.transferTrack(track)
            if (!Track.hasUrl(candidate)) return
            const { url, isCandidate } = candidate
            Object.assign(track, { url, isCandidate })
        }
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
    if (isTrackOverretry()) { //超出最大重试次数
        return handleUnplayableTrack(track)
    } else { //普通歌曲、广播电台
        increaseTrackRetry()
        //TODO 尝试恢复播放进度
        if (duration > 0 && !radio) {
            const percent = currentTime / duration
            markTrackSeekPending(percent)
        }
        //再次检查确认，避免被强行重置url，导致数据异常无法播放
        if (isLocalMusic(platform) || isFreeFM(platform) || isWebDav(platform)) return

        //强行重置url，并尝试重新获取
        if (!radio || Playlist.isFMRadioType(track)) track.url = ''
        if (!radio) track.isCandidate = false
        emitEvents('track-changed', track)
    }
}

/* 播放歌单 */
const playPlaylist = async (playlist, options) => {
    const { text, traceId } = options || {}
    if (!traceId) setCurrentTraceId(null)

    try {
        doPlayPlaylist(playlist, text, traceId)
    } catch (error) {
        if (isDevEnv) console.log(error)
        if (traceId && !isCurrentTraceId(traceId)) return
        showFailToast('歌单播放失败')
    }
}

//获取歌单歌曲数据
const loadGenrePlaylist = async (playlist, text, traceId) => {
    const { id, platform } = playlist
    if (Playlist.isGenreType(playlist)) {
        let maxRetry = 3, retry = 0
        while (!playlist || !playlist.data || playlist.data.length < 1) {
            if (traceId && !isCurrentTraceId(traceId)) return

            if (++retry > maxRetry) break
            //重试一次加载数据
            const vendor = getVendor(platform)
            if (!vendor || !vendor.genreDetailAllSongs) break
            //TODO 暂时限制为1000首歌曲，当前播放列表太长容易卡顿
            playlist = await vendor.genreDetailAllSongs(id, playlist)
        }
    }
    return playlist
}

//获取歌单歌曲数据
const loadPlaylist = async (playlist, text, traceId) => {
    const { id, platform } = playlist
    if (Playlist.isNormalType(playlist)
        || Playlist.isAnchorRadioType(playlist)
        || Playlist.isFolderType(playlist)) {
        let maxRetry = 3, retry = 0
        while (!playlist || !playlist.data || playlist.data.length < 1) {
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
    if (!playlist || !playlist.data || playlist.data.length < 1) {
        const failMsg = Playlist.isCustomType(playlist) ? '歌单里还没有歌曲'
            : '获取歌单歌曲失败'
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
    if(typeof id == 'undefined') return
    if(typeof platform == 'undefined') return

    let isTracePlaylist = true, needReset = true
    if (Playlist.isFMRadioType(playlist)) { //FM广播电台
        const track = playlist.data ? playlist.data[0] : playlist
        const hasUrl = Track.hasUrl(track)
        showToast(text || '即将为您收听电台')
        if(!hasUrl) {
            Object.assign(track, { purl: playlist.url })
            bootstrapTrack(track).then(result => {
                if(!Track.hasUrl(result)) {
                    if (traceId && !isCurrentTraceId(traceId)) return
                    return showFailToast('电台收听失败')
                }
                const { url } = result
                playTrack(Object.assign(track, { url }))
            })
        } else {
            playTrack(track)
        }
        return
    } else if (Playlist.isNormalRadioType(playlist)) { //歌单电台
        //提示前置，避免因网络卡顿导致用户多次请求
        showToast(text || '即将为您播放电台')
        playNextPlaylistRadioTrack(platform, id, null, traceId, playlist)
        return
    } else if (Playlist.isVideoType(playlist)) { //视频
        //const { detailUrl, } = playlist
        
        if(Video.maybeCollectionType(playlist)) {
            playVideoCollection(playlist, text, traceId) 
        } else {
            playVideoItem({ ...playlist }, '', text, traceId)
        }
        return
    } else if (Playlist.isGenreType(playlist)) {
        text = text || '即将为您播放流派'
        playlist = await loadGenrePlaylist(playlist, text, traceId)
    } else if (Playlist.isNormalType(playlist)
        || Playlist.isAnchorRadioType(playlist)
        || Playlist.isFolderType(playlist)) {
        playlist = await loadPlaylist(playlist, text, traceId)
    } else if(Playlist.isAlbumType(playlist)) {
        text = '即将为您播放专辑'
        playlist = await loadAlbum(playlist, text, traceId)
    } else if(Playlist.isSongType(playlist)) {
        isTracePlaylist = false
        needReset = false
        text = '即将为您播放歌曲'
        playlist.data = [{ ...playlist }]
    }
    //检查数据，再次确认
    if (!playlist || !playlist.data || playlist.data.length < 1) {
        const failMsg = Playlist.isCustomType(playlist) ? '歌单里还没有歌曲'
            : '获取歌单歌曲失败'
        if (traceId && !isCurrentTraceId(traceId)) return
        return showFailToast(failMsg)
    }

    if (traceId && !isCurrentTraceId(traceId)) return

    //可播放状态, 记录到最近播放，并开始播放
    if(isTracePlaylist) traceRecentPlaylist(playlist)
    addAndPlayTracks(playlist.data, needReset, text || '即将为您播放歌单', traceId)
}

const playVideoCollection = async (playlist, text, traceId) => {
    playlist = await loadVideoCollection(playlist)
    Object.assign(playlist,  { vcType: 1 })
    //检查数据，再次确认
    if (!playlist || !playlist.data || playlist.data.length < 1) {
        //const failMsg = Playlist.isCustomType(playlist) ? '视频无法播放' : '网络异常！请稍候重试'
        if (traceId && !isCurrentTraceId(traceId)) return
        showFailToast('当前视频无法播放')
        return 
    }
    //const { id, platform, cover, title, data } = playlist
    showToast(text || '即将为您播放视频', () => playVideo(playlist))
    return true
}

//获取视频详情
const loadVideoCollection = async (playlist, text, traceId) => {
    const { id, platform } = playlist
    let maxRetry = 3, retry = 0
    while (!playlist || !playlist.data || playlist.data.length < 1) {
        if (traceId && !isCurrentTraceId(traceId)) return

        if (++retry > maxRetry) break
        //重试一次加载数据
        const vendor = getVendor(platform)
        if (!vendor || !vendor.videoCollectionDetail) break
        playlist = await vendor.videoCollectionDetail(id, playlist)
    }
    return playlist
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
const playNextPlaylistRadioTrack = async (platform, channel, track, traceId, playlist) => {
    if (traceId && !isCurrentTraceId(traceId)) return

    const vendor = getVendor(platform)
    if (!vendor || !vendor.nextPlaylistRadioTrack) {
        return showFailToast('服务异常！请稍候重试')
    }
    const needReset = !Track.hasId(track)
    let maxRetry = 3, retry = 0, success = false
    do {
        if (traceId && !isCurrentTraceId(traceId)) return

        const result = await vendor.nextPlaylistRadioTrack(channel, track, playlist)
        if (!Track.hasId(result)) {
            ++retry
            continue
        }
        if (needReset && queueTracksSize.value > 0) {
            let ok = true
            if (isShowDialogBeforeClearPlaybackQueue.value) ok = await showConfirm('播放电台歌单，需清空当前播放。确定要继续吗？')
            if (!ok) return
            resetQueue()
        }
        addTrack(result)
        playTrack(result)
        success = true
        break
    } while (retry > 0 && retry < maxRetry)

    if (!success) {
        if (traceId && !isCurrentTraceId(traceId)) return
        showFailToast('电台歌单播放失败')
    }
}

//播放专辑
const playAlbum = (album, options) => {
    const { text, traceId, needReset } = options || {}
    if (!traceId) setCurrentTraceId(null)
    const _needReset = (typeof needReset != 'boolean') ? true : needReset

    try {
        doPlayAlbum(album, text, traceId, _needReset)
    } catch (error) {
        if (isDevEnv()) console.log(error)
        if (traceId && !isCurrentTraceId(traceId)) return
        showFailToast('专辑播放失败')
    }
}

//获取专辑歌曲数据
const loadAlbum = async (album, text, traceId) => {
    if (traceId && !isCurrentTraceId(traceId)) return

    const { id, platform } = album
    let maxRetry = 3, retry = 0
    while (!album || !album.data || album.data.length < 1) {
        if (traceId && !isCurrentTraceId(traceId)) return

        if (++retry > maxRetry) return
        //重试一次加载数据
        const vendor = getVendor(platform)
        if (!vendor || !vendor.albumDetail) return
        album = await vendor.albumDetail(id)
        if ((!album || !album.data || album.data.length < 1) && vendor.albumDetailAllSongs) {
            const result = await vendor.albumDetailAllSongs(id, 0, 100)
            if (result.data && result.data.length > 0) {
                album.data.push(...result.data)
            }
        }
    }
    return album
}

//添加专辑到当前播放
const addAlbumToQueue = async (album, options) => {
    const { text, traceId, } = options || {}
    if (traceId && !isCurrentTraceId(traceId)) return

    album = await loadAlbum(album, text, traceId)
    if (!album || !album.data || album.data.length < 1) {
        if (traceId && !isCurrentTraceId(traceId)) return
        return showFailToast('获取专辑歌曲失败')
    }

    if (traceId && !isCurrentTraceId(traceId)) return
    traceRecentPlaylist(album)
    addTracks(album.data)
    if (text) showToast(text)
    return album
}

//播放专辑
const doPlayAlbum = async (album, text, traceId, needReset) => {
    if (traceId && !isCurrentTraceId(traceId)) return

    album = await loadAlbum(album, text, traceId)
    if (!album || !album.data || album.data.length < 1) {
        if (traceId && !isCurrentTraceId(traceId)) return
        showFailToast('获取专辑歌曲失败')
        return
    }

    if (traceId && !isCurrentTraceId(traceId)) return
    traceRecentAlbum(album)
    addAndPlayTracks(album.data, needReset, text || '即将为您播放专辑')
}



/* 频谱 */
const drawEmptySpectrum = (canvas, { freqData, spectrumColor, stroke, alignment }) => {
    alignment = alignment || 'bottom'

    const { width: cWidth, height: cHeight } = canvas

    const canvasCtx = canvas.getContext("2d")
    canvasCtx.clearRect(0, 0, cWidth, cHeight)

    canvasCtx.fillStyle = 'transparent'
    canvasCtx.fillRect(0, 0, cWidth, cHeight)
}

//TODO
const drawSpectrum = (canvas, { freqData, spectrumColor, stroke, alignment }) => {
    alignment = alignment || 'bottom'

    const { width: cWidth, height: cHeight } = canvas

    const canvasCtx = canvas.getContext("2d")
    canvasCtx.clearRect(0, 0, cWidth, cHeight)

    canvasCtx.fillStyle = 'transparent'
    canvasCtx.fillRect(0, 0, cWidth, cHeight)

    if (!freqData || freqData.length < 1) return
    const dataLen = freqData.length
    let barWidth = (alignment == 'bottom') ? 4 : (1 / 2)
    let barHeight, x = 2, spacing = 3.5, step = 1
    //barWidth = (cWidth / (dataLen * 3))

    let freqCnt = 0
    const limit = (alignment == 'bottom') ? 100 : 188
    for (var i = 0; i < dataLen; i = i + step) {

        //if( (x + barWidth + spacing) >= cWidth) break
        step = (i >= (dataLen / 3) && i <= (dataLen * 3 / 4)) ? 1 : 2
        //数据量控制一下，减少点CPU占用

        //if (++freqCnt >= limit) break
        if (x >= cWidth) break

        barHeight = freqData[i] / 256 * cHeight
        barHeight = barHeight > 0 ? barHeight : 1

        canvasCtx.fillStyle = spectrumColor
        canvasCtx.strokeStyle = stroke
        //canvasCtx.shadowBlur = 1
        //canvasCtx.shadowColor = stroke

        //roundedRect(canvasCtx, x, cHeight - barHeight, barWidth, barHeight, 5)
        let y = (cHeight - barHeight) //alignment => bottom
        if (alignment == 'top') y = 0
        else if (alignment == 'center') y = (cHeight - barHeight) / 2

        canvasCtx.fillRect(x, y, barWidth, barHeight)
        if (barHeight > 0) canvasCtx.strokeRect(x, y, barWidth, barHeight)

        x += barWidth + spacing
    }
}

let flipBarHeights = []
const drawFlippingSpectrum = (canvas, { freqData, spectrumColor, stroke }) => {
    const { width: cWidth, height: cHeight } = canvas

    const canvasCtx = canvas.getContext("2d")
    canvasCtx.clearRect(0, 0, cWidth, cHeight)

    canvasCtx.fillStyle = 'transparent'
    canvasCtx.fillRect(0, 0, cWidth, cHeight)

    if (!freqData || freqData.length < 1) return
    const dataLen = freqData.length
    let barWidth = 4, barHeight = null, x = 2, spacing = 3.5, step = 1
    //barWidth = (cWidth / (dataLen * 3))
    const flipBarHeight = 1, flipStep = 1 / 2

    let freqCnt = 0
    for (var i = 0; i < dataLen; i = i + step) {
        //数据量控制一下，减少点CPU占用
        //if (++freqCnt >= 100) break
        if (x >= cWidth) break
        //step = i >= (dataLen / 2) && i <= (dataLen * 3 / 4) ? 1 : 2

        barHeight = freqData[i] / 256 * cHeight
        barHeight = barHeight > 0 ? barHeight : 1

        //roundedRect(canvasCtx, x, cHeight - barHeight, barWidth, barHeight, 5)
        const y = (cHeight - barHeight) //alignment => bottom
        const gradient = canvasCtx.createLinearGradient(x, y, x + barWidth, y)
        gradient.addColorStop(0, spectrumColor)
        gradient.addColorStop(0.5, `${spectrumColor}cb`)
        gradient.addColorStop(1, `${spectrumColor}66`)

        canvasCtx.fillStyle = gradient || spectrumColor
        canvasCtx.strokeStyle = gradient || stroke
        //canvasCtx.shadowBlur = 1
        //canvasCtx.shadowColor = gradient || stroke

        canvasCtx.fillRect(x, y, barWidth, barHeight)
        if (barHeight > 0) canvasCtx.strokeRect(x, y, barWidth, barHeight)

        //顶部跳块
        //未初始化时，设置默认值
        flipBarHeights[i] = flipBarHeights[i] || flipBarHeight
        const minFlipHeight = barHeight + flipBarHeight + 1
        const dropHeight = (flipBarHeights[i] - flipStep)
        //const heightGap = minFlipHeight - flipBarHeights[i]
        const flipWeight = 15
        const maxFlipHeight = barHeight > 1 ? barHeight + flipBarHeight * flipWeight : 0

        flipBarHeights[i] = dropHeight >= minFlipHeight ? dropHeight : maxFlipHeight

        //偷懒，不做下落过程的其他过渡色啦
        let flipBarColor = dropHeight >= minFlipHeight ? `${spectrumColor}88` : `${spectrumColor}aa`
        flipBarColor = dropHeight > (barHeight + flipBarHeight * 5 + 1) ? flipBarColor : `${spectrumColor}66`

        canvasCtx.fillStyle = flipBarColor
        canvasCtx.strokeStyle = flipBarColor

        const flipY = (cHeight - flipBarHeights[i])
        canvasCtx.fillRect(x, flipY, barWidth, flipBarHeight)
        canvasCtx.strokeRect(x, flipY, barWidth, flipBarHeight)

        x += barWidth + spacing
    }
}

//普通频谱
const drawCanvasSpectrum = () => {
    const canvas = document.querySelector(".spectrum-canvas")
    if (canvas) {
        const index = spectrumIndex.value
        const params = spectrumParams.value || {}
        let alignment = 'bottom'
        switch (index) {
            case 0:
                drawEmptySpectrum(canvas, { ...params, alignment })
                break
            case 1:
                drawSpectrum(canvas, { ...params, alignment })
                break
            case 2:
                drawFlippingSpectrum(canvas, params)
                break
            default:
                if (!hasExDrawSpectrumHandlers() || index < 0) return setSpectrumIndex(0)
                const exSpectrumIndex = Math.max((index - 3), 0)
                drawExSpectrum(canvas, { ...params, alignment }, exSpectrumIndex)
                    .catch(error => {
                        if (error == 'noHandler') return setSpectrumIndex(0)
                        console.log(error)
                    })
        }
    }
}

//TODO 插件加载状态无法感知
const containerElSelector = '.visual-playing-view .center .ex-visual-canvas-wrap'
watch(() => exVisualCanvasShow.value && playingViewThemeIndex.value, (nv, ov) => {
    const index = exVisualCanvasIndex.value
    const tIndex = playingViewThemeIndex.value
    toggleExVisualCanvas(containerElSelector, index, tIndex == 1)
        .catch(error => {
            if (error == 'noHandler' && index > 0) {
                setExVisualCanvasIndex(Math.max(0, index - 1))
            }
        })
}, { immediate: true, flush: 'post' })

watch(exVisualCanvasIndex, (nv, ov) => {
    toggleExVisualCanvas(containerElSelector, ov, false).catch(error => {
        if (isDevEnv()) console.log(error)
    })
    toggleExVisualCanvas(containerElSelector, nv, true).catch(error => {
        if (isDevEnv()) console.log(error)
    })
}, { flush: 'post' })

//获取视频信息 
const getVideoDetail = (video) => {
    return new Promise((resolve, reject) => {
        const { platform, mv, id, url, retry } = video
        const notRetry = (typeof retry == 'undefined')
        if(Video.hasUrl(video) && notRetry) return resolve(video)
        const _id = (mv || id)
        if (!_id) return reject('noId')
        if (!platform) return reject('noService')
        const vendor = getVendor(platform)
        if (!vendor || !vendor.videoDetail) return reject('noService')

        vendor.videoDetail(_id, video).then(result => {
            if (!result || isBlank(result.url)) return reject('noUrl')
            resolve(result)
        })
    })
}

//TODO 貌似Electron Bug：主窗口刷新后，MediaSession无法重新关联
const setupCurrentMediaSession = async (track) => {
    try {
        if ("mediaSession" in navigator) {
            const _track = track || { title: '听你想听，爱你所爱' }
            const { title, cover } = _track
            let coverSrc = cover
            if (toTrimString(cover).startsWith(ImageProtocal.prefix)) {
                coverSrc = await ipcRendererInvoke('open-image-base64', cover)
            }
            navigator.mediaSession.metadata = new MediaMetadata({
                title,
                artist: Track.artistName(_track),
                album: Track.albumName(_track),
                artwork: [{
                    src: coverDefault(coverSrc),
                    sizes: "240x240",
                    type: "image/png",
                }, {
                    src: coverDefault(coverSrc),
                    sizes: "300x300",
                    type: "image/png",
                }, {
                    src: coverDefault(coverSrc),
                    sizes: "500x500",
                    type: "image/png",
                }, {
                    src: coverDefault(coverSrc),
                    sizes: "1000x1000",
                    type: "image/png",
                }]
            })

            //上、下一曲按钮功能绑定，不支持视频
            if (currentVideo.value) return
            navigator.mediaSession.setActionHandler("previoustrack", playPrevTrack)
            navigator.mediaSession.setActionHandler("nexttrack", playNextTrack)
        }
    } catch(error) {
        if(isDevEnv()) console.log(error)
    }
}

//播放进度
const mmssCurrentTime = ref('00:00')
const mmssPreseekTime = ref(null) //格式: 00:00
const currentTimeState = ref(0) //单位: 秒
const progressState = ref(0)
const mmssDurationLeft = ref('00:00')

const resetPlayState = (state) => {
    currentTimeState.value = 0
    mmssCurrentTime.value = '00:00'
    mmssDurationLeft.value = '00:00'
    mmssPreseekTime.value = null
    progressState.value = 0
    setPlayState(state || PlayState.NONE)

    setProgressSeekingState(false)
    setCustomDndPlayingCover(null)
}


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
        if (playState.value == PlayState.PAUSE) {
            togglePlay()
        } else {
            playTrackDirectly(currentTrack.value)
        }
    }
    setProgressSeekingState(false)
    //setTimeout(() => seekTrackDirectly(percent), delay)
}

const seekTrackDirectly = (percent) => emitEvents('track-seek', percent)
const markTrackSeekPending = (percent) => emitEvents('track-markSeekPending', percent)

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
    const { duration } = currentTrack.value || {}
    return playing.value && !Playlist.isFMRadioType(currentTrack.value)
        && (duration > 0)
})

//播放单个视频
const playVideoItem = (video, failText, text, traceId) => {
    if (!video) return
    const { id, mv, vcType } = video
    if (!id) return

    failText = (failText || '当前视频无法播放')
    text = text || (mv ? '即将为您播放MV' : '即将为您播放视频')

    if(isMiniLayout.value) switchToFallbackLayout()

    getVideoDetail(video).then(result => {
        showToast(text, () => {
            playVideo({ ...video, ...result, vcType: (vcType || 0) }, -1, -1, failText, true)
            traceRecentTrack(video)
        }, 666)
    }, async error => {
        console.log(error)
        if (traceId && !isCurrentTraceId(traceId)) return
        showFailToast(failText)
    })
}

//video => { title, type, cover, url }
const playVideo = async (video, index, pos, failText, noTrace) => {
    try {
        if(!video) return

        //是否需要暂停音频播放并挂起
        const playing = isPlaying()
        const pending = (playing && isPauseOnPlayingVideoEnable.value)
        if (pending) togglePlay()
        //已挂起状态，视频播放中不应该重置（取消挂起）
        setPendingPlay(pending || pendingPlay.value)

        //开始播放视频
        if (!videoPlayingViewShow.value) toggleVideoPlayingView()
        //等待视频播放页打开，并完成相关初始化
        nextTick(() => {
            playVideoNow(video, index, pos, noTrace)
            setupCurrentMediaSession(currentVideo.value)
        })
    } catch (error) {
        if(isDevEnv()) console.log(error)
        showFailToast(failText || '当前视频无法播放')
    }
}

const resumeTrackPendingPlay = () => {
    if (isResumePlayAfterVideoEnable.value
        && !isPlaying.value && pendingPlay.value) {
        togglePlay()
        setPendingPlay(false)
        setupCurrentMediaSession(currentTrack.value)
    }
}


//应用启动时，恢复歌曲信息
const restoreTrack = (callback) => {
    const track = currentTrack.value
    if (!track) return
    //if (isDevEnv()) console.log('[ RESTORE TRACK ]')

    const _callback = (track) => {
        emitEvents("track-restore", track)
        if (pendingPlay.value && Track.hasUrl(track)) {
            seekTrack(pendingPlayPercent.value || 0)
            setPendingPlayPercent(0)
            if (!playing.value) {
                togglePlay()
                setPendingPlay(false)
            }
        }
        tryCall(callback, track)
    }
    const { platform } = track
    //稍候加载歌词、封面
    if (isLocalMusic(platform)) setPendingBootstrapTrack(track)

    bootstrapTrack(track).then(
        track => tryCall(_callback, track), 
        error => {
            if (isDevEnv()) console.log('[ STARTUP - Restore Track ]', error)
            if ('noService | noUrl'.includes(error)) setPendingBootstrapTrack(track)
            tryCall(_callback, track)
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
    if (isLocalMusic(platform) || isCloudStorage(platform)) {
        return showFailToast('当前平台暂不支持收藏') 
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


const quickSearch = () => {
    visitSearch(LESS_MAGIC_CODE).then(() => {
        // 不同布局下都会有搜索框组件
        // 由于单页面应用，切换布局时，其他非当前布局的搜索框也可能会被获取到，全部遍历聚焦就好
        const keywordInputEls = document.querySelectorAll('.search-bar .keyword')
        if (keywordInputEls) keywordInputEls.forEach(el => el.focus())
    })
}

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


//拖拽保存 - 图片、歌词、歌曲
//应用场景：播放页、歌曲列表
const getPreferredDndSavePath = (options) => {
    const { platform, url } = options || {}
    let savePath = getDndSavePath() || useDownloadsPath()
    if (isLocalMusic(platform) && !isBlank(url)) { //本地歌曲默认下载到：歌曲所在目录
        const _url = url.replace(FILE_PREFIX, '')
        const index = _url.lastIndexOf('/')
        savePath = _url.slice(0, index)
    }
    return savePath
}

//item对象必须具有属性: { platform, title, cover }
const dndSaveCover = async (event, item) => {
    if (!isDndSaveEnable.value) return
    if (event) event.preventDefault()
    if (!startDrag) return showFailToast('当前操作异常')

    const track = currentTrack.value
    // Track、Playlist、Artist、Album等类型的封面图片
    item = item || track
    if (!Track.hasCover(item)) return
    const { cover } = item

    const dndSavePath = getPreferredDndSavePath(item)
    if (!dndSavePath) return showFailToast('当前操作异常')

    const normalName = Track.normalName(item)
    const file = `${dndSavePath}/${normalName}.png`
    startDrag({ file, type: 'image', url: cover })
}

const dndSaveLyric = async (event, track) => {
    track = track || currentTrack.value
    if (!track) return
    if (!isDndSaveEnable.value) return

    if (event) event.preventDefault()
    if (!startDrag) return showFailToast('当前操作异常')

    const dndSavePath = getPreferredDndSavePath(track)
    if (!dndSavePath) return showFailToast('当前操作异常')
    if (!Track.hasLyric(track)) return

    const normalName = Track.normalName(track)
    const file = `${dndSavePath}/${normalName}.lrc`
    const { lyric } = track
    const data = Lyric.stringify(lyric)
    startDrag({ file, type: 'lyric', data })
}

const dndSaveTrack = async (event, track) => {
    if (!isDndSaveEnable.value) return
    //if (event) event.preventDefault()
    if (!track) return
    if (!startDrag) return showFailToast('当前操作异常')

    track = toRaw(track)
    const dndSavePath = getPreferredDndSavePath(track)
    if (!dndSavePath) return showFailToast('当前操作异常')

    const { platform } = track
    if (isLocalMusic(platform)) return showFailToast('当前为本地歌曲')
    if (Playlist.isFMRadioType(track)) return

    if (!Track.hasUrl(track)) { //TODO 网络请求，操作响应有些滞后
        await bootstrapTrackWithTransfer(track)
    }
    if (!Track.hasUrl(track) && !track.exurl) return showFailToast('当前歌曲无法下载')
    const { url, exurl } = track

    const normalName = escapeHtml(Track.normalName(track))
    const suffix = Track.suffix(track) || '.mp3'
    const file = `${dndSavePath}/${normalName}${suffix}`
    const _url = (url || exurl)
    startDrag({ file, name: normalName, type: 'audio', url: _url, useDefaultIcon: true })
}

const dndSaveVideo = async (event, video) => {
    if (!isDndSaveEnable.value) return
    if (event) event.preventDefault()
    video = toRaw(video)
    if (!video) return
    if (!startDrag) return showFailToast('当前操作异常')

    const dndSavePath = getPreferredDndSavePath(video)
    if (!dndSavePath) return showFailToast('当前操作异常')

    if (!Track.hasUrl(video)) return showFailToast('当前视频无法下载')
    const { title, url } = video

    const suffix = '.mp4'
    const file = `${dndSavePath}/${title}${suffix}`
    startDrag({ file, name: title, type: 'video', url })
}

const dndSaveFile = async (event, item) => {
    if (!isDndSaveEnable.value) return
    if (event) event.preventDefault()
    const { title, url } = item
    if (!url) return
    if (!startDrag) return showFailToast('当前操作异常')

    const dndSavePath = getPreferredDndSavePath()
    if (!dndSavePath) return showFailToast('当前操作异常')

    const file = `${dndSavePath}/${title}`
    startDrag({ file, name: title, type: 'file', url })
}


const setupCustomDndPlayingCover = async (event) => {
    event.preventDefault()

    const { files } = event.dataTransfer
    if(!files || files.length < 1) return
    const { path } = files[0]
    let isEventStopped = true
    if (isSupportedImage(path)) {
        setCustomDndPlayingCover(path)
    } else {
        //其他文件，直接放行，继续事件冒泡
        isEventStopped = false
    }
    if (isEventStopped) event.stopPropagation()

}



//注册ipcRenderer消息监听器
const { RESTORE, PLAY, PAUSE,  PLAY_PREV, PLAY_NEXT, 
        HOME, USERHOME, SETTING, 
        DESKTOP_LYRIC_OPEN, DESKTOP_LYRIC_CLOSE, 
        DESKTOP_LYRIC_LOCK, DESKTOP_LYRIC_UNLOCK,
        DESKTOP_LYRIC_PIN, DESKTOP_LYRIC_UNPIN,
        PLUGINS, CHECK_FOR_UPDATES, 
    } = useTrayAction()
    
onIpcRendererEvents({
    //Tray事件
    'tray-action': (event, action) => {
        //TODO 视频播放中，暂时不允许中断
        if (videoPlayingViewShow.value) return
        switch (action) {
            case RESTORE:
                setupTray()
                break
            case PLAY:
            case PAUSE:
                togglePlay()
                break
            case PLAY_PREV:
                playPrevTrack()
                break
            case PLAY_NEXT:
                playNextTrack()
                break
            case HOME:
                visitHome()
                setupTray()
                break
            case USERHOME:
                visitUserHome()
                setupTray()
                break
            case SETTING:
                visitSetting()
                setupTray()
                break
            case DESKTOP_LYRIC_OPEN:
                setDesktopLyricShow(true, true)
                break
            case DESKTOP_LYRIC_CLOSE:
                setDesktopLyricShow(false, true)
                break
            case DESKTOP_LYRIC_LOCK:
            case DESKTOP_LYRIC_UNLOCK:
                postMessageToDesktopLryic('s-desktopLyric-lockState')
                break
            case DESKTOP_LYRIC_PIN:
            case DESKTOP_LYRIC_UNPIN:
                postMessageToDesktopLryic('s-desktopLyric-pinState')
                break
            case PLUGINS:
                visitPlugins()
                break
            case CHECK_FOR_UPDATES:
                emitEvents('check-for-updates')
                break
        }
    },

    //全局快捷键
    'globalShortcut-visitShortcutKeys': () => emitEvents('route-visitShortcutKeys'),
    'globalShortcut-togglePlay': togglePlay,
    'globalShortcut-switchPlayMode': switchPlayMode,
    'globalShortcut-playPrev': playPrevTrack,
    'globalShortcut-playNext': playNextTrack,
    'globalShortcut-volumeUp': () => updateVolumeByOffset(0.05),
    'globalShortcut-volumeDown': () => updateVolumeByOffset(-0.05),
    'globalShortcut-toggleVolumeMute': toggleVolumeMute,
    'globalShortcut-visitSetting': () => visitSetting(),
    'globalShortcut-togglePlaybackQueue': togglePlaybackQueueView,
    'globalShortcut-toggleLyricToolbar': () => {
        if (playingViewShow.value || isSimpleLayout.value) toggleLyricToolbar()
    },
    'globalShortcut-resetSetting': () => {
        emitEvents('app-resetSetting')
    },
    'globalShortcut-quickSearch': () => quickSearch(),
    'globalShortcut-visitThemes': () => visitThemes(),
    'globalShortcut-visitModulesSetting': () => visitModulesSetting(),
    'globalShortcut-visitPlugins': () => visitPlugins(),
    'globalShortcut-visitRecents': () => visitRecents(),
    'globalShortcut-togglePlayingThemes': () => {
        if (playingViewShow.value) togglePlayingThemeListView()
    },

    //其他事件
    'app-desktopLyric-showSate': (event, isShow) => {
        desktopLyricShowState = isShow
        emitEvents('desktopLyric-showState', desktopLyricShowState)
    },
    'app-messagePort-channel': (event, channel) => {
        setupMessagePort(channel, () => {
            emitEvents('desktopLyric-messagePort', messagePort)
        })
        ipcRendererSend('app-messagePort-pair')
    },
    'dnd-saveToLocal-result': (event, { file, name, type, data, url, useDefaultIcon, error }) => {
        const typeMappings = {
            image: {
                name: '图片',
            },
            lyric: {
                name: '歌词'
            },
            audio: {
                name: '歌曲',
                extra: name
            },
            video: {
                name: '视频',
                extra: name
            }
        }
        const { name: typeName, extra } = (typeMappings[type] || { name: '文件' })
        const _extra = extra ? `<br/>${extra}` : ''
        if (error) {
            showFailToast(`${typeName}下载失败${_extra}`)
        } else {
            showToast(`${typeName}已下载${_extra}`)
        }
    },
})

const handleStartupPlay = () => {
    onIpcRendererEvents({
        'app-startup-playTracks': (event, tracks) => {
            if (!tracks || !Array.isArray(tracks) || tracks.length < 1) return
            //紧跟在当前歌曲后面播放，不扰乱当前播放列表进度
            tracks.forEach(track => playTrackLater(track))
            showToast('即将为您播放歌曲', () => {
                playTrack(tracks[0])
                ipcRendererSend('app-startup-playDone', tracks)
            }, 888)
        },
        'app-startup-playVideos': (event, video) => {
            if (!video) return
            const tailText = Video.isCollectionType(video) ? '合集' : ''
            if(isMiniLayout.value) switchToFallbackLayout()
            showToast(`即将为您播放视频${tailText}`, () => {
                playVideo(video)
                ipcRendererSend('app-startup-playDone', video)
            }, 888)
        },
    })
    ipcRendererSend('app-startup-playReady')
}


let messagePort = null
const setupMessagePort = (channel, callback) => {
    onIpcRendererEvent(channel, event => {
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
    data = data ? toRaw(data) : data
    if (messagePort) messagePort.postMessage({ action, data })
}

const handleMessageFromDesktopLyric = (action, data) => {
    if (action === 'c-setting-visit') {
        ipcRendererSend('app-mainWin-show')
        visitSetting()
        ipcRendererInvoke('find-in-page', '桌面歌词')
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
        postMessageToDesktopLryic('s-track-init-retry', currentTrack.value)
    } else if (action === 'c-track-loadLyric') {
        loadLyric(data)
    } else if (messagePort.onPlayerMessage) { //必须放在最后
        messagePort.onPlayerMessage(action, data)
    }
}


//TODO
const reloadApp = () => {
    showToast('即将为您刷新播放器')
    if (playing.value) setPendingPlay(true)
    setPendingPlayPercent(progressState.value)
    setTimeout(() => ipcRendererSend('app-reload'), 1888)
}


//EventBus监听注册，统一管理
const eventsRegistration = {
    //FM广播
    'radio-play': traceRecentTrack,
    'radio-state': ({ state, track, currentTime, radio }) => {
        checkFavoritedState()
        switch (state) {
            case PlayState.PLAYING:
                setPlaying(true)
                setupCurrentMediaSession(currentTrack.value)
                break
            case PlayState.PAUSE:
                setPlaying(false)
                break
            case PlayState.PLAY_ERROR:
                setPlaying(false)
                onPlayerErrorRetry({ track, currentTime, radio })
                break
            default:
                break
        }
    },
    //普通歌曲
    'track-changed': track => {
        bootstrapTrack(track).then(track => {
            if (isCurrentTrack(track)) {
                playTrackDirectly(track)
            }
        }, async (reason) => {
            if (reason == 'noUrl' || reason == 'noService') { //TODO
                const { platform } = track
                if (!isVipTransferEnable.value || isLocalMusic(platform)
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
                const { url, cover, lyric, lyricTrans, lyricRoma, duration, isCandidate } = candidate
                Object.assign(track, { url, lyric, lyricTrans, lyricRoma, duration, isCandidate })
                if (Track.hasCover(candidate)) Object.assign(track, { cover })
                showToast(TRANSFRER_OK_MSG, () => {
                    if (isCurrentTrack(track)) {
                        loadLyric(track)
                        playTrackDirectly(track)
                    }
                })
            }
        }).catch(error => {
            console.log(error)
            handleUnplayableTrack(track)
        })
    },
    'track-play': track => {
        //resetAutoSkip()
        const { platform } = track
        if(isLocalMusic(platform) || isCloudStorage(platform)) bootstrapTrack(track)
        traceRecentTrack(track)
        //loadLyric(track)
    },
    'track-state': ({ state, track, currentTime }) => {
        //播放刚开始时，更新MediaSession
        if ((playState.value == PlayState.INIT
            || playState.value == PlayState.LOADED)
            && state == PlayState.PLAYING) {
            setupCurrentMediaSession(currentTrack.value)
            resetAutoSkip()
        }

        setPlayState(state)
        switch (state) {
            case PlayState.NONE:
                resetPlayState(state)
                break
            case PlayState.INIT:
                resetPlayState(state)
                checkFavoritedState()
                break
            case PlayState.PLAYING:
                setPlaying(true)
                break
            case PlayState.PAUSE:
                setPlaying(false)
                break
            case PlayState.END:
                playNextTrack()
                break
            case PlayState.LOAD_ERROR:
            case PlayState.PLAY_ERROR:
                setPlaying(false)
                onPlayerErrorRetry({ track, currentTime })
                break
            default:
                break
        }
    },
    'track-pos': ({ currentTime: currentSecs, duration }) => {
        if (videoPlayingViewShow.value && isPlaying()
            && isPauseOnPlayingVideoEnable.value) {
            togglePlay()
            return
        }
        const track = currentTrack.value
        if (duration != track.duration && duration > 0) Object.assign(track, { duration })
        const currentTime = currentSecs * 1000
        mmssCurrentTime.value = toMmss(currentTime)
        currentTimeState.value = currentSecs
        const _duration = track.duration || 0
        progressState.value = _duration > 0 ? (currentTime / _duration) : 0
        const durationLeft = (_duration - currentTime)
        mmssDurationLeft.value = toMmss(Math.max(durationLeft, 0))
        //FM电台，特殊处理
        if(Playlist.isFMRadioType(track)) mmssDurationLeft.value = mmssCurrentTime.value
        //ipcRendererSend('app-setProgressBar', progressState.value || -1)
    },
    'track-seekAction': ({ track, pos }) => {
        const { platform } = track
        const vendor = getVendor(platform)
        if(!vendor || !vendor.seekAction) return
        vendor.seekAction(track, pos)
    },
    'track-spectrumData': ({leftFreqData, leftFreqBinCount, rightFreqData,
        rightFreqBinCount, freqData, freqBinCount,
        sampleRate, analyser, leftChannelAnalyser, rightChannelAnalyser, }) => {
        if (!currentTrack.value) return setSpectrumParams(null)

        const spectrumColor = getCurrentThemeHighlightColor()
        const canvasBgColor = getCurrentThemeContentBgColor()
        const isSimpleLayoutMode = isSimpleLayout.value
        const isPlaying = playing.value

        setSpectrumParams({
            leftFreqData, leftFreqBinCount,
            rightFreqData, rightFreqBinCount,
            freqData, freqBinCount, sampleRate,
            analyser, leftChannelAnalyser, rightChannelAnalyser,
            spectrumColor, stroke: spectrumColor, canvasBgColor,
            isSimpleLayoutMode, isPlaying
        })

        //简约布局、可视化播放页
        if (!isSimpleLayoutMode && (!playingViewShow.value || playingViewThemeIndex.value != 1)) {
            return setSpectrumParams(null)
        }
        if (exVisualCanvasShow.value && !isSimpleLayoutMode) return
        drawCanvasSpectrum()
    },
    'track-seekFinish': () => {
        //清除预备状态
        mmssPreseekTime.value = null
        setProgressSeekingState(false)
    },
    'track-coverUpdated': setupCurrentMediaSession,
    //歌单电台 - 下一曲
    'track-nextPlaylistRadioTrack': track => {
        playNextPlaylistRadioTrack(track.platform, track.channel, track, null, track.playlist)
    },
    'video-changed': (video) => {
        getVideoDetail(video).then(result => {
            if(!Video.hasUrl(result)) return 
            const { url } = result
            Object.assign(currentVideoPlayingItem.value, { url })
            playVideo(currentVideo.value, videoPlayingIndex.value)
        }).catch(error => {
            if(isDevEnv()) console.log(error)
            showFailToast('视频播放失败')
        })
    },
    'video-stop': resumeTrackPendingPlay,
    //'video-playCurrent': playVideo,
    'plugins-accessResult-addPlatform': ({ code }) => {
        const pendingTrack = pendingBootstrapTrack.value
        if (!pendingTrack) return
        if (pendingTrack.platform != code && !isLocalMusic(pendingTrack.platform)) return
        //pendingTrack已非当前歌曲
        if (!isCurrentTrack(pendingTrack)) return setPendingBootstrapTrack(null)
        
        //延迟加载歌词
        emitEvents('track-lyricRestore')
        const _track = { ...pendingTrack }
        setPendingBootstrapTrack(null)
        setTimeout(() => loadLyric(_track), 1888)
    },
    //TODO
    'userProfile-reset': checkFavoritedState,
    'track-refreshFavoritedState': checkFavoritedState,
    'setting-syncToDesktopLyric': data => postMessageToDesktopLryic('s-setting-sync', data),
}

onMounted(() => {
    onEvents(eventsRegistration)

    setupStateRefreshFrequency()
    setupSpectrumRefreshFrequency()
    setupSoundEffect()

    restoreTrack(handleStartupPlay)

    //setupOutputDevices()
})

onUnmounted(() => {
    offEvents(eventsRegistration)
})

watch(queueTracksSize, (nv, ov) => {
    if (nv < 1) {
        resetPlayState()
        setFavoritedState(false)
        emitEvents('playbackQueue-empty')
    }
})

watch(playing, (nv, ov) => {
    ipcRendererSend('app-playState', nv)
    if (!nv && spectrumIndex.value != 0) drawCanvasSpectrum()
    const params = spectrumParams.value || {}
    setSpectrumParams({ ...params, isPlaying: nv })
})

//TODO
watch(theme, () => {
    if (!isPlaying() && (playingViewThemeIndex.value == 1
        || layout.value.index == 2)) {
        drawCanvasSpectrum()
    }
    postMessageToDesktopLryic('s-theme-apply', getCurrentTheme())
}, { deep: true })

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
    playVideoItem,
    playVideo,
    addAndPlayTracks,
    loadLyric,
    mmssCurrentTime,
    mmssDurationLeft,
    currentTimeState,
    progressState,
    playState,
    favoritedState,
    toggleFavoritedState,
    preseekTrack,
    mmssPreseekTime,
    isTrackSeekable,
    progressSeekingState,
    dndSaveCover,
    dndSaveLyric,
    dndSaveTrack,
    dndSaveVideo,
    dndSaveFile,
    quickSearch,
    reloadApp,
    customDndPlayingCover,
    //setCustomDndPlayingCover,
    setupCustomDndPlayingCover,
})
</script>

<template>
    <slot></slot>
</template>

<style>
</style>