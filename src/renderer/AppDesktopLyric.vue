<script setup>
import { computed, nextTick, ref, toRaw, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useSettingStore } from './store/settingStore';
import Mousetrap from 'mousetrap';
import { randomTextWithinAlphabetNums, smoothScroll, useIpcRenderer, smoothScrollHorizional } from '../common/Utils';
import { Track } from '../common/Track';
import { toMMssSSS, toMillis } from '../common/Times';



const ipcRenderer = useIpcRenderer()

const { desktopLyric } = storeToRefs(useSettingStore())
const { setDesktopLyricFontSize, setDesktopLyricTextDirection,
  setDesktopLyricAlignment, setDesktopLyricLayoutMode,
  setDesktopLyricColor, setDesktopLyricHighlightColor,
  setDesktopLyricLineSpacing, setupDesktopLyricAutoSize, } = useSettingStore()

const sendToMain = (channel, data) => {
  if (ipcRenderer) ipcRenderer.send(channel, data)
}

//TODO 歌词处理逻辑, 几乎与LyricControl组件重复
const currenTrack = ref(null)
const currentIndex = ref(0)
const lyricData = ref(null)
const isUserMouseWheel = ref(false)
let userMouseWheelCancelTimer = null
const isSeeking = ref(false)
const lyricTransData = ref(null)
const lyricTransActived = ref(true)
const lyricExistState = ref(-1)

const setCurrentIndex = (value) => currentIndex.value = value
const setLyricData = (value) => lyricData.value = value
const setUserMouseWheel = (value) => isUserMouseWheel.value = value
const setSeeking = (value) => isSeeking.value = value
const setLyricTransData = (value) => lyricTransData.value = value
const setLyricTransActive = (value) => lyricTransActived.value = value
const setLyricExistState = (value) => lyricExistState.value = value
const isLyricReady = () => lyricExistState.value == 1


const setLyricState = (track) => {
  setLyricExistState(-1)
  setCurrentIndex(0)
  setLyricData(Track.lyricData(track))
  setLyricTransData(Track.lyricTransData(track))

  if (Track.hasLyric(track)) { //确认是否存在有效歌词
    const lyricData = track.lyric.data
    let state = 1
    if (lyricData.size <= 6) {
      const linesIter = lyricData.values()
      let line = linesIter.next()
      while (!line.done) {
        const lineText = line.value
        const noLyric = (lineText.includes('纯音乐')
          || lineText.includes('没有填词')
          || lineText.includes('没有歌词'))
        if (noLyric) {
          state = 0
          break
        }
        line = linesIter.next()
      }
    }
    setLyricExistState(state)
  }

  nextTick(() => setupLyricExtra())
}

const setCurrentTrack = (track) => {
  currenTrack.value = track
  setLyricState(track)
}

const getDefaultLyricText = () => {
  const track = currenTrack.value
  if (!track) return '听你想听，爱你所爱'
  let artistName = Track.artistName(track)
  if (artistName.length > 0) artistName = ` - ${artistName}`
  return track.title + artistName
}

const renderLyric = (currentTime) => {
  if (!isLyricReady()) return
  if (isSeeking.value) return

  const trackTime = Math.max(0, (currentTime * 1000 + Track.lyricOffset(currenTrack.value)))
  const lyricWrap = document.querySelector('.desktop-lyric .center')
  if (!lyricWrap) return
  const lines = lyricWrap.querySelectorAll('.line')

  let index = -1, timeKey = null
  for (var i = 0; i < lines.length; i++) {
    timeKey = lines[i].getAttribute('timeKey')
    const lineTime = toMillis(timeKey)
    if (trackTime >= lineTime) {
      index = i
    } else if (trackTime < lineTime) {
      break
    }
  }

  if (index >= 0) {
    setCurrentIndex(index)
  } else {
    index = 0
  }

  //是否为用户手动滚动歌词
  if (isUserMouseWheel.value || isSeeking.value) return
  const { layoutMode, textDirection } = desktopLyric.value
  if (layoutMode != 2) return

  const isVeritical = (textDirection == 1)
  const offsetProp = isVeritical ? 'offsetLeft' : 'offsetTop'
  const sizeProp = isVeritical ? 'clientWidth' : 'clientHeight'

  if (!lines[index] || !lines[index][offsetProp] || !lines[index][sizeProp]) return

  //const { offsetTop } = lyricWrap
  const lineSize = lines[index][sizeProp]
  const { clientHeight, clientWidth } = document.documentElement
  const clientSize = isVeritical ? clientWidth : clientHeight
  //const destScrollTop = lines[index].offsetTop - (clientHeight / 2 - offsetTop)
  const destScrollValue = lines[index][offsetProp] - clientSize / 2 + lineSize / 2

  const scrollAction = isVeritical ? smoothScrollHorizional : smoothScroll
  //const frequency = getStateRefreshFrequency()
  //const duration = 300 * frequency / 60
  scrollAction(lyricWrap, destScrollValue, 300, 5, () => {
    return (isUserMouseWheel.value || isSeeking.value)
  })

}

const onUserMouseWheel = (event) => {
  //event.preventDefault()
  setUserMouseWheel(true)
  if (userMouseWheelCancelTimer) clearTimeout(userMouseWheelCancelTimer)
  userMouseWheelCancelTimer = setTimeout(() => {
    setUserMouseWheel(false)
  }, 1888)
  updateScrollLocatorTime()
}

//播放到指定歌词行，即通过歌词调整歌曲进度
const scrollLocatorTime = ref(0)
const scrollLocatorTimeText = ref('00:00')
const scrollLocatorCurrentIndex = ref(-1)

const setScrollLocatorTime = (value) => scrollLocatorTime.value = value
const setScrollLocatorTimeText = (value) => scrollLocatorTimeText.value = value
const setScrollLocatorCurrentIndex = (value) => scrollLocatorCurrentIndex.value = value

const setupLyricScrollLocator = () => {
  const locatorEl = document.querySelector('.desktop-lyric .scroll-locator')
  if (!locatorEl) return

  const { clientWidth, clientHeight } = document.documentElement
  const lyricEl = document.querySelector('.desktop-lyric .center')
  let leftAlignPos = clientWidth / 2 - 100
  if (lyricEl) leftAlignPos = Math.max(lyricEl.clientWidth - 100, leftAlignPos)

  const { alignment, textDirection } = desktopLyric.value
  const locatorPositions = ['33', '33', leftAlignPos]
  switch (textDirection) {
    case 0:
      locatorEl.style.right = locatorPositions[alignment] + 'px'
      break
    case 1:
      locatorEl.style.top = (clientHeight - 33 - locatorPositions[alignment]) + 'px'
      break
  }
}

const updateScrollLocatorTime = () => {
  const locatorEl = document.querySelector('.desktop-lyric .scroll-locator')
  if (!locatorEl) return
  const lyricEl = document.querySelector('.desktop-lyric .center')
  if (!lyricEl) return
  const { textDirection } = desktopLyric.value
  //横屏
  let x = lyricEl.offsetLeft + 188
  let y = locatorEl.offsetTop
  //竖屏
  if (textDirection == 1) {
    x = locatorEl.offsetLeft
    y = lyricEl.offsetTop + 188
  }
  const pointEl = document.elementFromPoint(x, y)
  if (!pointEl) return
  const timekey = pointEl.getAttribute('timeKey')
  if (!timekey) return
  //Time
  setScrollLocatorTime(timekey)
  setScrollLocatorTimeText(timekey.split('.')[0])
  //Hightlight
  const index = pointEl.getAttribute('index')
  setScrollLocatorCurrentIndex(index)
}

const seekFromLyric = () => {
  //不再多加判断，由用户自己决定吧
  //if (currentIndex.value == scrollLocatorCurrentIndex.value) return
  const { duration } = currenTrack.value
  if (duration <= 0) return
  const current = toMillis(scrollLocatorTime.value)
  if (current < 0 || current > duration) return

  setCurrentIndex(scrollLocatorCurrentIndex.value)
  setUserMouseWheel(false)
  setSeeking(true)
  const percent = current / duration
  //seekTrack(percent)
  postMessageToMain('c-track-seek', percent)
  setSeeking(false)
  setScrollLocatorCurrentIndex(-1)
}

const isExtraTextActived = computed(() => {
  const track = currenTrack.value
  return (Track.hasLyricTrans(track) && lyricTransActived.value)
  //|| (Track.hasLyricRoma(track) && lyricRomaActived.value)
})

//额外歌词（如翻译、发音）对应的时间
const getExtraTimeKey = (mmssSSS, offset) => {
  return toMMssSSS(toMillis(mmssSSS) + (offset || 0))
    || mmssSSS
}

//歌词翻译、罗马发音
const setupLyricExtra = () => {
  const lines = document.querySelectorAll(".desktop-lyric .center .line")
  if (lines) {
    try {
      lines.forEach((line, index) => {
        const extraTextEl = line.querySelector('.extra-text')
        if (!extraTextEl) return
        //1、重置
        extraTextEl.innerHTML = null

        //2、重新赋值
        //const extraTextMap = lyricTransData.value || lyricRomaData.value
        const extraTextMap = lyricTransData.value
        if (!extraTextMap) return
        const timeKey = line.getAttribute('timeKey')
        if (!timeKey) return
        let extraText = null
        //算法简单粗暴，最坏情况11次尝试！！！
        const timeErrors = [0, 10, -10, 20, -20, 30, -30, 40, -40, 50, -50]
        for (var i = 0; i < timeErrors.length; i++) {
          extraText = extraTextMap.get(getExtraTimeKey(timeKey, timeErrors[i]))
          if (extraText) break
        }
        if (extraText && extraText != '//') extraTextEl.innerHTML = extraText
      })
    } catch (error) {
      console.log(error)
    }
  }
}

let initTimer = null
const initDesktopLryic = () => {
  //syncSettingFromMain(data)
  setupLyricSetting(true)
  initTimer = setInterval(() => {
    postMessageToMain('c-track-init')
  }, 1000)
}


let syncTrackPosTimer = null
const syncTrackPos = () => {
  clearInterval(syncTrackPosTimer)

  syncTrackPosTimer = setInterval(() => {
    postMessageToMain('c-track-pos')
  }, 1000)
}

let messagePort = null, messagePortTimer = null
const postMessageToMain = (action, data) => {
  if (messagePort) messagePort.postMessage({ action, data })
}

const handleMessage = ({ action, data }) => {
  /*if (action == 's-desktopLyric-init') {
    syncSettingFromMain(data)
    setupLyricSetting(true)
    postMessageToMain('c-track-init')
  } */
  if (action === 's-track-none') {
    setCurrentTrack(null)
  } else if (action === 's-track-init') {
    clearInterval(initTimer)
    const { track, playing } = data
    setCurrentTrack(track)
    if (playing) syncTrackPos()
    //再次确认，是否有当前播放Track
    if (!track) postMessageToMain('c-track-init-retry')
  } else if (action === 's-track-init-retry') {
    setCurrentTrack(data)
  } else if (action === 's-track-play') {
    syncTrackPos()
  } else if (action === 's-track-pause') {
    clearInterval(syncTrackPosTimer)
  } else if (action === 's-track-pos') {
    nextTick(() => renderLyric(data))
  } else if (action === 's-track-noLyric') {
    setLyricExistState(0)
  } else if (action === 's-track-lyricLoaded') {
    setCurrentTrack(data)
  } else if (action === 's-desktopLyric-lockState') {
    toggleLock()
  } else if (action === 's-desktopLyric-pinState') {
    togglePin()
  } else if (action === 's-setting-sync') {
    syncSettingFromMain(data)
    setupLyricSetting(false)
  } else if (action === 's-theme-apply') {
    applyThemeFromMain(data)
  }
}

/*
const setupMessagePort = (callback) => {
  clearInterval(messagePortTimer)

  messagePortTimer = setInterval(() => {
    messagePort = useMessagePort()
    if (messagePort) {
      clearInterval(messagePortTimer)

      messagePort.onmessage = (event) => {
        handleMessage(event.data)
      }

      if (callback) callback()
    }
  }, 1000)
}
*/

const setupMessagePort = (callback) => {
  if (!ipcRenderer) return
  const pairChannel = randomTextWithinAlphabetNums(16)
  ipcRenderer.on(pairChannel, event => {
    messagePort = event.ports[0]

    messagePort.onmessage = (event) => {
      handleMessage(event.data)
    }

    if (callback) callback()
  })

  sendToMain('app-messagePort-setup', pairChannel)
}

const desktopLyricRef = ref(null)
const setupLyricSetting = (needResize) => {
  if (!desktopLyricRef.value) return
  const { fontSize, color, hlColor, lineSpacing } = desktopLyric.value
  const styles = {
    '--content-desktop-lyric-text-size': `${fontSize}px`,
    '--content-desktop-lyric-color': color,
    '--content-desktop-lyric-highlight-color': hlColor,
    '--content-desktop-lyric-line-spacing': `${lineSpacing}px`,
  }
  for (const [key, value] of Object.entries(styles)) {
    desktopLyricRef.value.style.setProperty(key, value)
  }

  if (typeof (needResize) == 'boolean') {
    sendLyricLayoutStateToMain(needResize)
    setupDesktopLyricAutoSize(needResize)
  }
}


//// 按钮操作
const hideWin = () => {
  clearInterval(syncTrackPosTimer)
  sendToMain('app-desktopLyric-toggle', true)
  if (lockState.value) toggleLock()
}

const pinState = ref(true)
const togglePin = () => {
  pinState.value = !pinState.value
  sendToMain('app-desktopLyric-alwaysOnTop', pinState.value)
}

//锁定歌词
const lockState = ref(false)
const lockVisible = ref(true)

const toggleLock = () => {
  lockState.value = !lockState.value
  lockVisible.value = true
  sendToMain('app-desktopLyric-lock', lockState.value)
}

const onMouseover = (event) => {
  if (!lockState.value) return
  lockVisible.value = true
}

const onMouseout = (event) => {
  if (!lockState.value) return
  lockVisible.value = false
}

//事件透传
const onLockBtnMouseOver = (event) => {
  if (!lockState.value) return
  sendToMain('app-desktopLyric-ignoreMouseEvent', false)
}

const onLockBtnMouseOut = (event) => {
  if (!lockState.value) return
  sendToMain('app-desktopLyric-ignoreMouseEvent', true)
}

//文字显示方向，横屏、竖屏
const switchTextDirectionState = () => {
  const { textDirection } = desktopLyric.value
  const direction = (textDirection + 1) % 2
  setDesktopLyricTextDirection(direction)
  setupLyricSetting(true)
  syncSettingToMain()
  setupLyricScrollLocator()
}

//对齐方式
const switchAlignState = () => {
  const { alignment, layoutMode } = desktopLyric.value
  const align = alignment - 1
  const lastAlign = layoutMode == 1 ? 3 : 2
  setDesktopLyricAlignment(align >= 0 ? align : lastAlign)
  syncSettingToMain()
  setupLyricScrollLocator()
}

//字体调节
const fontUp = () => {
  const { fontSize } = desktopLyric.value
  setDesktopLyricFontSize(fontSize + 1)
  setupLyricSetting()
  syncSettingToMain()
}

const fontDown = () => {
  const { fontSize } = desktopLyric.value
  setDesktopLyricFontSize(fontSize - 1)
  setupLyricSetting()
  syncSettingToMain()
}

const lineSpacingUp = () => {
  const { lineSpacing } = desktopLyric.value
  setDesktopLyricLineSpacing(lineSpacing + 1)
  setupLyricSetting()
  syncSettingToMain()
}

const lineSpacingDown = () => {
  const { lineSpacing } = desktopLyric.value
  setDesktopLyricLineSpacing(lineSpacing - 1)
  setupLyricSetting()
  syncSettingToMain()
}



//显示模式（布局）
const showByLayoutMode = computed(() => {
  return (key, value, index) => {
    const { layoutMode } = desktopLyric.value
    switch (layoutMode) {
      case 1: //双行
        if (currentIndex.value == index) return true
        const offset = (currentIndex.value % 2 === 1) ? -1 : 1
        return (currentIndex.value + offset) == index
      case 2: //全部显示
        return true
      default: //单行
        return currentIndex.value == index
    }
  }
})

const switchLayoutMode = () => {
  const { alignment, layoutMode } = desktopLyric.value
  const nLayoutMode = (layoutMode + 1) % 3
  setDesktopLyricLayoutMode(nLayoutMode)
  if (nLayoutMode != 1 && alignment == 3) {
    setDesktopLyricAlignment(1)
  }

  sendLyricLayoutStateToMain()
  syncSettingToMain()
  setupLyricSetting(true)
}

const toggleLyricTransActive = () => {
  setLyricTransActive(!lyricTransActived.value)
}

const sendLyricLayoutStateToMain = (needResize) => {
  const { layoutMode, textDirection } = desktopLyric.value
  sendToMain('app-desktopLyric-layoutMode', { layoutMode, textDirection, needResize })
}

const visitSetting = () => {
  postMessageToMain('c-setting-visit')
}

const syncSettingFromMain = (data) => {
  const { fontSize, textDirection, alignment, layoutMode, color, hlColor, lineSpacing, } = data
  setDesktopLyricFontSize(fontSize)
  setDesktopLyricAlignment(alignment)
  setDesktopLyricTextDirection(textDirection)
  setDesktopLyricLayoutMode(layoutMode)
  setDesktopLyricColor(color)
  setDesktopLyricHighlightColor(hlColor)
  setDesktopLyricLineSpacing(lineSpacing)
}

const syncSettingToMain = () => {
  postMessageToMain('c-setting-sync', toRaw(desktopLyric.value))
}

const applyThemeFromMain = (theme) => {
  const themeProperties = {
    '--app-bg-color': theme.appBackground.bgColor || "#FFFFFF",
    '--content-text-color': theme.content.textColor,
    '--content-text-highlight-color': theme.content.textHighlightColor,
    '--content-highlight-color': theme.content.highlightColor,

    '--button-icon-btn-color': theme.button.iconBtnColor,
    '--button-icon-text-btn-bg-color': theme.button.iconTextBtnBgColor,
    '--button-icon-text-btn-hover-bg-color': theme.button.iconTextBtnHoverBgColor,
    '--button-icon-text-btn-icon-color': theme.button.iconTextBtnIconColor,
  }

  for (const [key, value] of Object.entries(themeProperties)) {
    document.documentElement.style.setProperty(key, value)
  }
}

watch(isUserMouseWheel, setupLyricScrollLocator)

//注册默认应用级别快捷键  
const registryDefaultLocalKeys = () => {
  //按键事件监听
  window.addEventListener('keydown', event => {
    //Space键
    if (event.key == ' ') event.preventDefault()
  })

  // 播放或暂停
  Mousetrap.bind('space', () => postMessageToMain('c-track-togglePlay'))
  // 上 / 下一曲
  Mousetrap.bind(['left'], () => postMessageToMain('c-track-playPrev'))
  Mousetrap.bind(['right'], () => postMessageToMain('c-track-playNext'))
}

//可以不必等 Mounted事件
setupMessagePort(initDesktopLryic)
registryDefaultLocalKeys()
/*
onMounted(() => {
})
*/
</script>

<template>
  <div class="desktop-lyric"
    :class="{ 'desktop-lyric-lock': lockState, 'desktop-lyric-vertical': (desktopLyric.textDirection == 1) }"
    ref="desktopLyricRef" @mouseover="onMouseover" @mouseout="onMouseout">
    <div class="header">
      <div class="action">
        <div class="close-btn btn" v-show="!lockState" @click="hideWin">
          <svg width="12" height="12" viewBox="0 0 593.14 593.11" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z"
              transform="translate(-663.4 -243.46)" />
          </svg>
        </div>
        <div class="pin-btn btn spacing" :class="{ active: pinState }" v-show="!lockState" @click="togglePin">
          <svg width="16" height="16" v-show="!pinState" viewBox="0 0 883.92 883.44" xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
              <g id="Layer_1-2" data-name="Layer 1">
                <path
                  d="M272.88,677.42c-1.64,2.3-2.52,4-3.79,5.26Q208.85,743,148.57,803.28c-9.91,9.93-21.64,15.64-35.69,15.26-19.95-.54-34.85-10-43.12-28.1s-5.39-35.41,7.11-51A69.63,69.63,0,0,1,82,734Q141.6,674.46,201.2,614.91a42.23,42.23,0,0,1,4.36-3.34l.73-2.17c-1.72-1-3.74-1.76-5.12-3.13Q113.42,518.67,25.74,431C7.31,412.62-1.89,390.86.33,364.78c1.95-22.95,12.42-41.55,30.29-55.91C71,276.46,116.14,254.42,167.46,246a256.88,256.88,0,0,1,103.66,4.06c4.06,1,6.57.47,9.55-2.52Q391.21,136.74,501.89,26.1c14.94-15,32.33-24.38,53.6-25.87,22.56-1.57,42.89,4.73,59.15,20.4,28.08,27.06,55.41,54.9,83,82.46q80.46,80.41,160.9,160.85c14.87,14.84,23.86,32.31,25.19,53.39,1.4,22.19-4.91,42.13-20.12,58.3-18.49,19.65-37.9,38.45-57,57.55Q721.81,518.06,636.9,602.86c-2,2-3.38,3.64-2.44,6.85,15,51.08,10,101.12-8.23,150.37-12.16,32.89-29.43,63-50.66,90.84-29.75,39-83.23,43.52-119.2,10.36-7.35-6.77-14.27-14-21.34-21.08Q356.36,761.56,277.7,682.87C276.41,681.57,275.27,680.13,272.88,677.42ZM561.09,102.91c-1.32,1.25-2.65,2.47-3.92,3.75L448.64,215.18q-62.22,62.2-124.45,124.39C309,354.7,289,358.79,270,350.54c-17.67-7.69-36.21-11.25-55.33-11.82-39.71-1.2-75.3,11.24-107.94,33.16a5,5,0,0,0-1.27,1.18Q307.84,575.44,509.91,777.53c12-18,22.23-37.57,29.11-58.73,10.93-33.59,12.21-66.95-3.25-99.74-11.35-24.09-8-42.75,10.94-61.69L777.18,326.89c1.37-1.37,2.68-2.8,3.86-4Z" />
              </g>
            </g>
          </svg>
          <svg width="16" height="16" v-show="pinState" viewBox="0 0 769.97 933.48" xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
              <g id="Layer_1-2" data-name="Layer 1">
                <path
                  d="M432.47,706.53c.47,2.8,1,4.6,1,6.41q.08,85.24.06,170.5c0,14-4.24,26.35-14.44,36-14.49,13.72-31.7,17.59-50.36,10.63s-28.86-21.23-31-41.08a69.19,69.19,0,0,1-.18-7.49q0-84.24,0-168.5a40.52,40.52,0,0,1,.71-5.44l-1-2.05c-1.94.49-3.88,1.4-5.83,1.4q-124,.11-248,.11c-26,0-47.91-8.84-64.78-28.85C3.82,660.59-1.92,640,.56,617.24c5.61-51.44,22-99,52.3-141.23A256.82,256.82,0,0,1,129,405.59c3.58-2.17,5-4.32,5-8.54q-.18-156.49-.15-313c0-21.15,5.62-40.1,19.61-56.19C168.3,10.79,187.13.88,209.71.46c39-.73,78-.37,117-.38Q440.46,0,554.22,0c21,0,39.72,6,55.56,19.94,16.68,14.7,26.32,33.26,27,55.45.82,27,.39,54,.4,81q0,120,0,240c0,2.81.17,5,3.12,6.57,46.75,25.49,78.55,64.45,100.5,112.15,14.66,31.86,23.76,65.38,28.41,100.06,6.53,48.6-28.08,89.63-77,91.62-10,.4-20,.18-30,.18q-111.26,0-222.5,0C437.9,707,436.07,706.76,432.47,706.53ZM230,96.5c0,1.82-.12,3.62-.12,5.43q0,76.74,0,153.47,0,88,0,176c0,21.42-11.32,38.5-30.55,46.07-17.94,7.05-33.56,17.65-47.49,30.76-28.92,27.23-45.29,61.2-52.87,99.78a5.75,5.75,0,0,0-.07,1.73l572,0c-4.21-21.24-10.84-42.28-20.94-62.11-16-31.48-38.71-56-72.83-68.23-25.06-9-35.89-24.57-35.89-51.36q0-163,0-325.94c0-1.94-.08-3.88-.11-5.58Z" />
              </g>
            </g>
          </svg>
        </div>
        <div class="lock-btn btn spacing" :class="{ active: lockState }" v-show="lockVisible" @click="toggleLock"
          @mouseover="onLockBtnMouseOver" @mouseout="onLockBtnMouseOut">
          <svg width="17" height="17" viewBox="0 0 768.04 938.72" xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
              <g id="Layer_1-2" data-name="Layer 1">
                <path
                  d="M128,383.71v-6.83c0-40.32-.08-80.65,0-121A255.94,255.94,0,0,1,324.23,7.19C465.55-27,607.47,64.07,635,207a292.07,292.07,0,0,1,4.79,50.11c.67,40.32.22,80.65.22,121v5.46c8.06,1,15.83,1.52,23.48,2.85,54.73,9.5,98.13,56.29,103.62,111.62.51,5.13.86,10.3.86,15.46q.07,148,0,295.95c0,61.93-40.79,113-101.12,126.31a137,137,0,0,1-29.24,2.84q-253.71.25-507.43.1C66.77,938.66,15.43,897.38,2.68,836A136.23,136.23,0,0,1,.12,808.74Q-.13,661.52,0,514.28c0-64.85,43.4-117,107.15-128.43C113.84,384.65,120.68,384.44,128,383.71ZM383.88,853.44h253c28,0,45.86-17.91,45.87-46q0-146,0-292c0-28.11-17.84-46-45.86-46q-253.26,0-506.5,0a51.82,51.82,0,0,0-8.46.49c-22.55,3.78-36.65,20.94-36.66,44.73q0,146.74,0,293.49a54.15,54.15,0,0,0,1.28,12.39c4.8,20.12,21.66,32.86,43.28,32.87Q256.89,853.47,383.88,853.44ZM554.53,383.92c.1-1.79.23-2.94.23-4.09,0-41,.23-82-.16-122.95a181.55,181.55,0,0,0-3.31-33.72C536.81,150.8,480.86,97.59,407.11,87.28,354,79.85,307.05,95,267.75,131.45c-36.62,33.92-54.22,76.66-54.44,126.48-.18,40.32,0,80.64,0,121,0,1.61.17,3.22.27,5Z" />
                <path
                  d="M341.27,743.32c0-8.33-.16-16.67.07-25,.09-3.24-1.07-5-3.73-6.78-28-19.11-41.34-45.83-38.35-79.46,2.85-32,19.91-55.45,48.85-69.3,40.27-19.27,88.72-3.22,110.48,35.84a85.21,85.21,0,0,1-27.47,112.49c-3.4,2.24-4.47,4.53-4.43,8.39q.29,23.75,0,47.49c-.2,17-7.38,30.35-22.48,38.52-14.31,7.75-28.95,7.21-42.77-1.34-13.52-8.37-19.89-21.09-20.18-36.87C341.15,759.32,341.27,751.32,341.27,743.32Z" />
              </g>
            </g>
          </svg>
        </div>
        <div class="text-direction-btn btn spacing" v-show="!lockState" @click="switchTextDirectionState">
          <svg width="16" height="16" v-show="desktopLyric.textDirection == 0" viewBox="0 0 703.66 768.11"
            xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
              <g id="Layer_1-2" data-name="Layer 1">
                <path
                  d="M319.59,436.78c1.11-4.32,1.77-8.81,3.39-12.92Q402.43,222.58,482.06,21.38C487.53,7.56,498.41,0,512.19,0c14,0,24.62,7.56,30.28,21.89q42.48,107.46,84.82,215,36.83,93.33,73.62,186.66c7.9,20-1.78,39.89-21.72,44.75-15.36,3.74-30.67-4.33-37-20-8.75-21.59-17.18-43.3-25.74-65-5.07-12.84-10.18-25.67-15.11-38.57-1.05-2.73-2.43-3.81-5.45-3.8q-84,.14-168,0c-4,0-4.57,2.38-5.6,5q-20,50.59-40,101.2c-5.52,13.93-16.65,21.79-30.46,21.72C334.22,468.76,320.23,454.65,319.59,436.78Zm192.54-318c-21.15,53.48-41.77,105.6-62.5,158h124.8C553.68,224.17,533.16,172.1,512.13,118.77Z" />
                <path
                  d="M85.42,657.32V34.6C85.42,17,95,4.14,110.57.79A31.85,31.85,0,0,1,149.21,30.4c.11,2.16.06,4.33.06,6.5V658.45c1.94-1.77,3.23-2.86,4.42-4.05,9.1-9,17.92-18.39,27.32-27.11a31.64,31.64,0,0,1,52.68,16.29c2.48,10.77,0,20.79-7.76,28.67-28.84,29.13-57.73,58.22-87,86.91-12.29,12-31.07,11.9-43.36-.18Q51.89,716.05,9,672.39c-12.43-12.65-11.68-32.3.72-44.54a31.5,31.5,0,0,1,44.2-.37C64.25,637.34,74,647.83,84.05,658Z" />
                <path
                  d="M554.48,658.62c2.19-2,3.4-3,4.53-4.16,8.61-8.59,17.14-17.26,25.82-25.78,13.31-13.06,33-13.32,45.69-.71s12.56,32.49-.56,45.69q-41.93,42.2-84.11,84.11c-13.61,13.54-32.69,13.52-46.35,0q-42.18-41.93-84.11-84.11c-13.18-13.25-13.28-33-.52-45.65s32.43-12.34,45.69.72c9.71,9.57,19.27,19.3,30.15,30.22v-7q0-74.22,0-148.44c0-15.68,7.95-27.55,21.32-32.29,21.13-7.49,42.34,7.91,42.4,31.09.13,49.65,0,99.29,0,148.94Z" />
              </g>
            </g>
          </svg>
          <svg width="16" height="16" v-show="desktopLyric.textDirection == 1" viewBox="0 0 716.58 716.58"
            xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
              <g id="Layer_1-2" data-name="Layer 1">
                <path
                  d="M25.45,460.54c-18.2,0-30.14-17.39-23.65-35,10-27.17,20.27-54.23,30.43-81.33q61-162.61,122-325.22c6.52-17.37,24-24.06,38.54-14.82,5.61,3.58,8.81,8.86,11.09,14.94q38.58,103.07,77.24,206.09,37.21,99.3,74.44,198.6c5.72,15.25.25,29.43-13.41,35s-28.31-1.22-33.87-15.89q-14.06-37.11-27.9-74.28c-7.12-19-14.3-38-21.24-57.06-1.23-3.38-2.88-4.49-6.46-4.48q-73.74.18-147.48,0c-3.71,0-5.09,1.35-6.3,4.6Q74.58,376.89,50,442C45.51,454,36.85,460.5,25.45,460.54ZM238.07,255.8C218.4,203.35,198.94,151.45,179,98.19L119.87,255.8Z" />
                <path
                  d="M629.3,563.32c-2.22-2.32-3.43-3.64-4.7-4.91-17.91-17.91-35.92-35.73-53.71-53.76-13.94-14.14-8.37-37.11,10.3-42.62,10.17-3,19-.19,26.47,7.32q29.46,29.58,59,59,20.5,20.51,41,41c11.75,11.82,11.84,26.81.16,38.52Q657.87,658,607.79,708c-11,11-26.79,11.45-37.08,1.31-10.51-10.34-10.12-26.14,1.07-37.4q26.26-26.43,52.68-52.68c1.29-1.29,2.78-2.39,4.18-3.57l-.44-1.38H37.67c-4.33,0-8.67.1-13,0A25.45,25.45,0,0,1,25,563.34c2,0,4,0,6,0H629.3Z" />
                <path
                  d="M627.83,204.56h-5.74q-118,0-236,0c-13.63,0-23.48-6.73-26.78-18.12-4.66-16.05,6.51-31.65,23.49-32.79,1.83-.13,3.66-.07,5.5-.07H629c-1.9-2.07-3-3.37-4.22-4.58Q597.89,122.11,571,95.24c-7.17-7.2-9.69-15.85-6.82-25.67C567,60.16,573.38,54.19,582.9,52s17.72.69,24.59,7.58q17.47,17.52,35,35,32.16,32.18,64.33,64.35c13,13,13,27.4.14,40.29q-49.49,49.51-99,99c-10.72,10.7-25,11.85-35.54,3-11.8-9.84-12.61-26.78-1.53-38q26.72-27,53.73-53.74c1.25-1.24,3-1.95,4.55-2.9C628.72,205.92,628.27,205.24,627.83,204.56Z" />
              </g>
            </g>
          </svg>
        </div>
        <div class="align-btn btn spacing" v-show="!lockState" @click="switchAlignState">
          <svg width="16" height="16" v-show="desktopLyric.alignment == 0" viewBox="0 0 768.09 597.55"
            xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
              <g id="Layer_1-2" data-name="Layer 1">
                <path
                  d="M384.12,85.5q-169.46,0-338.9,0c-20.77,0-37.08-11.21-43-29.41C-6.76,28.76,12.83,1.23,42.08,0c1,0,2,0,3,0H722.89c20.75,0,37.09,11.23,43,29.41,8.93,27.34-10.65,54.85-39.9,56-2,.08-4,0-6,0Z" />
                <path
                  d="M341,597.5q-148,0-296,0c-20.68,0-37-11.35-42.92-29.58C-6.7,540.54,13,513.11,42.27,512c1.33,0,2.67,0,4,0H636.72c20.86,0,36.66,10.14,43.25,27.7,10.47,27.91-9.61,57-40,57.77-6.66.17-13.33,0-20,0Z" />
                <path
                  d="M256.19,341.5q-105.7,0-211.41,0C22.51,341.47,5,327.69,1,307.31-4.2,280.89,14.75,257.2,42,256c1.33-.05,2.67,0,4,0H466.33c21.22,0,37.55,11,43.57,29.35,9.16,27.9-11.25,55.79-41.3,56.09-22.82.23-45.64.05-68.47.05Z" />
              </g>
            </g>
          </svg>
          <svg width="16" height="16" v-show="desktopLyric.alignment == 1" viewBox="0 0 768.1 597.55"
            xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
              <g id="Layer_1-2" data-name="Layer 1">
                <path
                  d="M384.12,85.5q-169.46,0-338.91,0c-20.76,0-37.07-11.21-43-29.41C-6.76,28.75,12.84,1.23,42.09,0c1.16,0,2.33,0,3.49,0H722.39c20.33,0,35.88,9.9,42.65,27.08,10.94,27.74-8.71,57.14-39,58.37-2,.08-4,0-6,0Z" />
                <path
                  d="M383.89,597.5q-126.72,0-253.44,0c-21.06,0-37.72-11.8-43.27-30.46-8.09-27.19,11.47-53.86,40.34-55,.83,0,1.67,0,2.5,0q254,0,507.89,0c20.93,0,37.66,12,43.07,30.7,8.07,27.89-12.36,54.58-42.15,54.75-30.66.17-61.32,0-92,0Z" />
                <path
                  d="M383.88,341.5q-84.24,0-168.47,0c-21.28,0-38.3-12.6-43.27-31.77-7-26.93,12.39-52.53,40.62-53.68.83,0,1.66,0,2.5,0Q384,256,552.7,256c20.22,0,36.26,11.05,42.36,28.92,9.63,28.23-11,56.41-41.71,56.52-41,.16-82,0-123,0Z" />
              </g>
            </g>
          </svg>
          <svg width="16" height="16" v-show="desktopLyric.alignment == 2" viewBox="0 0 768.11 597.51"
            xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
              <g id="Layer_1-2" data-name="Layer 1">
                <path
                  d="M384.12,85.5q-169.46,0-338.9,0c-20.77,0-37.08-11.21-43-29.41C-6.76,28.76,12.83,1.23,42.08,0c1,0,2,0,3,0H722.89c20.75,0,37.09,11.23,43,29.41,8.93,27.34-10.65,54.85-39.9,56-2,.08-4,0-6,0Z" />
                <path
                  d="M426.53,597.5q-148,0-296,0c-21.29,0-38.06-12-43.46-30.85-7.76-27.11,11.67-53.42,40.34-54.6,1.17,0,2.34,0,3.5,0H722.38c21.2,0,37.55,11.08,43.54,29.42,8.93,27.35-10.66,54.85-39.92,56-1.83.07-3.67,0-5.5,0Z" />
                <path
                  d="M512.19,341.5q-105.71,0-211.41,0c-22.27,0-39.81-13.79-43.8-34.17-5.18-26.42,13.77-50.11,41-51.27,1.33-.05,2.67,0,4,0H722.33c21.22,0,37.55,11,43.57,29.35,9.16,27.9-11.25,55.79-41.3,56.09-22.82.23-45.64.05-68.47.05Z" />
              </g>
            </g>
          </svg>
          <svg width="16" height="16" v-show="desktopLyric.layoutMode == 1 && desktopLyric.alignment == 3"
            viewBox="0 0 853.35 703.85" xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
              <g id="Layer_1-2" data-name="Layer 1">
                <path
                  d="M744.28,554.41c-11-10.89-21.22-20.67-31-30.88a31.65,31.65,0,0,1,15.58-53.17c11.76-2.8,22,.63,30.57,9.21q26.3,26.39,52.66,52.68c10.25,10.26,20.55,20.46,30.75,30.77,14,14.14,14.07,33.07.09,47.12Q801.3,652,759.49,693.57c-13.44,13.37-33.26,13.65-46.06.88s-12.32-32.5,1.1-46.06c8.44-8.53,17-17,25.44-25.47,1.13-1.13,2.17-2.34,3.74-4H109.76c1.33,1.5,2.23,2.59,3.22,3.58,8.82,8.85,17.74,17.62,26.48,26.54,12.95,13.23,13,33.16.24,45.72-12.58,12.38-32.3,12.23-45.33-.71Q52,651.9,9.89,609.51c-13.14-13.24-13.2-32.44-.09-45.64Q52.05,521.29,94.64,479c13-12.85,32.84-12.75,45.32-.21s12.37,32.24-.4,45.36c-8.61,8.83-17.42,17.46-26.13,26.19-1.12,1.13-2.16,2.34-3.72,4Z" />
                <path
                  d="M426.13,63.78H34.72c-16.87,0-28.8-8.18-33.18-22.64A31.63,31.63,0,0,1,27.63.52,64.73,64.73,0,0,1,36.1,0Q426.76,0,817.41,0c18.11,0,30.4,8.36,34.65,23.52a31.71,31.71,0,0,1-29,40.17c-2.33.1-4.66.08-7,.08Z" />
                <path
                  d="M427,277.5q195.94,0,391.9,0c17,0,29,8.52,33.18,23.31a31.65,31.65,0,0,1-26,39.89,61.33,61.33,0,0,1-8.46.55q-390.91,0-781.82,0c-20.29,0-33.7-11.21-35.51-29.62-1.65-16.83,12-32.92,28.81-34,2.66-.17,5.33-.14,8-.14Z" />
              </g>
            </g>
          </svg>
        </div>
        <div class="font-up-btn btn spacing" v-show="!lockState" @click="fontUp">
          <svg width="15" height="15" viewBox="0 0 725.07 767.83" xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
              <g id="Layer_1-2" data-name="Layer 1">
                <path
                  d="M552.88,767.83c-17.21-.79-30.63-9.82-38.16-27.3Q492,687.81,469.5,635c-10.88-25.39-21.84-50.74-32.58-76.18-1.37-3.24-3-4.37-6.55-4.37q-131.72.16-263.44,0c-3.71,0-5.46,1-7,4.54Q121.43,649.46,82.6,739.79c-7.12,16.63-19.25,26.8-37.52,27.76-32,1.69-53.8-29.06-41.68-58.79,8.79-21.57,18.21-42.88,27.39-64.28Q144.14,380,257.42,115.52c6.07-14.21,15.11-24.66,30.32-28.68,20.51-5.43,41.1,4.55,49.77,24.38,13.27,30.33,26.16,60.83,39.2,91.26Q484.38,453.61,592.09,704.72c7.18,16.71,6.93,32.44-4.4,47C579.44,762.37,568.17,767.52,552.88,767.83ZM298.49,236c-33.66,78.55-66.69,155.64-99.89,233.1H398.39Z" />
                <path
                  d="M575.8,97.19c-12.64,10.11-25.11,20.09-37.59,30.05-14.58,11.65-28.88,23.67-43.83,34.82a42.16,42.16,0,0,1-66.11-22.77c-4.83-17.83.34-33.1,14.62-44.68,31.06-25.18,62.39-50,93.61-75q5.85-4.68,11.71-9.36c17.14-13.58,38-13.7,55.14-.09q37.75,30,75.34,60.25c10.91,8.76,22.18,17.13,32.56,26.48,12.27,11.05,16.32,25.33,12.35,41.36s-14.41,26.4-30.32,30.76c-14.39,3.95-27.28.32-38.8-8.93q-35.67-28.62-71.42-57.15C580.74,101.06,578.39,99.23,575.8,97.19Z" />
              </g>
            </g>
          </svg>
        </div>
        <div class="font-down-btn btn spacing" v-show="!lockState" @click="fontDown">
          <svg width="15" height="15" viewBox="0 0 725.34 767.78" xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
              <g id="Layer_1-2" data-name="Layer 1">
                <path
                  d="M553.06,767.75c-17.26-.87-30.62-10-38.14-27.45q-22.06-51.36-44-102.77c-11.28-26.31-22.63-52.59-33.77-78.95-1.3-3.07-2.75-4.19-6.16-4.19q-132.26.17-264.5,0c-3.55,0-4.8,1.43-6,4.34Q121.74,649.16,83,739.54c-5.8,13.59-15.13,23.2-29.56,26.75-16.58,4.08-31.23-.19-42.53-13.13s-13.86-28-7.45-43.85c8.54-21.13,17.8-42,26.78-62.93Q144.07,380.72,257.87,115c6-14,15.1-24.28,30.1-28.25,20.52-5.44,41.12,4.52,49.8,24.35,13.21,30.18,26,60.53,39,90.81Q484.56,453.35,592.39,704.77c7.52,17.51,6.72,33.76-5.82,48.53C578.36,763,567.5,767.5,553.06,767.75ZM298.77,236,198.84,469.12H398.69Z" />
                <path
                  d="M576.18,73.31c17.4-13.92,34.56-27.65,51.73-41.37,9.76-7.8,19.32-15.86,29.35-23.31,25-18.59,60.23-5.69,66.91,24.69,3.76,17.11-1.6,31.7-15.26,42.75-26.42,21.38-53,42.52-79.58,63.75-8.71,7-17.37,14-26.17,20.89-16.88,13.14-37.54,13.17-54.33-.18q-52.8-42-105.39-84.29c-19-15.29-22.08-41.49-7.31-60.16,14.65-18.52,41.11-21.51,60.22-6.42,25,19.71,49.74,39.71,74.6,59.58C572.62,70.58,574.33,71.88,576.18,73.31Z" />
              </g>
            </g>
          </svg>
        </div>
        <div class="line-spacing-up-btn btn spacing" v-show="!lockState" @click="lineSpacingUp">
          <svg width="16" height="16" viewBox="0 0 853.44 768.03" xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
              <g id="Layer_1-2" data-name="Layer 1">
                <path
                  d="M277.26,426.65q-115.71,0-231.44,0c-20.53,0-36.25-10.18-42.83-27.55-10.48-27.67,9.06-56.22,39.48-57.68,1.16-.05,2.33,0,3.5,0q231.43,0,462.88,0c18,0,32.2,6.71,40.83,22.86,15.29,28.59-5.18,61.68-38.47,62.41-11,.24-22,0-33,0Z" />
                <path
                  d="M682.87,621.06v-5.38q0-72.75,0-145.5c0-21,13.53-37.9,33.44-42.33,25.93-5.77,51.17,13.36,51.4,39.93.44,49.16.17,98.33.19,147.49v7.15c5.46-5.3,9.79-9.81,14.43-14a42.5,42.5,0,0,1,61.22,58.63c-1.59,1.92-3.34,3.72-5.1,5.48q-40.29,40.34-80.61,80.62C738,773,712.93,773,693,753q-40.86-40.81-81.65-81.69C593.06,653,593.05,626,611,609a42.19,42.19,0,0,1,57.25-.76c4.65,4.22,8.59,9.24,12.85,13.89Z" />
                <path
                  d="M681.45,146c-3.94,4.21-7.65,8.66-11.86,12.58-12.25,11.39-26.7,14.86-42.56,9.74-15.69-5.06-25.49-16.21-28.6-32.41-2.91-15.15,1.73-28.24,12.7-39.15Q636,72.13,660.64,47.31c11.08-11.08,22.12-22.19,33.24-33.22C712.74-4.62,738.15-4.74,757,14q41.84,41.6,83.42,83.45c11.92,12,15.85,26.56,11.07,42.73-4.61,15.58-15.35,25.6-31.26,29.23-15.07,3.44-28.39-.63-39.5-11.36-3.92-3.78-7.36-8.06-11-12.11l-1.75.94V152q0,72.5,0,145c0,21.36-12.73,38.21-32,42.9-27.36,6.66-52.87-13.33-53-41.84-.16-48.67,0-97.33,0-146v-5.23Z" />
                <path
                  d="M213.55,85.37q84,0,167.94,0c20.93,0,37.17,11.15,43.07,29.31a42.42,42.42,0,0,1-36,55.51,73.29,73.29,0,0,1-8,.42q-167.19,0-334.39.05c-18.2,0-32.57-6.82-41.12-23.21-14.55-27.92,5.12-62.38,40-62.18C101.25,85.61,157.4,85.37,213.55,85.37Z" />
                <path
                  d="M213.25,597.37q84,0,168,0c21.23,0,37.6,11.2,43.42,29.52a42.42,42.42,0,0,1-36.27,55.34,71.93,71.93,0,0,1-7.48.39q-167.44,0-334.89,0c-16.52,0-30.07-5.73-39-19.94-8.79-14-9.27-28.74-1.35-43.18,8.38-15.25,22-22.16,39.2-22.17q63.48-.06,127,0Z" />
              </g>
            </g>
          </svg>
        </div>
        <div class="line-spacing-down-btn btn spacing" v-show="!lockState" @click="lineSpacingDown">
          <svg width="16" height="16" viewBox="0 0 853.44 768.03" xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
              <g id="Layer_1-2" data-name="Layer 1">
                <path
                  d="M277.26,426.65q-115.71,0-231.44,0c-20.53,0-36.25-10.18-42.83-27.55-10.48-27.67,9.06-56.22,39.48-57.68,1.16-.05,2.33,0,3.5,0q231.43,0,462.88,0c18,0,32.2,6.71,40.83,22.86,15.29,28.59-5.18,61.68-38.47,62.41-11,.24-22,0-33,0Z" />
                <path
                  d="M768,573.79v5.38q0,72.75,0,145.5c0,21-13.53,37.9-33.43,42.33-25.94,5.76-51.17-13.36-51.41-39.93-.44-49.16-.17-98.33-.19-147.49v-7.15c-5.46,5.3-9.78,9.81-14.42,14a42.5,42.5,0,0,1-61.23-58.63c1.59-1.92,3.34-3.72,5.11-5.49Q652.69,482,693,441.67c19.9-19.85,45-19.79,64.89.14q40.86,40.82,81.65,81.69c18.27,18.39,18.29,45.32.29,62.32a42.19,42.19,0,0,1-57.25.76c-4.65-4.22-8.58-9.24-12.84-13.9Z" />
                <path
                  d="M769.58,195.17c3.93-4.21,7.64-8.66,11.85-12.58,12.26-11.39,26.7-14.86,42.56-9.75,15.69,5.06,25.49,16.22,28.6,32.41,2.91,15.15-1.73,28.25-12.7,39.15q-24.82,24.68-49.51,49.49c-11.07,11.07-22.12,22.19-33.24,33.22-18.85,18.71-44.27,18.82-63.09.11q-41.84-41.61-83.42-83.46c-11.91-12-15.84-26.56-11.06-42.73,4.6-15.57,15.34-25.59,31.25-29.22,15.07-3.44,28.39.63,39.5,11.36,3.92,3.78,7.36,8.06,11,12.11l1.75-.95v-5.14q0-72.51,0-145c0-21.37,12.74-38.21,32-42.91,27.36-6.65,52.87,13.34,53,41.85.16,48.66,0,97.33,0,146v5.24Z" />
                <path
                  d="M213.55,85.37q84,0,167.94,0c20.93,0,37.17,11.15,43.07,29.31a42.42,42.42,0,0,1-36,55.51,73.29,73.29,0,0,1-8,.42q-167.19,0-334.39.05c-18.2,0-32.57-6.82-41.12-23.21-14.55-27.92,5.12-62.38,40-62.18C101.25,85.61,157.4,85.37,213.55,85.37Z" />
                <path
                  d="M213.25,597.37q84,0,168,0c21.23,0,37.6,11.2,43.42,29.52a42.42,42.42,0,0,1-36.27,55.34,71.93,71.93,0,0,1-7.48.39q-167.44,0-334.89,0c-16.52,0-30.07-5.73-39-19.94-8.79-14-9.27-28.74-1.35-43.18,8.38-15.25,22-22.16,39.2-22.17q63.48-.06,127,0Z" />
              </g>
            </g>
          </svg>
        </div>
        <div class="layout-btn btn spacing" v-show="!lockState" @click="switchLayoutMode">
          <svg width="15" height="15" viewBox="0 0 853.5 768" xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
              <g id="Layer_1-2" data-name="Layer 1">
                <path
                  d="M426.79,768q-191,0-381.94,0c-21.76,0-38.57-12.56-43.43-32.64A55,55,0,0,1,.06,722.48Q0,384,0,45.59C0,17.93,18.06,0,45.77,0H807.65c28,0,45.84,17.9,45.84,46q0,338,0,675.89c0,28.34-17.86,46.1-46.26,46.1Zm-127.9-85.59H767.55V299.18H298.89ZM767.69,85.86H85.81v127H767.69ZM85.85,299V682.44h127.3V299Z" />
              </g>
            </g>
          </svg>
          <!--
          <svg width="16" height="16" viewBox="0 0 832.09 704.05" xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
              <g id="Layer_1-2" data-name="Layer 1">
                <path
                  d="M415.79,704Q241,704,66.28,704C34,704,8.65,684.4,1.63,653.73A69.2,69.2,0,0,1,.07,638.38Q0,352.15,0,65.9C0,27.81,27.9,0,66,0q350,0,700,0c38.18,0,66,27.74,66,65.88q.06,286,0,572c0,38.46-27.75,66.13-66.26,66.14Q590.8,704.08,415.79,704Zm-63.65-64.42h415.6V288.4H352.14ZM64.25,223.68H767.68V64.26H64.25Zm0,416H287.63V288.29H64.22Z" />
              </g>
            </g>
          </svg>
          <svg width="15" height="15" v-show="false" viewBox="0 0 682.31 511.62" xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
              <g id="Layer_1-2" data-name="Layer 1">
                <path
                  d="M341.27,84.78q-148.21,0-296.43,0c-20,0-35.34-10-41.87-27.24A42.42,42.42,0,0,1,41,.07C42.31,0,43.64,0,45,0H637.34C658,0,674.12,11,680.06,29c9.25,28-11.11,55.68-41.35,55.71q-134.48.15-268.94,0Z" />
                <path
                  d="M341.19,426.84q148.21,0,296.43,0c20.07,0,35.29,10,41.84,27.26a42.41,42.41,0,0,1-38,57.44c-1.5.07-3,.07-4.5.07H45.56c-20.48,0-36.15-10.18-42.71-27.65-10.27-27.36,9.59-56.91,38.91-57,71-.26,142-.11,213-.12Z" />
                <path
                  d="M341.15,213.42q147,0,293.92.11a62.77,62.77,0,0,1,19.61,2.76c18.5,6.26,29.77,25.53,27.27,45.07a42.23,42.23,0,0,1-38.51,36.53c-2.49.19-5,.3-7.48.3q-294.68,0-589.35.07c-13.06,0-24.83-3-34.06-12.63C.24,272.76-3.2,257.49,3.05,240.9c6.17-16.38,18.6-25.51,36.19-27.18,3.14-.29,6.32-.29,9.49-.29Z" />
              </g>
            </g>
          </svg>
          -->
        </div>
        <div class="tran-btn btn spacing" v-show="!lockState && Track.hasLyricTrans(currenTrack)"
          @click="toggleLyricTransActive" :class="{ active: lyricTransActived }">
          <svg width="17" height="17" v-show="false" viewBox="0 0 921.53 938.74" xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
              <g id="Layer_1-2" data-name="Layer 1">
                <path
                  d="M108.24,317.12c12.93-4.3,24.72-8.31,36.56-12.11,6.64-2.14,13.27-4.72,20.1-5.74a42.46,42.46,0,0,1,20.29,82c-20.69,7.33-41.61,14.05-62.44,21-22.25,7.42-44.46,15-66.79,22.11C31,432.36,5.53,417.66,1.05,392c-1.38-7.9-.12-16.64,1.6-24.63C36.93,208.18,157.89,74.43,312.72,23.79A475.2,475.2,0,0,1,499.46,1.51C697.18,17,866.05,159.36,915.22,351.82c2,7.74,3.74,15.53,5.33,23.36,4.79,23.59-9.7,45.53-33.29,50.6-22.47,4.83-45.07-9.76-50-32.93C827.25,345.43,809.9,301,783,260.62c-62-93.1-147.95-150.57-258.19-169.89C353.22,60.64,181,153.18,110.21,312.37,109.67,313.57,109.2,314.81,108.24,317.12Z" />
                <path
                  d="M811.07,626.51c-10.28,3.93-19.18,7.5-28.2,10.73-20.71,7.43-42.88-1.22-52.79-20.43-11.79-22.86-1.27-50,23.35-59.56,31-12.08,62.09-23.94,93.14-35.89,5.74-2.21,11.43-4.6,17.24-6.6,15.75-5.4,30.41-3.2,43,7.77,12.44,10.83,16.92,24.86,13.69,41C888.36,725,768.27,861.2,612.46,913.58c-61.8,20.79-125.16,29.1-190,23.41C302.3,926.44,200.38,877.13,117.69,789.31,57.37,725.25,18.74,649.56.92,563.33-3.91,540,10.8,517.81,34.38,512.79a42.28,42.28,0,0,1,49.81,32.59c10.56,50.49,29.61,97.41,59.07,139.76C204,772.53,286.67,827.34,391.39,846.88c171.48,32,342.29-56.16,416.85-214C809,631.28,809.71,629.6,811.07,626.51Z" />
                <path
                  d="M615.33,682.53c-15.06-.72-28.45-9.19-36-26q-16.8-37.59-33-75.47c-1.61-3.76-3.49-5.11-7.66-5.1q-69.49.25-139,0c-3.9,0-5.84,1.06-7.41,4.73Q376,618.76,359.21,656.63c-11.76,26.39-43.9,34.29-66.11,16.46-15-12-19.9-32.23-12-50.59,12.59-29.18,25.42-58.25,38.15-87.37q55.11-126,110.23-252c13.56-30.92,52.53-36.8,73.06-11a52.37,52.37,0,0,1,6.72,11.61q74,168.7,147.72,337.47C670,651,650.21,682.53,615.33,682.53ZM432.07,490.19h74.46c-12.38-28.3-24.53-56.07-37.23-85.08Z" />
              </g>
            </g>
          </svg>
          <svg width="16" height="16" viewBox="0 0 896 896" xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
              <g id="Layer_1-2" data-name="Layer 1">
                <path
                  d="M896,448.16C895.9,695.37,694.91,896.22,447.83,896,200.5,895.78-.2,694.93,0,447.83.2,200.31,201.27-.39,448.67,0,695.71.39,896.09,201.14,896,448.16Zm-65.29-32.42C823,333,792.7,260.2,738.78,197.43Q676,124.33,585.7,90a56.1,56.1,0,0,0,4.14,7.5c27.67,45.33,45.38,94.65,58.2,145.89a802.44,802.44,0,0,1,22.11,147.43c.49,8.28.94,16.55,1.42,24.92ZM586.12,806c138.71-51.8,234.8-186,244.07-325.76H671.66c-.17,1.58-.42,3-.47,4.49A836.33,836.33,0,0,1,657,611.69c-9.7,51-23.86,100.66-46.2,147.68C603.25,775.24,594.38,790.49,586.12,806ZM65.31,480.17C71.94,553.75,96.88,619.84,141,678.46S241.64,779.58,310.21,805.9a458.72,458.72,0,0,1-35.39-70C245.44,663.11,231.42,587,226,509c-.67-9.57-1.08-19.16-1.61-28.83ZM310,90.27C183.48,135.12,75.5,265.54,65.83,415.76H224.34c.17-1.65.41-3.1.46-4.57A830,830,0,0,1,240,278.86c10.36-52.26,25.43-103,49.3-150.85C295.75,115.12,303.17,102.72,310,90.27Zm105.8-18c-4.26,2.83-7.94,5-11.33,7.57C384.19,95.28,369.73,115.6,357,137.24c-24.36,41.46-39.16,86.58-49.94,133.14-8.85,38.19-14.09,76.94-16.91,116-.7,9.72-1,19.46-1.52,29.32H415.84ZM288.91,480.24c0,2.2-.06,3.87,0,5.53a761,761,0,0,0,15.21,126.31c9.69,46.44,23.36,91.57,45.66,133.7,13.23,25,28.58,48.53,50.52,67,4.63,3.89,9.83,7.1,15.49,11.13V480.24ZM481.46,72.4l-1.08,1.15V415.69H607.16c0-1.29,0-2.26,0-3.24A766.93,766.93,0,0,0,591.6,282.71c-9.08-43.29-21.78-85.41-41.59-125.12-12.55-25.16-27.24-48.92-47.74-68.49C495.86,83,488.43,77.94,481.46,72.4Zm-1.26,751A112.44,112.44,0,0,0,510,799.05c21.66-24.24,37.34-52.2,49.79-82,31.34-75,44-153.86,47.34-234.56a9.13,9.13,0,0,0-.34-2.13H480.2Z" />
              </g>
            </g>
          </svg>
        </div>
        <div class="setting-btn btn spacing" v-show="!lockState" @click="visitSetting">
          <svg width="16" height="16" viewBox="0 0 19.53 18" xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
              <g id="Layer_1-2" data-name="Layer 1">
                <path class="cls-1"
                  d="M.32,10.34a3,3,0,0,1,0-2.68l3-6A3,3,0,0,1,6,0h7.53a3,3,0,0,1,2.68,1.66l3,6a3,3,0,0,1,0,2.68l-3,6A3,3,0,0,1,13.53,18H6a3,3,0,0,1-2.68-1.66ZM2.11,8.55a1,1,0,0,0,0,.9l3,6A1,1,0,0,0,6,16h7.53a1,1,0,0,0,.89-.55l3-6a1,1,0,0,0,0-.9l-3-6A1,1,0,0,0,13.53,2H6a1,1,0,0,0-.89.55ZM7.76,9a2,2,0,1,0,2-2A2,2,0,0,0,7.76,9Zm2,4a4,4,0,1,1,4-4A4,4,0,0,1,9.76,13Z" />
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
    <div class="center" :class="{
      'lyric-showall': (!lockState && desktopLyric.layoutMode == 2 && lyricExistState == 1),
      'lyric-layout-ends': (desktopLyric.layoutMode == 1 && desktopLyric.alignment == 3)
    }" @mousewheel="onUserMouseWheel">
      <div class="unready-state-line desktop-lyric-content-highlight" :class="{
        'no-lyric': lyricExistState == 0,
        'align-left': desktopLyric.alignment == 0,
        'align-center': desktopLyric.alignment == 1,
        'align-right': desktopLyric.alignment == 2
      }" v-show="lyricExistState !== 1">
        {{ getDefaultLyricText() }}
      </div>
      <div v-show="lyricExistState == 1 && showByLayoutMode(key, value, index)" v-for="([key, value], index) in lyricData"
        class="line" :class="{
          'desktop-lyric-content-highlight': (currentIndex == index),
          first: index == 0,
          last: index == (lyricData.size - 1),
          odd: (index % 2 == 1),
          even: !(index % 2 == 1),
          'align-left': desktopLyric.alignment == 0,
          'align-center': desktopLyric.alignment == 1,
          'align-right': desktopLyric.alignment == 2,
          'locator-current': (index == scrollLocatorCurrentIndex && index != currentIndex && isUserMouseWheel)
        }" :timeKey="key" :index="index">
        <div class="text" :timeKey="key" :index="index" v-html="value"></div>
        <div class="extra-text" v-show="isExtraTextActived"></div>
      </div>
    </div>
    <div class="scroll-locator"
      v-show="!lockState && desktopLyric.layoutMode == 2 && (lyricExistState == 1) && isUserMouseWheel">
      <span class="time-text" v-html="scrollLocatorTimeText"></span>
      <div class="play-btn" @click="seekFromLyric">
        <svg width="9" height="9" viewBox="0 0 139 139" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink">
          <path
            d="M117.037,61.441L36.333,14.846c-2.467-1.424-5.502-1.424-7.972,0c-2.463,1.423-3.982,4.056-3.982,6.903v93.188  c0,2.848,1.522,5.479,3.982,6.9c1.236,0.713,2.61,1.067,3.986,1.067c1.374,0,2.751-0.354,3.983-1.067l80.704-46.594  c2.466-1.422,3.984-4.054,3.984-6.9C121.023,65.497,119.502,62.866,117.037,61.441z" />
        </svg>
      </div>
    </div>
  </div>
</template>

<style>
.desktop-lyric {
  margin: 0px;
  flex: 1;
  display: flex;
  flex-direction: column;

  background: var(--app-bg-color);
  color: var(--content-subtitle-text-color);
  font-size: var(--content-desktop-lyric-text-size);

  position: relative;
  -webkit-app-region: drag;
}

.desktop-lyric-lock {
  color: var(--content-desktop-lyric-color);
  background: none;
  -webkit-app-region: none;
  /*pointer-events: none;*/
}

.desktop-lyric-content-highlight {
  background: var(--content-desktop-lyric-highlight-color);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent !important;

  font-weight: bold;
}

.desktop-lyric .center::-webkit-scrollbar {
  display: none;
}

.desktop-lyric .spacing {
  margin-left: 20px;
}

.desktop-lyric .header {
  padding-top: 8px;
  padding-bottom: 6px;
}

.desktop-lyric .header .action {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 30px;
}

.desktop-lyric .btn {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  -webkit-app-region: none;
}

.desktop-lyric .active svg {
  fill: var(--content-highlight-color);
}

.desktop-lyric .center {
  padding: 10px 0px;
  flex: 1;
  overflow: scroll;
}

.desktop-lyric .center .no-lyric,
.desktop-lyric .center .unready-state-line,
.desktop-lyric .center .line {
  margin-top: 0px;
  padding: 0px 33px;
  word-break: break-word;
}

.desktop-lyric .center .line {
  margin-bottom: var(--content-desktop-lyric-line-spacing);
}

.desktop-lyric .center .desktop-lyric-content-highlight .extra-text {
  color: var(--content-text-color);
}

.desktop-lyric-lock .center .line .extra-text {
  /*
  background: var(--content-desktop-lyric-highlight-color);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent !important;
  */
  color: var(--content-desktop-lyric-color) !important;
}

.desktop-lyric-lock .center .desktop-lyric-content-highlight .extra-text {
  background: var(--content-desktop-lyric-highlight-color);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent !important;
}

.desktop-lyric .lyric-layout-ends .even,
.desktop-lyric .center .align-left {
  text-align: left;
}

.desktop-lyric .center .align-center {
  text-align: center;
}

.desktop-lyric .lyric-layout-ends .odd,
.desktop-lyric .center .align-right {
  text-align: right;
}

.desktop-lyric .lyric-showall {
  -webkit-mask-image: linear-gradient(transparent 0%, #fff 20%, #fff 80%, transparent 100%);
  mask-image: linear-gradient(transparent 0%, #fff 20%, #fff 80%, transparent 100%);
}

/*
.desktop-lyric .lyric-showall .no-lyric {
  margin-top: 88px;
}
*/

.desktop-lyric .lyric-showall .first {
  margin-top: 258px !important;
}

.desktop-lyric .lyric-showall .last {
  margin-bottom: 366px !important;
}

.desktop-lyric .scroll-locator {
  position: fixed;
  right: 33px;
  top: 50%;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.desktop-lyric .center .locator-current,
.desktop-lyric .center .locator-current .text,
.desktop-lyric .center .locator-current .extra-text {
  color: var(--content-text-color) !important;
  font-weight: bold !important;
}

.desktop-lyric .scroll-locator .time-text {
  font-size: 14px;
  font-weight: 500;
}

.desktop-lyric .scroll-locator .play-btn {
  /*margin-top: 16px;*/
  border-radius: 10rem;
  width: 18px;
  height: 18px;
  background: var(--button-icon-text-btn-bg-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 5px;
}

.desktop-lyric .scroll-locator .play-btn:hover {
  background: var(--button-icon-text-btn-hover-bg-color);
}

.desktop-lyric .scroll-locator .play-btn svg {
  margin-left: 1px;
  fill: var(--button-icon-text-btn-icon-color) !important;
}

/* 实验性CSS - 竖屏歌词 */
.desktop-lyric-vertical {
  flex-direction: row;
}

.desktop-lyric-vertical .header {
  width: 56px;
  /*background-color: var(--content-left-nav-bg-color);
  border-right: 1px solid var(--border-color);*/
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 25px 0px;
}

.desktop-lyric-lock .header {
  background: none;
  border-right: 1px solid transparent;
}

.desktop-lyric-vertical .header .action {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.desktop-lyric-vertical .spacing {
  margin-left: 0px;
  margin-top: 20px;
}

.desktop-lyric-vertical .center {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 33px 0px !important;
  overflow: hidden;
  overflow-x: scroll;
  width: 202px;
  /*
  flex-direction: column;
  writing-mode: vertical-rl;
  */
}

.desktop-lyric-vertical .center .line {
  writing-mode: vertical-rl;
  letter-spacing: 2px;
  /*line-height: var(--content-desktop-lyric-text-size + 3);*/
  margin-left: var(--content-desktop-lyric-line-spacing);
  padding: 0px;
  text-align: left;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.desktop-lyric-vertical .lyric-layout-ends .even,
.desktop-lyric-vertical .center .align-left {
  align-items: flex-start;
  text-align: left;
}

.desktop-lyric-vertical .center .align-center {
  align-items: center;
  text-align: center;
}

.desktop-lyric-vertical .lyric-layout-ends .odd,
.desktop-lyric-vertical .center .align-right {
  align-items: flex-end;
  text-align: right;
}

.desktop-lyric-vertical .lyric-showall {
  -webkit-mask-image: none;
  mask-image: none;
}

.desktop-lyric-vertical .lyric-showall .first {
  margin-top: 0px !important;
  margin-left: 258px;
}

.desktop-lyric-vertical .lyric-showall .last {
  margin-bottom: 0px !important;
  margin-right: 366px;
}

.desktop-lyric-vertical .scroll-locator {
  left: 50% !important;
  width: 36px;
  height: fit-content;
  flex-wrap: wrap;
}

.desktop-lyric-vertical .scroll-locator .time-text {
  margin-bottom: 3px;
}

.desktop-lyric-vertical .no-lyric,
.desktop-lyric-vertical .unready-state-line {
  writing-mode: vertical-rl;
  display: flex;
  height: 100%;
  flex-direction: column;
}
</style>
