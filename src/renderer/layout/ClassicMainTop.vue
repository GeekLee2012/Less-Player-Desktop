<script setup>
import { inject, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import SearchBar from '../components/SearchBar.vue';
import Navigator from '../components/Navigator.vue';
import { usePlayStore } from '../store/playStore';

const { visitThemes, visitUserHome, visitSetting } = inject('appRoute')

const progressBarRef = ref(null)
const { progress } = storeToRefs(usePlayStore())

watch(progress, (nv, ov) => {
    if(progressBarRef) progressBarRef.value.updateProgress(nv)
})
</script>

<template>
    <div class="classic-main-top">
        <Navigator></Navigator>
        <SearchBar></SearchBar>
        <div class="right">
            <div id="theme-btn" @click="visitThemes">
                <svg width="23" height="23" viewBox="0 0 426.88 363.08" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M213.14,363.05q-77,0-154,0C31.2,363,8,345.53,1.83,319.2c-5.56-24,1.58-44.2,20.82-59.66Q98.46,198.65,174.49,138c4.94-3.95,10-7.75,14.74-12a8.87,8.87,0,0,0,2.75-5.77c.21-18.17.2-36.34.09-54.51C192,52.11,183,42.79,170.27,43c-12.33.18-20.88,9.62-20.92,23.13,0,6.51.1,13,0,19.51a21.36,21.36,0,0,1-20.38,21.27c-10.69.65-21-7.3-21.82-18.47-1.08-13.91-1.84-28,2.06-41.72,8.5-29.93,38.1-50,68.12-46.24,32.51,4.06,56.48,29.69,57.19,61.74.42,19,.18,38,.07,57a8.49,8.49,0,0,0,3.54,7.55q82.48,65.78,164.8,131.74c23.43,18.76,30.6,47.46,17.5,72.75C409.32,352.62,391,362.93,367.15,363,315.82,363.15,264.48,363.05,213.14,363.05Zm.39-42.77h123c10.83,0,21.67.1,32.5,0,6.64-.09,11.4-3.44,13.93-9.57,2.47-6,.8-12.13-4.28-16.76-1.23-1.12-2.54-2.15-3.84-3.19q-78.66-62.92-157.26-125.94c-3.2-2.57-5.06-2.73-8.35-.08q-51.56,41.58-103.38,82.85-28.11,22.48-56.2,45c-7,5.65-9,13-5.16,19.82,3.26,5.81,8.46,8,15,8Q136.51,320.22,213.53,320.28Z"/></g></g></svg>
            </div>
            <div id="userhome-btn" @click="visitUserHome">
                <svg width="24" height="23" viewBox="0 0 938.47 938.5" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M0,469C.33,209.53,210.36-.32,469.38,0,729.05.32,939.22,210.78,938.47,469.76c-.76,259.7-211.12,469.66-469.63,468.74C208.87,937.57-.33,728.06,0,469Zm453.81,128,.12-.34-1.95-.2c-53.39-5.09-94.44-29.95-122-76.3-14.75-24.84-23-52-27.21-80.35-4.62-31.1-6.87-62.34-.49-93.46,10.07-49.16,36-87.34,80.26-111.88,32.13-17.8,67-23.53,103.32-20.28,46.06,4.12,84.22,23.72,113.49,59.63,24.9,30.54,37.7,66,39.88,105.16,2.3,41.55-2.47,82.21-19,120.79-19.26,44.86-51.57,75.78-98.75,90.18a171.59,171.59,0,0,1-18,4.28c-6,1.14-12.07,1.77-19.36,2.8,2.76.19,4.26.35,5.75.38,39.17.82,78.23,3.08,117,8.94,33.49,5.07,66.42,12.41,97.94,25.1,27.78,11.19,53.28,25.93,73.53,48.57,2.16,2.43,4.24,4.93,6.42,7.46,100.84-141.58,96.84-361.06-57.33-502.35C576.61,46.82,340.65,52.88,196.73,198.77,51.56,345.94,60.23,558.41,153.79,687.36c2.07-2.44,4.06-4.88,6.15-7.22,23.12-25.8,52.64-41.45,84.68-52.86,50.51-18,103.12-24.68,156.28-28C418.51,598.18,436.17,597.7,453.81,596.94Zm15.45,85.56c-55,0-99.89,3.54-143.71,11.75C299.3,699.17,273.61,706,250,719c-13.9,7.67-26.18,17.11-33.23,32-1.83,3.88-1.62,6.33,1.92,9.29,86,71.89,184.71,102.35,296.12,90,74.25-8.24,140.09-37.15,198-84.26,12.85-10.45,12.94-12.24,2.41-25.61-9-11.4-20.9-19-33.75-25.16-25-12-51.65-18.4-78.78-23C558.52,684.74,513.94,682.83,469.26,682.5ZM383.5,389.86c1,11.78,1.58,23.6,3,35.32a178.07,178.07,0,0,0,4.84,24c10.64,39.94,33.24,60,72.16,62.46,39.11,2.43,67.94-13.22,81.51-52.5,9.63-27.85,11.93-56.79,7.84-85.82-3.8-26.92-16.6-49.06-40.58-63.43C495,299.51,476.06,297,456.38,299.32c-31.89,3.81-55.18,19.38-66.8,50.18C384.68,362.46,383.45,376,383.5,389.86Z"/></g></g></svg>
            </div>
            <div id="setting-btn" @click="visitSetting">
                <svg width="23" height="22" viewBox="0 0 19.53 18" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path class="cls-1" d="M.32,10.34a3,3,0,0,1,0-2.68l3-6A3,3,0,0,1,6,0h7.53a3,3,0,0,1,2.68,1.66l3,6a3,3,0,0,1,0,2.68l-3,6A3,3,0,0,1,13.53,18H6a3,3,0,0,1-2.68-1.66ZM2.11,8.55a1,1,0,0,0,0,.9l3,6A1,1,0,0,0,6,16h7.53a1,1,0,0,0,.89-.55l3-6a1,1,0,0,0,0-.9l-3-6A1,1,0,0,0,13.53,2H6a1,1,0,0,0-.89.55ZM7.76,9a2,2,0,1,0,2-2A2,2,0,0,0,7.76,9Zm2,4a4,4,0,1,1,4-4A4,4,0,0,1,9.76,13Z"/></g></g></svg>
            </div>
        </div>
    </div>
</template>

<style>
.classic-main-top {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 60px;
    -webkit-app-region: drag;
    position: relative;
    padding-left: 33px;
}

.classic-main-top .navigator {
    margin-top: 3px;
    margin-right: 15px;
}

.classic-main-top .search-bar .keyword {
    width: 139px;
}

.classic-main-top .right {
    position: absolute;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    right: 33px;
}

.classic-main-top svg {
    fill: var(--svg-color);
    cursor: pointer;
    -webkit-app-region: none;
    background-color: transparent;
}

.classic-main-top svg:hover {
    fill: var(--hl-color);
    fill: var(--svg-hover-color);
}

.classic-main-top #theme-btn svg,
.classic-main-top #userhome-btn svg,
.classic-main-top #setting-btn svg {
    margin-top: 4px;
}

.classic-main-top #theme-btn,
.classic-main-top #userhome-btn {
    margin-right: 15px;
}
</style>