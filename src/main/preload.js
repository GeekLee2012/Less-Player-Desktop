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
const { isMacOS, isWinOS, useCustomTrafficLight, 
  isDevEnv, DOWNLOADS_PATH, AUDIO_EXTS, EXTRA_AUDIO_EXTS,
  VIDEO_EXTS, IMAGE_EXTS, TrayAction, GitRepository,
} = require('./env')
//const path = require('path')
//const { createCipheriv, publicEncrypt, constants, randomBytes, createHash } = require('crypto')
//const zlib = require('zlib')


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
  IMAGE_EXTS,
  TrayAction,
  GitRepository,
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
window.lessAPI = {
  utils: {
    crypto: {
      aesEncrypt(buffer, mode, key, iv) {
        const cipher = createCipheriv(mode, key, iv)
        return Buffer.concat([cipher.update(buffer), cipher.final()])
      },
      rsaEncrypt(buffer, key) {
        buffer = Buffer.concat([Buffer.alloc(128 - buffer.length), buffer])
        return publicEncrypt({ key, padding: constants.RSA_NO_PADDING }, buffer)
      },
      randomBytes(size) {
        return randomBytes(size)
      },
      md5(str) {
        return createHash('md5').update(str).digest('hex')
      },
    },
    buffer: {
      from(...args) {
        return Buffer.from(...args)
      },
      bufToString(buf, format) {
        return Buffer.from(buf, 'binary').toString(format)
      },
    },
    zlib: {
      inflate(buf) {
        return new Promise((resolve, reject) => {
          zlib.inflate(buf, (err, data) => {
            if (err) reject(new Error(err.message))
            else resolve(data)
          })
        })
      },
      deflate(data) {
        return new Promise((resolve, reject) => {
          zlib.deflate(data, (err, buf) => {
            if (err) reject(new Error(err.message))
            else resolve(buf)
          })
        })
      },
    },
  },
}
*/

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
