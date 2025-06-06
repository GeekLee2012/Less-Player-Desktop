<script setup>
import { computed, inject, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSoundEffectStore } from '../store/soundEffectStore';
import { useSettingStore } from '../store/settingStore';
import ToggleControl from '../components/ToggleControl.vue';
import VerticalSliderBar from '../components/VerticalSliderBar.vue';
import SideSliderBar from '../components/SideSliderBar.vue';
import SliderBar from '../components/SliderBar.vue';
import { isBlank, toTrimString } from '../../common/Utils';




const { useWindowsStyleWinCtl } = inject('appCommon')
const { showConfirm } = inject('apiExpose')

const { hideSoundEffectView } = useAppCommonStore()
const { currentEQIndex, currentEffectName,
    currentEQValue, currentEQValueToPercent,
    isUseEffect, currentIRIndex,
    currentStereoPanValueToPercent,
    volumeGain, currentVolumeGainToPercent,
    isUseCustomEQ, currentEQValues, 
    availableEQs, currentEQId, 
} = storeToRefs(useSoundEffectStore())
const { setUseEffect, toggleSoundEffect,
    getPresetEQs, getEQNames,
    updateCustomEQValue, percentToEQValue,
    getPresetIRs, syncCurrentEQToCustom,
    setStereoPanValue, setVolumeGain, 
    isRemovableCustomEQ, saveCustomEQ, 
    removeCustomEQ, resetCustomEQ, 
    setupSoundEffect,
} = useSoundEffectStore()
const { showToast } = useAppCommonStore()
const { isShowDialogBeforeDeleteCustomEQ } = storeToRefs(useSettingStore())


const activeTabIndex = ref(0)
const customEqNameRef = ref(null)
const dragging = ref(false)
const setActiveTab = (value) => activeTabIndex.value = value
const setDragging = (value) => dragging.value = value

//均衡器
const getEQFrequency = (frequency) => frequency.toString().replace('000', 'k')

const switchEQ = (item, index) => {
    setUseEffect(0, index)
}

const updateEQValue = (percent, item, index) => {
    const currentIndex = currentEQIndex.value
    const customMinIndex = getPresetEQs().length
    const nCurrentIndex = Math.max(currentIndex, customMinIndex)
    setUseEffect(0, nCurrentIndex)

    syncCurrentEQToCustom(currentIndex)
    updateCustomEQValue(index, percentToEQValue(percent))
    setupSoundEffect()
}

//混响
const switchIR = (item, index) => {
    if (item.enabled) setUseEffect(1, index)
}

const updateStereoPan = (percent) => {
    const panValue = 2.0 * Number(percent) - 1.0
    setStereoPanValue(panValue)
}

const computedStereoPanText = computed(() => {
    //进度条值，小数：0.0 - 1.0
    const fPercent = currentStereoPanValueToPercent.value
    //距离中点位置的偏移量
    const offset = fPercent - 0.5
    //偏移量对应的百分比，整数：0 - 100
    const offsetPercent = parseInt(Math.abs(offset) / 0.5 * 100)
    if (offset == 0) return '平衡居中'
    return offset < 0 ? `偏左${offsetPercent}%` : `偏右${offsetPercent}%`
})

const updateVolumeGain = (percent) => {
    const volume = 3.0 * Number(percent)
    setVolumeGain(volume)
}

const computedVolumeGainText = computed(() => {
    const percent = parseInt(volumeGain.value / 1.0 * 100)
    return `音量${percent}%`
})

const saveCustomEffect = () => {
    const { value: name } = customEqNameRef.value
    if(isBlank(name)) return
    const id = currentEQId.value
    const values = currentEQValues.value
    saveCustomEQ(id, toTrimString(name), values)
    showToast('自定义均衡器已保存')
}

const onCustomEQDragStart = (event) => {
    setDragging(true)
    /*仅为改变鼠标样式*/
    const { dataTransfer } = event
    if(!dataTransfer) return 
    dataTransfer.effectAllowed = 'move'
}

const removeCustomEffect = async (item) => {
    if (isShowDialogBeforeDeleteCustomEQ.value) {
        const ok = await showConfirm('确定要删除自定义均衡器吗？')
        if (!ok) return
    }
    if (!item) return
    removeCustomEQ(item)
    showToast('自定义均衡器已删除')
    setDragging(false)
}

const resetCustomEffect = () => {
    resetCustomEQ()
    showToast('自定义均衡器已重置')
}
</script>

<template>
    <div class="sound-effect-view" 
        v-gesture-dnm="{ trigger: '.header', excludes: ['.header .custom-eq-btn-group'] }">
        <div class="container">
            <div class="header">
                <div class="action" v-show="!useWindowsStyleWinCtl">
                    <div class="close-btn btn" @click="hideSoundEffectView">
                        <svg width="13" height="13" viewBox="0 0 593.14 593.11" data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z"
                                transform="translate(-663.4 -243.46)" />
                        </svg>
                    </div>
                </div>
                <div class="title-wrap">
                    <div class="title">音效SOUND</div>
                    <ToggleControl id="toggle-ctl" :value="isUseEffect" @click="toggleSoundEffect">
                    </ToggleControl>
                    <div class="effect-name" v-show="!isUseCustomEQ">{{ currentEffectName }}</div>
                    <div class="custom-eq-btn-group" v-show="isUseCustomEQ">
                        <div class="group-title-input-wrap">
                            <div class="group-title">{{ currentEffectName }}</div>
                            <input type="text" ref="customEqNameRef" :value="currentEffectName" maxlength="99" placeholder="自定义均衡器名称"/>
                        </div>
                        <div class="group-item btn text-btn first" @click="saveCustomEffect">
                            <svg width="15" height="15" viewBox="0 0 853.61 853.59" xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path d="M426.39,853.55h-199c-32.66,0-65.33.12-98,0C69.66,853.23,19.5,815.14,4.57,758.06A138.7,138.7,0,0,1,.21,723.51Q-.18,426.78.06,130.05c0-64,42.59-115.66,105-127.71A135.26,135.26,0,0,1,130.43.14q232-.19,464-.14c13.93,0,25.46,4.72,35.34,14.64Q733.72,118.89,838,222.83c10.58,10.53,15.62,22.58,15.61,37.48-.13,154,.12,308-.2,462-.1,53.18-24.09,92.8-71.21,117.81-18.61,9.87-38.86,13.47-59.83,13.47Q574.38,853.52,426.39,853.55Zm-170-640h6.94q143.49,0,287,0c3,0,6,0,9,.23,22.36,1.7,40.48,23.55,38,45.78-2.61,23.46-20.15,39.22-43.88,39.22q-168.49,0-337,0c-27.74,0-45.64-17.9-45.64-45.63q0-80.73,0-161.48V85.85c-16.65,0-32.66-.59-48.59.31-6,.33-12.33,3.23-17.49,6.55-13.7,8.82-19.26,22-19.25,38.28q.18,295.72.08,591.45c0,1.67,0,3.33.06,5,.74,18.92,14,35.43,32.57,39.27,7.24,1.5,14.89,1.14,22.36,1.29,9.94.19,19.88,0,30.26,0v-6.49q0-144.49,0-289c0-28,17.85-45.78,46-45.78h420c28.4,0,46,17.71,46,46.22V768c13.88,0,27,0,40.19,0,27.25,0,45-17.78,45-45q0-222.22.08-444.46a10.66,10.66,0,0,0-3.39-8.3q-90.8-90.57-181.37-181.34A10.63,10.63,0,0,0,575,85.48q-156.49.12-313,.07h-5.71Zm340.86,554.3V512.5H256.41V767.85Z" />
                                    </g>
                                </g>
                            </svg>
                            <span>保存</span>
                        </div>
                        <div class="group-item  btn text-btn last" @click="resetCustomEffect">
                            <svg width="16" height="16" viewBox="0 0 256 256" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1040,669H882c-12.79-4.93-17.16-14.62-17.1-27.83.26-52.77.11-105.55.11-158.32V477c-6,0-11.42-.32-16.84.09-6.54.48-11.66-1.39-15.17-7.08v-7c3.16-5.7,8-7.48,14.44-7.36,18.29.32,36.58.12,54.88.1,1.75,0,3.5-.16,5.48-.25,0-7.76,0-14.91,0-22.05a18.56,18.56,0,0,1,6.6-14.52c2.85-2.39,6.37-4,9.59-5.92h73c13.83,5.64,17.27,10.84,17.25,26.08,0,5.41,0,10.82,0,16.68h7.53c17.61,0,35.21.2,52.81-.12,6.43-.12,11.27,1.63,14.41,7.36v7c-3.5,5.7-8.63,7.56-15.17,7.08-5.41-.4-10.89-.09-16.84-.09v6.36c0,52.6-.15,105.2.11,157.8C1057.17,654.36,1052.81,664.08,1040,669ZM886.24,477.29V640.4c0,8.44-.49,7.34,7.11,7.35q67.95,0,135.9,0c6.51,0,6.52,0,6.52-6.43v-164Zm106.5-42.78H929.37v21h63.37Z"
                                    transform="translate(-833 -413)" />
                                <path d="M950.29,562.2c0-13.47,0-26.94,0-40.41,0-7.94,4.25-12.84,10.82-12.77,6.36.07,10.59,5,10.6,12.52,0,27.28,0,54.55,0,81.83,0,5.13-1.71,9.17-6.5,11.36-7.39,3.36-14.87-2.16-14.94-11.11-.11-13.81,0-27.61,0-41.42Z"
                                    transform="translate(-833 -413)" />
                                <path d="M1014.25,562.63c0,13.48,0,27,0,40.42,0,7.88-4.3,12.82-10.87,12.64-6.29-.18-10.35-5.13-10.36-12.75q0-41.16,0-82.33c0-5.91,3-9.91,8-11.26a10.29,10.29,0,0,1,11.85,5.16,16.06,16.06,0,0,1,1.33,6.71c.12,13.8.06,27.61.06,41.41Z"
                                    transform="translate(-833 -413)" />
                                <path d="M929,562.53q0,21,0,41.92c0,4.8-2.09,8.39-6.49,10.29-4.21,1.81-8.49,1.25-11.43-2.23a13.57,13.57,0,0,1-3.17-8c-.23-28.1-.19-56.21-.12-84.32,0-6.74,4.63-11.34,10.74-11.19s10.41,4.78,10.44,11.59C929.05,534.59,929,548.56,929,562.53Z"
                                    transform="translate(-833 -413)" />
                            </svg>
                            <span>重置</span>
                        </div>
                    </div>
                </div>
                <div class="action" v-show="useWindowsStyleWinCtl">
                    <div class="close-btn btn" @click="hideSoundEffectView">
                        <svg width="13" height="13" viewBox="0 0 593.14 593.11" data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z"
                                transform="translate(-663.4 -243.46)" />
                        </svg>
                    </div>
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
                    <div class="nav-item" :class="{ active: activeTabIndex == 2 }" @click="() => setActiveTab(2)">
                        <svg width="36" height="36" viewBox="0 0 875.14 917" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M461,0c5.91.57,11.82,1.23,17.74,1.71C576.82,9.54,660.56,49.4,732.92,115,802.41,178,847,255.16,865.64,347.17A475.74,475.74,0,0,1,875,441q.18,136.24.14,272.48c0,18.29.42,36.59-4,54.66C857.06,826.21,808.5,868.37,749,873a429.58,429.58,0,0,1-46.93.81c-22.77-.71-39.48-19.13-39.53-42.65q-.24-103.48-.33-207c0-23,.2-46,.31-69,.13-25.27,17.93-43.13,43.17-43.22q39.24-.15,78.49-.18h6.33c0-9.42.11-18.36,0-27.29-.37-24.47.18-49-1.47-73.39-4.64-68.7-27.5-131-69.5-185.72C669.4,160.12,605.4,115.3,524.82,95.56A377.81,377.81,0,0,0,441.29,84.8c-94.8-1.71-175.55,32.66-244.7,95.93-57.73,52.82-91.32,119-105.63,195.49a320.87,320.87,0,0,0-5.15,60.63c.12,23,0,46,0,69v6h5.8q39.26.09,78.5.18c25.52.08,43.33,18,43.36,43.48q.18,134.49.18,269a72.38,72.38,0,0,1-3.62,23.47c-5.62,16.1-18.35,24.83-34.87,25.63-23.74,1.15-47.61,1.7-71-4.35C47.79,854.64,7.5,808.18,2,750.2.61,735.65,1,720.92.88,706.27c-.17-23.5,0-47-.08-70.49A42.48,42.48,0,0,0,0,630V510a35.66,35.66,0,0,0,.8-5.28c.11-23.32,0-46.65.23-70,.31-33.23,3.44-66.22,11.4-98.51C45,204.22,123.73,108.3,243,45.13,292.92,18.68,347.17,6.25,403.33,1.9,410.23,1.36,417.11.64,424,0ZM85.84,597.24v6.27q0,62.68,0,125.36c0,4.16-.08,8.33.19,12.48,1.41,21.74,21,43.33,42.14,46.19V597.24Zm661.95,190.2c19.07-2.09,37.71-19.74,41-40.65,2-12.55,1.61-25.52,1.69-38.31.19-35.14.06-70.27.06-105.41v-5.79h-42.7Z" />
                                    <path
                                        d="M433,917a7.44,7.44,0,0,0-1.69-.85c-22.19-4.63-35.19-20.16-35.81-42.84,0-1,0-2,0-3q0-219.7,0-439.42c0-13.94,3.36-26.49,14.12-36,12.87-11.36,27.78-14.16,43.73-8C469.06,393.07,478,405,480.08,421.9a66.17,66.17,0,0,1,.41,8q0,219.46,0,438.93c0,10.14-1.39,19.92-7,28.68-6.57,10.25-16.05,16.15-27.87,18.53a16.1,16.1,0,0,0-2.63,1Z" />
                                    <path
                                        d="M341.51,650.75c0,31.63-.27,63.26.08,94.89.31,27.75-21,41.23-38.73,43.09C281.17,791,261.17,775,257.4,752.63a61.24,61.24,0,0,1-.55-10q0-88.7,0-177.39c0-6.3,0-12.72,1.08-18.88C262,524.17,281.4,510,304.12,512.07c21.16,2,37.27,20,37.35,42.28C341.59,586.48,341.5,618.61,341.51,650.75Z" />
                                    <path
                                        d="M619,650.52q0,47.75,0,95.5c0,23.89-18.66,42.69-42.3,42.81s-42.12-18.7-42.18-42.78c-.07-27,0-54,0-81-.05-27.5-.24-55-.3-82.48,0-9.67.17-19.33.32-29,.37-23.41,18.46-41.53,41.61-41.71,23.46-.19,42.5,17.65,42.79,41.12C619.3,585.52,619,618,619,650.52Z" />
                                </g>
                            </g>
                        </svg>
                        <div class="text">其他</div>
                    </div>
                </div>
                <div class="content equalizer" v-show="activeTabIndex == 0">
                    <div class="tip-text">提示：自定义均衡器，“轻轻拖拽一下”即可删除</div>
                    <div class="presets">
                        <div v-for="(item, index) in availableEQs" 
                            @click="switchEQ(item, index)"
                            :draggable="isRemovableCustomEQ(item)"
                            @dragstart.stop="onCustomEQDragStart"
                            @dragend.stop="removeCustomEffect(item)"
                            class="item spacing1"
                            :class="{  
                                active: currentEQIndex == index,
                                dragging,
                            }">
                            <span>{{ item.name }}</span>
                        </div>
                    </div>
                    <div class="bands">
                        <div v-for="(item, index) in getEQNames()" class="item">
                            <div class="value">{{ currentEQValue(index) }}dB</div>
                            <VerticalSliderBar :value="currentEQValueToPercent(index)" 
                                :precision="6"
                                :onseek="(value) => updateEQValue(value, item, index)"
                                :onscroll="(value) => updateEQValue(value, item, index)"
                                :onDragMove="(value) => updateEQValue(value, item, index)">
                            </VerticalSliderBar>
                            <div class="text">{{ getEQFrequency(item.frequency) }}</div>
                        </div>
                    </div>
                </div>
                <div class="impulse-content" v-show="activeTabIndex == 1">
                    <div v-for="(item, index) in getPresetIRs()" v-show="item.enabled" v-html="item.name"
                        class="item spacing1" :class="{ active: currentIRIndex == index, disabled: !item.enabled }"
                        @click="switchIR(item, index)">
                    </div>
                </div>
                <div class="others-content" v-show="activeTabIndex == 2">
                    <div class="item stereo-pan">
                        <div class="item-center">
                            <span class="text-btn" @click="setStereoPanValue(-1)">左声道</span>
                            <SideSliderBar class="value" :value="currentStereoPanValueToPercent" :onSeek="updateStereoPan"
                                :onScroll="updateStereoPan" :onDragMove="updateStereoPan">
                            </SideSliderBar>
                            <span class="text-btn" @click="setStereoPanValue(1)">右声道</span>
                        </div>
                        <div class="item-bottom">
                            <span class="text-btn tip-text" @click="setStereoPanValue(0)"
                                v-html="computedStereoPanText"></span>
                        </div>
                    </div>
                    <div class="item volume">
                        <div class="item-center">
                            <span class="text-btn" @click="setVolumeGain(0)">静音</span>
                            <SliderBar :value="currentVolumeGainToPercent" :scopeType="1" :onSeek="updateVolumeGain"
                                :onScroll="updateVolumeGain" :onDragMove="updateVolumeGain" 
                                keyName="soundEffect">
                            </SliderBar>
                            <span class="text-btn" @click="setVolumeGain(3)">最大</span>
                        </div>
                        <div class="item-bottom">
                            <span class="text-btn tip-text" @click="setVolumeGain(1)"
                                v-html="computedVolumeGainText"></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.sound-effect-view {
    display: flex;
    overflow: hidden;
    -webkit-app-region: none;
    --others-sliderbar-ctl-height: 5px;
    --others-sliderbar-thumb-size: 15px;
    --header-height: 60px;
}

.sound-effect-view .container {
    display: flex;
    flex: 1;
    flex-direction: column;
    background: var(--content-bg-color);
    background: var(--content-bg-color-no-transparent);
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
    /*padding: 12px 12px 12px 3px;*/
    height: var(--header-height);
    padding-left: 3px;
    padding-right: 12px;
    border-bottom: 2px solid var(--border-header-nav-border-color);
    background: transparent;
    position: relative;
}

.sound-effect-view .header > .action {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}

.sound-effect-view .header > .action .close-btn {
    width: 30px;
}

.sound-effect-view .header .title-wrap {
    margin-left: 10px;
    margin-right: 10px;
    display: flex;
    align-items: center;
    flex: 1;
    position: relative;
}

.sound-effect-view .header .title {
    margin-right: 30px;
    font-size: calc(var(--content-text-size) + 1px);
}

.sound-effect-view .header #toggle-ctl {
    margin-left: 18px;
    margin-right: 8px;
}


.sound-effect-view .header .custom-eq-btn-group {
    display: flex;
    align-items: center;
    --input-width: 202px;
    --input-padding: 5px;
    --input-margin-left: 6px;
}

.sound-effect-view .header .custom-eq-btn-group:hover {
    background: var(--content-list-item-hover-bg-color);
    border-radius: var(--border-inputs-border-radius);
}

.sound-effect-view .header .custom-eq-btn-group .group-title {
    width: calc(var(--input-width) + 2 * var(--input-padding) + var(--input-margin-left));
    margin-right: 10px;

    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    text-align: left;
    word-wrap: break-word;
    line-break: anywhere;
}

.sound-effect-view .header .custom-eq-btn-group:hover .group-title {
    display: none;
}

.sound-effect-view .header .custom-eq-btn-group .group-title-input-wrap input {
    display: none;
    border: 1px solid var(--border-inputs-border-color);
    background-color: var(--content-inputs-bg-color);
    border-radius: var(--border-inputs-border-radius);
    padding: var(--input-padding);
    color: var(--content-inputs-text-color);
    width: var(--input-width);
    cursor: default;
    margin-left: var(--input-margin-left);
}

.sound-effect-view .header .custom-eq-btn-group:hover input {
    display: block;
    margin-right: 8px;
}

.sound-effect-view .header .custom-eq-btn-group .group-item {
    padding: 8px 15px;
    margin-left: 6px;
    display: flex;
    align-items: center;
}

.sound-effect-view .header .custom-eq-btn-group .group-item.first {
    margin-left: 0px;
}

.sound-effect-view .header .custom-eq-btn-group .group-item.last {
    border-top-right-radius: var(--border-inputs-border-radius);
    border-bottom-right-radius: var(--border-inputs-border-radius);
}

.sound-effect-view .header .custom-eq-btn-group .text-btn  {
    margin-left: 0px;
    font-size: var(--content-text-tip-text-size);
}

.sound-effect-view .header .custom-eq-btn-group .text-btn:hover {
    font-weight: bold;
    background: var(--button-icon-text-btn-bg-color);
    color: var(--button-icon-text-btn-text-color);
}

.sound-effect-view .header .custom-eq-btn-group .text-btn:hover svg {
    fill: var(--button-icon-text-btn-icon-color);
}

.sound-effect-view .header .custom-eq-btn-group .text-btn.last  {
    margin-right: 0px;
    margin-left: 0px;
}


.sound-effect-view .center {
    flex: 1;
    overflow: hidden;
    background: transparent;
}

.sound-effect-view .center .left {
    width: 108px;
    min-width: 68px;
    background: var(--content-header-nav-bg-color);
    border-right: 2px solid var(--border-header-nav-border-color);
}

.sound-effect-view .center .left .nav-item {
    padding: 30px 0px;
    cursor: pointer;
}

.sound-effect-view .center .left .nav-item svg {
    fill: var(--content-subtitle-text-color);
    color: var(--content-subtitle-text-color);
}

.sound-effect-view .center .left .nav-item:hover {
    background: var(--content-list-item-hover-bg-color);
}

/*
.sound-effect-view .center .left .nav-item:hover,
.sound-effect-view .center .left .nav-item:hover svg {
    fill: var(--button-icon-btn-color);
    color: var(--content-text-color);
}
*/

.sound-effect-view .center .left .active,
.sound-effect-view .center .left .active svg {
    fill: var(--content-highlight-color) !important;
    color: var(--content-highlight-color) !important;
    font-weight: bold;
}

/*
.sound-effect-view .center .left .active {
    background: var(--content-list-item-hl-bg-color) !important;
    color: var(--content-list-item-hl-text-color) !important;
    font-weight: bold;
}

.sound-effect-view .center .left .active svg {
    fill: var(--content-list-item-hl-text-color) !important;
}
*/

.sound-effect-view .center .content {
    flex: 1;
    padding-top: 10px;
    padding-bottom: 50px;
    margin-left: 0px;
    overflow: scroll;
    overflow-x: hidden;
}

.sound-effect-view .center .content.equalizer .tip-text {
    text-align: left;
    padding-left: 45px;
}

.sound-effect-view .center .content .presets {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
    padding-right: 25px;
    padding-left: 20px;
}

.sound-effect-view .center .presets .item {
    margin-top: 15px;
    width: 87px;
    height: 33px;
    line-height: 33px;
    padding-left: 6px;
    padding-right: 6px;
    border-radius: var(--border-inputs-border-radius);
    border-radius: var(--border-list-item-vertical-border-radius);
    border-radius: calc(var(--border-list-item-vertical-border-radius) - 1px);
    border: 2px solid transparent;
    background-color: #f3f3f3;
    background: var(--content-list-item-hover-bg-color);
    cursor: pointer;

    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    text-align: center;
    word-wrap: break-word;
    line-break: anywhere;
}

.sound-effect-view .center .presets .item.dragging {
    cursor: move;
}

.sound-effect-view .center .presets .item.active {
    /*border: 2px solid var(--content-highlight-color);*/
    /*
    background: var(--button-icon-text-btn-bg-color) !important;
    color: var(--button-icon-text-btn-icon-color);
    */
    background: var(--content-list-item-hl-bg-color) !important;
    color: var(--content-list-item-hl-text-color) !important;
}

.contrast-mode .sound-effect-view .center .presets .active {
    font-weight: bold;
}

.sound-effect-view .center .bands {
    justify-content: center;
    overflow: hidden;
}

.sound-effect-view .center .bands .item {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 52px;
}

.sound-effect-view .center .bands .text,
.sound-effect-view .center .bands .value {
    font-size: 15px;
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
    padding-top: 10px;
    padding-bottom: 30px;
    margin-left: 0px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    overflow: scroll;
    overflow-x: hidden;
    padding-right: 25px;
}

.sound-effect-view .center .impulse-content .item {
    width: 228px;
    margin-top: 15px;
    padding: 7px 0px;
    border-radius: var(--border-inputs-border-radius);
    border-radius: var(--border-list-item-vertical-border-radius);
    border-radius: calc(var(--border-list-item-vertical-border-radius) - 1px);
    border: 2px solid transparent;
    background-color: #f3f3f3;
    background: var(--content-list-item-hover-bg-color);
    cursor: pointer;
}

.sound-effect-view .center .impulse-content .active {
    /*border: 2px solid var(--content-highlight-color);*/
    /*
    background: var(--button-icon-text-btn-bg-color) !important;
    color: var(--button-icon-text-btn-icon-color);
    */
    background: var(--content-list-item-hl-bg-color) !important;
    color: var(--content-list-item-hl-text-color) !important;
}

.contrast-mode .sound-effect-view .center .impulse-content .active {
    font-weight: bold;
}


.sound-effect-view .center .presets .item:hover,
.sound-effect-view .center .impulse-content .item:hover {
    border-color: var(--content-highlight-color);
}

.sound-effect-view .center .impulse-content .disabled {
    cursor: not-allowed;
    color: var(--toggle-thumb-bg) !important;
}

.sound-effect-view .center .others-content {
    flex: 1;
    padding: 50px 25px 25px 25px;
    margin-left: 0px;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-wrap: wrap;
    overflow: scroll;
    overflow-x: hidden;
}

.sound-effect-view .center .others-content .item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 95%;
    margin-bottom: 35px;
}

.sound-effect-view .center .others-content .item .item-center {
    display: flex;
    align-items: center;
    width: 100%;
    margin-bottom: 6px;
}

.sound-effect-view .center .others-content .item .item-center .text-btn {
    min-width: 60px;
}

.contrast-mode .sound-effect-view .center .others-content .item .item-bottom .tip-text {
    font-weight: bold;
}

.sound-effect-view .center .others-content .item .side-slider-bar,
.sound-effect-view .center .others-content .item .slider-bar {
    margin-left: 15px;
    margin-right: 15px;
    flex: 1;
    height: 3px;
}
</style>