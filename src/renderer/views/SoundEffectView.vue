<script setup>
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSoundEffectStore } from '../store/soundEffectStore';
import ToggleControl from '../components/ToggleControl.vue';
import VerticalSliderBar from '../components/VerticalSliderBar.vue';
import { ref } from 'vue';



const { hideSoundEffectView } = useAppCommonStore()
const { currentEQIndex, currentEffectName,
    currentEQValue, currentEQValueToPercent,
    isUseEffect, currentIRIndex, } = storeToRefs(useSoundEffectStore())
const { setUseEffect, toggleSoundEffect,
    getPresetEQs, getEQNames,
    updateCustomEQValue, percentToEQValue,
    getPresetIRs } = useSoundEffectStore()
const activeTabIndex = ref(0)

const setActiveTab = (index) => activeTabIndex.value = index

//均衡器
const getEQFrequency = (frequency) => frequency.toString().replace('000', 'k')

const switchEQ = (item, index) => {
    setUseEffect(0, index)
}

const updateEQValue = (percent, item, index) => {
    //currentEQIndex.value = 1
    updateCustomEQValue(index, percentToEQValue(percent))
    setUseEffect(0, 1)
}

//混响
const switchIR = (item, index) => {
    if (item.enabled) setUseEffect(1, index)
}
</script>

<template>
    <div class="sound-effect-view" v-gesture-dnm="{ trigger: '.header' }">
        <div class="header">
            <div class="action">
                <svg @click="hideSoundEffectView" width="12" height="12" viewBox="0 0 593.14 593.11" data-name="Layer 1"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z"
                        transform="translate(-663.4 -243.46)" />
                </svg>
            </div>
            <div class="title-wrap">
                <div class="title">音效SOUND</div>
                <ToggleControl class="toggle-ctl" :value="isUseEffect" @click="toggleSoundEffect">
                </ToggleControl>
                <div class="text spacing">{{ currentEffectName }}</div>
            </div>
        </div>
        <div class="center">
            <div class="left">
                <div class="nav-item" :class="{ active: activeTabIndex == 0 }" @click="() => setActiveTab(0)">
                    <svg width="36" height="36" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
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
                    <div class="text">均衡器</div>
                </div>
                <div class="nav-item" :class="{ active: activeTabIndex == 1 }" @click="() => setActiveTab(1)">
                    <svg width="38" height="36" viewBox="0 0 1001.44 814.11" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M501.1.05q194.49,0,389,.07A111.18,111.18,0,0,1,997.82,85.75c3,12.48,3.36,25.8,3.38,38.73q.31,287.25,0,574.49c-.1,48.08-22.29,83.74-65.93,105.07-14.41,7-30,10-46,10q-385.48,0-771,.07c-28.18,0-53.91-6.84-75.8-24.69C17.21,768.8,1.67,742.15.82,709.06c-1.07-41.48-.69-83-.71-124.48Q0,353.33,0,122.09c0-20.8,2.41-41,12-59.64C29.9,27.36,58.54,6.72,97.68,1.23A167.87,167.87,0,0,1,121.11.05q190-.11,380,0Zm-.36,714h386c9.91,0,14.75-4.8,14.84-14.62,0-.83,0-1.66,0-2.5q0-245.72,0-491.44,0-45.5,0-91c0-10-4.72-14.58-14.73-14.69-.84,0-1.67,0-2.5,0H351.37q-118.23,0-236.47,0c-11.15,0-15.3,4.46-15.3,15.59q0,291,0,581.93c0,12.68,4.06,16.73,16.71,16.73Z" />
                                <path
                                    d="M675.69,406.17c.27,96.76-76.1,173.71-170.26,175.8-98.95,2.21-177.53-74.76-179.64-170.41-2.06-93.46,68.91-176.7,171.85-179.32C589.9,229.89,674.79,305.08,675.69,406.17Zm-250.17.92c-.56,41.24,34.61,75.36,74.87,75.05a75.32,75.32,0,0,0,75.19-75.33c0-41.17-33.85-74.62-75.22-74.79C459.35,331.85,424.81,366.57,425.52,407.09Z" />
                                <path
                                    d="M151.34,408c.69-95.88,34.15-177.75,100.28-246.23,22.81-23.62,59.92-21.37,78,4.52,14.21,20.37,11.85,46.48-6.36,65.36a259.63,259.63,0,0,0-35.14,44.65c-26.59,43.43-39,90.52-36.7,141.35q4.23,93.93,69.28,162c9.8,10.24,16.8,21.47,17.85,35.8,1.48,20.34-10.05,40-28.11,48.31-19.86,9.12-42,5.33-57.6-10.3a335.38,335.38,0,0,1-52.63-67.66A350.26,350.26,0,0,1,151.34,408Z" />
                                <path
                                    d="M850.8,411.79q-4.31,140.45-101.6,241c-15.11,15.61-37.85,20.32-56.44,12-20-9-31.47-27.52-30.11-49.59.83-13.4,6.83-24.53,16.33-33.86,20.08-19.73,35.54-42.78,47.47-68.1a242.8,242.8,0,0,0,23.36-116.8q-4.53-94.49-70-162.73c-9.62-10-16.15-21.14-17.15-35.07a49.32,49.32,0,0,1,28.62-48.46c19.81-9,41.91-4.89,57.5,10.85,20.61,20.81,38.67,43.64,53.24,69.07,23.51,41,39.45,84.7,44.6,131.92C848.42,378.6,849.43,395.21,850.8,411.79Z" />
                            </g>
                        </g>
                    </svg>
                    <div class="text">混响</div>
                </div>
            </div>
            <div class="content" v-show="activeTabIndex == 0">
                <div class="presets">
                    <div v-for="(item, index) in getPresetEQs()" @click="switchEQ(item, index)"
                        :class="{ active: currentEQIndex == index }" class="item spacing1">
                        <span>{{ item.name }}</span>
                    </div>
                </div>
                <div class="bands">
                    <div v-for="(item, index) in getEQNames()" class="item">
                        <div class="value">{{ currentEQValue(index) }}</div>
                        <VerticalSliderBar :value="currentEQValueToPercent(index)"
                            :onseek="(value) => updateEQValue(value, item, index)"
                            :onscroll="(value) => updateEQValue(value, item, index)">
                        </VerticalSliderBar>
                        <div class="text">{{ getEQFrequency(item.frequency) }}</div>
                    </div>
                </div>
            </div>
            <div class="impulse-content" v-show="activeTabIndex == 1">
                <div v-for="(item, index) in getPresetIRs()" v-show="item.enabled" v-html="item.name" class="item spacing1"
                    :class="{ active: currentIRIndex == index, disabled: !item.enabled }" @click="switchIR(item, index)">
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.sound-effect-view {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 15px;
    background: var(--seview-bg);
    -webkit-app-region: none;
}

.sound-effect-view .spacing {
    margin-left: 15px;
}

.sound-effect-view .spacing1 {
    margin-left: 25px;
}

.sound-effect-view .spacing2 {
    margin-left: 33px;
}

.sound-effect-view .header,
.sound-effect-view .center,
.sound-effect-view .header .title-wrap,
.sound-effect-view .center .bands {
    display: flex;
    flex-direction: row;
}

.sound-effect-view .header {
    padding: 12px;
    border-bottom: var(--seview-border);
    background: var(--seview-bg);
}

.sound-effect-view .header .action {
    display: flex;
    justify-content: center;
    align-items: center;
}

.sound-effect-view .header .action svg {
    fill: var(--svg-color);
    cursor: pointer;
}

.sound-effect-view .header .action svg:hover {
    fill: var(--svg-hover-color);
}

.sound-effect-view .header .title-wrap {
    margin-left: 20px;
    display: flex;
}

.sound-effect-view .header .title {
    margin-right: 30px;
    font-size: var(--text-size);
}

.sound-effect-view .header .toggle-ctl {
    cursor: default;
}

.sound-effect-view .center {
    flex: 1;
    background: var(--seview-bg);
    overflow: hidden;
}

.sound-effect-view .center .left {
    width: 108px;
    min-width: 68px;
    background: var(--seview-left-bg);
    /* border-right: var(--seview-border); */
}

.sound-effect-view .center .left .nav-item {
    padding: 20px 0px;
    cursor: pointer;
}

.sound-effect-view .center .left .nav-item svg {
    fill: var(--text-sub-color);
    color: var(--text-sub-color);
}

.sound-effect-view .center .left .nav-item:hover,
.sound-effect-view .center .left .nav-item:hover svg {
    fill: var(--svg-color);
    color: var(--text-color);
}

.sound-effect-view .center .left .active,
.sound-effect-view .center .left .active svg {
    fill: var(--hl-color) !important;
    color: var(--hl-color) !important;
}

.sound-effect-view .center .content {
    flex: 1;
    padding-top: 15px;
    margin-left: 0px;
}

.sound-effect-view .center .content .presets {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    padding-right: 25px;
}

.sound-effect-view .center .presets .item {
    width: 96px;
    margin-top: 15px;
    padding: 3px 0px;
    border-radius: 3px;
    border: 2px solid transparent;
    background-color: #f3f3f3;
    background: var(--seview-list-item-bg);
    color: var(--seview-list-item-color);
}

.sound-effect-view .center .presets .active {
    border: 2px solid var(--hl-color);
}

.sound-effect-view .center .bands {
    justify-content: center;
    overflow: hidden;
}

.sound-effect-view .center .bands .item {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 50px;
}

.sound-effect-view .center .bands .text,
.sound-effect-view .center .bands .value {
    font-size: 13px;
    margin-top: 15px;
}

.sound-effect-view .center .bands .value {
    margin-top: 20px;
    margin-bottom: 20px;
    visibility: hidden;
}

.sound-effect-view .center .bands .item:hover .value {
    visibility: visible;
}

.sound-effect-view .center .impulse-content {
    flex: 1;
    padding-top: 15px;
    padding-bottom: 15px;
    margin-left: 0px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    overflow: scroll;
    padding-right: 25px;
}

.sound-effect-view .center .impulse-content .item {
    width: 220px;
    margin-top: 15px;
    padding: 6px 0px;
    border-radius: 3px;
    border: 2px solid transparent;
    background-color: #f3f3f3;
    background: var(--seview-list-item-bg);
    color: var(--seview-list-item-color);
    /* cursor: pointer; */
}

.sound-effect-view .center .impulse-content .active {
    border: 2px solid var(--hl-color);
}

.sound-effect-view .center .impulse-content .disabled {
    cursor: not-allowed;
    color: var(--toggle-thumb-bg) !important;
}
</style>