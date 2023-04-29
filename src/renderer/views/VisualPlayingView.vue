<script setup>
import { onMounted, onUnmounted, reactive, ref, watch, inject } from 'vue';
import { storeToRefs } from 'pinia';
import EventBus from '../../common/EventBus';
import { usePlayStore } from '../store/playStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { useUserProfileStore } from '../store/userProfileStore';
import { useSettingStore } from '../store/settingStore';
import { useSoundEffectStore } from '../store/soundEffectStore';
import LyricControl from '../components/LyricControl.vue';
import ArtistControl from '../components/ArtistControl.vue';
import WinTrafficLightBtn from '../components/WinTrafficLightBtn.vue';
import { useUseCustomTrafficLight } from '../../common/Utils';
import { Track } from '../../common/Track';
import { Playlist } from '../../common/Playlist';
import { toMmss } from '../../common/Times';



const { seekTrack, playMv, progressState, mmssCurrentTime, currentTimeState } = inject('player')

//是否使用自定义交通灯控件
const useCustomTrafficLight = useUseCustomTrafficLight()

const { playingViewShow, spectrumIndex,
    playingViewThemeIndex } = storeToRefs(useAppCommonStore())
const { hidePlayingView, minimize, showToast,
    switchPlayingViewTheme, switchSpectrumIndex,
    toggleSoundEffectView } = useAppCommonStore()
const { getCurrentThemeHlColor } = useSettingStore()
const { currentTrack, playingIndex,
    playing, volume, queueTracksSize } = storeToRefs(usePlayStore())
const { isUseEffect } = storeToRefs(useSoundEffectStore())
const { getWindowZoom, lyricMetaPos, theme, layout } = storeToRefs(useSettingStore())


const volumeBarRef = ref(null)
const disactived = ref(true)
const viewStyle = reactive({})
const filterStyle = reactive({})

const setDisactived = (value) => {
    disactived.value = value
    EventBus.emit('playingView-changed')
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
const randomRgbColor = () => {
    var red = Math.random() * 255
    var green = Math.random() * 666 % 255
    var blue = Math.random() * 1024 % 255
    return `rgb(${red}, ${green}, ${blue})`
}

const roundedRect = (ctx, x, y, width, height, radius) => {
    if (height < radius * 2) return
    ctx.beginPath();
    ctx.moveTo(x, y + radius);
    ctx.lineTo(x, y + height - radius);
    ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
    ctx.lineTo(x + width - radius, y + height);
    ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
    ctx.lineTo(x + width, y + radius);
    ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
    ctx.lineTo(x + radius, y);
    ctx.quadraticCurveTo(x, y, x, y + radius);
    ctx.stroke();
}

//目前比较耗性能 
const setBackgroudEffect = () => {
    const { cover } = currentTrack.value
    Object.assign(viewStyle, {
        "background": "rgba(255, 255, 255, 0.2)",
        "background-image": `url('${cover}')`,
        "background-position": "center",
        "background-size": "cover",
    })

    Object.assign(filterStyle, {
        "backdrop-filter": "blur(666rem)",
        "transform": "translateZ(0)",
    })
}
*/

const onUserMouseWheel = (e) => EventBus.emit('lyric-userMouseWheel', e)

EventBus.on("userProfile-reset", checkFavorite)
EventBus.on("refreshFavorite", checkFavorite)

watch([currentTrack, playingViewShow], () => {
    checkFavorite()
    //setBackgroudEffect()
})

onMounted(() => {
    setDisactived(false)
    //setBackgroudEffect()
    if (volumeBarRef) volumeBarRef.value.setVolume(volume.value)
})

onUnmounted(() => {
    setDisactived(true)
})
</script>

<template>
    <div class="visual-playing-view" :style="viewStyle">
        <div class="wrap" :style="filterStyle">
            <div class="header">
                <div class="win-ctl-wrap">
                    <WinTrafficLightBtn v-show="useCustomTrafficLight" :showCollapseBtn="true"
                        :collapseAction="hidePlayingView"></WinTrafficLightBtn>
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
                        <div v-show="Track.hasArtist(currentTrack)">&nbsp;-&nbsp;</div>
                        <div class="audio-artist">
                            <ArtistControl :visitable="true" :platform="currentTrack.platform" :data="currentTrack.artist"
                                :trackId="currentTrack.id" class="ar-ctl">
                            </ArtistControl>
                        </div>
                    </div>
                </div>
            </div>
            <div class="center">
                <div class="left">
                    <div class="cover">
                        <img v-lazy="currentTrack.cover" :class="{ rotation: (playingViewShow && playing) }" />
                    </div>
                    <div class="canvas-wrap" @click="switchSpectrumIndex">
                        <canvas class="spectrum-canvas" width="404" height="56"></canvas>
                    </div>
                    <div class="progress-wrap">
                        <ProgressBar :value="progressState" :seekable="playing" :onseek="seekTrack">
                        </ProgressBar>
                    </div>
                    <div class="audio-time-wrap">
                        <span class="t-current" v-html="mmssCurrentTime"></span>
                        <span class="t-duration" v-html="Track.mmssDuration(currentTrack)"></span>
                    </div>
                    <div class="action">
                        <div class="btm-left">
                            <div @click="toggleFavorite">
                                <svg v-show="!favorited" width="20" height="20" viewBox="0 0 1024 937.46"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <g id="Layer_2" data-name="Layer 2">
                                        <g id="Layer_1-2" data-name="Layer 1">
                                            <path
                                                d="M1024,299.77c-.89,7.24-1.74,14.5-2.67,21.74-5.4,41.95-19.53,81-39,118.35-24.74,47.39-56.62,89.8-91.22,130.27-48.69,57-101.85,109.6-156.46,160.77C661.69,799.26,588.19,867,514.93,935.05c-.85.78-1.75,1.49-2.85,2.41-1.09-.89-2.14-1.65-3.09-2.52q-101.8-92.36-203.56-184.77c-58.71-53.61-116.12-108.59-168.2-168.81-39.12-45.23-74.7-92.93-100.8-147.1-18.8-39-31.17-79.91-35.23-123.16-.32-3.45-.8-6.89-1.2-10.33v-36c1-7.74,1.79-15.5,2.86-23.23,8.06-57.93,30.88-109.28,71.21-151.7,67.09-70.55,150.24-98.35,246.11-86,75.62,9.71,138.64,44.83,189.43,101.75.74.82,1.61,1.52,2.53,2.39.91-1,1.61-1.66,2.26-2.4a297.6,297.6,0,0,1,98.07-74.34C690-5.4,769.66-11.19,849.33,21.27,948,61.45,1004.25,136.62,1021.1,241.55c1.24,7.69,1.95,15.47,2.9,23.21ZM922.22,282.9c-1.08-10.76-1.48-21.64-3.33-32.27-10-57.28-39.78-101.12-91.95-127.45-54.58-27.54-110.52-27-165.67-1.07-44.78,21.07-78.08,53.89-96.65,100.47-1.2,3-2.93,3.41-5.65,3.4-29.5-.06-59-.1-88.49.05-3.58,0-5.17-1.2-6.63-4.39C430.29,148.12,342.54,89.86,249.42,105.81c-41,7-76.09,25.21-103.36,56.83-38.87,45.08-49.77,97.9-40.53,155.58,5.72,35.66,20,68.21,38.16,99.15C171,463.93,205.43,505,242,544.39c57.44,61.87,119.67,118.78,182.1,175.48,28,25.43,56.23,50.62,84.27,76,5.68,5.15,6.89,5.4,12.43.28C568,752.47,615.47,709.05,662.35,665c54.55-51.26,108-103.64,156.07-161.17C846.69,470,872.66,434.6,892.47,395,910.12,359.76,921.42,322.79,922.22,282.9Z" />
                                        </g>
                                    </g>
                                </svg>
                                <svg v-show="favorited" class="love-btn" width="20" height="20" viewBox="0 0 1024 937.53"
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
                            <!--<div class="spacing"><svg width="21" height="21" viewBox="0 0 767.96 895.83" xmlns="http://www.w3.org/2000/svg" ><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M458.7,677.8,274.75,559.58c-35.29,34.33-77.25,51.15-126.42,47.61C104,604,67.35,584.86,38.16,551.38c-53.89-61.79-50.31-156.85,8.26-216.25,60.08-60.95,162.47-65.53,228.41.79L458.59,217.83c-17.32-49.24-14-96.72,13.09-141.57,19.67-32.52,47.82-55.37,83.9-67.49,75.65-25.39,155.7,5.8,193.1,74.7C785.34,151,768.21,236,708.87,284.05c-60.76,49.2-153.42,49.49-215.57-12.43l-184,118.25a161.11,161.11,0,0,1,0,115.78l184,118.23c64.15-64.7,163-61.37,223-6C774.44,671.56,785,760.17,740.5,825.46c-44.86,65.91-131.3,89-202.23,54.35C466.68,844.85,428.1,760.37,458.7,677.8ZM512,159.4a96,96,0,1,0,96.37-95.62A96.09,96.09,0,0,0,512,159.4Zm0,576a96,96,0,1,0,96.36-95.62A96.08,96.08,0,0,0,512,735.4ZM160.36,351.78A96,96,0,1,0,256,448.11,96,96,0,0,0,160.36,351.78Z"/></g></g></svg></div>-->
                        </div>
                        <div class="btm-center">
                            <PlayControl></PlayControl>
                        </div>
                        <div class="btm-right">
                            <div class="theme" @click="switchPlayingViewTheme">
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
                </div>
                <div class="lyric-wrap">
                    <LyricControl :track="currentTrack" :currentTime="currentTimeState" @mousewheel="onUserMouseWheel">
                    </LyricControl>
                </div>
            </div>
            <div class="bottom">
            </div>
        </div>
    </div>
</template>

<style scoped>
.visual-playing-view {
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.visual-playing-view .wrap {
    flex: 1;
}

.visual-playing-view .spacing {
    margin-left: 15px;
}

.visual-playing-view .header {
    height: 56px;
    display: flex;
    -webkit-app-region: drag;
}

.visual-playing-view .header svg {
    -webkit-app-region: none;
}

.visual-playing-view .header .win-ctl-wrap {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-left: var(--win-ctl-margin-left);
}

.visual-playing-view .meta-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
}

.visual-playing-view .meta {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex: 1;
    width: 61.8%;
}

.visual-playing-view .meta-wrap .audio-title,
.visual-playing-view .meta-wrap .audio-artist {
    font-weight: bold;
    color: var(--text-sub-color);
    text-align: left;

    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    align-items: center;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
}

.visual-playing-view .meta-wrap .audio-artist {
    -webkit-app-region: none;
}

.visual-playing-view .mv {
    margin-right: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}

.visual-playing-view svg {
    fill: var(--svg-color);
    cursor: pointer;
}

.visual-playing-view .header svg:hover,
.visual-playing-view .theme svg:hover,
.visual-playing-view .equalizer svg:hover,
.visual-playing-view .active svg,
.visual-playing-view .collapse-btn:hover svg {
    fill: var(--hl-color);
    fill: var(--svg-hover-color);
    cursor: pointer;
}

.visual-playing-view .center {
    flex: 1;
    display: flex;
    flex-direction: row;
    /* margin: 0px 60px; */
    padding-left: 60px;
    padding-right: 60px;
    overflow: hidden;
    height: 625px;
}

.visual-playing-view .center .left,
.visual-playing-view .center .lyric-wrap {
    flex: 1;
}

.visual-playing-view .center .left {
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-top: 30px;
    margin-right: 30px;
}

.visual-playing-view .cover img {
    width: 365px;
    height: 365px;
    border: 5px solid #292929;
    border-radius: 99rem;
    animation: rotate 10s linear infinite;
    animation-play-state: paused;
}

.visual-playing-view .rotation {
    animation-play-state: running !important;
}


.visual-playing-view .center .left .audio-time {
    margin: 0px 8px;
}

.visual-playing-view .progress-wrap {
    display: flex;
    flex-direction: row;
    justify-content: center;
    margin-bottom: 3px;
}

.visual-playing-view .progress-wrap .progress-bar {
    flex: 1;
    height: 2px;
}

.visual-playing-view .audio-time-wrap {
    position: relative;
    margin: 0px 2px 10px 2px;
    font-size: 13px;
    font-weight: 520px;
}

.visual-playing-view .audio-time-wrap .t-current {
    position: absolute;
    left: 0px;
}

.visual-playing-view .audio-time-wrap .t-duration {
    position: absolute;
    right: 0px;
}

.visual-playing-view .center .action {
    display: flex;
    justify-content: center;
    align-items: center;
}

.visual-playing-view .canvas-wrap {
    display: flex;
    flex-direction: row;
    justify-content: center;
    cursor: pointer;
    margin-top: 10px;
}

.visual-playing-view canvas {
    flex: 1;
    overflow: hidden;
}

.visual-playing-view .action svg:hover {
    fill: var(--svg-hover-color);
}

.visual-playing-view .action .love-btn {
    fill: var(--svg-hover-color) !important;
}

.visual-playing-view .action .btm-left,
.visual-playing-view .action .btm-right {
    width: 150px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.visual-playing-view .action .btm-left {
    justify-content: flex-start;
}

.visual-playing-view .action .btm-right {
    justify-content: flex-end;
}

.visual-playing-view .action .btm-center {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}

.visual-playing-view .volume-bar {
    width: 25px;
    /* margin-left: 3px; */
}

.visual-playing-view .volume-bar:hover {
    width: 88px;
}

.visual-playing-view .action .love-btn {
    fill: var(--svg-hover-color) !important;
}

.visual-playing-view .center .lyric-wrap {
    margin: 0px 0px 0px 30px;
}

.visual-playing-view .bottom {
    height: 56px;
}
</style>