<script setup>
import { onMounted, shallowRef, inject, watch } from 'vue';
import Themes from './Themes.vue';
import EventBus from '../common/EventBus';
import { useSettingStore } from './store/settingStore';
import { usePlayStore } from './store/playStore';
import { useAppCommonStore } from './store/appCommonStore';
import { storeToRefs } from 'pinia';
import DefaultLayout from './layout/DefaultLayout.vue';
import SimpleLayout from './layout/SimpleLayout.vue';
import { useIpcRenderer, useUseCustomTrafficLight } from '../common/Utils';
import Mousetrap from 'mousetrap';

const { visitSetting } = inject('appRoute')
const ipcRenderer = useIpcRenderer()
const useCustomTrafficLight = useUseCustomTrafficLight()

const currentAppLayout = shallowRef(null)

const { layout, isStorePlayStateBeforeQuit, 
  isStoreLocalMusicBeforeQuit, getWindowZoom,
  isDefaultLayout, isSimpleLayout } = storeToRefs(useSettingStore())
const { setupWindowZoom, setupAppSuspension, 
  setupTray, setupGlobalShortcut } = useSettingStore()

const { togglePlay, switchPlayMode, 
  playPrevTrack, playNextTrack,
  toggleVolumeMute, updateVolumeByOffset } = usePlayStore()
const { playingViewShow, videoPlayingViewShow, 
  playingViewThemeIndex } = storeToRefs(useAppCommonStore())
const { togglePlaybackQueueView, toggleLyricToolbar, 
  hidePlaybackQueueView, hideAllCtxMenus,
  hideAllCategoryViews } = useAppCommonStore()

const isReservedPath = (path) => {
  const reservedPaths = [ 'id', 'name', 'binding', 'gBinding' ]
  return reservedPaths.indexOf(path) > -1
}

const deepInState = (state, cache) => {
    for(let path in state) {
        const value = state[path]
        if(typeof(value) === 'object') {
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
        if(e.key == ' ') e.preventDefault()
    })

    // 播放或暂停
    Mousetrap.bind('space', togglePlay)
    // 播放模式切换
    Mousetrap.bind(['m'], switchPlayMode, 'keyup')
    // 上 / 下一曲
    Mousetrap.bind(['left'], playPrevTrack)
    Mousetrap.bind(['right'], playNextTrack)
    // 增加 / 减小音量
    Mousetrap.bind(['up'], ()=> updateVolumeByOffset(0.01))
    Mousetrap.bind(['down'], ()=> updateVolumeByOffset(-0.01))
    // 最大音量 / 静音
    Mousetrap.bind(['o'], toggleVolumeMute, 'keyup')
    // 打开设置
    Mousetrap.bind(['p'], visitSetting, 'keyup')
    // 打开当前播放
    Mousetrap.bind(['q'], togglePlaybackQueueView, 'keyup')
    // 打开/关闭歌词设置
    Mousetrap.bind(['l'], () => {
        if(playingViewShow.value || isSimpleLayout.value) toggleLyricToolbar()
    }, 'keyup')
}

//TODO 清理设置，解决不同版本导致的数据不一致问题
const cleanupSetting = () => {
    const store = useSettingStore()
    const key = "setting"
    const cache = localStorage.getItem(key)
    if(cache) {
        const cacheStates = JSON.parse(cache)
        store.$reset()
        localStorage.removeItem(key)
        deepInState(store.$state, cacheStates)
    }
    store.$patch({ blackHole: Math.random() * 100000000 })
}

const setupCache = () => {
  if(!isStorePlayStateBeforeQuit.value) {
      localStorage.removeItem('player')
  }
  if(!isStoreLocalMusicBeforeQuit.value) {
      localStorage.removeItem('localMusic')
  }
}

const setupLayout = () => {
  const index = layout.value.index
  switch (index) {
      case 0:
      case 1:
        currentAppLayout.value = DefaultLayout
        EventBus.emit('app-layout-default')
        if(ipcRenderer) ipcRenderer.send('app-layout-default')
        break
      case 2:
        currentAppLayout.value = SimpleLayout
        if(ipcRenderer) ipcRenderer.send('app-layout-simple')
        break
  }
}

//TODO 暂时弃用macOS自带交通灯控件
const setupWindowCtlButton = () => {
  const visible = !useCustomTrafficLight && !isSimpleLayout.value
  if(ipcRenderer) ipcRenderer.send('app-winBtn', visible)
}

//TODO
const adjustWinCtlBtns = () => {
    const wrapEls = document.querySelectorAll('.header .win-ctl-wrap')
    if(!wrapEls || wrapEls.length < 1) return
    const zoom = Number(getWindowZoom.value)
    const scale = 100 / zoom
    const wrapWidth = 105 * scale
    wrapEls.forEach(el => el.style.width = wrapWidth + 'px')
    const collapseBtnSvgEls = document.querySelectorAll('.header .win-ctl-wrap .collapse-btn svg')
    const collapseBtnSvgSize = 18 * scale
    if(collapseBtnSvgEls) {
      collapseBtnSvgEls.forEach(el => {
        el.style.width = collapseBtnSvgSize + 'px'
        el.style.height = collapseBtnSvgSize + 'px'
        el.style.paddingLeft = 5 * scale + 'px'
      })
    }
}

const hideAllPopoverViews = () => {
    //隐藏当前播放
    hidePlaybackQueueView()
    //隐藏全部分类
    hideAllCategoryViews()
    //隐藏上下文菜单
    hideAllCtxMenus()
}

const setElementAlignCenter = (selector, width, height, offsetLeft, offsetTop) => {
    const { clientWidth, clientHeight } = document.documentElement
    const el = document.querySelector(selector)
    if(!el) return
    //offsetXXX 设置偏移量
    const left = (clientWidth - width) / 2 + (offsetLeft || 0)
    const top = (clientHeight - height) / 2 + (offsetTop || 0)
    el.style.left = left + 'px'
    el.style.top = top + 'px'
}

EventBus.on("app-zoom", adjustWinCtlBtns)
EventBus.on("app-adjustWinCtlBtns", adjustWinCtlBtns)
EventBus.on("app-layout", setupLayout)
EventBus.on("app-elementAlignCenter", value => {
    const { selector, width, height, offsetLeft, offsetTop } = value
    setElementAlignCenter(selector, width, height, offsetLeft, offsetTop)
})

const initialize = () => {
  cleanupSetting()
  if(!isSimpleLayout.value) setupWindowZoom()
  setupAppSuspension()
  setupCache()
  setupTray()
  setupGlobalShortcut()
}

//TODO 直接在setup()时初始化，不需要等待其他生命周期
initialize()

onMounted(() => {
  //点击事件监听
  document.addEventListener('click', e => {
      //隐藏全部浮层
      hideAllPopoverViews()
  })

  setupLayout()
  //setupWindowCtlButton()
  registryDefaultLocalKeys()
})

watch([ playingViewShow, playingViewThemeIndex, videoPlayingViewShow ], adjustWinCtlBtns)
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

<style>
</style>
