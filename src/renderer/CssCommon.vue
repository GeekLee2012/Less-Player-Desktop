<template>
</template>

<style>
:root {
  --app-bg: transparent;
  --bg-effect: none;
  --bg-effect-bottom: none;
  --app-win-custom-shadow-size: 0px;
  --app-win-custom-box-shadow: 0px 0px var(--app-win-custom-shadow-size) #393939;
  /*内容*/
  --content-text-preset-font-family: system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Helvetica, "Microsoft YaHei", 微软雅黑, Arial, sans-serif;
  --content-text-font-family: var(--content-text-preset-font-family);

  --main-left-width: 211px;
  --main-top-height: 68px;
  --main-bottom-height: 88px;

  --content-text-size: 15.5px;
  --content-text-subtitle-size: 14px;
  --content-text-tip-text-size: 13.5px;
  --content-text-tab-title-size: 17px;
  --content-setting-cate-subtitle-width: 225px;
  --content-text-line-height: 27px;
  --content-text-letter-spacing: 0.25px;
  /* 主标题 */
  --content-text-module-title-size: 32px;
  /* 标题 - 批量操作页、当前播放列表 */
  --content-text-module-subtitle-size: 26px;
  /* 标题 - 全部分类界面 */
  --content-text-module-title2-size: 21px;
  /* 标题 - 左导航 */
  --content-text-module-title3-size: 19px;
  /* 行高 - 左导航 */
  --content-left-nav-line-height: 36.5px;
  --content-left-nav-line-spacing: 10px;
  --content-error-color: #fc605c;
  --content-new-color: #fc605c;
  
  --content-playing-theme-list-item-height: 190px;
  --content-header-nav-height: 56px;

  /*边框 */
  --border-app-win-border-radius: 12px;
  --border-popover-border-radius: 8px;
  --border-list-item-border-radius: 10rem;
  --border-list-item-vertical-border-radius: 5px;
  --border-inputs-border-radius: 3px;
  --border-btn-border-radius: 10rem;
  --border-img-text-tile-border-radius: 6px;
  --border-flow-btn-border-radius: 6px;

  /*其他*/
  --others-scrollbar-width: 6px;
  /*--win-ctl-width: 105px;*/
  --others-win-ctl-margin-left: 15px;
  --others-win-ctl-btn-size: 13px;
  --others-win-ctl-max-btn-size: 8px;
  --others-win-ctl-collapse-btn-size: 18px;
  --others-win-ctl-btn-margin-right: 8px;
  
  --others-win-ctl-btn-traffic-light-close-btn-bg: #fc605c;
  --others-win-ctl-btn-traffic-light-min-btn-bg: #fdbc40;
  --others-win-ctl-btn-traffic-light-max-btn-bg: #34c648;
  --others-win-ctl-btn-traffic-light-close-btn-color: #555555;
  --others-win-ctl-btn-traffic-light-min-btn-color: #555555;
  --others-win-ctl-btn-traffic-light-max-btn-color: #555555;

  --others-playmeta-height: 77px;
  --others-playnav-height: 80px;
  --others-playctl-spacing: 23px;
  /*--others-image-text-tile-cover-size: 173px; */
  --others-image-text-tile-cover-size: 172px;
  --others-image-text-tile-mask-width: var(--others-image-text-tile-cover-size);
  --others-card-image-text-tile-title-width: 152px;
  --others-image-text-tile-card-cover-height: 152px;
  --others-image-text-tile-card-min-height: 224px;
  --others-image-text-tile-hcard-width-ratio: 2.2;
  /*--others-theme-preview-tile-width: 160px;
  --others-theme-preview-tile-height: 95px;*/
  --others-theme-preview-tile-width: 165px;
  --others-theme-preview-tile-height: 100px;
  --others-progressbar-height: 3px;
  --others-sliderbar-ctl-height: 3px;
  --others-sliderbar-thumb-size: 13px;
  --others-sliderba-ctl-height-exsize: 2px;
  --others-lyric-ctl-extra-btn-right: 56px;
  --others-lyric-ctl-extra-btn-bottom: 99px;
  --others-webdav-view-grid-tile-width: 100px;

  /* 主题相关 */
  --border-popovers-border-color: #666;
  --box-shadow: 0px 0px 8px var(--border-popovers-border-color);
  --searchbar-clear-btn-icon-color: #666;

  --content-desktop-lyric-text-size: 20px;
  --content-desktop-lyric-color: #393939;
  --content-desktop-lyric-highlight-color: var(--content-text-highlight-color);
  --content-desktop-lyric-line-spacing: 22px;
  --others-mini-layout-cover-progress-bg: none;

  --lyric-mask: linear-gradient(transparent 0%, #fff 20%, #fff 80%, transparent 100%);
  --lyric-margin-left: 10px;
  --lyric-text-size: 24px;
  --lyric-hl-text-size: 25px;
  --lyric-title-text-size: 33px;
  --lyric-aral-text-size: 18px;
  --lyric-font-weight: 400;
  --lyric-line-height: 33px;
  --lyric-line-spacing: 28px;

  --nativeTheme: 'light';

  font-family: var(--content-text-font-family);
  letter-spacing: var(--content-text-letter-spacing);

  scrollbar-color: var(--others-scrollbar-color) transparent;
  scrollbar-width: var(--others-scrollbar-width);
}

.content-text-highlight {
  background: var(--content-text-highlight-color);
  background-clip: text !important;
  -webkit-background-clip: text !important;
  color: transparent !important;
  /*-webkit-text-fill-color: transparent !important;*/
}

input,
textarea {
  font-size: var(--content-text-subtitle-size);
  font-family: var(--content-text-font-family);
  color: var(--content-inputs-text-color);
  background-color: var(--content-inputs-bg-color);
  outline: none; 
}

textarea {
  border-radius: var(--border-inputs-border-radius);
  border: 1px solid var(--border-inputs-border-color);
}

.text-input-ctl {
  padding: 8px;
  min-width: 258px;
  /*font-size: var(--content-text-size);*/
  border-radius: var(--border-inputs-border-radius);
  border: 1px solid var(--border-inputs-border-color);
  background-color: var(--content-inputs-bg-color);
  color: var(--content-inputs-text-color);
}

.select-list-ctl {
  /*appearance: none;
  -webkit-appearance: none;*/
  border-radius: 3px;
  padding: 8px;
  min-width: 366px;
  font-size: var(--content-text-subtitle-size);
  outline: 0;
  /*color: var(--content-subtitle-text-color);*/
  border: 1px solid var(--border-inputs-border-color);
  background-color: var(--content-inputs-bg-color);
}

.button-disabled {
  opacity: 0.33;
  cursor: default !important;
}

.warning {
  fill: var(--content-error-color) !important;
  color: var(--content-error-color) !important;
}

.tip-text {
  font-size: var(--content-text-tip-text-size);
  color: var(--content-subtitle-text-color);
}

.obj-fit-contain {
  object-fit: contain !important;
}

.btn,
.text-btn,
.checkbox {
  cursor: pointer;
  -webkit-app-region: no-drag !important;
}

.text-btn:hover {
  color: var(--content-highlight-color);
  background: var(--content-text-highlight-color);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.text-btn svg {
  padding-top: 1px;
  margin-right: 5px;
  fill: var(--button-icon-btn-color);
}

.btn:hover svg,
.text-btn:hover svg {
  cursor: pointer;
  fill: var(--content-highlight-color);
}

.btn,
.btn svg,
.btn svg:hover {
  cursor: pointer;
}

.btn svg {
  fill: var(--button-icon-btn-color);
}


.checkbox {
  display: flex;
  align-items: center;
}

.checkbox svg {
  fill: var(--button-icon-btn-color) !important;
  cursor: pointer;
}

.checkbox.text-btn svg {
  margin-top: 1px;
}

.checkbox .checked-svg {
  fill: var(--content-highlight-color) !important;
}

.list-item-ctx-menu-trigger {
  background: var(--content-list-item-hover-bg-color);
}

.hidden {
  visibility: hidden;
}

.no-link {
  text-decoration: none;
  cursor: default;
  color: var(--content-text-color);
}

.link {
  text-decoration: underline;
  cursor: pointer;
  color: var(--content-text-color);
}


::-webkit-scrollbar {
  width: var(--others-scrollbar-width);
  -webkit-app-region: no-drag;
}

::-webkit-scrollbar-track {
  background: transparent;
  -webkit-app-region: no-drag;
}



/*TODO 试验性CSS */
/* 可以为进入和离开动画设置不同的持续时间和动画函数 */
.fade-ex-enter-active,
.fade-ex-leave-active {
  transition: all 0.3s ease;
}

/*
.fade-ex-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}
*/

.fade-ex-enter-from,
.fade-ex-leave-to {
  transform: translateX(404px);
  transform: translateX(40.4%);
  opacity: 0;
}

/* fade-y */
.fade-y-enter-active,
.fade-y-leave-active {
  transition: all 0.3s ease;
}

.fade-y-enter-from,
.fade-y-leave-to {
  transform: translateY(-100%);
}

.fade-y-enter-to,
.fade-y-leave-from {
  transform: translateY(0);
}

/* fade-x */
.fade-x-enter-active,
.fade-x-leave-active {
  transition: all 0.5s ease-in-out;
}

.fade-x-enter-from,
.fade-x-leave-to {
  /*TODO*/
  transform: translateX(520px);
}

.fade-x-enter-to,
.fade-x-leave-from {
  transform: translateX(0);
}

/* filter: blur数值越大，性能影响越大，可能越卡顿 */
.bg-effect {
    background-position: center !important;
    background-repeat: no-repeat !important;
    background-size: cover !important;
    background: var(--bg-effect);
    /*backdrop-filter: blur(20px);
    filter: blur(8px) saturate(2.1) brightness(88%) hue-rotate(360deg);
    filter: blur(10vmax) saturate(2.1);*/
    filter: blur(168px);
    transform: translateZ(0);
    z-index: -10;
    position: absolute;
    --offset: -88px;
    top: var(--offset);
    left: var(--offset);
    right: var(--offset);
    bottom: var(--offset);
    width: calc(100% - var(--offset) * 2);
    height: calc(100% - var(--offset) * 2);  
}
</style>