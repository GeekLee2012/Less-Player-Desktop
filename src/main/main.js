// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, Menu, dialog, powerMonitor, shell, powerSaveBlocker } = require('electron')
const { isMacOS, useCustomTrafficLight, isDevEnv, USER_AGENT, AUDIO_EXTS, IMAGE_EXTS } = require('./env')
const path = require('path')
const { scanDir, parseTracks, readText } = require('./fileio') 

//关闭警告提示
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
//全局UserAgent
app.userAgentFallback = USER_AGENT
//电源模式
let powerSaveBlockerId = -1

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  app.mainWin = createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        app.mainWin = createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if(!isDevEnv) app.quit()
  if(!isMacOS) app.quit()
})

//主进程事件监听
ipcMain.on('app-quit', ()=> {
  app.quit()
}).on('app-min', ()=> {
  const win = app.mainWin
  //win.setFullScreen(false)
  win.minimize()
}).on('app-max', ()=> {
  const win = app.mainWin
  if(win.isMaximized()) {
    win.unmaximize()
    //win.setFullScreen(false)
  } else {
    win.maximize()
    //win.setFullScreen(true)
  }
}).on('app-suspension', (e, data)=> {
  if(data === true) {
    powerSaveBlockerId = powerSaveBlocker.start('prevent-app-suspension')
  } else if(powerSaveBlockerId != -1) {
    powerSaveBlocker.stop(powerSaveBlockerId)
    powerSaveBlockerId = -1
  }
}).on('show-winBtn', ()=> {
  setWindowButtonVisibility(true)
}).on('hide-winBtn', ()=> {
  setWindowButtonVisibility(false)
}).on('visit-link', (e, data)=> {
  shell.openExternal(data)
})

ipcMain.handle('open-dirs', async (e, ...args)=> {
  const result = await dialog.showOpenDialog(app.mainWin, {
    title: '请选择文件夹',
    properties: [ 'openDirectory' ]
  })
  if(result.canceled) return null
  return scanDir(result.filePaths[0], AUDIO_EXTS)
})

ipcMain.handle('open-files', async (e, ...args)=> {
  const result = await dialog.showOpenDialog(app.mainWin, {
    title: '请选择文件',
    filters: [
      { name: 'Audios', extensions: AUDIO_EXTS}
    ],
    properties: [ 'openFile', 'multiSelections']
  })
  if(result.canceled) return null
  return parseTracks(result.filePaths)
})

ipcMain.handle('open-image', async (e, ...args)=> {
  const result = await dialog.showOpenDialog(app.mainWin, {
    title: '请选择文件',
    filters: [
      { name: 'Image', extensions: IMAGE_EXTS}
    ],
    properties: [ 'openFile']
  })
  return result.filePaths
})

ipcMain.handle('lyric-load', async (e, ...args)=> {
  const arg = args[0].trim()
  const index = arg.lastIndexOf('.')
  const lyricFile = arg.substring(0, index) + ".lrc"
  return readText(lyricFile)
})

/* 自定义函数 */
//创建浏览窗口
const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 999,
    height: 666,
    minWidth: 999,
    minHeight: 666,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 15, y: 15 },
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      webSecurity: false  //TODO 有风险，暂时保留此方案，留待后期调整
    }
  })
  
  if(isDevEnv) {
    mainWindow.loadURL("http://localhost:3000")
    // Open the DevTools.
    mainWindow.webContents.openDevTools()
  } else {
    // Load the index.html of the app.
    mainWindow.loadFile('dist/index.html')
  }
  //菜单
  Menu.setApplicationMenu(Menu.buildFromTemplate(initMenuTemplate()))

  mainWindow.once('ready-to-show', () => {
    setWindowButtonVisibility(!useCustomTrafficLight)
    mainWindow.show()
  })

  //配置请求过滤
  const filter = { 
    urls: [ 
        "*://*.qq.com/*",
        "*://music.163.com/*" ,
        "*://*.kuwo.cn/*", 
        "*://*.kugou.com/*",
        "*://*.douban.com/*",
        "*://*.doubanio.com/*",
        "*://*.ridio.cn/*",
        "*://*.cnr.cn/*"
      ]
  }
  const webSession = mainWindow.webContents.session
  webSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    overrideRequest(details)
    callback({ requestHeaders: details.requestHeaders })
  })

  return mainWindow
}

//菜单模板
const initMenuTemplate = () => {
  let menuItems = [ { role: 'about' },
    { role: 'toggleDevTools' },
    { role: 'quit' } ]
  if(!isDevEnv) menuItems = [ { role: 'quit' } ]
  const appName = app.name.replace('-', '')
  const template = [
      ...[{
        label: appName,
        submenu: menuItems
      }],
  ]
  return template
}

//设置系统交通灯按钮可见性
const setWindowButtonVisibility = (visible) => {
  if(!isMacOS) return
  try {
    app.mainWin.setWindowButtonVisibility(visible)
  } catch (error) {
    console.log(error)
  }
}

//随机字符串
const randomText = (src, len) => {
  let result = []
  for (let i = 0; i < len; i++) {
      const index = Math.floor(Math.random() * (src.length - 1))
      result.push(src.charAt(index))
  }
  return result.join('')
}

//覆盖(包装)请求
const overrideRequest = (details) => {
  let origin = null
  let referer = null
  let cookie = null
  let userAgent = null

  const url = details.url
  if(url.includes("qq.com")) {
    origin = "https://y.qq.com/"
    referer = origin
    /*
    cookie = 	"fqm_pvqid=336b8c0b-9988-4607-a98e-9242dcd55f0e"
      + "&fqm_sessionid=0fd12ef8-5cd6-409c-8ef0-b5b601e99737"
      + "&pac_uid=0_32f39be6c9607"
      + "&pgv_info=ssid=s7351377509"
      + "&pgv_pvid=357794096"
      + "&ts_last=y.qq.com/n/ryqq/player"
      + "&ts_uid=2524044556"
    */
  } else if(url.includes("music.163.com")) {
    origin = "https://music.163.com/"
    referer = origin
  } else if(url.includes("kuwo")) {
    const choice = 'ABCDEFGHIJKLMNOPQRSTUVWSYZ01234567890'
    const CSRF = randomText(choice, 11)
    origin = "https://www.kuwo.cn/"
    referer = origin
    cookie = "kw_token=" + CSRF
    details.requestHeaders['CSRF'] = CSRF
  } else if(url.includes("kugou")) {
    origin = "https://www.kugou.com/"
    referer = origin
    if(url.includes("mac.kugou.com/")) userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16) AppleWebKit/605.1.15 (KHTML, like Gecko)'
  } else if(url.includes("douban")) {
    const choice = 'ABCDEFGHIJKLMNOPQRSTUVWSYZabcdefghijklmnopqrstuvwsyz01234567890'
    const bid = randomText(choice, 11)
    origin = "https://fm.douban.com/"
    referer = origin
    cookie = 'bid=' + bid + '; __utma=30149280.1685369897.1647928743.1648005141.1648614477.3; __utmz=30149280.1648005141.2.2.utmcsr=cn.bing.com|utmccn=(referral)|utmcmd=referral|utmcct=/; _pk_ref.100001.f71f=%5B%22%22%2C%22%22%2C1650723346%2C%22https%3A%2F%2Fmusic.douban.com%2Ftag%2F%22%5D; _pk_id.100001.f71f=5c371c0960a75aeb.1647928769.4.1650723346.1648618102.; ll="118306"; _ga=GA1.2.1685369897.1647928743; douban-fav-remind=1; viewed="2995812"; ap_v=0,6.0'
  } else if(url.includes("radio.cn") || url.includes("cnr.cn")) {
    origin = "http://www.radio.cn/"
    referer = origin
  }

  /*
  details.requestHeaders['Access-Control-Allow-Headers'] = "Origin, X-Requested-With, Content-Type, Accept"
  details.requestHeaders['Access-Control-Allow-Origin'] = "*"
  */

  //if(origin) details.requestHeaders['Origin'] = origin
  if(userAgent) details.requestHeaders['UserAgent'] = userAgent
  if(referer) details.requestHeaders['Referer'] = referer
  if(cookie) details.requestHeaders['Cookie'] = cookie

}