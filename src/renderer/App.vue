<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import { onMounted } from 'vue';
import MainLeft from './layout/MainLeft.vue';
import MainCenter from './layout/MainCenter.vue';
import Notification from './components/Notification.vue';
import { useMainViewStore } from './store/mainViewStore';
import { useSettingStore } from './store/settingStore';
import { storeToRefs } from 'pinia';
import EventBus from '../common/EventBus';
import PlayBoostrap from './components/PlayBoostrap.vue';

const { playbackQueueViewShow, playingViewShow, playNotificationShow } = storeToRefs(useMainViewStore())
const { getCurrentThemeName } = useSettingStore()

//TODO 设置主题
const setupAppTheme = (themeName) => {
  themeName = themeName || 'dark'
  themeName = themeName.trim()
  /*
  const themeUrl = './assets/styles/' + themeName + '-theme.css'
  import(themeUrl)
  */
  document.documentElement.setAttribute('theme', themeName)
}

/* @vite-ignore */
setupAppTheme(getCurrentThemeName())
onMounted(() => EventBus.emit('radio-init', document.querySelector('.radio-holder')))
EventBus.on("switchTheme", themeName => setupAppTheme(themeName))
</script>

<template>
    <PlayBoostrap></PlayBoostrap>
    <MainLeft></MainLeft> 
    <MainCenter></MainCenter>
    <!-- FM广播audio -->
    <audio class="radio-holder"></audio>
    
    <!-- 顶层浮动窗口 -->
    <transition name="fade-y">
      <PlayingView id="playing-view" v-show="playingViewShow">
      </PlayingView>
    </transition>

    <PlaybackQueueView id="playback-queue" v-show="playbackQueueViewShow">
    </PlaybackQueueView>

    <Notification class="playing-ntf" v-show="playNotificationShow">
        <template #text>
            <p>当前歌曲无法播放！</p>
            <p>将为您播放下一曲~</p>
        </template>
    </Notification>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  user-select: none;
}

:root {
  /* 文本 */
  --text-family: STHeitiSC-Medium, "Heiti SC Medium";
  --text-size: 15px;
}

:root[theme='dark'] {
  /* 全局背景 */
  --bg-color: #313131;
  /* 文本 */
  --text-color: #eaeaea;
  --text-sub-color: #989898;
  --hl-color: #28c83f;
  --hl-text-bg: linear-gradient(to top right, #28c83f, #1ca388);
  /* 歌词文本颜色 */
  --text-lyric-color: #ccc;
  /* 按钮 */
  --svg-color: #eaeaea;
  --svg-text-color: #eaeaea;
  --btn-bg: linear-gradient(to right, #1ca388, #28c83f);
  --btn-hover-bg: linear-gradient(to top right, #2edfa3, #28c83f) !important;
  --toggle-btn-bg: #a0a0a0;
  --toggle-btn-color: #eaeaea;
  /* 进度条 */
  --progress-track-bg: linear-gradient(to right, #464646, #666) !important;
  --progress-bg: linear-gradient(to top right, #2edfa3, #28c83f);
  /*滚动条*/
  --scrollbar-thumb-bg: #666;
  /* 列表项 hover */
  --list-item-hover: #464646 !important;
  /* 边框 */
  --main-left-border-color: #181818;
  --border-color: #464646;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: #3a3a3a;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-border: linear-gradient(to top right, #28c83f, #1ca388) 0 0 0 2;

  /* 搜索框(目前无边框) */
  --searchbar-bg: #eee;
  --searchbar-text-color: #555;
  --searchbar-border-color: #eee;
  /* 按键输入框背景 */
  --keyinput-ctl-bg: var(--searchbar-bg);
  /* 通知消息 */
  --ntf-bg: #eaeaeaea;
  --ntf-text-color: var(--bg-color);
}

:root[theme='light'] {
  /* 全局背景 */
  --bg-color: #eee;
  /* 文本 */
  --text-color: #313131;
  --text-sub-color: #666;
  --hl-color: #28c83f;
  --hl-text-bg: linear-gradient(to top right, #28c83f, #1ca388);
  /* 歌词文本颜色 */
  --text-lyric-color: #666;
  /* 按钮 */
  --svg-color: #666;
  --svg-text-color: #464646;
  --btn-bg: linear-gradient(to right, #1ca388, #28c83f);
  --btn-hover-bg: linear-gradient(to top right, #2edfa3, #28c83f) !important;
  --toggle-btn-bg: #a0a0a0;
  --toggle-btn-color: #eaeaea;
  /* 进度条 */
  --progress-track-bg: linear-gradient(to right, #888, #bbb) !important;
  --progress-bg: linear-gradient(to top right, #2edfa3, #28c83f);
  /*滚动条*/
  --scrollbar-thumb-bg: #999;
  /* 列表项 hover */
  --list-item-hover: #ababab !important;
  /* 边框 */
  --main-left-border-color: #888;
  --border-color: #ccc;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: #dfdfdf;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-border: linear-gradient(to top right, #28c83f, #1ca388) 0 0 0 2;
  /* 搜索框 (目前无边框) */
  --searchbar-bg: #ddd;
  --searchbar-text-color: #555;
  --searchbar-border-color: #eee;
  /* 按键输入框背景 */
  --keyinput-ctl-bg: var(--searchbar-bg);
  /* 通知消息 */
  --ntf-bg: #464646ea;
  --ntf-text-color: var(--bg-color);
}

:root[theme='pink'] {
  /* 全局背景 */
  --bg-color: #393939;
  /* 文本 */
  --text-color: #eaeaea;
  --text-sub-color: #989898;
  --hl-color: #e667af;
  --hl-text-bg: linear-gradient(to top right, #e667af, #e6399b);
  /* 歌词文本颜色 */
  --text-lyric-color: #ccc;
  /* 按钮 */
  --svg-color: #eaeaea;
  --svg-text-color: #eaeaea;
  --btn-bg: linear-gradient(to right, #e667af, #e6399b);
  --btn-bg: linear-gradient(to top right, #e6399b, #e667af);
  --btn-hover-bg: linear-gradient(to top right, #e6399b, #992667) !important;
  --toggle-btn-bg: #a0a0a0;
  --toggle-btn-color: #eaeaea;
  /* 进度条 */
  --progress-track-bg: linear-gradient(to right, #252525, #313131) !important;
  --progress-bg: linear-gradient(to top right, #e667af, #e6399b);
  /*滚动条*/
  --scrollbar-thumb-bg: #212121;
  /* 列表项 hover */
  --list-item-hover: #313131 !important;
  /* 边框 */
  --main-left-border-color: #181818;
  --border-color: #313131;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: #3e3e3e;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-border: linear-gradient(to right, #e6399b, #e667af) 0 0 0 2;

  /* 搜索框（目前无边框） */
  --searchbar-bg: #eee;
  --searchbar-text-color: #555;
  --searchbar-border-color: #eee;
  /* 按键输入框背景 */
  --keyinput-ctl-bg: var(--searchbar-bg);
  /* 通知消息 */
  --ntf-bg: #eaeaeaea;
  --ntf-text-color: var(--bg-color);
}

:root[theme='red'] {
  /* 全局背景 */
  --bg-color: #eee;
  /* 文本 */
  --text-color: #313131;
  --text-sub-color: #666;
  --hl-color: #f84860;
  --hl-text-bg: linear-gradient(to top right, #fc7688, #f84860);
  /* 歌词文本颜色 */
  --text-lyric-color: #666;
  /* 按钮 */
  --svg-color: #666;
  --svg-color: #fc7688;
  --svg-text-color: #464646;
  --btn-bg: linear-gradient(to right, #ba5776, #f84860);
  /*--btn-hover-bg: linear-gradient(to top right, #f84860, #fc7688) !important;*/
  --btn-hover-bg: linear-gradient(to top right, #f84860, #fc99a7) !important;
  --toggle-btn-bg: #a0a0a0;
  --toggle-btn-color: #eaeaea;
  /* 进度条 */
  --progress-track-bg: linear-gradient(to right, #888, #bbb) !important;
  --progress-bg: linear-gradient(to top right, #f84860, #fc7688);
  /*滚动条*/
  --scrollbar-thumb-bg: #999;
  /* 列表项 hover */
  --list-item-hover: #ababab !important;
  /* 边框 */
  --main-left-border-color: #888;
  --border-color: #ccc;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: #dfdfdf;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-border: linear-gradient(to top right, #f84860, #fc7688) 0 0 0 2;
  /* 搜索框 (目前无边框) */
  --searchbar-bg: #ddd;
  --searchbar-text-color: #555;
  --searchbar-border-color: #eee;
  /* 按键输入框背景 */
  --keyinput-ctl-bg: var(--searchbar-bg);
  /* 通知消息 */
  --ntf-bg: #464646ea;
  --ntf-text-color: var(--bg-color);
}

html, body, #app {
  background-color: var(--bg-color);
  margin: 0 auto;
  height: 100%;
  font-size: var(--text-size);
  color: var(--text-color);
  overflow: hidden;
}

img {
  -webkit-user-drag: none;
  background-size: cover;
  object-fit: cover;
}

#app {
  display: flex;
  font-family: var(--text-family);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}

::-webkit-scrollbar {
  width: 5px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb-bg);
  border: 1px solid var(--scrollbar-thumb-bg);
  width: 5px;
  height: 59px;
  border-radius: 8px;
}

.radio-holder {
  visibility: visible;
}

#playback-queue {
    position: absolute;
    top: 0;
    right: 0px;
    width: 335px;
    height: 100%;
    z-index: 99;
    background-color: var(--bg-color);
    box-shadow: 0px 0px 10px #161616;
}

#playing-view {
    position: absolute;
    top: 0;
    left: 0px;
    width: 100%;
    height: 100%;
    z-index: 88;
    background-color: var(--bg-color);
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
    transform: translateX(520px);
}

.fade-x-enter-to,
.fade-x-leave-from {
    transform: translateX(0);
}
</style>
