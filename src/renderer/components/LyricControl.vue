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
import { isDevEnv, smoothScroll, toMMssSSS, toMillis } from '../../common/Utils';
import { Lyric } from '../../common/Lyric';
import { onEvents, emitEvents, offEvents } from '../../common/EventBusWrapper';



const props = defineProps({
    track: Object, //Track
    currentTime: Number
})

const { playMv, loadLyric, currentTimeState,
    seekTrack, playState, progressSeekingState,
    dndSaveLyric } = inject('player')

const { playingViewShow } = storeToRefs(useAppCommonStore())
const { toggleLyricToolbar } = useAppCommonStore()
const { lyric, lyricTransActived, lyricRomaActived, isDndSaveEnable, } = storeToRefs(useSettingStore())
const { toggleLyricTrans, toggleLyricRoma, getStateRefreshFrequency } = useSettingStore()
//const { currentTrack } = storeToRefs(usePlayStore())

const currentIndex = ref(-1)
//const hasLyric = ref(false)
const lyricData = ref(Track.lyricData(props.track))
let presetOffset = Track.lyricOffset(props.track)
const lyricTransData = ref(Track.lyricTransData(props.track))
const lyricRomaData = ref(Track.lyricRomaData(props.track))


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


const renderAndScrollLyric = (secs) => {
    if (!isLyricReady()) return
    if (isSeeking.value) return

    const { offset: userOffset } = lyric.value
    const trackTime = Math.max(0, (secs * 1000 + presetOffset + userOffset))

    //Highlight 查找当前高亮行index
    const lyricWrap = document.querySelector(".lyric-ctl .center")
    if (!lyricWrap) return
    const lines = lyricWrap.querySelectorAll('.line')

    let index = -1, timeKey = null
    for (var i = 0; i < lines.length; i++) {
        timeKey = lines[i].getAttribute('timeKey')
        const lineTime = toMillis(timeKey)
        if (trackTime < lineTime) break
        index = i
    }

    nextTick(setupLyricLines)

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

    //懒得再计算相邻两句歌词之间的时间间隔了，暂时感觉不是很必要
    const frequency = getStateRefreshFrequency()
    const duration = 300 * frequency / 60
    smoothScroll(lyricWrap, destScrollTop, duration, 5, () => {
        return (isUserMouseWheel.value || isSeeking.value || progressSeekingState.value)
    })
}

const safeRenderAndScrollLyric = (secs) => {
    try {
        renderAndScrollLyric(secs)
    } catch (error) {
        if (isDevEnv()) console.log(error)
    }
}

const resetLyricState = (track, state) => {
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
    if(!track) return
    /*
    let isExist = false
    if (Track.hasLyric(track)) { //确认是否存在有效歌词
        const lyricData = Track.lyricData(track)
        let isValidLyric = true
        if (lyricData.size <= 8) {
            const linesIter = lyricData.values()
            let line = linesIter.next()
            while (!line.done) {
                const lineText = line.value
                isValidLyric = !(lineText.includes('纯音乐')
                    || lineText.includes('暂无歌词')
                    || lineText.includes('没有填词')
                    || lineText.includes('没有歌词'))
                if (!isValidLyric) break
                line = linesIter.next()
            }
        }
        isExist = isValidLyric
    }
    */
    let isExist = Track.hasLyric(track)
    //歌词存在，但需进一步确认是否有效
    if(isExist) {
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
        //setupLyricLines()
        setupLyricExtra()
        safeRenderAndScrollLyric(currentTimeState.value, true)
    })
    //setTimeout(setupLyricLines, 300)

}

const onUserMouseWheel = (event) => {
    //event.preventDefault()
    setUserMouseWheel(true)
    if (userMouseWheelTimer) clearTimeout(userMouseWheelTimer)
    userMouseWheelTimer = setTimeout(() => setUserMouseWheel(false), 2888)
    updateScrollLocatorTime()
}

const setLyricLineStyle = (line) => {
    if(!line) return
    const { fontSize, hlFontSize, fontWeight, lineHeight, lineSpacing } = lyric.value

    const textEl = line.querySelector('.text')
    const extraTextEl = line.querySelector('.extra-text')

    if (!textEl || !textEl.style) return

    textEl.style.lineHeight = `${lineHeight}px`
    //textEl.style.marginTop = `${lineSpacing}px`
    if(extraTextEl) extraTextEl.style.lineHeight = `${lineHeight}px`

    //行间距
    line.style.marginTop = `${lineSpacing}px`

    //是否为当前高亮行
    const isCurrent = line.classList.contains('current')
    line.style.fontSize = isCurrent ? `${hlFontSize}px` : `${fontSize}px`
    line.style.fontWeight = isCurrent ? 'bold' : fontWeight
}

const setupLyricLines = () => {
    const lines = document.querySelectorAll('.lyric-ctl .center .line') || []
    lines.forEach(line => setLyricLineStyle(line))
}

const setupLyricAlignment = () => {
    const lyricCtlEls = document.querySelectorAll('.lyric-ctl')
    const artistEls = document.querySelectorAll('.lyric-ctl .audio-artist')
    const albumEls = document.querySelectorAll('.lyric-ctl .audio-album')
    const noLyricEls = document.querySelectorAll('.lyric-ctl .no-lyric')
    const textAligns = ['left', 'center', 'right']
    const flexAligns = ['flex-start', 'center', 'flex-end']
    const { alignment } = lyric.value
    if (lyricCtlEls) lyricCtlEls.forEach(el => el.style.textAlign = textAligns[alignment])
    if (artistEls) artistEls.forEach(el => el.style.justifyContent = flexAligns[alignment])
    if (albumEls) albumEls.forEach(el => el.style.justifyContent = flexAligns[alignment])
    if (noLyricEls) noLyricEls.forEach(el => el.style.justifyContent = flexAligns[alignment])

}

const isHeaderVisible = () => (lyric.value.metaPos == 0)

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
const setupLyricExtra = () => {
    const lines = document.querySelectorAll('.lyric-ctl .center .line') || []
    try {
        lines.forEach((line, index) => {
            const extraTextEl = line.querySelector('.extra-text')
            if (!extraTextEl) return
            //1、重置
            extraTextEl.innerHTML = null

            //2、重新赋值
            const extraTextMap = lyricTransData.value || lyricRomaData.value
            if (!extraTextMap || !extraTextMap.get) return
            const timeKey = line.getAttribute('timeKey')
            if (!timeKey) return
            let extraText = null
            //算法简单粗暴，最坏情况11次尝试！！！
            //一般来说，同一平台下同一首歌曲的所有歌词行的误差值基本是一样的，因此可以利用这点简单优化一下
            //即只要确定第一行的误差值，后面的歌词行全部直接优先使用该误差值进行匹配，不必每次都按固定顺序遍历数组
            //目前来说，即使不优化，对性能方面影响也不算大
            const timeErrors = [0, 10, -10, 20, -20, 30, -30, 40, -40, 50, -50]
            for (var i = 0; i < timeErrors.length; i++) {
                const timeError = timeErrors[i]
                extraText = extraTextMap.get(getExtraTimeKey(timeKey, timeError))
                if (extraText) break
            }
            if (extraText && extraText != '//') extraTextEl.innerHTML = extraText
        })
    } catch (error) {
        console.log(error)
    }
}

const loadTrackLyric = (track) => {
    if(!track) return
    if(Track.hasLyric(track)) return reloadLyricData(track)
    
    resetLyricState(track)
    loadLyric(track)
}



/* 生命周期、监听 */
watch(() => props.currentTime, (nv, ov) => {
    //TODO 暂时简单处理，播放页隐藏时直接返回
    if (!playingViewShow.value) return
    safeRenderAndScrollLyric(nv)
}, { immediate: true })

watch(() => props.track, (nv, ov) => loadTrackLyric(nv), { immediate: true })

const eventsRegistration = {
    'track-lyricLoaded': reloadLyricData,
    'track-noLyric': reloadLyricData,
    'lyric-userMouseWheel': onUserMouseWheel,
    'lyric-fontSize': setupLyricLines,
    'lyric-hlFontSize': setupLyricLines,
    'lyric-fontWeight': setupLyricLines,
    'lyric-lineHeight': setupLyricLines,
    'lyric-lineSpacing': setupLyricLines,
    'lyric-alignment': setupLyricAlignment,
    'playingView-changed': setupLyricAlignment,
    'track-lyricRestore': () => setLyricExistState(-1),
}

onMounted(() => {
    onEvents(eventsRegistration)
    loadTrackLyric(props.track)
})
onUnmounted(() => offEvents(eventsRegistration))
</script>

<template>
    <div class="lyric-ctl" @contextmenu="toggleLyricToolbar">
        <div class="header" v-show="isHeaderVisible()">
            <div class="audio-title">
                <span class="mv" v-show="Track.hasMv(track)">
                    <svg @click="playMv(track)" 
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
            <div class="audio-artist spacing">
                <b v-show="!Playlist.isFMRadioType(track)">歌手:</b>
                <b v-show="Playlist.isFMRadioType(track)">平台:</b>
                <span>
                    <ArtistControl class="ar-ctl" 
                        :visitable="true" 
                        :platform="track.platform" 
                        :data="track.artist" 
                        :trackId="track.id">
                    </ArtistControl>
                </span>
            </div>
            <div class="audio-album spacing">
                <b v-show="!Playlist.isFMRadioType(track)">专辑:</b>
                <b v-show="Playlist.isFMRadioType(track)">标签:</b>
                <span>
                    <AlbumControl class="al-ctl" 
                        :visitable="true" 
                        :platform="track.platform" 
                        :data="track.album">
                    </AlbumControl>
                </span>
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
                v-show="lyricExistState == 1" 
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
                <svg width="9" height="9" 
                    viewBox="0 0 139 139" xml:space="preserve" 
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink">
                    <path
                        d="M117.037,61.441L36.333,14.846c-2.467-1.424-5.502-1.424-7.972,0c-2.463,1.423-3.982,4.056-3.982,6.903v93.188  c0,2.848,1.522,5.479,3.982,6.9c1.236,0.713,2.61,1.067,3.986,1.067c1.374,0,2.751-0.354,3.983-1.067l80.704-46.594  c2.466-1.422,3.984-4.054,3.984-6.9C121.023,65.497,119.502,62.866,117.037,61.441z" />
                </svg>
            </div>
        </div>
        <div class="trans-btn extra-btn" v-show="Track.hasLyricTrans(track)">
            <span :class="{ active: lyricTransActived }" @click="toggleLyricTrans">译</span>
        </div>
        <div class="roma-btn extra-btn" v-show="Track.hasLyricRoma(track)">
            <span :class="{ active: lyricRomaActived }" @click="toggleLyricRoma">音</span>
        </div>
    </div>
</template>

<style scoped>
.lyric-ctl {
    display: flex;
    flex-direction: column;
    text-align: left;
    --lyric-mask: linear-gradient(transparent 0%, #fff 20%, #fff 80%, transparent 100%);
    --lyric-margin-left: 10px
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

    font-size: var(--content-text-module-title-size);
    font-weight: bold;
    margin-bottom: 6px;

    word-wrap: break-word;
    line-break: anywhere;
}

.lyric-ctl .audio-artist,
.lyric-ctl .audio-album {
    /*font-size: 18px;*/
    font-weight: bold;
    color: var(--content-subtitle-text-color);
    display: flex;
}

.lyric-ctl .audio-artist .ar-ctl,
.lyric-ctl .audio-album .al-ctl {
    -webkit-line-clamp: 1;
    line-clamp: 1;
}

.lyric-ctl .center {
    position: relative;
    /*height: 399px;*/
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
    font-size: 22px;
    line-height: 28px;
    margin-top: 28px;
    padding-left: var(--lyric-margin-left);
    color: var(--content-subtitle-text-color);
    word-break: break-word;
    /*word-wrap: break-word;*/
}

.lyric-ctl .center .current {
    font-size: 22px;
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
    font-size: 14px;
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
    width: 18px;
    height: 18px;
    background: var(--button-icon-text-btn-bg-color);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 5px;
}

.lyric-ctl .scroll-locator .play-btn:hover {
    background: var(--button-icon-text-btn-hover-bg-color);
}

.lyric-ctl .scroll-locator .play-btn svg {
    margin-left: 1px;
    fill: var(--button-icon-text-btn-icon-color) !important;
}


.lyric-ctl .extra-btn {
    position: fixed;
    right: var(--others-lyric-ctl-extra-btn-right);
    bottom: var(--others-lyric-ctl-extra-btn-bottom);
}

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
</style>