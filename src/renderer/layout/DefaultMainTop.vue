<script setup>
import { inject } from 'vue';
import { storeToRefs } from 'pinia';
import PlayMeta from '../components/PlayMeta.vue';
import SearchBar from '../components/SearchBar.vue';
import Navigator from '../components/Navigator.vue';
import { usePlayStore } from '../store/playStore';



const { visitUserHome, visitSetting } = inject('appRoute')
const { seekTrack, progressState } = inject('player')
const { playing } = storeToRefs(usePlayStore())
</script>

<template>
    <div class="default-main-top">
        <div id="play-nav">
            <PlayMeta id="play-meta"></PlayMeta>
            <div class="play-ctl-wrap">
                <PlayControl></PlayControl>
            </div>
            <div class="top-right">
                <SearchBar></SearchBar>
                <div id="userhome-btn" @click="visitUserHome">
                    <svg width="22" height="20" viewBox="0 0 938.47 938.5" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M0,469C.33,209.53,210.36-.32,469.38,0,729.05.32,939.22,210.78,938.47,469.76c-.76,259.7-211.12,469.66-469.63,468.74C208.87,937.57-.33,728.06,0,469Zm453.81,128,.12-.34-1.95-.2c-53.39-5.09-94.44-29.95-122-76.3-14.75-24.84-23-52-27.21-80.35-4.62-31.1-6.87-62.34-.49-93.46,10.07-49.16,36-87.34,80.26-111.88,32.13-17.8,67-23.53,103.32-20.28,46.06,4.12,84.22,23.72,113.49,59.63,24.9,30.54,37.7,66,39.88,105.16,2.3,41.55-2.47,82.21-19,120.79-19.26,44.86-51.57,75.78-98.75,90.18a171.59,171.59,0,0,1-18,4.28c-6,1.14-12.07,1.77-19.36,2.8,2.76.19,4.26.35,5.75.38,39.17.82,78.23,3.08,117,8.94,33.49,5.07,66.42,12.41,97.94,25.1,27.78,11.19,53.28,25.93,73.53,48.57,2.16,2.43,4.24,4.93,6.42,7.46,100.84-141.58,96.84-361.06-57.33-502.35C576.61,46.82,340.65,52.88,196.73,198.77,51.56,345.94,60.23,558.41,153.79,687.36c2.07-2.44,4.06-4.88,6.15-7.22,23.12-25.8,52.64-41.45,84.68-52.86,50.51-18,103.12-24.68,156.28-28C418.51,598.18,436.17,597.7,453.81,596.94Zm15.45,85.56c-55,0-99.89,3.54-143.71,11.75C299.3,699.17,273.61,706,250,719c-13.9,7.67-26.18,17.11-33.23,32-1.83,3.88-1.62,6.33,1.92,9.29,86,71.89,184.71,102.35,296.12,90,74.25-8.24,140.09-37.15,198-84.26,12.85-10.45,12.94-12.24,2.41-25.61-9-11.4-20.9-19-33.75-25.16-25-12-51.65-18.4-78.78-23C558.52,684.74,513.94,682.83,469.26,682.5ZM383.5,389.86c1,11.78,1.58,23.6,3,35.32a178.07,178.07,0,0,0,4.84,24c10.64,39.94,33.24,60,72.16,62.46,39.11,2.43,67.94-13.22,81.51-52.5,9.63-27.85,11.93-56.79,7.84-85.82-3.8-26.92-16.6-49.06-40.58-63.43C495,299.51,476.06,297,456.38,299.32c-31.89,3.81-55.18,19.38-66.8,50.18C384.68,362.46,383.45,376,383.5,389.86Z" />
                            </g>
                        </g>
                    </svg>
                </div>
                <div id="setting-btn" @click="visitSetting">
                    <svg width="21" height="20" viewBox="0 0 19.53 18" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path class="cls-1"
                                    d="M.32,10.34a3,3,0,0,1,0-2.68l3-6A3,3,0,0,1,6,0h7.53a3,3,0,0,1,2.68,1.66l3,6a3,3,0,0,1,0,2.68l-3,6A3,3,0,0,1,13.53,18H6a3,3,0,0,1-2.68-1.66ZM2.11,8.55a1,1,0,0,0,0,.9l3,6A1,1,0,0,0,6,16h7.53a1,1,0,0,0,.89-.55l3-6a1,1,0,0,0,0-.9l-3-6A1,1,0,0,0,13.53,2H6a1,1,0,0,0-.89.55ZM7.76,9a2,2,0,1,0,2-2A2,2,0,0,0,7.76,9Zm2,4a4,4,0,1,1,4-4A4,4,0,0,1,9.76,13Z" />
                            </g>
                        </g>
                    </svg>
                </div>
                <Navigator></Navigator>
            </div>
        </div>
        <ProgressBar :value="progressState" :seekable="playing" :onseek="seekTrack"></ProgressBar>
    </div>
</template>

<style scoped>
.default-main-top,
#play-nav {
    display: flex;
}

.default-main-top {
    flex-direction: column;
    height: var(--main-play-nav-height);
    -webkit-app-region: drag;
    /* background: #faf4f6; */
}

.default-main-top #play-nav #play-meta {
    width: 34.33%;
}

.default-main-top #play-nav .play-ctl-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0px 15px;
}

.default-main-top #play-nav .top-right {
    width: 39.33%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
}

.default-main-top #userhome-btn {
    cursor: pointer;
    -webkit-app-region: none;
    margin-left: 16px;
    margin-right: 15px;
    background-color: transparent;
}

.default-main-top #userhome-btn svg {
    margin-top: 4px;
    fill: var(--svg-color);
}

.default-main-top #setting-btn {
    cursor: pointer;
    -webkit-app-region: none;
    /*margin-left: 15px;*/
    margin-right: 12px;
}

.default-main-top #setting-btn svg {
    margin-top: 4px;
    fill: var(--svg-color);
}

.default-main-top #userhome-btn svg:hover,
.default-main-top #setting-btn svg:hover {
    fill: var(--hl-color);
    fill: var(--svg-hover-color);
}
</style>