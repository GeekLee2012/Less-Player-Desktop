<script setup>
import { watch, ref, onMounted, inject, onUnmounted, nextTick, onUpdated } from 'vue';
import { storeToRefs } from 'pinia';
import EventBus from '../../common/EventBus';
import { Track } from '../../common/Track';
import { toMMssSSS, toMmss, toMillis } from '../../common/Times';
import ArtistControl from './ArtistControl.vue';
import AlbumControl from './AlbumControl.vue';
import { usePlayStore } from '../store/playStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';
import { PLAY_STATE } from '../../common/Constants';
import { smoothScroll } from '../../common/Utils';



const props = defineProps({
    track: Object, //Track
    currentTime: Number
})

const { playMv, loadLyric, currentTimeState, seekTrack, playState } = inject('player')

const { playingViewShow } = storeToRefs(useAppCommonStore())
const { toggleLyricToolbar } = useAppCommonStore()
const { lyric, lyricTransActived } = storeToRefs(useSettingStore())
const { toggleLyricTrans } = useSettingStore()
//const { currentTrack } = storeToRefs(usePlayStore())

const currentIndex = ref(-1)
const hasLyric = ref(false)
const lyricData = ref(Track.lyricData(props.track))
let presetOffset = Track.lyricOffset(props.track)
const lyricTransData = ref(Track.lyricTransData(props.track))


const isUserMouseWheel = ref(false)
let userMouseWheelCancelTimer = null
const isSeeking = ref(false)

const setLyricExist = (value) => hasLyric.value = value
const setLyricData = (value) => lyricData.value = value
const setPresetOffset = (value) => presetOffset = value
const setLyricCurrentIndex = (value) => currentIndex.value = value
const setUserMouseWheel = (value) => isUserMouseWheel.value = value
const setSeeking = (value) => isSeeking.value = value
const setLyricTransData = (value) => lyricTransData.value = value


const renderAndScrollLyric = (secs) => {
    if (!hasLyric.value) return
    if (isSeeking.value) return

    const userOffset = lyric.value.offset
    const trackTime = Math.max(0, (secs * 1000 + presetOffset + userOffset))

    //Highlight
    const lyricWrap = document.querySelector(".lyric-ctl .center")
    const lines = lyricWrap.querySelectorAll('.line')

    let index = -1
    for (var i = 0; i < lines.length; i++) {
        const timeKey = lines[i].getAttribute('time-key')
        const lineTime = toMillis(timeKey)
        if (trackTime >= lineTime) {
            index = i
        } else if (trackTime < lineTime) {
            break
        }
    }

    nextTick(setupLyricLines)

    if (index >= 0) {
        setLyricCurrentIndex(index)
    } else {
        index = 0
    }

    if (isUserMouseWheel.value || isSeeking.value) return
    //Scroll

    ////算法1: 基于百分比定位 ////
    //当歌词存在换行时，无法保证准确定位
    //且当前高亮行也无法保证在可视区居中
    /*
    const scrollIndex = index > 1 ? (index - 1) : 0
    const scrollHeight = lyricWrap.scrollHeight
    const clientHeight = lyricWrap.clientHeight
    const maxScrollTop = scrollHeight - clientHeight
    const destScrollTop = maxScrollTop * (scrollIndex / (lines.length - 1))
    lyricWrap.scrollTop = destScrollTop
    //smoothScroll(lyricWrap, 300)
    */

    ////算法2：歌词可视区居中，依赖offsetParent定位 ////
    //基本保证：准确定位，当前高亮行基本在歌词可视区居中
    //offsetTop：元素到offsetParent顶部的距离
    //offsetParent：距离元素最近的一个具有定位的祖宗元素（relative，absolute，fixed），若祖宗都不符合条件，offsetParent为body
    /* 
    const destScrollTop = lines[index].offsetTop - lyricWrap.clientHeight / 2
    lyricWrap.scrollTop = Math.max(destScrollTop, 0)
    */

    ////算法3：依赖offsetParent定位；与算法2相似，只是参考系不同而已 ////
    //基本保证：准确定位，当前高亮行在播放页垂直居中，且基本与ScrollLocator平行
    //绝对意义上来说，并不垂直居中，也并不平行，因为歌词行自身有一定高度
    const { offsetTop } = lyricWrap
    const { clientHeight } = document.documentElement
    const destScrollTop = lines[index].offsetTop - (clientHeight / 2 - offsetTop)
    //lyricWrap.scrollTop = destScrollTop
    //暂时随意设置时间值300左右吧，懒得再计算相邻两句歌词之间的时间间隔了，感觉不是很必要
    smoothScroll(lyricWrap, destScrollTop, 288)
}

const safeRenderAndScrollLyric = (secs) => {
    try {
        renderAndScrollLyric(secs)
    } catch (error) {
        console.log(error)
    }
}

//TODO
const resetDefaultLyricScrollTop = () => {
    const lyricWrap = document.querySelector(".lyric-ctl .center")
    if (!lyricWrap) return
    //const { offsetTop } = lyricWrap
    //const { clientHeight } = document.documentElement
    lyricWrap.scrollTop = 129
}

//重新加载歌词
const reloadLyricData = (track) => {
    let isExist = false
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
        isExist = isValidLyric
    }
    //重置数据
    setLyricExist(isExist)
    setLyricData(Track.lyricData(track))
    setLyricTransData(Track.lyricTransData(track))
    setPresetOffset(Track.lyricOffset(track))
    setLyricCurrentIndex(-1)
    setSeeking(false)
    //重置滚动条位置
    //resetDefaultLyricScrollTop()
    //重新设置样式
    nextTick(() => {
        //setupLyricLines()
        setupLyricTrans()
        safeRenderAndScrollLyric(props.currentTime)
    })
    //setTimeout(setupLyricLines, 300)
}

const onUserMouseWheel = (e) => {
    //e.preventDefault()
    setUserMouseWheel(true)
    if (userMouseWheelCancelTimer) clearTimeout(userMouseWheelCancelTimer)
    userMouseWheelCancelTimer = setTimeout(() => {
        setUserMouseWheel(false)
    }, 3000)
    updateScrollLocatorTime()
}

const setLyricLineStyle = (line) => {
    const { fontSize, hlFontSize, fontWeight, lineHeight, lineSpacing } = lyric.value

    line.style.lineHeight = lineHeight + "px"
    line.style.marginTop = lineSpacing + "px"

    const classAttr = line.getAttribute('class')
    if (classAttr.includes('current')) { //高亮行
        line.style.fontSize = hlFontSize + "px"
        line.style.fontWeight = 'bold'
    } else { //普通行
        line.style.fontSize = fontSize + "px"
        line.style.fontWeight = fontWeight
    }
}

const setupLyricLines = () => {
    const lines = document.querySelectorAll(".lyric-ctl .center .line")
    if (lines) lines.forEach(line => setLyricLineStyle(line))
}

const setupLyricAlignment = () => {
    const lyricCtlEls = document.querySelectorAll(".lyric-ctl")
    const artistEls = document.querySelectorAll(".lyric-ctl .audio-artist")
    const albumEls = document.querySelectorAll(".lyric-ctl .audio-album")
    const noLyricEls = document.querySelectorAll(".lyric-ctl .no-lyric")
    const textAligns = ['left', 'center', 'right']
    const flexAligns = ['flex-start', 'center', 'flex-end']
    const { alignment } = lyric.value
    if (lyricCtlEls) lyricCtlEls.forEach(el => el.style.textAlign = textAligns[alignment])
    if (artistEls) artistEls.forEach(el => el.style.justifyContent = flexAligns[alignment])
    if (albumEls) albumEls.forEach(el => el.style.justifyContent = flexAligns[alignment])
    if (noLyricEls) noLyricEls.forEach(el => el.style.justifyContent = flexAligns[alignment])

    setupLyricScrollLocator()
}

const isHeaderVisible = () => (lyric.value.metaPos == 0)

//播放到指定歌词行，即通过歌词调整歌曲进度
const scrollLocatorTime = ref(0)
const scrollLocatorTimeText = ref('00:00')
const scrollLocatorCurrentIndex = ref(-1)

const setScrollLocatorTime = (value) => scrollLocatorTime.value = value
const setScrollLocatorTimeText = (value) => scrollLocatorTimeText.value = value
const setScrollLocatorCurrentIndex = (value) => scrollLocatorCurrentIndex.value = value

const setupLyricScrollLocator = () => {
    const locatorEl = document.querySelector('.lyric-ctl .scroll-locator')
    if (!locatorEl) return
    //const { clientHeight, clientWidth } = document.documentElement
    //locatorEl.style.top = (clientHeight / 2) + 'px'

    const { clientWidth } = document.documentElement
    const lyricEl = document.querySelector('.lyric-ctl .center')
    let leftAlignPos = clientWidth / 2 - 100
    if (lyricEl) leftAlignPos = Math.max(lyricEl.clientWidth, leftAlignPos)

    const { alignment } = lyric.value
    //const flexAligns = ['flex-start', 'center', 'flex-end']
    const locatorPositions = ['80px', '80px', leftAlignPos + 'px']
    locatorEl.style.right = locatorPositions[alignment]
    //locatorEl.style.justifyContent = flexAligns[alignment]
}

const updateScrollLocatorTime = () => {
    const locatorEl = document.querySelector('.lyric-ctl .scroll-locator')
    if (!locatorEl) return
    const lyricEl = document.querySelector('.lyric-ctl .center')
    if (!lyricEl) return
    const x = lyricEl.offsetLeft + 88
    const y = locatorEl.offsetTop
    const pointEl = document.elementFromPoint(x, y)
    if (!pointEl) return
    const timekey = pointEl.getAttribute('time-key')
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
    if (current < 0) return

    setUserMouseWheel(false)
    setSeeking(true)
    const percent = current / duration
    seekTrack(percent)
    setSeeking(false)
    setScrollLocatorCurrentIndex(-1)
}

//TODO 暂停状态下，歌词状态没有同步
const restoreLyricPausedState = () => {
    if (playState.value == PLAY_STATE.PAUSE) safeRenderAndScrollLyric(props.currentTime)
}

const getTransTimeKey = (mmssSSS, offset) => {
    let transTimeKey = toMMssSSS(toMillis(mmssSSS) + (offset || 0))
    //if (transTimeKey) transTimeKey = transTimeKey.replace(/\.0/g, '.')
    return transTimeKey || mmssSSS
}

//歌词翻译
const setupLyricTrans = () => {
    const lines = document.querySelectorAll(".lyric-ctl .center .line")
    if (lines) {
        try {
            lines.forEach((line, index) => {
                const timeKey = line.getAttribute('time-key')
                if (!timeKey) return
                const transEl = line.querySelector('.trans-text')
                if (!transEl) return
                transEl.innerHTML = null //重置
                const transMap = lyricTransData.value
                if (!transMap) return
                //TODO 算法简单粗暴，最坏情况11次尝试！！！
                const transText = transMap.get(getTransTimeKey(timeKey))
                    || transMap.get(getTransTimeKey(timeKey, 10))
                    || transMap.get(getTransTimeKey(timeKey, -10))
                    || transMap.get(getTransTimeKey(timeKey, 20))
                    || transMap.get(getTransTimeKey(timeKey, -20))
                    || transMap.get(getTransTimeKey(timeKey, 30))
                    || transMap.get(getTransTimeKey(timeKey, -30))
                    || transMap.get(getTransTimeKey(timeKey, 40))
                    || transMap.get(getTransTimeKey(timeKey, -40))
                    || transMap.get(getTransTimeKey(timeKey, 50))
                    || transMap.get(getTransTimeKey(timeKey, -50))
                if (transText && transText != '//') transEl.innerHTML = transText
            })
        } catch (error) {
            console.log(error)
        }
    }
}

//EventBus事件
EventBus.on('track-lyricLoaded', reloadLyricData)
EventBus.on('track-noLyric', reloadLyricData)
EventBus.on('lyric-userMouseWheel', onUserMouseWheel)
EventBus.on('lyric-fontSize', setupLyricLines)
EventBus.on('lyric-hlFontSize', setupLyricLines)
EventBus.on('lyric-fontWeight', setupLyricLines)
EventBus.on('lyric-lineHeight', setupLyricLines)
EventBus.on('lyric-lineSpacing', setupLyricLines)
EventBus.on('lyric-alignment', setupLyricAlignment)
//EventBus.on('app-resize', setupLyricScrollLocator)
EventBus.on('playingView-changed', () => {
    //restoreLyricPausedState()
    setupLyricAlignment()
})

watch(isUserMouseWheel, setupLyricScrollLocator)

watch(() => props.currentTime, (nv, ov) => {
    //TODO 暂时简单处理，播放页隐藏时直接返回
    if (!playingViewShow.value) return
    safeRenderAndScrollLyric(nv)
}, { immediate: true })

watch(() => props.track, loadLyric, { immediate: true })
</script>

<template>
    <div class="lyric-ctl" @contextmenu="toggleLyricToolbar">
        <div class="header" v-show="isHeaderVisible()">
            <div class="audio-title">
                <span class="mv" v-show="Track.hasMv(track)">
                    <svg @click="playMv(track)" width="20" height="16" viewBox="0 0 1024 853.52"
                        xmlns="http://www.w3.org/2000/svg">
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
                <b>歌手:</b>
                <span>
                    <ArtistControl :visitable="true" :platform="track.platform" :data="track.artist" :trackId="track.id"
                        class="ar-ctl">
                    </ArtistControl>
                </span>
            </div>
            <div class="audio-album spacing">
                <b>专辑:</b>
                <span>
                    <AlbumControl :visitable="true" :platform="track.platform" :data="track.album" class="al-ctl">
                    </AlbumControl>
                </span>
            </div>
        </div>
        <div class="center" ref="lyricWrapRef">
            <div v-show="!hasLyric" class="no-lyric">
                <label>暂无歌词，请继续欣赏音乐吧~</label>
            </div>
            <div v-show="hasLyric" v-for="(item, index) in lyricData" class="line" :time-key="item[0]" :index="index"
                :class="{
                        first: index == 0,
                        last: index == (lyricData.size - 1),
                        current: index == currentIndex,
                        locatorCurrent: (index == scrollLocatorCurrentIndex && isUserMouseWheel)
                    }">
                <div class="text" :time-key="item[0]" :index="index" v-html="item[1]"></div>
                <div class="trans-text" v-show="lyricTransActived"></div>
            </div>
        </div>
        <div class="scroll-locator" v-show="hasLyric && isUserMouseWheel">
            <span class="time-text" v-html="scrollLocatorTimeText"></span>
            <div class="play-btn" @click="seekFromLyric">
                <svg width="9" height="9" viewBox="0 0 139 139" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink">
                    <path
                        d="M117.037,61.441L36.333,14.846c-2.467-1.424-5.502-1.424-7.972,0c-2.463,1.423-3.982,4.056-3.982,6.903v93.188  c0,2.848,1.522,5.479,3.982,6.9c1.236,0.713,2.61,1.067,3.986,1.067c1.374,0,2.751-0.354,3.983-1.067l80.704-46.594  c2.466-1.422,3.984-4.054,3.984-6.9C121.023,65.497,119.502,62.866,117.037,61.441z" />
                </svg>
            </div>
        </div>
        <div class="trans-btn" v-show="Track.hasLyricTrans(track)">
            <span :class="{ active: lyricTransActived }" @click="toggleLyricTrans">译</span>
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
}

.lyric-ctl .header b {
    margin-right: 3px;
    min-width: 43px;
}

.lyric-ctl .mv {
    margin-right: 5px;
}

.lyric-ctl .mv svg {
    fill: var(--svg-color);
    cursor: pointer;
}

.lyric-ctl .mv:hover svg {
    fill: var(--svg-hover-color);
}

.lyric-ctl .audio-title {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.lyric-ctl .audio-title {
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 6px;
}

.lyric-ctl .audio-artist,
.lyric-ctl .audio-album {
    font-size: 18px;
    font-weight: bold;
    color: var(--text-sub-color);
    display: flex;
}

.lyric-ctl .audio-artist .ar-ctl,
.lyric-ctl .audio-album .al-ctl {
    -webkit-line-clamp: 1;
}

.lyric-ctl .center {
    position: relative;
    height: 399px;
    overflow: auto;
    margin-top: 15px;
    padding-right: 6px;
    padding-bottom: 15px;
    -webkit-mask-image: linear-gradient(transparent 0%, #fff 20%, #fff 80%, transparent 100%);
}

.lyric-ctl .lyric-content {
    overflow: scroll;
}

.lyric-ctl .center::-webkit-scrollbar,
.lyric-ctl .lyric-content::-webkit-scrollbar {
    display: none;
}

.lyric-ctl .center .line {
    font-size: 18px;
    line-height: 28px;
    margin-top: 26px;
    color: #ccc;
    color: var(--text-lyric-color);
}

.lyric-ctl .center .current {
    background: var(--hl-text-bg);
    -webkit-background-clip: text;
    color: transparent;
    font-size: 21px;
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

.lyric-ctl .center .locatorCurrent,
.lyric-ctl .center .locatorCurrent .text {
    font-weight: bold !important;
}

.lyric-ctl .no-lyric {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    font-size: 21px;
    font-weight: bold !important;
    color: var(--text-lyric-color);
}

.lyric-ctl .scroll-locator {
    position: fixed;
    right: 80px;
    top: 50%;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}


.lyric-ctl .scroll-locator .time-text {
    font-size: 13px;
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
    border-bottom: 1px dashed var(--hl-color);
}
*/

.lyric-ctl .scroll-locator .play-btn {
    /*margin-top: 16px;*/
    border-radius: 10rem;
    width: 18px;
    height: 18px;
    background: var(--btn-bg);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 5px;
}

.lyric-ctl .scroll-locator .play-btn:hover {
    background: var(--btn-hover-bg);
}

.lyric-ctl .scroll-locator .play-btn svg {
    margin-left: 1px;
    fill: var(--svg-btn-color) !important;
}

.lyric-ctl .center .line .trans-text {
    color: var(--text-lyric-color) !important;
}

.lyric-ctl .trans-btn {
    position: fixed;
    right: 35px;
    bottom: 99px;
}

.lyric-ctl .trans-btn span {
    border: 1.25px solid var(--text-sub-color);
    border-radius: 3px;
    padding: 1px 2px;
    font-size: var(--tip-text-size);
    font-size: var(--text-size);
    cursor: pointer;
    color: var(--text-sub-color);
    font-weight: bold;
}

.lyric-ctl .trans-btn .active,
.lyric-ctl .trans-btn span:hover {
    color: var(--hl-color);
    border-color: var(--hl-color);
}
</style>