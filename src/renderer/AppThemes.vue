<script setup>
import { inject, onMounted, provide, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useSettingStore } from './store/settingStore';
import CssReset from './CssReset.vue';
import CssCommon from './CssCommon.vue';
import { isMacOS, isWinOS, toTrimString } from '../common/Utils';
import CssWinOS from './CssWinOS.vue';
import { onEvents, emitEvents } from '../common/EventBusWrapper';



const { theme: themeSetting, currentBorderRadiusCtlStyle,
  isUseAutoBorderRadiusCtl, isUseMacOSBorderRadiusCtl,
  isUseWindowsBorderRadiusCtl, winCustomShadowSize, } = storeToRefs(useSettingStore())
const { getCurrentTheme, setupFontFamily,
  setupFontWeight, allFontSizeLevels,
  currentFontSizeLevel, currentFontSize, } = useSettingStore()


const applyDocumentElementStyle = (prop, value) => document.documentElement.style.setProperty(prop, value)
const removeDocumentElementStyle = (prop, value) => document.documentElement.style.removeProperty(prop, value)

const applyDocumentStyle = (changes, valueSuffix) => {
    if(!changes || typeof changes != 'object') return
    for (const [key, value] of Object.entries(changes)) {
      applyDocumentElementStyle(key, `${value}${valueSuffix || ''}`)
    }
}


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
  if (!themeBgImage && !themeBgColor) themeBgColor = "#FFFFFF"

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
    "--content-regular-bg-color": theme.content.regularBgColor,
    "--content-light-bg-color": theme.content.lightBgColor,
  }

  applyDocumentStyle(themeProperties)
}

//设置主题
const setupAppTheme = (theme) => {
  theme = theme || getCurrentTheme()

  const { id } = theme
  const { type } = themeSetting.value
  applyTheme(theme)
  applyDocumentStyle({ 'theme': (id || 'custom-preview') })
}

//直接在setup()时执行，不需要等待其他生命周期
setupAppTheme()

const updateFontFamily = (value) => applyDocumentStyle({ 'font-family': toTrimString(value) })
const updateFontWeight = (value) => applyDocumentStyle({'font-weight': value })

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
    '--content-setting-cate-subtitle-width': Math.min((fontSize / 15.5 * 225), 245),
    //'--content-left-nav-line-height': (fontSize / 15.5 * 33),
    '--content-left-nav-line-spacing': (fontSize / 15.5 * 10.5),
    //'--content-text-module-title-size': (fontSize / 17.5 * 30),
    //'--content-text-module-subtitle-size': Math.max((fontSize / 17.5 * 25), 25)
  }
  applyDocumentStyle(changes, 'px')
}

//设置字体大小
const setupFontSizeLevel = (index) => {
  const attrName = 'fsLevel'
  const fontSizeLevels = allFontSizeLevels()
  const level = fontSizeLevels[index || currentFontSizeLevel()]
  level ? applyDocumentElementStyle(attrName, level.id) : removeDocumentElementStyle(attrName)
}

//设置字体样式
const setupFontStyle = () => {
  setupFontFamily()
  setupFontWeight()
  setupFontSize()
}

const setupBorderRadiusCtlStyle = () => {
  const useWinStyle = ((isUseAutoBorderRadiusCtl.value && isWinOS()) || isUseWindowsBorderRadiusCtl.value)
  const index = useWinStyle ? 0 : 1
  const changes = {
    '--border-app-win-border-radius': ['3px', '12px'][index],
    '--border-popover-border-radius': ['3px', '8px'][index],
    '--border-btn-border-radius': ['5px', '10rem'][index],
    '--border-list-item-border-radius': ['5px', '10rem'][index],
    '--border-left-nav-list-item-border-radius': ['3px', '5px'][index],
    '--border-img-text-tile-border-radius': ['3px', '6px'][index],
    '--border-flow-btn-border-radius': ['3px', '6px'][index],
  }
  applyDocumentStyle(changes)
}

const setupWinCustomShadow = () => {
  const shadowClass = 'app-win-custom-shadow'
  document.body.classList.remove(shadowClass)

  const needCustomShadow = isWinOS()
  const shadowSize = needCustomShadow ? winCustomShadowSize.value : 0
  if(needCustomShadow && shadowSize > 0) {
    applyDocumentStyle({
      '--app-win-custom-shadow-size': `${shadowSize}px`,
    })
    document.body.classList.add(shadowClass)
  }
}

/*
const setupAppBorder = () => {
  //TODO 硬编码
  const borderRadius = isMacOS() ? 0 : 12
  applyDocumentStyle({ '--border-app-win-border-radius': `${borderRadius}px` })
  //TODO 边框阴影效果, 再看看情况
}
*/

/*
const setupAutoTheme = () => {
  const detectedNode = document.getElementById('auto-theme')
  const observer = new MutationObserver((mutationList, observer) => {
    for (const mutation of mutationList) {
      if (mutation.type === "childList") {
        console.log("A child node has been added or removed.")
      } else if (mutation.type === "attributes") {
        console.log(`The ${mutation.attributeName} attribute was modified.`)
      }
    }
  })
  observer.observe(detectedNode, { attributes: true, childList: true, subtree: true })

  detectedNode.innerHTML = 'Hello World'
}
*/



//EventBus监听注册，统一管理
onEvents({
  'setting-fontFamily': updateFontFamily,
  'setting-fontWeight': updateFontWeight,
  'setting-fontSize': setupFontSize,
  'setting-reset':  setupFontStyle,
  'setting-restore':  setupFontStyle,
  'theme-applyTheme': setupAppTheme,
})

onMounted(() => {
  setupFontStyle()
  setupBorderRadiusCtlStyle()
  setupWinCustomShadow()
  //setupAppTheme()
})

watch(themeSetting, () => setupAppTheme(), { deep: true })
watch(currentBorderRadiusCtlStyle, setupBorderRadiusCtlStyle)
watch(winCustomShadowSize, setupWinCustomShadow)

provide('appStyle', {
  applyDocumentElementStyle,
  removeDocumentElementStyle,
  applyDocumentStyle,
})
</script>

<template>
  <CssReset></CssReset>
  <CssCommon></CssCommon>
  <slot></slot>
  <CssWinOS></CssWinOS>
</template>

<style>
/*
@media (prefers-color-scheme: light) {}
@media (prefers-color-scheme: dark) {}
*/
body.app-win-custom-shadow {
  padding: var(--app-win-custom-shadow-size);
  box-sizing: border-box;
}

.app-win-custom-shadow #app {
  border-radius: var(--border-popover-border-radius);
  box-shadow: var(--app-win-custom-box-shadow);
}

.app-custom-theme-bg {
  background-color: var(--app-bg-color);
  background-image: var(--app-bg-image);
  background-repeat: no-repeat;
  background-size: cover;
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
  border-radius: 5px;
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