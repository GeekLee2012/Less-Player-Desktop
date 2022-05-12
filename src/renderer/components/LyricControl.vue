<script setup>
import { watch, ref, reactive } from 'vue';
import EventBus from '../../common/EventBus';
import { Track } from '../../common/Track';
import { toMMssSSS } from '../../common/Times';
import ArtistControl from './ArtistControl.vue';
import AlbumControl from './AlbumControl.vue';
import { usePlayStore } from '../store/playStore';
import { storeToRefs } from 'pinia';

const props = defineProps({
    track: Track
})

const currentIndex = ref(-1)
//const { hasLyric } = storeToRefs(usePlayStore())
const hasLyric = ref(false)
const lyricData = ref(props.track.lyricData())

let destScrollTop = -1
let rafId = null

const renderAndScrollLyric = (secs) => {
    const MMssSSS = toMMssSSS(secs * 1000)
    const lyricWrap = document.querySelector(".lyric-ctl .center")
    const lines = lyricWrap.querySelectorAll('.line')
    //console.log(secs + ", " + MMssSSS + "," + lines.length)
    //hightlight
    for(var i = 0; i < lines.length; i++) {
        const time = lines[i].getAttribute('time-key')
        if(time > MMssSSS) {
            currentIndex.value = (i > 0 ? i - 1: 0)
            break
        }
    }
    if(currentIndex.value < 0) return
    //scroll
    const scrollIndex = currentIndex.value > 1 ? (currentIndex.value - 1) : 0
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
        if(currentTime >= duration) {
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

EventBus.on('track-pos', secs => {
    try {
        renderAndScrollLyric(secs)
    } catch(error) {
        console.log(error)
    }
})

const reloadLyricData = (track) => {
    hasLyric.value = track.hasLyric()
    lyricData.value = track.lyricData()
}

const toString = (id) => {
    if(typeof(id) == 'string') return id
    return id ? (id + '') : ''
}

watch(() => props.track, (nv, ov) => reloadLyricData(nv))

EventBus.on('track-lyricLoaded', track => reloadLyricData(track))
</script>

<template>
    <div class="lyric-ctl">
        <div class="header">
            <div class="audio-title">{{ track.title }}</div>
            <div class="audio-artist spacing">
                <b>歌手:</b>
                <span>
                    <ArtistControl :visitable="true" 
                        :platform="track.platform" 
                        :data="track.artist"
                        :trackId="toString(track.id)"
                        class="ar-ctl">
                    </ArtistControl>
                </span>
            </div>
            <div class="audio-album spacing">
                <b>专辑:</b>
                <span>
                    <AlbumControl :visitable="true" 
                        :platform="track.platform" 
                        :data="track.album"
                        class="al-ctl">
                    </AlbumControl>
                </span>
            </div>
        </div>
        <div class="center" ref="lyricWrapRef">
            <div v-show="!hasLyric" class="no-lyric">
                 <label>暂无歌词，请继续欣赏音乐吧~</label>
            </div>
            <div v-show="hasLyric" v-for="(item, index) in lyricData"
                class="line" :time-key="item[0]"
                :class="{ first: index == 0, 
                    last: index == (lyricData.size - 1),
                    current: index == currentIndex
                }"
                v-html="item[1]" >
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

.lyric-ctl .audio-title {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.lyric-ctl .audio-title {
    font-size: 23px;
    font-weight: bold;
    margin-bottom: 6px;
}

.lyric-ctl .audio-artist,
.lyric-ctl .audio-album {
    font-size: 17px;
    font-weight: bold;
    color: #ababab;
    display: flex;
}

.lyric-ctl .audio-artist .ar-ctl ,
.lyric-ctl .audio-album .al-ctl {
    -webkit-line-clamp: 2;
}
    
.lyric-ctl .center {
    height: 366px;
    overflow: auto;
    margin-top: 15px;
    padding-right: 6px;
    padding-bottom: 15px;
}

.lyric-ctl .lyric-content {
    overflow: auto;
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
}

.lyric-ctl .center .current {
    background: linear-gradient(to top right, #28c83f, #1ca388);
    -webkit-background-clip: text;
    color: transparent;
    font-size: 19px;
    font-weight: bold;
}

.lyric-ctl .center .first {
    margin-top: 125px;
}

.lyric-ctl .center .last {
    margin-bottom: 135px;
}

.lyric-ctl .no-lyric {
    display: flex;
    margin-top: 125px;
    align-items: center;
    font-size: 19px;
    color: #989898;
}
</style>