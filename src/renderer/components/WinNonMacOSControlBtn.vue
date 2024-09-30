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
const { isHideToTrayOnMinimized, isTrayShow, isShowDialogBeforeQuitApp  } = storeToRefs(useSettingStore())
const isMinBtnDisabled = ref(false)

const doQuit = async () => {
    if(!isTrayShow.value && !desktopLyricShow.value && isShowDialogBeforeQuitApp.value) {
        const ok = await showConfirm('确定要退出应用吗?')
        if(!ok) return
    }
    quit()
}

const setMinBtnDisabled = (value) => {
    isMinBtnDisabled.value = value
}

const doMinimize = () => {
    if (isMinBtnDisabled.value) return
    minimize(isHideToTrayOnMinimized.value)
}

const isMaximized = toRef(props, 'isMaximized')
const toggleMaximize = () => maximize()
</script>

<template>
    <div class="win-non-macos-ctl-btn">
        <div class="ctl-btn collapse-btn" v-show="showCollapseBtn" @click="collapseAction">
            <svg width="19" height="17" xmlns="http://www.w3.org/2000/svg" viewBox="0 66 640.13 352.15">
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
        <div @click="doMinimize" v-show="!hideMinBtn" class="ctl-btn min-btn"
            :class="{ 'button-disabled': isMinBtnDisabled }">
            <svg width="19" height="19" viewBox="0 0 256 256" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink">
                <path
                    d="M208,134.4H48c-3.534,0-6.4-2.866-6.4-6.4s2.866-6.4,6.4-6.4h160c3.534,0,6.4,2.866,6.4,6.4S211.534,134.4,208,134.4z" />
            </svg>
        </div>
        <div @click="toggleMaximize" v-show="!hideMaxBtn" class="ctl-btn max-btn" :class="{ 'max-state': isMaximized }">
            <svg width="16" height="16" v-show="!isMaximized" viewBox="0 0 853.55 853.57"
                xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <path
                            d="M426.76,0Q575,0,723.25.06C785.32.1,836.55,40.3,850.13,100a138,138,0,0,1,3.25,30.21q.29,296.73.1,593.47c0,61.71-39.88,112.43-99.28,126.36a136.45,136.45,0,0,1-30.69,3.4q-296.75.29-593.47.11C66.25,853.47,14.61,811.12,2.42,749a134.59,134.59,0,0,1-2.3-25.83q-.19-296.49-.08-593C.06,70.11,37.43,20.34,94.77,4.84a144.93,144.93,0,0,1,37-4.6C230.1-.13,328.43,0,426.76,0Zm.52,85.5q-148.24,0-296.48,0c-27.38,0-45.26,17.68-45.26,44.86q0,296.49,0,593c0,26.67,17.86,44.49,44.47,44.65,11.66.07,23.33,0,35,0q278.73,0,557.47.19c27,0,45.69-20.64,45.66-44.32q-.36-297-.22-594a51.19,51.19,0,0,0-2-14.74c-5.67-18.59-21.69-29.63-42.63-29.63Q575.28,85.51,427.28,85.54Z" />
                    </g>
                </g>
            </svg>
            <svg width="23" height="23" v-show="isMaximized" viewBox="0 0 896.01 896" xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <path
                            d="M704,704v88.25q0,35,0,70c0,21.66-12.1,33.74-33.79,33.74q-318,0-636,0C11.91,896,0,884.05,0,861.68Q0,543.94,0,226.21C0,203.87,11.91,192,34.32,192H192v-6q0-76.75,0-153.5c0-15.73,7.69-27,21.19-30.86A44,44,0,0,1,225,.06Q544,0,863,0c20.7,0,33,12.26,33,33q.06,319.23,0,638.47c0,20-12.49,32.44-32.54,32.47q-76.5.09-153,0ZM64.22,831.64H639.6V256.27H64.22ZM831.8,64.33H256.39V192H538.7q66.48,0,133,0c17.76,0,29.44,9.86,32,26.7a65,65,0,0,1,.37,9.47q0,203,0,405.92v5.59H831.8Z" />
                    </g>
                </g>
            </svg>
        </div>
        <div @click="doQuit" class="ctl-btn close-btn">
            <svg width="15" height="15" viewBox="0 0 1004.78 1003.64" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M510.76,407c19.71-20,38.9-39.67,58.35-59.1Q725,192.26,881,36.76c20-20,44.11-25.92,70.75-18.24,27.47,7.92,45,26.79,51.17,54.83,5.67,25.64-1.48,48.2-19.73,67-15.34,15.78-31.06,31.17-46.62,46.72L618,505.59c-1.39,1.39-2.72,2.84-4.83,5.05,11.75,11.48,23.43,22.61,34.8,34.05Q807.53,705.07,967,865.52c21,21.12,27.13,51.81,15.58,78.83-12.08,28.22-37.87,45.28-67.89,44.81-20.19-.32-37.11-8.21-51.28-22.37q-67-67-134-134-108-108-216-216c-1.29-1.29-2.34-2.82-3.83-4.64-1.85,1.76-3.17,3-4.42,4.2q-183,183-365.91,365.92c-28.16,28.17-72,28.59-101.18.92C9.43,956,7.84,911.93,34.48,882.42c1.89-2.1,3.91-4.1,5.92-6.1Q221,695.66,401.73,515c1.52-1.52,3.27-2.8,6.76-5.76-2.68-1.55-4.74-2.25-6.12-3.62Q212.44,315.85,22.65,125.93C2.21,105.47-5.08,80.7,3.6,53.05S31.05,7.17,60,1.49c25.6-5,47.76,2.82,66.13,21.15Q205.4,101.75,284.54,181L506.28,402.74C507.44,403.89,508.67,405,510.76,407Z"/></g></g></svg>
            <!--
            <svg width="23" height="23" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <g id="cross">
                    <line class="cls-1" x1="7" x2="25" y1="7" y2="25" />
                    <line class="cls-1" x1="7" x2="25" y1="25" y2="7" />
                </g>
            </svg>
            -->
        </div>
    </div>
</template>

<style scoped>
.win-non-macos-ctl-btn {
    display: flex;
    -webkit-app-region: none;
    /* width: 56px; */
}


.win-non-macos-ctl-btn .ctl-btn {
    /*width: var(--others-win-ctl-btn-size);
    height: var(--others-win-ctl-btn-size);
    margin-right: var(--others-win-ctl-btn-margin-right);
    border-radius: 10rem; */
    -webkit-app-region: none;
    cursor: pointer !important;
    display: flex;
    align-items: center;
    justify-content: center;

    /*margin-left: 18px;*/
    margin-left: 2px;
    width: 36px;
    height: 28px;
    border-radius: 2px;
}

.win-non-macos-ctl-btn div:hover {
    cursor: pointer;
}

.win-non-macos-ctl-btn .ctl-btn svg {
    fill: var(--button-icon-btn-color);
    stroke-width: 3.3px;
    stroke: var(--button-icon-btn-color);
    padding: 1px;
    /*visibility: hidden;*/
}

.win-non-macos-ctl-btn .ctl-btn:hover {
    background: var(--content-list-item-hover-bg-color);
    cursor: pointer;
}

.win-non-macos-ctl-btn:hover .ctl-btn svg {
    visibility: visible;
}

.win-non-macos-ctl-btn .min-btn svg {
    stroke-width: 18px !important;
    transform: scaleX(1.2);
}

.win-non-macos-ctl-btn .max-btn svg {
    stroke-width: 60px !important;
    transform: scale(0.95) scaleY(0.85) scaleX(1.15);
}

.win-non-macos-ctl-btn .max-btn.max-state svg {
    transform: scale(0.8) scaleX(1.1) scaleY(0.85);
}

/*
.win-non-macos-ctl-btn .collapse-btn {
    cursor: pointer;
    -webkit-app-region: none;
    padding-right: 8px;
}

.win-non-macos-ctl-btn .collapse-btn svg {
    fill: var(--button-icon-btn-color);
    width: var(--others-win-ctl-collapse-btn-size);
    height: var(--others-win-ctl-collapse-btn-size);
}


.win-non-macos-ctl-btn .collapse-btn:hover,
.win-non-macos-ctl-btn .collapse-btn:hover svg {
    fill: var(--content-highlight-color);
    cursor: pointer;
}
*/

.win-non-macos-ctl-btn .collapse-btn svg {
    transform: translateY(2px);
}

.win-non-macos-ctl-btn .close-btn:hover {
    /*background-color: #e5182c !important;*/
    background-color: #fc605c !important;
}
</style>