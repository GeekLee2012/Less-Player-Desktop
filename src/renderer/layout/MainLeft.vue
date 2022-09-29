<script setup>
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router';
import { usePlatformStore } from '../store/platformStore';
import WinTrafficLightBtn from '../components/WinTrafficLightBtn.vue';
import { useMainViewStore } from '../store/mainViewStore';
import EventBus from '../../common/EventBus';
import { useUseCustomTrafficLight } from '../../common/Utils';

//是否使用自定义交通灯控件
const useCustomTrafficLight = useUseCustomTrafficLight()
const router = useRouter()

const { platforms, currentPlatformIndex, 
    currentPlatformCode, isLocal } = storeToRefs(usePlatformStore())
const { updateCurrentPlatform } = usePlatformStore()
const { isPlaylistMode, isArtistMode, isUserHomeMode, 
    exploreModeIndex, exploreModeCode } = storeToRefs(useMainViewStore())
const { setExploreMode } = useMainViewStore()

const updateNavIndex = (index) => {
    updateCurrentPlatform(index)
    const code = currentPlatformCode.value
    const exploreMode = exploreModeCode.value
    let url = isUserHomeMode.value ? '/' + exploreMode : (
        isLocal.value? '/' + code : ('/' + exploreMode + '/square/' + code))
    router.push(url)
}

const switchExploreMode = () => {
    const index = (exploreModeIndex.value + 1) % 3
    setExploreMode(index)
    updateNavIndex(0)
    EventBus.emit('exploreMode-changed', index)
}
</script>

<template>
    <div id="main-left">
        <div id="drag-zone">
            <WinTrafficLightBtn v-show="useCustomTrafficLight"></WinTrafficLightBtn>
        </div>
        <div id="explore-mode">
            <div class="mode-item" v-show="isPlaylistMode" @click="switchExploreMode">
                <svg width="15" height="15" viewBox="0 0 615.13 462.95" xmlns="http://www.w3.org/2000/svg" ><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M375.69,462.91q-98,0-195.93,0c-20.4,0-36.72-11.68-41.88-29.86-7.59-26.71,11.94-52.66,40.07-52.76,47.81-.17,95.63,0,143.44,0q125.46,0,250.91,0c20.3,0,36.88,12.5,41.49,31,6.65,26.77-12.93,51.49-41.18,51.6-39.15.16-78.3.05-117.45.05Z"/><path d="M375.74,272.72q-97.2,0-194.41,0c-11.19,0-21.47-2.34-30.21-9.69a41.23,41.23,0,0,1,26.29-72.9q108-.15,215.91-.06,89.46,0,178.92,0c21.48,0,37.82,13.09,42,33.35,4.9,23.42-12.33,46.72-36.15,48.83-3.64.32-7.32.39-11,.4Q471.45,272.74,375.74,272.72Z"/><path d="M375.92,0q98.46,0,196.92,0c20,0,36.41,12.51,40.95,30.91,6.54,26.48-12.62,51.21-40.23,51.38-38,.23-76,.07-113.95.07q-140,0-279.88,0c-20.59,0-36.71-11.49-41.86-29.75C130.31,25.87,149.79.13,178,.07Q277-.12,375.92,0Z"/><path d="M82.18,421.39A41.09,41.09,0,1,1,0,421.46a41.47,41.47,0,0,1,41.12-41.07A41.13,41.13,0,0,1,82.18,421.39Z"/><path d="M82.17,231.36A41.08,41.08,0,1,1,0,231.15a41.08,41.08,0,0,1,82.16.21Z"/><path d="M82.18,40.9A41.09,41.09,0,1,1,0,41.28a41.09,41.09,0,0,1,82.18-.38Z"/></g></g></svg>
                <div>歌单探索</div>
            </div>
            <div class="mode-item" v-show="isArtistMode" @click="switchExploreMode">
                <svg width="15" height="15" viewBox="0 0 810 854.54" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M385,0c117.88.3,213.35,96.08,213,213.66-.38,118.12-95.71,213.26-213.49,213.07s-213.49-96.16-213-213.58C172,95,267.43-.3,385,0Zm-.58,341.47c70.36.28,127.94-56.94,128.31-127.5a128,128,0,1,0-256-.64C256.5,283.64,313.83,341.19,384.37,341.47Z"/><path d="M640.7,682.51v-20q0-74,0-148c0-19.27,8.52-33,25.74-41.6,27.27-13.56,54.42-27.36,81.76-40.78,25.87-12.7,55.2,1.93,61,30.15,3.72,18-5.84,37.41-22.29,45.6-18.92,9.41-37.7,19.1-56.66,28.43-3.37,1.66-4.38,3.6-4.38,7.23q.17,107.74.09,215.48c0,46.09-36,88-81.81,93.46-20.79,2.51-42,3.79-62.43-2.85-38.64-12.58-61.61-39.33-68.54-79.37-.83-4.8.79-10.24,2.08-15.17a97.51,97.51,0,0,1,100-72.67C623.48,682.9,631.8,682.51,640.7,682.51Z"/><path d="M312.19,512q56.49,0,113,0c21.61,0,38.67,12.73,43.48,32.1,6.92,27.84-13.42,53.25-43,53.34-46.49.15-93,0-139.46,0-25.33,0-50.66-.34-76,.16-65,1.29-119.65,52.93-123.4,117.82-1.79,30.89-.74,61.95-.8,92.94,0,9.06-1.78,17.5-6.67,25.2a42.56,42.56,0,0,1-47,18.26C14.33,847,1,831.09.85,812.66c-.32-32.49-1.95-65.13.39-97.45,6.53-89.82,52.23-152.77,135-188.31,25.72-11,53.08-14.93,81-14.92Z"/></g></g></svg>
                <div>歌手探索</div>
            </div>
            <div class="mode-item" v-show="isUserHomeMode" @click="switchExploreMode">
                <svg width="16" height="16" viewBox="0 0 938.47 938.5" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M0,469C.33,209.53,210.36-.32,469.38,0,729.05.32,939.22,210.78,938.47,469.76c-.76,259.7-211.12,469.66-469.63,468.74C208.87,937.57-.33,728.06,0,469Zm453.81,128,.12-.34-1.95-.2c-53.39-5.09-94.44-29.95-122-76.3-14.75-24.84-23-52-27.21-80.35-4.62-31.1-6.87-62.34-.49-93.46,10.07-49.16,36-87.34,80.26-111.88,32.13-17.8,67-23.53,103.32-20.28,46.06,4.12,84.22,23.72,113.49,59.63,24.9,30.54,37.7,66,39.88,105.16,2.3,41.55-2.47,82.21-19,120.79-19.26,44.86-51.57,75.78-98.75,90.18a171.59,171.59,0,0,1-18,4.28c-6,1.14-12.07,1.77-19.36,2.8,2.76.19,4.26.35,5.75.38,39.17.82,78.23,3.08,117,8.94,33.49,5.07,66.42,12.41,97.94,25.1,27.78,11.19,53.28,25.93,73.53,48.57,2.16,2.43,4.24,4.93,6.42,7.46,100.84-141.58,96.84-361.06-57.33-502.35C576.61,46.82,340.65,52.88,196.73,198.77,51.56,345.94,60.23,558.41,153.79,687.36c2.07-2.44,4.06-4.88,6.15-7.22,23.12-25.8,52.64-41.45,84.68-52.86,50.51-18,103.12-24.68,156.28-28C418.51,598.18,436.17,597.7,453.81,596.94Zm15.45,85.56c-55,0-99.89,3.54-143.71,11.75C299.3,699.17,273.61,706,250,719c-13.9,7.67-26.18,17.11-33.23,32-1.83,3.88-1.62,6.33,1.92,9.29,86,71.89,184.71,102.35,296.12,90,74.25-8.24,140.09-37.15,198-84.26,12.85-10.45,12.94-12.24,2.41-25.61-9-11.4-20.9-19-33.75-25.16-25-12-51.65-18.4-78.78-23C558.52,684.74,513.94,682.83,469.26,682.5ZM383.5,389.86c1,11.78,1.58,23.6,3,35.32a178.07,178.07,0,0,0,4.84,24c10.64,39.94,33.24,60,72.16,62.46,39.11,2.43,67.94-13.22,81.51-52.5,9.63-27.85,11.93-56.79,7.84-85.82-3.8-26.92-16.6-49.06-40.58-63.43C495,299.51,476.06,297,456.38,299.32c-31.89,3.81-55.18,19.38-66.8,50.18C384.68,362.46,383.45,376,383.5,389.86Z"/></g></g></svg>
                <div>我的主页</div>
            </div>
        </div>
        <div id="platform-list">
            <ul>
                <li v-for="(nav, index) in platforms()" 
                    :class="{ active: (currentPlatformIndex == index) }"
                    @click="updateNavIndex(index)" >
                    {{ nav.name }}
                </li>
            </ul>
        </div>
        <div id="app-mark">
            <div id="app-logo" >L</div>
            <div id="app-title" >Less Player</div>
        </div>
    </div>
</template>

<style>
#main-left {
    width: 16.5%;
    height: 100%;
    box-shadow: 0px 0px 3px var(--main-left-border-color);
}

#drag-zone {
    -webkit-app-region: drag;
    height: 65px;
    margin-bottom: 6px;
}

#explore-mode {
    margin-bottom: 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: var(--text-sub-color);
}

#explore-mode svg {
    fill: var(--text-sub-color);
    margin-right: 6px;
}

#explore-mode .mode-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 3px 6px;
    margin-right: 20%;
}

#explore-mode .mode-item:hover div{
    color: var(--hl-color);
}

#explore-mode .mode-item:hover svg{
    fill: var(--hl-color);
}

#platform-list ul {
    list-style: none;
    text-align: left;
    line-height: 32px;
    padding-left: 10%;
}

#platform-list li {
    text-decoration: none;
    width: 75%;
    margin-bottom: 10.5px;
    padding-left: 15%;
    cursor: pointer;
    border-radius: 10rem;
    border-radius: 5px;
}

#platform-list li:hover {
    background-color: var(--list-item-hover);
}

#platform-list .active {
    background: var(--btn-bg);
    color: var(--svg-btn-color);
}

#app-mark {
    position: absolute;
    bottom: 25px;
    width: 16.5%;
    display: flex;
    align-items: center;
    justify-content: center;
}

#app-logo {
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10rem 0 10rem 10rem;
    border: 0px solid;
    font-weight: bold;
    background: var(--btn-bg);
    color: var(--svg-btn-color);
}

#app-title {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 8px;
    font-size: 17.1px;
    font-weight: bold;
    background: var(--btn-bg);
    -webkit-background-clip: text;
    color: transparent;
}
</style>