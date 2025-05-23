<script setup>
import { computed, inject, ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import SearchBar from './SearchBar.vue';
import ToggleControl from './ToggleControl.vue';
import { stringEqualsIgnoreCase, isBlank, } from '../../common/Utils';



const { useWindowsStyleWinCtl } = inject('appCommon')

const { hideFontSelectionToolbar, setFontSelectionToolbarContext } = useAppCommonStore()
const { fontSelectionToolbarContext } = storeToRefs(useAppCommonStore())

const DEFAULT_FONT = 'System Default, 默认字体'
const activeItem = ref(null)
const availableFonts = ref(null)
const filteredData = ref(null)
const contentRef = ref(null)
const setActiveItem = (value) => (activeItem.value = value)
const setAvailableFonts = (value) => (availableFonts.value = value)

const loadFonts = async () => {
  try {
    const fonts = await window.queryLocalFonts()
    const fontFamilies = []
    for (const font of fonts) {
      //console.log(font.postscriptName, font.fullName, font.family, font.style)
      const { family } = font
      if(!fontFamilies.includes(family)) {
        fontFamilies.push(family)
      }
    }
    if(fontFamilies.length > 0) {
        fontFamilies.sort()
        fontFamilies.splice(0, 0, DEFAULT_FONT)
    }
    setAvailableFonts(fontFamilies)
  } catch (error) {
    console.error(error.name, error.message)
  }
  invokeContextMounted()
  nextTick(scrollToCurrent)
}

const selectItem = (item, index) => {
    setActiveItem(item)
    invokeContextSelected()
}

const scrollToCurrent = () => {
    const contentEl = contentRef.value
    if(!contentEl) return 
    const activeEl = contentEl.querySelector('.active')
    if(!activeEl) return 
    activeEl.scrollIntoView()
}

const invokeContextMounted = () => {
    if(!availableFonts.value || availableFonts.value.length < 1) return
    const context = fontSelectionToolbarContext.value
    if(!context) return 
    const { mounted } = context 
    if(typeof mounted == 'function') {
        const current = mounted()
        if(isBlank(current)) return setActiveItem(DEFAULT_FONT)

        for(let i = 1; i < availableFonts.value.length; i++) {
            const item = availableFonts.value[i]
            if(stringEqualsIgnoreCase(current, item)
                || stringEqualsIgnoreCase(current, `"${item}"`)) {
                return setActiveItem(item)
            }
        }
        setActiveItem(null)
    }
}

const invokeContextSelected = () => {
    const context = fontSelectionToolbarContext.value
    if(!context) return 
    const { selected } = context 
    if(typeof selected == 'function') {
        const fonts = availableFonts.value
        const index = fonts.findIndex(font => (font == activeItem.value))
        const item = index > 0 ? activeItem.value : ''
        selected({ item, index })
    }
}

const computedSize = computed(() => {
    const fData = filteredData.value
    const fonts = availableFonts.value
    return fData ? fData.length : (fonts ? fonts.length : 0)
})

const filterFonts = (keyword) => {
    let result = availableFonts.value
    if (keyword) {
        keyword = keyword.toLowerCase()
        result = result.filter(item => {
            if (item.toLowerCase().includes(keyword)) {
                return true
            }
            return false
        })
    }

    filteredData.value = result
}

/* 生命周期、监听 */
onMounted(() => {
    loadFonts()
})

onUnmounted(() => {
    setFontSelectionToolbarContext(null)
})
</script>

<template>
    <div class="font-selection-toolbar" v-gesture-dnm="{ trigger: '.header' }">
        <div class="container">
            <div class="header">
                <div class="action" v-show="!useWindowsStyleWinCtl">
                    <div class="close-btn btn" @click="hideFontSelectionToolbar">
                        <svg width="12" height="12" viewBox="0 0 593.14 593.11" data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z"
                                transform="translate(-663.4 -243.46)" />
                        </svg>
                    </div>
                </div>
                <div class="title">字体选择</div>
                <div class="action" v-show="useWindowsStyleWinCtl">
                    <div class="close-btn btn" @click="hideFontSelectionToolbar">
                        <svg width="12" height="12" viewBox="0 0 593.14 593.11" data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z"
                                transform="translate(-663.4 -243.46)" />
                        </svg>
                    </div>
                </div>
            </div>
            <div class="center">
                <div class="search-wrap">
                    <SearchBar class="search-bar" placeholder="字体名称"
                        :submitAction="filterFonts">
                    </SearchBar>
                </div>
                <div class="list-title">列表({{ computedSize }})</div>
                <div class="content" ref="contentRef" >
                    <div v-for="(item, index) in (filteredData || availableFonts)" 
                        class="item"
                        :class="{ 'active': (activeItem == item) }"
                        @click="selectItem(item, index)" >
                        <span v-html="item"></span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
.font-selection-toolbar {
    display: flex;
    width: 404px;
    height: 520px;
    overflow: hidden;
}

.font-selection-toolbar .container {
    /*border-radius: 10px;*/
    border-radius: var(--border-popover-border-radius);
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    -webkit-app-region: none;
    background: var(--content-bg-color);
    background: var(--content-bg-color-no-transparent);
}

.font-selection-toolbar .v-spacing {
    margin-top: 20px;
}

.font-selection-toolbar .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 8px 10px 8px 3px;
    border-radius: 5px 5px 0px 0px;
    background: transparent;
    border-bottom: 1px solid var(--border-color);
}

.font-selection-toolbar .header .close-btn {
    width: 30px;
}

.font-selection-toolbar .header .title {
    flex: 1;
    font-weight: bold;
    font-size: calc(var(--content-text-size) - 1px);
    padding-right: 25px;
}

.font-selection-toolbar .center {
    display: flex;
    flex-direction: column;
    flex: 1;
    background: transparent;
    padding-bottom: 10px;
    overflow: hidden;
}

.font-selection-toolbar .center .search-wrap {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
}

.font-selection-toolbar .center .search-wrap .search-bar {
    flex: 1;
    margin: 15px 12px 12px 12px;
}

.font-selection-toolbar .center .search-wrap .search-bar .keyword {
    width: calc(100% - 40px);
}

.font-selection-toolbar .center .list-title {
    font-size: calc(var(--content-text-size) - 1px);
    color: var(--content-subtitle-text-color);
    text-align: left;
    padding: 0px 16px 6px 16px;
    font-weight: bold;
}


.font-selection-toolbar .center .content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    flex: 1;
    background: transparent;
    overflow: scroll;
    overflow-x: hidden;
}

.font-selection-toolbar .center .content .item {
    cursor: pointer;
    width: 100%;
    margin-bottom: 2px;
}

.font-selection-toolbar .center .content .item span {
    padding: 10px 25px;
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

.font-selection-toolbar .center .content .item:hover {
    background: var(--content-list-item-hover-bg-color);
}

.font-selection-toolbar .center .content .item.active {
    background: var(--button-icon-text-btn-bg-color);
    color: var(--button-icon-text-btn-text-color);
}

.contrast-mode .font-selection-toolbar .center .content .item.active {
    font-weight: bold;
}
</style>