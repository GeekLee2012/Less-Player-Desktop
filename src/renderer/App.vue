<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import { onMounted, reactive, ref, watch } from 'vue';
import MainLeft from './layout/MainLeft.vue';
import MainCenter from './layout/MainCenter.vue';
import Notification from './components/Notification.vue';
import { useMainViewStore } from './store/mainViewStore';
import { useSettingStore } from './store/settingStore';
import { storeToRefs } from 'pinia';
import EventBus from '../common/EventBus';
import PlayBoostrap from './components/PlayBoostrap.vue';
import PlaybackQueueItemContextMenu from './components/PlaybackQueueItemContextMenu.vue';

const { playbackQueueViewShow, playingViewShow, 
  playNotificationShow, playbackQueueItemCtxMenuShow, 
  commonNotificationShow, commonNotificationText } = storeToRefs(useMainViewStore())
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

const { showPlaybackQueueItemCtxMenu, hidePlaybackQueueItemCtxMenu } = useMainViewStore()
const menuPos = reactive({ left: -999, top: -999})

const adjustPosition = (event) => {
  const { x, y, clientX, clientY } = event
  const pos = { x, y }
  const { clientWidth, clientHeight } = document.documentElement
  //TODO 菜单大小待改为自动获取
  const menuWidth = 179, menuHeight = 288, padding = 10 
  const gapX = clientX + menuWidth - clientWidth
  const gapY = clientY + menuHeight - clientHeight
  //右边界
  if(gapX > 0) {
    pos.x = pos.x - gapX - padding
  }
  //底部边界
  if(gapY > 0) {
    //pos.y = pos.y - gapY - padding
    pos.y = pos.y - menuHeight + padding / 2
  }
  return pos
}

const setMenuPosition = (event) => {
  const pos = adjustPosition(event)
  menuPos.left = pos.x + "px !important"
  menuPos.top = pos.y + "px !important"
}

EventBus.on("pbqItem-showMenu", e => {
  hidePlaybackQueueItemCtxMenu() //强制取消上次的显示
  setMenuPosition(e.event)
  showPlaybackQueueItemCtxMenu(e.value)
})

//TODO 还可以进一步封装，但是......
const { showCommonNotification, hideCommonNotification } = useMainViewStore()
const showToast = (text, callback, delay) => {
    delay = delay && delay >= 0 ? delay : 1500
    showCommonNotification(text)
    setTimeout(() => {
        hideCommonNotification()
        if(callback) callback()
    }, delay)
}

EventBus.on("toast", o => {
  const { text, callback, delay } = o
  showToast(text, callback, delay)
})

//TODO
watch(playbackQueueViewShow, () => {
    hidePlaybackQueueItemCtxMenu()
})
</script>

<template>
    <PlayBoostrap></PlayBoostrap>
    <MainLeft></MainLeft> 
    <MainCenter></MainCenter>
    
    <!-- 顶层浮动窗口 -->
    <transition name="fade-y">
      <PlayingView id="playing-view" v-show="playingViewShow">
      </PlayingView>
    </transition>

    <PlaybackQueueView id="playback-queue" v-show="playbackQueueViewShow">
    </PlaybackQueueView>
    
    <transition>
      <PlaybackQueueItemContextMenu v-show="playbackQueueItemCtxMenuShow" :pos="menuPos">
      </PlaybackQueueItemContextMenu>
    </transition>

    <!-- 播放失败通知 -->
    <transition>
      <Notification class="playing-ntf" v-show="playNotificationShow">
          <template #text>
              <p>当前歌曲无法播放！</p>
              <p>将为您播放下一曲~</p>
          </template>
      </Notification>
    </transition>

    <!-- 通用成功通知 -->
    <transition>
      <Notification class="common-ntf" v-show="commonNotificationShow">
          <template #text>
            <svg width="25" height="25" viewBox="0 0 938.64 938.69" xmlns="http://www.w3.org/2000/svg" ><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M938.46,466.59C937,602.08,888.74,717.76,790.36,811.31,722.44,875.92,641.39,915.54,549,931.7,306.41,974.12,70.65,819.29,13.17,579.86-38.14,366.13,63.88,146.91,260.42,49A462.65,462.65,0,0,1,435.07,1.28Q552.46-7.2,660,40.58c15.8,7,24.57,19.69,25.33,37.09s-6.88,30.65-22,39.18C651,123.88,638,124,625,118.26a376.21,376.21,0,0,0-96.43-28.41c-69.72-10.57-137.89-4-202.85,23.59C197.76,167.71,119,263.69,91.84,399.89s26.83,280,135.37,367.47q85.32,68.79,194,82.94c192.43,25.2,376.66-101.94,421.23-290.4a408.28,408.28,0,0,0,10.9-96.56c-.08-13.64-.79-27.46,1-40.89,2.93-21.41,23-36.29,44.43-34.79A42.34,42.34,0,0,1,938.4,428.6C938.75,441.26,938.46,453.93,938.46,466.59Z"/><path d="M470.19,495.64c1.38-2,2.4-3.95,3.9-5.45Q668.36,295.61,862.65,101.05c8.69-8.71,18.42-14.78,30.91-15.44A42.62,42.62,0,0,1,926.39,158c-19.87,20.19-40,40.14-60,60.18Q683.73,401,501.09,583.9C490.92,594.08,479,599,464.58,597.61A41.12,41.12,0,0,1,439,585.32q-64-63.95-127.93-128a42.29,42.29,0,0,1,.12-60.22c16.85-16.81,43.36-16.72,60.59.42q46.78,46.56,93.36,93.3C466.4,492.08,467.73,493.29,470.19,495.64Z"/></g></g></svg>
            <p>{{ commonNotificationText }}</p>
          </template>
      </Notification>
    </transition>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  user-select: none;
}

textarea {
  resize: none;
}

:root {
  /* 文本 */
  --text-family: system-ui, "PingFang SC", STHeitiSC-Medium, "Heiti SC Medium", "Heiti SC Light", "Microsoft YaHei", sans-serif;
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
  --svg-btn-color: #fff;
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
  --ctx-menu-border-color: #181818;
  --border-color: #363636;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: #363636;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-border: linear-gradient(to top right, #28c83f, #1ca388) 0 0 0 2;

  /* 搜索框(目前无边框) */
  --searchbar-bg: #eee;
  --searchbar-text-color: #555;
  --searchbar-border-color: #eee;
  /* 按键输入框背景 */
  --keyinput-ctl-bg: var(--searchbar-bg);
  /* 通知消息 */
  --ntf-bg: #555;
  --ntf-text-color: var(--text-color);
  /* 加载中遮盖 */
  --loading-mask-bg: linear-gradient(90deg, #414141 8%,#515151 18%,#414141 33%);
  --error-color: red;
}

:root[theme='light'] {
  /* 全局背景 */
  --bg-color: #fff;
  /* 文本 */
  --text-color: #212121;
  --text-sub-color: #666;
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
  --toggle-btn-bg: #a0a0a0;
  --toggle-btn-bg: #888;
  --toggle-btn-color: #a0a0a0;
  --toggle-btn-color: #bbb;
  /* 进度条 */
  --progress-track-bg: linear-gradient(to right, #999, #ccc) !important;
  --btn-hover-bg: linear-gradient(to top right, #e6399b, #992667) !important;
  /*滚动条*/
  --scrollbar-thumb-bg: #999;
  /* 列表项 hover */
  --list-item-hover: #eee !important;
  /* 边框 */
  --main-left-border-color: #ddd;
  --ctx-menu-border-color: #181818;
  --border-color: #f4f4f4;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: #f8f8f8;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-border: linear-gradient(to right, #e6399b, #e667af) 0 0 0 2;
  /* 搜索框 (目前无边框) */
  --searchbar-bg: #eee;
  --searchbar-text-color: #313131;
  --searchbar-border-color: #eee;
  /* 按键输入框背景 */
  --keyinput-ctl-bg: var(--searchbar-bg);
  /* 通知消息 */
  --ntf-bg: #eee;
  --ntf-text-color: var(--text-color);
  /* 加载中遮盖 */
  --loading-mask-bg: linear-gradient(90deg,#eee 8%,#ddd 18%,#eee 33%);
  --error-color: red;
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
  --svg-btn-color: #fff;
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
  --list-item-hover: #464646 !important;
  /* 边框 */
  --main-left-border-color: #181818;
  --ctx-menu-border-color: #181818;
  --border-color: #414141;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: #363636;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-border: linear-gradient(to right, #e6399b, #e667af) 0 0 0 2;

  /* 搜索框（目前无边框） */
  --searchbar-bg: #eee;
  --searchbar-text-color: #555;
  --searchbar-border-color: #eee;
  /* 按键输入框背景 */
  --keyinput-ctl-bg: var(--searchbar-bg);
  /* 通知消息 */
  --ntf-bg: #555;
  --ntf-text-color: var(--text-color);
  /* 加载中遮盖 */
  --loading-mask-bg: linear-gradient(90deg, #494949 8%,#595959 18%,#494949 33%);
  --error-color: red;
}

:root[theme='red'] {
  /* 全局背景 */
  --bg-color: #eee;
  /* 文本 */
  --text-color: #313131;
  --text-sub-color: #666;
  --hl-color: #fc7688;
  --hl-text-bg: linear-gradient(to top right, #fc7688, #f84860);
  /* 歌词文本颜色 */
  --text-lyric-color: #666;
  /* 按钮 */
  --svg-color: #f84860;
  --svg-text-color: #fff;
  --svg-btn-color: #fff;
  --btn-bg: linear-gradient(to right, #ba5776, #f84860);
  /*--btn-hover-bg: linear-gradient(to top right, #f84860, #fc7688) !important;*/
  --btn-hover-bg: linear-gradient(to top right, #f84860, #fc99a7) !important;
  --toggle-btn-bg: #a0a0a0;
  --toggle-btn-color: #fff;
  /* 进度条 */
  --progress-track-bg: linear-gradient(to right, #888, #bbb) !important;
  --progress-bg: linear-gradient(to top right, #f84860, #fc7688);
  /*滚动条*/
  --scrollbar-thumb-bg: #999;
  /* 列表项 hover */
  --list-item-hover: #ddd !important;
  /* 边框 */
  --main-left-border-color: #999;
  --ctx-menu-border-color: #181818;
  --border-color: #e6e6e6;
  /* 设置页，每一分类栏底部分隔线颜色 */
  --setting-bottom-border-color: #e6e6e6;
  /* 当前播放列表 左侧边框高亮颜色 */
  --pbq-hl-border: linear-gradient(to top right, #f84860, #fc7688) 0 0 0 2;
  /* 搜索框 (目前无边框) */
  --searchbar-bg: #ddd;
  --searchbar-text-color: #555;
  --searchbar-border-color: #eee;
  /* 按键输入框背景 */
  --keyinput-ctl-bg: var(--searchbar-bg);
  /* 通知消息 */
  --ntf-bg: #eee;
  --ntf-text-color: var(--text-color);
  /* 加载中遮盖 */
  --loading-mask-bg: linear-gradient(90deg,#ddd 8%,#ccc 18%,#ddd 33%);
  --error-color: red;
}

:root[theme='blue'] {
  /* 全局背景 */
  --bg-color: #eee;
  /* 文本 */
  --text-color: #313131;
  --text-sub-color: #666;
  --hl-color: #2f80ed;
  --hl-text-bg: linear-gradient(to top right, #56ccf2, #2f80ed);
  /* 歌词文本颜色 */
  --text-lyric-color: #666;
  /* 按钮 */
  --svg-color: #666;
  --svg-text-color: #fff;
  --svg-btn-color: #fff;
  --btn-bg: linear-gradient(to right, #2f80ed, #56ccf2);
  --btn-hover-bg: linear-gradient(to top right, #2f80ed, #62a0f6) !important;
  --toggle-btn-bg: #a0a0a0;
  --toggle-btn-color: #eaeaea;
  /* 进度条 */
  --progress-track-bg: linear-gradient(to right, #888, #bbb) !important;
  --btn-hover-bg: linear-gradient(to top right, #0f4a9a, #56ccf2) !important;
  /*滚动条*/
  --scrollbar-thumb-bg: #999;
  /* 列表项 hover */
  --list-item-hover: #ababab !important;
  /* 边框 */
  --main-left-border-color: #888;
  --ctx-menu-border-color: #181818;
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
  --ntf-bg: #ccc;
  --ntf-text-color: var(--text-color);
  /* 加载中遮盖 */
  --loading-mask-bg: linear-gradient(90deg,#ddd 8%,#ccc 18%,#ddd 33%);
  --error-color: red;
}

html, body, #app {
  background-color: var(--bg-color);
  /*
  background-image: linear-gradient(rgba(0, 0, 255, 0.5), rgba(0, 0, 0, 0.68)), 
      url("../renderer/assets/images/clean-sky.jpg");
  background-image: var(--bg-img);
  background-position: center;
  background-size: cover;
  */
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
