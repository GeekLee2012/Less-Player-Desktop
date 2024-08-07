<script setup>
import { onMounted, ref, inject, computed, watch, reactive, onUnmounted, onActivated, onDeactivated } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlayStore } from '../store/playStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';
import { useSoundEffectStore } from '../store/soundEffectStore';
import LyricControl from '../components/LyricControl.vue';
import ArtistControl from '../components/ArtistControl.vue';
import WinTrafficLightBtn from '../components/WinTrafficLightBtn.vue';
import { stringEquals, isBlank, toTrimString, toLowerCaseTrimString, isDevEnv } from '../../common/Utils';
import WinNonMacOSControlBtn from '../components/WinNonMacOSControlBtn.vue';
import { Track } from '../../common/Track';
import { DEFAULT_COVER_BASE64, ImageProtocal } from '../../common/Constants';
import { usePlatformStore } from '../store/platformStore';
import analyze from 'rgbaster-plus';
import { onEvents, emitEvents } from '../../common/EventBusWrapper';



const { seekTrack, playMv,
    progressState, mmssCurrentTime,
    currentTimeState, favoritedState,
    toggleFavoritedState, preseekTrack,
    mmssPreseekTime, isTrackSeekable,
    dndSaveCover } = inject('player')
const { useWindowsStyleWinCtl } = inject('appCommon')

const { applyDocumentStyle } = inject('appStyle')


const { isMaxScreen, playingViewShow, desktopLyricShow } = storeToRefs(useAppCommonStore())
const { hidePlayingView, minimize,
    showToast, switchPlayingViewTheme,
    toggleSoundEffectView, toggleDesktopLyricShow,
    togglePlayingThemeListView, } = useAppCommonStore()
const { currentTrack, playingIndex, volume, playing } = storeToRefs(usePlayStore())
const { isUseEffect } = storeToRefs(useSoundEffectStore())
const { getWindowZoom, lyricMetaPos,
    isDndSaveEnable, isPlayingViewUseBgCoverEffect,
    isPlayingViewCoverBorderShow,
} = storeToRefs(useSettingStore())
const { isLocalMusic } = usePlatformStore()

const volumeBarRef = ref(null)

const onUserMouseWheel = (event) => emitEvents('lyric-userMouseWheel', event)

const hasBackgroudCover = ref(false)
//const bgEffectStyle = reactive({})
const setHasBackgroudCover = (value) => hasBackgroudCover.value = value

const extractRgbColor = (rgb) => {
    let _rgb = toLowerCaseTrimString(rgb)
    if(!_rgb || !_rgb.startsWith('rgb')) return null
    const index = _rgb.indexOf('(')
    _rgb = _rgb.substring(index + 1, _rgb.length - 1)
    const parts = _rgb.split(',')
    if(!Array.isArray(parts) || parts.length != 3) return null
    try {
        const r = parseInt(toTrimString(parts[0]))
        const g = parseInt(toTrimString(parts[1]))
        const b = parseInt(toTrimString(parts[2]))
        return { r, g, b }
    } catch(error) {
        if(isDevEnv()) console.log(error)
    }
    return rgb
}

const toDarkerRgbColor = (rgb) => {
    const _rgb = extractRgbColor(rgb)
    if(!_rgb) return null
    const { r, g, b } = _rgb
    const _r = parseInt(Math.max(52, r - (255 - r) * 0.5))
    const _g = parseInt(Math.max(52, g - (255 - g) * 0.5))
    const _b = parseInt(Math.max(52, b - (255 - b) * 0.5))
    return `rgb(${_r},${_g},${_b})`
}

const setupBackgroudEffect = async () => {
    if (!isPlayingViewUseBgCoverEffect.value) return
    const bgEffectEl = document.querySelector('.playing-view .bg-effect')
    if(!bgEffectEl) return 

    const track = currentTrack.value
    if (!track || !Track.hasCover(track)) return setHasBackgroudCover(false)
    const { cover } = track
    //默认封面
    if (stringEquals(DEFAULT_COVER_BASE64, cover)) return setHasBackgroudCover(false)
    //本地歌曲
    if (cover.startsWith(ImageProtocal.prefix)) return setHasBackgroudCover(false)

    setHasBackgroudCover(true)
    bgEffectEl.style.background = `url('${cover}')`

    /*
    //TODO 内存占用高
    Object.assign(bgEffectStyle, {
        background: `url('${cover}')`
    })
    const ignoreColors = ['rgb(255,255,255)', 'rgb(0,0,0)']
    analyze(cover, { ignore: ignoreColors, scale: 0.6 })
        .then(result => {
            const { color } = result[2]
            if(ignoreColors.includes(color)) return
            const darkColor = toDarkerRgbColor(color)
            const _color = darkColor ? `linear-gradient(to right bottom, ${color}, ${darkColor})` : color
            Object.assign(bgEffectStyle, {
                background: `${_color} !important`
            })
            //setCoverNoneBorder(true)
        })
    */
}

const computedFormatShow = computed(() => {
    const { platform, bitrate, sampleRate } = currentTrack.value
    return false && isLocalMusic(platform) && bitrate && sampleRate
})

const trackFormat = computed(() => {
    const { bitrate, sampleRate, codec } = currentTrack.value
    if(!bitrate || !sampleRate) return
    const _bitrate = parseInt(bitrate / 1000)
    const _codec = isBlank(codec) ? '' : `, ${codec}`
    return `${_bitrate} kbps , ${sampleRate} Hz ${_codec}`
})


/* 生命周期、监听 */
watch(() => (currentTrack.value && currentTrack.value.cover + '&' + playingViewShow.value), setupBackgroudEffect)

onMounted(() => {
    emitEvents('playingView-changed')
    if (volumeBarRef) volumeBarRef.value.setVolume(volume.value)
    setupBackgroudEffect()
})
</script>

<template>
    <div class="playing-view">
        <div class="container">
            <div class="header">
                <div class="win-ctl-wrap" v-show="!useWindowsStyleWinCtl">
                    <WinTrafficLightBtn :showCollapseBtn="true" :collapseAction="hidePlayingView"
                        :isMaximized="isMaxScreen">
                    </WinTrafficLightBtn>
                </div>
                <div class="meta-wrap" v-show="(lyricMetaPos == 2)">
                    <div class="meta">
                        <div class="mv" v-show="Track.hasMv(currentTrack)">
                            <svg @click="playMv(currentTrack)" width="20" height="16" viewBox="0 0 1024 853.52"
                                xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M1024,158.76v536c-.3,1.61-.58,3.21-.92,4.81-2.52,12-3.91,24.43-7.76,36-23.93,72-88.54,117.91-165.13,117.92q-338.19,0-676.4-.1a205.81,205.81,0,0,1-32.3-2.69C76,840.18,19.81,787.63,5,723.14c-2.15-9.35-3.36-18.91-5-28.38v-537c.3-1.26.66-2.51.89-3.79,1.6-8.83,2.52-17.84,4.85-26.48C26.32,51.12,93.47.05,173.29,0Q512,0,850.72.13a200.6,200.6,0,0,1,31.8,2.68C948.44,13.47,1004,65.66,1019.09,130.88,1021.21,140.06,1022.39,149.46,1024,158.76ZM384,426.39c0,45.66-.09,91.32,0,137,.07,24.51,19.76,43.56,43.38,42.47,8.95-.42,15.83-5.3,23.06-9.86q69.25-43.74,138.74-87.11,40.63-25.42,81.44-50.6c23.18-14.34,23.09-49-.25-63.14-3.27-2-6.69-3.72-9.93-5.74q-30.08-18.81-60.08-37.69Q522.2,302.46,444,253.2a34.65,34.65,0,0,0-26.33-4.87c-19.87,4.13-33.64,21.28-33.68,42.09Q383.9,358.42,384,426.39Z" />
                                    </g>
                                </g>
                            </svg>
                        </div>
                        <div class="audio-title" v-html="currentTrack.title"></div>
                        <div v-show="Track.hasArtist(currentTrack)">&nbsp;&nbsp;-&nbsp;&nbsp;</div>
                        <div class="audio-artist">
                            <ArtistControl :visitable="true" :platform="currentTrack.platform" :data="currentTrack.artist"
                                :trackId="currentTrack.id" class="ar-ctl">
                            </ArtistControl>
                        </div>
                    </div>
                </div>
                <div class="win-ctl-wrap" v-show="useWindowsStyleWinCtl">
                    <WinNonMacOSControlBtn :showCollapseBtn="true" :collapseAction="hidePlayingView"
                        :isMaximized="isMaxScreen">
                    </WinNonMacOSControlBtn>
                </div>
            </div>
            <div class="center">
                <div class="cover-wrap" :class="{ 'with-format': false}">
                    <img class="cover"
                            :class="{ 
                                'obj-fit-contain': currentTrack.coverFit == 1, 
                                'draggable': isDndSaveEnable, 
                                'none-border': !isPlayingViewCoverBorderShow 
                            }"
                            v-lazy="Track.coverDefault(currentTrack)" :draggable="isDndSaveEnable" @dragstart="dndSaveCover" />
                    <div class="format" v-show="false" v-html="trackFormat"></div>
                </div>
                <div class="lyric-wrap">
                    <LyricControl :track="currentTrack" :currentTime="currentTimeState" 
                        @mousewheel="onUserMouseWheel" keyName="playingView">
                    </LyricControl>
                </div>
            </div>
            <div class="bottom">
                <SliderBar :value="progressState" :disable="!isTrackSeekable" :onSeek="seekTrack" :disableScroll="true"
                    :onScroll="preseekTrack" :onScrollFinish="seekTrack" 
                    :onDragRelease="seekTrack" :onDragMove="preseekTrack" 
                    keyName="playingView">
                </SliderBar>
                <div class="action">
                    <div class="btm-left">
                        <div @click="toggleFavoritedState">
                            <svg v-show="!favoritedState" width="20" height="20" viewBox="0 0 1024 937.46"
                                xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M1024,299.77c-.89,7.24-1.74,14.5-2.67,21.74-5.4,41.95-19.53,81-39,118.35-24.74,47.39-56.62,89.8-91.22,130.27-48.69,57-101.85,109.6-156.46,160.77C661.69,799.26,588.19,867,514.93,935.05c-.85.78-1.75,1.49-2.85,2.41-1.09-.89-2.14-1.65-3.09-2.52q-101.8-92.36-203.56-184.77c-58.71-53.61-116.12-108.59-168.2-168.81-39.12-45.23-74.7-92.93-100.8-147.1-18.8-39-31.17-79.91-35.23-123.16-.32-3.45-.8-6.89-1.2-10.33v-36c1-7.74,1.79-15.5,2.86-23.23,8.06-57.93,30.88-109.28,71.21-151.7,67.09-70.55,150.24-98.35,246.11-86,75.62,9.71,138.64,44.83,189.43,101.75.74.82,1.61,1.52,2.53,2.39.91-1,1.61-1.66,2.26-2.4a297.6,297.6,0,0,1,98.07-74.34C690-5.4,769.66-11.19,849.33,21.27,948,61.45,1004.25,136.62,1021.1,241.55c1.24,7.69,1.95,15.47,2.9,23.21ZM922.22,282.9c-1.08-10.76-1.48-21.64-3.33-32.27-10-57.28-39.78-101.12-91.95-127.45-54.58-27.54-110.52-27-165.67-1.07-44.78,21.07-78.08,53.89-96.65,100.47-1.2,3-2.93,3.41-5.65,3.4-29.5-.06-59-.1-88.49.05-3.58,0-5.17-1.2-6.63-4.39C430.29,148.12,342.54,89.86,249.42,105.81c-41,7-76.09,25.21-103.36,56.83-38.87,45.08-49.77,97.9-40.53,155.58,5.72,35.66,20,68.21,38.16,99.15C171,463.93,205.43,505,242,544.39c57.44,61.87,119.67,118.78,182.1,175.48,28,25.43,56.23,50.62,84.27,76,5.68,5.15,6.89,5.4,12.43.28C568,752.47,615.47,709.05,662.35,665c54.55-51.26,108-103.64,156.07-161.17C846.69,470,872.66,434.6,892.47,395,910.12,359.76,921.42,322.79,922.22,282.9Z" />
                                    </g>
                                </g>
                            </svg>
                            <svg v-show="favoritedState" class="love-btn" width="20" height="20" viewBox="0 0 1024 937.53"
                                xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M1024,264.78v35c-.41,3.45-.89,6.89-1.23,10.34-3.89,39.7-15.25,77.26-32.22,113.22-23.28,49.33-54.76,93.24-89.46,135-49.41,59.44-104,113.93-160.28,166.77-74.94,70.39-150.55,140-225.89,210-.93.87-2,1.58-3.1,2.42-1.47-1.32-2.72-2.41-3.93-3.54-20.27-18.82-40.33-37.87-60.84-56.43C396.63,832,345.74,786.88,295.54,741c-52.69-48.1-103.88-97.76-151.07-151.36-37.41-42.48-71.92-87-98.75-137.15C23.93,411.83,8.38,369.06,2.64,323,1.71,315.62.88,308.2,0,300.79v-36c1-7.74,1.79-15.51,2.86-23.24,8.06-57.92,30.88-109.28,71.21-151.7C141.16,19.28,224.31-8.52,320.18,3.78c75.62,9.71,138.64,44.83,189.43,101.76.74.82,1.61,1.52,2.53,2.39.91-1,1.61-1.66,2.26-2.4a297.49,297.49,0,0,1,98.07-74.35C690-5.4,769.66-11.19,849.33,21.27,948,61.46,1004.25,136.63,1021.1,241.57,1022.34,249.26,1023.05,257,1024,264.78Z" />
                                    </g>
                                </g>
                            </svg>
                        </div>
                        <div class="spacing">
                            <svg width="20" height="20" class="share-btn" viewBox="0 0 853.52 938.68" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M292,589.72c-38.76,37.29-85,54.64-138.74,49.42-43.36-4.22-80.19-22.9-109.23-55.42-60.07-67.26-58.33-167.48,3-232,63.16-66.46,174-73.4,245.1-2.51,12.53-7.29,25.17-14.61,37.78-22Q421.83,273.6,513.73,220c3.34-1.94,4.53-3.49,3.48-7.69C493.68,118.28,552.84,23.71,647.54,3.71S834.26,46.49,850.82,142.26C866.66,233.93,805,322.49,713.47,338.48,656.72,348.39,607,333,564.72,294c-2.51-2.33-4.15-2.65-7.2-.86Q448.26,357,338.82,420.7c-2.94,1.72-3.79,3.23-2.91,6.65a166.71,166.71,0,0,1,.06,84c-.93,3.64,0,5.23,3.11,7Q447.89,581.59,556.54,645.1c3.84,2.25,5.9,2,9.21-1,39.77-36.53,86.66-52.18,140.18-44.74,75.89,10.54,133.26,67.55,145.47,142.95,14.17,87.54-44.28,173.15-131.3,192.3C629.41,954.52,540.41,900,517.31,810.27a167.2,167.2,0,0,1,.09-84.5c.77-3,.51-4.67-2.43-6.37Q404.65,655.29,294.42,591C293.7,590.58,293,590.22,292,589.72ZM85.41,469.18a85.23,85.23,0,1,0,85.25-84.95A85,85,0,0,0,85.41,469.18ZM767.87,170.91a85.23,85.23,0,1,0-170.45-.24c-.06,47.21,38.29,85.64,85.35,85.53A85.35,85.35,0,0,0,767.87,170.91Zm-170.45,597a85.23,85.23,0,1,0,170.45.48c.1-47.29-38.06-85.74-85.24-85.61C633.7,682.89,597.2,723.1,597.42,767.89Z"/></g></g></svg>
                        </div>
                    </div>
                    <div>
                        <AudioTime :current="mmssPreseekTime || mmssCurrentTime"
                            :duration="Track.mmssDuration(currentTrack, 0)">
                        </AudioTime>
                    </div>
                    <div class="btm-center">
                        <PlayControl></PlayControl>
                    </div>
                    <div>
                        <VolumeBar ref="volumeBarRef"></VolumeBar>
                    </div>
                    <div class="btm-right">
                        <div class="theme-btn btn" @click.stop="togglePlayingThemeListView">
                            <svg width="17" height="17" viewBox="0 0 1024.5 1024.5" xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path class="cls-1"
                                            d="M.25,968.25v-656A4.16,4.16,0,0,0,.94,311C4.63,281.51,31.79,255.51,68.45,256c60.81.84,121.64.23,182.46.23h5.34v-6.84q0-92.24,0-184.47c0-22.79,9.75-40.71,28.37-53.82C293,5.26,302.53,2.55,312.25.25h656a18.78,18.78,0,0,0,2.77.93c19.49,3.57,34.68,13.71,44.28,31,4.11,7.4,6,16,9,24.09v656c-.24.42-.65.82-.71,1.27-3.42,28.18-29.26,55.37-67,54.92-60.48-.71-121-.19-181.46-.19h-6.85v6.85c0,61.49.18,123-.09,184.46-.11,26.77-12.76,46.42-36.61,58.42-6,3-12.84,4.23-19.3,6.27h-656a12.06,12.06,0,0,0-2.27-.87c-19.68-3.5-35.06-13.62-44.78-31C5.08,984.94,3.17,976.32.25,968.25ZM384.47,639.9H895.85V128.51H384.47ZM640.05,768.25h-6q-155.73,0-311.45,0c-38.68,0-66.36-27.8-66.35-66.52q0-155.47,0-311v-6.28H128.53V895.94H640.05Z" />
                                    </g>
                                </g>
                            </svg>
                            <!--
                        <svg width="19" height="19" viewBox="0 0 853.81 853.37" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M.06,469.31c0-55.84-.16-111.67.05-167.5.25-67,25.33-123,76.46-166.42,39.71-33.76,86.24-50,138.39-50q104.75,0,209.49,0c23.75,0,41.8,15,44.51,36.72,3.26,26.11-15.9,48.33-42.22,48.47-37.17.19-74.33.05-111.5.05-33.67,0-67.33-.05-101,0-63.74.12-116.53,44.74-127.09,107.56a130.89,130.89,0,0,0-1.52,21.4c-.09,113-.37,226,.07,339,.2,52.53,24.66,91.22,70.88,115.88,17.94,9.56,37.46,13.42,57.81,13.41,113.16,0,226.33.16,339.49-.09,65.18-.15,117.4-45.14,127.53-109.26a138,138,0,0,0,1.34-21.42q.15-104.5.07-209c0-21.13,12.59-37.72,32.23-42.79,26-6.7,52.44,12.38,52.76,39.21.56,46.16.25,92.33.25,138.49,0,27.84.26,55.68-.23,83.5-1.51,86.76-60.89,167.32-143.17,195A225.82,225.82,0,0,1,552,853.35q-167.76,0-335.5,0c-91.18,0-169.06-52.84-202.29-137.38C4.32,690.73.08,664.38.07,637.3Q0,553.3.06,469.31Z" />
                                    <path
                                        d="M533.61,467.94c.48,5.94,1,11.54,1.39,17.15,5.7,86.42-55.85,162.13-141.7,173.43-14.24,1.87-28.91,1.43-43.32.72-33.92-1.67-66.38,3.93-97.25,18-15.75,7.17-30.88,7.78-45.52-2.07-9.61-6.47-16.11-15.84-21.65-25.81-13.09-23.55-16.68-49.18-14.25-75.46C178,502.27,205.89,439,251.05,383.81c31-37.91,72.91-55.81,122-56.23,3.65,0,7.29.54,10.92.83,1.59-8.8,2.62-17.72,4.85-26.32,7.32-28.25,22.08-51.63,45.29-69.87q134-105.32,267.61-211.1c56.76-44.91,138-14.55,150.59,56.72,4.62,26.26-1.54,50.54-18,71.48q-109,138.44-218.55,276.39c-18.68,23.41-44.88,35.46-74.11,40.91C539.19,467.07,536.72,467.43,533.61,467.94ZM255,584.49c14.32-2.64,27.17-5.41,40.14-7.31,20.14-2.95,40.48-4.9,60.74-2.22,34.48,4.56,67.88-11.24,84.07-40.71a83.78,83.78,0,0,0-9.89-94.75c-31.41-36.31-86-35.39-116,2.13a270.61,270.61,0,0,0-52.05,106.29C259.2,559.82,257.41,572,255,584.49Zm214.5-248.07a85.44,85.44,0,0,0,1.3,9.61c4.64,19.32,16.72,31.79,36,35.94,18.58,4,35.06-.52,47.34-16q93.67-118.38,187.27-236.81Q753.42,114,765.33,98.91c3.32-4.25,3.48-8.24.63-11.25s-7-3-11.58.55l-1.58,1.23Q620.06,194.35,487.29,299.22C475.34,308.64,470.31,321,469.53,336.42Z" />
                                </g>
                            </g>
                        </svg>
                        -->
                        </div>
                        <div class="lyric-btn spacing" :class="{ 'content-text-highlight': desktopLyricShow }"
                            @click="() => toggleDesktopLyricShow()">
                            词
                        </div>
                        <div class="equalizer-btn btn spacing" :class="{ active: isUseEffect }"
                            @click="toggleSoundEffectView">
                            <svg width="17" height="17" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
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
            </div>
        </div>
        <div class="bg-effect" v-show="hasBackgroudCover && isPlayingViewUseBgCoverEffect">
        </div>
    </div>
</template>

<style scoped>
.playing-view {
    display: flex;
    /*flex-direction: column;*/
    overflow: hidden;
    --others-sliderbar-ctl-height: 3px; 
}

.playing-view .spacing {
    margin-left: 20px;
}

.playing-view .container {
    display: flex;
    flex: 1;
    flex-direction: column;
    background: var(--content-bg-color);
    background: var(--content-bg-color-no-transparent);
    /*
    background: linear-gradient(135deg, #292a3a, #536976);
    background: #355c7d;   
    */
}

.playing-view .header {
    height: 56px;
    display: flex;
    -webkit-app-region: drag;
}

.playing-view .header svg {
    -webkit-app-region: none;
}

.playing-view .header .win-ctl-wrap {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-left: var(--others-win-ctl-margin-left);
    width: 18%;
}

.playing-view .meta-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding-right: 18%;
    margin-right: var(--others-win-ctl-margin-left);
}

.playing-view .meta {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex: 1;
    width: 88%;
}

.playing-view .meta-wrap .audio-title,
.playing-view .meta-wrap .audio-artist {
    font-weight: bold;
    color: var(--content-subtitle-text-color);
    text-align: left;

    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    align-items: center;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    word-wrap: break-word;
    line-break: anywhere;
}

.playing-view .meta-wrap .audio-title {
    word-break: break-all;
}

.playing-view .meta-wrap .audio-artist {
    -webkit-app-region: none;
}

.playing-view .mv {
    margin-right: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}

.playing-view svg {
    fill: var(--button-icon-btn-color);
    cursor: pointer;
}

.playing-view .header svg:hover,
.playing-view .theme-btn svg:hover,
.playing-view .equalizer-btn svg:hover,
.playing-view .active svg,
.playing-view .collapse-btn:hover svg {
    fill: var(--content-highlight-color);
    cursor: pointer;
}

.playing-view .theme-btn {
    transform: rotate(-90deg);
}

.playing-view .center {
    flex: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0px 60px;
}

.playing-view .center .cover-wrap,
.playing-view .center .lyric-wrap {
    /* 偶尔有少数歌曲，歌词太长，会强行挤占左边Cover空间*/
    flex: 1;
    max-width: 50%;
}

.playing-view .center .cover-wrap {
    margin-right: 41px;
    margin-bottom: 0px;
    display: flex;
    justify-content: flex-end;
    flex-direction: column;
    align-items: flex-end;
}

.playing-view .center .cover-wrap.with-format {
    margin-top: 18px;
}

.playing-view .center .cover-wrap .cover {
    /*width: 356px;
    height: 356px;*/
    width: 366px;
    height: 366px;
    border: 6px solid #292929;
    border-radius: 3px;
    background-size: cover;
}

.playing-view .center .cover-wrap .cover.none-border {
    border: 0px solid transparent;
    box-shadow: 0px 0px 6px var(--border-popovers-border-color);
}

.playing-view .center .cover-wrap .cover.draggable {
    -webkit-user-drag: auto;
}

.playing-view .center .cover-wrap .format {
    display: flex;
    width: 366px;
    margin: 15px 0px 0px 0px;
    justify-content: center;
    align-items: center;
    color: var(--content-subtitle-text-color);
    font-weight: bold;
    word-wrap: break-word;
    line-break: anywhere;
}

.playing-view .center .lyric-wrap {
    margin-left: 41px;
}

.playing-view .bottom {
    height: 77px;
    padding-bottom: 5px;
}

.playing-view .bottom .action {
    display: flex;
    justify-content: center;
    align-items: center;
}

.playing-view .bottom .action>div {
    flex: 1;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
}

.playing-view .bottom .action .btm-left svg {
    fill: var(--button-icon-btn-color);
    cursor: pointer;
}

.playing-view .bottom .action .btm-left svg:hover {
    fill: var(--content-highlight-color);
}

.playing-view .bottom .action .love-btn {
    fill: var(--content-highlight-color) !important;
}

.playing-view .bottom .action .share-btn {
    transform: scale(0.97);
}

.playing-view .bottom .action .lyric-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    font-weight: bold;
    margin-bottom: 3px;
    font-size: 18px;
    color: var(--button-icon-btn-color);
}

.playing-view .bottom .action .lyric-btn:hover {
    color: var(--content-highlight-color);
}

.playing-view .bg-effect {
    background-position: center !important;
    background-repeat: no-repeat !important;
    background-size: cover !important;
    /*backdrop-filter: blur(20px);*/
    filter: blur(8px);
    z-index: -10;
    position: absolute;
    width: 100%;
    height: 100%;
}
</style>