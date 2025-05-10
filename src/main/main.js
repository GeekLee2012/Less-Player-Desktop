const { app, BrowserWindow, ipcMain,
  Menu, dialog, powerMonitor,
  shell, powerSaveBlocker, Tray,
  globalShortcut, session, utilityProcess,
  protocol, nativeTheme, MessageChannelMain,
  nativeImage,  screen, net,
} = require('electron')

const { isMacOS, isWinOS, useCustomTrafficLight, isDevEnv,
  USER_AGENTS, AUDIO_EXTS, IMAGE_EXTS, APP_ICON,
  AUDIO_PLAYLIST_EXTS, BACKUP_FILE_EXTS, 
  TrayAction, GitRepository
} = require('./env')

const { scanDirTracks, parseTracks,
  readText, writeText, FILE_PREFIX,
  randomTextWithinAlphabetNums, nextInt,
  getDownloadDir, removePath, listFiles,
  parsePlsFile, parseM3uPlaylist,
  writePlsFile, writeM3uFile,
  ImageProtocal, parseImageMetaFromFile,
  statPathSync, MD5, SHA1, transformPath,
  DEFAULT_COVER_BASE64, getSimpleFileName,
  getFileExtName, walkSync, isSuppotedVideoType,
  parseVideos, parseEmbeddedLyricFromFile,
} = require('./common')

const path = require('path')
const Url = require('url')
const { writeFile, mkdirSync, writeFileSync, rmSync, readdirSync } = require('fs')
const fetch = require('electron-fetch').default


let messagePortPair = null, messagePortChannel = null
let appUserAgent =  null, exRequestHandlers = []
let useTemplateImage = false

const DEFAULT_LAYOUT = 'default', SIMPLE_LAYOUT = 'simple', MINI_LAYOUT = 'mini'
const miniExpandSize = 520
const appLayoutConfig = {
  'default': {
    appWidth: 1080,
    appHeight: 720
  },
  'simple': {
    appWidth: 500,
    appHeight: 588
  },
  'mini': {
    appWidth: 466,
    appHeight: 139
  },
}
let mainWin = null, lyricWin = null, appLayout = DEFAULT_LAYOUT
let currentZoom = 85, useWinCenterStrict = false
let markWidth = 0, markHeight = 0
let appConfig = {}
let powerSaveBlockerId = -1
let appTray = null, appTrayMenu = null, appTrayShow = false
let playState = false, desktopLyricLockState = false
//let lyricWinMinWidth = 450, lyricWinMinHeight = 168
const proxyAuthRealms = []
// 下载队列
const downloadingQueue = []
// 待播放任务列表
let pendigPlayTasks = []
// 贴边隐藏
let isHiddenOnEdges = false, prevX = null, prevY = null


/* 自定义函数 */
const startup = () => {
  initialize()
  registryGlobalListeners()
  handleStartupPlay()
}

//清理缓存
const clearCaches = async (force) => {
  if (!isWindowAccessible(mainWin)) return false
  try {
    const { session } = mainWin.webContents
    const cacheSize = await session.getCacheSize()
    const limit = 512 * 1024 * 1024
    if (cacheSize >= limit || force) {
      session.clearCache()
    }
    session.clearCodeCaches({ urls: [] })
    return true
  } catch (error) {
    if (isDevEnv) console.log(error)
  }
  return false
}

//当data存在时，直接返回data，完全忽略url
//当url不存在时，直接返回data
const fetchBuffer = async (url, data) => {
  if(data || !url) return data
  const response = await fetch(url)
  return response.buffer()
}

const initialize = () => {
  initAppConfig()

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(async () => {
    //全局快捷键
    //registryGlobalShortcuts()
    //全局UserAgent
    appUserAgent = USER_AGENTS[nextInt(USER_AGENTS.length)]
    app.userAgentFallback = appUserAgent
    mainWin = createMainWindow({ show: false, isInit: true })
    
    //清理缓存
    clearCaches()

    session.defaultSession.on('will-download', (event, item, webContents) => {
      //event.preventDefault()
      const urlChain = item.getURLChain()
      let queuedItemMeta = null
      if(downloadingQueue.length > 0) {
        for(var i = 0; i < urlChain.length; i++) {
          const url = urlChain[i]
          const index = downloadingQueue.findIndex(qItem => {
            return (qItem.url == url) || (qItem.url == decodeURIComponent(url))
          })
          queuedItemMeta = downloadingQueue[index]
          if(queuedItemMeta) break
        }
      }

      if(queuedItemMeta) {
        const { file, savePath } = queuedItemMeta
        let _savePath = transformPath(file || savePath)
        if(_savePath) {
          if(isWinOS) _savePath = _savePath.replace(/\//g, '\\')
          item.setSavePath(_savePath)
        }
      } else { //不在下载队列，直接忽略，不允许下载
        event.preventDefault()
      }

      /*
      item.on('updated', (event, state) => {
        if (state == 'progressing') {
          const received = item.getReceivedBytes()
          const total = item.getTotalBytes()
        }
      })
      */
      item.on('updated', (event, state) => {
        if(state == 'interrupted') {
          if(isDevEnv) console.log('[DownloadItem - Interrupted]', item)
        }
      })


      item.on('done', (event, state) => {
        if(!queuedItemMeta) return
        const { fromAction } = queuedItemMeta
        if (state === 'completed') { //下载完成
          if(fromAction == 'dnd-saveToLocal') {
            sendToMainRenderer('dnd-saveToLocal-result', { ...queuedItemMeta, error: null })
          }
        } else { //下载失败
          if(fromAction == 'dnd-saveToLocal') {
            sendToMainRenderer('dnd-saveToLocal-result', { ...queuedItemMeta, error: 'Unknown Error' })
          }
        }
        removeFromDownloadingQueue(queuedItemMeta)
      })
    })

    /*
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        cancel: false,
        responseHeaders: {
          'Access-Control-Allow-Origin': '*',
          ...details.responseHeaders,
        }
      })
    })
    */

    //自定义协议
    protocol.registerBufferProtocol(ImageProtocal.scheme, (request, callback) => {
      const file = decodeURI(request.url.slice(ImageProtocal.prefix.length))
      parseImageMetaFromFile(file).then(image => {
        if (image) {
          const { format: mimeType, data } = image
          return callback({ mimeType, data })
        }
        callback({ mimeType: 'image/png', data: Buffer.from(DEFAULT_COVER_BASE64, 'base64')})
      })
    })
  })

  app.on('activate', (event) => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0 || mainWin.isDestroyed()) {
      mainWin = createMainWindow({ show: true })
    } else if(!isMainWindowShow()) {
      showMainWindow()
    }
    sendToMainRenderer('app-active')
  })

  app.on('did-become-active', (event) => {
    sendToMainRenderer('app-active')
  })

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', (event) => {
    if (!isDevEnv || !isMacOS) app.quit()
  })

  app.on('before-quit', (event) => {
    cleanupBeforeQuit()
    saveAppStates()
    sendToMainRenderer('app-quit')
  })

  app.on('login', (event, webContents, details, authInfo, callback) => {
    const { isProxy, scheme, host, port } = authInfo
    if (isProxy) {
      event.preventDefault()
      const { username, secret } = getProxyAuthRealm(scheme, host, port)
      callback(username, secret)
    }
  })

  nativeTheme.on('updated', () => {
    const { themeSource, shouldUseDarkColors } = nativeTheme
    sendToMainRenderer('app-nativeTheme-updated', { themeSource, shouldUseDarkColors })
  })

}

//全局快捷键
const registryGlobalShortcuts = () => {
  const config = {
    // 查看快捷键设置
    'Alt+Shift+K': 'visitShortcutKeys',
    // 播放或暂停
    'Alt+Shift+Space': 'togglePlay',
    // 播放模式切换
    'Alt+Shift+M': 'switchPlayMode',
    // 上 / 下一曲
    'Alt+Shift+Left': 'playPrev',
    'Alt+Shift+Right': 'playNext',
    // 增 / 减音量
    'Alt+Shift+Up': 'volumeUp',
    'Alt+Shift+Down': 'volumeDown',
    // 最大音量 / 静音
    'Alt+Shift+O': 'toggleVolumeMute',
    // 打开设置
    'Alt+Shift+P': 'visitSetting',
    // 打开 / 关闭当前播放
    'Alt+Shift+Q': 'togglePlaybackQueue',
    // 打开 / 关闭歌词设置
    'Alt+Shift+L': 'toggleLyricToolbar',
    // 恢复默认设置
    'Ctrl+Alt+Shift+P': 'resetSetting',
    'Command+Alt+Shift+P': 'resetSetting',
    // 快速打开搜索
    'Control+Alt+Shift+S': 'quickSearch',
    'Command+Alt+Shift+S': 'quickSearch',
    // 打开主题页
    'Alt+Shift+T': 'visitThemes',
    // 打开我的主页
    'Alt+Shift+H': 'visitUserHome',
    // 打开功能管理
    'Alt+Shift+U': 'visitModulesSetting',
    // 打开插件管理
    'Alt+Shift+U': 'visitPlugins',
    // 打开最近播放
    'Alt+Shift+R': 'visitRecents',
    // 打开 / 关闭播放样式
    'Alt+Shift+V': 'togglePlayingThemes',
    // 打开 / 关闭歌曲资源搜索
    'Alt+Shift+Z': 'toggleTrackResourceToolView',
    // 打开 开发者工具
    'Control+Alt+Shift+I': () => openDevTools(mainWin),
    'Command+Alt+Shift+I': () => openDevTools(mainWin),
    'Control+Alt+Shift+J': () => openDevTools(lyricWin),
    'Command+Alt+Shift+J': () => openDevTools(lyricWin),
  }

  const activeWindowValues = ['visitSetting', 'togglePlaybackQueue', 'toggleLyricToolbar']
  for (const [key, value] of Object.entries(config)) {
    globalShortcut.register(key, () => {
      const valueType = typeof value
      if (valueType === 'function') {
        value()
      } else if (valueType === 'string') {
        sendToMainRenderer(`globalShortcut-${value}`)
        if (activeWindowValues.includes(value)) mainWin.show()
      }
    })
  }
}

const addToPendingPlayTasks = (files) => {
  if (!files || !Array.isArray(files) || files.length < 1) return
  pendigPlayTasks.push(...files)
}

const removePendingPlayTasks = (files) => {
  //if (!files || !Array.isArray(files) || files.length < 1) return
  //if (pendigPlayTasks.length < 1) return
  pendigPlayTasks.length = 0
  /*
  files.forEach(file => {
    const _path = transformPath(file.url)
    let index = pendigPlayTasks.indexOf(_path)
    let count = 0
    while (index > -1) {
      if (count >= 10) break
      pendigPlayTasks.splice(index, 1)
      index = pendigPlayTasks.indexOf(_path)
      ++count
    }
  })
  */
}

const parseAndPlayTasks = (files) => {
  if (!files || !Array.isArray(files) || files.length < 1) return

  try {
    //只检查第一顺序位文件
    if(isSuppotedVideoType(files[0])) {
      return parseVideos(files).then(video => {
        sendToMainRenderer('app-startup-playVideos', video)
      })
    }
    //尝试解析音频文件
    parseTracks(files).then(tracks => {
      sendToMainRenderer('app-startup-playTracks', tracks)
    })
  } catch (error) {
    if (isDevEnv) console.log(error)
  }
}



//启动时播放
//即关联打开，播放音/视频等文件
const doStartupPlay = (files) => {
  addToPendingPlayTasks(files)
  parseAndPlayTasks(files)
  showMainWindow()
}

const handleStartupPlay = (argv) => {
  try {
    if (!isMacOS) return doStartupPlay(argv || process.argv)
    
    app.on('open-file', (event, path) => {
      event.preventDefault()
      doStartupPlay([path])
    })
  } catch (error) {
    if (isDevEnv) console.log(error)
  }
}

//在菜单栏显示
const setupTray = (forceShow, forceUseTempldate) => {
  if (appTrayShow || forceShow) {
    if (appTray) appTray.destroy()
    const useNativeTemplate = isMacOS && (forceUseTempldate || useTemplateImage)
    const { path: defaultPath, templatePath, options } = APP_ICON
    const iconPath = useNativeTemplate ? templatePath :defaultPath
    const iconOption = options[isMacOS ? 0 : 1]
    const icon = nativeImage.createFromPath(path.join(__dirname, iconPath)).resize(iconOption)
    if(isMacOS) icon.setTemplateImage(useNativeTemplate)
    appTray = new Tray(icon)
    appTrayMenu = Menu.buildFromTemplate(initTrayMenuTemplate())
    appTray.setContextMenu(appTrayMenu)
    appTray.addListener('double-click', (event, bounds) => {
      if(!isMainWindowShow()) showMainWindow()
    })
  } else if (appTray) {
    appTray.destroy()
    appTray = null
    appTrayMenu = null
  }
  setupTrayMenu()
}

const setupTrayMenu = () => {
  if (!appTrayMenu) return
  const desktopLyricOpenState = isLyricWindowShow()
  const desktopLyricPinState = (lyricWin && lyricWin.isAlwaysOnTop())
  const states = {
    'play': !playState,
    'pause': playState,
    'desktop-lyric-open': !desktopLyricOpenState,
    'desktop-lyric-close': desktopLyricOpenState,
    'desktop-lyric-lock': desktopLyricOpenState && !desktopLyricLockState,
    'desktop-lyric-unlock': desktopLyricOpenState && desktopLyricLockState,
    'desktop-lyric-pin': desktopLyricOpenState && !desktopLyricPinState,
    'desktop-lyric-unpin': desktopLyricOpenState && desktopLyricPinState,
  }

  for (const [key, value] of Object.entries(states)) {
    const item = appTrayMenu.getMenuItemById(key)
    item.visible = value
  }
  return appTrayMenu
}

//全局事件监听
const registryGlobalListeners = () => {
  //主进程事件监听
  ipcMain.on('app-quit', () => {
    if (isWindowAccessible(mainWin)) {
      if (isLyricWindowShow()) {
        setupTray(true)
        mainWin.hide()
        return
      } else if (appTrayShow) {
        mainWin.hide()
        return
      } else if (isDevEnv && isMacOS) {
        mainWin.close()
        return
      }
    }
    cleanupBeforeQuit()
    app.quit()
  }).on('app-startup-playReady', (event) => {
    parseAndPlayTasks(pendigPlayTasks)
  }).on('app-startup-playDone', (event, files) => {
    removePendingPlayTasks(files)
  }).on('app-dnd-parsePlay', (event, files) => {
    parseAndPlayTasks(files)
  }).on('app-min', (event, isHideToTray) => {
    if (isHideToTray) {
      isMacOS ? app.hide() : mainWin.hide()
      return setupTray(true)
    }
    if (mainWin.isFullScreen()) mainWin.setFullScreen(false)
    if (mainWin.isMaximized() || mainWin.isNormal()) mainWin.minimize()
  }).on('app-max', () => {
    if(!isWindowAccessible(mainWin)) return
    
    markMainWindowSize()
    let isFullScreen = false
    if (isWinOS) {
      isFullScreen = toggleWinOSFullScreen()
    } else {
      isFullScreen = !mainWin.isFullScreen()
      mainWin.setFullScreen(isFullScreen)
    }
    sendToMainRenderer('app-max', isFullScreen)
    setTimeout(fixElectronExitFullScreen, 365)
  }).on('app-normalize', () => {
    if (!isWindowAccessible(mainWin)) return
    if (isWinOS && mainWin.isMaximized()) {
      mainWin.unmaximize()
    } else if (mainWin.isFullScreen()) {
      mainWin.setFullScreen(false)
    }
    sendToMainRenderer('app-max', false)
  }).on('app-suspension', (event, data) => {
    if (data === true) {
      powerSaveBlockerId = powerSaveBlocker.start('prevent-app-suspension')
    } else if (powerSaveBlockerId != -1) {
      powerSaveBlocker.stop(powerSaveBlockerId)
      powerSaveBlockerId = -1
    }
  }).on('app-tray', (event, isShow, isNative) => {
    appTrayShow = isShow
    useTemplateImage = isNative
    setupTray()
  }).on('app-zoom', (event, { zoom, noResize, useForCreate, useCenterStrict }) => {
    useWinCenterStrict = useCenterStrict
    setupAppWindowZoom(zoom, noResize, useForCreate, useCenterStrict)
  }).on('app-winBtn', (event, value) => {
    setWindowButtonVisibility(mainWin, value === true)
  }).on('app-layout-default', (event, { zoom, isInit, useCenterStrict }) => {
    useWinCenterStrict = useCenterStrict
    setupAppLayout(DEFAULT_LAYOUT, zoom, isInit, useCenterStrict)
  }).on('app-layout-simple', (event, { zoom, isInit, useCenterStrict }) => {
    useWinCenterStrict = useCenterStrict
    setupAppLayout(SIMPLE_LAYOUT, zoom, isInit, useCenterStrict)
  }).on('app-layout-mini', (event, { zoom, isInit, useCenterStrict }) => {
    useWinCenterStrict = useCenterStrict
    setupAppLayout(MINI_LAYOUT, zoom, isInit, useCenterStrict)
  }).on('app-layout-mini-toggleExpand', (event, { zoom, isInit, useCenterStrict, expand }) => {
    useWinCenterStrict = useCenterStrict
    setupAppLayout(MINI_LAYOUT, zoom, isInit, useCenterStrict, expand)
  }).on('app-globalShortcut', (event, data) => {
    if (data === true) {
      globalShortcut.unregisterAll()
      registryGlobalShortcuts()
    } else {
      globalShortcut.unregisterAll()
    }
  }).on('app-setGlobalProxy', (event, data) => {
    setupAppGlobalProxy(data)
  }).on('visit-link', (event, url) => {
    visitLink(url)
  })/*.on('download-item', (event, { url }) => {
    downloadDefault(url)
  }).on('download-cancel', (event, data) => {
    cancelDownload()
  })*/.on('path-showInFolder', (event, path) => {
    if (path) shell.showItemInFolder(path)
  }).on('dnd-saveToLocal', async (event, { file, name, type, data, url, useDefaultIcon, silent }) => {
    const hasData = (file && data)
    const hasUrl = (url && url.startsWith('http'))
    if(!hasData && !hasUrl) return 

    if(!useDefaultIcon) {
      //Electron拖拽支持文件，其他类型暂不支持
      //此处仅为改变拖拽图标样式，并无其他意义
      event.sender.startDrag({
        file: path.join(__dirname, file),
        icon: path.join(__dirname, 'dnd_icon.png')
      })
    }
    
    const fileMeta = { file, name, type, data, url, useDefaultIcon, silent }
    file = transformPath(file)
    //TODO 特殊符号处理：<>/|:*?
    if(!isMacOS) file = file.replace(/\|/g, '--')
    fetchBuffer(url, data).then(_data => {
      writeFile(file, _data, error => {
        sendToMainRenderer('dnd-saveToLocal-result', { ...fileMeta, error })
        if(error && isDevEnv) console.log('[WriteFile - Error]', error)
      })
    }).catch(error => {
      if(error) {
        downloadDefault(url, { ...fileMeta, fromAction: 'dnd-saveToLocal' })
        if(isDevEnv) console.log('[FetchBuffer - Error]', error)
      }
    })
  }).on('app-setProgressBar', (event, data) => {
    if(isWindowAccessible(mainWin)) mainWin.setProgressBar(data)
  }).on('app-markBoundsState', (event, data) => {
    markAppBoundsState()
  }).on('app-restoreBoundsState', (event, ...args) => {
    const useCenterStrict = args[0]
    restoreAppBounds(useCenterStrict)
  })

  ipcMain.handle('app-netOnline', (event, ...args) => {
    return net.isOnline()
  })

  ipcMain.handle('app-nativeTheme-shouldUseDarkColors', (event, ...args) => {
    return nativeTheme.shouldUseDarkColors
  })

  ipcMain.handle('app-maxScreenState', (event, ...args) => {
    if (!isMainWindowShow()) return false
    return mainWin && (mainWin.isMaximized() || mainWin.isFullScreen())
  })

  ipcMain.handle('open-audio-playlist', async (event, ...args) => {
    const result = await dialog.showOpenDialog(mainWin, {
      title: '请选择Audio Playlist文件',
      filters: [{ name: 'Playlist文件', extensions: AUDIO_PLAYLIST_EXTS }],
      properties: ['openFile']
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  ipcMain.handle('parse-audio-playlist', async (event, ...args) => {
    const file = args[0].trim()
    let result = null
    if (file.toLowerCase().endsWith(`.${AUDIO_PLAYLIST_EXTS[2]}`)) {
      result = await parsePlsFile(file)
    } else if (file.toLowerCase().endsWith(`.${AUDIO_PLAYLIST_EXTS[0]}`)
      || file.toLowerCase().endsWith(`.${AUDIO_PLAYLIST_EXTS[1]}`)) {
      result = await parseM3uPlaylist(file)
    }
    return result
  })

  ipcMain.handle('dnd-open-audio-playlist', async (event, ...args) => {
    const file = args[0].trim()
    const deep = args.length > 1 ? args[1] : false
    let result = null
    if (file.toLowerCase().endsWith(`.${AUDIO_PLAYLIST_EXTS[2]}`)) {
      result = await parsePlsFile(file)
    } else if (file.toLowerCase().endsWith(`.${AUDIO_PLAYLIST_EXTS[0]}`)
      || file.toLowerCase().endsWith(`.${AUDIO_PLAYLIST_EXTS[1]}`)) {
      result = await parseM3uPlaylist(file)
    } else {
      result = await scanDirTracks(file, null, deep)
    }
    return result
  })

  ipcMain.handle('dnd-open-audios', async (event, ...args) => {
    const path = args[0]
    const deep = args.length > 1 ? args[1] : false
    const statResult = statPathSync(path)
    if (!statResult) return null
    const result = []
    if (statResult.isFile()) {
      const tracks = await parseTracks([path])
      result.push({ path, data: tracks })
    } else if (statResult.isDirectory()) {
      const tracks = await scanDirTracks(path, null, deep)
      result.push(tracks)
    }
    return result
  })

  ipcMain.handle('export-playlists', async (event, ...args) => {
    const { path, format, data: playlists, looseMode } = args[0]
    let result = false
    if (playlists && playlists.length > 0) {
      const tasks = []
      for (var i = 0; i < playlists.length; i++) {
        const { title, data } = playlists[i]
        let file = `${path}/${title}.${format}`
        if (format == AUDIO_PLAYLIST_EXTS[2]) {
          tasks.push(writePlsFile(file, data))
        } else if (format == AUDIO_PLAYLIST_EXTS[0]
          || format == AUDIO_PLAYLIST_EXTS[0]) {
          tasks.push(writeM3uFile(file, data, looseMode))
        } else if (format == BACKUP_FILE_EXTS[0]) {
          result = result || writeText(file, data)
        }
      }
      if (tasks.length > 0) {
        const taskResults = await Promise.all(tasks)
        taskResults.forEach(success => result = result || success)
      }
    }
    return result
  })

  ipcMain.handle('choose-dirs', async (event, ...args) => {
    const result = await dialog.showOpenDialog(mainWin, {
      title: '请选择文件夹',
      properties: ['openDirectory']
    })
    if (result.canceled) return null
    return result.filePaths
  })

  ipcMain.handle('open-audio-dirs', async (event, ...args) => {
    const dirs = args[0]
    const deep = args.length > 1 ? args[1] : false
    const result = []
    for (var i = 0; i < dirs.length; i++) {
      const tracks = await scanDirTracks(dirs[i], null, deep)
      result.push(tracks)
    }
    return result
  })

  ipcMain.handle('open-audios', async (event, ...args) => {
    const result = await dialog.showOpenDialog(mainWin, {
      title: '请选择文件',
      filters: [
        { name: 'Audios', extensions: AUDIO_EXTS }
      ],
      properties: ['openFile', 'multiSelections']
    })
    if (result.canceled) return null
    return parseTracks(result.filePaths)
  })

  ipcMain.handle('open-image', async (event, ...args) => {
    const { noFilePrefix, path } = args[0] || {}
    const result = await dialog.showOpenDialog(mainWin, {
      title: '请选择文件',
      filters: [
        { name: 'Image', extensions: IMAGE_EXTS }
      ],
      properties: ['openFile'],
      defaultPath: transformPath(path) || ''
    })
    return result.filePaths.map(item => {
      item = transformPath(item)
      return noFilePrefix ? item : (FILE_PREFIX + item)
    })
  })

  ipcMain.handle('open-image-base64', async (event, ...args) => {
    const file = args[0].trim().slice(ImageProtocal.prefix.length)
    const imageResult = await parseImageMetaFromFile(file)
    return imageResult ? imageResult.text : null
  })

  ipcMain.handle('load-lyric-embeded', async (event, ...args) => {
    const file = args[0].trim()
    return await parseEmbeddedLyricFromFile(file)
  })

  ipcMain.handle('load-lyric-file', async (event, ...args) => {
    const url = args[0].trim()
    const index = url.lastIndexOf('.')
    const file = url.substring(0, index)
    let transText = null
    const text = readText(`${file}.lrc`)
      || readText(`${file}.LRC`)
      || readText(`${file}.Lrc`)
    if(text) {
      transText = readText(`${file} [Trans].lrc`)
        || readText(`${file} [Trans].LRC`)
        || readText(`${file} [Trans].Lrc`)
    }
    return { text, transText }
  })

  ipcMain.handle('invoke-vendor', async (event, ...args) => {
    return invokeVender(args[0], args[1], args[2])
  })

  ipcMain.handle('save-file', async (event, ...args) => {
    const { title, name, data } = args[0]
    const result = await dialog.showSaveDialog(mainWin, {
      title: (title || '文件保存'),
      defaultPath: (name || null),
    })
    if (result.canceled) return null
    return writeText(result.filePath, data)
  })

  ipcMain.handle('open-file', async (event, ...args) => {
    const { title, filterExts } = args[0] || { title: '请选择文件', filterExts: ['*'] }
    const result = await dialog.showOpenDialog(mainWin, {
      title: title || '请选择文件',
      filters: [{ name: '数据文件', extensions: filterExts || ['*'] }],
      properties: ['openFile']
    })
    if (result.canceled) return null
    const filePath = result.filePaths[0]
    const data = readText(filePath)
    return { filePath, data }
  })

  ipcMain.handle('choose-files', async (event, ...args) => {
    const { title, filterExts, single } = args[0] || { title: '请选择文件', filterExts: ['*'] }
    const properties = ['openFile']
    if(!single) properties.push('multiSelections') 
    const result = await dialog.showOpenDialog(mainWin, {
      title: title || '请选择文件',
      filters: [{ name: '数据文件', extensions: filterExts || ['*'] }],
      properties
    })
    if (result.canceled) return null
    const { filePaths } = result
    return { filePaths }
  })

  ipcMain.handle('read-text', async (event, ...args) => {
    const filePath = args[0]
    if(!filePath) return
    const data = readText(filePath)
    return { filePath, data }
  })

  ipcMain.handle('show-confirm', async (event, ...args) => {
    const { title, msg } = args[0]
    const result = await dialog.showMessageBox(mainWin, {
      message: msg,
      type: "warning",
      title: (title || '确认'),
      buttons: ["确定", "取消"],
      cancelId: 1
    })
    return result.response == 0
  })

  ipcMain.handle('download-checkExists', async (event, ...args) => {
    //TODO 实现有些奇怪，目前仅支持and逻辑
    const { nameContains } = args[0]
    const downloadDir = getDownloadDir()
    const dlFiles = await listFiles(downloadDir)
    const result = dlFiles.filter(name => {
      if (!nameContains || nameContains.length < 1) return false
      let needFilter = true
      for (var i = 0; i < nameContains.length; i++) {
        needFilter = needFilter && name.includes(nameContains[i])
        if (!needFilter) break
      }
      return needFilter
    })
    return (result && result.length > 0) ? (downloadDir + result[0]) : null
  })

  ipcMain.handle('find-in-page', async (event, ...args) => {
    const keyword = args[0]
    if (isWindowAccessible(mainWin)) mainWin.webContents.findInPage(keyword)
  })

  ipcMain.handle('app-cacheSize', async (event, ...args) => {
    if (!isWindowAccessible(mainWin)) return -1
    const { session } = mainWin.webContents
    const cacheSize = await session.getCacheSize()
    return cacheSize
  })

  ipcMain.handle('app-clearCaches', async (event, ...args) => {
    return await clearCaches(true)
  })

  ipcMain.handle('app-importPlugin', async (event, ...args) => {
     //拷贝插件到当前应用数据缓存位置
    const { filePath, data } = args[0] 
    const originFilePath = transformPath(filePath)
   
    const hashName = MD5(getSimpleFileName(originFilePath))
    const extName = getFileExtName(originFilePath)
    const flags = isDevEnv ? 'dev-' : '' 
    const rootName = `${flags}${hashName}`
    const rootPath = getPluginsRootPath(rootName)
    const main = `main.${extName}`
    const destFilePath = `${rootPath}/${main}`
    try {
      writeFileSync(destFilePath, data)
    } catch(error) {
      if(isDevEnv) console.log(error)
    }
    return { filePath, path: rootPath, main, data }
  })

  ipcMain.handle('app-removePlugin', async (event, ...args) => {
    const filePath = transformPath(args[0])
    if(!filePath) return
    const index = filePath.lastIndexOf('/')
    if(index < 0) return 
    const fileRoot = filePath.substring(0, index)
    const pluginRoot = getPluginsRootPath()
    if(!fileRoot.includes(pluginRoot)) return
    try {
      removePath(fileRoot)
    } catch(error) {
      if(isDevEnv) console.log(error)
    }
  })

  ipcMain.handle('app-cleanupPlugins', async (event, ...args) => {
    const pluginsRoot = getPluginsRootPath()
    try {
      const devFlags = ['dev-', '-dev']
      readdirSync(pluginsRoot, { withFileTypes: true }).forEach(dirent => {
        if(!dirent) return
        const pathName = path.join(pluginsRoot, dirent.name)
        if (dirent.isDirectory()) {
          const hasDevFlag = (dirent.name.startsWith(devFlags[0]) || dirent.name.endsWith(devFlags[1]))
          if((isDevEnv && hasDevFlag) 
            || (!isDevEnv && !hasDevFlag)) {
            removePath(pathName)
          }
        }
    })
    } catch(error) {
      if(isDevEnv) console.log(error)
    }
  })

  ipcMain.handle('app-userAgent', async (event, ...args) => {
    return appUserAgent || USER_AGENTS[nextInt(USER_AGENTS.length)]
  })

  ipcMain.handle('app-getCookie', async (event, ...args) => {
    const url = args[0]
    const fetchOnMissing = args[1]
    const cookie = getCookie(url, fetchOnMissing)
    if(cookie) return cookie
    return await fetchCookie(url, fetchOnMissing)
  })

  ipcMain.handle('app-addRequestHandler', async (event, ...args) => {
    const { id } = args[0]
    if(!id) return 'id未设置'
    
    const _id = id.toString().trim()
    const index = exRequestHandlers.findIndex(item => (item.id == _id))
    if(index > -1) exRequestHandlers.splice(index, 1)
    exRequestHandlers.push(args[0])
  })

  ipcMain.handle('app-updateRequestHandler', async (event, ...args) => {
    const { id, appendMode } = args[0]
    if(!id) return 'id未设置'
    
    const _id = id.toString().trim()
    const index = exRequestHandlers.findIndex(item => (item.id == _id))
    if(index < 0) return exRequestHandlers.push(args[0])
    
    const handler = exRequestHandlers[index]
    if(!appendMode) { //默认模式 - 替换
      Object.assign(handler, { ...args[0] })
    } else {  //追加模式
      const { includes, startsWith, endsWith, equals, regex } = args[0]
      if(includes) {
        handler.includes = handler.includes || []
        handler.includes.push(...includes)
      } else if(startsWith) {
        handler.startsWith = handler.startsWith || []
        handler.startsWith.push(...startsWith)
      } else if(endsWith) {
        handler.endsWith = handler.endsWith || []
        handler.endsWith.push(...endsWith)
      } else if(equals) {
        handler.equals = handler.equals || []
        handler.equals.push(...equals)
      } else if(regex) {
        handler.regex = handler.regex || []
        handler.regex.push(...regex)
      }
    }
  })

  ipcMain.handle('app-removeRequestHandler', async (event, ...args) => {
    const { id } = args[0]
    if(!id) return '获取不到参数：id'

    const _id = id.toString().trim()
    const index = exRequestHandlers.findIndex(item => (item.id == _id))
    if(index > -1) exRequestHandlers.splice(index, 1)
  })

  ipcMain.handle('app-displayFrequency', (event, data) => {
    const { displayFrequency } = getPrimaryScreenMetadata()
    return displayFrequency
  })

  ipcMain.on('app-desktopLyric-toggle', (event, ...args) => {
    toggleLyricWindow()
    sendTrayAction(isLyricWindowShow() ? TrayAction.DESKTOP_LYRIC_OPEN 
      : TrayAction.DESKTOP_LYRIC_CLOSE)
    /*
    const fromDesktopLyric = args[0]
    if (fromDesktopLyric) {
      const lyricShow = isLyricWindowShow()
      sendTrayAction(lyricShow ? 7 : 8)
    }
    */
  }).on('app-playState', (event, ...args) => {
    playState = args[0]
    setupTrayMenu()
  }).on('app-desktopLyric-lock', (event, ...args) => {
    desktopLyricLockState = args[0]
    //TODO 平台兼容性问题
    if(isMacOS) lyricWin.setHasShadow(!desktopLyricLockState)
    lyricWin.setResizable(!desktopLyricLockState)
    if (desktopLyricLockState) lyricWin.blur()
    setupTrayMenu()
  }).on('app-ignoreMouseEvents', (event, ignore, options) => {
    //TODO 平台兼容性问题
    if(isWinOS) return
    const win = BrowserWindow.fromWebContents(event.sender)
    win.setIgnoreMouseEvents(ignore, options)
  }).on('app-mainWin-show', (event, ...args) => {
    const isInit = args[0]
    const useCenterStrict = args[1]
    if(isInit) restoreAppBounds(useCenterStrict)
    const timeout = (!isInit || isDevEnv) ? 0 : 1888
    setTimeout(showMainWindow, timeout)
  }).on('app-mainWin-alwaysOnTop', (event, ...args) => {
    setWindowAlwaysOnTop(mainWin, args[0])
  }).on('app-desktopLyric-layoutMode', (event, ...args) => {
    const { layoutMode, textDirection, needResize, isInit } = args[0]
    setupDesktopLyricWindowSize(layoutMode, textDirection == 1, needResize)
    if(isInit) setupLyricWindowCenterScreen()
  }).on('app-desktopLyric-alwaysOnTop', (event, ...args) => {
    setWindowAlwaysOnTop(lyricWin, args[0])
    setupTrayMenu()
  }).on('app-desktopLyric-setShadow', (event, ...args) => {
    //TODO 平台兼容性问题
    if(isWinOS) return
    lyricWin.setHasShadow(args[0])
    lyricWin.setResizable(args[0])
  }).on('app-messagePort-setup', (event, ...args) => {
    messagePortChannel = args[0]
    sendToMainRenderer('app-messagePort-channel', messagePortChannel)
  }).on('app-messagePort-pair', (event, ...args) => {
    messagePortPair = setupMessagePortPair(mainWin, lyricWin)
  }).on('app-openDevTools', (event, ...args) => {
    openDevTools(mainWin)
  }).on('app-closeDevTools', (event, ...args) => {
    closeDevTools(mainWin)
  }).on('app-reload', (event, ...args) => {
      if(isWindowAccessible(mainWin)) {
        mainWin.reload()
        //mainWin.webContents.reload()
      }
  })

}

const getPluginsRootPath = (dirName) => {
  const _path = app.getPath('userData') 
      + '/User/Plugins' 
      + (dirName ? `/${dirName}` : '')
  try {
    const result = statPathSync(_path)
    if(!result) mkdirSync(_path, { recursive: true })
  } catch(error) {
    if(isDevEnv) console.log(error)
  }
  return _path
}

const getAppConfigFilePath = () => {
  return app.getPath('userData') + '/User/config.json'
}

const initAppConfig = () => {
  try {
    const configFile = getAppConfigFilePath()
    if(statPathSync(configFile)) {
      appConfig = JSON.parse(readText(configFile))
    }
  } catch(error) {
    if(isDevEnv) console.log(error)
  }
  appConfig = (appConfig || {})
}

const getAppConfigInitialZoomFactor = () => {
  const { zoomFactor } = (appConfig || {})
  if(zoomFactor < 0 || zoomFactor > 3) return 1.0 
  return zoomFactor || 1.0
}

const storeAppConfig = () => {
  try {
    writeText(getAppConfigFilePath(), JSON.stringify(appConfig))
  } catch(error) {
    if(isDevEnv) console.log(error)
  }
}

const setupDesktopLyricWindowSize = (layoutMode, isVertical, needResize) => {
  if(!needResize) return 
  if(!isLyricWindowShow()) return
  
  const minWidth = isVertical ? 150 : 450
  const minHeight = isVertical ? 465 : 100
  lyricWin.setMinimumSize(minWidth, minHeight)
  lyricWin.setSize(minWidth, minHeight)
  //逻辑有些乱
  const { x, y, width, height } = lyricWin.getBounds()
  switch (layoutMode) {
    case 0:
      if (isVertical) {
        if (width > 150) {
          lyricWin.setSize(150, Math.max(height, minHeight))
        }
      } else if (height > 200) {
        lyricWin.setSize(width, 100)
      }
      break
    case 1:
      if (isVertical) {
        if (width != 200) {
          lyricWin.setSize(200, Math.max(height, minHeight))
        }
      } else if (height != 150) {
        lyricWin.setSize(width, 150)
      }
      break
    case 2:
      if (isVertical) {
        if (width < 366) {
          lyricWin.setSize(366, Math.max(height, minHeight))
        }
      } else if (height < 520) {
        lyricWin.setSize(width, 520)
      }
      break
  }
}

const setWindowAlwaysOnTop = (win, flag, level) => {
  //level => normal, floating, torn-off-menu, modal-panel, main-menu, status, pop-up-menu, screen-saver
  win && win.setAlwaysOnTop(flag || false, level || 'pop-up-menu')
}

const toggleLyricWindow = () => {
  let showState = false
  if (!lyricWin || lyricWin.isDestroyed()) {
    lyricWin = createLyricWindow()
    setWindowAlwaysOnTop(lyricWin ,true)
    lyricWin.setHasShadow(false)
    showState = true
  } else if (lyricWin.isVisible()) {
    //lyricWin.hide()
    //关闭后需要重新配对MessagePort
    lyricWin.close()
    lyricWin = null
    closeMessagePortPair()

    if (!appTrayShow) {
      setupTray()
      const mainShow = isMainWindowShow()
      if (!mainShow) showMainWindow()
    }
  }
  /*
  else { //当采取lyricWin.hide()方式时
    lyricWin.showInactive()
    showState = true
  }
  */
  sendToMainRenderer('app-desktopLyric-showSate', showState)
  setupTrayMenu()
}

//应用显示时，待执行任务
const onReadyToShowTasks = async () => {
  //预先获取Cookie
  //const urls = ['https://www.kuwo.cn/']
  //urls.forEach(url => fetchCookie(url, true))
  //其他任务
}

const tryPostMessage = (win, msg, transfers) => {
  try {
    win.webContents.postMessage(messagePortChannel, msg, transfers)
  } catch (error) {
    if (isDevEnv) console.log(error)
  }
}

const tryCloseMessagePort = (port) => {
  try {
    if (port) port.close()
  } catch (error) {
    if (isDevEnv) console.log(error)
  }
}

const setupMessagePortPair = (win1, win2) => {
  const msgChannelMain = new MessageChannelMain()
  const { port1, port2 } = msgChannelMain
  tryPostMessage(win1, null, [port1])
  tryPostMessage(win2, null, [port2])
  return msgChannelMain
}

const closeMessagePortPair = () => {
  if (!messagePortPair) return
  const { port1, port2 } = messagePortPair
  tryCloseMessagePort(port1)
  tryCloseMessagePort(port2)
}

const getInitialMainWindowBounds = (isInit) => {
  let { appWidth: width, appHeight: height } = appLayoutConfig[appLayout]
  if(isInit) {
    const { appBounds } = appConfig
    if(appBounds) {
      const { x, y, width, height } = appBounds
      return { width, height }
    }
  }
  return { width, height }
}

const restoreAppBounds = (useCenterStrict) => {
  if(!isWindowAccessible(mainWin)) return 
  if(appLayout != DEFAULT_LAYOUT) return 

  const { width, height } = getInitialMainWindowBounds(true)
  const zoomFactor = currentZoom / 100
  mainWin.webContents.setZoomFactor(zoomFactor)
  mainWin.setSize(parseInt(width * zoomFactor), parseInt(height * zoomFactor))
  setupMainWindowCenterScreen(useCenterStrict)
}

//创建浏览窗口
const createMainWindow = ({ show, isInit }) => {
  const { width, height } = getInitialMainWindowBounds(isInit)
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: width,
    minHeight: height,
    titleBarStyle: 'hidden',
    title: '爱你所爱',
    //trafficLightPosition: { x: 20, y: 18 },
    trafficLightPosition: { x: -404, y: -404 }, // 404 => 神秘数字 
    transparent: true,
    show,
    frame: false,
    webPreferences: {
      zoomFactor: getAppConfigInitialZoomFactor(),
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      //nodeIntegrationInWorker: true,
      contextIsolation: false, //Electron太坑，不得不关闭，毕竟没找到什么好的方式
      webSecurity: false  //TODO 有风险，暂时保留此方案
    }
  })
  if (isDevEnv) {
    mainWindow.loadURL("http://localhost:5173/")
    //打开DevTools
    openDevTools(mainWindow)
  } else {
    mainWindow.loadFile('dist/index.html')
  }
  //菜单
  Menu.setApplicationMenu(Menu.buildFromTemplate(initAppMenuTemplate()))

  mainWindow.once('ready-to-show', () => {
    setWindowButtonVisibility(mainWindow, !useCustomTrafficLight)
    //mainWindow.show()

    onReadyToShowTasks()
  })

  mainWindow.on('show', () => {
    sendToMainRenderer('app-active')
  })

  //配置请求过滤
  const filter = {
    urls: [
      /*
      "*://*.qq.com/*",
      "*://music.163.com/*",
      "*://*.126.net/*",
      "*://*.kuwo.cn/*",
      "*://*.kugou.com/*",
      "*://*.douban.com/*",
      "*://*.doubanio.com/*",
      "*://*.radio.cn/*",
      "*://*.cnr.cn/*",
      "*://*.qingting.fm/*",
      "*://*.qtfm.cn/*",
      "*://*.cgtn.com/*",
      */
      "*://github.com/*",
      "*://gitee.com/*",
      "*://*/*"
    ]
  }
  const { webRequest } = mainWindow.webContents.session
  webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    let { requestHeaders } = details
    try {
      requestHeaders = overrideRequestHeaders(details)
    } catch(error) {
      if(isDevEnv) console.log(error)
    }
    callback({ requestHeaders })
  })

  mainWindow.webContents.on('found-in-page', (event, result) => {
    if (result.finalUpdate) mainWindow.webContents.stopFindInPage('clearSelection')
  })

  mainWindow.webContents.on('did-start-navigation', (details) => {
    //console.log('[navigation]', details.sender.getZoomFactor(), currentZoom)
  })

  //全屏事件
  mainWindow.on('enter-full-screen', () => {
    markMainWindowSize()
  })
  
  //退出全屏
  mainWindow.on('leave-full-screen', () => {
    setTimeout(fixElectronExitFullScreen, 365)
  })
  
  /*
  mainWindow.on('enter-html-full-screen', () => {
    markMainWindowSize()
  })
  mainWindow.on('leave-html-full-screen', () => {
    setTimeout(fixElectronExitFullScreen, 365)
  })
  */
  return mainWindow
}

const setupAppLayout = (layout, zoom, isInit, useCenterStrict, miniExpand) => {
  appLayout = layout

  zoom = Number(zoom) || 85
  const zoomFactor = parseFloat(zoom / 100)
  if (zoomFactor < 0.5 || zoomFactor > 3) zoomFactor = 0.85
  const { appWidth, appHeight } = appLayoutConfig[appLayout]
  const width = Math.round(appWidth * zoomFactor)
  const height = Math.round((appHeight + (miniExpand ? miniExpandSize : 0)) * zoomFactor)
  const noResizable = (appLayout === SIMPLE_LAYOUT) || (appLayout === MINI_LAYOUT)
  const maxWidth = (noResizable ? width : 102400)
  const maxHeight = (noResizable ? height : 102400)
  mainWin.setHasShadow(appLayout != MINI_LAYOUT)
  mainWin.setMaximumSize(maxWidth, maxHeight)
  if (isInit || noResizable) {
    mainWin.setMinimumSize(width, height)
    mainWin.setSize(width, height)
  }
  mainWin.webContents.setZoomFactor(zoomFactor)
  if(typeof miniExpand == 'undefined') {
    setupMainWindowCenterScreen(useCenterStrict)
  }
}

const getAppMenuI18nConfig = () => {
  return {
    defaultLocale: 'zh-CN',
    candidateLocale: 'en-US',
    data: {
      'zh-CN': {
        About: '关于',
        Update: '检查更新',
        Settings: '设置',
        ResetSettings: '恢复默认设置',
        DevTools: '开发者工具',
        Quit: '退出',
        Edit: '编辑',
        Plugins: '插件',
        InstalledPlugins: '已安装插件',
        Github: 'Github仓库',
        Gitee: 'Gitee仓库'
      },
      'en-US': {
        About: 'About',
        Update: 'Check for Updates...',
        Settings: 'Settings',
        ResetSettings: 'Reset Settings',
        DevTools: 'Developer Tools',
        Quit: 'Quit',
        Edit: 'Edit',
        Plugins: 'Plugins',
        InstalledPlugins: 'Installed Plugins',
        Github: 'Github Repository',
        Gitee: 'Gitee Repository'
      },
    }
  }
}

//根据locale取值（前缀），从defaultLocale和candidateLocale中二选一返回
const resolveAppLocale = (locale, defaultLocale, candidateLocale) => {
  if(!defaultLocale || !candidateLocale) return locale
  const delimiter = '-'
  if(defaultLocale.indexOf(delimiter) < 1) return locale
  
  const prefix = defaultLocale.split(delimiter)[0] + delimiter
  const isSimilarToDefault = (locale || defaultLocale).startsWith(prefix)
  return isSimilarToDefault ? defaultLocale : candidateLocale
}

//菜单模板
const initAppMenuTemplate = () => {
  const { defaultLocale, candidateLocale, data: i18nData } = getAppMenuI18nConfig()
  const locale = resolveAppLocale(app.getLocale(), defaultLocale, candidateLocale)
  const i18nText = i18nData[locale]
  if(!i18nText) return []

  let menuItems = [
    { role: 'about', label: i18nText.About },
    { click: (menuItem, browserWindow, event) => sendTrayAction(TrayAction.CHECK_FOR_UPDATES, true), label: i18nText.Update },
    { type: 'separator' },
    //accelerator: 'Alt+Shift+P'
    { click: (menuItem, browserWindow, event) => sendTrayAction(TrayAction.SETTING, true), 
      label: i18nText.Settings, accelerator: 'P' },
    { click: (menuItem, browserWindow, event) => sendTrayAction(TrayAction.RESET_SETTING, true), 
      label: i18nText.ResetSettings, accelerator: 'CmdOrCtrl+P' },
    { role: 'toggleDevTools', label: i18nText.DevTools },
    { type: 'separator' },
    { role: 'quit', label: i18nText.Quit },
  ]
  
  if(!isDevEnv) menuItems = menuItems.filter(item => item.label != i18nText.DevTools)

  const appName = app.name.replace('-', '')
  const template = [
    ...[{
      label: appName,
      submenu: menuItems,
    }, {
      label: i18nText.Edit,
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    }, {
      label: i18nText.Plugins,
      submenu: [
        { click: (menuItem, browserWindow, event) => sendTrayAction(TrayAction.PLUGINS), label: i18nText.InstalledPlugins },
        { click: (menuItem, browserWindow, event) => visitLink(`${GitRepository.GITHUB}-Plugins`), label: i18nText.Github },
        { click: (menuItem, browserWindow, event) => visitLink(`${GitRepository.GITEE}-plugins`), label: i18nText.Gitee },
      ]
    }]
  ]
  return template
}

const sendToMainRenderer = (channel, args) => {
  try {
    if (isWindowAccessible(mainWin) && mainWin.webContents) mainWin.webContents.send(channel, args)
  } catch (error) {
    if (isDevEnv) console.log(error)
  }
}

const showMainWindow = () => {
  if (isWindowAccessible(mainWin)) {
    mainWin.show()
    mainWin.focus()
  }
}

const sendTrayAction = (action, isForceShowMainWin) => {
  if (isForceShowMainWin) showMainWindow()
  sendToMainRenderer('tray-action', action)
}

const initTrayMenuTemplate = () => {
  const template = [{
    label: '爱你所爱，不枉青春',
    click: () => sendTrayAction(TrayAction.RESTORE, true)
  }, {
    type: 'separator'
  }, {
    id: 'desktop-lyric-open',
    label: '开启桌面歌词',
    click: () => {
      (TrayAction.DESKTOP_LYRIC_OPEN)
      toggleLyricWindow()
    }
  }, {
    id: 'desktop-lyric-close',
    label: '关闭桌面歌词',
    click: () => {
      sendTrayAction(TrayAction.DESKTOP_LYRIC_CLOSE)
      toggleLyricWindow()
    }
  }, {
    id: 'desktop-lyric-lock',
    label: '锁定桌面歌词',
    click: () => sendTrayAction(TrayAction.DESKTOP_LYRIC_LOCK)
  }, {
    id: 'desktop-lyric-unlock',
    label: '解锁桌面歌词',
    click: () => sendTrayAction(TrayAction.DESKTOP_LYRIC_UNLOCK)
  }, {
    id: 'desktop-lyric-pin',
    label: '置顶桌面歌词',
    click: () => sendTrayAction(TrayAction.DESKTOP_LYRIC_PIN)
  }, {
    id: 'desktop-lyric-unpin',
    label: '取消置顶桌面歌词',
    click: () => sendTrayAction(TrayAction.DESKTOP_LYRIC_UNPIN)
  }, {
    type: 'separator'
  }, {
    id: 'play',
    label: '播放',
    click: () => sendTrayAction(TrayAction.PLAY)
  }, {
    id: 'pause',
    label: '暂停',
    click: () => sendTrayAction(TrayAction.PAUSE)
  }, {
    label: '上一曲',
    click: () => sendTrayAction(TrayAction.PLAY_PREV)
  }, {
    label: '下一曲',
    click: () => sendTrayAction(TrayAction.PLAY_NEXT)
  }, {
    type: 'separator'
  }, {
    label: '我的主页',
    click: () => sendTrayAction(TrayAction.USERHOME, true)
  }, {
    label: '设置',
    click: () => sendTrayAction(TrayAction.SETTING, true)
  }, {
    type: 'separator'
  }, {
    label: '检查更新',
    click: () => sendTrayAction(TrayAction.CHECK_FOR_UPDATES, true)
  }, {
    label: '恢复默认设置',
    click: () => sendTrayAction(TrayAction.RESET_SETTING, true)
  }, {
    type: 'separator'
  }, {
    label: "退出",
    role: "quit"
  }]
  return template
}

//设置系统交通灯按钮可见性
const setWindowButtonVisibility = (win, visible) => {
  if (!isMacOS) return
  try {
    if (win) win.setWindowButtonVisibility(visible)
  } catch (error) {
    if (isDevEnv) console.log(error)
  }
}

const toggleWinOSFullScreen = () => {
  if (!isWindowAccessible(mainWin) || !isWinOS) return 
  const isMax = mainWin.isMaximized()
  if (isMax) {
    mainWin.unmaximize()
  } else {
    mainWin.maximize()
  }
  return !isMax
}


const setupMainWindowCenterScreen = (useCenterStrict) => {
  if (!isWindowAccessible(mainWin)) return
  //默认居中方式 - 多屏场景下兜底
  //TODO 貌似Electron Bug? 显示效果：能居中，但只能居中一点点？水平方向居中，但垂直方向没居中
  if (!useCenterStrict) return mainWin.center()
  
  //严格居中显示 - 仅主屏，多屏时不兼容
  const { width, height } = mainWin.getBounds()
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().size
  const x = parseInt((screenWidth - width) / 2)
  const y = parseInt((screenHeight - height) / 2)
  mainWin.setPosition(x, y)
}

const markMainWindowSize = () => {
  if(!isWindowAccessible(mainWin)) return
    //全屏前记录屏幕大小
  const isWinOSMark = (isWinOS && !mainWin.isMaximized() && !mainWin.isFullScreen())
  const isMacOSMark = (isMacOS && !mainWin.isFullScreen())
  if(isWinOSMark || isMacOSMark) {
    const size = mainWin.getSize()
    markWidth = size[0]
    markHeight = size[1]
  }
}

const fixElectronExitFullScreen = () => {
  if(!isWindowAccessible(mainWin)) return
  const isWinOSMark = (isWinOS && !mainWin.isMaximized() && !mainWin.isFullScreen())
  const isMacOSMark = (isMacOS && !mainWin.isFullScreen())
  if(!isWinOSMark && !isMacOSMark) return 
  
  const { appWidth, appHeight } = appLayoutConfig[appLayout]
  const zoomFactor = parseFloat(currentZoom / 100)
  const width = parseInt(appWidth * zoomFactor)
  const height = parseInt(appHeight * zoomFactor)
  mainWin.setMinimumSize(width, height)
  
  mainWin.setSize(markWidth || width, markHeight || height)
  //setupMainWindowCenterScreen()
}

//歌词首次居中显示，其他情况一般不需要居中
const setupLyricWindowCenterScreen = () => {
  if (!isLyricWindowShow(lyricWin)) return
  //默认居中方式 - 多屏场景下兜底
  if (!useWinCenterStrict) return lyricWin.center()
  
  //严格居中显示 - 仅主屏，多屏时不兼容
  const { width, height } = lyricWin.getBounds()
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().size
  const x = parseInt((screenWidth - width) / 2)
  const y = parseInt((screenHeight - height) / 2)
  lyricWin.setPosition(x, y)
}

const setupAppWindowZoom = (zoom, noResize, useForCreate, useCenterStrict) => {
  if (!isWindowAccessible(mainWin) || !zoom) return
  
  const _zoom = Number(zoom) || 85
  const zoomFactor = parseFloat(_zoom / 100)
  if (zoomFactor < 0.5 || zoomFactor > 3) return
  currentZoom = _zoom

  const { appWidth, appHeight } = appLayoutConfig[appLayout]
  const width = parseInt(appWidth * zoomFactor)
  const height = parseInt(appHeight * zoomFactor)
  mainWin.setMinimumSize(width, height)
  
  if (!noResize && mainWin.isNormal()) {
    mainWin.setSize(width, height)
    setupMainWindowCenterScreen(useCenterStrict)
  }
  mainWin.webContents.setZoomFactor(zoomFactor)
  //mainWin.webContents.zoomFactor = zoomFactor
  
  Object.assign(appConfig, {
    zoomFactor: (useForCreate ? zoomFactor : 1.0)
  })
  storeAppConfig()
}

const addToDownloadingQueue = (url, meta) => {
  if(!url || !url.startsWith('http')) return
  meta = meta || { url }
  const index = downloadingQueue.findIndex(item => (item.url == url))
  if(index == -1) downloadingQueue.push(meta) 
}

const removeFromDownloadingQueue = (meta) => {
  if(!meta) return 
  const index = downloadingQueue.indexOf(meta)
  if(index > -1) downloadingQueue.splice(index, 1)
}

const downloadDefault = (url, meta) => {
  if (isWindowAccessible(mainWin)) {
    addToDownloadingQueue(url, meta)
    mainWin.webContents.downloadURL(url)
  }
}

const setupAppGlobalProxy = (data) => {
  const config = {}
  proxyAuthRealms.length = 0
  if (!data) {
    session.defaultSession.setProxy(config)
    return
  }
  const { http, socks } = data
  const proxyRules = []
  if (http) {
    proxyRules.push(`${http.host}:${http.port}`)

    if (http.username && http.password) {
      proxyAuthRealms.push({
        scheme: 'http',
        ...http
      })
    }
  }
  if (socks) {
    proxyRules.push(`socks5://${socks.host}:${socks.port}`)
    proxyRules.push(`socks://${socks.host}:${socks.port}`)

    if (socks.username && socks.password) {
      proxyAuthRealms.push({
        scheme: 'socks',
        ...socks
      })
    }
  }

  if (proxyRules.length > 0) {
    Object.assign(config, {
      proxyRules: proxyRules.join(";"),
      proxyBypassRules: 'localhost'
    })
  }
  if (isDevEnv) console.log('[Proxy] ', config)
  session.defaultSession.setProxy(config)
}

const getProxyAuthRealm = (scheme, host, port) => {
  for (var i = 0; i < proxyAuthRealms.length; i++) {
    const realm = proxyAuthRealms[i]
    if (realm.scheme.includes(scheme)
      && realm.host == host && realm.port == port) {
      const { username, password } = realm
      return { username, secret: password }
    }
  }
  return { username: null, secret: null }
}

const openDevTools = (win) => {
  if (isWindowAccessible(win) && win.webContents) win.webContents.openDevTools()
}

const closeDevTools = (win) => {
  if (isWindowAccessible(win) && win.webContents) win.webContents.closeDevTools()
}

const cleanupBeforeQuit = () => {
  
}

const markAppBoundsState = () => {
  if(!isWindowAccessible(mainWin)) return

  const { x, y, width, height } = mainWin.getBounds()
  const appWidth = parseInt(width * 100 / currentZoom)
  const appHeight = parseInt(height * 100 / currentZoom)
  Object.assign(appConfig, {
    appBounds: { x, y, width: appWidth, height: appHeight }
  })
}

const saveAppStates = () => {
  if(appLayout != DEFAULT_LAYOUT) {
    Reflect.deleteProperty(appConfig, 'appBounds')
  } else {
    markAppBoundsState()
  }
  storeAppConfig()
}


const cookiesMap = {} //格式: { url: cookie }
const cookiesPendingMap = {} //格式: { url: true }
const getCookie = (url, fetchOnMissing) => {
  if(!url) return 
  let cookie = cookiesMap[url]
  try {
    if (cookie) {
      const _now = Date.now()
      const { expires } = cookie
      const expiresMillis = expires ? Date.parse(expires) : _now
      if (_now >= expiresMillis) {
        Reflect.deleteProperty(cookiesMap, url)
        cookie = null
      }
    }
  } catch (error) {
    if (isDevEnv) console.log(error)
  }
  if (!cookie && fetchOnMissing) fetchCookie(url, fetchOnMissing)
  return cookie
}

//暂时使用内存做缓存
const cacheCookie = (url, cookie) => { cookiesMap[url] = cookie }

const fetchCookie = async (url, ignoreCache) => {
  if(!url) return
  let cookie = ignoreCache ? null : getCookie(url)
  //缓存命中
  if (cookie) return cookie
  try {
    //前置状态检查，避免多次重复请求
    if (cookiesPendingMap[url]) return cookie
    cookiesPendingMap[url] = true

    //缓存未命中
    const resp = await fetch(url, {
      headers: {
        'User-Agent': appUserAgent
      }
    })
    const { headers } = resp
    cookie = {}
    let counter = 0, hasCookie = false
    do {
      const cookieText = headers.get('Set-Cookie')
      if(!cookieText || (counter++ > 30)) break
      const items = cookieText.split(';')
      items.forEach(item => {
        const kvPair = item.split('=')
        const key = kvPair[0].trim()
        const value = kvPair[1].trim()
        cookie[key] = value
      })
      hasCookie = true
    } while(true)
    if(hasCookie) cacheCookie(url, cookie)
  } catch (error) {
    if (isDevEnv) console.log(error)
  }
  Reflect.deleteProperty(cookiesPendingMap, url)
  return cookie
}

const visitLink = (url) => {
  return url && shell.openExternal(url)
}

//覆盖(包装)请求
const overrideRequestHeaders = (details) => {
  const { url, requestHeaders } = details
  //不处理本地请求、非http请求
  if (url.includes('localhost') || !url.startsWith('http')) return details.requestHeaders
  // 从url中解析host，虽然requestHeaders也可能有Host信息，但有可能已经被修改过，不一定准确
  const fromIndex = url.indexOf('://') + 3
  const toIndex = url.indexOf('/', fromIndex)
  const hostOfUrl = url.substring(fromIndex, toIndex)
  
  //支持运行时重新设置请求Headers
  //TODO 发生匹配规则冲突时，尚待考虑
  for(var i = 0; i < exRequestHandlers.length; i++) {
    const handler = exRequestHandlers[i]
    if(!handler) continue
    //hosts为必需值，其他可选
    const { hosts, ignoreHosts, defaultHeaders, includes, startsWith, endsWith, equals, regex } = handler

    if(!hosts || !Array.isArray(hosts) || hosts.length < 1) continue
    let hostMatched = false
    //忽略Hosts
    if(ignoreHosts && Array.isArray(ignoreHosts)) {
      for(var j = 0; j < ignoreHosts.length; j++) {
        if(hostOfUrl.includes(ignoreHosts[j])) {
          hostMatched = true
          break 
        }
      }
    }
    if(hostMatched) continue
    //必须匹配Hosts
    for(var j = 0; j < hosts.length; j++) {
      if(hostOfUrl.includes(hosts[j])) {
        hostMatched = true
        break 
      }
    }
    if(!hostMatched) continue
    
    let headers = {}
    if(defaultHeaders) Object.assign(headers, { ...defaultHeaders })
    if(includes && Array.isArray(includes)) {
      includes.forEach(item => {
        const { pattern, headers: _headers } = item
        if(pattern && url.includes(pattern) && _headers) Object.assign(headers, { ..._headers })
      })
    } else if(startsWith && Array.isArray(startsWith)) {
      startsWith.forEach(item => {
        const { pattern, headers: _headers } = item
        if(pattern && url.startsWith(pattern) && _headers) Object.assign(headers, { ..._headers })
      })
    } else if(endsWith && Array.isArray(endsWith)) {
      endsWith.forEach(item => {
        const { pattern, headers: _headers } = item
        if(pattern && url.endsWith(pattern) && _headers) Object.assign(headers, { ..._headers })
      })
    } else if(equals && Array.isArray(equals)) {
      equals.forEach(item => {
        const { pattern, headers: _headers } = item
        if(pattern && url == pattern && _headers) Object.assign(headers, { ..._headers })
      })
    } else if(regex && Array.isArray(regex)) {
      regex.forEach(item => {
        const { pattern, headers: _headers } = item
        if(pattern && url.search(pattern) > -1 && _headers) Object.assign(headers, { ..._headers })
      })
    } 
    
    if(headers) {
      for(const [key, value] of Object.entries(headers)) {
        if(!key) continue
        const _value = (value || '').toString().trim()
        details.requestHeaders[key] = _value
      }
    }
  }
  
  //优先级最高，兼容处理，对外提供的API，不允许设置相关请求头问题
  ['_origin', '_Origin', '_referer', '_Referer', '_cookie', '_Cookie'].forEach(key => {
    if(requestHeaders[key]) {
      const value = details.requestHeaders[key]
      details.requestHeaders[key.substring(1)] = value
      Reflect.deleteProperty(details.requestHeaders, key)
    }
  })

  //移除被Electron默认设置的Referer，格式为: xxx://localhost:xxx
  const preferReferer = details.requestHeaders['Referer']
  if (preferReferer && preferReferer.includes('localhost') && !url.includes('localhost')) {
    Reflect.deleteProperty(details.requestHeaders, 'Referer')
  }
  
  return details.requestHeaders
}

//创建桌面歌词窗口
const createLyricWindow = () => {
  // Create the browser window.
  const win = new BrowserWindow({
    //parent: mainWin,
    width: 450,
    height: 150,
    minWidth: 100,
    minHeight: 100,
    titleBarStyle: 'hidden',
    title: '桌面歌词',
    trafficLightPosition: { x: -404, y: -404 },
    transparent: true,
    frame: false,
    webPreferences: {
      zoomFactor: 1.0,
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      //nodeIntegrationInWorker: true,
      contextIsolation: false, //Electron太坑，不得不关闭，毕竟没找到什么好的方式
      webSecurity: false  //TODO 有风险，暂时保留此方案，留待后期调整
    }
  })

  win.loadURL(
    app.isPackaged ? Url.format({
          pathname: path.join(__dirname, '../../dist/index.html'),
          protocol: 'file:',
          slashes: true,
          hash: 'desktopLyric',
        })
      : 'http://localhost:5173/#/desktopLyric'
  )

  if (isDevEnv) openDevTools(win)

  win.once('ready-to-show', () => {
    setWindowButtonVisibility(win, false)
    win.showInactive()
    win.setTitle('桌面歌词')
  })

  return win
}

const isWindowAccessible = (win) => {
  return win && !win.isDestroyed()
}

const isMainWindowShow = () => {
  return isWindowAccessible(mainWin) && mainWin.isVisible()
}

const isLyricWindowShow = () => {
  return lyricWin && !lyricWin.isDestroyed() && lyricWin.isVisible()
}

//获取主屏幕相关信息
const getPrimaryScreenMetadata = () => {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { bounds, displayFrequency, size } = primaryDisplay
  return { bounds, displayFrequency, size }
}

//启动应用
if (isDevEnv) return startup()
if (!app.requestSingleInstanceLock()) return app.quit()
  
app.on('second-instance', (event, argv, workingDirectory, additionalData) => {
  isWindowAccessible(mainWin) && handleStartupPlay(argv)
})

startup()