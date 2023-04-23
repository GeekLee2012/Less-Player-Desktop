<script setup>
import { onMounted, ref, watch, inject } from 'vue';
import { storeToRefs } from 'pinia';
import PlayMeta from '../components/PlayMeta.vue';
import { useAppCommonStore } from '../store/appCommonStore';
import { usePlayStore } from '../store/playStore';
import { useUserProfileStore } from '../store/userProfileStore';
import { useSoundEffectStore } from '../store/soundEffectStore';
import EventBus from '../../common/EventBus';
import { Playlist } from '../../common/Playlist';



const { seekTrack, progressState } = inject('player')

const volumeBarRef = ref(null)

const { currentTrack, playingIndex, volume, playing } = storeToRefs(usePlayStore())
const { isUseEffect } = storeToRefs(useSoundEffectStore())
const { playingViewShow, } = storeToRefs(useAppCommonStore())
const { showToast, toggleSoundEffectView } = useAppCommonStore()


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

EventBus.on("userProfile-reset", checkFavorite)
EventBus.on("refreshFavorite", checkFavorite)

onMounted(() => {
    //setDisactived(false)
    if (volumeBarRef) volumeBarRef.value.setVolume(volume.value)
})

watch([currentTrack, playingViewShow], checkFavorite)
</script>

<template>
    <div class="classic-main-bottom">
        <ProgressBar id="progress-bar" :value="progressState" :seekable="playing" :onseek="seekTrack">
        </ProgressBar>
        <div id="play-nav">
            <PlayMeta id="play-meta" :hideVolumeBar="true"></PlayMeta>
            <div class="play-ctl-wrap">
                <PlayControl></PlayControl>
            </div>
            <div class="right">
                <div class="volume-wrap">
                    <VolumeBar ref="volumeBarRef"></VolumeBar>
                </div>
                <div class="spacing" @click="toggleFavorite">
                    <svg v-show="!favorited" width="18" height="17" viewBox="0 0 1024 937.46"
                        xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M1024,299.77c-.89,7.24-1.74,14.5-2.67,21.74-5.4,41.95-19.53,81-39,118.35-24.74,47.39-56.62,89.8-91.22,130.27-48.69,57-101.85,109.6-156.46,160.77C661.69,799.26,588.19,867,514.93,935.05c-.85.78-1.75,1.49-2.85,2.41-1.09-.89-2.14-1.65-3.09-2.52q-101.8-92.36-203.56-184.77c-58.71-53.61-116.12-108.59-168.2-168.81-39.12-45.23-74.7-92.93-100.8-147.1-18.8-39-31.17-79.91-35.23-123.16-.32-3.45-.8-6.89-1.2-10.33v-36c1-7.74,1.79-15.5,2.86-23.23,8.06-57.93,30.88-109.28,71.21-151.7,67.09-70.55,150.24-98.35,246.11-86,75.62,9.71,138.64,44.83,189.43,101.75.74.82,1.61,1.52,2.53,2.39.91-1,1.61-1.66,2.26-2.4a297.6,297.6,0,0,1,98.07-74.34C690-5.4,769.66-11.19,849.33,21.27,948,61.45,1004.25,136.62,1021.1,241.55c1.24,7.69,1.95,15.47,2.9,23.21ZM922.22,282.9c-1.08-10.76-1.48-21.64-3.33-32.27-10-57.28-39.78-101.12-91.95-127.45-54.58-27.54-110.52-27-165.67-1.07-44.78,21.07-78.08,53.89-96.65,100.47-1.2,3-2.93,3.41-5.65,3.4-29.5-.06-59-.1-88.49.05-3.58,0-5.17-1.2-6.63-4.39C430.29,148.12,342.54,89.86,249.42,105.81c-41,7-76.09,25.21-103.36,56.83-38.87,45.08-49.77,97.9-40.53,155.58,5.72,35.66,20,68.21,38.16,99.15C171,463.93,205.43,505,242,544.39c57.44,61.87,119.67,118.78,182.1,175.48,28,25.43,56.23,50.62,84.27,76,5.68,5.15,6.89,5.4,12.43.28C568,752.47,615.47,709.05,662.35,665c54.55-51.26,108-103.64,156.07-161.17C846.69,470,872.66,434.6,892.47,395,910.12,359.76,921.42,322.79,922.22,282.9Z" />
                            </g>
                        </g>
                    </svg>
                    <svg v-show="favorited" class="love-btn" width="18" height="17" viewBox="0 0 1024 937.53"
                        xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M1024,264.78v35c-.41,3.45-.89,6.89-1.23,10.34-3.89,39.7-15.25,77.26-32.22,113.22-23.28,49.33-54.76,93.24-89.46,135-49.41,59.44-104,113.93-160.28,166.77-74.94,70.39-150.55,140-225.89,210-.93.87-2,1.58-3.1,2.42-1.47-1.32-2.72-2.41-3.93-3.54-20.27-18.82-40.33-37.87-60.84-56.43C396.63,832,345.74,786.88,295.54,741c-52.69-48.1-103.88-97.76-151.07-151.36-37.41-42.48-71.92-87-98.75-137.15C23.93,411.83,8.38,369.06,2.64,323,1.71,315.62.88,308.2,0,300.79v-36c1-7.74,1.79-15.51,2.86-23.24,8.06-57.92,30.88-109.28,71.21-151.7C141.16,19.28,224.31-8.52,320.18,3.78c75.62,9.71,138.64,44.83,189.43,101.76.74.82,1.61,1.52,2.53,2.39.91-1,1.61-1.66,2.26-2.4a297.49,297.49,0,0,1,98.07-74.35C690-5.4,769.66-11.19,849.33,21.27,948,61.46,1004.25,136.63,1021.1,241.57,1022.34,249.26,1023.05,257,1024,264.78Z" />
                            </g>
                        </g>
                    </svg>
                </div>
                <div class="equalizer spacing" :class="{ active: isUseEffect }" @click="toggleSoundEffectView">
                    <svg width="17" height="16" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
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
</template>

<style>
.classic-main-bottom,
#play-nav {
    display: flex;
}

.classic-main-bottom {
    flex-direction: column;
    height: var(--main-play-nav-height);
    -webkit-app-region: none;
    padding-top: 8px;
}

.classic-main-bottom .spacing {
    margin-left: 15px;
}

.classic-main-bottom #progress-bar {
    height: 2px;
}

.classic-main-bottom #play-nav #play-meta {
    width: 34.33%;
}

.classic-main-bottom #play-nav {
    padding-left: 28px;
}

.classic-main-bottom #play-nav #play-meta .cover-wrap,
.classic-main-bottom #play-nav #play-meta .audio-cover,
.classic-main-bottom #play-nav #play-meta .cover-mask {
    width: 45px;
    height: 45px;
    border-radius: 3px;
}

.classic-main-bottom #play-nav #play-meta .title-wrap {
    padding-bottom: 7px;
}

.classic-main-bottom #play-nav .play-ctl-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0px 15px;
}

.classic-main-bottom #play-nav .right {
    width: 33.33%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    padding-right: 33px;
}

.classic-main-bottom svg {
    fill: var(--svg-color);
    cursor: pointer;
}

.classic-main-bottom svg:hover,
.classic-main-bottom .active svg {
    fill: var(--svg-hover-color);
}

.classic-main-bottom .volume-bar {
    width: 21px;
    /* margin-left: 3px; */
}

.classic-main-bottom .volume-bar:hover {
    width: 100px;
}

.classic-main-bottom .love-btn {
    fill: var(--svg-hover-color) !important;
}
</style>