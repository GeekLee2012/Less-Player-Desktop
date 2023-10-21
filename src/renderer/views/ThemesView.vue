<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useThemeStore } from '../store/themeStore';
import { useSettingStore } from '../store/settingStore';
import { useAppCommonStore } from '../store/appCommonStore';



const { getPresetThemes, getCustomThemes, removeCustomTheme } = useThemeStore()
const { showCustomThemeEditView, hideCustomThemeEditView,
    showToast, hidePlaybackQueueView } = useAppCommonStore()
const { theme: themeSetting } = storeToRefs(useSettingStore())
const { setThemeIndex } = useSettingStore()

const currentTabIndex = ref(0)
const setCurrnetTabIndex = (value) => currentTabIndex.value = value

const switchTab = (index) => {
    setCurrnetTabIndex(index)
}

//TODO 目前自定义主题需要配置项太多，后期可以引入模板

const removeTheme = (item, index) => {
    removeCustomTheme(item)
    const { index: currentIndex } = themeSetting.value
    if (index === currentIndex) {
        setThemeIndex(1, 0)
    }
    showToast('主题已删除')
}

const customThemeItemPreviewStyle = (item) => {
    if (!item) return {}
    const { bgColor, bgImage, bgImageGradient } = item.appBackground
    let themeBgImage = null
    if (bgImage && bgImageGradient) {
        themeBgImage = `${bgImageGradient}, url('${bgImage}')`
    } else if (bgImage) {
        themeBgImage = `url('${bgImage}')`
    } else if (bgImageGradient) {
        themeBgImage = bgImageGradient
    }
    return {
        'background-color': bgColor,
        'background-image': themeBgImage,
        'background-size': 'cover',
        'background-position': 'center'
    }
}

const editTheme = (item) => {
    hidePlaybackQueueView()
    showCustomThemeEditView(item)
}

const ceateTheme = () => editTheme()
</script>

<template>
    <div id="themes-view">
        <div class="header">
            <div class="title">主题</div>
            <div class="tabs">
                <span v-for="(item, index) in ['推荐', '自定义']" class="tab"
                    :class="{ active: currentTabIndex == index, 'content-text-highlight': currentTabIndex == index, spacing: index > 0 }"
                    @click="switchTab(index)" v-html="item">
                </span>
            </div>
        </div>
        <div class="center">
            <div class="row" v-show="currentTabIndex == 0">
                <!--<div class="cate-name">推荐</div>-->
                <div class="content">
                    <div class="item" v-for="(item, index) in getPresetThemes()"
                        :class="{ active: index == themeSetting.index && themeSetting.type === 0 }">
                        <div @click="setThemeIndex(index)" class="preview" :style="{ background: item.previewBg }">
                            <svg v-show="(index == themeSetting.index && themeSetting.type === 0)" class="checked-svg"
                                width="18" height="18" viewBox="0 0 767.89 767.94" xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                                    </g>
                                </g>
                            </svg>
                        </div>
                        <div @click="setThemeIndex(index)" class="name" v-html="item.name"></div>
                    </div>
                </div>
            </div>
            <div class="row custom-themes" v-show="currentTabIndex == 1">
                <!--<div class="cate-name">自定义</div>-->
                <div class="content">
                    <div class="item">
                        <div class="preview create-action" @click="ceateTheme()">
                            <svg class="add-custom-btn" width="32" height="32" viewBox="0 0 682.65 682.74"
                                xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M298.59,384.15h-7.06q-123.24,0-246.49,0c-21.63,0-38.69-12.57-43.64-31.94-7-27.56,13.21-53.29,42.33-53.51,25.33-.18,50.66,0,76,0H298.59v-6.44q0-123.49,0-247c0-20.39,10.77-36.44,28.49-42.71C355-7.34,383.55,13,384,43.16c.26,16.33,0,32.67,0,49V298.65h6.82q123.49,0,247,0c21.52,0,38.61,12.77,43.43,32.19,6.75,27.26-13.06,52.7-41.62,53.25-11.16.22-22.33,0-33.49,0H384.09v6.69q0,123.5,0,247c0,21.59-12.66,38.65-32.06,43.53-27.59,6.95-53.24-13.31-53.39-42.46-.17-32.66,0-65.33,0-98V384.15Z" />
                                    </g>
                                </g>
                            </svg>
                        </div>
                        <div class="name" @click="ceateTheme()">新建主题</div>
                    </div>
                    <div class="item" v-for="(item, index) in getCustomThemes()"
                        :class="{ active: index == themeSetting.index && themeSetting.type === 1 }">
                        <div @click="setThemeIndex(index, 1)" class="preview" :style="customThemeItemPreviewStyle(item)">
                            <svg v-show="(index == themeSetting.index && themeSetting.type === 1)" class="checked-svg"
                                width="18" height="18" viewBox="0 0 767.89 767.94" xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                                    </g>
                                </g>
                            </svg>
                            <div class="action">
                                <div class="edit-btn btn" @click.stop="editTheme(item)">
                                    <svg width="26" height="26" viewBox="0 0 992.3 992.23"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <g id="Layer_2" data-name="Layer 2">
                                            <g id="Layer_1-2" data-name="Layer 1">
                                                <path
                                                    d="M428.27,992.13c-88.16,0-176.32.28-264.48-.1-56.56-.24-101.65-23.86-134.6-69.78A150.76,150.76,0,0,1,.34,833.37C0,743.21.19,653.05.18,562.89c0-88-.5-176,.17-264C.82,236.36,29,188.83,82.63,156.81c25.32-15.11,53.25-21.18,82.69-21.15q161,.15,322,.06c26.66,0,45.78,15.33,50.38,40,5,26.58-15,53-41.88,55.53-3.31.31-6.66.42-10,.42q-159.75,0-319.49-.06c-25.45,0-45.64,9.41-59.78,30.75-7.47,11.29-10.42,23.92-10.41,37.45q.09,229.23,0,458.47,0,35.25,0,70.5c.06,38.34,29,67.32,67.42,67.33q264.74,0,529.47,0c38.53,0,67.21-28.52,67.44-67.25.21-32.66.05-65.33.05-98q0-112.74,0-225.49c0-19.14,7-34.41,23.5-44.58,30.3-18.63,70.25,2.33,72.32,37.83.13,2.17.21,4.33.21,6.5q0,161.24,0,322.48c0,47.47-16.82,87.91-51.29,120.5-30,28.4-66.18,43.56-107.53,43.81-89.83.52-179.66.16-269.49.16Z" />
                                                <path
                                                    d="M417,473.1c1.08-20.29,2.1-40.59,3.27-60.88a46.93,46.93,0,0,1,11.63-28.62c1.74-2,3.64-3.89,5.53-5.78L798.28,16.91c22.51-22.5,50.7-22.57,73.22-.07q52.15,52.11,104.27,104.27c22,22,22.06,50.57.07,72.54Q794.42,374.91,613,556.14c-10.34,10.34-22.49,15.36-37,16.06q-50.93,2.47-101.8,5.69c-14.62.91-28.69.35-40.88-9.11-12.48-9.69-19.48-22.41-19.12-38.27.43-19.15,1.73-38.28,2.65-57.41Zm95.78,6.38c13.28-.76,25.7-1.6,38.15-2.09a12.52,12.52,0,0,0,9.12-4q156.09-156.07,312.3-312c1.26-1.26,2.43-2.58,3.23-3.43l-41.31-41.26-72.48,72.49Q640.15,310.8,518.56,432.44c-1.44,1.45-3.22,3.37-3.35,5.18C514.19,451.23,513.55,464.86,512.74,479.48Z" />
                                            </g>
                                        </g>
                                    </svg>
                                </div>
                                <div class="remove-btn btn spacing" v-show="item.id !== 'CUSTDEMO'"
                                    @click.stop="removeTheme(item, index)">
                                    <svg width="25" height="25" viewBox="0 0 256 256" data-name="Layer 1"
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
                                </div>
                            </div>
                        </div>
                        <div @click="setThemeIndex(index, 1)" class="name" v-html="item.name"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
#themes-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    text-align: left;
    overflow: scroll;
    overflow-x: hidden;
    --active-color: #ffd700;
}

#themes-view .spacing {
    margin-left: 33px;
}

#themes-view .header {
    padding-left: 35px;
    padding-right: 35px;
    margin-bottom: 10px;
}


#themes-view .header .title {
    margin-bottom: 35px;
    padding-top: 20px;
    /*font-size: 30px;*/
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
}

#themes-view .tabs {
    text-align: left;
    padding-bottom: 5px;
    position: relative;
}

#themes-view .tab {
    /*font-weight: bold;*/
    font-size: var(--content-text-tab-title-size);
    padding: 8px 15px;
    border-bottom: 3px solid transparent;
    cursor: pointer;
}

#themes-view .header .tabs .active {
    font-weight: bold;
    border-bottom: 3px solid var(--content-highlight-color);
}

#themes-view .center {
    display: flex;
    flex-direction: column;
    flex: 1;
    margin-left: 35px;
    margin-right: 35px;
    padding-bottom: 56px;
}

#themes-view .center .row {
    display: flex;
    flex-direction: column;
    flex: 1;
    margin-bottom: 25px;
}

#themes-view .center .content .active .preview {
    border-color: var(--active-color) !important;
}

#themes-view .center .row .content {
    display: flex;
    flex-wrap: wrap;
}

#themes-view .center .row .content .item {
    margin-right: 25px;
    margin-top: 20px;
}

#themes-view .center .row .content .preview {
    /*width: 160px;
    height: 95px;*/
    width: var(--others-theme-preview-tile-width);
    height: var(--others-theme-preview-tile-height);
    border-radius: 8px;
    border: 2px solid transparent;
    cursor: pointer;
    box-shadow: 0px 0px 1px #cbcbcbdd;
    position: relative;
    overflow: hidden;
}

#themes-view .center .row .content .create-action {
    border: 2px dashed var(--button-icon-btn-color) !important;
    display: flex;
    justify-content: center;
    align-items: center;
    background: transparent;
}

#themes-view .center .row .content .create-action svg {
    fill: var(--button-icon-btn-color);
}

#themes-view .center .row .content .name {
    width: var(--others-theme-preview-tile-width);
    line-height: var(--content-text-line-height);
    margin-top: 8px;
    margin-left: 3px;
    text-align: left;
    cursor: pointer;

    overflow: hidden;
    text-overflow: ellipsis;
    word-wrap: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

#themes-view .center .row .content .name:hover {
    background: var(--content-text-highlight-color);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent !important;
}

#themes-view .checked-svg {
    position: absolute;
    right: 0px;
    bottom: 0px;
    fill: var(--active-color);
}

#themes-view .custom-themes .action {
    background: var(--content-bg-color);
    height: 100%;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    opacity: 0.88;
    visibility: hidden;
}

#themes-view .custom-themes .preview:hover .action {
    visibility: visible;
}
</style>