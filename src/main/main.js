// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, Menu, dialog, powerMonitor, shell } = require('electron')
const path = require('path')
const { scanDir, parseTracks, readText } = require('./fileio') 
//关闭警告提示
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
//浏览器UserAgent
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:97.0) Gecko/20100101 Firefox/97.0"
//全局UserAgent
app.userAgentFallback = USER_AGENT
//是否为macOS
const isMacOS = (process.platform === 'darwin')
//macOS下是否显示交通灯
const showSysTrafficLight = isMacOS
//支持的音频文件扩展名（本地文件）
const AUDIO_EXTS = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'] 
//TODO 是否为开发环境
const isDevEnv = true

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
  //TODO
  Menu.setApplicationMenu(Menu.buildFromTemplate(initMenuTemplate()))

  mainWindow.once('ready-to-show', () => {
    setWindowButtonVisibility(showSysTrafficLight)
    mainWindow.show()
  })

  //TODO
  const filter = { 
    urls: [ 
        "https://y.qq.com/*",
        "*://*.y.qq.com/*", 
        "https://music.163.com/*" ,
        "*://*.kuwo.cn/*", 
        "*://*.kugou.com/*",
        "*://*.douban.com/*",
        "*://*.doubanio.com/*"
      ]
  }
  const webSession = mainWindow.webContents.session
  webSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    overrideRequest(details)
    callback({ requestHeaders: details.requestHeaders })
  })

  return mainWindow
}

//菜单
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('app-quit', ()=> {
  app.quit()
})

ipcMain.on('app-min', ()=> {
  const win = app.mainWin
  //win.setFullScreen(false)
  win.minimize()
})

ipcMain.on('app-max', ()=> {
  const win = app.mainWin
  if(win.isMaximized()) {
    win.unmaximize()
    //win.setFullScreen(false)
  } else {
    win.maximize()
    //win.setFullScreen(true)
  }
})

const setWindowButtonVisibility = (visible) => {
  if(!isMacOS) return
  try {
    app.mainWin.setWindowButtonVisibility(showSysTrafficLight && visible)
  } catch (error) {
    console.log(error)
  }
}

ipcMain.on('show-winBtn', ()=> {
  setWindowButtonVisibility(true)
})

ipcMain.on('hide-winBtn', ()=> {
  setWindowButtonVisibility(false)
})

ipcMain.on('visit-link', (e, data)=> {
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

ipcMain.handle('lyric-load', async (e, ...args)=> {
  const arg = args[0].trim()
  const index = arg.lastIndexOf('.')
  const lyricFile = arg.substring(0, index) + ".lrc"
  return readText(lyricFile)
})


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
  let orgin = null
  let referer = null
  let cookie = null

  const url = details.url
  if(url.includes("qq.com")) {
    orgin = "https://y.qq.com/"
    referer = orgin
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
    orgin = "https://music.163.com/"
    referer = orgin
  } else if(url.includes("kuwo")) {
    const choice = 'ABCDEFGHIJKLMNOPQRSTUVWSYZ01234567890'
    const CSRF = randomText(choice, 11)
    orgin = "https://www.kuwo.cn/"
    referer = orgin
    cookie = "kw_token=" + CSRF
    details.requestHeaders['CSRF'] = CSRF
  } else if(url.includes("kugou")) {
    orgin = "https://www.kugou.com/"
    referer = orgin
  }  else if(url.includes("douban")) {
    orgin = "https://fm.douban.com/"
    referer = orgin
  } 

  if(orgin) details.requestHeaders['Orgin'] = orgin
  if(referer) details.requestHeaders['Referer'] = referer
  if(cookie) details.requestHeaders['Cookie'] = cookie
}