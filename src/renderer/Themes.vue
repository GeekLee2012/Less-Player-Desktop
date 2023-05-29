<script setup>
import { onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useSettingStore } from './store/settingStore';
import CssReset from './CssReset.vue';
import CssCommon from './CssCommon.vue';
import EventBus from '../common/EventBus';
import { Theme } from '../common/Theme';



const { theme: themeSetting } = storeToRefs(useSettingStore())
const { getCurrentTheme, setupFontFamily,
  setupFontWeight, allFontSizeLevels,
  currentFontSizeLevel, currentFontSize,
} = useSettingStore()

const applyTheme = (theme) => {
  //const theme = new Theme()
  const { bgColor, bgImage, bgImageGradient } = theme.appBackground
  let themeBgColor = bgColor, themeBgImage = null
  if (bgImage && bgImageGradient) {
    themeBgImage = `${bgImageGradient}, url('${bgImage}')`
  } else if (bgImage) {
    themeBgImage = `url('${bgImage}')`
  } else if (bgImageGradient) {
    themeBgImage = bgImageGradient
  }
  if (!themeBgImage && !themeBgColor) themeBgColor = "#FFF"

  const { textHighlightColor, bgColor: contentBgColor } = theme.content
  let contentBorderImage = textHighlightColor || ''
  if (contentBorderImage.startsWith('#')) { //单色，不是渐变色
    contentBorderImage = `linear-gradient(${textHighlightColor}, ${textHighlightColor})`
  }

  let nonTransparentContentBgColor = contentBgColor || ''
  if (nonTransparentContentBgColor.length > 0) {
    nonTransparentContentBgColor = nonTransparentContentBgColor.substring(0, 7)
  }

  const themeProperties = {
    '--app-bg-color': themeBgColor,
    '--app-bg-image': themeBgImage,

    '--content-text-color': theme.content.textColor,
    '--content-subtitle-text-color': theme.content.subtitleTextColor,
    '--content-secondary-text-color': theme.content.secondaryTextColor,
    '--content-bg-color': theme.content.bgColor,
    '--content-bg-color-no-transparent': nonTransparentContentBgColor,
    '--content-text-highlight-color': theme.content.textHighlightColor,
    '--content-highlight-color': theme.content.highlightColor,
    '--content-header-nav-bg-color': theme.content.headerNavBgColor,
    '--content-loading-mask-color': theme.content.loadingMaskColor,
    '--content-list-item-hover-bg-color': theme.content.listItemHoverBgColor,
    '--content-left-nav-bg-color': theme.content.leftNavBgColor,
    '--content-inputs-text-color': theme.content.inputsTextColor,
    '--content-inputs-bg-color': theme.content.inputsBgColor,
    //--content-inputs-placeholder-color

    '--border-color': theme.border.borderColor,
    '--border-left-nav-border-color': theme.border.leftNavBorderColor,
    '--border-popovers-border-color': theme.border.popoversBorderColor,
    '--border-inputs-border-color': theme.border.inputsBorderColor,

    '--button-icon-btn-color': theme.button.iconBtnColor,
    //'--button-icon-btn-hover-color': theme.button.iconBtnHoverColor,
    '--button-icon-text-btn-bg-color': theme.button.iconTextBtnBgColor,
    '--button-icon-text-btn-hover-bg-color': theme.button.iconTextBtnHoverBgColor,
    '--button-icon-text-btn-text-color': theme.button.iconTextBtnTextColor,
    '--button-icon-text-btn-icon-color': theme.button.iconTextBtnIconColor,
    '--button-toggle-btn-bg-color': theme.button.toggleBtnBgColor,
    '--button-toggle-btn-thumb-color': theme.button.toggleBtnThumbColor,

    '--searchbar-border-color': theme.searchBar.borderColor,
    '--searchbar-bg-color': theme.searchBar.bgColor,
    '--searchbar-text-color': theme.searchBar.textColor,
    '--searchbar-search-btn-bg-color': theme.searchBar.searchBtnBgColor,
    '--searchbar-search-btn-hover-bg-color': theme.searchBar.searchBtnHoverBgColor,
    '--searchbar-search-btn-icon-color': theme.searchBar.searchBtnIconColor,
    '--searchbar-search-btn-hover-icon-color': theme.searchBar.searchBtnHoverIconColor,
    '--searchbar-clear-btn-icon-color': theme.searchBar.clearBtnIconColor,

    '--app-logo-bg-color': theme.appLogo.bgColor,
    '--app-logo-inner-bg-color': theme.appLogo.innerBgColor,
    '--app-logo-inner-text-color': theme.appLogo.innerTextColor,
    '--app-logo-app-name-text-color': theme.appLogo.appNameTextColor,

    '--others-scrollbar-color': theme.others.scrollBarColor,
    '--others-progressbar-bg-color': theme.others.progressBarBgColor,
    //'--others-volumebar-thumb-color': theme.others.volumeBarThumbColor,
    //'--others-checkbox-bg-color': theme.others.checkboxBgColor,

    "--content-border-image": contentBorderImage,
  }

  for (const [key, value] of Object.entries(themeProperties)) {
    document.documentElement.style.setProperty(key, value)
  }

}

//设置主题
const setupAppTheme = (theme) => {
  theme = theme || getCurrentTheme()

  const { id } = theme
  const { type } = themeSetting.value
  applyTheme(theme)
  document.documentElement.setAttribute('theme', id ? id : 'custom-preview')
}

//直接在setup()时执行，不需要等待其他生命周期
setupAppTheme()

/*
const updateFontFamily = (value) => {
  value = value.trim()
  const fontFamily = value.length > 2 ? value : "var(--content-text-font-family)"
  document.documentElement.style.fontFamily = fontFamily
}
*/

const updateFontFamily = (value) => {
  //const presetFontFamily = document.documentElement.style.getPropertyValue('--content-text-preset-font-family')
  const fontFamily = value.trim()
  document.documentElement.style.setProperty('font-family', fontFamily)
}

const updateFontWeight = (value) => {
  document.documentElement.style.setProperty('font-weight', value)
}

//设置字体大小
const setupFontSize = (fontSize) => {
  fontSize = fontSize || currentFontSize()
  /*
  --content-text-size: 15.5px;
  --content-text-subtitle-size: 14px;
  --content-text-tip-text-size: 13.5px;
  --content-text-tab-title-size: 17px;
  --content-setting-cate-subtitle-width: 225px;
  --content-text-line-height: 23px;
  //主标题 
  --content-text-module-title-size: 30px;
  //标题 - 批量操作页、当前播放列表
  --content-text-module-subtitle-size: 23px;
  //标题 - 全部分类界面
  --content-text-module-title2-size: 21px;
  //标题 - 左导航
  --content-text-module-title3-size: 19px;
  //行高 - 左导航
  --content-left-nav-line-height: 32px;
  */
  const changes = {
    '--content-text-size': fontSize,
    '--content-text-subtitle-size': (fontSize - 1),
    '--content-text-tip-text-size': (fontSize - 1.5),
    '--content-text-tab-title-size': (fontSize + 1.5),
    '--content-text-module-title3-size': Math.min((fontSize + 3.5), 28),
    '--content-setting-cate-subtitle-width': Math.min((fontSize / 15.5 * 225), 239),
    '--content-left-nav-line-height': (fontSize / 15.5 * 32)
  }
  for (const [key, value] of Object.entries(changes)) {
    document.documentElement.style.setProperty(key, `${value}px`)
  }
}

//设置字体大小
const setupFontSizeLevel = (index) => {
  const attrName = 'fsLevel'
  const fontSizeLevels = allFontSizeLevels()
  const level = fontSizeLevels[index || currentFontSizeLevel()]
  if (level) {
    document.documentElement.setAttribute(attrName, level.id)
  } else {
    document.documentElement.removeAttribute(attrName)
  }
}

//设置字体样式
const setupFontStyle = () => {
  setupFontFamily()
  setupFontWeight()
  setupFontSize()
}

EventBus.on('setting-fontFamily', updateFontFamily)
EventBus.on('setting-fontWeight', updateFontWeight)
//EventBus.on('setting-fontSizeLevel', setupFontSizeLevel)
EventBus.on('setting-fontSize', setupFontSize)
EventBus.on('setting-reset', setupFontStyle)
EventBus.on('setting-restore', setupFontStyle)
EventBus.on('theme-applyTheme', setupAppTheme)

onMounted(setupFontStyle)
watch(themeSetting, () => setupAppTheme(), { deep: true })
</script>

<template>
  <CssReset></CssReset>
  <CssCommon></CssCommon>
  <slot></slot>
</template>

<style>
/*
@media (prefers-color-scheme: light) {}

@media (prefers-color-scheme: dark) {}
*/

.app-custom-theme-bg {
  background-color: var(--app-bg-color);
  background-image: var(--app-bg-image);
}

.app-custom-theme-bg .container {
  background: var(--content-bg-color) !important;
}

.content-backdrop-filter {
  /*backdrop-filter: url('none') blur(6px) opacity(100%);*/
}

/* 滚动条 */
::-webkit-scrollbar-thumb {
  background: var(--others-scrollbar-color);
  border: 1px solid var(--others-scrollbar-color);
  width: var(--others-scrollbar-width);
  height: 66px;
  border-radius: 8px;
}

::-webkit-scrollbar-track,
::-webkit-scrollbar-track-piece,
::-webkit-scrollbar-corner,
::-webkit-scrollbar-button,
::-webkit-resizer {
  background: transparent;
}

/*TODO 试验性CSS */
.loading-mask {
  animation-duration: 1s;
  animation-fill-mode: forwards;
  animation-iteration-count: infinite;
  animation-name: forwards;
  animation-timing-function: linear;
  background: var(--content-loading-mask-color);
  background-size: 100% auto;
  height: 66px;
  position: relative;
}

@keyframes forwards {
  from {
    background-position: -360px 0
  }

  to {
    background-position: 360px 0
  }
}

@keyframes rotate {
  from {
    transform: rotateZ(0deg)
  }

  to {
    transform: rotateZ(360deg)
  }
}
</style>