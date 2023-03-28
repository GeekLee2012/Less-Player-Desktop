<script setup>
import { watch, ref, onMounted, inject, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import EventBus from '../../common/EventBus';
import { Track } from '../../common/Track';
import { toMMssSSS } from '../../common/Times';
import ArtistControl from './ArtistControl.vue';
import AlbumControl from './AlbumControl.vue';
import { usePlayStore } from '../store/playStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';


const props = defineProps({
    track: Object //Track
})


const { playMv, loadLyric, currentTimeState } = inject('player')

const { toggleLyricToolbar } = useAppCommonStore()
const { lyric } = storeToRefs(useSettingStore())

const currentIndex = ref(-1)
const hasLyric = ref(false)
const lyricData = ref(Track.lyricData(props.track))
let presetOffset = Track.lyricOffset(props.track)

let destScrollTop = -1
let rafId = null

let isUserMouseWheel = false
let userMouseWheelCancelTimer = null

const renderAndScrollLyric = (secs) => {
    if (!hasLyric.value) return

    const userOffset = lyric.value.offset / 1000
    secs = Math.max(0, (secs + presetOffset + userOffset))
    const MMssSSS = toMMssSSS(secs * 1000)
    const lyricWrap = document.querySelector(".lyric-ctl .center")
    const lines = lyricWrap.querySelectorAll('.line')
    //Highlight 
    //TODO算法存在Bug
    let index = -1
    for (var i = 0; i < lines.length; i++) {
        const time = lines[i].getAttribute('time-key')
        if (MMssSSS >= time) {
            index = i
        } else if (MMssSSS < time) {
            break
        }
    }

    setupLyricLines()

    if (index < 0) return
    currentIndex.value = index
    //Scroll
    if (isUserMouseWheel) return
    const scrollIndex = index > 1 ? (index - 1) : 0
    const scrollHeight = lyricWrap.scrollHeight
    const clientHeight = lyricWrap.clientHeight
    const maxScrollTop = scrollHeight - clientHeight
    destScrollTop = maxScrollTop * (scrollIndex / (lines.length - 1))
    lyricWrap.scrollTop = destScrollTop
    //smoothScroll(lyricWrap, 300)

}

//参考: https://aaron-bird.github.io/2019/03/30/%E7%BC%93%E5%8A%A8%E5%87%BD%E6%95%B0(easing%20function)/
function easeInOutQuad(currentTime, startValue, changeValue, duration) {
    currentTime /= duration / 2;
    if (currentTime < 1) return changeValue / 2 * currentTime * currentTime + startValue;
    currentTime--;
    return -changeValue / 2 * (currentTime * (currentTime - 2) - 1) + startValue;
}

//TODO
function smoothScroll(target, duration) {
    let currentTime = 0, step = 5
    const currentScrollTop = target.scrollTop
    const distance = destScrollTop - currentScrollTop

    const easeInOutScroll = () => {
        if (currentTime >= duration) {
            cancelAnimationFrame(rafId)
            return
        }
        const calcScrollTop = easeInOutQuad(currentTime, currentScrollTop, distance, duration)
        currentTime += step
        target.scrollTop = calcScrollTop
        rafId = requestAnimationFrame(easeInOutScroll)
    }
    easeInOutScroll()
}

const reloadLyricData = (track) => {
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
    lyricData.value = Track.lyricData(track)
    presetOffset = Track.lyricOffset(track)

    setTimeout(setupLyricLines, 300)
}

const onUserMouseWheel = (e) => {
    //e.preventDefault()
    isUserMouseWheel = true
    if (userMouseWheelCancelTimer) clearTimeout(userMouseWheelCancelTimer)
    userMouseWheelCancelTimer = setTimeout(() => {
        isUserMouseWheel = false
    }, 3000)
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
    const els = document.querySelectorAll(".lyric-ctl .center .line")
    if (els) els.forEach(el => setLyricLineStyle(el))
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
}

EventBus.on('track-lyricLoaded', track => reloadLyricData(track))
EventBus.on('lyric-userMouseWheel', onUserMouseWheel)
EventBus.on('lyric-fontSize', setupLyricLines)
EventBus.on('lyric-hlFontSize', setupLyricLines)
EventBus.on('lyric-fontWeight', setupLyricLines)
EventBus.on('lyric-lineHeight', setupLyricLines)
EventBus.on('lyric-lineSpacing', setupLyricLines)
EventBus.on('lyric-alignment', setupLyricAlignment)

const isHeaderVisible = () => {
    const { metaPos } = lyric.value
    return metaPos == 0
}

onMounted(() => {
    loadLyric(props.track)
    setupLyricAlignment()
})

watch(currentTimeState, (nv, ov) => {
    try {
        renderAndScrollLyric(nv)
    } catch (error) {
        console.log(error)
    }
})

watch(() => props.track, (nv, ov) => loadLyric(props.track))
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
                {{ track.title }}
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
            <div v-show="hasLyric" v-for="(item, index) in lyricData" class="line" :time-key="item[0]" :class="{
                first: index == 0,
                last: index == (lyricData.size - 1),
                current: index == currentIndex
            }" v-html="item[1]">
            </div>
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
    font-weight: bold;
}

.lyric-ctl .center .first {
    margin-top: 125px;
}

.lyric-ctl .center .last {
    margin-bottom: 135px;
}

.lyric-ctl .no-lyric {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    font-size: 21px;
    font-weight: bold;
    color: var(--text-lyric-color);
}
</style>