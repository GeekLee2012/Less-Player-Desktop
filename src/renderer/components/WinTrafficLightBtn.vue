<script setup>
import { inject, ref, toRef } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';



const props = defineProps({
    hideMinBtn: Boolean,
    hideMaxBtn: Boolean,
    showCollapseBtn: Boolean,
    collapseAction: Function,
    isMaximized: Boolean,
})


const { showConfirm } = inject('apiExpose')

const { desktopLyricShow } = storeToRefs(useAppCommonStore())
const { quit, minimize, maximize } = useAppCommonStore()
const { isHideToTrayOnMinimized, isTrayShow, isShowDialogBeforeQuitApp } = storeToRefs(useSettingStore())
const isMinBtnDisabled = ref(false)

const setMinBtnDisabled = (value) => {
    isMinBtnDisabled.value = value
}

const doQuit = async () => {
    if(!isTrayShow.value && !desktopLyricShow.value && isShowDialogBeforeQuitApp.value) {
        const ok = await showConfirm('确定要退出应用吗?')
        if(!ok) return
    }
    quit()
}

const doMinimize = () => {
    if (isMinBtnDisabled.value) return
    minimize(isHideToTrayOnMinimized.value)
}

const isMaximized = toRef(props, 'isMaximized')
const toggleMaximize = () => maximize()
</script>

<template>
    <div class="win-traffic-light-btn" @dblclick.stop="">
        <div @click="doQuit" class="ctl-btn close-btn">
            <svg width="12" height="12" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <g id="cross">
                    <line class="cls-1" x1="7" x2="25" y1="7" y2="25" />
                    <line class="cls-1" x1="7" x2="25" y1="25" y2="7" />
                </g>
            </svg>
        </div>
        <div @click="doMinimize" v-show="!hideMinBtn" class="ctl-btn min-btn"
            :class="{ 'button-disabled': isMinBtnDisabled }">
            <svg width="14" height="14" viewBox="0 0 256 256" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink">
                <path
                    d="M208,134.4H48c-3.534,0-6.4-2.866-6.4-6.4s2.866-6.4,6.4-6.4h160c3.534,0,6.4,2.866,6.4,6.4S211.534,134.4,208,134.4z" />
            </svg>
        </div>
        <div @click="toggleMaximize" v-show="!hideMaxBtn" class="ctl-btn max-btn" :class="{ 'max-state': isMaximized }">
            <svg v-show="!isMaximized" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <path class="cls-1" d="M2,18V2H18" />
                        <path class="cls-1" d="M23,6V22H7" />
                    </g>
                </g>
            </svg>
            <svg v-show="isMaximized" viewBox="0 0 35.82 35.82" xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <g id="Layer_2-2" data-name="Layer 2">
                            <g id="Layer_1-2-2" data-name="Layer 1-2">
                                <path d="M19.82,35.82v-16h16" />
                                <path d="M15,0l1,16H0" />
                            </g>
                        </g>
                    </g>
                </g>
            </svg>
        </div>
        <div class="collapse-btn" v-show="showCollapseBtn" @click="collapseAction">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 66 640.13 352.15">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <g id="Layer_2-2" data-name="Layer 2">
                            <g id="Layer_1-2-2" data-name="Layer 1-2">
                                <path
                                    d="M319.64,76.3c-1.91,2.59-3,4.52-4.51,6Q186,211.6,56.78,340.8c-8.31,8.34-17.87,12.87-29.65,10.88-12.51-2.12-21.24-9.34-25.29-21.48-4.12-12.35-1.23-23.43,7.71-32.7C19.73,287,30.24,276.72,40.61,266.35L289.12,17.84c2.94-2.94,5.74-6,8.75-8.91a32.1,32.1,0,0,1,44.28-.15c3.15,3,6.05,6.2,9.11,9.26Q490,156.79,628.78,295.5c10.11,10.1,14.13,21.64,9.33,35.44a31.75,31.75,0,0,1-48.49,15.2,58.8,58.8,0,0,1-7.07-6.31Q453.85,211.22,325.2,82.51C323.68,81,322.32,79.3,319.64,76.3Z" />
                            </g>
                        </g>
                    </g>
                </g>
            </svg>
        </div>
    </div>
</template>

<style scoped>
.win-traffic-light-btn {
    display: flex;
    -webkit-app-region: none;
    align-items: center;
}


.win-traffic-light-btn .ctl-btn {
    width: var(--others-win-ctl-btn-size);
    height: var(--others-win-ctl-btn-size);
    margin-right: var(--others-win-ctl-btn-margin-right);
    border-radius: 10rem;
    box-shadow: 0px 0px 1px var(--border-popovers-border-color);
    -webkit-app-region: none;
    cursor: pointer !important;
    display: flex;
    align-items: center;
    justify-content: center;
}

.win-traffic-light-btn div:hover {
    cursor: pointer;
}

.win-traffic-light-btn .close-btn {
    background-color: #fc605c;
}


.win-traffic-light-btn .close-btn svg {
    transform: translateX(-0.2px);
}

.win-traffic-light-btn .ctl-btn svg {
    fill: #555 !important;
    stroke-width: 3.6px;
    stroke: #555 !important;
    padding: 1px;
    visibility: hidden;
}


.win-traffic-light-btn:hover .ctl-btn svg {
    visibility: visible;
}

.win-traffic-light-btn .min-btn svg {
    stroke-width: 20px !important;
}

.win-traffic-light-btn .max-btn svg {
    stroke-width: 3px !important;
    transform: translateX(1px) translateY(1.3px) scale(0.93);
}

.win-traffic-light-btn .max-btn.max-state svg {
    transform: translateX(0.1px) translateY(0.2px) scale(1.1);
}


.win-traffic-light-btn .min-btn {
    background-color: #fdbc40;
}

.win-traffic-light-btn .max-btn {
    background-color: #34c648;
    margin-right: 0px !important;
}

.win-traffic-light-btn .max-btn svg {
    width: var(--others-win-ctl-max-btn-size);
    height: var(--others-win-ctl-max-btn-size);
}

.win-traffic-light-btn .collapse-btn {
    cursor: pointer;
    -webkit-app-region: none;
    padding-right: 8px;
    margin-left: calc(var(--others-win-ctl-btn-margin-right) + 5px);
}

.win-traffic-light-btn .collapse-btn svg {
    fill: var(--button-icon-btn-color);
    width: var(--others-win-ctl-collapse-btn-size);
    height: var(--others-win-ctl-collapse-btn-size);
    transform: translateY(4px);
}

.win-traffic-light-btn .collapse-btn:hover,
.win-traffic-light-btn .collapse-btn:hover svg {
    fill: var(--content-highlight-color);
}
</style>