<script setup>
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';
import SingleSelectionControl from './SingleSelectionControl.vue';


const { hideLyricToolbar } = useAppCommonStore()
const { lyric } = storeToRefs(useSettingStore())
const { setLyricFontSize, setLyricHighlightFontSize,
    setLyricLineHeight, setLyricLineSpacing,
    setLyricFontWeight, setLyricOffset,
    setLyricMetaPos, setLyricAlignment,
    resetLyricSetting, } = useSettingStore()

const getInputValue = (e) => (e.target.value)

const updateLyricFontSize = (e) => {
    setLyricFontSize(getInputValue(e))
}

const updateLyricHighlightFontSize = (e) => {
    setLyricHighlightFontSize(getInputValue(e))
}

const updateLyricLineHeight = (e) => {
    setLyricLineHeight(getInputValue(e))
}

const updateLyricLineSpacing = (e) => {
    setLyricLineSpacing(getInputValue(e))
}

const updateLyricFontWeight = (e) => {
    setLyricFontWeight(getInputValue(e))
}

const updateLyricOffset = (e) => {
    setLyricOffset(getInputValue(e))
}

const getLyricOffsetText = () => {
    return lyric.value.offset != 0 ? lyric.value.offset : null
}
</script>

<template>
    <div class="lyric-toolbar" v-gesture-dnm="{ trigger: '.header' }">
        <div class="header">
            <div class="close-btn">
                <svg @click="hideLyricToolbar" width="10" height="10" viewBox="0 0 593.14 593.11" data-name="Layer 1"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z"
                        transform="translate(-663.4 -243.46)" />
                </svg>
            </div>
            <div class="title">歌词设置</div>
        </div>
        <div class="center v-spacing">
            <div class="row text">歌曲信息：</div>
            <div class="row">
                <SingleSelectionControl :data="['默认', '隐藏', '顶部']" :value="lyric.metaPos" :onChanged="setLyricMetaPos">
                </SingleSelectionControl>
            </div>
            <div class="row text v-spacing">对齐方式：</div>
            <div class="row">
                <SingleSelectionControl :data="['左边', '中间', '右边']" :value="lyric.alignment" :onChanged="setLyricAlignment">
                </SingleSelectionControl>
            </div>
            <div class="row text v-spacing">字号 (普通)：</div>
            <div class="row">
                <input type="number" placeholder="默认值18" :value="lyric.fontSize" min="10" max="100" step="1"
                    @input="updateLyricFontSize" />
            </div>
            <div class="row text v-spacing">字号 (高亮)：</div>
            <div class="row">
                <input type="number" placeholder="默认值21" :value="lyric.hlFontSize" min="10" max="100" step="1"
                    @input="updateLyricHighlightFontSize" />
            </div>
            <div class="row text v-spacing">字重 (粗细)：</div>
            <div class="row">
                <input type="number" placeholder="默认值400" :value="lyric.fontWeight" min="100" max="1000" step="10"
                    @input="updateLyricFontWeight" />
            </div>
            <div class="row text v-spacing">行高：</div>
            <div class="row">
                <input type="number" placeholder="默认值28" :value="lyric.lineHeight" min="10" max="168" step="1"
                    @input="updateLyricLineHeight" />
            </div>
            <div class="row text v-spacing">行间距：</div>
            <div class="row">
                <input type="number" placeholder="默认值26" :value="lyric.lineSpacing" min="1" max="100" step="1"
                    @input="updateLyricLineSpacing" />
            </div>
            <div class="row text v-spacing">快慢 (毫秒)：</div>
            <div class="row">
                <input type="number" placeholder="正快负慢" :value="getLyricOffsetText()" min="-99999" max="99999" step="100"
                    @input="updateLyricOffset" />
            </div>
            <div class="row text-btn v-spacing" @click="resetLyricSetting">
                <svg width="15" height="15" viewBox="0 0 256 256" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg">
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
                <span>恢复默认</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.lyric-toolbar {
    background: var(--ctx-menu-bg);
    border-radius: 5px;
    box-shadow: 0px 0px 3px var(--ctx-menu-border-color);
    display: flex;
    flex-direction: column;
    width: 168px;
    padding-bottom: 18px;
    -webkit-app-region: none;
}

.lyric-toolbar svg {
    fill: var(--svg-color);
    cursor: pointer;
}

.lyric-toolbar svg:hover {
    fill: var(--hl-color);
}

.lyric-toolbar .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    padding: 8px 10px;
    border-radius: 5px 5px 0px 0px;
    background: var(--seview-left-bg);
}

.lyric-toolbar .header .title {
    flex: 1;
    font-weight: bold;
    padding-right: 9px;
}

.lyric-toolbar .center {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.lyric-toolbar .row {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.lyric-toolbar .text {
    margin-bottom: 2px;
    font-size: 14px;
    width: 100%;
    align-items: flex-start;
    padding-left: 52px;
}

.lyric-toolbar .v-spacing {
    margin-top: 8px;
}

.lyric-toolbar input {
    padding: 5px 6px;
    border-radius: 5px;
    border: 1px solid var(--input-border-color);
    font-size: 14px;
    text-align: left;
    width: 108px;
}


.lyric-toolbar .text-btn {
    text-align: center;
    font-size: 14px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-items: center;
    cursor: pointer;
}

.lyric-toolbar .text-btn svg {
    margin-right: 5px;
}

.lyric-toolbar .text-btn:hover,
.lyric-toolbar .text-btn:hover svg {
    color: var(--hl-color);
    fill: var(--hl-color);
}
</style>