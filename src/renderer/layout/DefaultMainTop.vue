<script setup>
import { inject } from 'vue';
import { storeToRefs } from 'pinia';
import PlayMeta from '../components/PlayMeta.vue';
import SearchBar from '../components/SearchBar.vue';
import { useSettingStore } from '../store/settingStore';
import { useAppCommonStore } from '../store/appCommonStore';
import WinNonMacOSControlBtn from '../components/WinNonMacOSControlBtn.vue';



const { 
    visitThemes, visitUserHome, visitSetting, 
    visitModulesSetting, visitPlugins 
} = inject('appRoute')
const { 
    searchAction, searchBarPlaceholder, useWindowsStyleWinCtl 
} = inject('appCommon')
const { 
    seekTrack, progressState, preseekTrack, 
    isTrackSeekable 
} = inject('player')

const { 
    isUserHomeShortcutEnable,
    isModulesSettingShortcutEnable,
    isPluginsSettingShortcutEnable,
    isThemesShortcutEnable,
    isSimpleLayoutShortcutEnable, 
} = storeToRefs(useSettingStore())
const { setLayoutIndex, switchToSimpleLayout } = useSettingStore()
const { isMaxScreen, playingViewShow } = storeToRefs(useAppCommonStore())
</script>

<template>
    <div class="default-main-top">
        <div class="play-nav">
            <PlayMeta id="play-meta" :enableVolumeBar="true"></PlayMeta>
            <div class="play-ctl-wrap">
                <PlayControl></PlayControl>
            </div>
            <div class="action" :class="{ 'not-windows-style-win-ctl': !useWindowsStyleWinCtl }">
                <!--
                <SearchBar :submitAction="searchAction" :placeholder="searchBarPlaceholder">
                </SearchBar>
                -->
                <div class="module-btn btn" @click="visitModulesSetting" v-show="isModulesSettingShortcutEnable">
                    <svg width="19" height="19" viewBox="0 0 853.51 926.34" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M853.49,463.39q0,87.5-.06,175c0,8.81-.12,17.73-1.44,26.41-4,26.08-17.42,46.35-40.26,59.51-33.6,19.35-67.6,38-101.49,56.87Q593.06,846.32,475.85,911.42c-16.89,9.42-34.3,16-54.07,14.79-14.86-.89-28.22-6.06-41-13.15q-165.68-92-331.35-184C29,717.79,13.33,702.65,5.18,680.34,1,668.86.08,656.93.07,644.93Q0,463.45,0,282c0-20.08,3.66-39,15.44-55.83,9-12.79,21-21.6,34.42-29q165.22-91.77,330.42-183.6C396.3,4.6,413.06-1,431.71.16a84.85,84.85,0,0,1,36.11,10.58Q536.23,48.5,604.55,86.45q98,54.4,196,108.87c14.83,8.23,28.6,17.49,38.31,32,11.23,16.79,14.66,35.37,14.63,55.08q-.13,90.49,0,181ZM383.72,816.85c.12-2,.27-3.43.27-4.87q0-159.72.09-319.44c0-3.33-1.14-5-4-6.55Q235.12,405.59,90.24,325c-1.33-.74-2.73-1.38-4.74-2.39v5q0,158.22-.12,316.45c0,6,2.31,8.68,7.15,11.37q143.28,79.34,286.41,159C380.35,815.18,381.81,815.87,383.72,816.85ZM768,322.64c-2.09,1.06-3.27,1.61-4.4,2.24Q618.67,405.39,473.71,485.82c-3.22,1.79-4.29,3.73-4.29,7.37q.15,159,.08,318v5.91c2.14-1.08,3.47-1.69,4.74-2.4q142.95-79.42,286-158.72c5.86-3.24,7.92-6.79,7.9-13.47q-.3-157-.12-314ZM722.58,250c-1.11-.8-1.49-1.14-1.93-1.38Q575.93,168.22,431.27,87.74c-4.23-2.35-7.06-1-10.48.89q-143,79.45-286,158.85c-1.19.66-2.29,1.48-3.86,2.5l6.16,3.46q142.31,79.05,284.57,158.23c3.89,2.17,6.59,2,10.32-.12q128.26-71.44,256.65-142.66C699.86,262.68,711,256.43,722.58,250Z" />
                            </g>
                        </g>
                    </svg>
                </div>
                <div class="plugin-btn btn spacing" @click="visitPlugins" v-show="isPluginsSettingShortcutEnable">
                    <svg width="19" height="19" viewBox="0 0 918.34 919" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M684.21,919h-227a5.25,5.25,0,0,0-1.72-.77,109.28,109.28,0,0,1-58.19-19.77c-1.06-.74-3.73-.28-5,.58a105,105,0,0,1-37.14,16.4c-7.24,1.56-14.64,2.4-22,3.56h-58a34.39,34.39,0,0,0-5.28-.8q-59.25-.06-118.5,0a33.64,33.64,0,0,0-5.22.8h-43c-2.75-.41-5.5-.84-8.26-1.23C38.53,909.8.26,865.87.22,808.85Q.15,698.12.23,587.38c0-20.84,5.46-40.27,17.24-57.47,3.53-5.16,3.49-8.6.23-13.48C4.6,496.83-.19,475.18,0,451.57c.57-70.65.18-141.31.24-212,0-5.81.31-11.65.89-17.44,5-49.57,48.25-90.89,98-93.2,16-.75,32-.76,48-.76q92.24,0,184.46.38a106.71,106.71,0,0,1,20.34,2c51.28,10.27,86.34,53.34,86.35,105.77q0,111.48-.08,223c0,6.12-1.09,12.24-1.71,18.36-.17,1.7-.47,3.39-.59,4.19,13.24-.46,26-1.26,38.79-1.29q104-.18,208-.05c59.78,0,107.24,46.68,107.53,106.53q.55,112.49,0,225c-.18,51.14-35.55,93.92-85.45,104C697.94,917.39,691,918,684.21,919ZM572.37,832.49q51.5,0,103,0c2.32,0,4.66-.34,7-.22,12.22.64,22-8.72,21.94-23.57-.15-72.33-.06-144.65-.11-217a44.4,44.4,0,0,0-.93-8.91c-1.84-9-7.45-14.31-16.49-15.74a51.69,51.69,0,0,0-8-.54q-108,0-216,0c-16.64,0-24.62,7.93-24.61,24.4q.07,107.73.17,215.47c0,18.63,7.43,26.11,26,26.11Zm-352.86-352h104c2,0,4,0,6-.17,15.82-1.23,22.7-8.55,22.71-24.34q0-108.24,0-216.48c0-17.24-7.78-25-25.07-25h-216c-17.26,0-25,7.75-25,25.1V455.09c0,17.16,7.2,24.68,24.31,25.38,1.49.06,3,0,4.5,0ZM86.21,699.82v104c0,22,6.68,28.68,28.53,28.68h209c1.66,0,3.33,0,5-.07,16.69-1.1,23.49-8.38,23.51-25.16q0-30.25,0-60.5,0-78,0-156c0-7.57-1.43-14.66-7.78-19.68-5-3.93-10.92-4.61-17-4.61H110.93c-16.92,0-24.71,7.85-24.72,24.83Q86.2,645.58,86.21,699.82Z" />
                                <path
                                    d="M816.21,0C821.58.88,827,1.56,832.3,2.68,883,13.34,918,55.75,918.15,107.38q.35,112.71,0,225.42c-.23,57-46.23,104.42-103,105.19-60.79.82-121.6.18-182.4.17-17.82,0-35.68.8-53.44-.23-51.2-3-93.51-44.34-98.2-95.25-.55-6-.86-12-.86-17.94q-.09-107.71,0-215.43C480.21,51.05,521.48,6,579.49.83A13.51,13.51,0,0,0,582.21,0Zm16,219.35V111.89c0-17.66-7.57-25.37-25.12-25.37q-108.45,0-216.91,0c-15.9,0-24,8.13-24,24V328.45c0,15.45,7.6,23.24,23.2,23.69,7.32.21,14.65.34,22,.34q96.21,0,192.42,0c2.16,0,4.33-.06,6.48-.23,14.92-1.14,21.93-8.63,21.93-23.45Q832.23,274.08,832.21,219.35Z" />
                            </g>
                        </g>
                    </svg>
                </div>
                <div class="theme-btn btn spacing" @click="visitThemes" v-show="isThemesShortcutEnable">
                    <svg width="19" height="19" viewBox="0 -10 940.66 926.15" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M697.39,926.15H245.3a14.77,14.77,0,0,0-2.77-.86C190,919.2,153.12,877.8,153.12,824.84V547.51c-3-.55-5.23-1-7.52-1.4-36.41-6.3-72.85-12.4-109.21-19C14.07,523.11.15,506.26.13,483.52c-.1-99-.27-198,.09-297,.12-34.94,16-61.27,47.23-77.57,8.39-4.36,17.28-7.79,26-11.44Q183.53,51.59,293.6,5.66c21.22-8.91,39.62-5.77,56.55,9.91C383.38,46.36,417,76.76,450.41,107.31c6.95,6.35,13.95,12.66,20.93,19l4.16-3.78,120.8-110c14.74-13.43,31.27-16,49.46-8,11,4.82,21.9,9.74,32.84,14.63,70.76,31.66,141.65,63,212.23,95.09,31.49,14.3,49.13,39.56,49.37,74.25.71,98.49.41,197,.35,295.47,0,22.47-14,39.1-36.08,43.19-24.55,4.54-49.18,8.64-73.78,12.93l-41.12,7.12c0,2.14,0,3.95,0,5.76.11,13.49.34,27,.32,40.48q-.1,117.24-.32,234.47c-.07,41-27.26,79.11-66.15,92.07C715,922.8,706.08,924.13,697.39,926.15ZM853.58,447.77v-5.88q0-121.75.14-243.52c0-4.72-1.71-6.59-5.67-8.35Q743.41,143.48,638.89,96.59c-2.86-1.28-4.56-1.15-6.89,1q-26.61,24.59-53.46,48.91c-25.6,23.35-51.13,46.77-76.85,70C490.73,226.38,477.91,231,463,228c-10-2-17.92-7.62-25.29-14.35q-63.44-58-126.93-115.94c-2.46-2.24-4.38-3.12-7.81-1.68Q197.31,140.24,91.49,184.09c-3.58,1.48-4.47,3.39-4.46,7q.15,125.51.08,251v5.48l66,11.49v-6.36c0-45-.07-90,0-135,0-21.06,15.76-39.07,36.64-42.46,20.31-3.29,40.76,8.44,47,27.95a75.22,75.22,0,0,1,3.2,22.6q.27,247.77.14,495.54a51.79,51.79,0,0,0,.21,6.48c.71,5.62,3.79,9.11,9.31,10.35a34.18,34.18,0,0,0,7.42.7q214.29.06,428.58,0a34.47,34.47,0,0,0,5-.24c8.14-1.19,11.59-5.11,11.89-13.37.07-1.83,0-3.67,0-5.5q.16-250.51.34-501c0-24.77,18.7-43.72,43-43.74,24.76,0,43.59,18.77,43.68,43.66q.2,58.74.34,117.49c0,7.3,0,14.59,0,22.49Z" />
                            </g>
                        </g>
                    </svg>
                </div>
                <div class="userhome-btn btn spacing" @click="() => visitUserHome()" v-show="isUserHomeShortcutEnable">
                    <svg width="22" height="21" viewBox="0 0 938.47 938.5" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M0,469C.33,209.53,210.36-.32,469.38,0,729.05.32,939.22,210.78,938.47,469.76c-.76,259.7-211.12,469.66-469.63,468.74C208.87,937.57-.33,728.06,0,469Zm453.81,128,.12-.34-1.95-.2c-53.39-5.09-94.44-29.95-122-76.3-14.75-24.84-23-52-27.21-80.35-4.62-31.1-6.87-62.34-.49-93.46,10.07-49.16,36-87.34,80.26-111.88,32.13-17.8,67-23.53,103.32-20.28,46.06,4.12,84.22,23.72,113.49,59.63,24.9,30.54,37.7,66,39.88,105.16,2.3,41.55-2.47,82.21-19,120.79-19.26,44.86-51.57,75.78-98.75,90.18a171.59,171.59,0,0,1-18,4.28c-6,1.14-12.07,1.77-19.36,2.8,2.76.19,4.26.35,5.75.38,39.17.82,78.23,3.08,117,8.94,33.49,5.07,66.42,12.41,97.94,25.1,27.78,11.19,53.28,25.93,73.53,48.57,2.16,2.43,4.24,4.93,6.42,7.46,100.84-141.58,96.84-361.06-57.33-502.35C576.61,46.82,340.65,52.88,196.73,198.77,51.56,345.94,60.23,558.41,153.79,687.36c2.07-2.44,4.06-4.88,6.15-7.22,23.12-25.8,52.64-41.45,84.68-52.86,50.51-18,103.12-24.68,156.28-28C418.51,598.18,436.17,597.7,453.81,596.94Zm15.45,85.56c-55,0-99.89,3.54-143.71,11.75C299.3,699.17,273.61,706,250,719c-13.9,7.67-26.18,17.11-33.23,32-1.83,3.88-1.62,6.33,1.92,9.29,86,71.89,184.71,102.35,296.12,90,74.25-8.24,140.09-37.15,198-84.26,12.85-10.45,12.94-12.24,2.41-25.61-9-11.4-20.9-19-33.75-25.16-25-12-51.65-18.4-78.78-23C558.52,684.74,513.94,682.83,469.26,682.5ZM383.5,389.86c1,11.78,1.58,23.6,3,35.32a178.07,178.07,0,0,0,4.84,24c10.64,39.94,33.24,60,72.16,62.46,39.11,2.43,67.94-13.22,81.51-52.5,9.63-27.85,11.93-56.79,7.84-85.82-3.8-26.92-16.6-49.06-40.58-63.43C495,299.51,476.06,297,456.38,299.32c-31.89,3.81-55.18,19.38-66.8,50.18C384.68,362.46,383.45,376,383.5,389.86Z" />
                            </g>
                        </g>
                    </svg>
                </div>
                <div class="setting-btn btn spacing" @click="() => visitSetting()">
                    <svg width="21" height="20" viewBox="0 0 19.53 18" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path class="cls-1"
                                    d="M.32,10.34a3,3,0,0,1,0-2.68l3-6A3,3,0,0,1,6,0h7.53a3,3,0,0,1,2.68,1.66l3,6a3,3,0,0,1,0,2.68l-3,6A3,3,0,0,1,13.53,18H6a3,3,0,0,1-2.68-1.66ZM2.11,8.55a1,1,0,0,0,0,.9l3,6A1,1,0,0,0,6,16h7.53a1,1,0,0,0,.89-.55l3-6a1,1,0,0,0,0-.9l-3-6A1,1,0,0,0,13.53,2H6a1,1,0,0,0-.89.55ZM7.76,9a2,2,0,1,0,2-2A2,2,0,0,0,7.76,9Zm2,4a4,4,0,1,1,4-4A4,4,0,0,1,9.76,13Z" />
                            </g>
                        </g>
                    </svg>
                </div>
                <div class="switch-layout-btn btn spacing" @click="switchToSimpleLayout">
                    <svg width="20" height="18" viewBox="0 0 1019 1019" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M0,841V50a65,65,0,0,0,2.75-6.86C8.72,22.15,22.41,9,43.22,3c3-.86,5.85-2,8.78-3H837a28.45,28.45,0,0,0,4.46,1.9c31.14,7.47,47.71,28.49,47.71,60.65V447.16h6.12c21,0,42-.07,63,0,29.91.13,51.36,17,58.66,45.87.52,2,1.37,4,2.06,5.95V968a32.14,32.14,0,0,0-2.06,4.91c-5.41,22.53-19.19,37-41.49,43.25-4.41,1.23-9,1.91-13.45,2.84H503a24.12,24.12,0,0,0-3.77-.86c-31.82-2.43-54.36-26.64-54.39-58.5,0-21.49,0-43,0-64.46,0-1.75-.14-3.5-.24-5.67h-7.5l-377.22-.35c-28.4,0-48.4-14.83-56.88-41.95A46.47,46.47,0,0,0,0,841Zm447-71V506c0-34.45,20.39-57.11,54.53-60,10.76-.93,21.62-.92,32.44-.93q114.74-.1,229.48,0h6.06V118.23H118.2V770ZM564.55,565V900.68H900.66V565Z" />
                            </g>
                        </g>
                    </svg>
                </div>
                <!--
                <Navigator></Navigator>
                -->
                <div class="win-ctl-wrap" v-show="useWindowsStyleWinCtl">
                    <WinNonMacOSControlBtn :isMaximized="isMaxScreen"></WinNonMacOSControlBtn>
                </div>
            </div>
        </div>
        <SliderBar :value="progressState" :disable="!isTrackSeekable" :onSeek="seekTrack" :disableScroll="true"
            :onScroll="preseekTrack" :onScrollFinish="seekTrack" 
            :onDragRelease="seekTrack" :onDragMove="preseekTrack"
            keyName="defaultMainTop" >
        </SliderBar>
    </div>
</template>

<style>
.default-main-top {
    display: flex;
    flex-direction: column;
    height: var(--others-playnav-height);
    -webkit-app-region: drag;
    --others-sliderbar-ctl-height: 3px;
    --i-width: 34.33%;
}

.default-main-top .play-nav {
    display: flex;
}

.default-main-top .play-nav #play-meta {
    width: var(--i-width);
}

.default-main-top .play-nav #play-meta .audio-title {
    width: 211px;
}

.default-main-top .play-nav .play-ctl-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0px 15px;
}

.default-main-top .play-nav .play-ctl-wrap .spacing {
    margin-left: 15px;
}

.default-main-top .play-nav > .action {
    /*width: 39.33%;*/
    display: flex;
    align-items: center;
    justify-content: flex-end;
    /*margin-right: 28px;
    margin-right: 15px;
    */
}

.default-main-top .play-nav > .action .spacing {
    margin-left: 15px;
}


.default-main-top .play-nav > .action.not-windows-style-win-ctl {
    /*margin-right: 39px;*/
    padding-right: 33px;
    width: var(--i-width);
}

.default-main-top .play-nav > .action .btn {
    display: flex;
    align-items: center;
}

.default-main-top .module-btn {
    transform: translateY(2px) scale(0.98);
    margin-right: 2px;
}
</style>