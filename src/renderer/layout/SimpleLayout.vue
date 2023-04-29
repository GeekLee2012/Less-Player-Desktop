<script setup>
import { onActivated, ref, watch, toRaw, inject } from 'vue';
import { storeToRefs } from 'pinia';
import EventBus from '../../common/EventBus';
import { usePlayStore } from '../store/playStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { usePlatformStore } from '../store/platformStore';
import { useSettingStore } from '../store/settingStore';
import { usePlaylistSquareStore } from '../store/playlistSquareStore';
import { useRadioSquareStore } from '../store/radioSquareStore';
import { useUserProfileStore } from '../store/userProfileStore';
import { useSoundEffectStore } from '../store/soundEffectStore';
import { Track } from '../../common/Track';
import { Playlist } from '../../common/Playlist';
import { toMMssSSS } from '../../common/Times';
import { isMacOS, nextInt, randomTextWithinAlphabet } from '../../common/Utils';
import Popovers from '../Popovers.vue';
import WinTrafficLightBtn from '../components/WinTrafficLightBtn.vue';
import ArtistControl from '../components/ArtistControl.vue';



const { seekTrack, playPlaylist, playMv, progressState, mmssCurrentTime, currentTimeState } = inject('player')

const volumeBarRef = ref(null)
const textColorIndex = ref(0)
const isLyricShow = ref(false)
const hasLyric = ref(false)
const platformShortName = ref('ALL')

const { currentTrack, playingIndex, volume, playing } = storeToRefs(usePlayStore())
const { soundEffectViewShow, spectrumIndex,
    lyricToolbarShow, randomMusicToolbarShow,
    randomMusicPlatformCodes, randomMusicTypeCodes,
    currentMusicCategoryName } = storeToRefs(useAppCommonStore())
const { showToast, toggleSoundEffectView,
    setSpectrumIndex, toggleLyricToolbar,
    toggleRandomMusicToolbar, showFailToast,
    setCurrentMusicCategoryName, setCurrentTraceId,
    isCurrentTraceId, hideLyricToolbar,
    hideRandomMusicToolbar, hideSoundEffectView } = useAppCommonStore()
const { isUseEffect } = storeToRefs(useSoundEffectStore())
const { lyric, isSimpleLayout } = storeToRefs(useSettingStore())
const { switchToFallbackLayout } = useSettingStore()

const { randomMusicTypes } = storeToRefs(usePlatformStore())
const { getVendor, platforms,
    isPlaylistType, isAnchorRadioType,
    isFMRadioType, getPlatformName,
    getPlatformShortName } = usePlatformStore()

const spectrumCanvasShow = ref(spectrumIndex.value >= 0)

const setSpectrumCanvasShow = () => {
    spectrumCanvasShow.value = spectrumIndex.value >= 0
}

const setTextColorIndex = (value) => {
    textColorIndex.value = value
}

const { addFavoriteTrack, removeFavoriteSong,
    isFavoriteSong, addFavoriteRadio,
    removeFavoriteRadio, isFavoriteRadio } = useUserProfileStore()
const favorited = ref(false)

const toggleFavorite = () => {
    if (playingIndex.value < 0) return
    favorited.value = !favorited.value
    const { id, platform } = currentTrack.value
    const isFMRadioType = Playlist.isFMRadioType(currentTrack.value)
    let text = "歌曲收藏成功！"
    if (favorited.value) {
        if (isFMRadioType) {
            addFavoriteRadio(currentTrack.value)
            text = "FM电台收藏成功！"
        } else {
            addFavoriteTrack(currentTrack.value)
        }
    } else {
        text = "歌曲已取消收藏！"
        if (isFMRadioType) {
            text = "FM电台已取消收藏！"
            removeFavoriteRadio(id, platform)
        } else {
            removeFavoriteSong(id, platform)
        }
    }
    showToast(text)
}

const checkFavorite = () => {
    //if(playingIndex.value < 0) return 
    const { id, platform } = currentTrack.value
    favorited.value = isFavoriteRadio(id, platform) || isFavoriteSong(id, platform)
}

/*
const autoSetupTextColor = async (cover) => {
    if(!cover) return
    return new Promise((resolve, reject) => {
        //const opts = { ignore: [ 'rgb(255, 255, 255)', 'rgb(0, 0, 0)' ] }
        useRgbaster(cover).then(color => {
            const metaEl = document.querySelector(".simple-layout .center .meta-wrap")
            const audioTimeEl = document.querySelector(".simple-layout .center .audio-time-wrap")
            if(metaEl) metaEl.style.color = color
            if(audioTimeEl) audioTimeEl.style.color = color
            resolve(color)
        })
    })
}
*/

const setupTextColor = () => {
    const index = textColorIndex.value
    const color = ["#fff", "#000"][index]
    const metaEl = document.querySelector(".simple-layout .center .meta-wrap")
    const audioTimeEl = document.querySelector(".simple-layout .center .audio-time-wrap")
    if (metaEl) metaEl.style.color = color
    if (audioTimeEl) audioTimeEl.style.color = color
}

const toggleLyricShow = () => {
    isLyricShow.value = !isLyricShow.value
}

const setLyricToolbarPos = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const el = document.querySelector("#lyric-toolbar")
    if (!el) return
    //const width = 150, height = 446, padding = 30
    const width = 168, height = 549, padding = 33
    const left = (clientWidth - width - padding)
    const top = (clientHeight - height) / 2
    //el.style.right = padding + 'px'
    el.style.left = left + 'px'
    el.style.top = top + 'px'
}

const switchSpectrum = () => {
    let index = spectrumIndex.value
    index = index < 2 ? (index + 1) % 3 : -1
    setSpectrumIndex(index)
    setSpectrumCanvasShow()
}

const switchTextColor = () => {
    const index = textColorIndex.value
    setTextColorIndex((index + 1) % 2)
}


/* 歌词 */
const toggleLyric = () => {
    toggleLyricShow()
    setupLyricAlignment()
}

//TODO
const checkLyricValid = () => {
    //const track = toRaw(currentTrack.value)
    const track = currentTrack.value
    if (Track.hasLyric(track)) { //确认是否存在有效歌词
        const lyricData = track.lyric.data
        let isValidLyric = true
        if (lyricData.size <= 3) { //歌词行数太少，直接判定为无效歌词
            isValidLyric = false
        } else if (lyricData.size <= 6) {
            const linesIter = lyricData.values()
            let line = linesIter.next()
            while (!line.done) {
                const lineText = line.value
                isValidLyric = !(lineText.includes('纯音乐')
                    || lineText.includes('没有填词')
                    || lineText.includes('没有歌词'))
                if (!isValidLyric) break
                line = linesIter.next()
            }
        }
        hasLyric.value = isValidLyric
    } else {
        hasLyric.value = false
    }
}

let lineIndex1 = 0, lineIndex2 = 1
const hlLineIndex = ref(-1)
const setHlLineIndex = (value) => hlLineIndex.value = value

const renderLyric = (secs) => {
    if (!hasLyric.value) {
        setHlLineIndex(-1)
        return
    }
    if (!isLyricShow.value) return

    const presetOffset = Track.lyricOffset(currentTrack.value)
    const userOffset = lyric.value.offset / 1000
    secs = Math.max(0, (secs + presetOffset + userOffset))
    const MMssSSS = toMMssSSS(secs * 1000)
    const lyricWrap = document.querySelector(".simple-layout .lyric-ctl")
    if (!lyricWrap) return

    const lyricData = Track.lyricData(currentTrack.value)
    const lyricKeys = Array.from(lyricData.keys())
    const lyricValues = Array.from(lyricData.values())
    const lineNums = lyricKeys.length

    let index = 0
    for (var i = 0; i < lineNums; i++) {
        const key = lyricKeys[i]
        if (MMssSSS >= key) {
            index = i
        } else if (MMssSSS < key) {
            break
        }
    }
    if (index != lineIndex1 && index != lineIndex2) {
        lineIndex1 = index
        lineIndex2 = index + 1
    }
    lineIndex1 = Math.min(lineNums - 1, lineIndex1)
    lineIndex2 = Math.min(lineNums, lineIndex2)

    const line0Text = lyricValues[lineIndex1]
    const line1Text = lyricValues[lineIndex2]

    //歌词内容
    const lines = lyricWrap.querySelectorAll('.line')
    lines[0].innerHTML = line0Text
    lines[1].innerHTML = line1Text || '&nbsp;'

    //高亮行
    if (index == lineIndex1) setHlLineIndex(0)
    else if (index == lineIndex2) setHlLineIndex(1)
    setupLyricLines()
}

const resetLyric = () => {
    lineIndex1 = 0
    lineIndex2 = 1
    setHlLineIndex(-1)
    //默认歌词内容
    const lines = document.querySelectorAll('.simple-layout .lyric-ctl .line')
    if (lines) {
        lines[0].innerHTML = '暂时没有歌词'
        lines[1].innerHTML = '请继续欣赏音乐吧'
    }
}

const setupLyricLines = () => {
    const els = document.querySelectorAll(".simple-layout .lyric-ctl .line")
    if (!els) return
    const fontSize = lyric.value.fontSize
    const hlFontSize = lyric.value.hlFontSize
    const fontWeight = lyric.value.fontWeight
    const lineHeight = lyric.value.lineHeight
    //const lineSpacing = lyric.value.lineSpacing
    els.forEach((el, index) => {
        el.style.lineHeight = lineHeight + "px"
        //if(index > 0) el.style.marginTop = lineSpacing + "px"

        const classAttr = el.getAttribute('class')
        if (classAttr.includes('current')) { //高亮行
            el.style.fontSize = hlFontSize + "px"
            el.style.fontWeight = 'bold'
        } else { //普通行
            el.style.fontSize = fontSize + "px"
            el.style.fontWeight = fontWeight
        }
    })
}

const setupLyricAlignment = () => {
    const lyricCtlEls = document.querySelectorAll(".simple-layout .lyric-ctl .line")
    const textAligns = ['left', 'center', 'right']
    const flexAligns = ['flex-start', 'center', 'flex-end']
    const { alignment } = lyric.value
    if (lyricCtlEls) lyricCtlEls.forEach(el => el.style.textAlign = textAligns[alignment])
}


//默认随机方式不满足需求
//随机 + 简单加权（重）
//随机函数并不完全随机（伪随机），存在一定的分布规律
//需要根据分布规律，对数据进行排序
//Math.random()近似普通均匀分布？

//随机获取一种类型（简单加权）
const nextRandomTypeCode = (types) => {
    const sortedTypes = types.sort((e1, e2) => (e2.weight - e1.weight))
    const totalTypesWeight = sortedTypes.reduce((acc, curr) => (acc + curr.weight), 0)
    const maxNum = 1024, guessmeNum = nextInt(maxNum) //默认最大值1024
    let currentScopeNum = guessmeNum, guessmeIndex = 0
    for (var i = 0; i < sortedTypes.length; i++) {
        const currentWeight = sortedTypes[i].weight
        //当前区间最大值
        const scopeMax = maxNum * (currentWeight / totalTypesWeight)
        if (currentScopeNum <= scopeMax) {
            guessmeIndex = i
            break
        }
        //不在当前区间，计算超出值
        currentScopeNum = currentScopeNum - scopeMax
    }
    return sortedTypes[guessmeIndex].code
}

//随机获取一个平台（简单加权）
const nextRandomPlatformCode = (platforms) => {
    const sortedPlatforms = platforms.sort((e1, e2) => (e2.weight - e1.weight))
    const totalPlatformsWeight = sortedPlatforms.reduce((acc, curr) => (acc + curr.weight), 0)
    const maxNum = 1024, guessmeNum = nextInt(maxNum) //默认最大值1024
    let currentScopeNum = guessmeNum, guessmeIndex = 0
    for (var i = 0; i < sortedPlatforms.length; i++) {
        const currentWeight = sortedPlatforms[i].weight
        //当前区间最大值
        const scopeMax = maxNum * (currentWeight / totalPlatformsWeight)
        if (currentScopeNum <= scopeMax) {
            guessmeIndex = i
            break
        }
        //不在当前区间，计算超出值
        currentScopeNum = currentScopeNum - scopeMax
    }
    return sortedPlatforms[guessmeIndex].code
}

/* 随便听听 */
const randomPlay = async () => {
    const traceId = randomTextWithinAlphabet(6) + Date.now()
    setCurrentTraceId(traceId)

    //数组，全部类型、全部平台
    const allTypes = randomMusicTypes.value
    const allPlatforms = platforms('random')
    //已设置的类型code
    const rmTypeCodes = randomMusicTypeCodes.value
    //已设置的平台code
    const rmPlatformCodes = randomMusicPlatformCodes.value
    const errorType = rmTypeCodes.length < 1 ? 0 :
        (rmPlatformCodes.length < 1 ? 1 : -1)
    if (errorType > -1) {
        const errorTypeName = ['类型', '平台'][errorType]
        showCurrentTracFailToast(traceId, `随机设置中${errorTypeName}未开启`)
        return
    }
    //获取完整类型信息
    const rmTypes = allTypes.filter(item => rmTypeCodes.includes(item.code))
    //获取完整平台信息
    const rmPlatforms = allPlatforms.filter(item => rmPlatformCodes.includes(item.code))
    //重试
    let maxRetry = 6, retry = 0
    let availablePlatforms = null, rmTypeCode = null
    do {
        //随机获取一种类型
        rmTypeCode = nextRandomTypeCode(rmTypes)
        //根据类型匹配相应平台
        availablePlatforms = rmPlatforms.filter(item => item.types.includes(rmTypeCode))
        if (availablePlatforms && availablePlatforms.length > 0) {
            break
        }
        //匹配失败，重试其他类型
        ++retry
    } while (retry > 0 && retry < maxRetry)
    //超出最大重试次数，匹配不到任何平台
    if (!availablePlatforms || availablePlatforms.length < 0) {
        showCurrentTracFailToast(traceId, '服务异常！请稍候重试')
        return
    }

    //随机一个平台
    const platform = nextRandomPlatformCode(availablePlatforms)
    //平台服务
    const vendor = getVendor(platform)
    if (!vendor) {
        showCurrentTracFailToast(traceId, '服务异常！请稍候重试')
        return
    }
    const platformName = getPlatformName(platform)
    if (!isCurrentTraceId(traceId)) return
    showToast(`正在连接：${platformName}`)
    //获取可播放数据
    if (isPlaylistType(rmTypeCode)) {
        pickPlaylist(platform, traceId)
    } else if (isAnchorRadioType(rmTypeCode)) {
        pickAnchorRadio(platform, traceId)
    } else if (isFMRadioType(rmTypeCode)) {
        pickFMRadio(platform, traceId)
    }
}

//显示当前调用链路的Toast
const showCurrentTracFailToast = (traceId, text) => {
    if (isCurrentTraceId(traceId)) showFailToast(text || '网络异常！请稍候重试')
}

//获取歌单分类
const pickCategory = async (platform, traceId) => {
    const { getCategories, putCategories, putOrders } = usePlaylistSquareStore()
    //平台服务
    const vendor = getVendor(platform)
    if (!vendor || !vendor.categories) {
        showCurrentTracFailToast(traceId, '服务异常！请稍候重试')
        return
    }
    let cachedCategories = getCategories(platform)
    if (!cachedCategories) {
        let maxRetry = 3, retry = 0
        do {
            if (!isCurrentTraceId(traceId)) return

            const result = await vendor.categories()
            if (result && result.data.length > 0) {
                putCategories(result.platform, result.data)
                putOrders(result.platform, result.orders)

                cachedCategories = result.data
                break
            }
            ++retry
        } while (retry > 0 && retry < maxRetry)
    }
    if (!isCurrentTraceId(traceId)) return

    if (!cachedCategories || !cachedCategories.length < 0) {
        return null
    }

    //主分类
    const categories = cachedCategories[nextInt(cachedCategories.length)]
    //子分类
    const data = categories.data
    return !data || data.length < 1 ? null
        : data[nextInt(data.length)]
}

//随机获取平台里的一个歌单
const pickPlaylist = async (platform, traceId) => {
    //获取歌单分类
    let category = null
    try {
        category = await pickCategory(platform, traceId)
    } catch (error) {
        console.log(error)
    }
    if (!isCurrentTraceId(traceId)) return

    let cateName = category ? category.key : null
    const cate = category ? category.value : null
    const order = null
    const limit = 35
    let result = null, total = -1
    //平台服务
    const vendor = getVendor(platform)
    if (!vendor || !vendor.square) {
        showCurrentTracFailToast(traceId, '服务异常！请稍候重试')
        return
    }
    //重试
    let maxRetry = 3, retry = 0
    //获取总页数
    do {
        if (!isCurrentTraceId(traceId)) return

        result = await vendor.square(cate, 0, limit, 1, order)
        if (result && result.total > 0) {
            total = result.total
            break
        }
        ++retry
    } while (retry > 0 && retry < maxRetry)
    if (total < 0) { //获取不到数据，暂时返回
        console.log(`获取歌单失败：${platform} - ${cateName}, TraceId: ${traceId}`)
        showCurrentTracFailToast(traceId)
        return
    }
    //重置，下面会再次复用
    retry = 0

    let success = false
    do {
        if (!isCurrentTraceId(traceId)) return
        //获取随机一个分页数据
        const page = Math.max(nextInt(total), 1)
        const offset = (page - 1) * limit
        result = await vendor.square(cate, offset, limit, page, order)
        console.log(`${platform} - ${cateName}: ${page}/${total} , ${offset}`)
        if (!result || result.data.length < 1) {
            ++retry
            continue
        }
        //无需重置，直接break-out
        //retry = 0

        //随机选择一个歌单
        const playlists = result.data
        const playlist = playlists[nextInt(playlists.length)]
        //特殊情况，歌单电台
        if (Playlist.isNormalRadioType(playlist)) {
            const titleParts = playlist.title.replaceAll(' ', '').split('|')
            cateName = titleParts.length > 1 ? titleParts[1] : titleParts[0]
        }
        if (isCurrentTraceId(traceId)) {
            setCurrentMusicCategoryName(cateName)
            playPlaylist(playlist, null, traceId)
        }
        success = true
        break
    } while (retry > 0 && retry < maxRetry)
    if (!success) showCurrentTracFailToast(traceId)
}

//获取主播电台分类
const pickAnchorRadioCategory = async (platform, traceId) => {
    const { getCategories, putCategories,
        getOrders, putOrders } = useRadioSquareStore()
    //平台服务
    const vendor = getVendor(platform)
    if (!vendor || !vendor.radioCategories) {
        showCurrentTracFailToast(traceId, '服务异常！请稍候重试')
        return
    }
    let cachedCategories = getCategories(platform)
    let cachedOrders = getOrders(platform)
    if (!cachedCategories) {
        let maxRetry = 3, retry = 0
        do {
            if (!isCurrentTraceId(traceId)) return

            const result = await vendor.radioCategories()
            if (result && result.data.length > 0) {
                cachedCategories = {
                    data: result.data,
                    multiSelectMode: (result.multiMode === true)
                }
                cachedOrders = result.orders
                putCategories(result.platform, cachedCategories)
                if (cachedOrders) {
                    putOrders(result.platform, cachedOrders)
                }
                break
            }
            ++retry
        } while (retry > 0 && retry < maxRetry)
    }
    if (!isCurrentTraceId(traceId)) return

    if (!cachedCategories || !cachedCategories.data.length < 0) {
        return null
    }
    //单个分类，且名称约定为电台或地区，如央广云听平台
    let filtedData = cachedCategories.data.filter(
        item => item.name != '电台' && item.name != '默认')
    if (filtedData.length < 1) {
        return null
    }
    //子分类
    const data = filtedData[0].data
    return !data || data.length < 1 ? null
        : data[nextInt(data.length)]
}

//随机获取平台里的一个主播电台
const pickAnchorRadio = async (platform, traceId) => {
    //获取分类
    let category = null
    try {
        category = await pickAnchorRadioCategory(platform, traceId)
    } catch (error) {
        console.log(error)
    }
    if (!isCurrentTraceId(traceId)) return

    let cateName = category ? category.key : '全部'
    const cate = category ? category.value : null
    const order = null
    const limit = 35
    let result = null, total = -1
    //重试
    let maxRetry = 3, retry = 0
    //获取总页数
    //平台服务
    const vendor = getVendor(platform)
    if (!vendor || !vendor.radioSquare) {
        showCurrentTracFailToast(traceId, '服务异常！请稍候重试')
        return
    }
    do {
        if (!isCurrentTraceId(traceId)) return

        result = await vendor.radioSquare(cate, 0, limit, 1, order)
        if (result && result.total > 0) {
            total = result.total
            break
        }
        ++retry
    } while (retry > 0 && retry < maxRetry)
    if (total < 0) { //获取不到数据，暂时返回
        console.log(`获取主播电台失败：${platform} - ${cateName}`)
        showCurrentTracFailToast(traceId)
        return
    }
    //重置，下面会再次复用
    retry = 0

    //获取随机一个分页数据
    let success = false
    do {
        if (!isCurrentTraceId(traceId)) return

        const page = Math.max(nextInt(total), 1)
        const offset = (page - 1) * limit
        result = await vendor.radioSquare(cate, offset, limit, page, order)
        console.log(`${platform} - ${cateName}: ${page}/${total} , ${offset}`)
        if (!result || result.data.length < 1) {
            ++retry
            continue
        }
        //无需重置，直接break-out
        //retry = 0

        //随机选择一个主播电台列表
        const playlists = result.data
        const playlist = playlists[nextInt(playlists.length)]
        if (isCurrentTraceId(traceId)) {
            setCurrentMusicCategoryName(cateName)
            playPlaylist(playlist, '即将为您打开主播电台', traceId)
        }
        success = true
        break
    } while (retry > 0 && retry < maxRetry)
    if (!success) showCurrentTracFailToast(traceId)
}

//获取广播电台分类
const pickFMRadioCategory = async (platform, traceId) => {
    const { getCategories, putCategories,
        getOrders, putOrders } = useRadioSquareStore()
    //平台服务
    const vendor = getVendor(platform)
    if (!vendor || !vendor.radioCategories) {
        showCurrentTracFailToast(traceId, '服务异常！请稍候重试')
        return
    }
    let cachedCategories = getCategories(platform)
    let cachedOrders = getOrders(platform)
    if (!cachedCategories) {
        let maxRetry = 3, retry = 0
        do {
            if (!isCurrentTraceId(traceId)) return

            const result = await vendor.radioCategories()
            if (result && result.data.length > 0) {
                cachedCategories = {
                    data: result.data,
                    multiSelectMode: (result.multiMode === true)
                }
                cachedOrders = result.orders
                putCategories(result.platform, cachedCategories)
                if (cachedOrders) {
                    putOrders(result.platform, cachedOrders)
                }
                break
            }
            ++retry
        } while (retry > 0 && retry < maxRetry)
    }
    if (!isCurrentTraceId(traceId)) return

    if (!cachedCategories || !cachedCategories.data.length < 0) {
        return null
    }
    //单个分类，且名称约定为电台或地区，如央广云听平台
    let filtedData = cachedCategories.data.filter(item => item.name == '电台')
    if (filtedData.length == 1) {
        const data = filtedData[0].data
        return !data || data.length < 1 ? null
            : data[nextInt(data.length)]

    }
    //两个个分类，且名称约定为地区、分类，如喜马拉雅FM
    //暂时默认全部就好，避免过渡复杂无意义
    //filtedData = cachedCategories.filter(item => (item.name == '地区' || item.name == '分类'))
    return null
}

//随机获取平台里的一个广播电台
const pickFMRadio = async (platform, traceId) => {
    //获取分类
    let category = null
    try {
        category = await pickFMRadioCategory(platform, traceId)
    } catch (error) {
        console.log(error)
    }
    if (!isCurrentTraceId(traceId)) return

    let cateName = category ? category.key : '全部'
    const cate = category ? category.value : null
    const order = null
    const limit = 35
    let result = null, total = -1
    //重试
    let maxRetry = 3, retry = 0
    //获取总页数
    //平台服务
    const vendor = getVendor(platform)
    if (!vendor || !vendor.radioSquare) {
        showCurrentTracFailToast(traceId, '服务异常！请稍候重试')
        return
    }
    do {
        if (!isCurrentTraceId(traceId)) return

        result = await vendor.radioSquare(cate, 0, limit, 1, order)
        if (result && result.total > 0) {
            total = result.total
            break
        }
        ++retry
    } while (retry > 0 && retry < maxRetry)
    if (total < 0) { //获取不到数据，暂时返回
        showCurrentTracFailToast(traceId)
        return
    }
    //重置，下面会再次复用
    retry = 0

    let success = false
    do {
        if (!isCurrentTraceId(traceId)) return

        //获取随机一个分页数据
        const page = Math.max(nextInt(total), 1)
        const offset = (page - 1) * limit
        result = await vendor.radioSquare(cate, offset, limit, page, order)
        console.log(`${platform} - ${cateName}: ${page}/${total} , ${offset}`)
        if (!result || result.data.length < 1) {
            ++retry
            continue
        }
        //无需重置，直接break-out
        //retry = 0

        //随机选择一个歌单
        const playlists = result.data
        const playlist = playlists[nextInt(playlists.length)]
        if (isCurrentTraceId(traceId)) {
            setCurrentMusicCategoryName(cateName)
            playPlaylist(playlist, '即将为您收听广播电台', traceId)
        }
        success = true
        break
    } while (retry > 0 && retry < maxRetry)
    if (!success) showCurrentTracFailToast(traceId)
}

const updatePlatformShortName = () => {
    const { platform } = currentTrack.value
    const shortName = getPlatformShortName(platform)
    platformShortName.value = shortName || 'ALL'
}

const quitSimpleLayout = () => {
    hideLyricToolbar()
    hideRandomMusicToolbar()
    hideSoundEffectView()
    switchToFallbackLayout()
}

/* EventBus事件 */
EventBus.on('track-lyricLoaded', track => checkLyricValid(track))
EventBus.on('lyric-fontSize', setupLyricLines)
EventBus.on('lyric-hlFontSize', setupLyricLines)
EventBus.on('lyric-fontWeight', setupLyricLines)
EventBus.on('lyric-lineHeight', setupLyricLines)
EventBus.on('lyric-lineSpacing', setupLyricLines)
EventBus.on('lyric-alignment', setupLyricAlignment)

/* 组件生命周期、钩子等 */
onActivated(() => {
    setupTextColor()
    updatePlatformShortName()
    checkFavorite()

    if (volumeBarRef) volumeBarRef.value.setVolume(volume.value)
})

watch(currentTimeState, (nv, ov) => {
    if (!isSimpleLayout.value) return

    //歌词渲染
    try {
        renderLyric(nv)
    } catch (error) {
        console.log(error)
    }
})

watch(currentTrack, (nv, ov) => {
    if (!nv) return
    updatePlatformShortName()
    checkFavorite()
    resetLyric()
    checkLyricValid()
})

watch([soundEffectViewShow], () => {
    EventBus.emit('app-elementAlignCenter', {
        selector: '.simple-layout #sound-effect-view',
        width: 404,
        height: 366,
    })
})
watch([randomMusicToolbarShow], () => {
    EventBus.emit('app-elementAlignCenter', {
        selector: '.simple-layout #random-music-toolbar',
        width: 299,
        height: 404,
        offsetLeft: 0,
        offsetTop: -15
    })
})
watch([lyricToolbarShow], setLyricToolbarPos)
watch([textColorIndex], setupTextColor)
</script>

<template>
    <div class="simple-layout">
        <div class="center" @contextmenu="toggleRandomMusicToolbar()">
            <div class="top" :class="{ 'top-fixed': !isMacOS() }">
                <div class="left">
                    <div class="win-ctl-wrap">
                        <WinTrafficLightBtn :hideMaxBtn="true"></WinTrafficLightBtn>
                    </div>
                    <div class="extra">
                        <div class="platform">
                            <span v-html="platformShortName"></span>
                        </div>
                        <span class="cate-name" v-html="currentMusicCategoryName"></span>
                    </div>
                </div>
                <div class="flex-space">
                    <div class="listen-btn">
                        <div class="play-btn" @click="randomPlay">
                            <svg width="15" height="15" viewBox="0 0 139 139" xml:space="preserve"
                                xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                <path
                                    d="M117.037,61.441L36.333,14.846c-2.467-1.424-5.502-1.424-7.972,0c-2.463,1.423-3.982,4.056-3.982,6.903v93.188  c0,2.848,1.522,5.479,3.982,6.9c1.236,0.713,2.61,1.067,3.986,1.067c1.374,0,2.751-0.354,3.983-1.067l80.704-46.594  c2.466-1.422,3.984-4.054,3.984-6.9C121.023,65.497,119.502,62.866,117.037,61.441z" />
                            </svg>
                            <div class="text">随便听听</div>
                        </div>
                        <svg @click="toggleRandomMusicToolbar" class="down-btn" width="15" height="15"
                            viewBox="0 0 763.32 424.57" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M380.47,322.11c27.6-27.5,54-53.68,80.23-80Q575,127.75,689.38,13.4C708.7-5.81,735-2.92,750.83,12.91c17,17,16.57,43.39-.9,60.87L414.1,409.61c-19.89,19.89-45,20-64.9.08Q180.9,241.45,12.66,73.15A42.53,42.53,0,1,1,72.85,13Q224.7,164.87,376.48,316.73A46.1,46.1,0,0,1,380.47,322.11Z" />
                                </g>
                            </g>
                        </svg>
                    </div>
                </div>
                <div class="action">
                    <span class="mv" v-show="Track.hasMv(currentTrack)">
                        <svg @click="playMv(currentTrack)" width="20" height="16" viewBox="0 0 1024 853.52"
                            xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M1024,158.76v536c-.3,1.61-.58,3.21-.92,4.81-2.52,12-3.91,24.43-7.76,36-23.93,72-88.54,117.91-165.13,117.92q-338.19,0-676.4-.1a205.81,205.81,0,0,1-32.3-2.69C76,840.18,19.81,787.63,5,723.14c-2.15-9.35-3.36-18.91-5-28.38v-537c.3-1.26.66-2.51.89-3.79,1.6-8.83,2.52-17.84,4.85-26.48C26.32,51.12,93.47.05,173.29,0Q512,0,850.72.13a200.6,200.6,0,0,1,31.8,2.68C948.44,13.47,1004,65.66,1019.09,130.88,1021.21,140.06,1022.39,149.46,1024,158.76ZM384,426.39c0,45.66-.09,91.32,0,137,.07,24.51,19.76,43.56,43.38,42.47,8.95-.42,15.83-5.3,23.06-9.86q69.25-43.74,138.74-87.11,40.63-25.42,81.44-50.6c23.18-14.34,23.09-49-.25-63.14-3.27-2-6.69-3.72-9.93-5.74q-30.08-18.81-60.08-37.69Q522.2,302.46,444,253.2a34.65,34.65,0,0,0-26.33-4.87c-19.87,4.13-33.64,21.28-33.68,42.09Q383.9,358.42,384,426.39Z" />
                                </g>
                            </g>
                        </svg>
                    </span>
                    <span class="lyric-btn spacing" :class="{ 'lyric-show': isLyricShow }" @click="toggleLyric">
                        词
                    </span>
                    <span class="text-color-btn spacing" :class="{ 'text-color-black': textColorIndex == 1 }"
                        @click="switchTextColor">
                        T
                    </span>
                    <span @click="quitSimpleLayout" class="spacing">
                        <svg width="17" height="16" viewBox="0 0 1019 1019" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M0,962V503a24.12,24.12,0,0,0,.86-3.77c2.43-31.82,26.64-54.36,58.5-54.39,21.49,0,43,0,64.46,0,1.75,0,3.5-.14,5.67-.24v-7.5q.18-188.61.35-377.22c0-28.4,14.83-48.4,41.95-56.89A45.21,45.21,0,0,0,178,0H969a65,65,0,0,0,6.86,2.75c21,6,34.13,19.66,40.16,40.47.86,3,2,5.85,3,8.78V837a28.45,28.45,0,0,0-1.9,4.46c-7.47,31.14-28.49,47.71-60.65,47.71H571.84v6.12c0,21,.07,42,0,63-.13,29.91-17,51.36-45.87,58.66-2,.52-4,1.37-6,2.06H51a32.14,32.14,0,0,0-4.91-2.06c-22.53-5.41-37-19.19-43.25-41.49C1.61,971,.93,966.49,0,962ZM249.22,118V447H513c34.42,0,57.07,20.41,60,54.56.92,10.77.91,21.63.92,32.45q.1,114.74,0,229.48v6H900.75V118ZM453.87,564.49H118.26V900.71H453.87Z" />
                                </g>
                            </g>
                        </svg>
                    </span>
                </div>
            </div>
            <div class="cover">
                <img v-lazy="currentTrack.cover" :class="{ rotation: false }" />
            </div>
            <div class="meta-wrap" v-show="lyric.metaPos != 1">
                <div class="audio-title" v-html="Track.title(currentTrack)"></div>
                <!-- <div class="audio-artist" v-html="Track.artistName(currentTrack)"></div> -->
                <ArtistControl :visitable="true" :platform="currentTrack.platform" :data="currentTrack.artist"
                    :trackId="currentTrack.id" class="audio-artist">
                </ArtistControl>
            </div>
            <div class="audio-time-wrap" v-show="lyric.metaPos != 1">
                <span class="t-current" v-html="mmssCurrentTime"></span>
                <span class="t-duration" v-html="Track.mmssDuration(currentTrack)"></span>
            </div>
            <div class="canvas-wrap" v-show="spectrumCanvasShow">
                <canvas class="spectrum-canvas" width="500" height="100"></canvas>
            </div>
        </div>
        <div class="bottom" @contextmenu="toggleLyricToolbar()">
            <div class="progress-wrap">
                <ProgressBar :value="progressState" :seekable="playing" :onseek="seekTrack"></ProgressBar>
            </div>
            <div class="action" v-show="!isLyricShow">
                <div class="btm-left">
                    <div @click="toggleFavorite">
                        <svg v-show="!favorited" width="18" height="19" viewBox="0 0 1024 937.46"
                            xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M1024,299.77c-.89,7.24-1.74,14.5-2.67,21.74-5.4,41.95-19.53,81-39,118.35-24.74,47.39-56.62,89.8-91.22,130.27-48.69,57-101.85,109.6-156.46,160.77C661.69,799.26,588.19,867,514.93,935.05c-.85.78-1.75,1.49-2.85,2.41-1.09-.89-2.14-1.65-3.09-2.52q-101.8-92.36-203.56-184.77c-58.71-53.61-116.12-108.59-168.2-168.81-39.12-45.23-74.7-92.93-100.8-147.1-18.8-39-31.17-79.91-35.23-123.16-.32-3.45-.8-6.89-1.2-10.33v-36c1-7.74,1.79-15.5,2.86-23.23,8.06-57.93,30.88-109.28,71.21-151.7,67.09-70.55,150.24-98.35,246.11-86,75.62,9.71,138.64,44.83,189.43,101.75.74.82,1.61,1.52,2.53,2.39.91-1,1.61-1.66,2.26-2.4a297.6,297.6,0,0,1,98.07-74.34C690-5.4,769.66-11.19,849.33,21.27,948,61.45,1004.25,136.62,1021.1,241.55c1.24,7.69,1.95,15.47,2.9,23.21ZM922.22,282.9c-1.08-10.76-1.48-21.64-3.33-32.27-10-57.28-39.78-101.12-91.95-127.45-54.58-27.54-110.52-27-165.67-1.07-44.78,21.07-78.08,53.89-96.65,100.47-1.2,3-2.93,3.41-5.65,3.4-29.5-.06-59-.1-88.49.05-3.58,0-5.17-1.2-6.63-4.39C430.29,148.12,342.54,89.86,249.42,105.81c-41,7-76.09,25.21-103.36,56.83-38.87,45.08-49.77,97.9-40.53,155.58,5.72,35.66,20,68.21,38.16,99.15C171,463.93,205.43,505,242,544.39c57.44,61.87,119.67,118.78,182.1,175.48,28,25.43,56.23,50.62,84.27,76,5.68,5.15,6.89,5.4,12.43.28C568,752.47,615.47,709.05,662.35,665c54.55-51.26,108-103.64,156.07-161.17C846.69,470,872.66,434.6,892.47,395,910.12,359.76,921.42,322.79,922.22,282.9Z" />
                                </g>
                            </g>
                        </svg>
                        <svg v-show="favorited" class="love-btn" width="18" height="19" viewBox="0 0 1024 937.53"
                            xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M1024,264.78v35c-.41,3.45-.89,6.89-1.23,10.34-3.89,39.7-15.25,77.26-32.22,113.22-23.28,49.33-54.76,93.24-89.46,135-49.41,59.44-104,113.93-160.28,166.77-74.94,70.39-150.55,140-225.89,210-.93.87-2,1.58-3.1,2.42-1.47-1.32-2.72-2.41-3.93-3.54-20.27-18.82-40.33-37.87-60.84-56.43C396.63,832,345.74,786.88,295.54,741c-52.69-48.1-103.88-97.76-151.07-151.36-37.41-42.48-71.92-87-98.75-137.15C23.93,411.83,8.38,369.06,2.64,323,1.71,315.62.88,308.2,0,300.79v-36c1-7.74,1.79-15.51,2.86-23.24,8.06-57.92,30.88-109.28,71.21-151.7C141.16,19.28,224.31-8.52,320.18,3.78c75.62,9.71,138.64,44.83,189.43,101.76.74.82,1.61,1.52,2.53,2.39.91-1,1.61-1.66,2.26-2.4a297.49,297.49,0,0,1,98.07-74.35C690-5.4,769.66-11.19,849.33,21.27,948,61.46,1004.25,136.63,1021.1,241.57,1022.34,249.26,1023.05,257,1024,264.78Z" />
                                </g>
                            </g>
                        </svg>
                    </div>
                    <VolumeBar class="spacing" ref="volumeBarRef"></VolumeBar>
                </div>
                <div class="btm-center">
                    <PlayControl></PlayControl>
                </div>
                <div class="btm-right">
                    <div @click="switchSpectrum" :class="{ active: spectrumCanvasShow }">
                        <svg width="18" height="17" viewBox="0 0 1003.7 910.4" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M558.35,455.05q0,197.71,0,395.43c0,23.94-9.54,42.39-30.94,53.57-35.59,18.6-79.08-5.74-81.67-45.8-1-15.6-.42-31.31-.42-47q0-375.43-.06-750.87c0-24.56,9.72-43.31,31.88-54.49,35.17-17.76,78,6.46,80.72,45.73,1,13.93.45,28,.45,42Q558.39,274.34,558.35,455.05Z" />
                                    <path
                                        d="M780.91,455.46q0,141.23,0,282.45c0,28-18.79,51.18-45.28,56.25C700.1,801,668.06,774.7,668,738.39c-.15-50.49-.05-101-.05-151.48q0-206.71,0-413.42c0-27.25,16.49-49.55,41.51-56.36,36.49-9.94,71.43,17,71.46,55.38q.11,133,0,266Z" />
                                    <path
                                        d="M222.78,455.06q0-141.22,0-282.46c0-32.54,25.16-57.78,57.09-57.51,30.91.25,55.77,25.31,55.85,56.8.16,60.49,0,121,0,181.47q0,191.46,0,382.93c0,21.23-8.07,38.4-26.05,49.93-18.3,11.73-37.84,12.56-57,2.36-19.52-10.41-29.86-27.38-29.91-49.57Q222.57,597,222.78,455.06Z" />
                                    <path
                                        d="M890.65,455.63q0-84.24,0-168.46c.06-26.54,17.39-48.82,42.37-55.06,36.35-9.07,70.42,17.67,70.55,55.71.18,53,0,106,0,159q0,87.72,0,175.45c0,26.81-17,49.41-41.58,55.82-36.91,9.64-71.28-16.95-71.37-55.47C890.55,566.93,890.65,511.28,890.65,455.63Z" />
                                    <path
                                        d="M113,455.55q0,83.49,0,167c-.05,24.61-13.49,44.63-35.53,53.57C40.25,691.17.17,663.46.08,622.31-.07,558.66,0,495,0,431.36,0,383.54,0,335.72.07,287.9.13,261,17.43,238.43,42.39,232.15c36.22-9.12,70.43,17.3,70.58,55C113.2,343.25,113,399.4,113,455.55Z" />
                                </g>
                            </g>
                        </svg>
                    </div>
                    <div class="equalizer spacing" :class="{ active: isUseEffect }">
                        <svg @click="toggleSoundEffectView" width="17" height="17" viewBox="0 0 1024 1024"
                            xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M863,1024c-3.34-.88-6.71-1.64-10-2.65-21.36-6.56-33.6-24.24-33.73-49.32-.17-30.82,0-61.64,0-92.46q0-109.46.11-218.91c0-4.23-1.43-5.81-5.23-7.35C757.73,630.46,725,588.87,718,528.43c-8.14-70.43,31.49-134,97.49-158.23,4-1.48,3.72-3.88,3.72-6.86q0-154.18.09-308.37a76.68,76.68,0,0,1,2.37-20.23c5.3-19,18.44-29.82,37.58-33.68C860.53.81,861.76.36,863,0h15a28.56,28.56,0,0,0,3.22,1c19.39,3.76,32.69,14.64,37.89,33.91,1.87,6.95,2.34,14.47,2.35,21.73q.21,152.91,0,305.83c0,4.8,1.56,6.75,5.91,8.47,47.71,18.85,78.4,53.1,91.65,102.69,2.3,8.62,3.37,17.56,5,26.36v24a31.82,31.82,0,0,0-1,3.79c-7.64,60.3-39.34,102.26-95.7,125.25-4.31,1.76-5.92,3.69-5.91,8.49q.22,152.91.09,305.82a99,99,0,0,1-.64,13.46c-2.74,19.87-13,33.85-32.45,40.29-3.42,1.13-7,1.94-10.44,2.9Zm7.18-460.81c30.89.09,51.55-20.44,51.56-51.22,0-30.55-20.46-51-51.12-51.16-30.83-.14-51.58,20.47-51.56,51.21C819.07,542.56,839.6,563.1,870.18,563.19Z" />
                                    <path
                                        d="M161,0c3.19.82,6.41,1.52,9.56,2.47,21.83,6.58,34.06,24.31,34.2,50,.14,27.49,0,55,0,82.49q0,216-.13,432c0,5,1.45,7,6.05,8.85,56,22.86,88.39,64.45,95.23,124.47,8.08,70.8-30.68,132.83-97.44,158.36-3.18,1.22-3.78,2.84-3.77,5.84.08,35.17.19,70.34-.07,105.5A74.81,74.81,0,0,1,202,990.18c-5.4,18.61-18.54,29-37.24,32.76-1.26.26-2.49.7-3.73,1.06H146c-1.23-.37-2.45-.83-3.7-1.09-19.33-4-32.45-15-37.59-34.28a79.26,79.26,0,0,1-2.17-19.76q-.3-51.71,0-103.41c0-3.88-1-5.71-4.81-7.22C47.53,838.6,16.07,802.53,3.72,750,2.1,743.09,1.22,736,0,729V705a34.55,34.55,0,0,0,.92-3.84c7.54-60.34,39.28-102.3,95.61-125.32,4.69-1.92,6-4,6-8.91q-.21-244.14-.09-488.29c0-11.66-.14-23.34.65-35C104.46,24,117.66,8.11,136.48,2.51,139.62,1.58,142.82.83,146,0Zm-7.44,665.6c-30.65,0-51.11,20.36-51.3,51s20.57,51.44,51.38,51.46c30.53,0,51.24-20.58,51.29-51C205,686.17,184.4,665.57,153.56,665.6Z" />
                                    <path
                                        d="M519,0c3.21.78,6.46,1.43,9.63,2.35,20.59,6,34.06,23.53,34.25,45.8.31,36.66.13,73.33.16,110,0,1.82,0,3.64,0,4.06,13.11,7.06,26.18,12.53,37.5,20.48,45.38,31.92,67.36,76.5,64.39,131.56-3.52,65.4-37.16,110.51-98.14,134.83-3.44,1.37-3.79,3.3-3.79,6.35q.07,139.24,0,278.47c0,78.82.09,157.64-.16,236.47a71.08,71.08,0,0,1-3.59,23c-6,17-19,26.35-36.52,29.64-1.27.23-2.51.67-3.77,1H505c-3.36-.83-6.77-1.53-10.08-2.52-20.31-6-33.68-23.6-33.81-45.63-.27-45.66-.15-91.33-.15-137q0-191.48.08-383c0-3.81-.79-5.73-4.79-7.18-61.56-22.31-101.76-83.08-97.42-148.45,4.36-65.6,37.51-110.79,98.73-135.06,3.41-1.35,3.42-3.33,3.42-6.07,0-36.83-.13-73.66.12-110.49.1-14.25,5.13-26.71,16-36.39C484,6.1,492.19,2.68,501.21,1,502.5.79,503.74.35,505,0Zm-7.23,358.4c30.69.18,51.22-20.08,51.41-50.73.19-30.8-20-51.48-50.45-51.73-31-.25-51.72,20-51.92,50.77C460.62,337.73,480.82,358.23,511.77,358.4Z" />
                                </g>
                            </g>
                        </svg>
                    </div>
                </div>
            </div>
            <div class="lyric-ctl" v-show="isLyricShow">
                <div class="line" :class="{ current: (hlLineIndex == 0) }">暂时没有歌词</div>
                <div class="line v-spacing" :class="{ current: (hlLineIndex == 1) }">请继续欣赏音乐吧</div>
            </div>
        </div>
        <Popovers></Popovers>
    </div>
</template>

<style>
.simple-layout {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    -webkit-app-region: none;
    --layout-width: 500px;
    --scrollbar-height: 3px;
    --bottom-height: 88px;
    width: var(--layout-width);
    overflow: hidden;
}

.simple-layout .spacing {
    margin-left: 15px;
}

.simple-layout .v-spacing {
    margin-top: 15px;
}

.simple-layout svg {
    fill: var(--svg-color);
    cursor: pointer;
}

.simple-layout svg:hover,
.simple-layout .active svg {
    fill: var(--svg-hover-color);
    cursor: pointer;
}

.simple-layout>.center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    /*flex: 1;*/
    position: relative;
    width: var(--layout-width);
    height: var(--layout-width);
}

.simple-layout>.center .top {
    -webkit-app-region: drag;
    width: 100%;
    height: 56px;
    z-index: 2;
    position: absolute;
    top: 0px;
    left: 0px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
}

.simple-layout>.center .top svg {
    -webkit-app-region: none;
}

.simple-layout>.center .top:hover {
    background: var(--app-bg);
    opacity: 0.85;
}

.simple-layout>.center .top .left {
    display: flex;
    height: 100%;
    width: 188px;
    position: relative;
}

.simple-layout>.center .top .left .win-ctl-wrap {
    display: flex;
    align-items: center;
    padding-left: 15px;
    overflow: hidden;
}

.simple-layout>.center .top .left .extra {
    height: 100%;
    position: absolute;
    right: 0px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    overflow: hidden;
}

.simple-layout>.center .top .left .extra .platform {
    display: flex;
    align-items: center;
}

.simple-layout>.center .top .left .extra .platform span {
    color: var(--hl-color);
    border-radius: 3px;
    border: 1.3px solid var(--hl-color);
    padding: 1px 3px;
    font-size: 10px;
    font-weight: 600;
    margin-right: 8px;
}

.simple-layout>.center .top .left .extra .cate-name {
    padding: 1px;
    font-weight: bold;
    /* font-size: var(--text-sub-size); */
    background: var(--hl-text-bg);
    -webkit-background-clip: text;
    color: transparent;

    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    width: 75px;
}

.simple-layout>.center .top .flex-space {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.simple-layout .listen-btn {
    display: flex;
    justify-content: center;
    align-items: center;
}

.simple-layout .listen-btn .text {
    padding: 3px 6px;
    -webkit-app-region: none;
}

.simple-layout .listen-btn .play-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
}

.simple-layout .listen-btn .play-btn:hover svg,
.simple-layout .listen-btn .play-btn:hover .text {
    color: var(--hl-color);
    fill: var(--svg-hover-color);
}

.simple-layout>.center .top .action {
    visibility: hidden;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 130px;
    padding-right: 15px;
    margin-left: 43px;
}

.simple-layout>.center .top .action .lyric-btn {
    width: 15px;
    height: 13px;
    border-radius: 3px;
    display: inline-block;
    cursor: pointer;
    border: 2px solid var(--svg-color);
    text-align: center;
    vertical-align: middle;
    font-size: 11px;
    font-weight: bold;
    margin-bottom: 3px;
}

.simple-layout>.center .top .action .lyric-show {
    border: 2px solid var(--svg-hover-color);
    color: var(--hl-color);
}

.simple-layout>.center .top .action .text-color-btn {
    background: #000;
    background: var(--svg-color);
    width: 15px;
    height: 11px;
    border-radius: 3px;
    display: inline-block;
    cursor: pointer;
    border: 2px solid var(--svg-color);
    text-align: center;
    vertical-align: middle;
    font-size: 12px;
    font-weight: bold;
    color: #fff;
    padding-bottom: 2px;
    margin-bottom: 3px;
}

.simple-layout>.center .top .action .text-color-black {
    background: #fff;
    color: #000;
}

.simple-layout>.center .top .left,
.simple-layout>.center .top .flex-space,
.simple-layout>.center .top .action {
    visibility: hidden;
}

.simple-layout>.center .top-fixed .action {
    -webkit-app-region: none;
}

.simple-layout>.center .top-fixed .left,
.simple-layout>.center .top-fixed .flex-space,
.simple-layout>.center .top-fixed .action,
.simple-layout>.center .top:hover .left,
.simple-layout>.center .top:hover .flex-space,
.simple-layout>.center .top:hover .action {
    visibility: visible;
}

.simple-layout>.center .meta-wrap {
    width: 100%;
    z-index: 2;
    position: absolute;
    bottom: 10px;
    left: 0px;
    text-align: left;
    padding: 33px;
}

.simple-layout>.center .meta-wrap .audio-title {
    font-size: 28px;
    font-weight: bold;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    width: 86.8%;
    line-height: 36px;
}

.simple-layout>.center .meta-wrap .audio-artist {
    font-size: 17px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    width: 80%;
    line-height: 32px;
}


.simple-layout>.center .cover {
    width: var(--layout-width);
    height: var(--layout-width);
    overflow: hidden;
    z-index: 1;
}

.simple-layout>.center .cover img {
    width: 100%;
    height: 100%;
}

.simple-layout>.center .audio-time-wrap {
    width: 100%;
    z-index: 2;
    position: absolute;
    bottom: 20px;
    left: 0px;
    text-align: left;
    font-size: 13px;
    display: flex;
}

.simple-layout .audio-time-wrap .t-current {
    position: absolute;
    left: 10px;
}

.simple-layout .audio-time-wrap .t-duration {
    position: absolute;
    right: 10px;
}

.simple-layout .canvas-wrap {
    width: 100%;
    z-index: 1;
    position: absolute;
    bottom: 0px;
    left: 0px;
    display: flex;
    flex-direction: row;
    justify-content: center;
}

.simple-layout .canvas-wrap canvas {
    flex: 1;
    overflow: hidden;
}

.simple-layout>.bottom {
    width: var(--layout-width);
    height: var(--bottom-height);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.simple-layout .progress-wrap {
    display: flex;
    flex-direction: row;
    justify-content: center;
    width: 100%;
}

.simple-layout .progress-wrap .progress-bar {
    flex: 1;
    height: var(--scrollbar-height);
}

.simple-layout>.bottom .action {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    flex: 1;
}

.simple-layout>.bottom .action .btm-left,
.simple-layout>.bottom .action .btm-right {
    width: 135px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.simple-layout>.bottom .action .btm-left {
    justify-content: flex-start;
}

.simple-layout>.bottom .action .btm-right {
    justify-content: flex-end;
}

.simple-layout>.bottom .action .btm-center {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}

.simple-layout>.bottom .volume-bar {
    width: 25px;
}

.simple-layout>.bottom .volume-bar:hover {
    width: 80px;
}

.simple-layout>.bottom .action .love-btn {
    fill: var(--svg-hover-color) !important;
}

.simple-layout>.bottom .lyric-ctl {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    width: 90%;
}

.simple-layout>.bottom .lyric-ctl .line {
    font-size: 18px;
    line-height: 30px;

    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    text-align: center;
    width: 100%;
}

.simple-layout>.bottom .lyric-ctl .current {
    background: var(--hl-text-bg);
    -webkit-background-clip: text;
    color: transparent;
    font-size: 21px;
    font-weight: bold;
}

.simple-layout>.bottom .lyric-ctl .v-spacing {
    margin-top: 0px;
}


/* 
.simple-layout .win-traffic-light-btn {
    width: 56px !important;
}

.simple-layout .win-traffic-light-btn .ctl-btn {
    width: 13px !important;
    height: 13px !important;
    margin-right: 8px !important;
}

.simple-layout .win-ctl-wrap .collapse-btn svg {
    width: 18px !important;
    height: 18px !important;
}
*/

/* Popovers */
.simple-layout #playback-queue-view {
    width: 335px;
}

.simple-layout #sound-effect-view {
    width: 404px;
    height: 366px;
}

.simple-layout #sound-effect-view .left {
    width: 68px;
}

.simple-layout #sound-effect-view .center .content {
    height: 295px;
    padding-top: 5px;
    overflow-y: scroll;
}

.simple-layout #sound-effect-view .center .bands {
    display: none;
}

/*
.simple-layout #video-playing-view .win-ctl-wrap {
    width: 105px !important;
}

.simple-layout #video-playing-view .win-traffic-light-btn .max-btn {
    display: none;
}
*/
</style>