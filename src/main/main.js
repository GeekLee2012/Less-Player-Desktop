const { app, BrowserWindow, ipcMain,
  Menu, dialog, powerMonitor,
  shell, powerSaveBlocker, Tray,
  globalShortcut, session, utilityProcess,
  protocol, nativeTheme, MessageChannelMain,
} = require('electron')

const { isMacOS, isWinOS, useCustomTrafficLight, isDevEnv,
  USER_AGENTS, AUDIO_EXTS, IMAGE_EXTS, APP_ICON,
  AUDIO_PLAYLIST_EXTS, BACKUP_FILE_EXTS
} = require('./env')

const { scanDirTracks, parseTracks,
  readText, writeText, FILE_PREFIX,
  randomTextWithinAlphabetNums, nextInt,
  getDownloadDir, removePath, listFiles,
  parsePlsFile, parseM3uPlaylist,
  writePlsFile, writeM3uFile,
  IMAGE_PROTOCAL, parseImageMetaFromFile,
  statPathSync, MD5, SHA1, transformPath,
} = require('./common')

const path = require('path')
const Url = require('url')
const fetch = require('electron-fetch').default


let messagePortPair = null, messagePortChannel = null

const DEFAULT_LAYOUT = 'default', SIMPLE_LAYOUT = 'simple'
const appLayoutConfig = {
  'default': {
    appWidth: 1080,
    appHeight: 720
  },
  'simple': {
    appWidth: 500,
    appHeight: 588
  }
}
let mainWin = null, lyricWin = null, appLayout = DEFAULT_LAYOUT, currentZoom = 85
let powerSaveBlockerId = -1
let appTray = null, appTrayMenu = null, appTrayShow = false
let playState = false, desktopLyricLockState = false
//let lyricWinMinWidth = 450, lyricWinMinHeight = 168
let isDesktopLyricAutoSize = true, isVerticalDesktopLyric = false, desktopLyricLayoutMode = 0
const proxyAuthRealms = []
//TODO 下载队列
let downloadingItem = null
//待打开播放歌曲列表
let pendigTracks = []


/* 自定义函数 */
const startup = () => {
  init()
  registryGlobalListeners()
  handleStartupPlay()
}

//清理缓存
const clearCaches = async (force) => {
  if (!mainWin) return false
  try {
    const { session } = mainWin.webContents
    const cacheSize = await session.getCacheSize()
    const limit = 500 * 1024 * 1024
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

const responseDefaultCover = async () => {
  const response = await fetch('default_cover.png')
  const data = await response.arrayBuffer()
  return { mimeType: 'image/png', data }
}

const init = () => {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(async () => {
    //全局快捷键
    //registryGlobalShortcuts()
    //全局UserAgent
    app.userAgentFallback = USER_AGENTS[nextInt(USER_AGENTS.length)]
    mainWin = createMainWindow()

    //清理缓存
    clearCaches()

    session.defaultSession.on('will-download', (event, item, webContents) => {
      //event.preventDefault()
      downloadingItem = item
      const filename = item.getFilename()
      const savePath = getDownloadDir() + filename
      removePath(savePath)
      item.setSavePath(savePath)
      item.on('updated', (event, state) => {
        if (state == 'progressing') {
          const received = item.getReceivedBytes()
          const total = item.getTotalBytes()
          sendToMainRenderer('download-progressing', {
            url: item.getURL(),
            savePath,
            received,
            total
          })
        }
      })

      item.on('done', (event, state) => {
        downloadingItem = null
        sendToMainRenderer('download-done', {
          url: item.getURL(),
          savePath
        })
        //console.log("[ Download - Done ]")
      })
    })

    //自定义协议
    protocol.registerBufferProtocol(IMAGE_PROTOCAL.scheme, async (request, callback) => {
      const file = decodeURI(request.url.slice(IMAGE_PROTOCAL.prefix.length))
      parseImageMetaFromFile(file).then(async result => {
        if (result) {
          const { format: mimeType, data } = result
          callback({ mimeType, data })
        } else {
          callback(Buffer.from(''))
        }
      })
    })

  })

  app.on('activate', (event) => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0 || mainWin.isDestroyed()) {
      mainWin = createMainWindow()
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
    //console.log(nativeTheme.themeSource)
  })
}

//全局快捷键
const registryGlobalShortcuts = () => {
  const config = {
    // 播放或暂停
    'Alt+Shift+Space': 'togglePlay',
    // 播放模式切换
    'Shift+M': 'switchPlayMode',
    // 上 / 下一曲
    'Shift+Left': 'playPrev',
    'Shift+Right': 'playNext',
    // 增 / 减音量
    'Shift+Up': 'volumeUp',
    'Shift+Down': 'volumeDown',
    // 最大音量 / 静音
    'Shift+O': 'toggleVolumeMute',
    // 打开设置
    'Shift+P': 'visitSetting',
    // 打开 / 关闭当前播放
    'Shift+Q': 'togglePlaybackQueue',
    // 打开 / 关闭歌词设置
    'Shift+L': 'toggleLyricToolbar',
    // 打开 开发者工具
    'Control+Alt+Shift+I': () => openDevTools(mainWin),
    'Command+Alt+Shift+I': () => openDevTools(mainWin),
    'Control+Alt+Shift+J': () => openDevTools(lyricWin),
    'Command+Alt+Shift+J': () => openDevTools(lyricWin),
  }

  const activeWindowValues = ['visitSetting', 'togglePlaybackQueue', 'toggleLyricToolbar']
  for (const [key, value] of Object.entries(config)) {
    globalShortcut.register(key, () => {
      const valueType = typeof (value)
      if (valueType === 'function') {
        value()
      } else if (valueType === 'string') {
        sendToMainRenderer(`globalShortcut-${value}`)
        if (activeWindowValues.includes(value)) mainWin.show()
      }
    })
  }
}

const addToPendingTracks = (files) => {
  if (!files || !Array.isArray(files) || files.length < 1) return
  pendigTracks.push(...files)
}

const removePendingTracks = (tracks) => {
  if (!tracks || !Array.isArray(tracks) || tracks.length < 1) return
  if (pendigTracks.length < 1) return
  //pendigTracks.length = 0
  tracks.forEach(track => {
    const path = transformPath(track.url)
    let index = pendigTracks.indexOf(path)
    let count = 0
    while (index > -1) {
      if (count >= 10) break
      pendigTracks.splice(index, 1)
      index = pendigTracks.indexOf
        (path)
      ++count
    }
  })
}

const parseAndPlayTracks = (files) => {
  if (!files || !Array.isArray(files) || files.length < 1) return
  try {
    parseTracks(files).then(tracks => {
      sendToMainRenderer('app-startup-playTracks', tracks)
    })
  } catch (error) {
    if (isDevEnv) console.log(error)
  }
}

//启动时播放
//即关联打开，播放音频文件
const handleStartupPlay = (argv) => {
  let tracks = null
  try {
    if (isMacOS) {
      app.on('open-file', (event, path) => {
        event.preventDefault()

        tracks = [path]
        addToPendingTracks(tracks)
        parseAndPlayTracks(tracks)

        showMainWindow()
      })
    } else {
      tracks = argv || process.argv
      addToPendingTracks(tracks)
      parseAndPlayTracks(tracks)

      showMainWindow()
    }
  } catch (error) {
    if (isDevEnv) console.log(error)
  }
}

//在菜单栏显示
const setupTray = (forceShow) => {
  if (appTrayShow || forceShow) {
    if (appTray) appTray.destroy()
    appTray = new Tray(path.join(__dirname, APP_ICON))
    appTrayMenu = Menu.buildFromTemplate(initTrayMenuTemplate())
    appTray.setContextMenu(appTrayMenu)
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
    if (mainWin && !mainWin.isDestroyed()) {
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
    parseAndPlayTracks(pendigTracks)
  }).on('app-startup-playDone', (event, tracks) => {
    removePendingTracks(tracks)
  }).on('app-min', (event, isHideToTray) => {
    if (isHideToTray) {
      if (isMacOS) app.hide()
      else mainWin.hide()
      setupTray(true)
      return
    }
    if (mainWin.isFullScreen()) mainWin.setFullScreen(false)
    if (mainWin.isMaximized() || mainWin.isNormal()) mainWin.minimize()
  }).on('app-max', () => {
    let isFullScreen = false
    if (isWinOS) {
      isFullScreen = toggleWinOSFullScreen()
    } else {
      isFullScreen = !mainWin.isFullScreen()
      mainWin.setFullScreen(isFullScreen)
    }
    sendToMainRenderer('app-max', isFullScreen)
  }).on('app-normalize', () => {
    if (!mainWin) return
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
  }).on('app-tray', (event, isShow) => {
    appTrayShow = isShow
    setupTray()
  }).on('app-zoom', (event, { zoom, noResize }) => {
    setupAppWindowZoom(zoom, noResize)
  }).on('app-winBtn', (event, value) => {
    setWindowButtonVisibility(mainWin, value === true)
  }).on('app-layout-default', (event, { zoom, isInit }) => {
    setupAppLayout(DEFAULT_LAYOUT, zoom, isInit)
  }).on('app-layout-simple', (event, { zoom, isInit }) => {
    setupAppLayout(SIMPLE_LAYOUT, zoom, isInit)
  }).on('app-globalShortcut', (event, data) => {
    if (data === true) {
      globalShortcut.unregisterAll()
      registryGlobalShortcuts()
    } else {
      globalShortcut.unregisterAll()
    }
  }).on('app-setGlobalProxy', (event, data) => {
    setupAppGlobalProxy(data)
  }).on('visit-link', (event, data) => {
    shell.openExternal(data)
  }).on('download-item', (event, { url }) => {
    if (mainWin) mainWin.webContents.downloadURL(url)
  }).on('download-cancel', (event, data) => {
    cancelDownload()
  }).on('path-showInFolder', (event, path) => {
    if (path) shell.showItemInFolder(path)
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

  ipcMain.handle('open-dirs', async (event, ...args) => {
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
    const result = await dialog.showOpenDialog(mainWin, {
      title: '请选择文件',
      filters: [
        { name: 'Image', extensions: IMAGE_EXTS }
      ],
      properties: ['openFile']
    })
    return result.filePaths.map(item => (FILE_PREFIX + item))
  })

  ipcMain.handle('open-image-base64', async (event, ...args) => {
    const file = args[0].trim().slice(IMAGE_PROTOCAL.prefix.length)
    const imageResult = await parseImageMetaFromFile(file)
    return imageResult ? imageResult.text : null
  })

  ipcMain.handle('load-lyric-file', async (event, ...args) => {
    const arg = args[0].trim()
    const index = arg.lastIndexOf('.')
    const lyricFile = arg.substring(0, index)
    return readText(`${lyricFile}.lrc`)
      || readText(`${lyricFile}.LRC`)
  })

  ipcMain.handle('invoke-vendor', async (event, ...args) => {
    return invokeVender(args[0], args[1], args[2])
  })

  ipcMain.handle('save-file', async (event, ...args) => {
    const { title, name, data } = args[0]
    const result = await dialog.showSaveDialog(mainWin, {
      title: (title || '文件保存'),
      defaultPath: (name ? name : null),
    })
    if (result.canceled) return false
    return writeText(result.filePath, data)
  })

  ipcMain.handle('open-file', async (event, ...args) => {
    const { title, filterExts } = args[0]
    const result = await dialog.showOpenDialog(mainWin, {
      title: title || '请选择文件',
      filters: [{ name: '数据文件', extensions: filterExts || ['*'] }],
      properties: ['openFile']
    })
    if (result.canceled) return null
    const filePath = result.filePaths[0]
    const data = readText(filePath, 'utf8')
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
    if (mainWin) mainWin.webContents.findInPage(keyword)
  })

  ipcMain.handle('app-cacheSize', async (event, ...args) => {
    if (!mainWin) return -1
    const { session } = mainWin.webContents
    const cacheSize = await session.getCacheSize()
    return cacheSize
  })

  ipcMain.handle('app-clearCaches', async (event, ...args) => {
    return await clearCaches(true)
  })

  ipcMain.on('app-desktopLyric-toggle', (event, ...args) => {
    toggleLyricWindow()
    sendTrayAction(isLyricWindowShow() ? 7 : 8)
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
    if (isMacOS) lyricWin.setIgnoreMouseEvents(desktopLyricLockState)
    lyricWin.setHasShadow(!desktopLyricLockState)
    lyricWin.setResizable(!desktopLyricLockState)
    //lyricWin.setMinimumSize(lyricWinMinWidth, lyricWinMinHeight)
    if (desktopLyricLockState) lyricWin.blur()
    setupTrayMenu()
  }).on('app-mainWin-show', (event, ...args) => {
    showMainWindow()
  }).on('app-desktopLyric-autoSize', (event, ...args) => {
    isDesktopLyricAutoSize = args[0]
    isVerticalDesktopLyric = args[1]
  }).on('app-desktopLyric-layoutMode', (event, ...args) => {
    const { layoutMode, textDirection, needResize } = args[0]
    desktopLyricLayoutMode = layoutMode
    isVerticalDesktopLyric = (textDirection == 1)
    if (!isDesktopLyricAutoSize && !needResize) return
    setupDesktopLyricWindowSize(isDesktopLyricAutoSize || needResize)
  }).on('app-desktopLyric-alwaysOnTop', (event, ...args) => {
    //lyricWin.setAlwaysOnTop(!lyricWin.isAlwaysOnTop())
    lyricWin.setAlwaysOnTop(args[0] || false)
    setupTrayMenu()
  }).on('app-desktopLyric-ignoreMouseEvent', (event, ...args) => {
    if (isMacOS) lyricWin.setIgnoreMouseEvents(args[0])
  }).on('app-messagePort-setup', (event, ...args) => {
    messagePortChannel = args[0]
    sendToMainRenderer('app-messagePort-channel', messagePortChannel)
  }).on('app-messagePort-pair', (event, ...args) => {
    messagePortPair = setupMessagePortPair(mainWin, lyricWin)
  })
}

const setupDesktopLyricWindowSize = (needResize) => {
  const minWidth = isVerticalDesktopLyric ? 150 : 450
  const minHeight = isVerticalDesktopLyric ? 465 : 100
  if (lyricWin) {
    lyricWin.setMinimumSize(minWidth, minHeight)
    lyricWin.setSize(minWidth, minHeight)
    if (needResize) { //逻辑有些乱
      const { x, y, width, height } = lyricWin.getBounds()
      switch (desktopLyricLayoutMode) {
        case 0:
          if (isVerticalDesktopLyric) {
            if (width > 150) {
              lyricWin.setSize(150, Math.max(height, minHeight))
            }
          } else if (height > 200) {
            lyricWin.setSize(width, 100)
          }
          break
        case 1:
          if (isVerticalDesktopLyric) {
            if (width != 200) {
              lyricWin.setSize(200, Math.max(height, minHeight))
            }
          } else if (height != 150) {
            lyricWin.setSize(width, 150)
          }
          break
        case 2:
          if (isVerticalDesktopLyric) {
            if (width < 366) {
              lyricWin.setSize(366, Math.max(height, minHeight))
            }
          } else if (height < 520) {
            lyricWin.setSize(width, 520)
          }
          break
      }
      //lyricWin.center()
    }
  }
}

const toggleLyricWindow = () => {
  let showState = false
  if (!lyricWin || lyricWin.isDestroyed()) {
    lyricWin = createLyricWindow()
    lyricWin.setAlwaysOnTop(true)
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
  const urls = ['https://www.kuwo.cn/']
  urls.forEach(url => fetchCookie(url, true))
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
  tryCloseMessagePort(messagePortPair.port1)
  tryCloseMessagePort(messagePortPair.port2)
}

//创建浏览窗口
const createMainWindow = () => {
  const { appWidth: width, appHeight: height } = appLayoutConfig[appLayout]
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: width,
    minHeight: height,
    titleBarStyle: 'hidden',
    title: 'Less Player - Less is More !',
    //trafficLightPosition: { x: 20, y: 18 },
    trafficLightPosition: { x: -404, y: -404 }, // 404 => 神秘数字 
    transparent: true,
    frame: false,
    webPreferences: {
      //zoomFactor: 0.85, //默认缩放
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
    mainWindow.show()

    onReadyToShowTasks()
  })

  mainWindow.on('show', () => {
    sendToMainRenderer('app-active')
  })

  //配置请求过滤
  const filter = {
    urls: [
      "*://*.qq.com/*",
      "*://music.163.com/*",
      "*://*.126.net/*",
      "*://*.kuwo.cn/*",
      "*://*.kugou.com/*",
      "*://*.douban.com/*",
      "*://*.doubanio.com/*",
      "*://*.ridio.cn/*",
      "*://*.cnr.cn/*",
      "*://*.qingting.fm/*",
      "*://*.qtfm.cn/*",
      "*://github.com/*",
      "*://gitee.com/*",
      //"*://*/*"
    ]
  }
  const { webRequest } = mainWindow.webContents.session
  webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    const { requestHeaders } = overrideRequest(details)
    callback({ requestHeaders })
  })

  mainWindow.webContents.on('found-in-page', (event, result) => {
    if (result.finalUpdate) mainWindow.webContents.stopFindInPage('clearSelection')
  })

  return mainWindow
}

const setupAppLayout = (layout, zoom, isInit) => {
  appLayout = layout

  zoom = Number(zoom) || 85
  const zoomFactor = parseFloat(zoom / 100)
  if (zoomFactor < 0.5 || zoomFactor > 3) zoomFactor = 1
  mainWin.webContents.setZoomFactor(zoomFactor)

  const { appWidth, appHeight } = appLayoutConfig[appLayout]
  const width = parseInt(appWidth * zoomFactor), height = parseInt(appHeight * zoomFactor)
  const isSimpleLayout = (appLayout === SIMPLE_LAYOUT)
  const maxWidth = (isSimpleLayout ? width : 102400)
  const maxHeight = (isSimpleLayout ? height : 102400)
  mainWin.setMaximumSize(maxWidth, maxHeight)
  if (isInit || isSimpleLayout) {
    mainWin.setMinimumSize(width, height)
    mainWin.setSize(width, height)
  }
  mainWin.center()
}

//菜单模板
const initAppMenuTemplate = () => {
  const locale = app.getLocale()
  const TEXT_CONFIG = {
    'en-US': {
      about: 'About',
      devTools: 'Developer Tools',
      quit: 'Quit',
      edit: 'Edit'
    },
    'zh-CN': {
      about: '关于',
      devTools: '开发者工具',
      quit: '退出',
      edit: '编辑'
    }
  }
  const menuText = TEXT_CONFIG[locale] || TEXT_CONFIG['zh-CN']
  let menuItems = [{ role: 'about', label: menuText.about },
  { role: 'toggleDevTools', label: menuText.devTools },
  { role: 'quit', label: menuText.quit },]
  if (!isDevEnv) menuItems.splice(1, 1)
  const appName = app.name.replace('-', '')
  const template = [
    ...[{
      label: appName,
      submenu: menuItems,
    }, {
      label: menuText.edit,
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
    }]
  ]
  return template
}

const sendToMainRenderer = (channel, args) => {
  try {
    if (mainWin && mainWin.webContents) mainWin.webContents.send(channel, args)
  } catch (error) {
    if (isDevEnv) console.log(error)
  }
}

const showMainWindow = () => {
  if (mainWin && !mainWin.isDestroyed()) {
    mainWin.show()
    mainWin.focus()
  }
}

const sendTrayAction = (action, showMain) => {
  if (showMain) {
    showMainWindow()
  }
  sendToMainRenderer('tray-action', action)
}

const initTrayMenuTemplate = () => {
  const template = [{
    label: '听你想听，爱你所爱',
    click: () => sendTrayAction(0, true)
  }, {
    type: 'separator'
  }, {
    id: 'desktop-lyric-open',
    label: '开启桌面歌词',
    click: () => {
      sendTrayAction(7)
      toggleLyricWindow()
    }
  }, {
    id: 'desktop-lyric-close',
    label: '关闭桌面歌词',
    click: () => {
      sendTrayAction(8)
      toggleLyricWindow()
    }
  }, {
    id: 'desktop-lyric-lock',
    label: '锁定桌面歌词',
    click: () => sendTrayAction(9)
  }, {
    id: 'desktop-lyric-unlock',
    label: '解锁桌面歌词',
    click: () => sendTrayAction(10)
  }, {
    id: 'desktop-lyric-pin',
    label: '置顶桌面歌词',
    click: () => sendTrayAction(11)
  }, {
    id: 'desktop-lyric-unpin',
    label: '取消置顶桌面歌词',
    click: () => sendTrayAction(12)
  }, {
    type: 'separator'
  }, {
    id: 'play',
    label: '播放',
    click: () => sendTrayAction(1)
  }, {
    id: 'pause',
    label: '暂停',
    click: () => sendTrayAction(2)
  }, {
    label: '上一曲',
    click: () => sendTrayAction(3)
  }, {
    label: '下一曲',
    click: () => sendTrayAction(4)
  }, {
    type: 'separator'
  }, {
    label: '我的主页',
    click: () => sendTrayAction(5, true)
  }, {
    label: '设置',
    click: () => sendTrayAction(6, true)
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
  if (!mainWin || !isWinOS) return null
  const isMax = mainWin.isMaximized()
  if (isMax) {
    mainWin.unmaximize()
  } else {
    mainWin.maximize()
  }
  return !isMax
}

const setupAppWindowZoom = (zoom, noResize) => {
  if (!mainWin || !zoom) return
  currentZoom = Number(zoom) || 85
  const zoomFactor = currentZoom / 100
  if (zoomFactor < 0.5 || zoomFactor > 3) return
  mainWin.webContents.setZoomFactor(zoomFactor)
  const { appWidth, appHeight } = appLayoutConfig[appLayout]
  const width = parseInt(appWidth * zoomFactor)
  const height = parseInt(appHeight * zoomFactor)
  mainWin.setMinimumSize(width, height)
  if (noResize) return
  if (mainWin.isNormal()) {
    mainWin.setSize(width, height)
    mainWin.center()
  }
}

const cancelDownload = () => {
  if (downloadingItem) {
    downloadingItem.cancel()
    downloadingItem = null
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
  if (isDevEnv) console.log('ProxyConfig: ', config)
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
  if (win && win.webContents) win.webContents.openDevTools()
}

const cleanupBeforeQuit = () => {
  cancelDownload()
}

const getSecretOffical = (t, e) => {
  if (null == e || e.length <= 0) return console.log('Please enter a password with which to encrypt the message.'),
    null;
  for (var n = '', i = 0; i < e.length; i++) n += e.charCodeAt(i).toString();
  var r = Math.floor(n.length / 5),
    o = parseInt(
      n.charAt(r) + n.charAt(2 * r) + n.charAt(3 * r) + n.charAt(4 * r) + n.charAt(5 * r)
    ),
    l = Math.ceil(e.length / 2),
    c = Math.pow(2, 31) - 1;
  if (o < 2) return console.log(
    'Algorithm cannot find a suitable hash. Please choose a different password. \nPossible considerations are to choose a more complex or longer password.'
  ),
    null;
  var d = Math.round(1000000000 * Math.random()) % 100000000;
  for (n += d; n.length > 10;) n = (
    parseInt(n.substring(0, 10)) + parseInt(n.substring(10, n.length))
  ).toString();
  n = (o * n + l) % c;
  var h = '',
    f = '';
  for (i = 0; i < t.length; i++) f += (h = parseInt(t.charCodeAt(i) ^ Math.floor(n / c * 255))) < 16 ? '0' + h.toString(16) : h.toString(16),
    n = (o * n + l) % c;
  for (d = d.toString(16); d.length < 8;) d = '0' + d;
  return f += d
}

const cookiesMap = {} //格式: { url: cookie }
const cookiesPendingMap = {} //格式: { url: true }
const getCookie = (url, fetchOnMissing) => {
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
const cacheCookie = (url, cookie) => {
  cookiesMap[url] = cookie
}

const fetchCookie = async (url, ignoreCache) => {
  let cookie = ignoreCache ? null : getCookie(url)
  //缓存命中
  if (cookie) return cookie
  try {
    //前置状态检查，避免多次重复请求
    if (cookiesPendingMap[url]) return cookie
    cookiesPendingMap[url] = true

    //缓存未命中
    const resp = await fetch(url)
    const cookieText = resp.headers.get('Set-Cookie')
    if (cookieText) {
      cookie = {}
      const items = cookieText.split(';')
      items.forEach(item => {
        const kvPair = item.split('=')
        const key = kvPair[0].trim()
        const value = kvPair[1].trim()
        cookie[key] = value
      })
      cacheCookie(url, cookie)
    }
  } catch (error) {
    if (isDevEnv) console.log(error)
  }
  Reflect.deleteProperty(cookiesPendingMap, url)
  return cookie
}

//覆盖(包装)请求
const overrideRequest = (details) => {
  const { url } = details
  if (url.includes('localhost')) return details

  let origin = null, referer = null, xrouter = null
  let cookie = null, userAgent = null
  let csrf = null, cross = null, secret = null


  if (url.includes("qq.com")) {
    origin = "https://y.qq.com/"
    if (url.includes('moviets.tc.qq.com')) origin = "https://v.qq.com/"

    referer = origin
  } else if (url.includes("163.com") || url.includes("126.net")) {
    origin = "https://music.163.com/"
    referer = origin
    //if(url.includes("/dj/program/listen")) referer = null
  } else if (url.includes("u6.kuwo.cn")) {
    userAgent = 'fm 7010001}(android 7.1.2)'
    cookie = ''
    //referer = 'https://www.kuwo.cn/'
  } else if (url.includes("kuwo")) {
    origin = "https://www.kuwo.cn/"
    referer = origin

    //Cookie
    const hm_iuvt = {
      key: 'Hm_Iuvt_cdb524f42f0ce19b169a8071123a4727',
      value: randomTextWithinAlphabetNums(32)
    }
    const kwCookie = getCookie(origin, true)
    if (kwCookie) {
      for (const [key, value] of Object.entries(kwCookie)) {
        if (key.toLocaleLowerCase().includes('hm_iuvt_')) {
          Object.assign(hm_iuvt, { key, value })
          break
        }
      }
    }
    const kw_token = randomTextWithinAlphabetNums(10).toUpperCase()
    //const hm_token = 'JBKeCaitKM6jTWMfdef4kJMF2BBf4T3z'
    const hm_token = randomTextWithinAlphabetNums(32)
    //cookie = "Hm_lvt_cdb524f42f0ce19b169a8071123a4797=1651222601; _ga=GA1.2.1036906485.1647595722; kw_token=" + csrf
    cookie = `kw_token=${kw_token};Hm_token=${hm_token};${hm_iuvt.key}=${hm_iuvt.value};`

    //其他
    cross = MD5(SHA1(hm_token).toLowerCase()).toLowerCase()
    secret = getSecretOffical(hm_iuvt.value, hm_iuvt.key)

    if (url.includes('bangId')) referer = 'https://www.kuwo.cn/rankList'
  } else if (url.includes("kugou")) {
    origin = "https://www.kugou.com/"
    referer = origin
    if (url.includes("mac.kugou.com")) userAgent = USER_AGENTS[0]
    if (url.includes("&cmd=123&ext=mp4&hash=")) xrouter = 'trackermv.kugou.com'
  } else if (url.includes("douban")) {
    const bid = randomTextWithinAlphabetNums(11)
    origin = "https://fm.douban.com/"
    referer = origin
    cookie = "bid=" + bid
    //cookie = 'bid=' + bid + '; __utma=30149280.1685369897.1647928743.1648005141.1648614477.3; __utmz=30149280.1648005141.2.2.utmcsr=cn.bing.com|utmccn=(referral)|utmcmd=referral|utmcct=/; _pk_ref.100001.f71f=%5B%22%22%2C%22%22%2C1650723346%2C%22https%3A%2F%2Fmusic.douban.com%2Ftag%2F%22%5D; _pk_id.100001.f71f=5c371c0960a75aeb.1647928769.4.1650723346.1648618102.; ll="118306"; _ga=GA1.2.1685369897.1647928743; douban-fav-remind=1; viewed="2995812"; ap_v=0,6.0'
  } else if (url.includes("radio.cn") || url.includes("cnr.cn")) {
    origin = "http://www.radio.cn/"
    referer = origin
  } else if (url.includes("qingting") || url.includes("qtfm.cn")) {
    origin = "https://www.qingting.fm/"
    referer = origin
  } else if (url.includes("ximalaya")) {
    origin = "https://www.ximalaya.com/"
    referer = origin
  }

  //默认Referer
  if (!referer || referer.includes('localhost')) {
    if (!url.includes('localhost')) {
      const urlParts = url.split('://')
      const scheme = urlParts[0]
      const host = urlParts[1].split('/')[0]
      referer = `${scheme}://${host}/`
    }
  }

  /*
  details.requestHeaders['Access-Control-Allow-Headers'] = "Origin, X-Requested-With, Content-Type, Accept"
  details.requestHeaders['Access-Control-Allow-Origin'] = "*"
  */

  if (origin) details.requestHeaders['Origin'] = origin
  if (userAgent) details.requestHeaders['User-Agent'] = userAgent
  if (referer) details.requestHeaders['Referer'] = referer
  if (cookie) details.requestHeaders['Cookie'] = cookie
  if (xrouter) details.requestHeaders['x-router'] = xrouter
  if (csrf) details.requestHeaders['CSRF'] = csrf
  if (cross) details.requestHeaders['Cross'] = cross
  if (secret) details.requestHeaders['Secret'] = secret

  return details
}

//创建桌面歌词窗口
const createLyricWindow = () => {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 450,
    height: 150,
    minWidth: 100,
    minHeight: 100,
    titleBarStyle: 'hidden',
    title: 'Less Player - 桌面歌词',
    trafficLightPosition: { x: -404, y: -404 },
    transparent: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      //nodeIntegrationInWorker: true,
      contextIsolation: false, //Electron太坑，不得不关闭，毕竟没找到什么好的方式
      webSecurity: false  //TODO 有风险，暂时保留此方案，留待后期调整
    }
  })

  win.loadURL(
    app.isPackaged
      ? Url.format({
        pathname: path.join(__dirname, '../../dist/index.html'),
        protocol: 'file:',
        slashes: true,
        hash: 'desktopLyric',
      })
      : 'http://localhost:5173/#/desktopLyric',
  )

  if (isDevEnv) openDevTools(win)

  win.once('ready-to-show', () => {
    setWindowButtonVisibility(win, false)
    win.showInactive()
  })

  return win
}

const isMainWindowShow = () => {
  return mainWin && !mainWin.isDestroyed() && mainWin.isVisible()
}

const isLyricWindowShow = () => {
  return lyricWin && !lyricWin.isDestroyed() && lyricWin.isVisible()
}

//启动应用
if (isDevEnv) return startup()

const instanceLock = app.requestSingleInstanceLock()
if (!instanceLock) {
  app.quit()
} else {
  app.on('second-instance', (event, argv, workingDirectory, additionalData) => {
    if (mainWin) {
      //if (mainWin.isMinimized()) mainWin.restore()
      //mainWin.focus()
      handleStartupPlay(argv)
    }
  })
  startup()
}