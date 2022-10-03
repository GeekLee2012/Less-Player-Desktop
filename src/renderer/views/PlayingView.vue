<script setup>
import { onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlayStore } from '../store/playStore';
import { useMainViewStore } from '../store/mainViewStore';
import LyricControl from '../components/LyricControl.vue';
import EventBus from '../../common/EventBus';
import { Track } from '../../common/Track';
import WinTrafficLightBtn from '../components/WinTrafficLightBtn.vue';
import { useUserProfileStore } from '../store/userProfileStore';
import { useUseCustomTrafficLight } from '../../common/Utils';

//是否使用自定义交通灯控件
const useCustomTrafficLight = useUseCustomTrafficLight()

const { playingViewShow } = storeToRefs(useMainViewStore())
const { hidePlayingView, minimize, showToast } = useMainViewStore()
const { currentTrack, mmssCurrentTime, progress, playingIndex } = storeToRefs(usePlayStore())
const progressBarRef = ref(null)

const seekTrack = (percent) => {
    EventBus.emit('track-seek', percent)
}

const { addFavouriteTrack, removeFavouriteSong,
    isFavouriteSong, addFavouriteRadio,
    removeFavouriteRadio, isFavouriteRadio } = useUserProfileStore()
const favourited = ref(false)
const toggleFavourite = () => {
    if(playingIndex.value < 0) return 
    favourited.value = !favourited.value
    const { id, platform, isFMRadio } = currentTrack.value
    let text = "歌曲收藏成功！"
    if(favourited.value) {
        if(isFMRadio) {
            addFavouriteRadio(currentTrack.value)
            text = "FM电台收藏成功！"
        } else {
            addFavouriteTrack(currentTrack.value)
        }
    } else {
        text = "歌曲已取消收藏！"
        if(isFMRadio) {
            text = "FM电台已取消收藏！"
            removeFavouriteRadio(id, platform)
        } else {
            removeFavouriteSong(id, platform)
        }
    }
    showToast(text)
}

const checkFavourite = () => {
    //if(playingIndex.value < 0) return 
    const { id, platform } = currentTrack.value
    favourited.value = isFavouriteRadio(id, platform) || isFavouriteSong(id, platform)
}

watch(progress, (nv, ov) => {
    progressBarRef.value.updateProgress(nv)
})

EventBus.on("userProfile-reset", checkFavourite)
EventBus.on("refreshFavourite", checkFavourite)

watch([currentTrack, playingViewShow ], checkFavourite)
</script>

<template>
    <div class="playing-view">
        <div class="header">
            <WinTrafficLightBtn v-show="useCustomTrafficLight"></WinTrafficLightBtn>
            <div class="close-btn" @click="minimize">
                <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 593.14 593.11"><path d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z" transform="translate(-663.4 -243.46)"/></svg>
            </div>
            <div class="collapse-btn" @click="hidePlayingView">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640.13 352.15"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><g id="Layer_2-2" data-name="Layer 2"><g id="Layer_1-2-2" data-name="Layer 1-2"><path d="M319.64,76.3c-1.91,2.59-3,4.52-4.51,6Q186,211.6,56.78,340.8c-8.31,8.34-17.87,12.87-29.65,10.88-12.51-2.12-21.24-9.34-25.29-21.48-4.12-12.35-1.23-23.43,7.71-32.7C19.73,287,30.24,276.72,40.61,266.35L289.12,17.84c2.94-2.94,5.74-6,8.75-8.91a32.1,32.1,0,0,1,44.28-.15c3.15,3,6.05,6.2,9.11,9.26Q490,156.79,628.78,295.5c10.11,10.1,14.13,21.64,9.33,35.44a31.75,31.75,0,0,1-48.49,15.2,58.8,58.8,0,0,1-7.07-6.31Q453.85,211.22,325.2,82.51C323.68,81,322.32,79.3,319.64,76.3Z"/></g></g></g></g></svg>
            </div>
        </div>
        <div class="center">
            <div class="cover">
                <img v-lazy="currentTrack.cover" />
            </div>
            <div class="lyric-view">
                <LyricControl :track="currentTrack"></LyricControl>
            </div>
        </div>
        <div class="bottom">
            <ProgressBar ref="progressBarRef" :onseek="seekTrack"></ProgressBar>
            <div class="action">
                <div class="btm-left">
                    <div @click="toggleFavourite">
                        <svg v-show="!favourited" width="20" height="20" viewBox="0 0 1024 937.46" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M1024,299.77c-.89,7.24-1.74,14.5-2.67,21.74-5.4,41.95-19.53,81-39,118.35-24.74,47.39-56.62,89.8-91.22,130.27-48.69,57-101.85,109.6-156.46,160.77C661.69,799.26,588.19,867,514.93,935.05c-.85.78-1.75,1.49-2.85,2.41-1.09-.89-2.14-1.65-3.09-2.52q-101.8-92.36-203.56-184.77c-58.71-53.61-116.12-108.59-168.2-168.81-39.12-45.23-74.7-92.93-100.8-147.1-18.8-39-31.17-79.91-35.23-123.16-.32-3.45-.8-6.89-1.2-10.33v-36c1-7.74,1.79-15.5,2.86-23.23,8.06-57.93,30.88-109.28,71.21-151.7,67.09-70.55,150.24-98.35,246.11-86,75.62,9.71,138.64,44.83,189.43,101.75.74.82,1.61,1.52,2.53,2.39.91-1,1.61-1.66,2.26-2.4a297.6,297.6,0,0,1,98.07-74.34C690-5.4,769.66-11.19,849.33,21.27,948,61.45,1004.25,136.62,1021.1,241.55c1.24,7.69,1.95,15.47,2.9,23.21ZM922.22,282.9c-1.08-10.76-1.48-21.64-3.33-32.27-10-57.28-39.78-101.12-91.95-127.45-54.58-27.54-110.52-27-165.67-1.07-44.78,21.07-78.08,53.89-96.65,100.47-1.2,3-2.93,3.41-5.65,3.4-29.5-.06-59-.1-88.49.05-3.58,0-5.17-1.2-6.63-4.39C430.29,148.12,342.54,89.86,249.42,105.81c-41,7-76.09,25.21-103.36,56.83-38.87,45.08-49.77,97.9-40.53,155.58,5.72,35.66,20,68.21,38.16,99.15C171,463.93,205.43,505,242,544.39c57.44,61.87,119.67,118.78,182.1,175.48,28,25.43,56.23,50.62,84.27,76,5.68,5.15,6.89,5.4,12.43.28C568,752.47,615.47,709.05,662.35,665c54.55-51.26,108-103.64,156.07-161.17C846.69,470,872.66,434.6,892.47,395,910.12,359.76,921.42,322.79,922.22,282.9Z"/></g></g></svg>
                        <svg v-show="favourited" class="love-btn" width="20" height="20" viewBox="0 0 1024 937.53" xmlns="http://www.w3.org/2000/svg" ><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M1024,264.78v35c-.41,3.45-.89,6.89-1.23,10.34-3.89,39.7-15.25,77.26-32.22,113.22-23.28,49.33-54.76,93.24-89.46,135-49.41,59.44-104,113.93-160.28,166.77-74.94,70.39-150.55,140-225.89,210-.93.87-2,1.58-3.1,2.42-1.47-1.32-2.72-2.41-3.93-3.54-20.27-18.82-40.33-37.87-60.84-56.43C396.63,832,345.74,786.88,295.54,741c-52.69-48.1-103.88-97.76-151.07-151.36-37.41-42.48-71.92-87-98.75-137.15C23.93,411.83,8.38,369.06,2.64,323,1.71,315.62.88,308.2,0,300.79v-36c1-7.74,1.79-15.51,2.86-23.24,8.06-57.92,30.88-109.28,71.21-151.7C141.16,19.28,224.31-8.52,320.18,3.78c75.62,9.71,138.64,44.83,189.43,101.76.74.82,1.61,1.52,2.53,2.39.91-1,1.61-1.66,2.26-2.4a297.49,297.49,0,0,1,98.07-74.35C690-5.4,769.66-11.19,849.33,21.27,948,61.46,1004.25,136.63,1021.1,241.57,1022.34,249.26,1023.05,257,1024,264.78Z"/></g></g></svg>
                    </div>
                    <div class="spacing">
                        <svg width="20" height="20" viewBox="0 0 767.96 895.83" xmlns="http://www.w3.org/2000/svg" ><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M458.7,677.8,274.75,559.58c-35.29,34.33-77.25,51.15-126.42,47.61C104,604,67.35,584.86,38.16,551.38c-53.89-61.79-50.31-156.85,8.26-216.25,60.08-60.95,162.47-65.53,228.41.79L458.59,217.83c-17.32-49.24-14-96.72,13.09-141.57,19.67-32.52,47.82-55.37,83.9-67.49,75.65-25.39,155.7,5.8,193.1,74.7C785.34,151,768.21,236,708.87,284.05c-60.76,49.2-153.42,49.49-215.57-12.43l-184,118.25a161.11,161.11,0,0,1,0,115.78l184,118.23c64.15-64.7,163-61.37,223-6C774.44,671.56,785,760.17,740.5,825.46c-44.86,65.91-131.3,89-202.23,54.35C466.68,844.85,428.1,760.37,458.7,677.8ZM512,159.4a96,96,0,1,0,96.37-95.62A96.09,96.09,0,0,0,512,159.4Zm0,576a96,96,0,1,0,96.36-95.62A96.08,96.08,0,0,0,512,735.4ZM160.36,351.78A96,96,0,1,0,256,448.11,96,96,0,0,0,160.36,351.78Z"/></g></g></svg>
                    </div>
                </div>
                <div>
                    <AudioTime :current="mmssCurrentTime" :duration="Track.mmssDuration(currentTrack)"></AudioTime>
                </div>
                <div class="btm-center">
                    <PlayControl></PlayControl>
                </div>
                <div>
                    <VolumeBar></VolumeBar>
                </div>
                <div class="btm-right"></div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.playing-view {
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.playing-view .spacing {
    margin-left: 15px;
}

.playing-view .header {
    height: 56px;
    display: flex;
    -webkit-app-region: drag;
}

.playing-view .close-btn {
    width: 14px;
    height: 14px;
    margin-top: 20px;
    margin-left: 25px;
    cursor: pointer;
    display: none;
}

.playing-view .collapse-btn {
    width: 18px;
    height: 18px;
    margin-top: 15px;
    /* margin-left: 15px; */
    position: absolute;
    left: 80px;
    cursor: pointer;
    -webkit-app-region: none;
}

.playing-view .header svg {
    fill: var(--svg-color);
}

.playing-view .header svg:hover, 
.playing-view .collapse-btn:hover svg {
    fill: var(--hl-color);
    cursor: pointer;
}

.playing-view .center {
    flex: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-left: 99px;
    margin-right: 99px;
}

.playing-view .cover,
.playing-view .lyric-view {
    flex: 1;
}

.playing-view .center .cover {
    margin-right: 50px;
}

.playing-view .cover img {
    width: 265px;
    height: 265px;
    border: 5px solid #292929;
    border-radius: 3px;
}

.playing-view .bottom {
    height: 68px;
    margin-bottom: 5px;
}

.playing-view .bottom .action {
    display: flex;
    justify-content: center;
    align-items: center;
}

.playing-view .bottom .action > div {
    flex: 1;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
}

.playing-view .bottom .action .btm-left svg {
    fill: var(--svg-color);
    cursor: pointer;
}

.playing-view .bottom .action .btm-left svg:hover {
    fill: var(--hl-color);
}

.playing-view .bottom .action .love-btn {
    fill: var(--hl-color) !important;
}
</style>