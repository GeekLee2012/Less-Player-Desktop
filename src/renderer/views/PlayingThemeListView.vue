<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { coverDefault } from '../../common/Utils';



const { setPlayingViewThemeIndex, showCustomPlayingThemeEditView,
    removePlayingViewCustomTheme, } = useAppCommonStore()
const { playingViewPresetThemes, playingViewCustomThemes,
    playingViewThemeIndex, playingViewThemeType } = storeToRefs(useAppCommonStore())

const editTheme = (item) => {
    showCustomPlayingThemeEditView(item)
}

const removeTheme = (item, index) => {
    removePlayingViewCustomTheme(item)
    setPlayingViewThemeIndex(0)
}

const computedPresetThemeSectionTitle = computed(() => {
   const type = playingViewThemeType.value
   const index = playingViewThemeIndex.value
   const total = playingViewPresetThemes.value.length
   return (type == 0 && total > 0) ? `${index + 1} / ${total}` : total
})

const computedCustomThemeSectionTitle = computed(() => {
   const type = playingViewThemeType.value
   const index = playingViewThemeIndex.value
   const total = playingViewCustomThemes.value.length
   return (type != 0 && total > 0) ? `${index + 1} / ${total}` : total
})
</script>

<template>
    <!-- click事件: 必须阻止冒泡，因为document全局监听click事件 -->
    <div class="playing-theme-list-view" @click.stop="" ref="ptlistRef">
        <div class="container">
            <div class="header">
                <div class="title-wrap">
                    <div class="title content-text-highlight">播放样式</div>
                </div>
                <div class="action">
                    <div class="add-btn text-btn" @click="() => showCustomPlayingThemeEditView()" >
                        <svg width="14" height="14"
                            viewBox="0 0 682.65 682.74" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M298.59,384.15h-7.06q-123.24,0-246.49,0c-21.63,0-38.69-12.57-43.64-31.94-7-27.56,13.21-53.29,42.33-53.51,25.33-.18,50.66,0,76,0H298.59v-6.44q0-123.49,0-247c0-20.39,10.77-36.44,28.49-42.71C355-7.34,383.55,13,384,43.16c.26,16.33,0,32.67,0,49V298.65h6.82q123.49,0,247,0c21.52,0,38.61,12.77,43.43,32.19,6.75,27.26-13.06,52.7-41.62,53.25-11.16.22-22.33,0-33.49,0H384.09v6.69q0,123.5,0,247c0,21.59-12.66,38.65-32.06,43.53-27.59,6.95-53.24-13.31-53.39-42.46-.17-32.66,0-65.33,0-98V384.15Z" />
                                </g>
                            </g>
                        </svg>
                        <span>自定义</span>
                    </div>
                    
                </div>
            </div>
            <div class="center" ref="listRef">
                <div class="sec-title">预设({{ computedPresetThemeSectionTitle }})</div>
                <template v-for="(item, index) in playingViewPresetThemes">
                    <div class="item" :class="{ current: (playingViewThemeIndex == index && playingViewThemeType == 0) }" 
                        :index="index">
                        <div class="preview-wrap">
                            <img class="preview" :src="`dynamics/${item.id}_preview.png`" 
                                @click="(event) => setPlayingViewThemeIndex(index)" />
                            <svg v-show="(playingViewThemeIndex == index && playingViewThemeType == 0)" class="checked-svg"
                                width="21" height="21" viewBox="0 0 767.89 767.94" xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                                    </g>
                                </g>
                            </svg>
                        </div>
                        <div>
                            <span class="text" v-html="item.name"
                                @click="(event) => setPlayingViewThemeIndex(index)" >
                            </span>
                        </div>
                    </div>
                </template>
                <div class="sec-title">自定义({{ computedCustomThemeSectionTitle }})</div>
                <template v-for="(item, index) in playingViewCustomThemes">
                    <div class="item" :class="{ current:  (playingViewThemeIndex == index && playingViewThemeType == 1) }" 
                        :index="index">
                        <div class="preview-wrap">
                            <img class="preview" :src="coverDefault(item.previewCover)" :class="{ 'no-cover': !item.previewCover }"
                                @click="(event) => setPlayingViewThemeIndex(index, 1)" />
                            <svg v-show="(playingViewThemeIndex == index && playingViewThemeType == 1)" class="checked-svg"
                                width="21" height="21" viewBox="0 0 767.89 767.94" xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                                    </g>
                                </g>
                            </svg>
                            <div class="action">
                                <div class="edit-btn btn" @click.stop="editTheme(item)">
                                    <svg width="23" height="23" viewBox="0 0 992.3 992.23"
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
                                    <svg width="22" height="22" viewBox="0 0 256 256" data-name="Layer 1"
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
                        <div>
                            <span class="text" v-html="item.name"
                                @click="(event) => setPlayingViewThemeIndex(index, 1)" >
                            </span>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<style>
.playing-theme-list-view {
    display: flex;
    -webkit-app-region: none;
    overflow: hidden;
}

.playing-theme-list-view .spacing {
    margin-left: 15px;
}

.playing-theme-list-view .container {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    background: var(--content-bg-color);
    background: var(--content-bg-color-no-transparent);
}

.playing-theme-list-view .header {
    padding: 20px 15px 10px 25px;
    border-bottom: none;
    display: flex;
    position: relative;
}

.playing-theme-list-view .header .title-wrap {
    display: flex;
    flex-direction: row;
}

.playing-theme-list-view .header .title-wrap .title {
    text-align: left;
    font-size: var(--content-text-module-subtitle-size);
    font-weight: bold;
}

.playing-theme-list-view .header .action {
    display: flex;
    flex-direction: row;
    position: absolute;
    bottom: 15px;
    right: 25px;
}

.playing-theme-list-view .header .action .add-btn svg {
    transform: translateY(1px);
}

.playing-theme-list-view .center {
    position: relative;
    flex: 1;
    overflow: scroll;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    padding-bottom: 66px;
}

.playing-theme-list-view .center .sec-title {
    text-align: left;
    padding: 5px 25px 10px 25px;
    font-weight: bold;
    font-size: var(--content-text-subtitle-size);
    color: var(--content-subtitle-text-color);
}

.playing-theme-list-view .center .item {
    position: relative;
    margin: 0px 33px 36px 33px;
}

.playing-theme-list-view .center .item .preview-wrap {
    position: relative;
}

.playing-theme-list-view .center .item .preview {
    width: 100%;
    height: 188px;
    object-fit: fill;
    margin-bottom: 3px;
    border-radius: 3px;
    border: 3.5px solid transparent;
    cursor: pointer;
}

.playing-theme-list-view .center .item .preview.no-cover {
    object-fit: cover;
}

.playing-theme-list-view .center .item .preview-wrap .checked-svg {
    position: absolute;
    right: 0px;
    bottom: 13px;
    fill: #ffd700;
    fill: var(--content-highlight-color);
}

.playing-theme-list-view .center .item .preview-wrap .action {
    position: absolute;
    top: 3px;
    right: -5px;
    background: var(--content-bg-color);
    padding: 10px 16px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    opacity: 0.88;
    border-radius: 3px;
    visibility: hidden;
}

.playing-theme-list-view .center .item .preview-wrap:hover .action {
    visibility: visible;
}

.playing-theme-list-view .center .item .text {
    cursor: pointer;
}

.playing-theme-list-view .center .item.current .preview {
    border-color: var(--content-highlight-color);
}

.playing-theme-list-view .center .item.current .text {
    color: var(--content-highlight-color);
    font-weight: bold;
}
</style>