// preload.js

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
/*
window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }
  
    for (const dependency of ['chrome', 'node', 'electron']) {
      replaceText(`${dependency}-version`, process.versions[dependency])
    }
  })
*/

const { contextBridge, ipcRenderer, webFrame } = require('electron')
const { 
  isMacOS, isWinOS, useCustomTrafficLight, 
  isDevEnv, DOWNLOADS_PATH, AUDIO_EXTS, 
  EXTRA_AUDIO_EXTS, VIDEO_EXTS, VIDEO_COLLECTION_EXTS, 
  IMAGE_EXTS, TrayAction, GitRepository,
} = require('./env')
const { createMpv } = require('./mpv')


window.electronAPI = {
  ipcRenderer: {
    ...ipcRenderer,
    on: ipcRenderer.on.bind(ipcRenderer)
  },
  startDrag: (item) => {
    //path.join(process.cwd(), filePath)
    ipcRenderer.send('dnd-saveToLocal', item)
  },
  webZoom: {
    setZoomFactor: (factor) => {
      webFrame.setZoomFactor(factor)
    },
    getZoomFactor: () => {
      return webFrame.getZoomFactor()
    }
  },
  isMacOS,
  isWinOS,
  isDevEnv,
  useCustomTrafficLight,
  DOWNLOADS_PATH,
  AUDIO_EXTS,
  EXTRA_AUDIO_EXTS,
  VIDEO_EXTS,
  VIDEO_COLLECTION_EXTS,
  IMAGE_EXTS,
  TrayAction,
  GitRepository,
  createMpv,
}

window.addEventListener('DOMContentLoaded', () => {
  const viewEl = document.querySelector('.desktop-lyric')
  if(!viewEl) return
  const lyricEl = viewEl.querySelector('.center')
  lyricEl.addEventListener('mouseenter', () => {
    if(viewEl.classList.contains('desktop-lyric-lock')) {
      ipcRenderer.send('app-ignoreMouseEvents', true, { forward: true })
    }
  })
  lyricEl.addEventListener('mouseleave', () => {
    ipcRenderer.send('app-ignoreMouseEvents', false)
  })
})

/*
ipcRenderer.on('port', event => {
  window.electronAPI.messagePort = event.ports[0]
})
*/

/*
contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer: {
    ...ipcRenderer,
    on: ipcRenderer.on.bind(ipcRenderer)
  },
  isMacOS,
  isWinOS,
  isDevEnv,
  useCustomTrafficLight
})
*/
