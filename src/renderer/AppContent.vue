<script setup>
import { onMounted, shallowRef, inject, provide, computed, ref, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import Mousetrap from 'mousetrap';
import { useSettingStore } from './store/settingStore';
import { usePlayStore } from './store/playStore';
import { useAppCommonStore } from './store/appCommonStore';
import { useUserProfileStore } from './store/userProfileStore';
import { useRecentsStore } from './store/recentsStore';
import { onEvents, emitEvents } from '../common/EventBusWrapper';
import DefaultLayout from './layout/DefaultLayout.vue';
import SimpleLayout from './layout/SimpleLayout.vue';
import { isWinOS, toLowerCaseTrimString, ipcRendererSend, 
  ipcRendererInvoke, onIpcRendererEvents, isBlank, toTrimString, } from '../common/Utils';



const { backward, forward,
  visitSetting, visitSearch,
  visitRadio, visitThemes,
  visitModulesSetting, visitDataBackup,
  visitDataRestore, visitUserHome,
  visitFreeVideoCreate, visitRecents,
  visitPlugins, } = inject('appRoute')
const { quickSearch } = inject('player')

const currentAppLayout = shallowRef(null)

const { isStorePlayStateBeforeQuit, isStoreLocalMusicBeforeQuit,
  getWindowZoom, isSimpleLayout,
  isUseAutoWinCtl, isUseWindowsWinCtl,
  isShowDialogBeforeResetSetting } = storeToRefs(useSettingStore())
const { setupWindowZoom, setupAppSuspension,
  setupTray, setupGlobalShortcut,
  setupAppGlobalProxy } = useSettingStore()

const { togglePlay, switchPlayMode,
  playPrevTrack, playNextTrack,
  toggleVolumeMute, updateVolumeByOffset } = usePlayStore()
const { playingViewShow, videoPlayingViewShow,
  playingViewThemeIndex, commonNotificationText,
  commonNotificationShow, searchBarExclusiveAction,
  searchPlaceHolderIndex } = storeToRefs(useAppCommonStore())
const { togglePlaybackQueueView, toggleLyricToolbar,
  hidePlaybackQueueView, hideAllCtxMenus,
  hideAllCategoryViews, showToast, hideLyricToolbar,
  hideSoundEffectView, hideCustomThemeEditView,
  hideColorPickerToolbar, resetExploreModeActiveStates,
  setMaxScreen, showImportantToast, 
  hidePlayingThemeListView, togglePlayingThemeListView } = useAppCommonStore()


const isReservedPath = (path) => {
  const reservedPaths = ['id', 'name', 'binding', 'gBinding']
  return reservedPaths.indexOf(path) >= 0
}

const deepInState = (state, cache) => {
  for (let path in state) {
    const value = state[path]
    if (value && (typeof value === 'object') && !Array.isArray(value)) {
      deepInState(state[path], cache[path])
    } else if (cache) {
      state[path] = (isReservedPath(path) ? state[path] : cache[path])
    }
  }
}

const visitShortcutKeys = () => {
  searchDefault('@查看快捷键')
}

//注册默认应用级别快捷键
const registryDefaultLocalKeys = () => {
  //按键事件监听
  window.addEventListener('keydown', event => {
    const { key, code, target } = event
    let isTextInputTarget = false
    if (target && target.localName) {
      isTextInputTarget = 'input|textarea'.split('|').includes(toLowerCaseTrimString(target.localName))
    }
    //Space键，当target为输入框 / 文本框时放行，否则阻止默认行为，如滚动条下滑
    if (toLowerCaseTrimString(code) == 'space' && !isTextInputTarget) {
      event.preventDefault()
    }
  })

  // 播放或暂停
  Mousetrap.bind('space', togglePlay)
  // 播放模式切换
  Mousetrap.bind(['m'], switchPlayMode, 'keyup')
  // 导航 - 前进 / 后退
  /*
  Mousetrap.bind(['ctrl+left'], backward)
  Mousetrap.bind(['command+left'], backward)
  Mousetrap.bind(['ctrl+right'], forward)
  Mousetrap.bind(['command+right'], forward)
  */
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
  // 恢复默认设置
  Mousetrap.bind(['ctrl+p'], resetSetting, 'keyup')
  Mousetrap.bind(['command+p'], resetSetting, 'keyup')
  // 打开主题页
  Mousetrap.bind(['t'], visitThemes, 'keyup')
  // 打开我的主页
  Mousetrap.bind(['h'], visitUserHome, 'keyup')
  // 打开功能管理
  Mousetrap.bind(['g'], visitModulesSetting, 'keyup')
  // 打开插件管理
  Mousetrap.bind(['u'], visitPlugins, 'keyup')
  // 快速打开搜索
  Mousetrap.bind(['s'], quickSearch, 'keyup')
  // 快速查看快捷键
  Mousetrap.bind(['k'], visitShortcutKeys, 'keyup')
  // 打开插件管理
  Mousetrap.bind(['r'], visitRecents, 'keyup')
  // 打开/关闭播放样式
  Mousetrap.bind(['v'], () => {
    if (videoPlayingViewShow.value) return
    if (playingViewShow.value) togglePlayingThemeListView()
  }, 'keyup')
}

//TODO 清理设置，解决不同版本导致的数据不一致问题
const cleanupSetting = () => {
  const store = useSettingStore()
  const key = "setting"
  const cache = localStorage.getItem(key)
  if (cache) {
    const cacheStates = JSON.parse(cache)
    store.$reset() //方法失效，与期望值不符
    localStorage.removeItem(key)
    deepInState(store.$state, cacheStates)
    /*
    const _state = JSON.parse(JSON.stringify(store.$state))
    deepInState(_state, cacheStates)
    store.$patch({ ..._state })
    */
  }
  store.$patch({ blackHole: Math.random() * 100000000 })
}

// 恢复默认设置
const resetSetting = async () => {
  let ok = true
  if (isShowDialogBeforeResetSetting.value) ok = await showConfirm({ msg: '确定要恢复默认设置吗？' })
  if (!ok) return
  const settingStore = useSettingStore()
  settingStore.$reset()
  const storeKeys = ['setting']
  storeKeys.forEach(key => {
    localStorage.removeItem(key)
  })
  emitEvents('setting-reset')
  showImportantToast("已恢复默认设置")
}

const setupCache = () => {
  if (!isStorePlayStateBeforeQuit.value) {
    localStorage.removeItem('player')
  }
}

const setupLayout = (isInit) => {
  hideAllPopoverViewsAndToolbars()
  let eventName = 'app-layout-default'
  if (isSimpleLayout.value) {
    currentAppLayout.value = SimpleLayout
    eventName = 'app-layout-simple'
  } else {
    currentAppLayout.value = DefaultLayout
  }
  emitEvents(eventName)
  ipcRendererSend(eventName, { zoom: getWindowZoom.value, isInit })
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

  document.documentElement.style.setProperty('--others-win-ctl-btn-size', `${ctlBtnSize}px`)
  document.documentElement.style.setProperty('--others-win-ctl-max-btn-size', `${maxBtnSize}px`)
  document.documentElement.style.setProperty('--others-win-ctl-collapse-btn-size', `${collapseBtnSize}px`)

  document.documentElement.style.setProperty('--others-win-ctl-margin-left', `${winCtlMarginLeft}px`)
  document.documentElement.style.setProperty('--others-win-ctl-btn-margin-right', `${ctlBtnMarginRight}px`)
}

//TODO
const setVideoViewSize = () => {
  const { clientWidth, clientHeight } = document.documentElement
  const els = document.querySelectorAll('.video-node')
  if (!els) return
  els.forEach(el => {
    el.style.width = `${clientWidth}px`
    el.style.height = `${clientHeight - 56}px`
    el.style.maxHeight = `${clientHeight - 56}px`
  })
}

const hideAllPopoverViews = () => {
  //隐藏当前播放
  hidePlaybackQueueView()
  //隐藏播放样式设置
  hidePlayingThemeListView()
  //隐藏全部分类
  hideAllCategoryViews()
  //隐藏上下文菜单
  hideAllCtxMenus()
  //隐藏未正确关闭的Toast
  hideEmptyToast()
}

const hideAllPopoverViewsAndToolbars = () => {
  hideAllPopoverViews()

  hideLyricToolbar()
  hideSoundEffectView()
  hideCustomThemeEditView()
  hideColorPickerToolbar()
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
  el.style.left = `${left}px`
  el.style.top = `${top}px`
}

const restoreSetting = (isInit) => {
  //初始化
  cleanupSetting()
  setupAppSuspension()
  setupCache()
  setupTray()
  setupGlobalShortcut()
  setupLayout(isInit)
  setupWindowZoom()
  //非初始化，比如重置设置、还原备份数据 
  if (!isInit) {
    resetExploreModeActiveStates()
  }
}

//注册ipcRenderer消息监听器
onIpcRendererEvents({
  'app-active': () => {
    hideEmptyToast()
  },
  'app-quit': setupCache,
})

//数据迁移 - 最近播放记录
const migrateRecentsData = () => {
  //旧版本数据
  const { recents: oRecents } = storeToRefs(useUserProfileStore())
  const { removeAllRecents } = useUserProfileStore()
  const { songs: oSongs, playlists: oPlaylists,
    albums: oAlbums, radios: oRadios } = oRecents.value

  //新版本数据
  const { recents: nRecents } = storeToRefs(useRecentsStore())
  const { songs: nSongs, playlists: nPlaylists,
    albums: nAlbums, radios: nRadios } = nRecents.value

  //同步迁移
  if (nSongs.length < 1 && oSongs.length > 0) nSongs.push(...oSongs)
  if (nPlaylists.length < 1 && oPlaylists.length > 0) nPlaylists.push(...oPlaylists)
  if (nAlbums.length < 1 && oAlbums.length > 0) nAlbums.push(...oAlbums)
  if (nRadios.length < 1 && oRadios.length > 0) nRadios.push(...oRadios)

  //清理旧版本数据
  removeAllRecents()
}

const initialize = () => {
  restoreSetting(true)
  migrateRecentsData()
  //emitEvents('app-init')
}

//直接在setup()时初始化，不需要等待其他生命周期
//initialize()

const searchDefault = async (keyword) => {
  keyword = toTrimString(keyword)
  if (isBlank(keyword)) return

  let searchType = 0
  if (keyword.startsWith('@')) { //格式：@xxx
    keyword = toLowerCaseTrimString(keyword.slice(1))
    searchType = 1
  }

  if (searchType == 0) {
    //默认搜索
  } else if (keyword === '自由FM'
    || keyword === 'fm'
    || keyword === 'freefm') {
    visitRadio('freefm')
    return
  } else if (keyword === '主题'
    || keyword === 'theme') {
    visitThemes()
    return
  } else if (keyword === '功能'
    || keyword === '功能管理'
    || keyword === 'modules') {
    visitModulesSetting()
    return
  } else if (keyword === '备份'
    || keyword == 'backup') {
    visitDataBackup()
    return
  } else if (keyword === '还原'
    || keyword === 'restore') {
    visitDataRestore()
    return
  } else if (keyword === '我的主页'
    || keyword === '主页'
    || keyword === 'userhome') {
    visitUserHome()
    return
  } else if (keyword === '最近播放'
    || keyword === '最近'
    || toLowerCaseTrimString(keyword) === 'recents') {
    visitRecents()
    return
  } else if (keyword === '视频'
    || toLowerCaseTrimString(keyword) === 'video') {
    visitFreeVideoCreate()
    return
  } else if (keyword === '插件管理'
    || keyword === '插件'
    || toLowerCaseTrimString(keyword) === 'plugins') {
    visitPlugins()
    return
  } else if (keyword.startsWith(":")) {
    keyword = toLowerCaseTrimString(keyword.slice(1))
  } else {
    visitSetting()
  }

  //搜索
  switch (searchType) {
    case 1: //页内搜索、定位
      !isBlank(keyword) && ipcRendererInvoke('find-in-page', keyword)
      break
    default: //搜索页
      visitSearch(keyword)
  }
}

const searchAction = computed(() => {
  return searchBarExclusiveAction.value || searchDefault
})

const searchPlaceHolders = [
  '现在想搜索什么', '搜一搜本地歌曲', '试一试关键字以@开头',
  '@FM', '@主题', '@备份',
  '@还原', '@主页', '@功能',
  '@插件'
]
const searchBarPlaceholder = computed(() => {
  const index = searchPlaceHolderIndex.value
  return searchBarExclusiveAction.value ?
    '独占搜索框模式' :
    (searchPlaceHolders[index] || searchPlaceHolders[0])
})

const showContextMenu = (event, data, dataType, index, isPlaybackQueue) => {
  event.preventDefault()
  //if (props.checkbox) return
  if (!isPlaybackQueue) hidePlaybackQueueView()
  //const { data, dataType, index } = props
  setTimeout(() => {
    emitEvents({
      'commonCtxMenu-init': { dataType },
      'commonCtxMenu-show': { event, data, index },
    })
  }, 99)
}

const useWindowsStyleWinCtl = computed(() => {
  //if (isUseWindowsWinCtl.value) return true
  //if (isUseAutoWinCtl.value) return isWinOS()
  //return false

  /*
  return isUseWindowsWinCtl.value ? true :
    (isUseAutoWinCtl.value ? isWinOS() : false)
  */
  
  return isUseWindowsWinCtl.value || (isUseAutoWinCtl.value && isWinOS())
})

const checkMaxScreenState = async () => {
  const isMaxScreen = await ipcRendererInvoke('app-maxScreenState')
  setMaxScreen(isMaxScreen)
}

onMounted(() => {
  //窗口大小变化事件监听
  window.addEventListener('resize', event => {
    //自适应视频页面大小
    //setVideoViewSize()
    //重新检查窗口最大化状态
    checkMaxScreenState()
    emitEvents('app-resize', event)
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

const onDrop = async (event) => {
  event.preventDefault()

  const { files } = event.dataTransfer
  const urls = Array.from(files).map(file => (file.path))
  ipcRendererSend('app-dnd-parsePlay', urls)
}

//EventBus监听注册，统一管理
onEvents({
  'app-zoom': setupTrafficLightWinCtlBtn,
  'app-layout': setupLayout,
  'app-elementAlignCenter': value => {
    const { selector, width, height, offsetLeft, offsetTop } = value
    setElementAlignCenter(selector, width, height, offsetLeft, offsetTop)
  },
  'app-resetSetting': restoreSetting,
  'setting-restore': restoreSetting,
  'setting-reset': restoreSetting,
  'route-visitShortcutKeys': visitShortcutKeys,
  'check-for-updates': () => {
    searchDefault('@检查更新').then(() => emitEvents('setting-checkForUpdates'))
  },
})

//直接在setup()时初始化，不需要等待其他生命周期
initialize()

//通用API
provide('appCommon', {
  //showConfirm,
  showContextMenu,
  searchAction,
  searchDefault,
  searchBarPlaceholder,
  useWindowsStyleWinCtl,
  resetSetting,
})
</script>

<template>
  <div id="app-content" @dragover="e => e.preventDefault()" @drop="onDrop">
    <keep-alive :max="2">
      <component :is="currentAppLayout" :class="{
        'winos-style': isWinOS(),
        'use-winos-win-ctl': useWindowsStyleWinCtl
      }">
      </component>
    </keep-alive>
    <slot></slot>
  </div>
</template>

<style>
#app-content {
  display: flex;
  flex: 1;
  background-image: var(--app-bg-image);
  background-color: var(--app-bg-color);
  background-position: center;
  background-size: cover;
}
</style>
