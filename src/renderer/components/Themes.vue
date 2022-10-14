<script setup>
import { inject, onBeforeMount } from 'vue';
import CssReset from './CssReset.vue';
import CssCommon from './CssCommon.vue';
import EventBus from '../../common/EventBus';
import { useSettingStore } from '../store/settingStore';

const { getCurrentThemeId } = useSettingStore()

//TODO设置主题
const setupAppTheme = (themeId) => {
  themeId = themeId || 'dark'
  themeId = themeId.trim()
  document.documentElement.setAttribute('theme', themeId)
}

/* @vite-ignore */
EventBus.on("switchTheme", themeId => setupAppTheme(themeId))

//TODO 直接在setup()时执行，不需要等待其他生命周期
setupAppTheme(getCurrentThemeId())
</script>

<template>
    <CssReset></CssReset>
    <CssCommon></CssCommon>
    <slot></slot>
</template>

<style>
:root {
  --text-family: system-ui, "PingFang SC", STHeitiSC-Medium, "Heiti SC Medium", "Heiti SC Light", "Microsoft YaHei", sans-serif;
  --text-size: 15px;
  --text-sub-size: 14px;
  --tab-title-text-size: 16px;
  --app-bg: transparent;
}

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
  /* 歌词文本颜色 */
  --text-lyric-color: #ccc;
  /* 按钮 */
  --svg-color: #eaeaea;
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
  /*滚动条*/
  --scrollbar-thumb-bg: #666;
  /* 列表项 hover */
  --list-item-hover: #464646 !important;
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
  /* 加载中遮盖 */
  --loading-mask-bg: linear-gradient(90deg, #414141 8%,#515151 18%,#414141 33%);
  --error-color: red;
  
  --checkbox-bg: #fff;
  --logo-bg: var(--btn-bg);
  --logo-color: var(--svg-btn-color);

  --category-view-border: 0.5px solid var(--main-left-border-color);
  --input-bg: #464646;
  --input-text-color: var(--text-color);
  --input-border-color: var(--main-left-border-color);
  --input-placeholder-color: #888;
}

:root[theme='light'] {
  /* 全局背景 */
  --bg-color: #fff;
  --app-bg: var(--bg-color);
  /* 文本 */
  --text-color: #212121;
  --text-sub-color: #666;
  --text-subtitle-color: #a0a0a0;
  --hl-color: #e667af;
  --hl-text-bg: linear-gradient(to top right, #e667af, #e6399b);
  /* 歌词文本颜色 */
  --text-lyric-color: #666;
  /* 按钮 */
  --svg-color: #414141;
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
  --btn-hover-bg: linear-gradient(to top right, #e6399b, #992667) !important;
  /*滚动条*/
  --scrollbar-thumb-bg: #999;
  /* 列表项 hover */
  --list-item-hover: #eee !important;
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
  --loading-mask-bg: linear-gradient(90deg,#eee 8%,#ddd 18%,#eee 33%);
  --error-color: red;
  
  --checkbox-bg: #fff;
  --logo-bg: var(--btn-bg);
  --logo-color: var(--svg-btn-color);

  --category-view-border: 0.5px solid var(--main-left-border-color);
  --input-bg: var(--bg-color);
  --input-text-color: var(--text-color);
  --input-border-color: var(--main-left-border-color);
  --input-placeholder-color: #888;
}

:root[theme='pink'] {
  /* 全局背景 */
  --bg-color: #393939;
  --app-bg: var(--bg-color);
  /* 文本 */
  --text-color: #eaeaea;
  --text-sub-color: #989898;
  --text-subtitle-color: #666;
  --hl-color: #fc589c;
  --hl-text-bg: linear-gradient(to top right, #fc589c, #e6399b);
  /* 歌词文本颜色 */
  --text-lyric-color: #ccc;
  /* 按钮 */
  --svg-color: #eaeaea;
  --svg-text-color: #eaeaea;
  --svg-btn-color: #fff;
  --btn-bg: linear-gradient(to right, #e667af, #e6399b);
  --btn-bg: linear-gradient(to top right, #e6399b, #fc589c);
  --btn-hover-bg: linear-gradient(to top right, #fc589c, #992667) !important;
  
  --toggle-btn-bg: #989898;
  --toggle-thumb-bg: #ccc;
  --toggle-btn-border-color: #ccc;
  --toggle-btn-active-bg: var(--hl-color);
  --toggle-active-thumb-bg: #fff;
  /* 进度条 */
  --progress-track-bg: linear-gradient(to right, #252525, #313131) !important;
  --progress-bg: linear-gradient(to top right, #fc589c, #e6399b);
  /*滚动条*/
  --scrollbar-thumb-bg: #212121;
  /* 列表项 hover */
  --list-item-hover: #464646 !important;
  /* 边框 */
  --main-left-border-color: #181818;
  --ctx-menu-bg: #494949;
  --ctx-menu-border-color: #181818;
  --border-color: #414141;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: #363636;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-text-color: var(--hl-text-bg);
  --pbq-hl-border: linear-gradient(to right, #e6399b, #fc589c) 0 0 0 2;

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
  --loading-mask-bg: linear-gradient(90deg, #494949 8%,#595959 18%,#494949 33%);
  --error-color: red;
  
  --checkbox-bg: #fff;

  --logo-bg: var(--btn-bg);
  --logo-color: var(--svg-btn-color);

  --category-view-border: 0.5px solid var(--main-left-border-color);
  
  --input-bg: #464646;
  --input-text-color: var(--text-color);
  --input-border-color: var(--main-left-border-color);
  --input-placeholder-color: #888;
}

:root[theme='red'] {
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
  /* 歌词文本颜色 */
  --text-lyric-color: #eee;
  /* 按钮 */
  --svg-color: #f84860;
  --svg-color: #fff;
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
  --progress-track-bg: linear-gradient(to right, #eee, #fff) !important;
  --progress-bg: linear-gradient(to top right, #ba5776, #fc7688);
  /*滚动条*/
  --scrollbar-thumb-bg: #eee;
  /* 列表项 hover */
  --list-item-hover: #16161633 !important;
  /* 边框 */
  --main-left-border-color: #31313159;
  --ctx-menu-bg: #393939dc;
  --ctx-menu-border-color: transparent;
  --border-color: transparent;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: transparent;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-text-color: #ffcdd2;
  --pbq-hl-border: linear-gradient(to top right, #f84860, #fc7688) 0 0 0 2;
  --pbq-hl-border: linear-gradient(to top right, #fff, #fff) 0 0 0 2;
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
  --loading-mask-bg: linear-gradient(90deg,#ddd 8%,#ccc 18%,#ddd 33%);
  --error-color: red;

  --checkbox-bg: #161616ab;
  --logo-bg: var(--btn-bg);
  --logo-color: var(--svg-btn-color);

  --category-view-border: 0.5px solid var(--main-left-border-color);
  --input-bg: #16161633;
  --input-text-color: var(--text-color);
  --input-border-color: var(--main-left-border-color);
  --input-placeholder-color: #ccc;
}

:root[theme='green'] {
  /* 全局背景 */
  --bg-color: #fff;
  --app-bg: var(--bg-color);
  /* 文本 */
  --text-color: #212121;
  --text-sub-color: #666;
  --text-subtitle-color: #a0a0a0;
  --hl-color: #28c83f;
  --hl-text-bg: linear-gradient(to top right, #28c83f, #1ca388);
  /* 歌词文本颜色 */
  --text-lyric-color: #666;
  /* 按钮 */
  --svg-color: #414141;
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
  --progress-track-bg: linear-gradient(to right, #999, #ccc) !important;
  --progress-track-bg: linear-gradient(to right, #ccc, #ccc) !important;
  --progress-bg: linear-gradient(to top right, #1ca388, #28c83f);
  /*滚动条*/
  --scrollbar-thumb-bg: #999;
  /* 列表项 hover */
  --list-item-hover: #eee !important;
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
  --loading-mask-bg: linear-gradient(90deg,#eee 8%,#ddd 18%,#eee 33%);
  --error-color: red;

  --checkbox-bg: #fff;
  --logo-bg: var(--btn-bg);
  --logo-color: var(--svg-btn-color);

  --category-view-border: 0.5px solid var(--main-left-border-color);
  --input-bg: var(--bg-color);
  --input-text-color: var(--text-color);
  --input-border-color: var(--main-left-border-color);
  --input-placeholder-color: #888;
}

:root[theme='blue'] {
  /* 全局背景 */
  --bg-color: #fff;
  --app-bg: url('../../public/bg_blue.jpg');
  /* 文本 */
  --text-color: #161616;
  --text-sub-color: #434343;
  --text-subtitle-color: #888;
  --hl-color: #0f4a9a;
  --hl-color: #1976d2;
  --hl-color: #62a0f6;
  --hl-color: #2f80ed;
  --hl-color: #42a5f5;
  --hl-text-bg: linear-gradient(to right, #2f80ed, #56ccf2);
  --hl-text-bg: linear-gradient(to top right, #1976d2, #42a5f5);
  /* 歌词文本颜色 */
  --text-lyric-color: #666;
  /* 按钮 */
  --svg-color: #313131;
  --svg-color: #161616;
  --svg-text-color: #fff;
  --svg-btn-color: #fff;
  --btn-bg: linear-gradient(to right, #2f80ed, #56ccf2);
  --btn-bg: linear-gradient(to right, #42a5f5, #56ccf2);
  --btn-hover-bg: linear-gradient(to top right, #2f80ed, #fff) !important;
  
  --toggle-btn-bg: #989898;
  --toggle-thumb-bg: #ccc;
  --toggle-btn-border-color: #ccc;
  --toggle-btn-active-bg: var(--hl-color);
  --toggle-active-thumb-bg: #fff;
  /* 进度条 */
  --progress-track-bg: linear-gradient(to right, #888, #bbb) !important;
  --progress-track-bg: linear-gradient(to right, #ababab, #ababab) !important;
  --progress-bg: linear-gradient(to top right, #2f80ed, #56ccf2);
  --progress-bg: linear-gradient(to top right, #1976d2, #42a5f5);
  --btn-hover-bg: linear-gradient(to top right, #1976d2, #42a5f5) !important;
  /*滚动条*/
  --scrollbar-thumb-bg: #ababab;
  /* 列表项 hover */
  --list-item-hover: #16161633 !important;
  --list-item-hover: #ffffffcb !important;
  /* 边框 */
  --main-left-border-color: #888;
  --ctx-menu-bg: var(--bg-color);
  --ctx-menu-border-color: #ababab;
  --border-color: transparent;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: transparent;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-text-color: var(--hl-text-bg);
  --pbq-hl-border: linear-gradient(to top right, #f84860, #fc7688) 0 0 0 2;
  --pbq-hl-border: linear-gradient(to top right, #2f80ed, #56ccf2) 0 0 0 2;
  /* 搜索框 */
  --searchbar-bg: #56ccf299;
  --search-btn-bg: #56ccf299;
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
  --loading-mask-bg: linear-gradient(90deg,#ddd 8%,#ccc 18%,#ddd 33%);
  --error-color: red;

  --checkbox-bg: #fff;
  --logo-bg: linear-gradient(to top right, #ccc, #fff);
  --logo-color: var(--hl-color);

  --category-view-border: 0.1px solid var(--main-left-border-color);
  --input-bg: #ffffffcb;
  --input-text-color: var(--text-color);
  --input-border-color: #ccc;
  --input-placeholder-color: #888;
}

:root[theme='yellow'] {
  /* 全局背景 */
  --bg-color: #fff;
  --app-bg: var(--bg-color);
  /* 文本 */
  --text-color: #000;
  --text-sub-color: #333;
  --text-subtitle-color: #999;
  --hl-color: #0f4a9a;
  --hl-color: #1976d2;
  --hl-color: #ffb300;
  --hl-text-bg: #ffb300;
  /* 歌词文本颜色 */
  --text-lyric-color: #888;
  /* 按钮 */
  --svg-color: #000;
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
  --btn-hover-bg: #ffb300;
  /*滚动条*/
  --scrollbar-thumb-bg: #cbcbcb;
  /* 列表项 hover */
  --list-item-hover: #ffb30025;
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
  --loading-mask-bg: linear-gradient(90deg,#ddd 8%,#ccc 18%,#ddd 33%);
  --error-color: red;

  --checkbox-bg: #fff;
  --logo-bg: #ffb300;
  --logo-color: #fff;

  --category-view-border: 0.5px solid var(--main-left-border-color);
  --input-bg: var(--bg-color);
  --input-text-color: var(--text-color);
  --input-border-color: var(--main-left-border-color);
  --input-placeholder-color: #888;
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
  --btn-hover-bg: #000;
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
  --loading-mask-bg: linear-gradient(90deg,#ddd 8%,#ccc 18%,#ddd 33%);
  --error-color: red;

  --checkbox-bg: #fff;
  --logo-bg: #000;
  --logo-color: #fff;

  --category-view-border: 0.5px solid var(--main-left-border-color);
  --input-bg: var(--bg-color);
  --input-text-color: var(--text-color);
  --input-border-color: var(--main-left-border-color);
  --input-placeholder-color: #888;
}

:root[theme='purple'] {
  --bg-color: #fff;
  --app-bg: var(--bg-color);

  --hl-color: #000;
  --hl-text-bg: #000;

  --progress-track-bg: #eee;
  --progress-bg: #ccc;

  --searchbar-border-color: var(--hl-color);

  /* 列表项 hover */
  --list-item-hover: #00000010;

  --ntf-bg: #fff;
  --ctx-menu-border-color: #000;

  --logo-bg: #000;
  --logo-color: #fff;
}

::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb-bg);
  border: 1px solid var(--scrollbar-thumb-bg);
  width: 5px;
  height: 59px;
  border-radius: 8px;
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
    from { background-position: -360px 0 }
    to { background-position: 360px 0 }
}
</style>