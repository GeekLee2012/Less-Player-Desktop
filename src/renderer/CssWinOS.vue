<template>
</template>

<style>
/* 普通文本按钮 */
.winos-style .text-btn svg {
  padding-top: 2px !important;
}

.winos-style .image-text-tile.image-text-tile-color-mode .cover-wrap .big-title {
    line-height: calc(var(--content-text-module-subtitle-size) + 3px);
    font-size: calc(var(--content-text-module-subtitle-size) - 1px) !important;
}

/* 桌面歌词（文字）按钮 */
.winos-style .classic-main-bottom .lyric-btn,
.winos-style .default-new-main-bottom .lyric-btn,
.winos-style .playing-view .bottom .action .lyric-btn,
.winos-style .visual-playing-view .action .lyric-btn {
  font-weight: normal !important;
  transform: translateY(-1px) scale(1.05);
}

/* 播放页 - 歌词 */
.winos-style .lyric-ctl .audio-artist,
.winos-style .lyric-ctl .audio-album {
  font-weight: normal !important; 
}

.winos-style .video-playing-view > .header {
  visibility: visible;
}

.winos-style .lyric-ctl {
  letter-spacing: 0.5px;
}

.winos-style .svg-text-btn .left-btn svg,
.winos-style .svg-text-btn .right-btn svg {
    transform: translateY(1px);
}


.use-winos-win-ctl .default-old-layout #main-left .header {
  margin-bottom: 8px !important;
}

.use-winos-win-ctl .default-old-layout #main-left .header .userhome-btn,
.use-winos-win-ctl .default-old-layout  #main-left .header .setting-btn {
  margin-right: 18px !important;
  display: flex;
  justify-content: center;
  align-items: center;
}

.use-winos-win-ctl .default-old-layout  #main-left .navigator {
  margin-left: 36px !important;
}

.use-winos-win-ctl .default-new-layout #main-left .header {
  height: 68px !important;
  margin-bottom: 3px !important;
}

.use-winos-win-ctl .default-new-layout #main-left .header .top-logo {
  margin-top: 23px;
  margin-left: 23px;
}

.use-winos-win-ctl .default-new-layout.mini-navbar-mode #main-left .header .top-logo {
  margin-top: 23px;
  margin-left: 0px;
}


.use-winos-win-ctl .default-main-top .play-nav > .action {
  padding-right: 10px !important;
  width: 39.33%;
}

.use-winos-win-ctl .default-main-top .search-bar .keyword {
  width: 150px !important;
}

.use-winos-win-ctl .default-main-top .win-ctl-wrap {
  margin-left: 12px !important;
}

.use-winos-win-ctl .classic-main-top .action {
  /*right: 23px;*/
  right: 15px;
}

.use-winos-win-ctl .classic-main-top .win-ctl-wrap {
  margin-left: 12px !important;
}


/* 播放页 */
.use-winos-win-ctl .playing-view .win-ctl-wrap,
.use-winos-win-ctl .visual-playing-view .win-ctl-wrap,
.use-winos-win-ctl .dynamic-playing-view .win-ctl-wrap {
  position: absolute;
  right: 0px;
  top: 9px;
  /*padding-right: 21px;*/
  padding-right: 13px;
  justify-content: flex-end !important;
}

.use-winos-win-ctl .dynamic-playing-view .win-ctl-wrap .ctl-btn:hover {
  background-color: #ffffff66;
}

.use-winos-win-ctl .playing-view .meta-wrap,
.use-winos-win-ctl .visual-playing-view .meta-wrap {
  padding-right: 0px;
  margin-right: 0px;
  padding-left: 18%;
  margin-left: var(--others-win-ctl-margin-left);
  /*transform: translateY(-3px);*/
}

.use-winos-win-ctl .playing-view .container.auto-effect.dark .win-ctl-wrap .ctl-btn svg,
.use-winos-win-ctl .playing-view .container.auto-effect.dark .win-ctl-wrap .min-btn svg,
.use-winos-win-ctl .playing-view .container.auto-effect.dark .win-ctl-wrap .max-btn svg,
.use-winos-win-ctl .visual-playing-view .container.auto-effect.dark .win-ctl-wrap .ctl-btn svg,
.use-winos-win-ctl .visual-playing-view .container.auto-effect.dark .win-ctl-wrap .min-btn svg,
.use-winos-win-ctl .visual-playing-view .container.auto-effect.dark .win-ctl-wrap .max-btn svg {
  fill: #373737 !important;
  stroke: #373737 !important;
}

.use-winos-win-ctl .playing-view .container.auto-effect.dark .win-ctl-wrap .ctl-btn:hover {
  background: #00000018;
}

.use-winos-win-ctl .playing-view .container.auto-effect.dark .win-ctl-wrap .close-btn:hover svg {
  fill: #ffffff !important;
}

.use-winos-win-ctl .video-playing-view .win-ctl-wrap {
  position: absolute;
  right: 13px;
  top: -2px;
}

.use-winos-win-ctl .video-playing-view .win-ctl-wrap .ctl-btn:hover,
.use-winos-win-ctl .video-playing-view .win-ctl-wrap .ctl-btn:hover svg {
  fill: var(--content-highlight-color) !important;
  stroke: var(--content-highlight-color) !important;
  cursor: pointer;
}

.use-winos-win-ctl .win-ctl-wrap .close-btn:hover svg,
.use-winos-win-ctl .video-playing-view .win-ctl-wrap .ctl-btn svg {
  fill: #fff !important;
  stroke: #fff !important;
}

.use-winos-win-ctl .video-playing-view .win-ctl-wrap .close-btn:hover svg {
  fill: #fff !important;
  stroke: #fff !important;
}

.use-winos-win-ctl .video-playing-view .theme-btn svg {
    transform: scale(0.93) translateY(2px);
}


/* Toolbar */
.use-winos-win-ctl .sound-effect-view .action,
.use-winos-win-ctl .random-music-toolbar .action,
.use-winos-win-ctl .lyric-toolbar .action {
  position: absolute;
  right: 10px;
}

.use-winos-win-ctl .lyric-toolbar .action {
  position: absolute;
  right: 5px;
}

.use-winos-win-ctl .random-music-toolbar .header .title,
.use-winos-win-ctl .lyric-toolbar .header .title {
  padding-right: 0px !important;
}

.use-winos-win-ctl .custom-theme-edit-view .right-action .close-btn,
.use-winos-win-ctl .custom-playing-theme-edit-view .right-action .close-btn,
.use-winos-win-ctl .custom-app-border-radius-view .right-action .close-btn,
.use-winos-win-ctl .gradient-color-toolbar .right-action .close-btn {
  margin-left: 33px;
  margin-right: -8px;
}

.use-winos-win-ctl .custom-theme-edit-view .header .title-wrap,
.use-winos-win-ctl .custom-playing-theme-edit-view .header .title-wrap,
.use-winos-win-ctl .custom-app-border-radius-view .header .title-wrap,
.use-winos-win-ctl .gradient-color-toolbar .header .title-wrap {
  margin-left: 10px !important;
}

.use-winos-win-ctl .playing-view .container.auto-effect .win-ctl-wrap .ctl-btn,
.use-winos-win-ctl .playing-view .container.auto-effect .win-ctl-wrap .ctl-btn svg,
.use-winos-win-ctl .visual-playing-view .container.auto-effect .win-ctl-wrap .ctl-btn,
.use-winos-win-ctl .visual-playing-view .container.auto-effect .win-ctl-wrap .ctl-btn svg {
  fill: #fff !important;
  stroke: #fff !important;
  cursor: pointer;
}

.use-winos-win-ctl .playing-view .container.auto-effect .win-ctl-wrap .ctl-btn:hover,
.use-winos-win-ctl .visual-playing-view .container.auto-effect .win-ctl-wrap .ctl-btn:hover {
  background: #eeeeee66;
}

/* 桌面歌词 */
.desktop-lyric.winos-style  {
  background: var(--app-bg-color) !important;
}

.desktop-lyric.winos-style .header {
  visibility: visible;
}

.desktop-lyric.winos-style:hover .header,
.desktop-lyric.winos-style.desktop-lyric-hover .header {
  visibility: visible;
}


.desktop-lyric-lock.winos-style {
  background: none !important;
}

/* 简约布局 */
.simple-layout-use-winos-win-ctl .win-ctl-wrap {
  margin-left: 8px !important;
}

/* 迷你布局 */
.winos-style .mini-layout > .center > .content {
  -webkit-app-region: no-drag;
}

.winos-style .mini-layout > .center > .content .win-ctl-wrap,
.winos-style .mini-layout > .center > .content .duration-wrap {
  -webkit-app-region: drag;
}

.winos-style .mini-layout > .center > .content .play-ctl-wrap .lyric-btn {
  font-weight: normal;
  transform: translateY(-1px);
}

.use-winos-win-ctl #main-left  .center {
  margin-bottom: 10px;
}

.use-winos-win-ctl #main-left .header .top-logo {
  margin-top: 23px;
  margin-left: 23px;
}

.winos-style .playing-view .container .bg-container,
.winos-style .playing-view .container .backdrop-container,
.winos-style .visual-playing-view .container .bg-container,
.winos-style .visual-playing-view .container .backdrop-container  {
  position: absolute;
}
</style>
