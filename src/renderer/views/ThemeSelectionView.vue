<script setup>
import { computed, inject, ref, reactive, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { useThemeStore } from '../store/themeStore';
import ToggleControl from '../components/ToggleControl.vue';




const { useWindowsStyleWinCtl } = inject('appCommon')

const { isAutoHideThemeSelectionView, themeSelectionViewContext, } = storeToRefs(useAppCommonStore())
const { hideThemeSelectionView, setThemeSelectionViewContext, 
    toggleAutoHideThemeSelectionView } = useAppCommonStore()
const { getPresetThemes, getCustomThemes, } = useThemeStore()


const activeTabIndex = ref(0)
const selectedItem = reactive({ type: 0, index: 1 })
const subtitle = ref('')
const setActiveTab = (value) => activeTabIndex.value = value
const setSubtitle = (value) => subtitle.value = value
const setSelectedItem = (item, index) => {
    Object.assign(selectedItem, {
        type: activeTabIndex.value, index
    })
}

const computedContent = computed(() => {
    return  activeTabIndex.value == 1 ? getCustomThemes() : getPresetThemes()
})

const computedItemBackground = computed(() => {
    return (item) => {
        if (!item) return {}
        const { previewBg, appBackground } = item
        //预设
        if(activeTabIndex.value == 0) return { 'background': previewBg }
        //自定义
        const { bgColor, bgImage, bgImageGradient } = appBackground
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
})

const computedSubtitle = computed(() => {
    return subtitle.value ? ` - ${subtitle.value}` : ''
})

const selectItem = (item, index) => {
    setSelectedItem(item, index)
    invokeContextSelected()
    if(isAutoHideThemeSelectionView.value) hideThemeSelectionView()
}

const invokeContextMounted = () => {
    const context = themeSelectionViewContext.value
    if(!context) return 
    const { mounted } = context 
    if(typeof mounted == 'function') {
        const { index, type, subtitle } = mounted()
        setActiveTab(type)
        setSelectedItem({ index, type }, index)
        setSubtitle(subtitle)
    }
}

const invokeContextSelected = () => {
    const context = themeSelectionViewContext.value
    if(!context) return 
    const { selected } = context 
    if(typeof selected == 'function') selected(selectedItem)
}

const invokeContextUnmounted = () => {
    const context = themeSelectionViewContext.value
    if(!context) return 
    const { unmounted } = context 
    if(typeof unmounted == 'function') unmounted(selectedItem)

    setThemeSelectionViewContext(null)
}


onMounted(invokeContextMounted)
onUnmounted(invokeContextUnmounted)
</script>

<template>
    <div class="theme-selection-view" 
        v-gesture-dnm="{ 
            trigger: '.header', 
            excludes: ['.toggle-ctl-wrap'] 
        }">
        <div class="container">
            <div class="header">
                <div class="action" v-show="!useWindowsStyleWinCtl">
                    <div class="close-btn btn" @click="hideThemeSelectionView">
                        <svg width="13" height="13" viewBox="0 0 593.14 593.11" data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z"
                                transform="translate(-663.4 -243.46)" />
                        </svg>
                    </div>
                </div>
                <div class="title-wrap">
                    <div class="title">主题选择{{ computedSubtitle }}</div>
                    <div class="toggle-ctl-wrap">
                        <ToggleControl :value="isAutoHideThemeSelectionView" @click="toggleAutoHideThemeSelectionView">
                        </ToggleControl>
                        <span @click="toggleAutoHideThemeSelectionView">{{ isAutoHideThemeSelectionView ? '自动关闭': '手动关闭' }}</span>
                    </div>
                </div>
                <div class="action" v-show="useWindowsStyleWinCtl">
                    <div class="close-btn btn" @click="hideThemeSelectionView">
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
                    <div class="nav-item" :class="{ active: activeTabIndex == 0 }" @click="() => setActiveTab(0)">
                        <div class="text">预设</div>
                    </div>
                    <div class="nav-item" :class="{ active: activeTabIndex == 1 }" @click="() => setActiveTab(1)">
                        <div class="text">自定义</div>
                    </div>
                </div>
                <div class="content">
                    <div class="item" v-for="(item, index) in computedContent"
                        :class="{ active: (selectedItem.type == activeTabIndex && selectedItem.index == index) }">
                        <div class="preview" :style="computedItemBackground(item)" @click="selectItem(item, index)">
                            <svg v-show="(selectedItem.type == activeTabIndex && selectedItem.index == index)" class="checked-svg"
                                width="18" height="18" viewBox="0 0 767.89 767.94" xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                                    </g>
                                </g>
                            </svg>
                        </div>
                        <div class="name" v-html="item.name" @click="selectItem(item, index)"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.theme-selection-view {
    display: flex;
    overflow: hidden;
    -webkit-app-region: none;
    --active-color: #ffd700;
    --header-height: var(--content-header-nav-height);;
}

.theme-selection-view .container {
    display: flex;
    flex: 1;
    flex-direction: column;
    background: var(--content-bg-color);
    background: var(--content-bg-color-no-transparent);
}

.theme-selection-view .container .checked-svg {
    position: absolute;
    right: 0px;
    bottom: 0px;
    fill: var(--active-color);
}

.theme-selection-view .spacing {
    margin-left: 15px;
}

.theme-selection-view .header,
.theme-selection-view .center,
.theme-selection-view .header .title-wrap  {
    display: flex;
    flex-direction: row;
}

.theme-selection-view .header {
    padding: 0px 12px 0px 3px;
    height: var(--header-height);
    border-bottom: 2px solid var(--border-header-nav-border-color);
    background: transparent;
    align-items: center;
}

.theme-selection-view .header .action {
    display: flex;
    justify-content: center;
    align-items: center;
}

.theme-selection-view .header .action .close-btn {
    width: 30px;
}

.theme-selection-view .header .title-wrap {
    margin-left: 10px;
    display: flex;
    align-items: center;
}

.theme-selection-view .header .title {
    margin-right: 30px;
    font-size: calc(var(--content-text-size) + 1);
}

.theme-selection-view .center {
    flex: 1;
    overflow: hidden;
    background: transparent;
}

.theme-selection-view .center .left {
    width: 88px;
    background: var(--content-header-nav-bg-color);
    border-right: 2px solid var(--border-color);
}

.theme-selection-view .center .left .nav-item {
    padding: 59px 0px;
    cursor: pointer;
}

.theme-selection-view .center .left .active {
    /*
    background: var(--button-icon-text-btn-bg-color) !important;
    color: var(--button-icon-text-btn-icon-color) !important;
    */
    background: var(--content-list-item-hl-bg-color) !important;
    color: var(--content-list-item-hl-text-color) !important;
    font-weight: bold;
}

.theme-selection-view .center .left .nav-item:hover {
    background: var(--content-list-item-hover-bg-color);
}

.theme-selection-view .center .content {
    flex: 1;
    display: flex;
    align-content: flex-start;
    flex-wrap: wrap;
    overflow: scroll;
    overflow-x: hidden;

    padding-top: 25px;
    padding-bottom: 33px;
    margin-left: 33px;
}

.theme-selection-view .center .content .item {
    margin-right: 28px;
    margin-top: 8px;
    margin-bottom: 15px;
}

.theme-selection-view .center .content .preview {
    width: 114px;
    height: 70px;
    border-radius: var(--border-img-text-tile-border-radius);
    border: 2px solid transparent;
    cursor: pointer;
    box-shadow: 0px 0px 1px #cbcbcbdd;
    position: relative;
    overflow: hidden;
}

.theme-selection-view .center .content .name {
    line-height: var(--content-text-line-height);
    margin-top: 3px;
    margin-left: 3px;
    text-align: left;
    cursor: pointer;
    font-size: var(--content-text-tip-text-size);

    overflow: hidden;
    text-overflow: ellipsis;
    word-wrap: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
}

.theme-selection-view .center .content .item:hover .name,
.theme-selection-view .center .content .active .name {
    background: var(--content-text-highlight-color);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent !important;
}

.theme-selection-view .center .content .active .preview {
    border-color: var(--active-color) !important;
}

.theme-selection-view .center .content .active .name {
    font-weight: bold;
}

.theme-selection-view .title-wrap .toggle-ctl-wrap {
    display: flex;
    align-items: center;
    position: absolute;
    right: 50px;
}

.theme-selection-view .title-wrap .toggle-ctl-wrap span {
    margin-left: 8px;
    font-size: var(--content-text-tip-text-size);
    cursor: pointer;
}

.theme-selection-view .title-wrap .toggle-ctl-wrap span:hover {
    background: var(--content-text-highlight-color);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent !important;
    font-weight: bold;
}
</style>