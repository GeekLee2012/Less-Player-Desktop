<script setup>
import { useThemeStore } from '../store/themeStore';
import { useSettingStore } from '../store/settingStore';
import { storeToRefs } from 'pinia';

const { getPresetThemes } = useThemeStore()
const { theme } = storeToRefs(useSettingStore())
const { setThemeIndex } = useSettingStore()
</script>

<template>
    <div id="themes-view">
        <div class="header">
            <div class="title">主题</div>
        </div>
        <div class="center">
            <div class="row">
                <div class="cate-name">推荐</div>
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
            <div class="row">
                <div class="cate-name">自定义</div>
                <div class="content">

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

#themes-view .header .title {
    margin-left: 35px;
    margin-right: 35px;
    margin-bottom: 25px;
    padding-top: 25px;
    /*font-size: 30px;*/
    font-size: var(--text-main-title-size);
    font-weight: bold;
    padding-bottom: 20px;
    border-bottom: 2px solid var(--setting-bottom-border-color);
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

#themes-view .center .row .cate-name {
    font-size: 20px;
    font-weight: bold;
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

#themes-view .center .row .content .text {
    margin-top: 8px;
    margin-left: 3px;
    cursor: pointer;
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