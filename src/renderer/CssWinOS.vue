<template></template>

<style>
/* 普通文本按钮 */
.winos-style .text-btn svg {
  padding-top: 2px !important;
}

/* 桌面歌词（文字）按钮 */
.winos-style .classic-main-bottom .lyric-btn,
.winos-style .playing-view .bottom .action .lyric-btn,
.winos-style .visual-playing-view .action .lyric-btn,
/* 播放页 - 歌词 */
.winos-style .lyric-ctl .audio-artist,
.winos-style .lyric-ctl .audio-album {
  font-weight: normal !important;
}


.use-winos-win-ctl #main-left .header {
  margin-bottom: -8px !important;
}

.use-winos-win-ctl #main-left.main-left-default-old-layout .header {
  margin-bottom: 8px !important;
}

.use-winos-win-ctl #main-left.main-left-default-old-layout .header .userhome-btn,
.use-winos-win-ctl #main-left.main-left-default-old-layout .header .setting-btn {
  margin-right: 18px !important;
  display: flex;
  justify-content: center;
  align-items: center;
}

.use-winos-win-ctl #main-left.main-left-default-old-layout .navigator {
  margin-left: 36px !important;
}

/*
.use-winos-win-ctl #main-left.main-left-default-old-layout .header {
  background-color: var(--content-bg-color);
}
*/

.use-winos-win-ctl .default-main-top .play-nav>.action {
  margin-right: 10px !important;
}

.use-winos-win-ctl .default-main-top .search-bar .keyword {
  width: 150px !important;
}

.use-winos-win-ctl .default-main-top .win-ctl-wrap {
  margin-left: 12px !important;
}

.use-winos-win-ctl .classic-main-top .action {
  right: 25px;
}

.use-winos-win-ctl .classic-main-top .win-ctl-wrap {
  margin-left: 12px !important;
}


/* 播放页 */
.use-winos-win-ctl .playing-view .win-ctl-wrap,
.use-winos-win-ctl .visual-playing-view .win-ctl-wrap {
  position: absolute;
  right: 0px;
  top: 10px;
  padding-right: 25px;
  justify-content: flex-end !important;
}

.use-winos-win-ctl .playing-view .meta-wrap,
.use-winos-win-ctl .visual-playing-view .meta-wrap {
  padding-right: 0px;
  margin-right: 0px;
  padding-left: 18%;
  margin-left: var(--others-win-ctl-margin-left);
}

.use-winos-win-ctl .video-playing-view .win-ctl-wrap {
  position: absolute;
  right: 10px;
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
.use-winos-win-ctl .gradient-color-toolbar .right-action .close-btn {
  margin-left: 33px;
  margin-right: -8px;
}

.use-winos-win-ctl .custom-theme-edit-view .header .title-wrap,
.use-winos-win-ctl .gradient-color-toolbar .header .title-wrap {
  margin-left: 10px !important;
}


/* 简约布局 */
.simple-layout-use-winos-win-ctl .win-ctl-wrap {
  margin-left: 8px !important;
}
</style>
