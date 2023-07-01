<template></template>

<style>
:root {
  --app-bg: transparent;

  --content-text-preset-font-family: system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Helvetica, "Microsoft YaHei", 微软雅黑, Arial, sans-serif;
  --content-text-font-family: var(--content-text-preset-font-family);

  --content-text-size: 15.5px;
  --content-text-subtitle-size: 14px;
  --content-text-tip-text-size: 13.5px;
  --content-text-tab-title-size: 17px;
  --content-setting-cate-subtitle-width: 225px;
  --content-text-line-height: 27px;
  --content-text-letter-spacing: 0.25px;
  /* 主标题 */
  --content-text-module-title-size: 30px;
  /* 标题 - 批量操作页、当前播放列表 */
  --content-text-module-subtitle-size: 25px;
  /* 标题 - 全部分类界面 */
  --content-text-module-title2-size: 21px;
  /* 标题 - 左导航 */
  --content-text-module-title3-size: 19px;
  /* 行高 - 左导航 */
  --content-left-nav-line-height: 32px;
  --content-error-color: red;

  /*边框 */
  --border-macstyle-border-radius: 0px;

  --others-scrollbar-width: 6px;
  /*--win-ctl-width: 105px;*/
  --others-win-ctl-margin-left: 15px;
  --others-win-ctl-btn-size: 13px;
  --others-win-ctl-max-btn-size: 8px;
  --others-win-ctl-collapse-btn-size: 18px;
  --others-win-ctl-btn-margin-right: 8px;

  --others-playmeta-height: 77px;
  --others-playnav-height: 80px;
  --others-image-text-tile-cover-size: 173px;
  --others-image-text-tile-mask-width: var(--others-image-text-tile-cover-size);
  --others-theme-preview-tile-width: 160px;
  --others-theme-preview-tile-height: 95px;
  --others-progressbar-height: 3px;
  --others-sliderbar-ctl-height: 2px;

  /* 主题相关 */
  --border-popovers-border-color: #666;
  --box-shadow: 0px 0px 6px var(--border-popovers-border-color);
  --searchbar-clear-btn-icon-color: #666;

  font-family: var(--content-text-font-family);
  letter-spacing: var(--content-text-letter-spacing);
}

.content-text-highlight {
  background: var(--content-text-highlight-color);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent !important;
}

input,
textarea {
  font-size: var(--content-text-subtitle-size);
  font-family: var(--content-text-font-family);
  color: var(--content-inputs-text-color);
}

.text-input-ctl {
  border-radius: 3px;
  padding: 8px;
  border: 1px solid var(--border-inputs-border-color);
  background-color: var(--content-inputs-bg-color);
  min-width: 258px;
  /*font-size: var(--content-text-size);*/
  color: var(--content-inputs-text-color);
}

.button-disabled {
  opacity: 0.33;
  cursor: default !important;
}

::-webkit-scrollbar {
  width: var(--others-scrollbar-width);
}

::-webkit-scrollbar-track {
  background: transparent;
}

.warning {
  fill: var(--content-error-color) !important;
  color: var(--content-error-color) !important;
}

.tip-text {
  /*font-size: 13.5px;*/
  font-size: var(--content-text-tip-text-size);
  color: var(--content-subtitle-text-color);
}

.obj-fit-contain {
  object-fit: contain;
}

.winos-style .text-btn svg {
  padding-top: 2px;
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
</style>