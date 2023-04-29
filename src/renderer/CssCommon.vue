<template></template>

<style>
:root {
  --text-font-family: system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Helvetica, "Microsoft YaHei", 微软雅黑, Arial, sans-serif;
  font-family: var(--text-font-family);

  --scrollbar-width: 6px;
  --play-meta-height: 77px;
  --main-play-nav-height: 80px;
  --image-text-tile-cover-size: 173px;
  --image-text-tile-mask-width: var(--image-text-tile-cover-size);
  --theme-preview-tile-width: 160px;
  --theme-preview-tile-height: 95px;
  --app-bg: transparent;

  --text-size: 15.5px;
  --text-sub-size: 14px;
  --tip-text-size: 13.5px;
  --tab-title-text-size: 17px;
  --setting-cate-subtitle-width: 225px;
  --text-line-height: 23px;
  /* 主标题 */
  --text-main-title-size: 30px;
  /* 标题 - 批量操作页、当前播放列表 */
  --text-main2-title-size: 23px;
  /* 标题 - 全部分类界面 */
  --text-main3-title-size: 21px;
  /* 标题 - 左导航 */
  --text-main4-title-size: 19px;
  /* 行高 - 左导航 */
  --main-left-nav-line-height: 32px;

  /*--win-ctl-width: 105px;*/
  --win-ctl-margin-left: 15px;
  --win-ctl-btn-size: 13px;
  --win-ctl-max-btn-size: 8px;
  --win-ctl-collapse-btn-size: 18px;
  --win-ctl-btn-margin-right: 8px;

}

.btnDisabled {
  opacity: 0.33;
}

::-webkit-scrollbar {
  width: var(--scrollbar-width);
}

::-webkit-scrollbar-track {
  background: transparent;
}

.warning {
  fill: red !important;
  color: red !important;
}

/*TODO 试验性CSS */
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