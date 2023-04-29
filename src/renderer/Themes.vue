<script setup>
import { inject, onBeforeMount, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useSettingStore } from './store/settingStore';
import CssReset from './CssReset.vue';
import CssCommon from './CssCommon.vue';
import EventBus from '../common/EventBus';



const { theme } = storeToRefs(useSettingStore())
const { getCurrentThemeId, setupFontFamily,
  setupFontWeight, allFontSizeLevels,
  currentFontSizeLevel, currentFontSize,
} = useSettingStore()

//设置主题
const setupAppTheme = (themeId) => {
  themeId = themeId || getCurrentThemeId() || 'dark'
  themeId = themeId.trim()
  document.documentElement.setAttribute('theme', themeId)
}

//直接在setup()时执行，不需要等待其他生命周期
setupAppTheme(getCurrentThemeId())


const updateFontFamily = (value) => {
  value = value.trim()
  const fontFamily = value.length > 2 ? value : "var(--text-font-family)"
  document.documentElement.style.fontFamily = fontFamily
}

const updateFontWeight = (value) => {
  document.documentElement.style.fontWeight = value
}

//设置字体大小
const setupFontSize = (fontSize) => {
  fontSize = fontSize || currentFontSize()
  /*
  --text-size: 15.5px;
  --text-sub-size: 14px;
  --tip-text-size: 13.5px;
  --tab-title-text-size: 17px;
  --setting-cate-subtitle-width: 225px;
  --text-line-height: 23px;
  //主标题 
  --text-main-title-size: 30px;
  //标题 - 批量操作页、当前播放列表
  --text-main2-title-size: 23px;
  //标题 - 全部分类界面
  --text-main3-title-size: 21px;
  //标题 - 左导航
  --text-main4-title-size: 19px;
  //行高 - 左导航
  --main-left-nav-line-height: 32px;
  */
  const changes = {
    '--text-size': fontSize,
    '--text-sub-size': (fontSize - 1),
    '--tip-text-size': (fontSize - 1.5),
    '--tab-title-text-size': (fontSize + 1.5),
    '--text-main4-title-size': Math.min((fontSize + 3.5), 28),
    '--setting-cate-subtitle-width': Math.min((fontSize / 15.5 * 225), 239),
    '--main-left-nav-line-height': (fontSize / 15.5 * 32)
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


onMounted(setupFontStyle)
watch(theme, () => setupAppTheme(), { deep: true })
</script>

<template>
  <CssReset></CssReset>
  <CssCommon></CssCommon>
  <slot></slot>
</template>

<style>
/*
:root,
:root[fsLevel="default"],
:root[fsLevel="standard"] {
  --text-size: 15.5px;
  --text-sub-size: 14px;
  --tip-text-size: 13.5px;
  --tab-title-text-size: 17px;
  --setting-cate-subtitle-width: 225px;
  --text-line-height: 23px;
  --text-main-title-size: 30px;
  --text-main2-title-size: 23px;
  --text-main3-title-size: 21px;
  --text-main4-title-size: 19px;
  --main-left-nav-line-height: 32px;
}

:root[fsLevel="small"] {
  --text-size: 14.5px;
  --text-sub-size: 13px;
  --tip-text-size: 12.5px;
  --tab-title-text-size: 16px;
  --text-line-height: 22px;
  --main-left-nav-line-height: 31.5px;
  --text-main4-title-size: 18px;
}

:root[fsLevel="medium"] {
  --text-size: 16.5px;
  --text-sub-size: 15px;
  --tip-text-size: 14.5px;
  --tab-title-text-size: 18px;
  --setting-cate-subtitle-width: 255px;
  --text-line-height: 23.3px;
  --main-left-nav-line-height: 32.5px;
  --text-main4-title-size: 20px;
}

:root[fsLevel="large"] {
  --text-size: 17.5px;
  --text-sub-size: 16px;
  --tip-text-size: 15.5px;
  --tab-title-text-size: 19px;
  --setting-cate-subtitle-width: 255px;
  --text-line-height: 23.5px;
  --main-left-nav-line-height: 33px;
  --text-main4-title-size: 21px;
}

:root[fsLevel="larger"] {
  --text-size: 18.5px;
  --text-sub-size: 17px;
  --tip-text-size: 15.5px;
  --tab-title-text-size: 20px;
  --setting-cate-subtitle-width: 260px;
  --text-line-height: 23.6px;
  --text-main4-title-size: 21.5px;
  --main-left-nav-line-height: 33.5px;
}

:root[fsLevel="largest"] {
  --text-size: 19.5px;
  --text-sub-size: 18px;
  --tip-text-size: 15.5px;
  --tab-title-text-size: 21px;
  --setting-cate-subtitle-width: 260px;
  --text-line-height: 23.6px;
  --text-main4-title-size: 23px;
  --main-left-nav-line-height: 33.5px;
}
*/
:root[theme='dark'] {
  /* 全局背景 */
  --bg-color: #313131;
  --app-bg: var(--bg-color);
  /* 文本 */
  --text-color: #eaeaea;
  --text-sub-color: #989898;
  --text-subtitle-color: #666;
  --hl-color: #28c83f;
  --hl-text-bg: linear-gradient(to top right, #28c83f, #1ca388);
  --hl-title-color: var(--hl-color);
  /* 歌词文本颜色 */
  --text-lyric-color: #ccc;
  /* 按钮 */
  --svg-color: #eaeaea;
  --svg-hover-color: var(--hl-color);
  --svg-text-color: #eaeaea;
  --svg-btn-color: #fff;
  --btn-bg: linear-gradient(to right, #1ca388, #28c83f);
  --btn-hover-bg: linear-gradient(to top right, #2edfa3, #28c83f) !important;

  --toggle-btn-bg: #989898;
  --toggle-thumb-bg: #ccc;
  --toggle-btn-border-color: #ccc;
  --toggle-btn-active-bg: var(--hl-color);
  --toggle-active-thumb-bg: #fff;
  /* 进度条 */
  --progress-track-bg: linear-gradient(to right, #464646, #666) !important;
  --progress-bg: linear-gradient(to top right, #2edfa3, #28c83f);
  --slider-thumb-bg: var(--svg-color);
  /*滚动条*/
  --scrollbar-thumb-bg: #666;
  /* 列表项 hover */
  --list-item-hover: #464646 !important;
  --list-item-active-bg: var(--btn-bg);
  /* 边框 */
  --main-left-border-color: #181818;
  --ctx-menu-bg: #464646;
  --ctx-menu-border-color: #181818;
  --border-color: #363636;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: #363636;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-text-color: var(--hl-text-bg);
  --pbq-hl-border: linear-gradient(to top right, #28c83f, #1ca388) 0 0 0 2;
  --pbq-box-shadow: 0px 0px 10px #161616;

  /* 搜索框 */
  --searchbar-bg: #fff;
  --search-btn-bg: var(--btn-hover-bg);
  --search-btn-svg-color: var(--svg-btn-color);
  --searchbar-text-color: #555;
  --searchbar-border-color: transparent;

  --search-btn-hover-bg: var(--btn-bg);
  --search-btn-hover-svg-color: var(--search-btn-svg-color);
  /* 通知消息 */
  --ntf-bg: var(--ctx-menu-bg);
  --ntf-text-color: var(--text-color);
  --ntf-border-color: var(--ctx-menu-border-color);
  /* 加载等待遮盖 */
  --loading-mask-bg: linear-gradient(90deg, #414141 8%, #515151 18%, #414141 33%);
  --error-color: red;

  --checkbox-bg: #fff;
  --logo-bg: var(--btn-bg);
  --logo-text-bg: #fff;
  --logo-text-color: #1ca388;

  --category-view-border: 0.5px solid var(--main-left-border-color);
  --input-bg: #464646;
  --input-text-color: var(--text-color);
  --input-border-color: var(--main-left-border-color);
  --input-border-color: #363636;
  --input-placeholder-color: #888;

  --back2top-btn-bg: var(--btn-hover-bg);
  --back2top-btn-svg-color: #fff;
  /* 音效 */
  --seview-bg: #363636;
  --seview-left-bg: #414141;
  --seview-border: 1px solid var(--main-left-border-color);
  --seview-list-item-bg: #3e3e3e;
  --seview-list-item-color: var(--text-color);
}

:root[theme='white'] {
  /* 全局背景 */
  --bg-color: #fff;
  --app-bg: var(--bg-color);
  /* 文本 */
  --text-color: #212121;
  --text-sub-color: #666;
  --text-subtitle-color: #a0a0a0;
  --hl-color: #28c83f;
  --hl-color: #31c27c;
  --hl-text-bg: linear-gradient(to top right, #28c83f, #1ca388);
  --hl-title-color: var(--hl-color);
  /* 歌词文本颜色 */
  --text-lyric-color: #666;
  /* 按钮 */
  --svg-color: #414141;
  --svg-hover-color: var(--hl-color);
  --svg-text-color: #fff;
  --svg-btn-color: #fff;
  --btn-bg: linear-gradient(to right, #1ca388, #28c83f);
  --btn-hover-bg: linear-gradient(to top right, #2edfa3, #28c83f) !important;

  --toggle-btn-bg: #989898;
  --toggle-thumb-bg: #ccc;
  --toggle-btn-border-color: #ccc;
  --toggle-btn-active-bg: var(--hl-color);
  --toggle-active-thumb-bg: #fff;
  /* 进度条 */
  --progress-track-bg: linear-gradient(to right, #ccc, #ccc) !important;
  --progress-bg: linear-gradient(to top right, #1ca388, #28c83f);
  --slider-thumb-bg: var(--svg-color);
  /*滚动条*/
  --scrollbar-thumb-bg: #999;
  /* 列表项 hover */
  --list-item-hover: #eee !important;
  --list-item-active-bg: var(--btn-bg);
  /* 边框 */
  --main-left-border-color: #ddd;
  --ctx-menu-bg: var(--bg-color);
  --ctx-menu-border-color: #ababab;
  --border-color: #f4f4f4;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: #f8f8f8;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-text-color: var(--hl-text-bg);
  --pbq-hl-border: linear-gradient(to top right, #28c83f, #1ca388) 0 0 0 2;
  --pbq-box-shadow: 0px 0px 10px #161616;

  /* 搜索框 */
  --searchbar-bg: #fff;
  --search-btn-bg: #fff;
  --search-btn-svg-color: var(--svg-color);
  --searchbar-text-color: #313131;
  --searchbar-border-color: #313131;

  --search-btn-hover-bg: var(--search-btn-bg);
  --search-btn-hover-svg-color: var(--hl-color);

  /* 通知消息 */
  --ntf-bg: var(--ctx-menu-bg);
  --ntf-text-color: var(--text-color);
  --ntf-border-color: var(--ctx-menu-border-color);
  /* 加载中遮盖 */
  --loading-mask-bg: linear-gradient(90deg, #eee 8%, #ddd 18%, #eee 33%);
  --error-color: red;

  --checkbox-bg: #fff;
  --logo-bg: var(--btn-bg);
  --logo-text-bg: #fff;
  --logo-text-color: #1ca388;

  --category-view-border: 0.5px solid var(--main-left-border-color);
  --input-bg: var(--bg-color);
  --input-text-color: var(--text-color);
  --input-border-color: var(--main-left-border-color);
  --input-placeholder-color: #888;

  --back2top-btn-bg: var(--btn-hover-bg);
  --back2top-btn-svg-color: #fff;

  /* 音效 */
  --seview-bg: var(--bg-color);
  --seview-left-bg: #eee;
  --seview-border: 1px solid #eee;
  --seview-list-item-bg: #f3f3f3;
  --seview-list-item-color: var(--text-color);
}

:root[theme='light'] {
  /* 全局背景 */
  --bg-color: #fff;
  --app-bg: var(--bg-color);
  --main-left-bg: linear-gradient(to bottom, #e7cddb, #e7d2d1, #e7cde3);
  --main-left-bg: #e7e1e3cb;
  --main-center-bg: var(--bg-color);
  /* 文本 */
  --text-color: #313131;
  --text-sub-color: #666;
  --text-subtitle-color: #a0a0a0;
  --hl-color: #e7e1e3;
  --hl-color: #b7b1b3;
  --hl-color: #979193;
  --hl-text-bg: #414141;
  --hl-title-color: #888;
  /* 歌词文本颜色 */
  --text-lyric-color: #666;
  /* 按钮 */
  --svg-color: #676163;
  --svg-hover-color: #888;
  --svg-text-color: #414141;
  --svg-btn-color: #414141;
  --svg-text-btn-rbtn-border: 0.1px solid #d7d1d3;
  --btn-bg: #e7e1e3cb;
  --btn-hover-bg: #d7d1d3cb !important;

  --toggle-btn-bg: #ddd;
  --toggle-thumb-bg: var(--hl-color);
  --toggle-btn-border-color: #ccc;
  --toggle-btn-active-bg: var(--hl-color);
  --toggle-active-thumb-bg: #fff;
  /* 进度条 */
  --progress-track-bg: linear-gradient(to right, #faf4f6, #faf4f6) !important;
  --progress-track-bg: linear-gradient(to right, #e7e1e3cb, #e7e1e3cb) !important;
  --progress-bg: linear-gradient(to top right, #c7c1c3, #c7c1c3) !important;
  --slider-thumb-bg: var(--svg-color);

  /*滚动条*/
  --scrollbar-thumb-bg: #878183;
  /* 列表项 hover */
  --list-item-hover: #faf4f6 !important;
  --list-item-active-bg: #c7c1c3;
  /* 边框 */
  --main-left-border-color: #ddd;
  --ctx-menu-bg: var(--bg-color);
  --ctx-menu-border-color: #ababab;
  --border-color: #faf4f6;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: transparent;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-text-color: var(--hl-text-bg);
  --pbq-hl-border: linear-gradient(to right, #676163, #e7e1e3) 0 0 0 2;
  --pbq-box-shadow: 0px 0px 10px #161616;

  /* 搜索框 */
  --searchbar-bg: #e7e1e3;
  --search-btn-bg: #e7e1e3;
  --search-btn-svg-color: var(--svg-color);
  --searchbar-text-color: var(--text-color);
  --searchbar-border-color: #e8e8e8;

  --search-btn-hover-bg: var(--search-btn-bg);
  --search-btn-hover-svg-color: var(--svg-hover-color);
  /* 通知消息 */
  --ntf-bg: var(--ctx-menu-bg);
  --ntf-bg: #e7e1e3;
  --ntf-text-color: var(--text-color);
  --ntf-border-color: var(--ctx-menu-border-color);
  /* 加载中遮盖 */
  --loading-mask-bg: linear-gradient(90deg, #eee 8%, #ddd 18%, #eee 33%);
  --error-color: red;

  --checkbox-bg: #fff;
  --logo-bg: #878183;
  --logo-text-bg: #fff;
  --logo-text-color: #878183;

  --category-view-border: 0.5px solid var(--main-left-border-color);
  --input-bg: var(--bg-color);
  --input-text-color: var(--text-color);
  --input-border-color: var(--main-left-border-color);
  --input-placeholder-color: #888;

  --back2top-btn-bg: var(--btn-hover-bg);
  --back2top-btn-svg-color: var(--svg-btn-color);

  /* 音效 */
  --seview-bg: var(--bg-color);
  --seview-left-bg: var(--main-left-bg);
  --seview-border: 1px solid #eee;
  --seview-list-item-bg: #f3f3f3;
  --seview-list-item-color: var(--text-color);
}

:root[theme='pink'] {
  /* 全局背景 */
  --bg-color: #fff;
  --app-bg: var(--bg-color);
  /* 文本 */
  --text-color: #212121;
  --text-sub-color: #666;
  --text-subtitle-color: #a0a0a0;
  --hl-color: #e667af;
  --hl-color: #fc589c;
  --hl-text-bg: linear-gradient(to top right, #e667af, #e6399b);
  --hl-title-color: var(--hl-color);
  /* 歌词文本颜色 */
  --text-lyric-color: #666;
  /* 按钮 */
  --svg-color: #414141;
  --svg-hover-color: var(--hl-color);
  --svg-text-color: #fff;
  --svg-btn-color: #fff;
  --btn-bg: linear-gradient(to top right, #e6399b, #e667af);
  --btn-hover-bg: linear-gradient(to top right, #e6399b, #992667) !important;

  --toggle-btn-bg: #989898;
  --toggle-thumb-bg: #ccc;
  --toggle-btn-border-color: #ccc;
  --toggle-btn-active-bg: var(--hl-color);
  --toggle-active-thumb-bg: #fff;
  /* 进度条 */
  --progress-track-bg: linear-gradient(to right, #999, #ccc) !important;
  --progress-track-bg: linear-gradient(to right, #ccc, #ccc) !important;
  --progress-bg: linear-gradient(to top right, #e667af, #e6399b);
  --slider-thumb-bg: var(--svg-color);
  /*滚动条*/
  --scrollbar-thumb-bg: #999;
  /* 列表项 hover */
  --list-item-hover: #eee !important;
  --list-item-active-bg: var(--btn-bg);
  /* 边框 */
  --main-left-border-color: #ddd;
  --ctx-menu-bg: var(--bg-color);
  --ctx-menu-border-color: #ababab;
  --border-color: #f4f4f4;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: #f8f8f8;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-text-color: var(--hl-text-bg);
  --pbq-hl-border: linear-gradient(to right, #e6399b, #e667af) 0 0 0 2;
  --pbq-box-shadow: 0px 0px 10px #161616;

  /* 搜索框 */
  --searchbar-bg: #e8e8e8;
  --search-btn-bg: #e8e8e8;
  --search-btn-svg-color: var(--svg-color);
  --searchbar-text-color: #313131;
  --searchbar-border-color: #e8e8e8;

  --search-btn-hover-bg: var(--search-btn-bg);
  --search-btn-hover-svg-color: var(--hl-color);
  /* 通知消息 */
  --ntf-bg: var(--ctx-menu-bg);
  --ntf-text-color: var(--text-color);
  --ntf-border-color: var(--ctx-menu-border-color);
  /* 加载中遮盖 */
  --loading-mask-bg: linear-gradient(90deg, #eee 8%, #ddd 18%, #eee 33%);
  --error-color: red;

  --checkbox-bg: #fff;
  --logo-bg: var(--btn-bg);
  --logo-text-bg: #fff;
  --logo-text-color: var(--hl-color);

  --category-view-border: 0.5px solid var(--main-left-border-color);
  --input-bg: var(--bg-color);
  --input-text-color: var(--text-color);
  --input-border-color: var(--main-left-border-color);
  --input-placeholder-color: #888;

  --back2top-btn-bg: var(--btn-hover-bg);
  --back2top-btn-svg-color: #fff;

  /* 音效 */
  --seview-bg: var(--bg-color);
  --seview-left-bg: #eee;
  --seview-border: 1px solid #eee;
  --seview-list-item-bg: #f3f3f3;
  --seview-list-item-color: var(--text-color);
}

:root[theme='pink2'] {
  /* 全局背景 */
  --bg-color: #252025;
  --app-bg: var(--bg-color);
  /* 文本 */
  --text-color: #eaeaea;
  --text-sub-color: #989898;
  --text-subtitle-color: #666;
  --hl-color: #fc589c;
  --hl-text-bg: linear-gradient(to top right, #fc589c, #e6399b);
  --hl-title-color: var(--hl-color);
  /* 歌词文本颜色 */
  --text-lyric-color: #ccc;
  /* 按钮 */
  --svg-color: #eaeaea;
  --svg-hover-color: var(--hl-color);
  --svg-text-color: #eaeaea;
  --svg-btn-color: #fff;
  --btn-bg: linear-gradient(to right, #e667af, #e6399b);
  --btn-bg: linear-gradient(to top right, #e6399b, #fc589c);
  --btn-hover-bg: linear-gradient(to top right, #fc589c, #992667) !important;

  --toggle-btn-bg: #454045;
  --toggle-thumb-bg: #ccc;
  --toggle-btn-border-color: #ccc;
  --toggle-btn-active-bg: var(--hl-color);
  --toggle-active-thumb-bg: #fff;
  /* 进度条 */
  --progress-track-bg: linear-gradient(to right, #555055, #555055) !important;
  --progress-bg: linear-gradient(to top right, #fc589c, #e6399b);
  --slider-thumb-bg: var(--svg-color);
  /*滚动条*/
  --scrollbar-thumb-bg: #555055;
  /* 列表项 hover */
  --list-item-hover: #353035 !important;
  --list-item-active-bg: var(--btn-bg);
  /* 边框 */
  --main-left-border-color: #000;
  --ctx-menu-bg: #353035;
  --ctx-menu-border-color: #000;
  --border-color: transparent;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: transparent;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-text-color: var(--hl-text-bg);
  --pbq-hl-border: linear-gradient(to right, #e6399b, #fc589c) 0 0 0 2;
  --pbq-box-shadow: 0px 0px 10px #000;

  /* 搜索框 */
  --searchbar-bg: #eee;
  --search-btn-bg: #eee;
  --search-btn-svg-color: var(--bg-color);
  --searchbar-text-color: #555;
  --searchbar-border-color: transparent;

  --search-btn-hover-bg: var(--search-btn-bg);
  --search-btn-hover-svg-color: var(--hl-color);

  /* 通知消息 */
  --ntf-bg: var(--ctx-menu-bg);
  --ntf-text-color: var(--text-color);
  --ntf-border-color: var(--ctx-menu-border-color);
  /* 加载中遮盖 */
  --loading-mask-bg: linear-gradient(90deg, #494949 8%, #595959 18%, #494949 33%);
  --error-color: red;
  --checkbox-bg: #eee;

  --logo-bg: var(--btn-bg);
  --logo-text-bg: #fff;
  --logo-text-color: var(--hl-color);

  --category-view-border: 0.5px solid var(--main-left-border-color);

  --input-bg: #454045;
  --input-text-color: var(--text-color);
  --input-border-color: var(--main-left-border-color);
  --input-border-color: #454045;
  --input-placeholder-color: #888;

  --back2top-btn-bg: var(--btn-hover-bg);
  --back2top-btn-svg-color: #fff;

  /* 音效 */
  --seview-bg: #292929;
  --seview-left-bg: #313131;
  --seview-border: 1px solid var(--main-left-border-color);
  --seview-list-item-bg: #2f2f2f;
  --seview-list-item-color: var(--text-color);
}

:root[theme='pink-red'] {
  /* 全局背景 */
  --bg-color: #fff;
  --app-bg: linear-gradient(to top, #ba5776, #fc99a7);
  /* 文本 */
  --text-color: #fff;
  --text-sub-color: #eee;
  --text-subtitle-color: #ccc;
  --hl-color: #fff;
  --hl-text-bg: linear-gradient(to top right, #fc7688, #f84860);
  --hl-text-bg: #fff;
  --hl-title-color: var(--hl-color);
  /* 歌词文本颜色 */
  --text-lyric-color: #eee;
  /* 按钮 */
  --svg-color: #fff;
  --svg-hover-color: var(--hl-color);
  --svg-text-color: #fc7688;
  --svg-btn-color: #fc7688;
  --btn-bg: linear-gradient(to right, #ba5776, #f84860);
  --btn-bg: linear-gradient(to right, #eee, #fff);
  /*--btn-hover-bg: linear-gradient(to top right, #f84860, #fc7688) !important;*/
  --btn-hover-bg: linear-gradient(to top right, #f84860, #fc99a7) !important;
  --btn-hover-bg: linear-gradient(to top right, #ddd, #fff) !important;

  --toggle-btn-bg: #989898;
  --toggle-thumb-bg: #ccc;
  --toggle-btn-border-color: #ccc;
  --toggle-btn-active-bg: #fc7688;
  --toggle-active-thumb-bg: #fff;
  /* 进度条 */
  --progress-track-bg: linear-gradient(to right, #ffffff56, #ffffff56) !important;
  --progress-bg: linear-gradient(to top right, #ba5776, #fc7688);
  --progress-bg: linear-gradient(to top right, #fff, #fff);
  --slider-thumb-bg: var(--svg-color);
  /*滚动条*/
  --scrollbar-thumb-bg: #eee;
  /* 列表项 hover */
  --list-item-hover: #16161633 !important;
  --list-item-active-bg: var(--btn-bg);
  /* 边框 */
  --main-left-border-color: #31313159;
  --ctx-menu-bg: #393939dc;
  --ctx-menu-border-color: transparent;
  --border-color: transparent;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: transparent;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-text-color: #ffcdd2;
  --pbq-hl-text-color: #fff;
  --pbq-hl-border: linear-gradient(to top right, #f84860, #fc7688) 0 0 0 2;
  --pbq-hl-border: linear-gradient(to top right, #fff, #fff) 0 0 0 2;
  --pbq-box-shadow: 0px 0px 10px #161616;

  /* 搜索框  */
  --searchbar-bg: #fff;
  --search-btn-bg: var(--btn-bg);
  --search-btn-svg-color: var(--svg-btn-color);
  --searchbar-text-color: #555;
  --searchbar-border-color: transparent;

  --search-btn-hover-bg: var(--btn-hover-bg);
  --search-btn-hover-svg-color: var(--search-btn-svg-color);

  /* 通知消息 */
  --ntf-bg: var(--ctx-menu-bg);
  --ntf-text-color: var(--text-color);
  --ntf-border-color: var(--ctx-menu-border-color);
  /* 加载中遮盖 */
  --loading-mask-bg: linear-gradient(90deg, #ffffffab 8%, #ffffff88 18%, #ffffffab 33%);
  --error-color: red;

  --checkbox-bg: #161616ab;
  --logo-bg: var(--btn-bg);
  --logo-text-bg: #fc7688;
  --logo-text-color: #fff;

  --category-view-border: 0.5px solid var(--main-left-border-color);
  --input-bg: #16161633;
  --input-text-color: var(--text-color);
  --input-border-color: var(--main-left-border-color);
  --input-placeholder-color: #ccc;

  --back2top-btn-bg: var(--btn-hover-bg);
  --back2top-btn-svg-color: var(--svg-btn-color);

  /* 音效 */
  --seview-bg: var(--main-left-bg);
  --seview-bg: var(--app-bg);
  --seview-left-bg: #16161625;
  --seview-border: 1px solid var(--main-left-border-color);
  --seview-list-item-bg: #16161616;
  --seview-list-item-color: var(--text-color);
}

:root[theme='red'] {
  /* 全局背景 */
  --bg-color: #fff;
  --app-bg: linear-gradient(to top, #f9453f, #c43631);
  --app-bg: var(--bg-color);
  /* 文本 */
  --text-color: #313131;
  --text-sub-color: #666;
  --text-subtitle-color: #999;
  --hl-color: #f9453f;
  --hl-color: #f7314d;
  --hl-text-bg: linear-gradient(to top right, #f84860, #f7314d);
  --hl-title-color: var(--hl-color);
  /* 歌词文本颜色 */
  --text-lyric-color: #666;
  /* 按钮 */
  --svg-color: #212121;
  --svg-hover-color: var(--hl-color);
  --svg-text-color: #fff;
  --svg-btn-color: #fff;
  --svg-text-btn-rbtn-border: 0.1px solid transparent;
  --btn-bg: linear-gradient(to right, #f84860, #f7314d);
  --btn-hover-bg: linear-gradient(to right, #f7314d, #c43631) !important;

  --toggle-btn-bg: #989898;
  --toggle-thumb-bg: #ccc;
  --toggle-btn-border-color: #ccc;
  --toggle-btn-active-bg: #f7314d;
  --toggle-active-thumb-bg: #fff;
  /* 进度条 */
  --progress-track-bg: linear-gradient(to right, #e7e1e3, #e7e1e3) !important;
  --progress-bg: linear-gradient(to top right, #f7314d, #f84860);
  --slider-thumb-bg: var(--svg-color);

  /*滚动条*/
  --scrollbar-thumb-bg: #eee;
  /* 列表项 hover */
  --list-item-hover: #f7314d0f !important;
  --list-item-active-bg: var(--btn-bg);
  /* 边框 */
  --main-left-border-color: #31313159;
  --ctx-menu-bg: #fff;
  --ctx-menu-border-color: #181818;
  --border-color: transparent;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: transparent;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-text-color: #f7314d;
  --pbq-hl-border: linear-gradient(to top right, #f7314d, #f84860) 0 0 0 2;
  --pbq-box-shadow: 0px 0px 10px #161616;

  /* 搜索框  */
  --searchbar-bg: #fff;
  --search-btn-bg: var(--btn-bg);
  --search-btn-svg-color: var(--svg-btn-color);
  --searchbar-text-color: #555;
  --searchbar-border-color: #f7314d;

  --search-btn-hover-bg: var(--btn-hover-bg);
  --search-btn-hover-svg-color: var(--search-btn-svg-color);

  /* 通知消息 */
  --ntf-bg: var(--ctx-menu-bg);
  --ntf-text-color: var(--text-color);
  --ntf-border-color: var(--ctx-menu-border-color);
  /* 加载中遮盖 */
  --loading-mask-bg: linear-gradient(90deg, #eee 8%, #ddd 18%, #eee 33%);
  --error-color: red;

  --checkbox-bg: #fff;
  --logo-bg: var(--btn-bg);
  --logo-text-bg: #fff;
  --logo-text-color: var(--hl-color);

  --category-view-border: 0.5px solid var(--main-left-border-color);
  --input-bg: var(--bg-color);
  --input-text-color: var(--text-color);
  --input-border-color: var(--main-left-border-color);
  --input-placeholder-color: #ccc;

  --back2top-btn-bg: var(--btn-hover-bg);
  --back2top-btn-svg-color: #fff;

  /* 音效 */
  --seview-bg: var(--bg-color);
  --seview-left-bg: #eee;
  --seview-border: 1px solid #eee;
  --seview-list-item-bg: #f3f3f3;
  --seview-list-item-color: var(--text-color);
}

:root[theme='red2'] {
  /* 全局背景 */
  --bg-color: #21252b;
  --app-bg: linear-gradient(to top, #f9453f, #c43631);
  --app-bg: var(--bg-color);
  /* 文本 */
  --text-color: #ccc;
  --text-sub-color: #ababab;
  --text-subtitle-color: #666;
  --hl-color: #d53943;
  --hl-text-bg: linear-gradient(to top right, #f84860, #f9453f);
  --hl-text-bg: linear-gradient(to top right, #f84860, #d53943);
  --hl-title-color: var(--hl-color);
  /* 歌词文本颜色 */
  --text-lyric-color: #ccc;
  /* 按钮 */
  --svg-color: #ccc;
  --svg-hover-color: var(--hl-color);
  --svg-text-color: #ccc;
  --svg-btn-color: #ccc;
  --svg-text-btn-rbtn-border: 0.1px solid transparent;
  --btn-bg: linear-gradient(to right, #f84860, #f9453f);
  --btn-bg: linear-gradient(to right, #f84860, #d53943);
  --btn-hover-bg: linear-gradient(to right, #f9453f, #c43631) !important;
  --btn-hover-bg: linear-gradient(to right, #d53943, #c43631) !important;

  --toggle-btn-bg: #989898;
  --toggle-thumb-bg: #ccc;
  --toggle-btn-border-color: #ccc;
  --toggle-btn-active-bg: #d53943;
  --toggle-active-thumb-bg: #ddd;
  /* 进度条 */
  --progress-track-bg: linear-gradient(to right, #555, #555) !important;
  --progress-bg: linear-gradient(to top right, #f9453f, #f84860);
  --progress-bg: linear-gradient(to top right, #f9453f, #d53943);
  --slider-thumb-bg: var(--svg-color);
  /*滚动条*/
  --scrollbar-thumb-bg: #666;
  /* 列表项 hover */
  --list-item-hover: #f9453f33 !important;
  --list-item-active-bg: var(--btn-bg);
  /* 边框 */
  --main-left-border-color: #000;
  --ctx-menu-bg: #31353b;
  --ctx-menu-border-color: #000;
  --border-color: transparent;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: transparent;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-text-color: #f9453f;
  --pbq-hl-border: linear-gradient(to top right, #f9453f, #f84860) 0 0 0 2;
  --pbq-box-shadow: 0px 0px 10px #000;

  /* 搜索框  */
  --searchbar-bg: #ddd;
  --search-btn-bg: var(--btn-bg);
  --search-btn-svg-color: var(--svg-btn-color);
  --searchbar-text-color: #555;
  --searchbar-border-color: transparent;

  --search-btn-hover-bg: var(--btn-hover-bg);
  --search-btn-hover-svg-color: var(--search-btn-svg-color);

  /* 通知消息 */
  --ntf-bg: var(--ctx-menu-bg);
  --ntf-text-color: var(--text-color);
  --ntf-border-color: var(--ctx-menu-border-color);
  /* 加载中遮盖 */
  --loading-mask-bg: linear-gradient(90deg, #eee 8%, #ddd 18%, #eee 33%);
  --loading-mask-bg: linear-gradient(90deg, #414141 8%, #515151 18%, #414141 33%);
  --error-color: red;

  --checkbox-bg: #ddd;
  --logo-bg: var(--btn-bg);
  --logo-text-bg: #ccc;
  --logo-text-color: var(--hl-color);

  --category-view-border: 0.5px solid var(--main-left-border-color);
  --input-bg: #555;
  --input-text-color: var(--text-color);
  --input-border-color: var(--main-left-border-color);
  --input-border-color: #454045;
  --input-placeholder-color: #ccc;

  --back2top-btn-bg: var(--btn-hover-bg);
  --back2top-btn-svg-color: #fff;

  /* 音效 */
  --seview-bg: var(--ctx-menu-bg);
  --seview-left-bg: #21252b88;
  --seview-border: 1px solid var(--main-left-border-color);
  --seview-list-item-bg: #21252b66;
  --seview-list-item-color: var(--text-color);
}

:root[theme='green'] {
  /* 全局背景 */
  --bg-color: #cfdec3;
  --app-bg: var(--bg-color);
  --main-center-bg: #f9f8f3;
  --main-center-bg: #f1eee7;
  --main-center-bg: transparent;
  /* 文本 */
  --text-color: #282828;
  --text-sub-color: #464646;
  --text-subtitle-color: #999;
  --hl-color: #ffffff;
  --hl-color: #64903f;
  --hl-text-bg: #64903f;
  --hl-title-color: var(--hl-color);
  /* 歌词文本颜色 */
  --text-lyric-color: #666;
  /* 按钮 */
  --svg-color: #282828cb;
  --svg-hover-color: var(--hl-color);
  --svg-text-color: #ffffffcb;
  --svg-btn-color: #ffffffcb;
  --btn-bg: #64903fcb;
  --btn-hover-bg: linear-gradient(to top right, #64903fcb, #64903f) !important;

  --toggle-btn-bg: #989898;
  --toggle-thumb-bg: #ccc;
  --toggle-btn-border-color: #ccc;
  --toggle-btn-active-bg: #fff;
  --toggle-active-thumb-bg: var(--bg-color);
  --toggle-active-thumb-bg: #64903fcb;
  /* 进度条 */
  --progress-track-bg: linear-gradient(to right, #f1eee7, #f1eee7) !important;
  --progress-bg: linear-gradient(to top right, #666, #cfdec3);
  --progress-bg: linear-gradient(to right, #64903f, #64903f);
  --slider-thumb-bg: var(--svg-color);
  /*滚动条*/
  --scrollbar-thumb-bg: #919793;
  /* 列表项 hover */
  --list-item-hover: #ffffff36 !important;
  --list-item-active-bg: var(--btn-bg);
  /* 边框 */
  --main-left-border-color: #ababab;
  --ctx-menu-bg: #f1eee7;
  --ctx-menu-border-color: #ababab;
  --border-color: transparent;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: transparent;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-text-color: var(--hl-color);
  --pbq-hl-text-color: #64903f;
  --pbq-hl-border: linear-gradient(to top right, #64903f, #cfdec3) 0 0 0 2;
  --pbq-box-shadow: 0px 0px 10px #161616;

  /* 搜索框 */
  --searchbar-bg: #f1eee7;
  --search-btn-bg: #f1eee7;
  --search-btn-svg-color: var(--svg-color);
  --searchbar-text-color: #323232;
  --searchbar-border-color: transparent;

  --search-btn-hover-bg: var(--search-btn-bg);
  --search-btn-hover-svg-color: var(--hl-color);

  /* 通知消息 */
  --ntf-bg: var(--ctx-menu-bg);
  --ntf-text-color: var(--text-color);
  --ntf-border-color: var(--ctx-menu-border-color);
  /* 加载中遮盖 */
  --loading-mask-bg: linear-gradient(90deg, #eee 8%, #ddd 18%, #eee 33%);
  --loading-mask-bg: linear-gradient(90deg, #f1eee7 8%, #f9f8f3 18%, #f1eee7 33%);
  --error-color: red;

  --checkbox-bg: #161616ab;
  --logo-bg: var(--svg-color);
  --logo-bg: #74a04f;
  --logo-text-bg: #fff;
  --logo-text-color: var(--logo-bg);

  --category-view-border: 0.5px solid var(--main-left-border-color);
  --input-bg: #f1eee7;
  --input-text-color: var(--text-color);
  --input-border-color: var(--main-left-border-color);
  --input-placeholder-color: #888;

  --back2top-btn-bg: var(--btn-hover-bg);
  --back2top-btn-svg-color: var(--svg-btn-color);

  /* 音效 */
  --seview-bg: var(--bg-color);
  --seview-left-bg: #64903f25;
  --seview-border: 1px solid var(--main-left-border-color);
  --seview-list-item-bg: #f3f3f366;
  --seview-list-item-color: var(--text-color);
}

:root[theme='green2'] {
  /* 全局背景 */
  --bg-color: #fff;
  --app-bg: linear-gradient(to top right, #23600f, #22610e);
  --app-bg: #054a34;
  /*
  --main-left-bg: #919343;
  --main-center-bg: #e1e0a7;
  &/
  /* 文本 */
  --text-color: #e1e0a7;
  --text-color: #919343;
  --text-sub-color: #919343ab;
  --text-subtitle-color: #91934366;
  --hl-color: #e1e0a7;
  --hl-text-bg: #e1e0a7;
  --hl-title-color: var(--hl-color);
  /* 歌词文本颜色 */
  --text-lyric-color: #919343;
  /* 按钮 */
  --svg-color: #e1e0a7;
  --svg-color: #919343;
  --svg-hover-color: var(--hl-color);
  --svg-text-color: #919343;
  --svg-btn-color: #054a34;
  --btn-bg: #e1e0a7;
  --btn-hover-bg: linear-gradient(to top right, #919343, #e1e0a7) !important;

  --toggle-btn-bg: #91934333;
  --toggle-thumb-bg: #ababab;
  --toggle-btn-border-color: #ccc;
  --toggle-btn-active-bg: #e1e0a7;
  --toggle-active-thumb-bg: #054a34;
  /* 进度条 */
  --progress-track-bg: linear-gradient(to right, #91934333, #91934333) !important;
  --progress-bg: linear-gradient(to top right, #e1e0a7ab, #e1e0a7ab);
  --slider-thumb-bg: var(--svg-color);
  /*滚动条*/
  --scrollbar-thumb-bg: #91934366;
  /* 列表项 hover */
  --list-item-hover: #91934333 !important;
  --list-item-active-bg: var(--btn-bg);
  /* 边框 */
  --main-left-border-color: #91934356;
  --ctx-menu-bg: #fffffff8;
  --ctx-menu-border-color: #111;
  --border-color: transparent;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: transparent;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-text-color: var(--hl-color);
  --pbq-hl-border: linear-gradient(to top right, #919343, #e1e0a7) 0 0 0 2;
  --pbq-box-shadow: 0px 0px 10px #161616;

  /* 搜索框 */
  --searchbar-bg: #91934336;
  --search-btn-bg: #91934336;
  --search-btn-svg-color: var(--svg-color);
  --searchbar-text-color: #e1e0a7;
  --searchbar-border-color: transparent;

  --search-btn-hover-bg: var(--search-btn-bg);
  --search-btn-hover-svg-color: var(--hl-color);

  /* 通知消息 */
  --ntf-bg: var(--ctx-menu-bg);
  --ntf-text-color: var(--text-color);
  --ntf-border-color: var(--ctx-menu-border-color);
  /* 加载中遮盖 */
  --loading-mask-bg: linear-gradient(90deg, #e1e0a736 8%, #91934336 18%, #e1e0a736 33%);
  --error-color: red;

  --checkbox-bg: #919343ab;
  --logo-bg: var(--btn-bg);
  --logo-bg: #919343;
  --logo-text-bg: #054a34;
  --logo-text-bg: #fff;
  --logo-text-color: var(--logo-bg);
  --logo-text-color: #054a34;
  --logo-text-color: #919343;

  --category-view-border: 0.5px solid var(--main-left-border-color);
  --input-bg: #91934336;
  --input-text-color: var(--text-color);
  --input-border-color: var(--main-left-border-color);
  --input-placeholder-color: #888;

  --back2top-btn-bg: var(--btn-hover-bg);
  --back2top-btn-svg-color: var(--svg-btn-color);

  /* 音效 */
  --seview-bg: var(--ctx-menu-bg);
  --seview-left-bg: #919343;
  --seview-left-bg: #c1c373;
  --seview-border: 1px solid var(--main-left-border-color);
  --seview-list-item-bg: #f3f3f3;
  --seview-list-item-color: var(--text-color);
}

:root[theme='blue'] {
  /* 全局背景 */
  --bg-color: #fff;
  --app-bg: url('../../public/bg_blue.jpg');
  /* 文本 */
  --text-color: #161616;
  --text-sub-color: #434343;
  --text-subtitle-color: #888;
  --hl-color: #42a5f5;
  --hl-color: #0753cb;
  --hl-color: #2783fb;
  --hl-text-bg: linear-gradient(to top right, #2783fb, #0753cb);
  --hl-title-color: var(--hl-color);
  /* 歌词文本颜色 */
  --text-lyric-color: #666;
  /* 按钮 */
  --svg-color: #313131;
  --svg-color: #161616;
  --svg-hover-color: var(--hl-color);
  --svg-text-color: #fff;
  --svg-btn-color: #fff;
  --btn-bg: linear-gradient(to right, #2783fb, #2783fb);
  --btn-hover-bg: linear-gradient(to top right, #2783fb, #0753cb) !important;

  --toggle-btn-bg: #989898;
  --toggle-thumb-bg: #ccc;
  --toggle-btn-border-color: #ccc;
  --toggle-btn-active-bg: var(--hl-color);
  --toggle-active-thumb-bg: #fff;
  /* 进度条 */
  --progress-track-bg: linear-gradient(to right, #99999966, #99999966) !important;
  --progress-bg: linear-gradient(to top right, #0753cb, #2783fb);
  --slider-thumb-bg: var(--svg-color);
  /*滚动条*/
  --scrollbar-thumb-bg: #989898;
  /* 列表项 hover */
  --list-item-hover: #ffffff66 !important;
  --list-item-active-bg: var(--btn-bg);
  /* 边框 */
  --main-left-border-color: #888;
  --ctx-menu-bg: var(--bg-color);
  --ctx-menu-border-color: #ababab;
  --border-color: transparent;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: transparent;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-text-color: var(--hl-text-bg);
  --pbq-hl-border: linear-gradient(to top right, #2783fb, #2783fb) 0 0 0 2;
  --pbq-box-shadow: 0px 0px 10px #161616;

  /* 搜索框 */
  --searchbar-bg: #56ccf266;
  --search-btn-bg: #56ccf266;
  --search-btn-svg-color: var(--svg-btn-color);
  --search-btn-svg-color: var(--svg-color);
  --searchbar-text-color: #414141;
  --searchbar-border-color: transparent;
  --searchbar-placeholder-color: #686868;

  --search-btn-hover-bg: var(--search-btn-bg);
  --search-btn-hover-svg-color: var(--hl-color);

  /* 通知消息 */
  --ntf-bg: var(--ctx-menu-bg);
  --ntf-text-color: var(--text-color);
  --ntf-border-color: var(--ctx-menu-border-color);
  /* 加载中遮盖 */
  --loading-mask-bg: linear-gradient(90deg, #ffffffab 8%, #ffffff66 18%, #ffffffab 33%);
  --error-color: red;

  --checkbox-bg: #fff;
  --logo-bg: linear-gradient(to top right, #ababab, #fff);
  --logo-bg: #0753cb;
  --logo-text-bg: #fff;
  --logo-text-color: #0753cb;

  --category-view-border: 0.1px solid var(--main-left-border-color);
  --input-bg: #ffffffcb;
  --input-text-color: var(--text-color);
  --input-border-color: #ccc;
  --input-placeholder-color: #888;

  --back2top-btn-bg: var(--btn-hover-bg);
  --back2top-btn-svg-color: #fff;

  /* 音效 */
  --seview-bg: var(--app-bg);
  --seview-left-bg: #ffffff66;
  --seview-border: 1px solid #eee;
  --seview-list-item-bg: #ffffffcb;
  --seview-list-item-color: var(--text-color);
}

:root[theme='blue2'] {
  /* 全局背景 */
  --bg-color: #fff;
  --app-bg: linear-gradient(to bottom right, #cce3e9, #a8c5cb);
  ;
  /* 文本 */
  --text-color: #273b42;
  --text-sub-color: #375b62;
  --text-subtitle-color: #878b82;
  --hl-color: #c5d8de;
  --hl-color: #a8c5cb;
  --hl-color: #273b42;
  --hl-text-bg: linear-gradient(to right, #395a62, #395a62);
  --hl-title-color: var(--hl-color);
  /* 歌词文本颜色 */
  --text-lyric-color: #395a62;
  /* 按钮 */
  --svg-color: #395a62;
  --svg-hover-color: #273b42;
  --svg-text-color: #fff;
  --svg-btn-color: #fff;
  --btn-bg: linear-gradient(to right, #a0665a, #ca655c);
  --btn-bg: linear-gradient(to right, #395a62, #395a62);
  --btn-hover-bg: linear-gradient(to top right, #395a62, #273b42) !important;

  --toggle-btn-bg: #979b92;
  --toggle-thumb-bg: #c7cbc2;
  --toggle-btn-border-color: #c7cbc2;
  --toggle-btn-active-bg: #395a62;
  --toggle-active-thumb-bg: #ffffffcb;
  /* 进度条 */
  --progress-track-bg: linear-gradient(to right, #ffffff99, #ffffff99) !important;
  --progress-bg: linear-gradient(to top right, #0a262aab, #0a262aab);
  --slider-thumb-bg: var(--svg-color);
  /*滚动条*/
  --scrollbar-thumb-bg: #395a6266;
  /* 列表项 hover */
  --list-item-hover: #91b6c0 !important;
  --list-item-active-bg: var(--btn-bg);
  /* 边框 */
  --main-left-border-color: #878b82;
  --ctx-menu-bg: var(--bg-color);
  --ctx-menu-border-color: #ababab;
  --border-color: transparent;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: transparent;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-text-color: #273b42;
  --pbq-hl-text-color: #172b32;
  --pbq-hl-border: linear-gradient(to top right, #395a62, #273b42) 0 0 0 2;
  --pbq-box-shadow: 0px 0px 10px #161616;

  /* 搜索框 */
  --searchbar-bg: #fff;
  --search-btn-bg: #fff;
  --search-btn-svg-color: var(--svg-btn-color);
  --search-btn-svg-color: var(--svg-color);
  --searchbar-text-color: #414141;
  --searchbar-border-color: transparent;
  --searchbar-placeholder-color: #686868;
  --searchbar-placeholder-color: #878b82;

  --search-btn-hover-bg: var(--search-btn-bg);
  --search-btn-hover-svg-color: var(--hl-color);

  /* 通知消息 */
  --ntf-bg: var(--ctx-menu-bg);
  --ntf-text-color: var(--text-color);
  --ntf-border-color: var(--ctx-menu-border-color);
  /* 加载中遮盖 */
  --loading-mask-bg: linear-gradient(90deg, #91b6c088 8%, #91b6c055 18%, #91b6c088 33%);
  --error-color: red;

  --checkbox-bg: #fff;
  --logo-bg: #395a62;
  --logo-text-bg: #fff;
  --logo-text-color: var(--hl-color);

  --category-view-border: 0.1px solid var(--main-left-border-color);
  --input-bg: #ffffffcb;
  --input-text-color: var(--text-color);
  --input-border-color: #ccc;
  --input-placeholder-color: #878b82;

  --back2top-btn-bg: var(--btn-hover-bg);
  --back2top-btn-svg-color: #fff;

  /* 音效 */
  --seview-bg: var(--app-bg);
  --seview-left-bg: #ffffff36;
  --seview-border: 1px solid var(--main-left-border-color);
  --seview-list-item-bg: #ffffff25;
  --seview-list-item-color: var(--text-color);
}

:root[theme='blue3'] {
  /* 全局背景 */
  --bg-color: #eee;
  --app-bg: linear-gradient(to bottom, #4a6fb3, #627fb7, #98a7c6, #98a7c6, #627fb7, #4a6fb3);
  /* 文本 */
  --text-color: #0a0322;
  --text-sub-color: #3a3332;
  --text-subtitle-color: #5a5352;
  --hl-color: #0a0322;
  --hl-text-bg: linear-gradient(to right, #0a0322, #0a0322);
  --hl-title-color: var(--hl-color);
  /* 歌词文本颜色 */
  --text-lyric-color: #3a3332;
  /* 按钮 */
  --svg-color: #132322;
  --svg-hover-color: #233332;
  --svg-text-color: #fff;
  --svg-btn-color: #fff;
  --btn-bg: linear-gradient(to right, #344a83, #2a3d9b, #3e53be, #263b7a);
  --btn-hover-bg: linear-gradient(to right, #344a83, #2a3d9b, #3e53be, #263b7a) !important;

  --toggle-btn-bg: var(--bg-color);
  --toggle-thumb-bg: #ababab;
  --toggle-btn-border-color: #ababab;
  --toggle-btn-active-bg: var(--btn-bg);
  --toggle-active-thumb-bg: var(--bg-color);
  /* 进度条 */
  --progress-track-bg: linear-gradient(to right, #ffffff99, #ffffff99) !important;
  --progress-bg: linear-gradient(to top right, #263b7a, #263b7a);
  --slider-thumb-bg: var(--svg-color);
  /*滚动条*/
  --scrollbar-thumb-bg: #263b7acb;
  /* 列表项 hover */
  --list-item-hover: linear-gradient(to right, #344a8336, #2a3d9b36, #3e53be36, #263b7a36) !important;
  --list-item-active-bg: var(--btn-bg);
  /* 边框 */
  --main-left-border-color: #18181866;
  --ctx-menu-bg: var(--bg-color);
  --ctx-menu-border-color: #18181866;
  --border-color: transparent;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: transparent;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-text-color: #182626;
  --pbq-hl-text-color: #fff;
  --pbq-hl-border: linear-gradient(to top right, #fff, #fff) 0 0 0 2;
  --pbq-box-shadow: 0px 0px 10px #161616;

  /* 搜索框 */
  --searchbar-bg: var(--bg-color);
  --search-btn-bg: var(--bg-color);
  --search-btn-svg-color: var(--svg-color);
  --searchbar-text-color: #0a0322;
  --searchbar-border-color: transparent;
  --searchbar-placeholder-color: #686868;

  --search-btn-hover-bg: var(--search-btn-bg);
  --search-btn-hover-svg-color: var(--hl-color);

  /* 通知消息 */
  --ntf-bg: var(--ctx-menu-bg);
  --ntf-text-color: var(--text-color);
  --ntf-border-color: var(--ctx-menu-border-color);
  /* 加载中遮盖 */
  --loading-mask-bg: linear-gradient(90deg, #263b7a66 8%, #263b7a36 18%, #263b7a66 33%);
  --error-color: red;

  --checkbox-bg: #fff;
  --logo-bg: linear-gradient(to right, #344a83, #2a3d9b, #3e53be, #263b7a);
  --logo-text-bg: #fff;
  --logo-text-color: var(--hl-color);

  --category-view-border: 0.1px solid var(--main-left-border-color);
  --input-bg: #ffffffcb;
  --input-text-color: var(--text-color);
  --input-border-color: #ccc;
  --input-placeholder-color: #878b82;

  --back2top-btn-bg: var(--btn-hover-bg);
  --back2top-btn-svg-color: #fff;

  /* 音效 */
  --seview-bg: var(--bg-color);
  --seview-left-bg: var(--main-left-bg);
  --seview-border: 1px solid #eee;
  --seview-list-item-bg: #f3f3f3;
  --seview-list-item-color: var(--text-color);
}

:root[theme='yellow'] {
  /* 全局背景 */
  --bg-color: #fff;
  --app-bg: var(--bg-color);
  /* 文本 */
  --text-color: #000;
  --text-sub-color: #333;
  --text-subtitle-color: #999;
  --hl-color: #ffb300;
  --hl-text-bg: #ffb300;
  --hl-title-color: var(--hl-color);
  /* 歌词文本颜色 */
  --text-lyric-color: #888;
  /* 按钮 */
  --svg-color: #000;
  --svg-hover-color: var(--hl-color);
  --svg-text-color: #fff;
  --svg-btn-color: #fff;
  --svg-text-btn-rbtn-border: 0.1px solid #eee;
  --btn-bg: #ffb300;
  --btn-hover-bg: #ffb300;

  --toggle-btn-bg: #989898;
  --toggle-thumb-bg: #ccc;
  --toggle-btn-border-color: #ccc;
  --toggle-btn-active-bg: var(--hl-color);
  --toggle-active-thumb-bg: #fff;
  /* 进度条 */
  --progress-track-bg: #cbcbcb;
  --progress-track-bg: #ddd;
  --progress-bg: #ffb300;
  --slider-thumb-bg: var(--svg-color);

  /*滚动条*/
  --scrollbar-thumb-bg: #cbcbcb;
  /* 列表项 hover */
  --list-item-hover: #ffb30025;
  --list-item-active-bg: var(--btn-bg);
  /* 边框 */
  --main-left-border-color: #ccc;
  --ctx-menu-bg: var(--bg-color);
  --ctx-menu-border-color: #ababab;
  --border-color: transparent;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: transparent;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-text-color: var(--hl-text-bg);
  --pbq-hl-border: linear-gradient(to top right, #ffb300, #ffb300) 0 0 0 2;
  --pbq-box-shadow: 0px 0px 10px #161616;

  /* 搜索框 */
  --searchbar-bg: #ffb30066;
  --searchbar-bg: #fff;
  --search-btn-bg: var(--btn-bg);
  --search-btn-svg-color: var(--svg-btn-color);
  --searchbar-text-color: #414141;
  --searchbar-border-color: var(--hl-color);
  --searchbar-placeholder-color: #686868;

  --search-btn-hover-bg: var(--btn-hover-bg);
  --search-btn-hover-svg-color: var(--search-btn-svg-color);

  /* 通知消息 */
  --ntf-bg: var(--ctx-menu-bg);
  --ntf-text-color: var(--text-color);
  --ntf-border-color: var(--ctx-menu-border-color);
  /* 加载中遮盖 */
  --loading-mask-bg: linear-gradient(90deg, #ddddddab 8%, #cccccc88 18%, #ddddddab 33%);
  --error-color: red;

  --checkbox-bg: #fff;
  --logo-bg: #ffb300;
  --logo-text-bg: #fff;
  --logo-text-color: var(--hl-color);

  --category-view-border: 0.5px solid var(--main-left-border-color);
  --input-bg: var(--bg-color);
  --input-text-color: var(--text-color);
  --input-border-color: var(--main-left-border-color);
  --input-placeholder-color: #888;

  --back2top-btn-bg: var(--btn-hover-bg);
  --back2top-btn-svg-color: #fff;

  /* 音效 */
  --seview-bg: var(--bg-color);
  --seview-left-bg: #eee;
  --seview-border: 1px solid #eee;
  --seview-list-item-bg: #f3f3f3;
  --seview-list-item-color: var(--text-color);
}

:root[theme='yellow2'] {
  /* 全局背景 */
  --bg-color: #f9f3e9;
  --app-bg: var(--bg-color);
  /* 文本 */
  --text-color: #fff;
  --text-color: #000;
  --text-sub-color: #eee;
  --text-sub-color: #666;
  --text-subtitle-color: #bbb;
  --hl-color: #fc9b29;
  --hl-text-bg: #fc9b29;
  --hl-title-color: var(--hl-color);
  /* 歌词文本颜色 */
  --text-lyric-color: #888;
  /* 按钮 */
  --svg-color: #fff;
  --svg-color: #000;
  --svg-hover-color: var(--hl-color);
  --svg-text-color: #fff;
  --svg-btn-color: #fff;
  --svg-text-btn-rbtn-border: 0.1px solid #eee;
  --btn-bg: #fc9b29;
  --btn-hover-bg: #fc9b29;

  --toggle-btn-bg: #989898;
  --toggle-thumb-bg: #ccc;
  --toggle-btn-border-color: #ccc;
  --toggle-btn-active-bg: var(--hl-color);
  --toggle-active-thumb-bg: #fff;
  /* 进度条 */
  --progress-track-bg: #666;
  --progress-track-bg: #ddd;
  --progress-bg: #fc9b29;
  --slider-thumb-bg: var(--svg-color);

  /*滚动条*/
  --scrollbar-thumb-bg: #ababab;
  /* 列表项 hover */
  --list-item-hover: #ffb30025;
  --list-item-hover: #fc9b2925;
  --list-item-active-bg: var(--btn-bg);
  /* 边框 */
  --main-left-border-color: #181818;
  --main-left-border-color: #ccc;
  --ctx-menu-bg: #f9f3e9;
  --ctx-menu-border-color: #181818;
  --border-color: transparent;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: transparent;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-text-color: var(--hl-text-bg);
  --pbq-hl-border: linear-gradient(to top right, #fc9b29, #fc9b29) 0 0 0 2;
  --pbq-box-shadow: 0px 0px 10px #161616;

  /* 搜索框 */
  --searchbar-bg: #fff;
  --search-btn-bg: #fff;
  --search-btn-svg-color: #000;
  --searchbar-text-color: #000;
  --searchbar-border-color: transparent;
  --searchbar-placeholder-color: #686868;

  --search-btn-hover-bg: var(--search-btn-bg);
  --search-btn-hover-svg-color: var(--hl-color);

  /* 通知消息 */
  --ntf-bg: var(--ctx-menu-bg);
  --ntf-text-color: var(--text-color);
  --ntf-border-color: var(--ctx-menu-border-color);
  /* 加载中遮盖 */
  --loading-mask-bg: linear-gradient(90deg, #ddddddab 8%, #dddddd88 18%, #ddddddab 33%);
  --error-color: red;

  --checkbox-bg: #fff;
  --logo-bg: #ffb300;
  --logo-bg: #fc9b29;
  --logo-text-bg: #fff;
  --logo-text-color: var(--hl-color);

  --category-view-border: 0.5px solid var(--main-left-border-color);
  --input-bg: #fff;
  --input-text-color: var(--text-color);
  --input-border-color: var(--main-left-border-color);
  --input-placeholder-color: #888;

  --back2top-btn-bg: var(--btn-hover-bg);
  --back2top-btn-svg-color: #fff;

  /* 音效 */
  --seview-bg: #fff;
  --seview-left-bg: var(--app-bg);
  --seview-border: 1px solid var(--main-left-border-color);
  --seview-list-item-bg: #f3f3f3;
  --seview-list-item-color: var(--text-color);
}

:root[theme='black'] {
  /* 全局背景 */
  --bg-color: #fff;
  --app-bg: var(--bg-color);
  /* 文本 */
  --text-color: #000;
  --text-sub-color: #333;
  --text-subtitle-color: #999;
  --hl-color: #000;
  --hl-text-bg: #000;
  --hl-title-color: var(--hl-color);
  /* 歌词文本颜色 */
  --text-lyric-color: #999;
  /* 按钮 */
  --svg-color: #000;
  --svg-text-color: #fff;
  --svg-btn-color: #fff;
  --svg-text-btn-rbtn-border: 0.1px solid #ccc;
  --btn-bg: #000;
  --btn-hover-bg: #000;

  --toggle-btn-bg: #989898;
  --toggle-thumb-bg: #ccc;
  --toggle-btn-border-color: #ccc;
  --toggle-btn-active-bg: var(--hl-color);
  --toggle-active-thumb-bg: #fff;
  /* 进度条 */
  --progress-track-bg: #ccc;
  --progress-bg: #000;
  --slider-thumb-bg: var(--svg-color);

  /*滚动条*/
  --scrollbar-thumb-bg: #ccc;
  /* 列表项 hover */
  --list-item-hover: #00000010;
  /* 边框 */
  --main-left-border-color: #ccc;
  --ctx-menu-bg: var(--bg-color);
  --ctx-menu-border-color: #ababab;
  --border-color: transparent;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: transparent;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-text-color: var(--hl-text-bg);
  --pbq-hl-border: linear-gradient(to top right, #000, #000) 0 0 0 2;
  --pbq-box-shadow: 0px 0px 10px #161616;

  /* 搜索框 */
  --searchbar-bg: #fff;
  --search-btn-bg: var(--btn-bg);
  --search-btn-svg-color: var(--svg-btn-color);
  --searchbar-text-color: #000;
  --searchbar-border-color: var(--hl-color);
  --searchbar-placeholder-color: #686868;

  --search-btn-hover-bg: var(--btn-hover-bg);
  --search-btn-hover-svg-color: var(--search-btn-svg-color);

  /* 通知消息 */
  --ntf-bg: var(--ctx-menu-bg);
  --ntf-text-color: var(--text-color);
  --ntf-border-color: var(--ctx-menu-border-color);
  /* 加载中遮盖 */
  --loading-mask-bg: linear-gradient(90deg, #ddd 8%, #ccc 18%, #ddd 33%);
  --error-color: red;

  --checkbox-bg: #fff;
  --logo-bg: #000;
  --logo-text-bg: #fff;
  --logo-text-color: var(--hl-color);

  --category-view-border: 0.5px solid var(--main-left-border-color);
  --input-bg: var(--bg-color);
  --input-text-color: var(--text-color);
  --input-border-color: var(--main-left-border-color);
  --input-placeholder-color: #888;

  --back2top-btn-bg: var(--btn-hover-bg);
  --back2top-btn-svg-color: #fff;

  /* 音效 */
  --seview-bg: var(--bg-color);
  --seview-left-bg: var(--main-left-bg);
  --seview-border: 1px solid #eee;
  --seview-list-item-bg: #f3f3f3;
  --seview-list-item-color: var(--text-color);
}

:root[theme='purple'] {
  /* 全局背景 */
  --bg-color: #fff;
  --app-bg: var(--bg-color);
  /* 文本 */
  --text-color: #000;
  --text-sub-color: #333;
  --text-subtitle-color: #999;
  --hl-color: #9c27b0;
  --hl-text-bg: #9c27b0;
  --hl-title-color: var(--hl-color);
  /* 歌词文本颜色 */
  --text-lyric-color: #888;
  /* 按钮 */
  --svg-color: #000;
  --svg-hover-color: var(--hl-color);
  --svg-text-color: #fff;
  --svg-btn-color: #fff;
  --svg-text-btn-rbtn-border: 0.1px solid transparent;
  --btn-bg: #9c27b0;
  --btn-hover-bg: #9c27b0;

  --toggle-btn-bg: #989898;
  --toggle-thumb-bg: #ccc;
  --toggle-btn-border-color: #ccc;
  --toggle-btn-active-bg: var(--hl-color);
  --toggle-active-thumb-bg: #fff;
  /* 进度条 */
  --progress-track-bg: #cbcbcb;
  --progress-track-bg: #ddd;
  --progress-bg: #9c27b0;
  --slider-thumb-bg: var(--svg-color);

  /*滚动条*/
  --scrollbar-thumb-bg: #cbcbcb;
  /* 列表项 hover */
  --list-item-hover: #9c27b025;
  --list-item-active-bg: var(--btn-bg);
  /* 边框 */
  --main-left-border-color: #ccc;
  --ctx-menu-bg: var(--bg-color);
  --ctx-menu-border-color: #ababab;
  --border-color: transparent;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: transparent;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-text-color: var(--hl-text-bg);
  --pbq-hl-border: linear-gradient(to top right, #9c27b0, #9c27b0) 0 0 0 2;
  --pbq-box-shadow: 0px 0px 10px #161616;

  /* 搜索框 */
  --searchbar-bg: #ffb30066;
  --searchbar-bg: #fff;
  --search-btn-bg: var(--btn-bg);
  --search-btn-svg-color: var(--svg-btn-color);
  --searchbar-text-color: #414141;
  --searchbar-border-color: var(--hl-color);
  --searchbar-placeholder-color: #686868;

  --search-btn-hover-bg: var(--btn-hover-bg);
  --search-btn-hover-svg-color: var(--search-btn-svg-color);

  /* 通知消息 */
  --ntf-bg: var(--ctx-menu-bg);
  --ntf-text-color: var(--text-color);
  --ntf-border-color: var(--ctx-menu-border-color);
  /* 加载中遮盖 */
  --loading-mask-bg: linear-gradient(90deg, #ddddddab 8%, #cccccc88 18%, #ddddddab 33%);
  --error-color: red;

  --checkbox-bg: #fff;
  --logo-bg: #9c27b0;
  --logo-color: #ffb300;
  --logo-text-bg: #fff;
  --logo-text-color: var(--hl-color);

  --category-view-border: 0.5px solid var(--main-left-border-color);
  --input-bg: var(--bg-color);
  --input-text-color: var(--text-color);
  --input-border-color: var(--main-left-border-color);
  --input-placeholder-color: #888;

  --back2top-btn-bg: var(--btn-hover-bg);
  --back2top-btn-svg-color: #fff;

  /* 音效 */
  --seview-bg: var(--bg-color);
  --seview-left-bg: #eee;
  --seview-border: 1px solid #eee;
  --seview-list-item-bg: #f3f3f3;
  --seview-list-item-color: var(--text-color);
}

:root[theme='purple2'] {
  /* 全局背景 */
  --bg-color: #4d3e72;
  --app-bg: var(--bg-color);
  /* 文本 */
  --text-color: #fdfdf2;
  --text-sub-color: #ddd;
  --text-subtitle-color: #ababab;
  --hl-color: #fff;
  --hl-color: #e5bc8c;
  --hl-text-bg: #fdfdf2;
  --hl-title-color: var(--hl-color);
  /* 歌词文本颜色 */
  --text-lyric-color: #999;
  /* 按钮 */
  --svg-color: #fdfdf2;
  --svg-hover-color: var(--hl-color);
  --svg-text-color: #4d3e72;
  --svg-btn-color: #4d3e72;
  --svg-text-btn-rbtn-border: 0.1px solid transparent;
  --btn-bg: #fdfdf2;
  --btn-bg: #e5bc8c;
  --btn-hover-bg: #ce9252;
  --btn-hover-bg: #c59c6c;

  --toggle-btn-bg: #fdfdf2ab;
  --toggle-thumb-bg: #666;
  --toggle-btn-border-color: #ccc;
  --toggle-btn-active-bg: var(--hl-color);
  --toggle-active-thumb-bg: #fdfdf2;
  /* 进度条 */
  --progress-track-bg: #cbcbcb;
  --progress-bg: #57457e;
  --progress-bg: #e5bc8c;
  --slider-thumb-bg: var(--svg-color);

  /*滚动条*/
  --scrollbar-thumb-bg: #cbcbcb;
  /* 列表项 hover */
  --list-item-hover: #fdfdf225;
  --list-item-active-bg: var(--btn-bg);
  /* 边框 */
  --main-left-border-color: #181818;
  --ctx-menu-bg: #e5bc8c;
  --ctx-menu-bg: #57457e;
  --ctx-menu-border-color: #181818;
  --border-color: transparent;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: transparent;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-text-color: #e5bc8c;
  --pbq-hl-border: linear-gradient(to top right, #e5bc8c, #e5bc8c) 0 0 0 2;
  --pbq-box-shadow: 0px 0px 10px #161616;

  /* 搜索框 */
  --searchbar-bg: #fdfdf2;
  --search-btn-bg: #fdfdf2;
  --search-btn-svg-color: #ce9252;
  --search-btn-svg-color: #4d3e72;
  --searchbar-text-color: #414141;
  --searchbar-border-color: transparent;
  --searchbar-placeholder-color: #686868;

  --search-btn-hover-bg: var(--search-btn-bg);
  --search-btn-hover-svg-color: #e5bc8c;

  /* 通知消息 */
  --ntf-bg: var(--ctx-menu-bg);
  --ntf-text-color: var(--text-color);
  --ntf-border-color: var(--ctx-menu-border-color);
  /* 加载中遮盖 */
  --loading-mask-bg: linear-gradient(90deg, #fdfdf2ab 8%, #fdfdf288 18%, #fdfdf2ab 33%);
  --error-color: red;

  --checkbox-bg: #4d3e72;
  --logo-bg: #e5bc8c;
  --logo-color: #4d3e72;
  --logo-text-bg: #fff;
  --logo-text-color: var(--hl-color);
  --logo-text-color: #4d3e72;

  --category-view-border: 0.5px solid var(--main-left-border-color);
  --input-bg: var(--bg-color);
  --input-text-color: var(--text-color);
  --input-border-color: var(--main-left-border-color);
  --input-border-color: #fdfdf266;
  --input-placeholder-color: #888;

  --back2top-btn-bg: var(--btn-hover-bg);
  --back2top-btn-svg-color: #fff;

  /* 音效 */
  --seview-bg: var(--ctx-menu-bg);
  --seview-left-bg: var(--app-bg);
  --seview-border: 1px solid var(--main-left-border-color);
  --seview-list-item-bg: var(--app-bg);
  --seview-list-item-color: var(--text-color);
}

:root[theme='purple3'] {
  /* 全局背景 */
  --bg-color: #5f3d70;
  --app-bg: linear-gradient(to bottom, #543650, #5f3d70, #230931);
  --main-left-bg: #31253325;
  /* 文本 */
  --text-color: #fdfdf2;
  --text-sub-color: #ddd;
  --text-subtitle-color: #ababab;
  --hl-color: #ff0307cb;
  --hl-text-bg: #fdfdf2;
  --hl-title-color: var(--hl-color);
  /* 歌词文本颜色 */
  --text-lyric-color: #ccc;
  /* 按钮 */
  --svg-color: #fdfdf2;
  --svg-hover-color: var(--hl-color);
  --svg-text-color: #fff;
  --svg-btn-color: #fff;
  --svg-text-btn-rbtn-border: 0.1px solid transparent;
  --btn-bg: linear-gradient(to top right, #ff0307ee, #bd0e19ee);
  --btn-hover-bg: linear-gradient(to top right, #ff0307, #bd0e19);

  --toggle-btn-bg: #fdfdf2ab;
  --toggle-thumb-bg: #666;
  --toggle-btn-border-color: #ccc;
  --toggle-btn-active-bg: var(--hl-color);
  --toggle-active-thumb-bg: #fdfdf2;
  /* 进度条 */
  --progress-track-bg: #cbcbcb;
  --progress-bg: linear-gradient(to right, #ff0307cb, #bd0e19cb);
  --slider-thumb-bg: var(--svg-color);

  /*滚动条*/
  --scrollbar-thumb-bg: #cbcbcb;
  /* 列表项 hover */
  --list-item-hover: #fdfdf225;
  --list-item-active-bg: var(--btn-bg);
  /* 边框 */
  --main-left-border-color: #181818;
  --ctx-menu-bg: #5f3d70;
  --ctx-menu-border-color: #181818;
  --border-color: transparent;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: transparent;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-text-color: var(--hl-color);
  --pbq-hl-border: linear-gradient(to top right, #ff0307, #ff0307) 0 0 0 2;
  --pbq-box-shadow: 0px 0px 10px #161616;

  /* 搜索框 */
  --searchbar-bg: #fdfdf2;
  --search-btn-bg: #fdfdf2;
  --search-btn-svg-color: #414141;
  --searchbar-text-color: #414141;
  --searchbar-border-color: transparent;
  --searchbar-placeholder-color: #686868;

  --search-btn-hover-bg: var(--search-btn-bg);
  --search-btn-hover-svg-color: #ff0307;

  /* 通知消息 */
  --ntf-bg: var(--ctx-menu-bg);
  --ntf-text-color: var(--text-color);
  --ntf-border-color: var(--ctx-menu-border-color);
  /* 加载中遮盖 */
  --loading-mask-bg: linear-gradient(90deg, #f8ce89ab 8%, #c38f55 18%, #f8ce89ab 33%);
  --error-color: red;

  --checkbox-bg: #4d3e72;
  --logo-bg: #8c6293;
  --logo-color: #f7f2f6;
  --logo-text-bg: #fff;
  --logo-text-color: var(--hl-color);

  --category-view-border: 0.5px solid var(--main-left-border-color);
  --input-bg: var(--bg-color);
  --input-text-color: var(--text-color);
  --input-border-color: var(--main-left-border-color);
  --input-border-color: #fdfdf266;
  --input-placeholder-color: #888;

  --back2top-btn-bg: var(--btn-hover-bg);
  --back2top-btn-svg-color: #fff;

  /* 音效 */
  --seview-bg: var(--bg-color);
  --seview-left-bg: var(--main-left-bg);
  --seview-border: 1px solid #eee;
  --seview-list-item-bg: #f3f3f3;
  --seview-list-item-color: var(--text-color);
}

/*
svg {
    fill: var(--svg-color);
    cursor: pointer;
}

svg:hover {
    fill: var(--svg-hover-color);
}
*/

/* 滚动条 */
::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb-bg);
  border: 1px solid var(--scrollbar-thumb-bg);
  width: var(--scrollbar-width);
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
  background: var(--loading-mask-bg);
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