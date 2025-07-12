<script setup>
import { watch, ref, inject, nextTick, computed, onUnmounted, onMounted, } from 'vue';
import { storeToRefs } from 'pinia';
import { Track } from '../../common/Track';
import { Playlist } from '../../common/Playlist';
import ArtistControl from './ArtistControl.vue';
import AlbumControl from './AlbumControl.vue';
import { usePlayStore } from '../store/playStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';
import { PlayState } from '../../common/Constants';
import { isDevEnv, smoothScroll, toMMssSSS, toMillis, tryCallDefault } from '../../common/Utils';
import { Lyric } from '../../common/Lyric';
import { onEvents, emitEvents, offEvents } from '../../common/EventBusWrapper';



const props = defineProps({
    track: Object, //Track
    currentTime: Number,
    hiddenMeta: Boolean,
    layoutMode: Number,
    keyName: String,
    disabled: Boolean
})

const { playVideoItem, loadLyric, currentTimeState,
    seekTrack, playState, progressSeekingState,
    dndSaveLyric } = inject('player')
const { applyDocumentStyle } = inject('appStyle')

const { playingViewShow } = storeToRefs(useAppCommonStore())
const { toggleLyricToolbar } = useAppCommonStore()
const { lyric, lyricTransActived, lyricRomaActived, 
    isDndSaveEnable, isMiniLayout, isSimpleLayout, 
    isPlayingViewLyricTransBtnShow,
} = storeToRefs(useSettingStore())
const { toggleLyricTrans, toggleLyricRoma, getStateRefreshFrequency } = useSettingStore()
const { isCurrentTrack } = usePlayStore()


const currentIndex = ref(-1)
//const hasLyric = ref(false)
const lyricData = ref(Track.lyricData(props.track))
let presetOffset = Track.lyricOffset(props.track)
const lyricTransData = ref(Track.lyricTransData(props.track))
const lyricRomaData = ref(Track.lyricRomaData(props.track))
let hitCount = 0
const sysOffset = 1000


const isUserMouseWheel = ref(false)
let userMouseWheelTimer = null
const isSeeking = ref(false)
const lyricExistState = ref(-1)

//const setLyricExist = (value) => hasLyric.value = value
const setLyricData = (value) => lyricData.value = value
const setPresetOffset = (value) => presetOffset = value
const setLyricCurrentIndex = (value) => currentIndex.value = value
const setUserMouseWheel = (value) => isUserMouseWheel.value = value
const setSeeking = (value) => isSeeking.value = value
const setLyricTransData = (value) => lyricTransData.value = value
const setLyricRomaData = (value) => lyricRomaData.value = value
const setLyricExistState = (value) => lyricExistState.value = value
const isLyricReady = () => lyricExistState.value == 1


const renderAndScrollLyric = (secs, track) => {
    if (!isLyricReady()) return
    if (isSeeking.value) return
    if (!isCurrentTrack(track)) return 

    const { offset: userOffset } = lyric.value
    const trackTime = Math.max(0, (secs * 1000 + presetOffset + userOffset + sysOffset))

    //Highlight 查找当前高亮行index
    const lyricWrap = document.querySelector(".lyric-ctl .center")
    if (!lyricWrap) return
    const lines = lyricWrap.querySelectorAll('.line')

    let index = -1, timeKey = null
    for (var i = 0; i < lines.length; i++) {
        if (!isCurrentTrack(track)) return 

        timeKey = lines[i].getAttribute('timeKey')
        const lineTime = toMillis(timeKey)
        if (trackTime < lineTime) break
        index = i
    }

    /*
    if (currentIndex.value == index && index >= 0 
        && (++hitCount >= 3)) {
        return
    } else if (currentIndex.value != index && index >= 0) {
        hitCount = 0
    }
    */
    
    if (index >= 0) setLyricCurrentIndex(index)
    index = Math.max(index, 0)

    //是否为用户主动改变进度，如手动滚动歌词、拖动进度条
    if (isUserMouseWheel.value || isSeeking.value || progressSeekingState.value) return

    //Scroll 滚动算法

    ////算法1: 基于百分比定位 ////
    //当歌词存在换行时，无法保证准确定位
    //且当前高亮行也无法保证在可视区居中
    /*
    const scrollIndex = Math.max(index - 1, 0)
    const { clientHeight, scrollHeight } = lyricWrap
    const maxScrollTop = scrollHeight - clientHeight
    const destScrollTop = maxScrollTop * (scrollIndex / (lines.length - 1))
    lyricWrap.scrollTop = destScrollTop
    */

    ////算法2：歌词可视区居中，依赖offsetParent定位 ////
    //基本保证：准确定位，当前高亮行基本在歌词可视区居中
    //offsetTop：元素到offsetParent顶部的距离
    //offsetParent：距离元素最近的一个具有定位的祖宗元素（relative，absolute，fixed），若祖宗都不符合条件，offsetParent为body
    /* 
    if (!lines[index].offsetTop) return
    const destScrollTop = lines[index].offsetTop - lyricWrap.clientHeight / 2
    lyricWrap.scrollTop = Math.max(destScrollTop, 0)
    */

    ////算法3：播放页垂直居中，依赖offsetParent定位；与算法2相似，只是参考系不同而已 ////
    //基本保证：准确定位，当前高亮行在播放页垂直居中，且基本与ScrollLocator在同一水平线上
    const line = lines[index]
    if (!line || !line.offsetTop || !line.clientHeight) return
    const { offsetTop } = lyricWrap
    if (!offsetTop) return
    const { clientHeight } = document.documentElement
    const { offsetTop: lineOffsetTop, clientHeight: lineHeight } = line
    //高度误差修正值
    const adjustHeight = (lineHeight && lineHeight > 0) ? (lineHeight / 2) : 0
    const destScrollTop = lineOffsetTop - (clientHeight / 2 - offsetTop) + adjustHeight

    if (!isCurrentTrack(track)) return 

    //懒得再计算相邻两句歌词之间的时间间隔了，暂时感觉不是很必要
    const frequency = getStateRefreshFrequency()
    const duration = 300 * frequency / 60
    const step = 5 * frequency / 60
    smoothScroll(lyricWrap, destScrollTop, duration, step, () => {
        return (isUserMouseWheel.value || isSeeking.value || progressSeekingState.value)
    })
}

const safeRenderAndScrollLyric = (secs, track) => {
    tryCallDefault(() => {
        renderAndScrollLyric(secs, track)
    })
}

const resetLyricState = (track, state) => {
    if (!isCurrentTrack(track)) return 
    
    //重置状态
    setLyricExistState(state >= -1 ? state : -1)
    setLyricData(Track.lyricData(track))
    setLyricTransData(Track.lyricTransData(track))
    setLyricRomaData(Track.lyricRomaData(track))
    setPresetOffset(Track.lyricOffset(track))
    setLyricCurrentIndex(-1)
    setSeeking(false)
}

//重新加载歌词
const reloadLyricData = (track) => {
    if (!isCurrentTrack(track)) return 
    if (!track) return
    let isExist = Track.hasLyric(track)
    
    //歌词存在，但需进一步确认是否有效
    if (isExist) {
        const lyricData = Track.lyricData(track)
        const lyricText = Lyric.stringify(track.lyric)
        //一般情况，歌曲无有效歌词时，歌词行数都不会多
        if (lyricData.size <= 10) { 
            isExist = !lyricText.includes('纯音乐')
                    && !lyricText.includes('暂无歌词')
                    && !lyricText.includes('无歌词')
                    && !lyricText.includes('没有歌词')
                    && !lyricText.includes('没有填词')
        }
    }
    //重置数据
    resetLyricState(track, isExist ? 1 : 0)
    //重新设置样式
    nextTick(() => {
        if (!isCurrentTrack(track)) return 

        setupLyricExtra(track)
        safeRenderAndScrollLyric(currentTimeState.value, track)
    })
}

const onUserMouseWheel = (event) => {
    //event.preventDefault()
    setUserMouseWheel(true)
    if (userMouseWheelTimer) clearTimeout(userMouseWheelTimer)
    userMouseWheelTimer = setTimeout(() => setUserMouseWheel(false), 2888)
    updateScrollLocatorTime()
}

const isHeaderVisible = () => (lyric.value.metaPos == 0 && !props.hiddenMeta)

//播放到指定歌词行，即通过歌词调整歌曲进度
const scrollLocatorTime = ref(0)
const scrollLocatorTimeText = ref('00:00')
const scrollLocatorCurrentIndex = ref(-1)

const setScrollLocatorTime = (value) => scrollLocatorTime.value = value
const setScrollLocatorTimeText = (value) => scrollLocatorTimeText.value = value
const setScrollLocatorCurrentIndex = (value) => scrollLocatorCurrentIndex.value = value


const updateScrollLocatorTime = () => {
    const locatorEl = document.querySelector('.lyric-ctl .scroll-locator')
    if (!locatorEl) return
    const lyricEl = document.querySelector('.lyric-ctl .center')
    if (!lyricEl) return
    const x = lyricEl.offsetLeft + 88
    const y = locatorEl.offsetTop
    const pointEl = document.elementFromPoint(x, y)
    if (!pointEl) return
    const timekey = pointEl.getAttribute('timeKey')
    if (!timekey) return
    //Time
    setScrollLocatorTime(timekey)
    setScrollLocatorTimeText(timekey.split('.')[0])
    //Hightlight
    const index = pointEl.getAttribute('index')
    setScrollLocatorCurrentIndex(index)
}

const seekFromLyric = () => {
    //不再多加判断，由用户自己决定吧
    //if (currentIndex.value == scrollLocatorCurrentIndex.value) return
    const { duration } = props.track
    if (duration <= 0) return
    const current = toMillis(scrollLocatorTime.value)
    if (current < 0 || current > duration) return

    setUserMouseWheel(false)
    setSeeking(true)
    const percent = current / duration
    seekTrack(percent)
    setSeeking(false)
    setScrollLocatorCurrentIndex(-1)
}

const isExtraTextActived = computed(() => {
    const { track } = props
    return (Track.hasLyricTrans(track) && lyricTransActived.value)
        || (Track.hasLyricRoma(track) && lyricRomaActived.value)
})

//额外歌词（如翻译、发音）对应的时间
const getExtraTimeKey = (mmssSSS, offset) => {
    return toMMssSSS(toMillis(mmssSSS) + (offset || 0))
        || mmssSSS
}

//歌词翻译、罗马发音
const setupLyricExtra = (track) => {
    if (!isCurrentTrack(track)) return 
    if (!isExtraTextActived.value) return
    
    const lines = document.querySelectorAll('.lyric-ctl .center .line') || []
    try {
        for(let i = 0; i < lines.length; i++) {
            if (!isCurrentTrack(track)) return 

            const line = lines[i]
            if (!line) continue
            const extraTextEl = line.querySelector('.extra-text')
            if (!extraTextEl) continue
            //1、重置
            extraTextEl.innerHTML = null

            //2、重新赋值
            const extraTextMap = lyricTransData.value || lyricRomaData.value
            if (!extraTextMap || !extraTextMap.get) return
            
            const timeKey = line.getAttribute('timeKey')
            if (!timeKey) continue
            let extraText = null
            //算法简单粗暴，最坏情况11次尝试！！！
            //一般来说，同一平台下同一首歌曲的所有歌词行的误差值基本是一样的，因此可以利用这点简单优化一下
            //即只要确定第一行的误差值，后面的歌词行全部直接优先使用该误差值进行匹配，不必每次都按固定顺序遍历数组
            //目前来说，即使不优化，对性能方面影响也不算大
            const timeErrors = [0, 10, 20, -10, -20, 30, -30, 40, 50, -40, -50]
            for (var j = 0; j < timeErrors.length; j++) {
                if (!isCurrentTrack(track)) return 

                const timeError = timeErrors[j]
                extraText = extraTextMap.get(getExtraTimeKey(timeKey, timeError))
                if (extraText) break
            }
            if (extraText && extraText != '//') extraTextEl.innerHTML = extraText
        }
    } catch (error) {
        console.log(error)
    }
}

const loadTrackLyric = (track) => {
    if (!isCurrentTrack(track)) return 
    if (!track) return
    if (Track.hasLyric(track)) return reloadLyricData(track)
    if (!isCurrentTrack(track)) return 
    
    resetLyricState(track)
    loadLyric(track)
}

//显示模式（布局）
const showByLayoutMode = computed(() => {
  return (key, value, index) => {
    const { layoutMode } = props
    if (typeof layoutMode == 'undefined') return true

    switch (layoutMode) {
      case 1: //双行
        if (currentIndex.value == index) return true
        const offset = (currentIndex.value % 2 === 1) ? -1 : 1
        return (currentIndex.value + offset) == index
      case 2: //全部显示
        return true
      default: //单行
        return currentIndex.value == index
    }
  }
})

const isFullLayoutMode = computed(() => {
    const { layoutMode } = props
    if (typeof layoutMode == 'undefined') return true
    return layoutMode == 2
})

const computedNoneArtistAlbumMeta = computed(() => {
    const layout = lyric.value.aralMetaLayout
    if (layout == 1) return true
    
    const { track } = props
    if (!Track.hasArtist(track) && !Track.hasAlbum(track)) {
        return true
    }
    return false
})



/* 生命周期、监听 */
watch(() => props.currentTime, (nv, ov) => {
    if(props.disabled) return
    //暂时简单处理，非可视状态直接返回
    if (!playingViewShow.value && !isMiniLayout.value && !isSimpleLayout.value) return
    safeRenderAndScrollLyric(nv, props.track)
}, { immediate: true })

watch(() => props.track, (nv, ov) => {
    if(props.disabled) return
    loadTrackLyric(nv)
}, { immediate: true })

const setupLyricStyle = (key, suffix) => {
    suffix = suffix || ''
    const value = lyric.value[key]
    if(!value) return 

    const keysMapping = {
        'titleFontSize': 'title-text-size',
        'aralFontSize': 'aral-text-size',
        'fontSize': 'text-size',
        'hlFontSize': 'hl-text-size',
        'fontWeight': 'font-weight',
        'lineHeight': 'line-height',
        'lineSpacing': 'line-spacing',
    }
    const propKey = keysMapping[key]
    console.log(value, propKey, suffix)
    if(value) applyDocumentStyle({ [`--lyric-${propKey}`]: `${value}${suffix}` })
}

const eventsRegistration = {
    'track-lyricLoaded': reloadLyricData,
    'track-noLyric': reloadLyricData,
    'lyric-userMouseWheel': onUserMouseWheel,
    'lyric-titleFontSize': () => setupLyricStyle('titleFontSize', 'px'),
    'lyric-aralFontSize': () => setupLyricStyle('aralFontSize', 'px'),
    'lyric-fontSize': () => setupLyricStyle('fontSize', 'px'),
    'lyric-hlFontSize': () => setupLyricStyle('hlFontSize', 'px'),
    'lyric-fontWeight': () => setupLyricStyle('fontWeight'),
    'lyric-lineHeight': () => setupLyricStyle('lineHeight', 'px'),
    'lyric-lineSpacing': () => setupLyricStyle('lineSpacing', 'px'),
    'track-lyricRestore': () => setLyricExistState(-1),
}

onMounted(() => {
    onEvents(eventsRegistration)
    loadTrackLyric(props.track)
})

onUnmounted(() => {
    offEvents(eventsRegistration)
})
</script>

<template>
    <div class="lyric-ctl" 
        :class="{
            'none-aral-meta': computedNoneArtistAlbumMeta,
            'align-left': lyric.alignment == 0,
            'align-center': lyric.alignment == 1,
            'align-right': lyric.alignment == 2,
        }"
        @contextmenu.prevent.stop="toggleLyricToolbar">
        <div class="header" v-show="isHeaderVisible()">
            <div class="audio-title" 
                :class="{
                    'single-line': (lyric.titleMetaLines == 1) 
                }">
                <span class="mv" v-show="Track.hasMv(track)">
                    <svg @click="playVideoItem(track)" 
                        width="24" 
                        height="20" 
                        viewBox="0 0 1024 853.52" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M1024,158.76v536c-.3,1.61-.58,3.21-.92,4.81-2.52,12-3.91,24.43-7.76,36-23.93,72-88.54,117.91-165.13,117.92q-338.19,0-676.4-.1a205.81,205.81,0,0,1-32.3-2.69C76,840.18,19.81,787.63,5,723.14c-2.15-9.35-3.36-18.91-5-28.38v-537c.3-1.26.66-2.51.89-3.79,1.6-8.83,2.52-17.84,4.85-26.48C26.32,51.12,93.47.05,173.29,0Q512,0,850.72.13a200.6,200.6,0,0,1,31.8,2.68C948.44,13.47,1004,65.66,1019.09,130.88,1021.21,140.06,1022.39,149.46,1024,158.76ZM384,426.39c0,45.66-.09,91.32,0,137,.07,24.51,19.76,43.56,43.38,42.47,8.95-.42,15.83-5.3,23.06-9.86q69.25-43.74,138.74-87.11,40.63-25.42,81.44-50.6c23.18-14.34,23.09-49-.25-63.14-3.27-2-6.69-3.72-9.93-5.74q-30.08-18.81-60.08-37.69Q522.2,302.46,444,253.2a34.65,34.65,0,0,0-26.33-4.87c-19.87,4.13-33.64,21.28-33.68,42.09Q383.9,358.42,384,426.39Z" />
                            </g>
                        </g>
                    </svg>
                </span>
                <span v-html="track.title"></span>
            </div>
            <div class="audio-artist spacing" 
                v-show="(lyric.aralMetaLayout == 0) && Track.hasArtist(track)">
                <b v-show="!Playlist.isFMRadioType(track) && (lyric.aralMetaLabelStyle == 0)">歌手:</b>
                <b v-show="Playlist.isFMRadioType(track) && (lyric.aralMetaLabelStyle == 0)">平台:</b>
                <svg width="17" height="17" v-show="(lyric.aralMetaLabelStyle == 2)" 
                    viewBox="0 0 810 854.54" xmlns="http://www.w3.org/2000/svg">
                    <g id="Layer_2" data-name="Layer 2">
                        <g id="Layer_1-2" data-name="Layer 1">
                            <path d="M385,0c117.88.3,213.35,96.08,213,213.66-.38,118.12-95.71,213.26-213.49,213.07s-213.49-96.16-213-213.58C172,95,267.43-.3,385,0Zm-.58,341.47c70.36.28,127.94-56.94,128.31-127.5a128,128,0,1,0-256-.64C256.5,283.64,313.83,341.19,384.37,341.47Z"/>
                            <path d="M640.7,682.51v-20q0-74,0-148c0-19.27,8.52-33,25.74-41.6,27.27-13.56,54.42-27.36,81.76-40.78,25.87-12.7,55.2,1.93,61,30.15,3.72,18-5.84,37.41-22.29,45.6-18.92,9.41-37.7,19.1-56.66,28.43-3.37,1.66-4.38,3.6-4.38,7.23q.17,107.74.09,215.48c0,46.09-36,88-81.81,93.46-20.79,2.51-42,3.79-62.43-2.85-38.64-12.58-61.61-39.33-68.54-79.37-.83-4.8.79-10.24,2.08-15.17a97.51,97.51,0,0,1,100-72.67C623.48,682.9,631.8,682.51,640.7,682.51Z"/>
                            <path d="M312.19,512q56.49,0,113,0c21.61,0,38.67,12.73,43.48,32.1,6.92,27.84-13.42,53.25-43,53.34-46.49.15-93,0-139.46,0-25.33,0-50.66-.34-76,.16-65,1.29-119.65,52.93-123.4,117.82-1.79,30.89-.74,61.95-.8,92.94,0,9.06-1.78,17.5-6.67,25.2a42.56,42.56,0,0,1-47,18.26C14.33,847,1,831.09.85,812.66c-.32-32.49-1.95-65.13.39-97.45,6.53-89.82,52.23-152.77,135-188.31,25.72-11,53.08-14.93,81-14.92Z"/>
                        </g>
                    </g>
                </svg>
                <span>
                    <ArtistControl class="ar-ctl" 
                        :visitable="true" 
                        :platform="track.platform" 
                        :data="track.artist" 
                        :trackId="track.id">
                    </ArtistControl>
                </span>
            </div>
            <div class="audio-album spacing" 
                v-show="(lyric.aralMetaLayout == 0) 
                    && Track.hasAlbum(track) 
                    && (lyric.albumMetaShow != 1)">
                <b v-show="!Playlist.isFMRadioType(track) && (lyric.aralMetaLabelStyle == 0)">专辑:</b>
                <b v-show="Playlist.isFMRadioType(track) && (lyric.aralMetaLabelStyle == 0)">标签:</b>
                <svg width="17" height="17" v-show="(lyric.aralMetaLabelStyle == 2)"
                    viewBox="0 0 853.47 853.5" xmlns="http://www.w3.org/2000/svg" >
                    <g id="Layer_2" data-name="Layer 2">
                        <g id="Layer_1-2" data-name="Layer 1">
                            <path d="M426.8,0C662.36.12,853.54,191.36,853.47,426.8S662,853.64,426.67,853.5C191.13,853.35-.11,662.05,0,426.67.11,191.14,191.42-.12,426.8,0ZM85.5,426.47C85.26,615.09,238,767.94,426.71,768c188.49,0,341-152.31,341.26-341S615.52,85.53,426.76,85.5C238.23,85.47,85.75,237.82,85.5,426.47Z"/><path d="M426.46,256c-47.09,1-87.6,17.3-120.63,50.49-32.87,33-49,73.41-49.87,120.08H171.28c-3.29-136.12,114-257.59,255.18-255.36Z"/>
                            <path d="M512,426.48a85.66,85.66,0,1,1-85.11-85.83A85.42,85.42,0,0,1,512,426.48Z"/>
                        </g>
                    </g>
                </svg>
                <span>
                    <AlbumControl class="al-ctl" 
                        :visitable="true" 
                        :platform="track.platform" 
                        :data="track.album">
                    </AlbumControl>
                </span>
            </div>
            <div class="audio-artist-album-wrap spacing" 
                v-show="(lyric.aralMetaLayout == 2) 
                    && (Track.hasArtist(track) 
                        || (Track.hasAlbum(track) && (lyric.albumMetaShow != 1)))">
                <div class="audio-artist" v-show="Track.hasArtist(track)">
                    <b v-show="!Playlist.isFMRadioType(track) && (lyric.aralMetaLabelStyle == 0)">歌手:</b>
                    <b v-show="Playlist.isFMRadioType(track) && (lyric.aralMetaLabelStyle == 0)">平台:</b>
                    <svg width="17" height="17" v-show="(lyric.aralMetaLabelStyle == 2)" 
                        viewBox="0 0 810 854.54" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path d="M385,0c117.88.3,213.35,96.08,213,213.66-.38,118.12-95.71,213.26-213.49,213.07s-213.49-96.16-213-213.58C172,95,267.43-.3,385,0Zm-.58,341.47c70.36.28,127.94-56.94,128.31-127.5a128,128,0,1,0-256-.64C256.5,283.64,313.83,341.19,384.37,341.47Z"/>
                                <path d="M640.7,682.51v-20q0-74,0-148c0-19.27,8.52-33,25.74-41.6,27.27-13.56,54.42-27.36,81.76-40.78,25.87-12.7,55.2,1.93,61,30.15,3.72,18-5.84,37.41-22.29,45.6-18.92,9.41-37.7,19.1-56.66,28.43-3.37,1.66-4.38,3.6-4.38,7.23q.17,107.74.09,215.48c0,46.09-36,88-81.81,93.46-20.79,2.51-42,3.79-62.43-2.85-38.64-12.58-61.61-39.33-68.54-79.37-.83-4.8.79-10.24,2.08-15.17a97.51,97.51,0,0,1,100-72.67C623.48,682.9,631.8,682.51,640.7,682.51Z"/>
                                <path d="M312.19,512q56.49,0,113,0c21.61,0,38.67,12.73,43.48,32.1,6.92,27.84-13.42,53.25-43,53.34-46.49.15-93,0-139.46,0-25.33,0-50.66-.34-76,.16-65,1.29-119.65,52.93-123.4,117.82-1.79,30.89-.74,61.95-.8,92.94,0,9.06-1.78,17.5-6.67,25.2a42.56,42.56,0,0,1-47,18.26C14.33,847,1,831.09.85,812.66c-.32-32.49-1.95-65.13.39-97.45,6.53-89.82,52.23-152.77,135-188.31,25.72-11,53.08-14.93,81-14.92Z"/>
                            </g>
                        </g>
                    </svg>
                    <span>
                        <ArtistControl class="ar-ctl" 
                            :visitable="true" 
                            :platform="track.platform" 
                            :data="track.artist" 
                            :trackId="track.id">
                        </ArtistControl>
                    </span>
                </div>
                <div class="audio-album" :class="{ 'spacing1': Track.hasArtist(track)}"
                    v-show="Track.hasAlbum(track) && (lyric.albumMetaShow != 1)">
                    <b v-show="!Playlist.isFMRadioType(track) && (lyric.aralMetaLabelStyle == 0)">专辑:</b>
                    <b v-show="Playlist.isFMRadioType(track) && (lyric.aralMetaLabelStyle == 0)">标签:</b>
                    <svg width="17" height="17" v-show="(lyric.aralMetaLabelStyle == 2)"
                        viewBox="0 0 853.47 853.5" xmlns="http://www.w3.org/2000/svg" >
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path d="M426.8,0C662.36.12,853.54,191.36,853.47,426.8S662,853.64,426.67,853.5C191.13,853.35-.11,662.05,0,426.67.11,191.14,191.42-.12,426.8,0ZM85.5,426.47C85.26,615.09,238,767.94,426.71,768c188.49,0,341-152.31,341.26-341S615.52,85.53,426.76,85.5C238.23,85.47,85.75,237.82,85.5,426.47Z"/><path d="M426.46,256c-47.09,1-87.6,17.3-120.63,50.49-32.87,33-49,73.41-49.87,120.08H171.28c-3.29-136.12,114-257.59,255.18-255.36Z"/>
                                <path d="M512,426.48a85.66,85.66,0,1,1-85.11-85.83A85.42,85.42,0,0,1,512,426.48Z"/>
                            </g>
                        </g>
                    </svg>
                    <span>
                        <AlbumControl class="al-ctl" 
                            :visitable="true" 
                            :platform="track.platform" 
                            :data="track.album">
                        </AlbumControl>
                    </span>
                </div>
            </div>
        </div>
        <div class="center" 
            ref="lyricWrapRef" 
            :draggable="isDndSaveEnable" 
            @dragstart="dndSaveLyric">
            <div v-show="lyricExistState == -1" class="no-lyric">
                <span v-show="!Playlist.isFMRadioType(track)">歌词加载中，请先欣赏音乐吧~</span>
                <span v-show="Playlist.isFMRadioType(track)">简介加载中，请先欣赏音乐吧~</span>
            </div>
            <div v-show="lyricExistState == 0" class="no-lyric">
                <span v-show="!Playlist.isFMRadioType(track)">暂无歌词，请继续欣赏音乐吧~</span>
                <span v-show="Playlist.isFMRadioType(track)">暂无简介，请继续聆听电台吧~</span>
            </div>
            <div v-for="([key, value], index) in lyricData" 
                v-show="lyricExistState == 1 && showByLayoutMode(key, value, index)" 
                class="line" 
                :class="{
                    first: index == 0,
                    last: index == (lyricData.size - 1),
                    'content-text-highlight': index == currentIndex,
                    current: index == currentIndex,
                    'locator-current': (index == scrollLocatorCurrentIndex && index != currentIndex && isUserMouseWheel)
                }"
                :timeKey="key"
                :index="index">
                <div class="text" :timeKey="key" :index="index" v-html="value"></div>
                <div class="extra-text" v-show="isExtraTextActived"></div>
            </div>
        </div>
        <div class="scroll-locator" :class="{ 'scroll-locator-left': (lyric.alignment == 2) }"
            v-show="(lyricExistState == 1) && isUserMouseWheel">
            <span class="time-text" v-html="scrollLocatorTimeText"></span>
            <div class="play-btn" @click="seekFromLyric">
                <svg width="12" height="12" 
                    viewBox="0 0 139 139" xml:space="preserve" 
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink">
                    <path
                        d="M117.037,61.441L36.333,14.846c-2.467-1.424-5.502-1.424-7.972,0c-2.463,1.423-3.982,4.056-3.982,6.903v93.188  c0,2.848,1.522,5.479,3.982,6.9c1.236,0.713,2.61,1.067,3.986,1.067c1.374,0,2.751-0.354,3.983-1.067l80.704-46.594  c2.466-1.422,3.984-4.054,3.984-6.9C121.023,65.497,119.502,62.866,117.037,61.441z" />
                </svg>
            </div>
        </div>
        <!--
        <div class="trans-btn extra-btn" v-show="Track.hasLyricTrans(track) && isFullLayoutMode">
            <span :class="{ active: lyricTransActived }" @click="toggleLyricTrans">译</span>
        </div>
        <div class="roma-btn extra-btn" v-show="Track.hasLyricRoma(track) && isFullLayoutMode">
            <span :class="{ active: lyricRomaActived }" @click="toggleLyricRoma">音</span>
        </div>
        -->
        <div class="trans-btn extra-btn" 
            :class="{ active: lyricTransActived }"
            v-show="Track.hasLyricTrans(track) && isFullLayoutMode && isPlayingViewLyricTransBtnShow"
            @click="toggleLyricTrans" >
            <svg width="17" height="17" viewBox="0 0 22.82 19.41" xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <path d="M17.07,6l5.75,1.27c-.08,1.12-.65,1.47-1.75,1.16q-2.57-.75-5.15-1.36a2.64,2.64,0,0,0-1.34,0c-1.76.47-3.49,1-5.24,1.5-1.28.34-1.29.29-1.91-1L13.33,6c-1-1.29-1.81-2.52-2.79-3.63C10.24,2,9.55,2,9,1.84V.67h11.9C21.07,3.39,18.87,4.39,17.07,6ZM12.5,2.11l-.22.32c.89.79,1.77,1.59,2.66,2.36a.61.61,0,0,0,.54.12,8.8,8.8,0,0,0,3.34-2.8Z"/>
                        <path d="M8.61,14.22h5.64V11.9H9.72V10.35h4.51l.2-1.91h1.72l.19,1.91h4.82v1.5H16.33v2.37h6.11l.08,1.49H16.29v3.7H14.36V15.78H8.61Z"/>
                        <path d="M5.27,6.32v9.09l2.33-2A1.61,1.61,0,0,1,7.16,16C6,16.79,4.85,17.73,3.7,18.63l-.45-.16c0-.65.1-1.31.16-2,0-.12.07-.23.07-.35V7.75H0V6.32Z"/>
                        <path d="M7.25,3.19,6,4.3,1.79,1c.82-1.25,1-1.31,2.12-.46S6.07,2.26,7.25,3.19Z"/>
                    </g>
                </g>
            </svg>
        </div>
    </div>
</template>

<style scoped>
.lyric-ctl {
    display: flex;
    flex-direction: column;
    text-align: left;
}

.lyric-ctl .spacing {
    margin-top: 10px;
}

.lyric-ctl .header {
    max-height: 202px;
    margin-left: var(--lyric-margin-left);
}

.lyric-ctl .header b {
    margin-right: 3px;
    min-width: 43px;
}

.lyric-ctl .mv {
    margin-right: 6px;
}

.lyric-ctl .mv svg {
    fill: var(--button-icon-btn-color);
    cursor: pointer;
}

.lyric-ctl .mv:hover svg {
    fill: var(--content-highlight-color);
}

.lyric-ctl .audio-title {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;

    font-size: var(--lyric-title-text-size);
    font-weight: bold;
    margin-bottom: 6px;

    word-wrap: break-word;
    line-break: anywhere;
}

.lyric-ctl.none-aral-meta .audio-title {
    margin-bottom: 25px !important;
}

.lyric-ctl .audio-title.single-line {
    -webkit-line-clamp: 1;
    line-clamp: 1;
}

.lyric-ctl .audio-artist,
.lyric-ctl .audio-album {
    /*font-size: 18px;*/
    font-weight: bold;
    color: var(--content-subtitle-text-color);
    display: flex;
    align-items: center;
}

.lyric-ctl .audio-artist .ar-ctl,
.lyric-ctl .audio-album .al-ctl {
    -webkit-line-clamp: 1;
    line-clamp: 1;
    font-size: var(--lyric-aral-text-size);
}

.lyric-ctl .audio-artist-album-wrap {
    display: flex;
    align-items: center;
    margin-top: 15px;
}

.lyric-ctl .audio-artist b,
.lyric-ctl .audio-album b,
.lyric-ctl .audio-artist svg,
.lyric-ctl .audio-album svg {
    margin-right: 6px;
    min-width: max-content;
}

.lyric-ctl .audio-artist svg,
.lyric-ctl .audio-album svg {
    --aral-svg-transform: scale(1);
    transform: var(--aral-svg-transform);
}

.lyric-ctl .audio-artist svg {
    transform: var(--aral-svg-transform) scaleY(0.95);
}

.lyric-ctl .audio-artist-album-wrap .audio-album.spacing1 {
    margin-left: 30px;
}

.lyric-ctl .center {
    position: relative;
    height: 100%;
    overflow: auto;
    margin-top: 15px;
    padding-right: 6px;
    padding-bottom: 15px;
    -webkit-mask-image: var(--lyric-mask);
    mask-image: var(--lyric-mask);
}

.lyric-ctl .lyric-content {
    overflow: scroll;
}

.lyric-ctl .center::-webkit-scrollbar,
.lyric-ctl .lyric-content::-webkit-scrollbar {
    display: none;
}

.lyric-ctl .center .line {
    font-size: var(--lyric-text-size);
    line-height: var(--lyric-line-height);
    margin-top: var(--lyric-line-spacing);
    padding-left: var(--lyric-margin-left);
    font-weight: var(--lyric-font-weight);
    color: var(--content-subtitle-text-color);
    word-break: break-word;
    /*word-wrap: break-word;*/
}

.lyric-ctl .center .current {
    font-size: var(--lyric-hl-text-size);
    font-weight: bold !important;
}

/*TODO 窗口大小变化后，无法自适应 */
.lyric-ctl .center .first {
    /*margin-top: 168px !important;*/
    margin-top: 258px !important;
}

.lyric-ctl .center .last {
    /*margin-bottom: 233px !important;*/
    margin-bottom: 366px !important;
}

.lyric-ctl .no-lyric {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: center;
    padding-left: var(--lyric-margin-left);
    justify-content: flex-start;
    font-size: 23px;
    font-weight: bold !important;
    color: var(--text-lyric-color);
}

.lyric-ctl .center .line .extra-text {
    /*margin-top: 3px;*/
    color: var(--content-subtitle-text-color) !important;
}

.lyric-ctl .center .current .extra-text {
    /*margin-top: 3px;*/
    color: var(--content-text-color) !important;
}

.lyric-ctl .scroll-locator {
    position: fixed;
    right: 50px;
    top: 50%;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.lyric-ctl .scroll-locator-left {
    right: auto;
    left: 50%;
    margin-left: 33px;
}

.lyric-ctl .center .locator-current,
.lyric-ctl .center .locator-current .text,
.lyric-ctl .center .locator-current .extra-text {
    color: var(--content-text-color) !important;
    font-weight: bold !important;
}

.lyric-ctl .scroll-locator .time-text {
    font-size: 15px;
    font-weight: 500;
}

/*
.lyric-ctl .scroll-locator .time-text::before {
    content: '';
    display: inline-block;
    width: 366px;
    height: 1px;
    margin-right: 10px;
    margin-bottom: 3px;
    border-bottom: 1px dashed var(--content-text-highlight-color);
}
*/

.lyric-ctl .scroll-locator .play-btn {
    /*margin-top: 16px;*/
    border-radius: 10rem;
    width: 23px;
    height: 23px;
    background: var(--button-icon-text-btn-bg-color);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 5px;
}

.lyric-ctl .scroll-locator .play-btn:hover {
    background: var(--button-icon-text-btn-hover-bg-color);
    transform: scale(1.1);
}

.lyric-ctl .scroll-locator .play-btn svg {
    fill: var(--button-icon-text-btn-icon-color) !important;
    transform: translateX(0.5px) translateY(0.5px);
}


.lyric-ctl .extra-btn {
    position: fixed;
    right: var(--others-lyric-ctl-extra-btn-right);
    bottom: var(--others-lyric-ctl-extra-btn-bottom);
    border: 1.25px solid var(--border-color);
    border-radius: calc(var(--border-flow-btn-border-radius) - 3px);
    padding: 4px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.lyric-ctl .extra-btn svg { 
    transform: scaleY(1.1);
}

.lyric-ctl .extra-btn.active {
    border-color: var(--content-highlight-color);
}

.lyric-ctl .extra-btn.active svg { 
    fill: var(--content-highlight-color) !important;
}


/*
.lyric-ctl .extra-btn span {
    border: 1.25px solid var(--content-subtitle-text-color);
    border-radius: 3px;
    padding: 1px 2px;
    font-size: var(--content-text-tip-text-size);
    font-size: var(--content-text-size);
    cursor: pointer;
    color: var(--content-subtitle-text-color);
    font-weight: bold;
}

.lyric-ctl .extra-btn .active,
.lyric-ctl .extra-btn span:hover {
    background: var(--content-text-highlight-color);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    border-color: var(--content-highlight-color);
}
*/

.lyric-ctl.align-left {
    text-align: left;
}

.lyric-ctl.align-left .audio-artist,
.lyric-ctl.align-left .audio-album,
.lyric-ctl.align-left .audio-artist-album-wrap,
.lyric-ctl.align-left .no-lyric {
    justify-content: flex-start;
}

.lyric-ctl.align-center {
    text-align: center;
}

.lyric-ctl.align-center .audio-artist,
.lyric-ctl.align-center .audio-album,
.lyric-ctl.align-center .audio-artist-album-wrap,
.lyric-ctl.align-center .no-lyric {
    justify-content: center;
}

.lyric-ctl.align-right {
    text-align: right;
}

.lyric-ctl.align-right .audio-artist,
.lyric-ctl.align-right .audio-album,
.lyric-ctl.align-right .audio-artist-album-wrap,
.lyric-ctl.align-right .no-lyric {
    justify-content: flex-end;
}
</style>