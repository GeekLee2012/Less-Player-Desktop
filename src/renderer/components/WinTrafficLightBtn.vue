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
const { 
    isHideToTrayOnMinimized, isTrayShow, isShowDialogBeforeQuitApp,
    winCtlCustomStyleIconType,
} = storeToRefs(useSettingStore())
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
        <div @click="toggleMaximize" v-show="!hideMaxBtn" 
            class="ctl-btn max-btn" 
            :class="{ 
                'max-state': isMaximized,
                'icon-type-default': winCtlCustomStyleIconType == 0,
            }">
            <!--图标风格 - 默认-->
            <svg v-show="winCtlCustomStyleIconType == 0 && !isMaximized" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <path class="cls-1" d="M2,18V2H18" />
                        <path class="cls-1" d="M23,6V22H7" />
                    </g>
                </g>
            </svg>
            <svg v-show="winCtlCustomStyleIconType == 0 && isMaximized" viewBox="0 0 35.82 35.82" xmlns="http://www.w3.org/2000/svg">
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
            <!--图标风格 - 方框-->
            <svg v-show="winCtlCustomStyleIconType == 1" width="16" height="16" viewBox="0 0 853.55 853.57"
                xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <path
                            d="M426.76,0Q575,0,723.25.06C785.32.1,836.55,40.3,850.13,100a138,138,0,0,1,3.25,30.21q.29,296.73.1,593.47c0,61.71-39.88,112.43-99.28,126.36a136.45,136.45,0,0,1-30.69,3.4q-296.75.29-593.47.11C66.25,853.47,14.61,811.12,2.42,749a134.59,134.59,0,0,1-2.3-25.83q-.19-296.49-.08-593C.06,70.11,37.43,20.34,94.77,4.84a144.93,144.93,0,0,1,37-4.6C230.1-.13,328.43,0,426.76,0Zm.52,85.5q-148.24,0-296.48,0c-27.38,0-45.26,17.68-45.26,44.86q0,296.49,0,593c0,26.67,17.86,44.49,44.47,44.65,11.66.07,23.33,0,35,0q278.73,0,557.47.19c27,0,45.69-20.64,45.66-44.32q-.36-297-.22-594a51.19,51.19,0,0,0-2-14.74c-5.67-18.59-21.69-29.63-42.63-29.63Q575.28,85.51,427.28,85.54Z" />
                    </g>
                </g>
            </svg>
            <!--
            <svg v-show="winCtlCustomStyleIconType == 1 && !isMaximized" width="16" height="16" viewBox="0 0 853.55 853.57"
                xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <path
                            d="M426.76,0Q575,0,723.25.06C785.32.1,836.55,40.3,850.13,100a138,138,0,0,1,3.25,30.21q.29,296.73.1,593.47c0,61.71-39.88,112.43-99.28,126.36a136.45,136.45,0,0,1-30.69,3.4q-296.75.29-593.47.11C66.25,853.47,14.61,811.12,2.42,749a134.59,134.59,0,0,1-2.3-25.83q-.19-296.49-.08-593C.06,70.11,37.43,20.34,94.77,4.84a144.93,144.93,0,0,1,37-4.6C230.1-.13,328.43,0,426.76,0Zm.52,85.5q-148.24,0-296.48,0c-27.38,0-45.26,17.68-45.26,44.86q0,296.49,0,593c0,26.67,17.86,44.49,44.47,44.65,11.66.07,23.33,0,35,0q278.73,0,557.47.19c27,0,45.69-20.64,45.66-44.32q-.36-297-.22-594a51.19,51.19,0,0,0-2-14.74c-5.67-18.59-21.69-29.63-42.63-29.63Q575.28,85.51,427.28,85.54Z" />
                    </g>
                </g>
            </svg>
            <svg v-show="winCtlCustomStyleIconType == 1 && isMaximized" width="23" height="23" viewBox="0 0 896.01 896" xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <path
                            d="M704,704v88.25q0,35,0,70c0,21.66-12.1,33.74-33.79,33.74q-318,0-636,0C11.91,896,0,884.05,0,861.68Q0,543.94,0,226.21C0,203.87,11.91,192,34.32,192H192v-6q0-76.75,0-153.5c0-15.73,7.69-27,21.19-30.86A44,44,0,0,1,225,.06Q544,0,863,0c20.7,0,33,12.26,33,33q.06,319.23,0,638.47c0,20-12.49,32.44-32.54,32.47q-76.5.09-153,0ZM64.22,831.64H639.6V256.27H64.22ZM831.8,64.33H256.39V192H538.7q66.48,0,133,0c17.76,0,29.44,9.86,32,26.7a65,65,0,0,1,.37,9.47q0,203,0,405.92v5.59H831.8Z" />
                    </g>
                </g>
            </svg>
            -->
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

.win-traffic-light-btn .ctl-btn svg {
    --color: #555555 !important;
    fill: var(--color);
    stroke: var(--color);
    stroke-width: 3.6px;
    padding: 1px;
    visibility: hidden;
}


.win-traffic-light-btn:hover .ctl-btn svg {
    visibility: visible;
}

.win-traffic-light-btn .close-btn {
    /*background-color: #fc605c;*/
    background-color: var(--others-win-ctl-btn-traffic-light-close-btn-bg);
}

.win-traffic-light-btn .close-btn svg {
    transform: translateX(-0.2px);
    --color: var(--others-win-ctl-btn-traffic-light-close-btn-color) !important;
}

.win-traffic-light-btn .min-btn svg {
    stroke-width: 20px !important;
    --color: var(--others-win-ctl-btn-traffic-light-min-btn-color) !important;
}

.win-traffic-light-btn .max-btn.icon-type-default svg {
    stroke-width: 3px !important;
    transform: translateX(1px) translateY(1.3px) scale(0.93);
    --color: var(--others-win-ctl-btn-traffic-light-max-btn-color) !important;
}

.win-traffic-light-btn .max-btn.icon-type-default.max-state svg {
    transform: translateX(0.1px) translateY(0.2px) scale(1.1);
}


.win-traffic-light-btn .min-btn {
    /*background-color: #fdbc40;*/
    background-color: var(--others-win-ctl-btn-traffic-light-min-btn-bg);
}

.win-traffic-light-btn .max-btn {
    /*background-color: #34c648;*/
    background-color: var(--others-win-ctl-btn-traffic-light-max-btn-bg);
    margin-right: 0px !important;
}

.win-traffic-light-btn .max-btn svg {
    width: var(--others-win-ctl-max-btn-size);
    height: var(--others-win-ctl-max-btn-size);
}

/* 图标风格 - 方框 */
.win-traffic-light-btn .max-btn svg {
    stroke-width: 100px !important;
    transform: scaleX(0.95) scaleY(0.8);
    --color: var(--others-win-ctl-btn-traffic-light-max-btn-color) !important;
}

/*
.win-traffic-light-btn .max-btn.max-state svg {
    transform: scaleX(0.95) scaleY(0.9);
}
*/

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