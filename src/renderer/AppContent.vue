<script setup>
import { onMounted, shallowRef, inject, watch, triggerRef, ref, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import Mousetrap from 'mousetrap';
import { useSettingStore } from './store/settingStore';
import { usePlayStore } from './store/playStore';
import { useAppCommonStore } from './store/appCommonStore';
import Themes from './Themes.vue';
import DefaultLayout from './layout/DefaultLayout.vue';
import SimpleLayout from './layout/SimpleLayout.vue';
import EventBus from '../common/EventBus';
import { useIpcRenderer, useUseCustomTrafficLight } from '../common/Utils';



const { visitSetting } = inject('appRoute')
const ipcRenderer = useIpcRenderer()
const useCustomTrafficLight = useUseCustomTrafficLight()

const currentAppLayout = shallowRef(null)

const { isStorePlayStateBeforeQuit, isStoreLocalMusicBeforeQuit,
  getWindowZoom, isSimpleLayout } = storeToRefs(useSettingStore())
const { setupWindowZoom, setupAppSuspension,
  setupTray, setupGlobalShortcut,
  setupAppGlobalProxy } = useSettingStore()

const { togglePlay, switchPlayMode,
  playPrevTrack, playNextTrack,
  toggleVolumeMute, updateVolumeByOffset } = usePlayStore()
const { playingViewShow, videoPlayingViewShow,
  playingViewThemeIndex, commonNotificationText,
  commonNotificationShow } = storeToRefs(useAppCommonStore())
const { togglePlaybackQueueView, toggleLyricToolbar,
  hidePlaybackQueueView, hideAllCtxMenus,
  hideAllCategoryViews, showToast } = useAppCommonStore()

const isReservedPath = (path) => {
  const reservedPaths = ['id', 'name', 'binding', 'gBinding']
  return reservedPaths.indexOf(path) > -1
}

const deepInState = (state, cache) => {
  for (let path in state) {
    const value = state[path]
    if (value && typeof (value) === 'object') {
      deepInState(state[path], cache[path])
    } else {
      state[path] = (isReservedPath(path) ? state[path] : cache[path])
    }
  }
}

//注册默认应用级别快捷键
const registryDefaultLocalKeys = () => {
  //按键事件监听
  window.addEventListener('keydown', e => {
    //Space键
    if (e.key == ' ') e.preventDefault()
  })

  // 播放或暂停
  Mousetrap.bind('space', togglePlay)
  // 播放模式切换
  Mousetrap.bind(['m'], switchPlayMode, 'keyup')
  // 上 / 下一曲
  Mousetrap.bind(['left'], playPrevTrack)
  Mousetrap.bind(['right'], playNextTrack)
  // 增加 / 减小音量
  Mousetrap.bind(['up'], () => updateVolumeByOffset(0.01))
  Mousetrap.bind(['down'], () => updateVolumeByOffset(-0.01))
  // 最大音量 / 静音
  Mousetrap.bind(['o'], toggleVolumeMute, 'keyup')
  // 打开设置
  Mousetrap.bind(['p'], visitSetting, 'keyup')
  // 打开当前播放
  Mousetrap.bind(['q'], togglePlaybackQueueView, 'keyup')
  // 打开/关闭歌词设置
  Mousetrap.bind(['l'], () => {
    if (videoPlayingViewShow.value) return
    if (playingViewShow.value || isSimpleLayout.value) toggleLyricToolbar()
  }, 'keyup')
}

//TODO 清理设置，解决不同版本导致的数据不一致问题
const cleanupSetting = () => {
  const store = useSettingStore()
  const key = "setting"
  const cache = localStorage.getItem(key)
  if (cache) {
    const cacheStates = JSON.parse(cache)
    store.$reset()
    localStorage.removeItem(key)
    deepInState(store.$state, cacheStates)
  }
  store.$patch({ blackHole: Math.random() * 100000000 })
}

const setupCache = () => {
  if (!isStorePlayStateBeforeQuit.value) {
    localStorage.removeItem('player')
  }
  if (!isStoreLocalMusicBeforeQuit.value) {
    localStorage.removeItem('localMusic')
  }
}

const setupLayout = (isInit) => {
  let channel = 'app-layout-default'
  if (isSimpleLayout.value) {
    currentAppLayout.value = SimpleLayout
    channel = 'app-layout-simple'
  } else {
    currentAppLayout.value = DefaultLayout
    EventBus.emit(channel)
  }
  if (ipcRenderer) ipcRenderer.send(channel, { zoom: getWindowZoom.value, isInit })
  //triggerRef(currentAppLayout)
}

const setupTrafficLightWinCtlBtn = () => {
  const zoom = Number(getWindowZoom.value)
  const scale = 100 / zoom
  const ctlBtnSize = 13 * scale
  const maxBtnSize = 8 * scale
  const collapseBtnSize = 18 * scale
  const winCtlMarginLeft = 15 * scale
  const ctlBtnMarginRight = 8 * scale

  document.documentElement.style.setProperty('--win-ctl-btn-size', `${ctlBtnSize}px`)
  document.documentElement.style.setProperty('--win-ctl-max-btn-size', `${maxBtnSize}px`)
  document.documentElement.style.setProperty('--win-ctl-collapse-btn-size', `${collapseBtnSize}px`)

  document.documentElement.style.setProperty('--win-ctl-margin-left', `${winCtlMarginLeft}px`)
  document.documentElement.style.setProperty('--win-ctl-btn-margin-right', `${ctlBtnMarginRight}px`)
}

//TODO
const setVideoViewSize = () => {
  const { clientWidth, clientHeight } = document.documentElement
  const els = document.querySelectorAll(".video-holder")
  if (!els) return
  els.forEach(el => {
    el.style.width = clientWidth + "px"
    el.style.height = (clientHeight - 56) + "px"
  })
}

const hideAllPopoverViews = () => {
  //隐藏当前播放
  hidePlaybackQueueView()
  //隐藏全部分类
  hideAllCategoryViews()
  //隐藏上下文菜单
  hideAllCtxMenus()
  //隐藏未正确关闭的Toast
  hideEmptyToast()
}

const hideEmptyToast = () => {
  const text = commonNotificationText.value
  if (!text || text.trim().length < 1) forceHideToast()
}

const forceHideToast = () => {
  const els = document.querySelectorAll('.common-ntf')
  if (els) els.forEach(el => el.style.display = 'none')
}

const setElementAlignCenter = (selector, width, height, offsetLeft, offsetTop) => {
  const { clientWidth, clientHeight } = document.documentElement
  const el = document.querySelector(selector)
  if (!el) return
  //offsetXXX 设置偏移量
  const left = (clientWidth - width) / 2 + (offsetLeft || 0)
  const top = (clientHeight - height) / 2 + (offsetTop || 0)
  el.style.left = left + 'px'
  el.style.top = top + 'px'
}

const restoreSetting = () => {
  cleanupSetting()
  setupAppSuspension()
  setupCache()
  setupTray()
  setupGlobalShortcut()
  setupLayout(true)
  setupWindowZoom()
}

//注册ipcRenderer消息监听器
const registryIpcRendererListeners = () => {
  if (!ipcRenderer) return

  ipcRenderer.on('app-active', hideEmptyToast)
  ipcRenderer.on('app-quit', setupCache)
}

const initialize = () => {
  restoreSetting()
  registryIpcRendererListeners()
}

EventBus.on("app-zoom", setupTrafficLightWinCtlBtn)
EventBus.on("app-layout", setupLayout)
EventBus.on("app-elementAlignCenter", value => {
  const { selector, width, height, offsetLeft, offsetTop } = value
  setElementAlignCenter(selector, width, height, offsetLeft, offsetTop)
})
EventBus.on('setting-restore', restoreSetting)
EventBus.on('setting-reset', restoreSetting)

//直接在setup()时初始化，不需要等待其他生命周期
initialize()

onMounted(() => {
  //窗口大小变化事件监听
  window.addEventListener('resize', e => {
    //自适应视频页面大小
    setVideoViewSize()
    EventBus.emit('app-resize')
  })

  //点击事件监听
  document.addEventListener('click', e => {
    //隐藏全部浮层
    hideAllPopoverViews()
  })

  //setupLayout()
  setupAppGlobalProxy()
  //setupWindowCtlButton()
  registryDefaultLocalKeys()
})
</script>

<template>
  <Themes>
    <keep-alive :max="2">
      <component :is="currentAppLayout">
      </component>
    </keep-alive>
    <slot></slot>
  </Themes>
</template>

<style></style>
