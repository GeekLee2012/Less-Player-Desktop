<script setup>
import { computed, inject, ref, reactive, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';
import ColorInputControl from '../components/ColorInputControl.vue';
import SingleSelectionControl from '../components/SingleSelectionControl.vue';
import { emitEvents } from '../../common/EventBusWrapper';



const { useWindowsStyleWinCtl } = inject('appCommon')

const { 
    showToast, showFailToast, hideCustomWindowCtlBtnView, 
    toggleCustomWindowCtlBtnViewPreviewMode,
} = useAppCommonStore()
const { customWindowCtlBtnViewContext, customWindowCtlBtnViewPreviewMode: isPreviewMode } = storeToRefs(useAppCommonStore())
const { winCtlCustomStyle } = storeToRefs(useSettingStore())
const { setWindowCtlCutomStyle, getPresetWindowCtlStyle, } = useSettingStore()

const emptyData = { 
    light: { 
        bg: {
            closeBtn: null,
            minBtn: null,
            maxBtn: null,
        },
        btnColor: {
            closeBtn: null,
            minBtn: null,
            maxBtn: null,
        },
    }, 
    dark: {
        bg: {
            closeBtn: null,
            minBtn: null,
            maxBtn: null,
        },
        btnColor: {
            closeBtn: null,
            minBtn: null,
            maxBtn: null,
        },
    },
    extra: {
        iconType: 0,
    }
}
const customData = reactive(emptyData)
//const isPreviewMode = ref(false)
const activeTabIndex = ref(0)
const subtitle = ref('')
const setActiveTab = (value) => activeTabIndex.value = value
const setSubtitle = (value) => subtitle.value = value
const options = reactive({ 
    lightBgSyncToDark: false, 
    lightBgForAll: false, 
    lightBtnColorSyncToDark: false, 
    lightBtnColorForAll: false, 
    darkBgSyncToLight: false, 
    darkBgForAll: false, 
    darkBtnColorSyncToLight: false, 
    darkBtnColorForAll: false
})
const toggleOption = (key) => Object.assign(options, { [key]: !options[key] })
const btnKeys = ['closeBtn', 'minBtn', 'maxBtn']
const setLightItem = (type, key, value) => {
    const index = (type == 'bg') ? 0 : ((type == 'btnColor') ? 1 : -1)
    const forAllOption = [options.lightBgForAll, options.lightBtnColorForAll][index] || false
    const syncOption = [options.lightBgSyncToDark, options.lightBtnColorSyncToDark][index] || false

    btnKeys.filter(btnKey => (forAllOption || btnKey == key))
        .forEach(key => {
            Object.assign(customData.light[type], { [key]: value })
        })
    
    if(syncOption) Object.assign(customData.dark[type], { ...customData.light[type] })
}
const setDarkItem = (type, key, value) => {
    const index = (type == 'bg') ? 0 : ((type == 'btnColor') ? 1 : -1)
    const forAllOption = [options.darkBgForAll, options.darkBtnColorForAll][index] || false
    const syncOption = [options.darkBgSyncToLight, options.darkBtnColorSyncToLight][index] || false

    btnKeys.filter(btnKey => (options.darkBgForAll || btnKey == key))
        .forEach(key => {
            Object.assign(customData.dark[type], { [key]: value })
        })
    
    
    if(syncOption) Object.assign(customData.light[type], { ...customData.dark[type] })
}
const setExtraItem = (key, value) => {
    Object.assign(customData.extra, { [key]: value })
}


//预览
const togglePreview = () => {
    toggleCustomWindowCtlBtnViewPreviewMode()
    emitEvents('setting-windowCtlBtnPreview', isPreviewMode.value ? customData : null)
}

const setDefault = (event) => {
    const isUserAction = event ? true : false
    Object.assign(customData, { ...getPresetWindowCtlStyle() })
    if (isUserAction) showToast('按钮设置已还原为默认')
}

const transformData = (data) => {
    if(!data) return { ...emptyData }
    if(!data.light) Object.assign(data, { light: { ...emptyData.light } })
    if(!data.light.bg) Object.assign(data.light, { bg: { ...emptyData.light.bg } })
    if(!data.light.btnColor) Object.assign(data.light, { btnColor: { ...emptyData.light.btnColor } })
    
    if(!data.dark) Object.assign(data, { dark: { ...emptyData.dark } })
    if(!data.dark.bg) Object.assign(data.dark, { bg: { ...emptyData.dark.bg } })
    if(!data.dark.btnColor) Object.assign(data.dark, { btnColor: { ...emptyData.dark.btnColor } })

    if(!data.extra) Object.assign(data, { exta: { ...emptyData.extra } })
    if(!data.extra.iconType) Object.assign(data.exta, { iconType: { ...emptyData.extra.iconType } })
    return data
}

const resetData = (event) => {
    const isUserAction = event ? true : false
    const data = JSON.parse(JSON.stringify(transformData({ ...winCtlCustomStyle.value })))
    Object.assign(customData, data)
    if (isUserAction) showToast('按钮设置已重置')
}

//保存
const saveData = () => {
    setWindowCtlCutomStyle(customData)
    showToast('按钮设置保存成功')
    hideCustomWindowCtlBtnView()
}

const invokeContextMounted = () => {
    resetData()

    const context = customWindowCtlBtnViewContext.value
    if(!context) return 
    const { mounted } = context 
    if(typeof mounted == 'function') {
        const { index, type, subtitle } = mounted()
        //setActiveTab(type)
        setSubtitle(subtitle)
    }
}

const invokeContextUnmounted = () => {
    const context = customWindowCtlBtnViewContext.value
    if(!context) return 
    const { unmounted } = context 
    if(typeof unmounted == 'function') unmounted()

    setThemeSelectionViewContext(null)
}


onMounted(invokeContextMounted)
onUnmounted(invokeContextUnmounted)
</script>

<template>
    <div class="custom-window-ctl-btn-view" 
        :class="{ 'preview-mode': isPreviewMode }"
        v-gesture-dnm="{ trigger: '.header' }">
        <div class="container">
            <div class="header">
                <div class="action left-action">
                    <div class="close-btn btn" @click="hideCustomWindowCtlBtnView"
                        v-show="!useWindowsStyleWinCtl && !isPreviewMode">
                        <svg width="13" height="13" viewBox="0 0 593.14 593.11" data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z"
                                transform="translate(-663.4 -243.46)" />
                        </svg>
                    </div>
                </div>
                <div class="title-wrap">
                    <div class="title">窗口按钮设置</div>
                </div>
                <div class="action right-action">
                    <div class="preview-btn btn text-btn" v-show="!isPreviewMode"
                        @click="togglePreview">
                        <svg width="17" height="17" viewBox="0 -60 1024 712.45" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M1024,367.07c-17.45,50.91-46.34,95.11-81.68,135C855.27,600.31,747.67,665.52,620.7,698.54A423.73,423.73,0,0,1,475,710.72c-51.1-4.63-100.21-17.71-147.7-36.88C242.65,639.66,167.76,590.65,104,525.16,61.71,481.79,27.47,433,4.63,376.55,3,372.44,1.54,368.23,0,364.07v-16C13.9,309.84,33.44,274.66,57.56,242c42.07-56.94,93.83-103.54,152.85-142.25C268,62,329.77,33.26,396.56,15.77,445.25,3,494.64-2.88,545,1.36,596.09,5.67,645.3,18.08,693,36.82c89.16,35.07,167.58,86.35,233.77,155.79,39,41,71,86.84,92.67,139.39,1.76,4.26,3.07,8.71,4.59,13.07ZM514.32,89A364.27,364.27,0,0,0,420,101.72C326.17,127,244.8,174.22,175.29,241.88,142.34,274,114.82,310.16,94.8,351.8a9.05,9.05,0,0,0,0,8.81,355.7,355.7,0,0,0,49.38,76.06c64.86,76.62,145.74,129.87,240,163.26,38.48,13.63,78.11,22.09,119.1,23.26,38.83,1.12,76.7-4.88,113.81-15.8,84.21-24.78,158.33-67.5,222.73-127,37.39-34.54,68.72-73.82,91.17-119.82a9.05,9.05,0,0,0,0-8.81c-17.67-36.67-41.29-69.17-69.35-98.46C803.37,192.54,734.37,148,655.91,118,609.69,100.3,562,89.52,514.32,89Z" />
                                    <path
                                        d="M511.83,200.33c85.66-.24,155.9,69.8,156.05,155.61S598.46,511.73,512.42,512.09s-156.23-69.71-156.3-155.81C356.05,270.5,425.86,200.58,511.83,200.33Zm0,222.71a66.82,66.82,0,1,0,0-133.63c-36.46,0-66.52,29.89-66.72,66.32A67,67,0,0,0,511.86,423Z" />
                                </g>
                            </g>
                        </svg>
                        <span>预览</span>
                    </div>
                    <div class="no-preview-btn btn text-btn" v-show="isPreviewMode"
                        @click="togglePreview">
                        <svg width="18" height="18" viewBox="0 0 938.9 853.33" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M319.81,426.46a151.18,151.18,0,0,1,16.08-66c2-4,1.27-6-1.58-8.83Q195.64,213.14,57.09,74.52C43.52,61,39.11,45,46,27,57-1.64,93.59-9.17,115.75,12.55c21.54,21.11,42.72,42.6,64,63.92Q529.44,426.11,879.11,775.7c8.32,8.32,15.21,17.13,16.71,29.27,2.19,17.64-6,34.28-21.4,42.89a42.35,42.35,0,0,1-47.74-4.18,95.92,95.92,0,0,1-7.26-6.86Q682.07,699.49,544.8,562.06c-3.12-3.12-5.27-3.51-9.26-1.54-89.48,44.16-196.46-10.49-213-108.77C321.13,443.41,320.69,434.9,319.81,426.46Zm86.16-2.2c-2.58,42.1,37.43,70.21,65.57,65.6Z" />
                                    <path
                                        d="M97.46,427.43c19.14,19.57,37.41,39.23,56.74,57.78,42.71,41,89.21,77.08,141.33,105.51,39.71,21.67,81.38,37.91,126.24,45.28a295.75,295.75,0,0,0,120-4.94c16.23-4,30.85-1.48,43,10.35,23.76,23,13.28,63-19,71.55A373,373,0,0,1,456,725c-70-2.69-134.63-23.85-195.9-56.51C187.76,630,125,579,68.38,520.18c-19.5-20.26-37.73-41.78-55.84-63.32C-4.3,436.82-4,417,12.25,396.62a895.84,895.84,0,0,1,127.55-130c18.91-15.79,45.41-13.67,60.79,4.65,15.24,18.15,13.06,44.5-5.66,60.33a882.89,882.89,0,0,0-91.32,88.76C101.85,422.33,100.14,424.34,97.46,427.43Z" />
                                    <path
                                        d="M841.72,426.42c-15.13-15.86-29.36-31.52-44.37-46.38-49.87-49.37-104.42-92.55-167.23-124.57C591.74,235.9,551.54,221.77,508.7,216c-37.39-5-74.42-2.71-111.08,6.2-25.31,6.14-48.33-7-54-30.57-5.49-22.67,7.51-45.44,30.11-51.31A375.86,375.86,0,0,1,496,128.93c53.07,3.82,103.38,18.29,151.64,40.3,62.21,28.38,117.58,67.12,168.84,112A893,893,0,0,1,927.93,397.77c10.18,12.82,13.84,26.84,8.59,42.5a46,46,0,0,1-7.38,13.47A868.32,868.32,0,0,1,798,587.84c-18.12,15-44.55,12-59.55-6s-12.26-43.87,5.62-60.08q34.25-31.05,67.64-63C822,448.83,831.2,437.8,841.72,426.42Z" />
                                </g>
                            </g>
                        </svg>
                        <span>取消预览</span>
                    </div>
                    <div class="set-default-btn btn text-btn" v-show="!isPreviewMode" @click="setDefault">
                        <svg width="15" height="15" viewBox="0 0 256 256" data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M1040,669H882c-12.79-4.93-17.16-14.62-17.1-27.83.26-52.77.11-105.55.11-158.32V477c-6,0-11.42-.32-16.84.09-6.54.48-11.66-1.39-15.17-7.08v-7c3.16-5.7,8-7.48,14.44-7.36,18.29.32,36.58.12,54.88.1,1.75,0,3.5-.16,5.48-.25,0-7.76,0-14.91,0-22.05a18.56,18.56,0,0,1,6.6-14.52c2.85-2.39,6.37-4,9.59-5.92h73c13.83,5.64,17.27,10.84,17.25,26.08,0,5.41,0,10.82,0,16.68h7.53c17.61,0,35.21.2,52.81-.12,6.43-.12,11.27,1.63,14.41,7.36v7c-3.5,5.7-8.63,7.56-15.17,7.08-5.41-.4-10.89-.09-16.84-.09v6.36c0,52.6-.15,105.2.11,157.8C1057.17,654.36,1052.81,664.08,1040,669ZM886.24,477.29V640.4c0,8.44-.49,7.34,7.11,7.35q67.95,0,135.9,0c6.51,0,6.52,0,6.52-6.43v-164Zm106.5-42.78H929.37v21h63.37Z"
                                transform="translate(-833 -413)" />
                            <path
                                d="M950.29,562.2c0-13.47,0-26.94,0-40.41,0-7.94,4.25-12.84,10.82-12.77,6.36.07,10.59,5,10.6,12.52,0,27.28,0,54.55,0,81.83,0,5.13-1.71,9.17-6.5,11.36-7.39,3.36-14.87-2.16-14.94-11.11-.11-13.81,0-27.61,0-41.42Z"
                                transform="translate(-833 -413)" />
                            <path
                                d="M1014.25,562.63c0,13.48,0,27,0,40.42,0,7.88-4.3,12.82-10.87,12.64-6.29-.18-10.35-5.13-10.36-12.75q0-41.16,0-82.33c0-5.91,3-9.91,8-11.26a10.29,10.29,0,0,1,11.85,5.16,16.06,16.06,0,0,1,1.33,6.71c.12,13.8.06,27.61.06,41.41Z"
                                transform="translate(-833 -413)" />
                            <path
                                d="M929,562.53q0,21,0,41.92c0,4.8-2.09,8.39-6.49,10.29-4.21,1.81-8.49,1.25-11.43-2.23a13.57,13.57,0,0,1-3.17-8c-.23-28.1-.19-56.21-.12-84.32,0-6.74,4.63-11.34,10.74-11.19s10.41,4.78,10.44,11.59C929.05,534.59,929,548.56,929,562.53Z"
                                transform="translate(-833 -413)" />
                        </svg>
                        <span>默认</span>
                    </div>
                    <div class="clear-btn btn text-btn" v-show="!isPreviewMode" @click="resetData">
                        <svg width="15" height="15" viewBox="0 0 256 256" data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M1040,669H882c-12.79-4.93-17.16-14.62-17.1-27.83.26-52.77.11-105.55.11-158.32V477c-6,0-11.42-.32-16.84.09-6.54.48-11.66-1.39-15.17-7.08v-7c3.16-5.7,8-7.48,14.44-7.36,18.29.32,36.58.12,54.88.1,1.75,0,3.5-.16,5.48-.25,0-7.76,0-14.91,0-22.05a18.56,18.56,0,0,1,6.6-14.52c2.85-2.39,6.37-4,9.59-5.92h73c13.83,5.64,17.27,10.84,17.25,26.08,0,5.41,0,10.82,0,16.68h7.53c17.61,0,35.21.2,52.81-.12,6.43-.12,11.27,1.63,14.41,7.36v7c-3.5,5.7-8.63,7.56-15.17,7.08-5.41-.4-10.89-.09-16.84-.09v6.36c0,52.6-.15,105.2.11,157.8C1057.17,654.36,1052.81,664.08,1040,669ZM886.24,477.29V640.4c0,8.44-.49,7.34,7.11,7.35q67.95,0,135.9,0c6.51,0,6.52,0,6.52-6.43v-164Zm106.5-42.78H929.37v21h63.37Z"
                                transform="translate(-833 -413)" />
                            <path
                                d="M950.29,562.2c0-13.47,0-26.94,0-40.41,0-7.94,4.25-12.84,10.82-12.77,6.36.07,10.59,5,10.6,12.52,0,27.28,0,54.55,0,81.83,0,5.13-1.71,9.17-6.5,11.36-7.39,3.36-14.87-2.16-14.94-11.11-.11-13.81,0-27.61,0-41.42Z"
                                transform="translate(-833 -413)" />
                            <path
                                d="M1014.25,562.63c0,13.48,0,27,0,40.42,0,7.88-4.3,12.82-10.87,12.64-6.29-.18-10.35-5.13-10.36-12.75q0-41.16,0-82.33c0-5.91,3-9.91,8-11.26a10.29,10.29,0,0,1,11.85,5.16,16.06,16.06,0,0,1,1.33,6.71c.12,13.8.06,27.61.06,41.41Z"
                                transform="translate(-833 -413)" />
                            <path
                                d="M929,562.53q0,21,0,41.92c0,4.8-2.09,8.39-6.49,10.29-4.21,1.81-8.49,1.25-11.43-2.23a13.57,13.57,0,0,1-3.17-8c-.23-28.1-.19-56.21-.12-84.32,0-6.74,4.63-11.34,10.74-11.19s10.41,4.78,10.44,11.59C929.05,534.59,929,548.56,929,562.53Z"
                                transform="translate(-833 -413)" />
                        </svg>
                        <span>重置</span>
                    </div>
                    <div class="save-btn btn text-btn" v-show="!isPreviewMode" @click="saveData">
                        <svg width="15" height="15" viewBox="0 0 853.61 853.59" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M426.39,853.55h-199c-32.66,0-65.33.12-98,0C69.66,853.23,19.5,815.14,4.57,758.06A138.7,138.7,0,0,1,.21,723.51Q-.18,426.78.06,130.05c0-64,42.59-115.66,105-127.71A135.26,135.26,0,0,1,130.43.14q232-.19,464-.14c13.93,0,25.46,4.72,35.34,14.64Q733.72,118.89,838,222.83c10.58,10.53,15.62,22.58,15.61,37.48-.13,154,.12,308-.2,462-.1,53.18-24.09,92.8-71.21,117.81-18.61,9.87-38.86,13.47-59.83,13.47Q574.38,853.52,426.39,853.55Zm-170-640h6.94q143.49,0,287,0c3,0,6,0,9,.23,22.36,1.7,40.48,23.55,38,45.78-2.61,23.46-20.15,39.22-43.88,39.22q-168.49,0-337,0c-27.74,0-45.64-17.9-45.64-45.63q0-80.73,0-161.48V85.85c-16.65,0-32.66-.59-48.59.31-6,.33-12.33,3.23-17.49,6.55-13.7,8.82-19.26,22-19.25,38.28q.18,295.72.08,591.45c0,1.67,0,3.33.06,5,.74,18.92,14,35.43,32.57,39.27,7.24,1.5,14.89,1.14,22.36,1.29,9.94.19,19.88,0,30.26,0v-6.49q0-144.49,0-289c0-28,17.85-45.78,46-45.78h420c28.4,0,46,17.71,46,46.22V768c13.88,0,27,0,40.19,0,27.25,0,45-17.78,45-45q0-222.22.08-444.46a10.66,10.66,0,0,0-3.39-8.3q-90.8-90.57-181.37-181.34A10.63,10.63,0,0,0,575,85.48q-156.49.12-313,.07h-5.71Zm340.86,554.3V512.5H256.41V767.85Z" />
                                </g>
                            </g>
                        </svg>
                        <span>保存</span>
                    </div>
                    <div class="close-btn btn" @click="hideCustomWindowCtlBtnView"
                        v-show="useWindowsStyleWinCtl && !isPreviewMode">
                        <svg width="13" height="13" viewBox="0 0 593.14 593.11" data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z"
                                transform="translate(-663.4 -243.46)" />
                        </svg>
                    </div>
                </div>
            </div>
            <div class="center">
                <div class="left">
                    <div v-for="(item, index) in ['亮色', '暗色', '其他']"  
                        class="nav-item" 
                        :class="{ active: activeTabIndex == index }" 
                        @click="() => setActiveTab(index)">
                        <div class="text" v-html="item"></div>
                    </div>
                </div>
                <div class="content" v-show="activeTabIndex == 0">
                    <div class="row first">
                        <div class="tip-text">背景色：</div>
                        <div class="action to-right">
                            <div class="checkbox text-btn" @click="toggleOption('lightBgSyncToDark')">
                                <svg v-show="!options.lightBgSyncToDark" width="16" height="16" viewBox="0 0 731.64 731.66"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <g id="Layer_2" data-name="Layer 2">
                                        <g id="Layer_1-2" data-name="Layer 1">
                                            <path
                                                d="M365.63,731.65q-120.24,0-240.47,0c-54.2,0-99.43-30.93-117.6-80.11A124.59,124.59,0,0,1,0,608q0-242.21,0-484.42C.11,60.68,43.7,10.45,105.88,1.23A128.67,128.67,0,0,1,124.81.06q241-.09,481.93,0c61.43,0,110.72,39.85,122.49,99.08a131.72,131.72,0,0,1,2.3,25.32q.19,241.47.07,482.93c0,60.87-40.25,110.36-99.18,121.9a142.56,142.56,0,0,1-26.83,2.29Q485.61,731.81,365.63,731.65ZM48.85,365.45q0,121.76,0,243.5c0,41.57,32.38,73.82,73.95,73.83q243,.06,486,0c41.57,0,73.93-32.24,73.95-73.84q.11-243.24,0-486.49c0-41.3-32.45-73.55-73.7-73.57q-243.24-.06-486.49,0a74.33,74.33,0,0,0-14.89,1.42c-34.77,7.2-58.77,36.58-58.8,72.1Q48.76,244,48.85,365.45Z" />
                                        </g>
                                    </g>
                                </svg>
                                <svg v-show="options.lightBgSyncToDark" class="checked-svg" width="16" height="16"
                                    viewBox="0 0 767.89 767.94" xmlns="http://www.w3.org/2000/svg">
                                    <g id="Layer_2" data-name="Layer 2">
                                        <g id="Layer_1-2" data-name="Layer 1">
                                            <path
                                                d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                                        </g>
                                    </g>
                                </svg>
                                <span>同步至暗色</span>
                            </div>
                            <div class="checkbox text-btn" v-show="false" @click="toggleOption('lightBgForAll')">
                                <svg v-show="!options.lightBgForAll" width="16" height="16" viewBox="0 0 731.64 731.66"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <g id="Layer_2" data-name="Layer 2">
                                        <g id="Layer_1-2" data-name="Layer 1">
                                            <path
                                                d="M365.63,731.65q-120.24,0-240.47,0c-54.2,0-99.43-30.93-117.6-80.11A124.59,124.59,0,0,1,0,608q0-242.21,0-484.42C.11,60.68,43.7,10.45,105.88,1.23A128.67,128.67,0,0,1,124.81.06q241-.09,481.93,0c61.43,0,110.72,39.85,122.49,99.08a131.72,131.72,0,0,1,2.3,25.32q.19,241.47.07,482.93c0,60.87-40.25,110.36-99.18,121.9a142.56,142.56,0,0,1-26.83,2.29Q485.61,731.81,365.63,731.65ZM48.85,365.45q0,121.76,0,243.5c0,41.57,32.38,73.82,73.95,73.83q243,.06,486,0c41.57,0,73.93-32.24,73.95-73.84q.11-243.24,0-486.49c0-41.3-32.45-73.55-73.7-73.57q-243.24-.06-486.49,0a74.33,74.33,0,0,0-14.89,1.42c-34.77,7.2-58.77,36.58-58.8,72.1Q48.76,244,48.85,365.45Z" />
                                        </g>
                                    </g>
                                </svg>
                                <svg v-show="options.lightBgForAll" class="checked-svg" width="16" height="16"
                                    viewBox="0 0 767.89 767.94" xmlns="http://www.w3.org/2000/svg">
                                    <g id="Layer_2" data-name="Layer 2">
                                        <g id="Layer_1-2" data-name="Layer 1">
                                            <path
                                                d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                                        </g>
                                    </g>
                                </svg>
                                <span>统一设置</span>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="cate-name">关闭按钮：</div>
                        <div class="row-content">
                            <div class="item" @keydown.stop="">
                                <ColorInputControl label="亮色 - 关闭按钮 - 背景色" 
                                    :value="customData.light.bg.closeBtn" 
                                    :colorMode="true"
                                    :onChanged="(value) => setLightItem('bg', 'closeBtn', value)">
                                </ColorInputControl>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="cate-name">最小化按钮：</div>
                        <div class="row-content">
                            <div class="item" @keydown.stop="">
                                <ColorInputControl label="亮色 - 最小化按钮 - 背景色" 
                                    :value="customData.light.bg.minBtn" 
                                    :colorMode="true"
                                    :onChanged="(value) => setLightItem('bg', 'minBtn', value)">
                                </ColorInputControl>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="cate-name">最大化按钮：</div>
                        <div class="row-content">
                            <div class="item" @keydown.stop="">
                                <ColorInputControl label="亮色 - 最大化按钮 - 背景色" 
                                    :value="customData.light.bg.maxBtn" 
                                    :colorMode="true"
                                    :onChanged="(value) => setLightItem('bg', 'maxBtn', value)">
                                </ColorInputControl>
                            </div>
                        </div>
                    </div>
                     <div class="row first">
                        <div class="tip-text">图标颜色：</div>
                        <div class="action to-right">
                            <div class="checkbox text-btn" @click="toggleOption('lightBtnColorSyncToDark')">
                                <svg v-show="!options.lightBtnColorSyncToDark" width="16" height="16" viewBox="0 0 731.64 731.66"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <g id="Layer_2" data-name="Layer 2">
                                        <g id="Layer_1-2" data-name="Layer 1">
                                            <path
                                                d="M365.63,731.65q-120.24,0-240.47,0c-54.2,0-99.43-30.93-117.6-80.11A124.59,124.59,0,0,1,0,608q0-242.21,0-484.42C.11,60.68,43.7,10.45,105.88,1.23A128.67,128.67,0,0,1,124.81.06q241-.09,481.93,0c61.43,0,110.72,39.85,122.49,99.08a131.72,131.72,0,0,1,2.3,25.32q.19,241.47.07,482.93c0,60.87-40.25,110.36-99.18,121.9a142.56,142.56,0,0,1-26.83,2.29Q485.61,731.81,365.63,731.65ZM48.85,365.45q0,121.76,0,243.5c0,41.57,32.38,73.82,73.95,73.83q243,.06,486,0c41.57,0,73.93-32.24,73.95-73.84q.11-243.24,0-486.49c0-41.3-32.45-73.55-73.7-73.57q-243.24-.06-486.49,0a74.33,74.33,0,0,0-14.89,1.42c-34.77,7.2-58.77,36.58-58.8,72.1Q48.76,244,48.85,365.45Z" />
                                        </g>
                                    </g>
                                </svg>
                                <svg v-show="options.lightBtnColorSyncToDark" class="checked-svg" width="16" height="16"
                                    viewBox="0 0 767.89 767.94" xmlns="http://www.w3.org/2000/svg">
                                    <g id="Layer_2" data-name="Layer 2">
                                        <g id="Layer_1-2" data-name="Layer 1">
                                            <path
                                                d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                                        </g>
                                    </g>
                                </svg>
                                <span>同步至暗色</span>
                            </div>
                            <div class="checkbox text-btn" v-show="false" @click="toggleOption('lightBtnColorForAll')">
                                <svg v-show="!options.lightBtnColorForAll" width="16" height="16" viewBox="0 0 731.64 731.66"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <g id="Layer_2" data-name="Layer 2">
                                        <g id="Layer_1-2" data-name="Layer 1">
                                            <path
                                                d="M365.63,731.65q-120.24,0-240.47,0c-54.2,0-99.43-30.93-117.6-80.11A124.59,124.59,0,0,1,0,608q0-242.21,0-484.42C.11,60.68,43.7,10.45,105.88,1.23A128.67,128.67,0,0,1,124.81.06q241-.09,481.93,0c61.43,0,110.72,39.85,122.49,99.08a131.72,131.72,0,0,1,2.3,25.32q.19,241.47.07,482.93c0,60.87-40.25,110.36-99.18,121.9a142.56,142.56,0,0,1-26.83,2.29Q485.61,731.81,365.63,731.65ZM48.85,365.45q0,121.76,0,243.5c0,41.57,32.38,73.82,73.95,73.83q243,.06,486,0c41.57,0,73.93-32.24,73.95-73.84q.11-243.24,0-486.49c0-41.3-32.45-73.55-73.7-73.57q-243.24-.06-486.49,0a74.33,74.33,0,0,0-14.89,1.42c-34.77,7.2-58.77,36.58-58.8,72.1Q48.76,244,48.85,365.45Z" />
                                        </g>
                                    </g>
                                </svg>
                                <svg v-show="options.lightBtnColorForAll" class="checked-svg" width="16" height="16"
                                    viewBox="0 0 767.89 767.94" xmlns="http://www.w3.org/2000/svg">
                                    <g id="Layer_2" data-name="Layer 2">
                                        <g id="Layer_1-2" data-name="Layer 1">
                                            <path
                                                d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                                        </g>
                                    </g>
                                </svg>
                                <span>统一设置</span>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="cate-name">关闭按钮：</div>
                        <div class="row-content">
                            <div class="item" @keydown.stop="">
                                <ColorInputControl label="亮色 - 关闭按钮 - 图标颜色" 
                                    :value="customData.light.btnColor.closeBtn" 
                                    :colorMode="true"
                                    :onChanged="(value) => setLightItem('btnColor', 'closeBtn', value)">
                                </ColorInputControl>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="cate-name">最小化按钮：</div>
                        <div class="row-content">
                            <div class="item" @keydown.stop="">
                                <ColorInputControl label="亮色 - 最小化按钮 - 图标颜色" 
                                    :value="customData.light.btnColor.minBtn" 
                                    :colorMode="true"
                                    :onChanged="(value) => setLightItem('btnColor', 'minBtn', value)">
                                </ColorInputControl>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="cate-name">最大化按钮：</div>
                        <div class="row-content">
                            <div class="item" @keydown.stop="">
                                <ColorInputControl label="亮色 - 最大化按钮 - 图标颜色" 
                                    :value="customData.light.btnColor.maxBtn" 
                                    :colorMode="true"
                                    :onChanged="(value) => setLightItem('btnColor', 'maxBtn', value)">
                                </ColorInputControl>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="content" v-show="activeTabIndex == 1">
                    <div class="row first">
                        <div class="tip-text">背景色：</div>
                         <div class="action to-right">
                            <div class="checkbox text-btn" @click="toggleOption('darkBgSyncToLight')">
                                <svg v-show="!options.darkBgSyncToLight" width="16" height="16" viewBox="0 0 731.64 731.66"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <g id="Layer_2" data-name="Layer 2">
                                        <g id="Layer_1-2" data-name="Layer 1">
                                            <path
                                                d="M365.63,731.65q-120.24,0-240.47,0c-54.2,0-99.43-30.93-117.6-80.11A124.59,124.59,0,0,1,0,608q0-242.21,0-484.42C.11,60.68,43.7,10.45,105.88,1.23A128.67,128.67,0,0,1,124.81.06q241-.09,481.93,0c61.43,0,110.72,39.85,122.49,99.08a131.72,131.72,0,0,1,2.3,25.32q.19,241.47.07,482.93c0,60.87-40.25,110.36-99.18,121.9a142.56,142.56,0,0,1-26.83,2.29Q485.61,731.81,365.63,731.65ZM48.85,365.45q0,121.76,0,243.5c0,41.57,32.38,73.82,73.95,73.83q243,.06,486,0c41.57,0,73.93-32.24,73.95-73.84q.11-243.24,0-486.49c0-41.3-32.45-73.55-73.7-73.57q-243.24-.06-486.49,0a74.33,74.33,0,0,0-14.89,1.42c-34.77,7.2-58.77,36.58-58.8,72.1Q48.76,244,48.85,365.45Z" />
                                        </g>
                                    </g>
                                </svg>
                                <svg v-show="options.darkBgSyncToLight" class="checked-svg" width="16" height="16"
                                    viewBox="0 0 767.89 767.94" xmlns="http://www.w3.org/2000/svg">
                                    <g id="Layer_2" data-name="Layer 2">
                                        <g id="Layer_1-2" data-name="Layer 1">
                                            <path
                                                d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                                        </g>
                                    </g>
                                </svg>
                                <span>同步至亮色</span>
                            </div>
                            <div class="checkbox text-btn" v-show="false" @click="toggleOption('darkBgForAll')">
                                <svg v-show="!options.darkBgForAll" width="16" height="16" viewBox="0 0 731.64 731.66"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <g id="Layer_2" data-name="Layer 2">
                                        <g id="Layer_1-2" data-name="Layer 1">
                                            <path
                                                d="M365.63,731.65q-120.24,0-240.47,0c-54.2,0-99.43-30.93-117.6-80.11A124.59,124.59,0,0,1,0,608q0-242.21,0-484.42C.11,60.68,43.7,10.45,105.88,1.23A128.67,128.67,0,0,1,124.81.06q241-.09,481.93,0c61.43,0,110.72,39.85,122.49,99.08a131.72,131.72,0,0,1,2.3,25.32q.19,241.47.07,482.93c0,60.87-40.25,110.36-99.18,121.9a142.56,142.56,0,0,1-26.83,2.29Q485.61,731.81,365.63,731.65ZM48.85,365.45q0,121.76,0,243.5c0,41.57,32.38,73.82,73.95,73.83q243,.06,486,0c41.57,0,73.93-32.24,73.95-73.84q.11-243.24,0-486.49c0-41.3-32.45-73.55-73.7-73.57q-243.24-.06-486.49,0a74.33,74.33,0,0,0-14.89,1.42c-34.77,7.2-58.77,36.58-58.8,72.1Q48.76,244,48.85,365.45Z" />
                                        </g>
                                    </g>
                                </svg>
                                <svg v-show="options.darkBgForAll" class="checked-svg" width="16" height="16"
                                    viewBox="0 0 767.89 767.94" xmlns="http://www.w3.org/2000/svg">
                                    <g id="Layer_2" data-name="Layer 2">
                                        <g id="Layer_1-2" data-name="Layer 1">
                                            <path
                                                d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                                        </g>
                                    </g>
                                </svg>
                                <span>统一设置</span>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="cate-name">关闭按钮：</div>
                        <div class="row-content">
                            <div class="item" @keydown.stop="">
                                <ColorInputControl label="暗色 - 关闭按钮 - 背景色" 
                                    :value="customData.dark.bg.closeBtn" 
                                    :colorMode="true"
                                    :onChanged="(value) => setDarkItem('bg', 'closeBtn', value)">
                                </ColorInputControl>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="cate-name">最小化按钮：</div>
                        <div class="row-content">
                            <div class="item" @keydown.stop="">
                                <ColorInputControl label="暗色 - 最小化按钮 - 背景色" 
                                    :value="customData.dark.bg.minBtn" 
                                    :colorMode="true"
                                    :onChanged="(value) => setDarkItem('bg', 'minBtn', value)">
                                </ColorInputControl>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="cate-name">最大化按钮：</div>
                        <div class="row-content">
                            <div class="item" @keydown.stop="">
                                <ColorInputControl label="暗色 - 最大化按钮 - 背景色" 
                                    :value="customData.dark.bg.maxBtn" 
                                    :colorMode="true"
                                    :onChanged="(value) => setDarkItem('bg', 'maxBtn', value)">
                                </ColorInputControl>
                            </div>
                        </div>
                    </div>
                    <div class="row first">
                        <div class="tip-text">图标颜色：</div>
                         <div class="action to-right">
                            <div class="checkbox text-btn" @click="toggleOption('darkBtnColorSyncToLight')">
                                <svg v-show="!options.darkBtnColorSyncToLight" width="16" height="16" viewBox="0 0 731.64 731.66"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <g id="Layer_2" data-name="Layer 2">
                                        <g id="Layer_1-2" data-name="Layer 1">
                                            <path
                                                d="M365.63,731.65q-120.24,0-240.47,0c-54.2,0-99.43-30.93-117.6-80.11A124.59,124.59,0,0,1,0,608q0-242.21,0-484.42C.11,60.68,43.7,10.45,105.88,1.23A128.67,128.67,0,0,1,124.81.06q241-.09,481.93,0c61.43,0,110.72,39.85,122.49,99.08a131.72,131.72,0,0,1,2.3,25.32q.19,241.47.07,482.93c0,60.87-40.25,110.36-99.18,121.9a142.56,142.56,0,0,1-26.83,2.29Q485.61,731.81,365.63,731.65ZM48.85,365.45q0,121.76,0,243.5c0,41.57,32.38,73.82,73.95,73.83q243,.06,486,0c41.57,0,73.93-32.24,73.95-73.84q.11-243.24,0-486.49c0-41.3-32.45-73.55-73.7-73.57q-243.24-.06-486.49,0a74.33,74.33,0,0,0-14.89,1.42c-34.77,7.2-58.77,36.58-58.8,72.1Q48.76,244,48.85,365.45Z" />
                                        </g>
                                    </g>
                                </svg>
                                <svg v-show="options.darkBtnColorSyncToLight" class="checked-svg" width="16" height="16"
                                    viewBox="0 0 767.89 767.94" xmlns="http://www.w3.org/2000/svg">
                                    <g id="Layer_2" data-name="Layer 2">
                                        <g id="Layer_1-2" data-name="Layer 1">
                                            <path
                                                d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                                        </g>
                                    </g>
                                </svg>
                                <span>同步至亮色</span>
                            </div>
                            <div class="checkbox text-btn" v-show="false" @click="toggleOption('darkBtnColorForAll')">
                                <svg v-show="!options.darkBtnColorForAll" width="16" height="16" viewBox="0 0 731.64 731.66"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <g id="Layer_2" data-name="Layer 2">
                                        <g id="Layer_1-2" data-name="Layer 1">
                                            <path
                                                d="M365.63,731.65q-120.24,0-240.47,0c-54.2,0-99.43-30.93-117.6-80.11A124.59,124.59,0,0,1,0,608q0-242.21,0-484.42C.11,60.68,43.7,10.45,105.88,1.23A128.67,128.67,0,0,1,124.81.06q241-.09,481.93,0c61.43,0,110.72,39.85,122.49,99.08a131.72,131.72,0,0,1,2.3,25.32q.19,241.47.07,482.93c0,60.87-40.25,110.36-99.18,121.9a142.56,142.56,0,0,1-26.83,2.29Q485.61,731.81,365.63,731.65ZM48.85,365.45q0,121.76,0,243.5c0,41.57,32.38,73.82,73.95,73.83q243,.06,486,0c41.57,0,73.93-32.24,73.95-73.84q.11-243.24,0-486.49c0-41.3-32.45-73.55-73.7-73.57q-243.24-.06-486.49,0a74.33,74.33,0,0,0-14.89,1.42c-34.77,7.2-58.77,36.58-58.8,72.1Q48.76,244,48.85,365.45Z" />
                                        </g>
                                    </g>
                                </svg>
                                <svg v-show="options.darkBtnColorForAll" class="checked-svg" width="16" height="16"
                                    viewBox="0 0 767.89 767.94" xmlns="http://www.w3.org/2000/svg">
                                    <g id="Layer_2" data-name="Layer 2">
                                        <g id="Layer_1-2" data-name="Layer 1">
                                            <path
                                                d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                                        </g>
                                    </g>
                                </svg>
                                <span>统一设置</span>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="cate-name">关闭按钮：</div>
                        <div class="row-content">
                            <div class="item" @keydown.stop="">
                                <ColorInputControl label="暗色 - 关闭按钮 - 图标颜色" 
                                    :value="customData.dark.btnColor.closeBtn" 
                                    :colorMode="true"
                                    :onChanged="(value) => setDarkItem('btnColor', 'closeBtn', value)">
                                </ColorInputControl>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="cate-name">最小化按钮：</div>
                        <div class="row-content">
                            <div class="item" @keydown.stop="">
                                <ColorInputControl label="暗色 - 最小化按钮 - 图标颜色" 
                                    :value="customData.dark.btnColor.minBtn" 
                                    :colorMode="true"
                                    :onChanged="(value) => setDarkItem('btnColor', 'minBtn', value)">
                                </ColorInputControl>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="cate-name">最大化按钮：</div>
                        <div class="row-content">
                            <div class="item" @keydown.stop="">
                                <ColorInputControl label="暗色 - 最大化按钮 - 图标颜色" 
                                    :value="customData.dark.btnColor.maxBtn" 
                                    :colorMode="true"
                                    :onChanged="(value) => setDarkItem('btnColor', 'maxBtn', value)">
                                </ColorInputControl>
                            </div>
                        </div>
                    </div>
                </div>
                 <div class="content" v-show="activeTabIndex == 2">
                    <div class="row first">
                         <div class="tip-text">图标风格：</div>
                    </div>
                    <div class="row">
                        <div class="cate-name">最大化按钮：</div>
                        <div class="row-content">
                            <SingleSelectionControl :data="['默认', '方框']" 
                                :value="customData.extra.iconType" 
                                :onChanged="(value) => setExtraItem('iconType', value)">
                            </SingleSelectionControl>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
.custom-window-ctl-btn-view {
    display: flex;
    /*flex-direction: column;*/
    overflow: hidden;
    -webkit-app-region: none;
    --header-height: var(--content-header-nav-height);
}

.custom-window-ctl-btn-view .container {
    display: flex;
    flex: 1;
    flex-direction: column;
    background: var(--content-bg-color);
    background: var(--content-bg-color-no-transparent);
}

.custom-window-ctl-btn-view.preview-mode  {
    height: var(--header-height) !important;
}

.custom-window-ctl-btn-view.preview-mode  .header .no-preview-btn {
    margin-right: 10px;
}

.custom-window-ctl-btn-view.preview-mode  .header {
    border-bottom: 1px solid transparent !important;
}

.custom-window-ctl-btn-view.preview-mode .header .title-wrap {
    margin-left: 20px !important;
}

.custom-window-ctl-btn-view .spacing {
    margin-left: 15px;
}

.custom-window-ctl-btn-view .spacing1 {
    margin-left: 50px;
}

.custom-window-ctl-btn-view .header,
.custom-window-ctl-btn-view .center,
.custom-window-ctl-btn-view .header .title-wrap  {
    display: flex;
    flex-direction: row;
}

.custom-window-ctl-btn-view .header {
    padding: 0px 15px 0px 3px;
    height: var(--header-height);
    display: flex;
    justify-content: center;
    align-items: center;
    border-bottom: 2px solid var(--border-header-nav-border-color);
}

.custom-window-ctl-btn-view .header .action {
    display: flex;
}

.custom-window-ctl-btn-view .header .action .close-btn {
    width: 30px;
}

.custom-window-ctl-btn-view .header .title-wrap {
    margin-left: 6px;
    flex: 1;
    display: flex;
}

.custom-window-ctl-btn-view .header .title {
    font-size: calc(var(--content-text-size) + 1px);
}

.custom-window-ctl-btn-view .header #toggle-ctl {
    cursor: default;
    -webkit-app-region: none;
}

.custom-window-ctl-btn-view .text-btn {
    text-align: left;
    font-size: var(--content-text-tip-text-size);
    display: flex;
    align-items: center;
    justify-items: center;
    margin-left: 33px;
    cursor: pointer;
}

.custom-window-ctl-btn-view .center {
    flex: 1;
    overflow: hidden;
    background: transparent;
}

.custom-window-ctl-btn-view .center .left {
    width: 88px;
    background: var(--content-header-nav-bg-color);
    border-right: 2px solid var(--border-color);
}

.custom-window-ctl-btn-view .center .left .nav-item {
    padding: 55px 0px;
    cursor: pointer;
}

.custom-window-ctl-btn-view .center .left .active {
    background: var(--content-list-item-hl-bg-color) !important;
    color: var(--content-list-item-hl-text-color) !important;
    font-weight: bold;
}

.custom-window-ctl-btn-view .center .left .nav-item:hover {
    background: var(--content-list-item-hover-bg-color);
}

.custom-window-ctl-btn-view .center .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-content: flex-start;
    overflow: scroll;
    overflow-x: hidden;
    padding-bottom: 36px;
    padding-left: 36px;
    padding-right: 36px;
}

.custom-window-ctl-btn-view .center .content .row.first {
    margin-top: 25px;
    margin-bottom: 15px;
    flex-direction: column;
    position: relative;
}

.custom-window-ctl-btn-view .center .content .row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    margin-bottom: 25px;
}

.custom-window-ctl-btn-view .center .content .row.last {
    margin-bottom: 50px;
    border: 1px solid transparent;
}

.custom-window-ctl-btn-view .center .content .action {
    display: flex;
}

.custom-window-ctl-btn-view .center .content .to-right {
    position: absolute;
    right: 0px;
}

.custom-window-ctl-btn-view .center .content .row .color-input-ctl {
    width: 300px;
}

.custom-window-ctl-btn-view .center .content .row .cate-name {
    font-size: var(--content-text-tab-title-size);
    width: 138px;
    text-align: left;
    margin-right: 10px;
    margin-top: 3px;
}

.custom-window-ctl-btn-view .center .content .row-content {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
    flex: 1;
}

.custom-window-ctl-btn-view .center .content .row-content > .item {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    text-align: left;
    flex: 1;
}

.custom-window-ctl-btn-view .center .content .row-content .single-selection-ctl {
    justify-content: flex-start;
    min-width: max-content;
}

.custom-window-ctl-btn-view .center .content .row-content .single-selection-ctl .item {
    font-size: 15px;
    padding: 6px 18px;
}
</style>