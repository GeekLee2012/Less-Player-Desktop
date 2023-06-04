<script setup>
import { reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { useThemeStore } from '../store/themeStore';
import { useSettingStore } from '../store/settingStore';
import ToggleControl from '../components/ToggleControl.vue';
import ColorInputControl from '../components/ColorInputControl.vue';
import EventBus from '../../common/EventBus';
import { useIpcRenderer } from '../../common/Utils';
import { Theme } from '../../common/Theme';



const ipcRenderer = useIpcRenderer()
const { workingCustomTheme } = storeToRefs(useAppCommonStore())
const { hideCustomThemeEditView, showToast } = useAppCommonStore()
const { saveCustomTheme } = useThemeStore()
const { isCurrentTheme } = useSettingStore()

const blankTheme = new Theme()
const customTheme = reactive(blankTheme)

//预览主题
const isPreviewMode = ref(false)
const setPreviewMode = (value) => isPreviewMode.value = value
const toggleCustomThemePreview = () => {
    setPreviewMode(!isPreviewMode.value)
    const theme = isPreviewMode.value ? customTheme : null
    EventBus.emit('theme-applyTheme', theme)
}

//TODO 使用本地文件图片，存在迁移共享问题
const uploadImage = async () => {
    if (!ipcRenderer) return
    const result = await ipcRenderer.invoke('open-image')
    if (result && result.length > 0) setupAppBgImage(result[0])
}

const isFormInvalid = ref(false)
const setFormInvalid = (value) => isFormInvalid.value = value
//保存主题
const saveTheme = () => {
    const themeName = (customTheme.name || '').trim()
    setFormInvalid(themeName.length < 1)
    if (isFormInvalid.value) return

    const theme = JSON.parse(JSON.stringify(customTheme))
    saveCustomTheme(theme)
    showToast('主题保存成功！')
    hideCustomThemeEditView()
    if (isCurrentTheme(theme)) EventBus.emit('theme-applyTheme')
}

//主题另存为
const saveThemeAs = () => {
    const themeName = (customTheme.name || '').trim()
    setFormInvalid(themeName.length < 1)
    if (isFormInvalid.value) return

    const theme = JSON.parse(JSON.stringify(customTheme))
    theme.id = null
    saveCustomTheme(theme)
    showToast('主题另存为操作成功！')
    hideCustomThemeEditView()
}

const resetTheme = (event) => {
    const isUserAction = event ? true : false
    const copiedTheme = JSON.parse(JSON.stringify(workingCustomTheme.value || new Theme()))
    const theme = copiedTheme
    Object.keys(customTheme).forEach(key => Reflect.deleteProperty(customTheme, key))
    Object.assign(customTheme, { ...theme }) //注意，此处Object.assign()有坑
    if (isUserAction) showToast('主题重置成功！')
}

//TODO 主题相关设置，写得太繁琐
const setupThemeName = (event) => {
    const { target } = event
    const name = (target.value || '').trim()
    Object.assign(customTheme, { name })
    setFormInvalid(name.length < 1)
}
const setupAppBackground = (value) => Object.assign(customTheme.appBackground, { bgColor: value })
const setupAppBgImage = (value) => Object.assign(customTheme.appBackground, { bgImage: value })
const setupAppBgImageGradient = (value) => Object.assign(customTheme.appBackground, { bgImageGradient: value })

const toggleAppBgScopePlayingView = () => Object.assign(customTheme.appBackgroundScope, { playingView: !customTheme.appBackgroundScope.playingView })
const toggleAppBgScopePlaybackQueue = () => Object.assign(customTheme.appBackgroundScope, { playbackQueue: !customTheme.appBackgroundScope.playbackQueue })
const toggleAppBgScopeCategoryView = () => Object.assign(customTheme.appBackgroundScope, { categoryView: !customTheme.appBackgroundScope.categoryView })
const toggleAppBgScopeContextMenu = () => Object.assign(customTheme.appBackgroundScope, { contextMenu: !customTheme.appBackgroundScope.contextMenu })
const toggleAppBgScopeToast = () => Object.assign(customTheme.appBackgroundScope, { toast: !customTheme.appBackgroundScope.toast })
const toggleAppBgScopeSoundEffectView = () => Object.assign(customTheme.appBackgroundScope, { soundEffectView: !customTheme.appBackgroundScope.soundEffectView })
const toggleAppBgScopeLyricToolbar = () => Object.assign(customTheme.appBackgroundScope, { lyricToolbar: !customTheme.appBackgroundScope.lyricToolbar })
const toggleAppBgScopeRandomMusicToolbar = () => Object.assign(customTheme.appBackgroundScope, { randomMusicToolbar: !customTheme.appBackgroundScope.randomMusicToolbar })

const setupContentTextColor = (value) => Object.assign(customTheme.content, { textColor: value })
const setupContentSubtitleTextColor = (value) => Object.assign(customTheme.content, { subtitleTextColor: value })
const setupContentSecondaryTextColor = (value) => Object.assign(customTheme.content, { secondaryTextColor: value })
const setupContentBgColor = (value) => Object.assign(customTheme.content, { bgColor: value })
const setupContentTextHighlightColor = (value) => Object.assign(customTheme.content, { textHighlightColor: value })
const setupContentHighlightColor = (value) => Object.assign(customTheme.content, { highlightColor: value })
const setupContentHeaderNavBgColor = (value) => Object.assign(customTheme.content, { headerNavBgColor: value })
const setupContentLoadingMaskColor = (value) => Object.assign(customTheme.content, { loadingMaskColor: value })
const setupContentListItemHoverBgColor = (value) => Object.assign(customTheme.content, { listItemHoverBgColor: value })
const setupContentLeftNavBgColor = (value) => Object.assign(customTheme.content, { leftNavBgColor: value })
const setupContentInputsTextColor = (value) => Object.assign(customTheme.content, { inputsTextColor: value })
const setupContentInputsBgColor = (value) => Object.assign(customTheme.content, { inputsBgColor: value })


const setupBorderColor = (value) => Object.assign(customTheme.border, { borderColor: value })
const setupBorderLeftNavBorderColor = (value) => Object.assign(customTheme.border, { leftNavBorderColor: value })
const setupBorderPopoversBorderColor = (value) => Object.assign(customTheme.border, { popoversBorderColor: value })
const setupBorderInputsBorderColor = (value) => Object.assign(customTheme.border, { inputsBorderColor: value })


const setupButtonIconBtnColor = (value) => Object.assign(customTheme.button, { iconBtnColor: value })
const setupButtonIconBtnHoverColor = (value) => Object.assign(customTheme.button, { iconBtnHoverColor: value })
const setupButtonIconTextBtnTextColor = (value) => Object.assign(customTheme.button, { iconTextBtnTextColor: value })
const setupButtonIconTextBtnIconColor = (value) => Object.assign(customTheme.button, { iconTextBtnIconColor: value })
const setupButtonIconTextBtnBgColor = (value) => Object.assign(customTheme.button, { iconTextBtnBgColor: value })
const setupButtonIconTextBtnHoverBgColor = (value) => Object.assign(customTheme.button, { iconTextBtnHoverBgColor: value })
const setupButtonToggleBtnBgColor = (value) => Object.assign(customTheme.button, { toggleBtnBgColor: value })
const setupButtonToggleBtnThumbColor = (value) => Object.assign(customTheme.button, { toggleBtnThumbColor: value })


const setupSearchBarBorderColor = (value) => Object.assign(customTheme.searchBar, { borderColor: value })
const setupSearchBarBgColor = (value) => Object.assign(customTheme.searchBar, { bgColor: value })
const setupSearchBarTextColor = (value) => Object.assign(customTheme.searchBar, { textColor: value })
const setupSearchBarSearchBtnBgColor = (value) => Object.assign(customTheme.searchBar, { searchBtnBgColor: value })
const setupSearchBarSearchBtnHoverBgColor = (value) => Object.assign(customTheme.searchBar, { searchBtnHoverBgColor: value })
const setupSearchBarSearchBtnIconColor = (value) => Object.assign(customTheme.searchBar, { searchBtnIconColor: value })
const setupSearchBarSearchBtnHoverIconColor = (value) => Object.assign(customTheme.searchBar, { searchBtnHoverIconColor: value })
const setupSearchBarClearBtnIconColor = (value) => Object.assign(customTheme.searchBar, { clearBtnIconColor: value })


const setupAppLogoBgColor = (value) => Object.assign(customTheme.appLogo, { bgColor: value })
const setupAppLogoInnerBgColor = (value) => Object.assign(customTheme.appLogo, { innerBgColor: value })
const setupAppLogoInnerTextColor = (value) => Object.assign(customTheme.appLogo, { innerTextColor: value })
const setupAppLogoAppNameTextColor = (value) => Object.assign(customTheme.appLogo, { appNameTextColor: value })


const setupOthersScrollBarColor = (value) => Object.assign(customTheme.others, { scrollBarColor: value })
const setupOthersProgressBarBgColor = (value) => Object.assign(customTheme.others, { progressBarBgColor: value })
//const setupOthersVolumeBarThumbColor = (value) => Object.assign(customTheme.others, { volumeBarThumbColor: value })
//const setupOthersCheckboxBgColor = (value) => Object.assign(customTheme.others, { checkboxBgColor: value })

watch(workingCustomTheme, (nv, ov) => {
    resetTheme()
    setFormInvalid(false)
}, { immediate: true })
</script>

<template>
    <div class="custom-theme-edit-view" :class="{ 'custom-theme-preview-mode': isPreviewMode }"
        v-gesture-dnm="{ trigger: '.header' }">
        <div class="container">
            <div class="header">
                <div class="action left-action">
                    <div class="close-btn btn" @click="hideCustomThemeEditView">
                        <svg v-show="!isPreviewMode" width="12" height="12" viewBox="0 0 593.14 593.11" data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z"
                                transform="translate(-663.4 -243.46)" />
                        </svg>
                    </div>
                </div>
                <div class="title-wrap">
                    <div class="title">自定义主题</div>
                </div>
                <div class="action right-action">
                    <div class="preview-btn btn text-btn" v-show="!isPreviewMode" @click="toggleCustomThemePreview">
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
                    <div class="no-preview-btn btn text-btn" v-show="isPreviewMode" @click="toggleCustomThemePreview">
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
                    <div class="clear-btn btn text-btn" v-show="!isPreviewMode" @click="resetTheme">
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
                    <div class="save-btn btn text-btn" v-show="!isPreviewMode" @click="saveThemeAs">
                        <svg width="15" height="15" viewBox="0 0 853.61 853.59" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M426.39,853.55h-199c-32.66,0-65.33.12-98,0C69.66,853.23,19.5,815.14,4.57,758.06A138.7,138.7,0,0,1,.21,723.51Q-.18,426.78.06,130.05c0-64,42.59-115.66,105-127.71A135.26,135.26,0,0,1,130.43.14q232-.19,464-.14c13.93,0,25.46,4.72,35.34,14.64Q733.72,118.89,838,222.83c10.58,10.53,15.62,22.58,15.61,37.48-.13,154,.12,308-.2,462-.1,53.18-24.09,92.8-71.21,117.81-18.61,9.87-38.86,13.47-59.83,13.47Q574.38,853.52,426.39,853.55Zm-170-640h6.94q143.49,0,287,0c3,0,6,0,9,.23,22.36,1.7,40.48,23.55,38,45.78-2.61,23.46-20.15,39.22-43.88,39.22q-168.49,0-337,0c-27.74,0-45.64-17.9-45.64-45.63q0-80.73,0-161.48V85.85c-16.65,0-32.66-.59-48.59.31-6,.33-12.33,3.23-17.49,6.55-13.7,8.82-19.26,22-19.25,38.28q.18,295.72.08,591.45c0,1.67,0,3.33.06,5,.74,18.92,14,35.43,32.57,39.27,7.24,1.5,14.89,1.14,22.36,1.29,9.94.19,19.88,0,30.26,0v-6.49q0-144.49,0-289c0-28,17.85-45.78,46-45.78h420c28.4,0,46,17.71,46,46.22V768c13.88,0,27,0,40.19,0,27.25,0,45-17.78,45-45q0-222.22.08-444.46a10.66,10.66,0,0,0-3.39-8.3q-90.8-90.57-181.37-181.34A10.63,10.63,0,0,0,575,85.48q-156.49.12-313,.07h-5.71Zm340.86,554.3V512.5H256.41V767.85Z" />
                                </g>
                            </g>
                        </svg>
                        <span>另存为</span>
                    </div>
                    <div class="save-btn btn text-btn" v-show="!isPreviewMode && customTheme.id !== 'CUSTDEMO'"
                        @click="saveTheme">
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
                </div>
            </div>
            <div class="center">
                <div class="row first">
                    <div class="cate-name">主题名称</div>
                    <div class="row-content">
                        <div class="item" @keydown.stop="">
                            <input type="text" class="text-input-ctl" :class="{ invalid: isFormInvalid }" maxlength="64"
                                placeholder="主题名称，最多允许输入64个字符哦" :value="customTheme.name" @change="setupThemeName"
                                @blur="setupThemeName" />
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="cate-name">应用背景</div>
                    <div class="row-content">
                        <div class="tip-text">提示：颜色控件，左右均可点击；左边为输入模式，右边为输入值<br>
                            不想设置颜色，请切换为HEXA / RGBA模式，直接删除颜色值即可<br>
                            当前应用，所有输入框，按Enter键生效，或光标焦点离开后自动生效
                        </div>
                        <div class="item" @click="">
                            <div class="name">背景颜色：</div>
                            <ColorInputControl :value="customTheme.appBackground.bgColor" :onChanged="setupAppBackground">
                            </ColorInputControl>
                        </div>
                        <div class="item img-item">
                            <div class="name">背景图片：</div>
                            <div class="preview" v-show="customTheme.appBackground.bgImage">
                                <img :src="customTheme.appBackground.bgImage" />
                                <div class="action">
                                    <div class="remove-btn text-btn" @click="() => setupAppBgImage(null)">
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
                                        <span>移除图片</span>
                                    </div>
                                    <div class="select-new-btn text-btn" @click="uploadImage">
                                        <svg class="add-custom-btn" @click="" width="14" height="14"
                                            viewBox="0 0 682.65 682.74" xmlns="http://www.w3.org/2000/svg">
                                            <g id="Layer_2" data-name="Layer 2">
                                                <g id="Layer_1-2" data-name="Layer 1">
                                                    <path
                                                        d="M298.59,384.15h-7.06q-123.24,0-246.49,0c-21.63,0-38.69-12.57-43.64-31.94-7-27.56,13.21-53.29,42.33-53.51,25.33-.18,50.66,0,76,0H298.59v-6.44q0-123.49,0-247c0-20.39,10.77-36.44,28.49-42.71C355-7.34,383.55,13,384,43.16c.26,16.33,0,32.67,0,49V298.65h6.82q123.49,0,247,0c21.52,0,38.61,12.77,43.43,32.19,6.75,27.26-13.06,52.7-41.62,53.25-11.16.22-22.33,0-33.49,0H384.09v6.69q0,123.5,0,247c0,21.59-12.66,38.65-32.06,43.53-27.59,6.95-53.24-13.31-53.39-42.46-.17-32.66,0-65.33,0-98V384.15Z" />
                                                </g>
                                            </g>
                                        </svg>
                                        <span>重新选择</span>
                                    </div>
                                </div>
                            </div>
                            <div class="upload-action" v-show="!customTheme.appBackground.bgImage" @click="uploadImage">
                                <svg class="add-custom-btn" @click="" width="28" height="28" viewBox="0 0 682.65 682.74"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <g id="Layer_2" data-name="Layer 2">
                                        <g id="Layer_1-2" data-name="Layer 1">
                                            <path
                                                d="M298.59,384.15h-7.06q-123.24,0-246.49,0c-21.63,0-38.69-12.57-43.64-31.94-7-27.56,13.21-53.29,42.33-53.51,25.33-.18,50.66,0,76,0H298.59v-6.44q0-123.49,0-247c0-20.39,10.77-36.44,28.49-42.71C355-7.34,383.55,13,384,43.16c.26,16.33,0,32.67,0,49V298.65h6.82q123.49,0,247,0c21.52,0,38.61,12.77,43.43,32.19,6.75,27.26-13.06,52.7-41.62,53.25-11.16.22-22.33,0-33.49,0H384.09v6.69q0,123.5,0,247c0,21.59-12.66,38.65-32.06,43.53-27.59,6.95-53.24-13.31-53.39-42.46-.17-32.66,0-65.33,0-98V384.15Z" />
                                        </g>
                                    </g>
                                </svg>
                            </div>
                        </div>
                        <div class="item">
                            <div class="name">背景渐变：</div>
                            <ColorInputControl :value="customTheme.appBackground.bgImageGradient" :gradientMode="true"
                                :onChanged="setupAppBgImageGradient">
                            </ColorInputControl>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="cate-name">背景范围</div>
                    <div class="row-content">
                        <div class="item">
                            <div class="name">播放页：</div>
                            <ToggleControl :value="customTheme.appBackgroundScope.playingView"
                                @click="toggleAppBgScopePlayingView">
                            </ToggleControl>
                        </div>
                        <div class="item">
                            <div class="name">当前播放（列表）：</div>
                            <ToggleControl :value="customTheme.appBackgroundScope.playbackQueue"
                                @click="toggleAppBgScopePlaybackQueue">
                            </ToggleControl>
                        </div>
                        <div class="item">
                            <div class="name">全部分类（列表）：</div>
                            <ToggleControl :value="customTheme.appBackgroundScope.categoryView"
                                @click="toggleAppBgScopeCategoryView">
                            </ToggleControl>
                        </div>
                        <div class="item">
                            <div class="name">右键菜单：</div>
                            <ToggleControl :value="customTheme.appBackgroundScope.contextMenu"
                                @click="toggleAppBgScopeContextMenu">
                            </ToggleControl>
                        </div>
                        <div class="item">
                            <div class="name">Toast消息：</div>
                            <ToggleControl :value="customTheme.appBackgroundScope.toast" @click="toggleAppBgScopeToast">
                            </ToggleControl>
                        </div>
                        <div class="item">
                            <div class="name">音效设置（工具栏）：</div>
                            <ToggleControl :value="customTheme.appBackgroundScope.soundEffectView"
                                @click="toggleAppBgScopeSoundEffectView">
                            </ToggleControl>
                        </div>
                        <div class="item">
                            <div class="name">歌词设置（工具栏）：</div>
                            <ToggleControl :value="customTheme.appBackgroundScope.lyricToolbar"
                                @click="toggleAppBgScopeLyricToolbar">
                            </ToggleControl>
                        </div>
                        <div class="item">
                            <div class="name">随机设置（工具栏）：</div>
                            <ToggleControl :value="customTheme.appBackgroundScope.randomMusicToolbar"
                                @click="toggleAppBgScopeRandomMusicToolbar">
                            </ToggleControl>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="cate-name">内容</div>
                    <div class="row-content">
                        <div class="item">
                            <div class="name">文字颜色：</div>
                            <ColorInputControl :value="customTheme.content.textColor" :colorMode="true"
                                :onChanged="setupContentTextColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">文字高亮颜色：</div>
                            <ColorInputControl :value="customTheme.content.textHighlightColor"
                                :onChanged="setupContentTextHighlightColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">非文字类高亮颜色：</div>
                            <ColorInputControl :value="customTheme.content.highlightColor"
                                :onChanged="setupContentHighlightColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">副标题类文字颜色：</div>
                            <ColorInputControl :value="customTheme.content.subtitleTextColor" :colorMode="true"
                                :onChanged="setupContentSubtitleTextColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">次要 / 提示类文字颜色：</div>
                            <ColorInputControl :value="customTheme.content.secondaryTextColor" :colorMode="true"
                                :onChanged="setupContentSecondaryTextColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">内容区背景颜色：</div>
                            <ColorInputControl :value="customTheme.content.bgColor" :onChanged="setupContentBgColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">标题导航类内容区背景颜色：</div>
                            <ColorInputControl :value="customTheme.content.headerNavBgColor"
                                :onChanged="setupContentHeaderNavBgColor"></ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">左侧导航栏背景颜色：</div>
                            <ColorInputControl :value="customTheme.content.leftNavBgColor"
                                :onChanged="setupContentLeftNavBgColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">内容区加载时遮罩颜色：</div>
                            <ColorInputControl :value="customTheme.content.loadingMaskColor"
                                :onChanged="setupContentLoadingMaskColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">列表项类光标悬停时背景颜色：</div>
                            <ColorInputControl :value="customTheme.content.listItemHoverBgColor"
                                :onChanged="setupContentListItemHoverBgColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">输入框类文字颜色：</div>
                            <ColorInputControl :value="customTheme.content.inputsTextColor" :colorMode="true"
                                :onChanged="setupContentInputsTextColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">输入框类背景颜色：</div>
                            <ColorInputControl :value="customTheme.content.inputsBgColor" :colorMode="true"
                                :onChanged="setupContentInputsBgColor">
                            </ColorInputControl>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="cate-name">边框</div>
                    <div class="row-content">
                        <div class="item">
                            <div class="name">边框 / 分隔线类颜色：</div>
                            <ColorInputControl :value="customTheme.border.borderColor" :colorMode="true"
                                :onChanged="setupBorderColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">左侧导航栏边框颜色：</div>
                            <ColorInputControl :value="customTheme.border.leftNavBorderColor" :colorMode="true"
                                :onChanged="setupBorderLeftNavBorderColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">弹窗类边框颜色：</div>
                            <ColorInputControl :value="customTheme.border.popoversBorderColor" :colorMode="true"
                                :onChanged="setupBorderPopoversBorderColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">输入框类边框颜色：</div>
                            <ColorInputControl :value="customTheme.border.inputsBorderColor" :colorMode="true"
                                :onChanged="setupBorderInputsBorderColor">
                            </ColorInputControl>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="cate-name">按钮</div>
                    <div class="row-content">
                        <div class="item">
                            <div class="name">图标按钮颜色：</div>
                            <ColorInputControl :value="customTheme.button.iconBtnColor" :colorMode="true"
                                :onChanged="setupButtonIconBtnColor">
                            </ColorInputControl>
                        </div>
                        <div class="item" v-show="false">
                            <div class="name">图标按钮光标悬停时颜色：</div>
                            <ColorInputControl :value="customTheme.button.iconBtnHoverColor" :colorMode="true"
                                :onChanged="setupButtonIconBtnHoverColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">胶囊按钮背景颜色：</div>
                            <ColorInputControl :value="customTheme.button.iconTextBtnBgColor"
                                :onChanged="setupButtonIconTextBtnBgColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">胶囊按钮文字颜色：</div>
                            <ColorInputControl :value="customTheme.button.iconTextBtnTextColor" :colorMode="true"
                                :onChanged="setupButtonIconTextBtnTextColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">胶囊按钮图标颜色：</div>
                            <ColorInputControl :value="customTheme.button.iconTextBtnIconColor" :colorMode="true"
                                :onChanged="setupButtonIconTextBtnIconColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">胶囊按钮光标悬停时背景颜色：</div>
                            <ColorInputControl :value="customTheme.button.iconTextBtnHoverBgColor"
                                :onChanged="setupButtonIconTextBtnHoverBgColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">开关按钮背景颜色：</div>
                            <ColorInputControl :value="customTheme.button.toggleBtnBgColor" :colorMode="true"
                                :onChanged="setupButtonToggleBtnBgColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">开关按钮滑块颜色：</div>
                            <ColorInputControl :value="customTheme.button.toggleBtnThumbColor" :colorMode="true"
                                :onChanged="setupButtonToggleBtnThumbColor">
                            </ColorInputControl>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="cate-name">搜索栏</div>
                    <div class="row-content">
                        <div class="item">
                            <div class="name">边框颜色：</div>
                            <ColorInputControl :value="customTheme.searchBar.borderColor" :colorMode="true"
                                :onChanged="setupSearchBarBorderColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">背景颜色：</div>
                            <ColorInputControl :value="customTheme.searchBar.bgColor" :onChanged="setupSearchBarBgColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">文字颜色：</div>
                            <ColorInputControl :value="customTheme.searchBar.textColor"
                                :onChanged="setupSearchBarTextColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">搜索按钮背景颜色：</div>
                            <ColorInputControl :value="customTheme.searchBar.searchBtnBgColor"
                                :onChanged="setupSearchBarSearchBtnBgColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">搜索按钮光标悬停时背景颜色：</div>
                            <ColorInputControl :value="customTheme.searchBar.searchBtnHoverBgColor"
                                :onChanged="setupSearchBarSearchBtnHoverBgColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">搜索按钮图标颜色：</div>
                            <ColorInputControl :value="customTheme.searchBar.searchBtnIconColor" :colorMode="true"
                                :onChanged="setupSearchBarSearchBtnIconColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">搜索按钮光标悬停时图标颜色：</div>
                            <ColorInputControl :value="customTheme.searchBar.searchBtnHoverIconColor" :colorMode="true"
                                :onChanged="setupSearchBarSearchBtnHoverIconColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">清除按钮图标颜色：</div>
                            <ColorInputControl :value="customTheme.searchBar.clearBtnIconColor" :colorMode="true"
                                :onChanged="setupSearchBarClearBtnIconColor">
                            </ColorInputControl>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="cate-name">应用Logo</div>
                    <div class="row-content">
                        <div class="item">
                            <div class="name">背景颜色：</div>
                            <ColorInputControl :value="customTheme.appLogo.bgColor" :onChanged="setupAppLogoBgColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">内部小圆圈背景颜色：</div>
                            <ColorInputControl :value="customTheme.appLogo.innerBgColor"
                                :onChanged="setupAppLogoInnerBgColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">内部字母L颜色：</div>
                            <ColorInputControl :value="customTheme.appLogo.innerTextColor" :colorMode="true"
                                :onChanged="setupAppLogoInnerTextColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">右边文字颜色：</div>
                            <ColorInputControl :value="customTheme.appLogo.appNameTextColor"
                                :onChanged="setupAppLogoAppNameTextColor">
                            </ColorInputControl>
                        </div>
                    </div>
                </div>
                <div class="row last">
                    <div class="cate-name">其他</div>
                    <div class="row-content">
                        <div class="item">
                            <div class="name">滚动条颜色：</div>
                            <ColorInputControl :value="customTheme.others.scrollBarColor"
                                :onChanged="setupOthersScrollBarColor">
                            </ColorInputControl>
                        </div>
                        <div class="item">
                            <div class="name">进度条背景颜色：</div>
                            <ColorInputControl :value="customTheme.others.progressBarBgColor"
                                :onChanged="setupOthersProgressBarBgColor">
                            </ColorInputControl>
                        </div>
                        <!--
                        <div class="item" v-show="false">
                            <div class="name">音量滑块颜色：</div>
                            <ColorInputControl :value="customTheme.others.volumeBarThumbColor"
                                :onChanged="setupOthersVolumeBarThumbColor">
                            </ColorInputControl>
                        </div>
                        <div class="item" v-show="false">
                            <div class="name">复选框背景颜色：</div>
                            <ColorInputControl :value="customTheme.others.checkboxBgColor"
                                :onChanged="setupOthersCheckboxBgColor">
                            </ColorInputControl>
                        </div>
                        -->
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.custom-theme-edit-view {
    display: flex;
    /*flex-direction: column;*/
    overflow: hidden;
    border-radius: 15px;
    -webkit-app-region: none;
}

.custom-theme-edit-view .container {
    display: flex;
    flex: 1;
    flex-direction: column;
    background: var(--content-bg-color);
}

.custom-theme-preview-mode {
    height: 50px !important;
}

.custom-theme-preview-mode .header .no-preview-btn {
    margin-right: 25px;
}

.custom-theme-preview-mode .header {
    border-bottom: 1px solid transparent !important;
}

.custom-theme-edit-view .spacing {
    margin-left: 15px;
}

.custom-theme-edit-view .spacing1 {
    margin-left: 50px;
}

.custom-theme-edit-view .header,
.custom-theme-edit-view .center,
.custom-theme-edit-view .header .title-wrap,
.custom-theme-edit-view .center .bands {
    display: flex;
    flex-direction: row;
}

.custom-theme-edit-view .header {
    padding: 0px 15px 0px 3px;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--content-header-nav-bg-color);
    border-bottom: 1px solid var(--border-color);
}

.custom-theme-edit-view .header .action {
    display: flex;
    /*justify-content: center;
    align-items: center;*/
}

.custom-theme-edit-view .header .action svg {
    fill: var(--button-icon-btn-color);
    cursor: pointer;
}

.custom-theme-edit-view .header .action .btn:hover,
.custom-theme-edit-view .header .action .btn:hover svg {
    fill: var(--content-highlight-color);
    cursor: pointer;
}

.custom-theme-edit-view .header .action .close-btn {
    width: 30px;
}

.custom-theme-edit-view .header .title-wrap {
    margin-left: 6px;
    flex: 1;
    display: flex;
}

.custom-theme-edit-view .header .title {
    font-size: var(--content-text-size);
}

.custom-theme-edit-view .header #toggle-ctl {
    cursor: default;
    -webkit-app-region: none;
}

.custom-theme-edit-view .text-btn {
    text-align: left;
    font-size: var(--content-text-tip-text-size);
    display: flex;
    align-items: center;
    justify-items: center;
    margin-left: 33px;
    cursor: pointer;
}

.custom-theme-edit-view .text-btn svg {
    margin-right: 3px;
    fill: var(--button-icon-btn-color);
}

.custom-theme-edit-view .text-btn:hover {
    background: var(--content-text-highlight-color);
    -webkit-background-clip: text;
    color: transparent !important;
}

.custom-theme-edit-view .text-btn:hover svg {
    fill: var(--content-highlight-color);
}

.custom-theme-edit-view .tip-text {
    margin-bottom: 15px;
    text-align: left;
}


.custom-theme-edit-view .center {
    padding: 0px 50px;
    flex: 1;
    background: var(--content-bg-color);
    overflow: hidden;
    align-items: flex-start;
    display: flex;
    flex-direction: column;
    overflow: scroll;
    overflow-x: hidden;
}

.custom-theme-edit-view .center .first {
    margin-top: 36px;
}

.custom-theme-edit-view .center .row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    margin-bottom: 36px;
    /*border-bottom: 1px solid var(--border-color);*/
}

.custom-theme-edit-view .center .last {
    margin-bottom: 52px;
    border: 1px solid transparent;
}

.custom-theme-edit-view .center .row .text-input-ctl {
    width: 512px;
}

.custom-theme-edit-view .center .row .cate-name {
    font-size: var(--content-text-tab-title-size);
    width: 118px;
    text-align: left;
    margin-right: 10px;
    margin-top: 3px;
    /*color: var(--content-subtitle-text-color);*/
}

.custom-theme-edit-view .center .row-content {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
    flex: 1;
}

.custom-theme-edit-view .center .row-content .item {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    text-align: left;
    margin-bottom: 33px;
    flex: 1;
}

.custom-theme-edit-view .center .row-content .item .name {
    width: 288px;
}

.custom-theme-edit-view .center .row-content .img-item img,
.custom-theme-edit-view .center .row-content .img-item .upload-action {
    width: 239px;
    height: 128px;
    display: flex;
    align-items: center;
    justify-content: center;
    fill: var(--content-subtitle-text-color);
    border-radius: 6px;
    margin-bottom: 6px;
    border: 1px solid var(--border-inputs-border-color);
    cursor: pointer;
}

.custom-theme-edit-view .center .row-content .img-item img {
    cursor: default;
}

.custom-theme-edit-view .center .row-content .img-item .action {
    display: flex;
    /*justify-content: center;
    align-items: center;*/
}

.custom-theme-edit-view .invalid {
    border-color: var(--content-error-color) !important;
}
</style>