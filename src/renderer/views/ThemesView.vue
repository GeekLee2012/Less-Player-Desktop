<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useThemeStore } from '../store/themeStore';
import { useSettingStore } from '../store/settingStore';
import { useAppCommonStore } from '../store/appCommonStore';



const { getPresetThemes } = useThemeStore()
const { toggleCustomThemeEditViewShow, hideCustomThemeEditView } = useAppCommonStore()
const { theme } = storeToRefs(useSettingStore())
const { setThemeIndex } = useSettingStore()

const currentTabIndex = ref(0)
const setCurrnetTabIndex = (value) => currentTabIndex.value = value

const switchTab = (index) => {
    setCurrnetTabIndex(index)
}

</script>

<template>
    <div id="themes-view">
        <div class="header">
            <div class="title">主题</div>
            <div class="tabs">
                <span class="tab" :class="{ active: currentTabIndex == 0 }" @click="switchTab(0)">推荐</span>
                <span class="tab spacing" :class="{ active: currentTabIndex == 1 }" @click="switchTab(1)">自定义</span>
            </div>
        </div>
        <div class="center">
            <div class="row" v-show="currentTabIndex == 0">
                <!--<div class="cate-name">推荐</div>-->
                <div class="content">
                    <div class="item" v-for="(item, index) in getPresetThemes()" :class="{
                        active: index == theme.index,
                        lightText: item.dark
                    }">
                        <div @click="setThemeIndex(index)" class="preview" :style="{ background: item.color }">
                            <svg v-show="(index == theme.index)" class="checked-svg" width="18" height="18"
                                viewBox="0 0 767.89 767.94" xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                                    </g>
                                </g>
                            </svg>
                        </div>
                        <div @click="setThemeIndex(index)" class="text">{{ item.name }}</div>
                    </div>
                </div>
            </div>
            <div class="row" v-show="currentTabIndex == 1">
                <!--<div class="cate-name">自定义</div>-->
                <div class="content">
                    <div class="item">
                        <div class="preview create-action" @click="toggleCustomThemeEditViewShow">
                            <svg class="add-custom-btn" @click="" width="32" height="32" viewBox="0 0 682.65 682.74"
                                xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M298.59,384.15h-7.06q-123.24,0-246.49,0c-21.63,0-38.69-12.57-43.64-31.94-7-27.56,13.21-53.29,42.33-53.51,25.33-.18,50.66,0,76,0H298.59v-6.44q0-123.49,0-247c0-20.39,10.77-36.44,28.49-42.71C355-7.34,383.55,13,384,43.16c.26,16.33,0,32.67,0,49V298.65h6.82q123.49,0,247,0c21.52,0,38.61,12.77,43.43,32.19,6.75,27.26-13.06,52.7-41.62,53.25-11.16.22-22.33,0-33.49,0H384.09v6.69q0,123.5,0,247c0,21.59-12.66,38.65-32.06,43.53-27.59,6.95-53.24-13.31-53.39-42.46-.17-32.66,0-65.33,0-98V384.15Z" />
                                    </g>
                                </g>
                            </svg>
                        </div>
                        <div class="text" @click="toggleCustomThemeEditViewShow">新建主题</div>
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

#themes-view .header .title {
    margin-left: 35px;
    margin-right: 35px;
    margin-bottom: 35px;
    padding-top: 20px;
    /*font-size: 30px;*/
    font-size: var(--text-main-title-size);
    font-weight: bold;
}

#themes-view .tabs {
    text-align: left;
    margin-left: 35px;
    margin-right: 35px;
    padding-bottom: 5px;
    position: relative;
}

#themes-view .tab {
    font-weight: bold;
    font-size: var(--tab-title-text-size);
    padding: 8px 15px;
    border-bottom: 3px solid transparent;
    cursor: pointer;
}

#themes-view .header .active {
    color: var(--hl-color);
    font-weight: bold;
    border-bottom: 3px solid var(--hl-color);
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
    width: var(--theme-preview-tile-width);
    height: var(--theme-preview-tile-height);
    border-radius: 8px;
    border: 2px solid transparent;
    cursor: pointer;
    box-shadow: 0px 0px 1px #cbcbcbdd;
    position: relative;
    overflow: hidden;
}

#themes-view .center .row .content .create-action {
    border: 2px dashed var(--text-sub-color);
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--bg-color);
}

#themes-view .center .row .content .create-action svg {
    fill: var(--text-sub-color);
}

#themes-view .center .row .content .text {
    margin-top: 8px;
    margin-left: 3px;
    cursor: pointer;
    text-align: left;
}

#themes-view .center .row .content .text:hover {
    color: var(--hl-color);
}

#themes-view .checked-svg {
    position: absolute;
    right: 0px;
    bottom: 0px;
    fill: var(--active-color);
}
</style>