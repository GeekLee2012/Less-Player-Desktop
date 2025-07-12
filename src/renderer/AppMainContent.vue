<script setup>
import { onMounted, shallowRef, inject, provide, computed, ref, nextTick, watch } from 'vue';
import { storeToRefs } from 'pinia';
import Mousetrap from 'mousetrap';
import { useSettingStore } from './store/settingStore';
import { usePlayStore } from './store/playStore';
import { useAppCommonStore } from './store/appCommonStore';
import { useUserProfileStore } from './store/userProfileStore';
import { useRecentsStore } from './store/recentsStore';
import { usePlaybackQueueStore } from './store/playbackQueueStore';
import { usePluginStore } from './store/pluginStore';
import { onEvents, emitEvents } from '../common/EventBusWrapper';
import DefaultLayout from './layout/DefaultLayout.vue';
import SimpleLayout from './layout/SimpleLayout.vue';
import { 
  isWinOS, toLowerCaseTrimString, ipcRendererSend, 
  ipcRendererInvoke, onIpcRendererEvents, isBlank, toTrimString, 
  isMacOS, useGitRepository, isDevEnv, readLines, nextInt,
  tryCallDefault, isIpcRendererSupported, 
} from '../common/Utils';
import DefaultNewLayout from './layout/DefaultNewLayout.vue';
import packageCfg from '../../package.json';
import { getDoc, getRaw } from '../common/HttpClient';
import { useCloudStorageStore } from './store/cloudStorageStore';
import { WebDav } from '../vendor/webdav';
import MiniLayout from './layout/MiniLayout.vue';




const { 
  backward, forward,
  visitSetting, visitSearch,
  visitRadio, visitThemes,
  visitModulesSetting, visitDataBackup,
  visitDataRestore, visitUserHome,
  visitVideoCreate, visitRecents,
  visitPlugins, } = inject('appRoute')
const { quickSearch } = inject('player')
const { showConfirm } = inject('apiExpose')


const currentAppLayout = shallowRef(null)

const { 
  isStorePlayStateBeforeQuit, isStoreLocalMusicBeforeQuit,
  getWindowZoom, isSimpleLayout, isDefaultNewLayout, 
  isUseAutoWinCtl, isUseWindowsWinCtl,
  isShowDialogBeforeResetSetting, isAutoLayout,
  isAppCustomShadowShow, isCheckPreReleaseVersion,
  isUseWinCenterStrict, isMiniLayout, 
  isStoreRecentPlay, isAutoClearRecentPlayEnable,
  liveTimeForRecentPlay, needClearRecentSongs, 
  needClearRecentPlaylists, needClearRecentAlbums, 
  needClearRecentRadios, mpvBinaryPath, 
  isCleanUpInvalidPluginsEnable,
} = storeToRefs(useSettingStore())
const { 
  setupWindowZoom, setupAppSuspension,
  setupTray, setupGlobalShortcut,
  setupAppGlobalProxy, setupMpvBinaryPath,
  toggleMiniNavBarMode 
} = useSettingStore()

const { 
  togglePlay, switchPlayMode,
  playPrevTrack, playNextTrack,
  toggleVolumeMute, updateVolumeByOffset 
} = usePlayStore()
const { 
  playingViewShow, videoPlayingViewShow,
  playingViewThemeIndex, commonNotificationText,
  commonNotificationShow, searchBarExclusiveAction,
  searchPlaceHolderIndex 
} = storeToRefs(useAppCommonStore())
const { 
  togglePlaybackQueueView, toggleLyricToolbar,
  hidePlaybackQueueView, hideAllCtxMenus,
  hideAllCategoryViews, showToast, hideLyricToolbar,
  hideSoundEffectView, hideCustomThemeEditView,
  hideColorPickerToolbar, resetExploreModeActiveStates,
  setMaxScreen, showImportantToast, 
  hidePlayingThemeListView, togglePlayingThemeListView,
  togglePlayingView, toggleTrackResourceToolView,
  hideTrackResourceToolView, 
} = useAppCommonStore()

const { webdavSessions } = storeToRefs(useCloudStorageStore())
const { 
  getRecentSongs, getRecentPlaylilsts, 
  getRecentAlbums, getRecentRadios 
} = storeToRefs(useRecentsStore())
const { 
  removeRecentSong, removeRecentPlaylist, 
  removeRecentAlbum, removeRecentRadio 
} = useRecentsStore()


const isReservedPath = (path) => {
  const reservedPaths = ['id', 'name', 'binding', 'gBinding']
  return reservedPaths.indexOf(path) >= 0
}

const deepIntoStates = (states, oldStates, reservedFn) => {
  for (let path in states) {
    const value = states[path]
    if (value && (typeof value === 'object') && !Array.isArray(value)
      && Object.keys(value).length > 0) {
      deepIntoStates(states[path], oldStates[path], reservedFn)
    } else if (oldStates) {
      states[path] = ((typeof reservedFn == 'function') && reservedFn(path)) 
        ? states[path] : oldStates[path]
    }
  }
}

const visitShortcutKeys = () => {
  searchDefault('@快捷键列表')
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
  // 打开搜索
  Mousetrap.bind(['s'], quickSearch, 'keyup')
  // 打开歌曲资源搜索
  Mousetrap.bind(['z'], toggleTrackResourceToolView, 'keyup')
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

//清理设置，解决不同版本导致的数据不一致问题
const cleanupSetting = () => {
  tryCallDefault(() => {
    const store = useSettingStore()
    const key = "setting"
    const cache = localStorage.getItem(key)
    if (cache) {
      const oldStates = JSON.parse(cache)
      store.$reset() //方法失效，与期望值不符
      localStorage.removeItem(key)
      deepIntoStates(store.$state, oldStates, isReservedPath)
      migrateSettingStates(store.$state, oldStates)
    }
    store.$patch({ blackHole: Math.random() * 100000000 })
  })
}

//清理Store，解决不同版本导致的数据不一致问题
const cleanupStore = (store, key) => {
  const cache = localStorage.getItem(key)
  if (cache) {
    const oldStates = JSON.parse(cache)
    store.$reset()
    localStorage.removeItem(key)
    deepIntoStates(store.$state, oldStates)
  }
}

//迁移设置 - 版本升级时尽量向下兼容
const migrateSettingStates = (states, oldStates) => {
  tryCallDefault(() => {
    const { track } = oldStates
    //迁移首页提示 - 本地音乐、自由FM
    if(typeof track.localMusicHomepageTipsShow == 'boolean') {
      Object.assign(states.common,  { 
        localMusicViewTipsShow: track.localMusicHomepageTipsShow 
      })
    }
    if(typeof track.localMusicHomepageTipsShow == 'boolean') {
      Object.assign(states.common,  { 
        freeFMViewTipsShow: track.freeFMHomepageTipsShow 
      })
    }
  })
}

// 恢复默认设置
const resetSetting = async () => {
  let ok = true
  if (isShowDialogBeforeResetSetting.value) ok = await showConfirm('确定要恢复默认设置吗？')
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
  } else if(isDefaultNewLayout.value 
    || (isAutoLayout.value && !isMacOS())) {
    currentAppLayout.value = DefaultNewLayout
  } else if(isMiniLayout.value) {
    eventName = 'app-layout-mini'
    isInit = true
    currentAppLayout.value = MiniLayout
  } else {
    currentAppLayout.value = DefaultLayout
  }
  emitEvents(eventName)
  const zoom = getWindowZoom.value
  const useCenterStrict = isUseWinCenterStrict.value
  ipcRendererSend(eventName, { zoom, isInit, useCenterStrict })
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
  hideTrackResourceToolView()
}

const hideEmptyToast = () => {
  const text = commonNotificationText.value
  if (isBlank(text)) forceHideToast()
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

  //TODO 解决Electron Bug：缩放后内容未按照缩放比例正确显示
  setupLayout(isInit)
  if (isInit) {
    ipcRendererSend('app-mainWin-show', isInit, isUseWinCenterStrict.value)
  } else { 
    //非初始化，比如重置设置、还原备份数据 
    resetExploreModeActiveStates()

  }
}

//注册ipcRenderer消息监听器
onIpcRendererEvents({
  'app-active': hideEmptyToast,
  'app-quit': () => {
    setupCache()
    //避免与ipc事件名称一样，而导致混淆，重新命名事件为app-beforeQuit
    emitEvents('app-beforeQuit')
  },
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


//数据迁移
const migrateData = () => {
  //迁移 - 最近播放记录
  tryCallDefault(migrateRecentsData)
  //迁移 - 左侧导航栏 - 迷你模式
  tryCallDefault(() => {
    //旧版本数据
    const { miniNavBarMode: oMiniNavBarMode } = storeToRefs(useAppCommonStore())
    //新版本数据
    const { miniNavBarMode: nMiniNavBarMode } = storeToRefs(useSettingStore())
    if(oMiniNavBarMode && (typeof oMiniNavBarMode.value == 'boolean') 
      && oMiniNavBarMode.value != nMiniNavBarMode.value) {
      toggleMiniNavBarMode()
      cleanupStore(useAppCommonStore(), 'appCommon')
    }
  })
  //迁移 - 我的主页 - 播放队列
  tryCallDefault(() => cleanupStore(usePlaybackQueueStore(), 'playbackQueueStore'))
}

const initialize = () => {
  restoreSetting(true)
  migrateData()
  setupWebDav()
  checkAppVersion()
  checkAndClearRecentPlay()
  checkAndcleanFavorites()
  checkAndCleanPlugins()
}

const setupWebDav = async () => {
  const sessions = webdavSessions.value || []
  sessions.forEach(session => WebDav.setupAuthorization(session))
}

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
    visitVideoCreate()
    return
  } else if (keyword === '插件管理'
    || keyword === '插件'
    || toLowerCaseTrimString(keyword) === 'plugins') {
    visitPlugins()
    return
  } else if (keyword === '当前'
    || keyword === '当前播放'
    || toLowerCaseTrimString(keyword) === 'playbackQueue') {
    togglePlaybackQueueView()
    return
  } else if (keyword === '播放'
    || keyword === '播放页'
    || toLowerCaseTrimString(keyword) === 'playingView') {
    togglePlayingView()
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
  '现在想搜索什么', '搜一搜本地歌曲', '试一试@关键字',
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

/* 应用更新升级 */
const { GITHUB, GITEE } = useGitRepository()
const changelogUrl = `${GITHUB}/blob/main/CHANGELOG.md`
const changelogUrl2 = `${GITEE}/blob/master/CHANGELOG.md`
const rawChangelogUrl = `${GITEE}/raw/master/CHANGELOG.md`
const mpvDocUrl = `${GITHUB}/blob/main/mpv.md`
//const lastReleaseUrlRoot = `${GITEE}/releases/tag/`
const githubReleasesUrl = `${GITHUB}/releases/`
const giteeReleasesUrl = `${GITEE}/releases/`
const { version } = packageCfg
const lastVersion = ref(version)
const giteeLastVersion = ref(version)
const githubLastVersion = ref(version)
const isLastRelease = ref(true)
const giteeHasNewRelease = ref(false)
const githubHasNewRelease = ref(false)

const setLastRelease = (value) => isLastRelease.value = value
const setGiteeLastVersion = (value) => giteeLastVersion.value = value
const setGithubLastVersion = (value) => githubLastVersion.value = value
const setGiteeHasNewRelease = (value) => giteeHasNewRelease.value = value
const setGithubHasNewRelease = (value) => githubHasNewRelease.value = value

const hasNewRelease = computed(() => {
    return !isLastRelease.value && (giteeHasNewRelease.value || githubHasNewRelease.value)
})

const getLastReleaseVersion = () => {
    return new Promise((resolve, reject) => {
        const _version = `v${version}`
        const timeout1 = 6000
        const timeout2 = 10000
        
        setLastRelease(true)
        setGiteeHasNewRelease(false)
        setGithubHasNewRelease(false)
        setGiteeLastVersion(_version)
        setGithubLastVersion(_version)

        if (isCheckPreReleaseVersion.value) { //包括开发预览版
            Promise.all([getDoc(giteeReleasesUrl), getDoc(githubReleasesUrl)])
                .then(docs => {
                const [giteeDoc, githubDoc] = docs
                const giteeVersion = giteeDoc && giteeDoc.querySelector('.releases-tag-content .release-tag-item .release-meta .tag-name').textContent.trim()
                const githubVersion = githubDoc && githubDoc.querySelector('.repository-content .col-md-2 .mr-3 span').textContent.trim()
                resolve({ giteeVersion, githubVersion })
            }, error => Promise.reject(error))
            .catch(error => reject(error))
        } else { //正式版
            //国内平台一堆幺蛾子，开始不登录不给浏览仓库文件
            getRaw(rawChangelogUrl).then(rawText => {
                const lines = readLines(rawText)
                let versionText = ''
                const keyword = '## v'
                for(let i = 0; i< lines.length; i++) {
                  const line = toTrimString(lines[i])
                  if(line.startsWith(keyword)) {
                    versionText = line.substring(2)
                    break
                  }
                }
                const hasVersionText = !isBlank(versionText)
                const changeLogLastVersion = hasVersionText ? toTrimString(versionText) : _version
                //网络正常时，访问速度相对较快
                //延迟返回，让动画先玩一会；魔力转圈圈，也有助于控制对当前网站的访问频率
                setTimeout(() => {
                  resolve({
                      giteeVersion: changeLogLastVersion,
                      githubVersion: changeLogLastVersion
                  })
                }, 666 + nextInt(2333))
            }, error => Promise.reject(error))
            .catch(error => reject(error))
        }
    })
}

const checkingUpdates = ref(false)
const setCheckingUpdates = (value) => checkingUpdates.value = value
const checkForUpdates = async () => {
    if(checkingUpdates.value) return 
    setCheckingUpdates(true)
    setLastRelease(true)
    const result = await getLastReleaseVersion().catch(error => {
            checkingUpdates.value = false
            return { version, error }
        })
    if (!result) return setCheckingUpdates(false)
    const { giteeVersion, githubVersion, error } = result
    if(error) return setCheckingUpdates(false)
    const currentVersion = `v${version}`
    lastVersion.value = currentVersion
    if (giteeVersion) {
        setGiteeLastVersion(giteeVersion)
        setGiteeHasNewRelease(giteeVersion > currentVersion)

        if (giteeVersion >= lastVersion.value) lastVersion.value = giteeVersion
    }
    if (githubVersion) {
        setGithubLastVersion(githubVersion)
        setGithubHasNewRelease(githubVersion > currentVersion)

        if (githubVersion >= lastVersion.value) lastVersion.value = githubVersion
    }
    setLastRelease(currentVersion >= lastVersion.value)
    setCheckingUpdates(false)
    return !isLastRelease.value
}

let checkAppVersionTimer = null, checkRetry = 0
const checkAppVersion = async () => {
  const MINUTE = 60 * 1000
  const callback = () => {
    if(isDevEnv()) {
      console.log(`[ ${checkRetry > 0 ? 'VERSION': 'STARTUP'} - checkForUpdates ]`)
    }
    checkForUpdates().then(result => {
      if(result === true) {
        clearInterval(checkAppVersionTimer)
        checkRetry = 0
        if(isDevEnv() && result) console.log('[ VERSION - New Release ]')
      } else if(++checkRetry >= 6) { // 1h
        clearInterval(checkAppVersionTimer)
        checkAppVersionTimer = setInterval(callback, 15 * MINUTE)
      } else if(++checkRetry >= 10) { // 2h
        clearInterval(checkAppVersionTimer)
        checkAppVersionTimer = setInterval(callback, 20 * MINUTE)
      } else if(++checkRetry >= 13) { // 3h
        clearInterval(checkAppVersionTimer)
        checkAppVersionTimer = setInterval(callback, 10 * MINUTE)
      } else if(++checkRetry >= 16) { // 3.5h
        clearInterval(checkAppVersionTimer)
        checkRetry = 0
      }
    })
  }
  callback()

  //失败重试
  clearInterval(checkAppVersionTimer)
  checkAppVersionTimer = setInterval(callback, 10 * MINUTE)
}

const tryRemoveExpiredRecentItems = async (recentItems, removeFn, memo) => {
  if(!recentItems || recentItems.length < 1) return
  if(!removeFn || (typeof removeFn != 'function')) return 

  const liveTime = liveTimeForRecentPlay.value
  const liveTimeMillis = liveTime * (24 * 60 * 60 * 1000)
  const currentMillis = Date.now()
  let effected = 0
  try {
    for(let i = 0; i < recentItems.length; i++) {
      const item = recentItems[i]
      const { id, updated } = item

      //清理无效记录
      if(isBlank(id)) {
        recentItems.splice(i, 1)
        ++effected
        continue
      }

      if(!updated || updated < 1) continue 
      //清理过期记录
      if((currentMillis - updated) >= liveTimeMillis) {
        removeFn(item, (e) => (e.id == id && e.updated == updated))
        ++effected
      }
    }
  } catch(e) {
    if(isDevEnv()) console.log(e)
  }

  if(isDevEnv() && effected && memo) {
    console.log(`[ Cache - AutoClearRecents - ${memo}] Effected: ${effected}`)
  }
}

//检查清理最近播放
const checkAndClearRecentPlay = async () => {
  const isStoreEnable = isStoreRecentPlay.value
  const isAutoClearEnable = isAutoClearRecentPlayEnable.value
  if(!isStoreEnable || !isAutoClearEnable) return

  if(needClearRecentSongs.value) {
    tryRemoveExpiredRecentItems(getRecentSongs.value(), removeRecentSong, 'Songs')
  }
  
  if(needClearRecentPlaylists.value) {
    tryRemoveExpiredRecentItems(getRecentPlaylilsts.value(), removeRecentPlaylist, 'Playlilsts')
  }

  if(needClearRecentAlbums.value) {
    tryRemoveExpiredRecentItems(getRecentAlbums.value(), removeRecentAlbum, 'Albums')
  }
  
  if(needClearRecentRadios.value) {
    tryRemoveExpiredRecentItems(getRecentRadios.value(), removeRecentRadio, 'Radios')
  }
}

//检查清洗我的收藏
const checkAndcleanFavorites = async () => {
  const { cleanFavoriteTracks } = useUserProfileStore()
  try {
    cleanFavoriteTracks()
  } catch(error) {
    if(isDevEnv()) console.log(error)
  }
}

//检查清理无效插件
const checkAndCleanPlugins = async () => {
  const needClean = isCleanUpInvalidPluginsEnable.value
  if(!needClean) return
  
  const { plugins } = usePluginStore()
  try {
    const paths = plugins.map(plugin => (plugin.path))
    ipcRendererSend('app-cleanUpPlugins', paths)
  } catch(error) {
    if(isDevEnv()) console.log(error)
  }
}

const toggleTrackResourceTool = () => {
  if(isSimpleLayout.value || isMiniLayout.value) return
  
  toggleTrackResourceToolView()
}




watch(mpvBinaryPath, setupMpvBinaryPath, { immediate: true })

onMounted(() => {
  //窗口大小变化事件监听
  window.addEventListener('resize', event => {
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
      nextTick(() => {
        const { selector, width, height, offsetLeft, offsetTop } = value
        setElementAlignCenter(selector, width, height, offsetLeft, offsetTop)
      })
  },
  'app-resetSetting': resetSetting,
  'setting-restore': restoreSetting,
  'setting-reset': restoreSetting,
  'route-visitShortcutKeys': visitShortcutKeys,
  'check-for-updates': () => {
    searchDefault('@检查更新').then(() => checkForUpdates())
  },
})

//直接在setup()时初始化，不需要等待其他生命周期
initialize()

//通用API
provide('appCommon', {
  showContextMenu,
  searchAction,
  searchDefault,
  searchBarPlaceholder,
  useWindowsStyleWinCtl,
  resetSetting,
})

provide('appVersion', {
  version,
  lastVersion,
  giteeLastVersion,
  githubLastVersion,
  checkingUpdates,
  checkForUpdates,
  giteeHasNewRelease,
  githubHasNewRelease,
  isLastRelease,
  hasNewRelease,
  giteeReleasesUrl,
  githubReleasesUrl,
  changelogUrl,
  mpvDocUrl,
})
</script>

<template>
  <div id="app-main-content" @dragover="e => e.preventDefault()" @drop="onDrop"
      :class="{
        'winos-style': isWinOS(),
        'use-winos-win-ctl': useWindowsStyleWinCtl,
        'custom-shadow': isAppCustomShadowShow,
        'none-electron': !isIpcRendererSupported(),
      }"
      @contextmenu.prevent="toggleTrackResourceTool" >
    <keep-alive :max="1">
      <component :is="currentAppLayout">
      </component>
    </keep-alive>
    <slot></slot>
  </div>
</template>

<style>
#app-main-content {
  display: flex;
  flex: 1;
  background-image: var(--app-bg-image);
  background-color: var(--app-bg-color);
  background-position: center;
  background-size: cover;
}
</style>
