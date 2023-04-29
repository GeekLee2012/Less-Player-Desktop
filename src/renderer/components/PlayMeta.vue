<script setup>
import { onMounted, ref, inject, watch } from 'vue';
import VolumeBar from './VolumeBar.vue';
import AudioTime from './AudioTime.vue';
import { useAppCommonStore } from '../store/appCommonStore';
import { usePlayStore } from '../store/playStore';
import { storeToRefs } from 'pinia';
import EventBus from '../../common/EventBus';
import { Track } from '../../common/Track';


const { mmssCurrentTime } = inject('player')

const props = defineProps({
    hideVolumeBar: Boolean,
})

const { currentTrack, volume, playing } = storeToRefs(usePlayStore())
const { coverMaskShow } = storeToRefs(useAppCommonStore())
const { showPlayingView, toggleCoverMask } = useAppCommonStore()
const volumeBarRef = ref(null)

const trackMeta = (track) => {
    let artistName = Track.artistName(track)
    if (artistName.length > 0) artistName = ' - ' + artistName
    return track.title + artistName
}


onMounted(() => {
    if (volumeBarRef) volumeBarRef.value.setVolume(volume.value)
})
</script>

<template>
    <div class="play-meta">
        <div class="cover-wrap" @mouseenter="toggleCoverMask" @mouseleave="toggleCoverMask">
            <img class="audio-cover" v-lazy="currentTrack.cover" />
            <div class="cover-mask" v-show="coverMaskShow" @click="showPlayingView">
                <svg width="19" height="19" viewBox="0 0 763.32 424.57" xmlns="http://www.w3.org/2000/svg">
                    <g id="Layer_2" data-name="Layer 2">
                        <g id="Layer_1-2" data-name="Layer 1">
                            <path
                                d="M380.47,322.11c27.6-27.5,54-53.68,80.23-80Q575,127.75,689.38,13.4C708.7-5.81,735-2.92,750.83,12.91c17,17,16.57,43.39-.9,60.87L414.1,409.61c-19.89,19.89-45,20-64.9.08Q180.9,241.45,12.66,73.15A42.53,42.53,0,1,1,72.85,13Q224.7,164.87,376.48,316.73A46.1,46.1,0,0,1,380.47,322.11Z" />
                        </g>
                    </g>
                </svg>
            </div>
        </div>
        <div class="title-wrap">
            <div class="audio-title-wrap">
                <div class="audio-title" v-html="trackMeta(currentTrack)"></div>
                <div class="favorite-btn">
                    <svg v-show="true" width="18" height="18" viewBox="0 0 1024 937.46" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M1024,299.77c-.89,7.24-1.74,14.5-2.67,21.74-5.4,41.95-19.53,81-39,118.35-24.74,47.39-56.62,89.8-91.22,130.27-48.69,57-101.85,109.6-156.46,160.77C661.69,799.26,588.19,867,514.93,935.05c-.85.78-1.75,1.49-2.85,2.41-1.09-.89-2.14-1.65-3.09-2.52q-101.8-92.36-203.56-184.77c-58.71-53.61-116.12-108.59-168.2-168.81-39.12-45.23-74.7-92.93-100.8-147.1-18.8-39-31.17-79.91-35.23-123.16-.32-3.45-.8-6.89-1.2-10.33v-36c1-7.74,1.79-15.5,2.86-23.23,8.06-57.93,30.88-109.28,71.21-151.7,67.09-70.55,150.24-98.35,246.11-86,75.62,9.71,138.64,44.83,189.43,101.75.74.82,1.61,1.52,2.53,2.39.91-1,1.61-1.66,2.26-2.4a297.6,297.6,0,0,1,98.07-74.34C690-5.4,769.66-11.19,849.33,21.27,948,61.45,1004.25,136.62,1021.1,241.55c1.24,7.69,1.95,15.47,2.9,23.21ZM922.22,282.9c-1.08-10.76-1.48-21.64-3.33-32.27-10-57.28-39.78-101.12-91.95-127.45-54.58-27.54-110.52-27-165.67-1.07-44.78,21.07-78.08,53.89-96.65,100.47-1.2,3-2.93,3.41-5.65,3.4-29.5-.06-59-.1-88.49.05-3.58,0-5.17-1.2-6.63-4.39C430.29,148.12,342.54,89.86,249.42,105.81c-41,7-76.09,25.21-103.36,56.83-38.87,45.08-49.77,97.9-40.53,155.58,5.72,35.66,20,68.21,38.16,99.15C171,463.93,205.43,505,242,544.39c57.44,61.87,119.67,118.78,182.1,175.48,28,25.43,56.23,50.62,84.27,76,5.68,5.15,6.89,5.4,12.43.28C568,752.47,615.47,709.05,662.35,665c54.55-51.26,108-103.64,156.07-161.17C846.69,470,872.66,434.6,892.47,395,910.12,359.76,921.42,322.79,922.22,282.9Z" />
                            </g>
                        </g>
                    </svg>
                    <svg v-show="false" width="18" height="18" viewBox="0 0 1024 937.53" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M1024,264.78v35c-.41,3.45-.89,6.89-1.23,10.34-3.89,39.7-15.25,77.26-32.22,113.22-23.28,49.33-54.76,93.24-89.46,135-49.41,59.44-104,113.93-160.28,166.77-74.94,70.39-150.55,140-225.89,210-.93.87-2,1.58-3.1,2.42-1.47-1.32-2.72-2.41-3.93-3.54-20.27-18.82-40.33-37.87-60.84-56.43C396.63,832,345.74,786.88,295.54,741c-52.69-48.1-103.88-97.76-151.07-151.36-37.41-42.48-71.92-87-98.75-137.15C23.93,411.83,8.38,369.06,2.64,323,1.71,315.62.88,308.2,0,300.79v-36c1-7.74,1.79-15.51,2.86-23.24,8.06-57.92,30.88-109.28,71.21-151.7C141.16,19.28,224.31-8.52,320.18,3.78c75.62,9.71,138.64,44.83,189.43,101.76.74.82,1.61,1.52,2.53,2.39.91-1,1.61-1.66,2.26-2.4a297.49,297.49,0,0,1,98.07-74.35C690-5.4,769.66-11.19,849.33,21.27,948,61.46,1004.25,136.63,1021.1,241.57,1022.34,249.26,1023.05,257,1024,264.78Z" />
                            </g>
                        </g>
                    </svg>
                </div>
            </div>
            <div class="time-volume-wrap">
                <AudioTime :current="mmssCurrentTime" :duration="Track.mmssDuration(currentTrack)"></AudioTime>
                <VolumeBar class="volume-bar" ref="volumeBarRef" v-show="!hideVolumeBar"></VolumeBar>
            </div>
        </div>
    </div>
</template>

<style>
.play-meta {
    display: flex;
    height: var(--play-meta-height);
    align-items: center;
}

.play-meta .title-wrap {
    width: 211px;
    margin-left: 10px;
}

.play-meta .audio-title-wrap {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: flex-end;
    height: 33px;
}

.play-meta .cover-wrap {
    position: relative;
    width: var(--play-meta-height);
    height: var(--play-meta-height);
    box-shadow: 0px 0px 1px #161616;
    box-shadow: 0px 0px 1px var(--main-left-border-color);
}

.play-meta .audio-cover,
.play-meta .cover-mask {
    /*width: 100%;*/
    width: var(--play-meta-height);
    height: var(--play-meta-height);
    cursor: pointer;
    -webkit-user-drag: none;
    -webkit-app-region: no-drag;

    position: absolute;
    top: 0px;
    left: 0px;
    z-index: 1;
}

.play-meta .audio-cover {
    background-color: var(--text-color);
}

.play-meta .cover-mask {
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--ntf-bg);
    opacity: 0.68;
}

.play-meta .cover-mask svg {
    fill: var(--svg-color) !important;
}

.play-meta .audio-title {
    font-size: 14;
    text-align: left;

    vertical-align: bottom;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    width: 211px;
}

.play-meta .favorite-btn {
    margin-top: 15px;
    margin-left: 15px;
    cursor: pointer;
    display: none;
}

.play-meta .favorite-btn svg {
    fill: var(--svg-color);
}

.play-meta .favorite-btn:hover svg {
    fill: var(--hl-color);
}

.play-meta .time-volume-wrap {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 211px;
    /* justify-content: center; */
}

.play-meta .audio-time,
.play-meta .volume-bar {
    line-height: 30px;
}

.play-meta .audio-time {
    color: var(--text-sub-color);
    font-size: 14px;
    font-size: var(--tip-text-size);
    text-align: left;
    flex: 1;
}

.play-meta .volume-bar {
    margin-left: 10px;
    margin-top: 3px;
}

.play-meta .volume-status {
    width: 18px;
    margin-top: 6px;
}

.play-meta .st-slient,
.play-meta .st-small,
.play-meta .st-large {
    width: 18px;
    height: 18px;
}

.play-meta .volume-value {
    width: 66px;
    margin-left: 3px;
}
</style>
