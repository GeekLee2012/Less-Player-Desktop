<script setup>
import { nextTick, onMounted, reactive, ref, shallowRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from './store/appCommonStore';
import { useUserProfileStore } from './store/userProfileStore';
import { useSettingStore } from './store/settingStore';
import PlaylistCategoryView from './views/PlaylistCategoryView.vue';
import ArtistCategoryView from './views/ArtistCategoryView.vue';
import RadioCategoryView from './views/RadioCategoryView.vue';
import Notification from './components/Notification.vue';
import CommonContextMenu from './components/CommonContextMenu.vue';
import AddToListSubmenu from './components/addToListSubmenu.vue';
import ArtistListSubmenu from './components/ArtistListSubmenu.vue';
import LyricToolbar from './components/LyricToolbar.vue';
import RandomMusicToolbar from './components/RandomMusicToolbar.vue';
import PlayingView from './views/PlayingView.vue';
import VisualPlayingView from './views/VisualPlayingView.vue';
import SoundEffectView from './views/SoundEffectView.vue';
import CustomThemeEditView from './views/CustomThemeEditView.vue';
import ColorPickerToolbar from './components/ColorPickerToolbar.vue';
import GradientColorToolbar from './components/GradientColorToolbar.vue';
import PlaylistExportToolbar from './components/PlaylistExportToolbar.vue';
import TagsCategoryView from './views/TagsCategoryView.vue';
import PlatformCategoryView from './views/PlatformCategoryView.vue';
import DynamicPlayingView from './views/DynamicPlayingView.vue';
import PlayingThemeListView from './views/PlayingThemeListView.vue';
import CustomPlayingThemeEditView from './views/CustomPlayingThemeEditView.vue';
import { onEvents, emitEvents } from '../common/EventBusWrapper';



const currentPlayingView = shallowRef(null)
const ctxMenuPosStyle = reactive({ left: -999, top: -999 })
const ctxSubmenuPosStyle = reactive({ left: -999, top: -999 })
let ctxMenuPos = null, submenuItemNums = 0
const colorPickerToolbarRef = ref(null)
const gradientColorToolbarRef = ref(null)

const { commonNotificationShow, commonNotificationText,
  commonNotificationType, commonCtxMenuShow,
  commonCtxMenuData, commonCtxMenuSeparatorNums,
  addToListSubmenuShow, artistListSubmenuShow,
  commonCtxMenuCacheItem, playbackQueueViewShow,
  playingViewShow, videoPlayingViewShow,
  playingViewThemeIndex, soundEffectViewShow,
  lyricToolbarShow, randomMusicToolbarShow,
  customThemeEditViewShow, colorPickerToolbarShow,
  gradientColorToolbarShow, playlistCategoryViewShow,
  artistCategoryViewShow, radioCategoryViewShow,
  popoverHintShow, popoverHintText,
  playlistExportToolbarShow, tagsCategoryViewShow,
  platformCategoryViewShow, playingThemeListViewShow,
  customPlayingThemeEditViewShow, playingViewThemeType,
  playingViewCustomThemes, } = storeToRefs(useAppCommonStore())
const { hideCommonCtxMenu, showCommonCtxMenu,
  showAddToListSubmenu, hideAddToListSubmenu,
  showArtistListSubmenu, hideArtistListSubmenu,
  hideAllCtxMenus, toggleColorPickerToolbar,
  showColorPickerToolbar, toggleGradientColorToolbar,
  showGradientColorToolbar, showPopoverHint,
  hidePopoverHint, isSamePopoverHintShow,
  updateCommonCtxMenuCacheItemIndex } = useAppCommonStore()
//const { customPlaylists } = storeToRefs(useUserProfileStore())
const { isDefaultClassicLayout } = storeToRefs(useSettingStore())
const { getCurrentTheme } = useSettingStore()



const getCtxMenuAutoHeight = () => {
  const total = commonCtxMenuData.value.length || 1
  const spNums = commonCtxMenuSeparatorNums.value
  const itemHeight = 38, padding = 15
  return itemHeight * (total - spNums) + 7.5 * spNums + 2 * padding + 10
}

const menuWidth = 208 + 10
const submenuWidth = 208 + 10 + 33

const adjustMenuPosition = (event) => {
  const { x, y, clientX, clientY } = event
  const pos = { x, y }
  const { clientWidth, clientHeight } = document.documentElement
  //const menuWidth = 179, menuHeight = 288, padding = 10 
  const menuHeight = getCtxMenuAutoHeight(), padding = 10
  const gapX = clientX + menuWidth - clientWidth
  const tGapY = clientY - menuHeight
  const bGapY = clientY + menuHeight - clientHeight
  //右边界
  if (gapX > 0) {
    pos.x = pos.x - gapX - padding
  }
  //TODO 菜单有可能溢出顶部边界
  if (bGapY > 0) { //溢出底部边界
    pos.y = pos.y - menuHeight + padding / 2
  }
  //防止溢出上下边界
  pos.y = Math.max(pos.y, padding)
  pos.y = Math.min(pos.y, clientHeight - padding)
  return pos
}

const setMenuPosition = (event) => {
  ctxMenuPos = adjustMenuPosition(event)
  ctxMenuPosStyle.left = ctxMenuPos.x + 'px !important'
  ctxMenuPosStyle.top = ctxMenuPos.y + 'px !important'
}

const getCtxSubmenuAutoHeight = () => {
  const itemHeight = 41, padding = 15
  return itemHeight * submenuItemNums + 2 * padding
}

const adjustSubmenuPosition = (event) => {
  const { x, y, clientX, clientY } = event
  const pos = { x, y }
  const { clientWidth, clientHeight } = document.documentElement
  const submenuHeight = getCtxSubmenuAutoHeight(), padding = 10
  //直接显示二级菜单，而一级菜单并没有在显示
  if (!ctxMenuPos) {
    return pos
  }
  //一级菜单正在显示
  const gapX = clientX + submenuWidth - clientWidth
  const tGapY = clientY - submenuHeight
  const bGapY = clientY + submenuHeight - clientHeight
  //右边界
  //if (gapX > 0) {
  //  pos.x = pos.x - gapX - padding
  //}
  //TODO 菜单有可能溢出顶部边界
  if (tGapY <= 0) { //溢出底部边界
    pos.y = ctxMenuPos.y - padding * 2.58
  } else {
    pos.y = pos.y - submenuHeight / 2
  }
  //防止溢出上下边界
  pos.y = Math.max(pos.y, padding)
  pos.y = Math.min(pos.y, clientHeight - padding)
  return pos
}

const setSubmenuPosition = (event) => {
  const pos = adjustSubmenuPosition(event)
  const padding = submenuItemNums > 6 ? 12 : 6
  //const padding = 10
  let left = pos.x, top = pos.y
  if (ctxMenuPos) { //存在一级菜单
    left = ctxMenuPos.x - submenuWidth - padding
  }
  ctxSubmenuPosStyle.left = `${left}px !important`
  ctxSubmenuPosStyle.top = `${top}px !important`
}


//TODO 实现方式有待完善
const registerPopoverHints = () => {
  const hintEls = document.querySelectorAll('[popover-hint]')
  if (!hintEls) return
  hintEls.forEach(el => {
    const text = el.getAttribute('popover-hint')
    if (!text) return
    el.onmouseover = (event) => {
      if (isSamePopoverHintShow(el)) return
      showPopoverHint(el, text)

      const popoverHint = document.querySelector('.popover-hint')
      const { x, y } = event
      const { clientWidth: width, clientHeight: height } = el
      popoverHint.style.left = x + 'px'
      popoverHint.style.top = y + 30 + 'px'
    }
    el.onmouseout = (event) => {
      hidePopoverHint()
    }
  })
}

const setupCustomThemeEditViewPos = () => {
  if (!customThemeEditViewShow.value) return
  emitEvents('app-elementAlignCenter', {
    selector: '#custom-theme-edit-view',
    width: 768,
    height: 520
  })
}

const setupCustomPlayingThemeEditViewPos = () => {
  if (!customPlayingThemeEditViewShow.value) return
  emitEvents('app-elementAlignCenter', {
    selector: '#custom-playing-theme-edit-view',
    width: 768,
    height: 520
  })
}

const setupGradientColorToolbarPos = () => {
  if (!gradientColorToolbarShow.value) return
  emitEvents('app-elementAlignCenter', {
    selector: '#gradient-color-toolbar',
    width: 768,
    height: 568
  })
}

const setupSoundEffectViewPos = () => {
  emitEvents('app-elementAlignCenter', {
    selector: '.default-layout #sound-effect-view',
    width: 725,
    height: 550
  })
}

const setupPlaylistExportToolbarPos = () => {
  emitEvents('app-elementAlignCenter', {
    selector: '.default-layout #playlist-export-toolbar',
    width: 520,
    height: 211
  })
}

const setupPlayingViewCustomTheme = (customTheme) => {
  const index = playingViewThemeIndex.value
  const type = playingViewThemeType.value
  const customThemes = playingViewCustomThemes.value
  customTheme = customTheme || (type == 0 ? null : customThemes[index])
  if(!customTheme) return

  const dpvEl = document.querySelector('.dynamic-playing-view')
  if(!dpvEl) return 

  const { fontName, fontSize, fontWeight, textColor, btnColor } = customTheme
  const properties = {
    '--content-dynamicpv-font-name': fontName || 'Wawati SC',
    '--content-dynamicpv-font-size': (fontSize || 80) + 'px',
    '--content-dynamicpv-font-weight': fontWeight,
    '--content-dynamicpv-text-color': textColor || '#fff',
    '--content-dynamicpv-btn-color': btnColor || '#cacaca',
  }
  for(const [key, value] of Object.entries(properties)) {
    value && dpvEl.style.setProperty(key, value)
  }
}

const setupPlayingView = (theme, isPreviewMode) => {
  const index = playingViewThemeIndex.value
  const type = isPreviewMode ? -1 : playingViewThemeType.value
  const views = [PlayingView, VisualPlayingView, DynamicPlayingView]
  switch(type) {
    case 0:
      currentPlayingView.value = views[Math.min(index, 2)]
      break
    case 1:
    default:
      currentPlayingView.value = views[2]
      nextTick(() => setupPlayingViewCustomTheme(theme))
      break
  }
}

//TODO
watch(commonCtxMenuShow, (nv, ov) => {
  if (!nv) ctxMenuPos = null
})
watch(playbackQueueViewShow, hideAllCtxMenus)
watch(() => `${playingViewThemeType.value}-${playingViewThemeIndex.value}`, () => {
  setupPlayingView()
})

const appBackgroundScope = reactive({
  playingView: true,
  playbackQueue: false,
  contextMenu: false,
  toast: false,
  soundEffectView: false,
  lyricToolbar: false,
  randomMusicToolbar: false
})

//EventBus监听注册，统一管理
onEvents({
  'commonCtxMenu-show': ({ event, data, index }) => {
    hideCommonCtxMenu(true) //强制取消上次的显示
    hideAddToListSubmenu()
    hideArtistListSubmenu()
    setMenuPosition(event)
    //updateCommonCtxMenuCacheItemIndex(index)
    showCommonCtxMenu(data)
  },
  'addToListSubmenu-show': ({ event, total }) => {
    //submenuItemNums = customPlaylists.value.length + 2
    submenuItemNums = total
    setSubmenuPosition(event)
    showAddToListSubmenu()
  },
  'artistListSubmenu-show': event => {
    const { artist } = commonCtxMenuCacheItem.value
    submenuItemNums = artist.length
    setSubmenuPosition(event)
    showArtistListSubmenu()
  }, 
  'addToListSubmenu-hide': hideAddToListSubmenu,
  'artistListSubmenu-hide': hideArtistListSubmenu,
  'color-picker-toolbar-show': ({ event: mouseEvent, onChanged, value, title }) => {
    //根据鼠标点击位置，确定弹出位置
    const tbWidth = 218, tbHeight = 369
    const { x, y, offsetX, offsetY } = mouseEvent
    const pickerEl = document.querySelector('#color-picker-toolbar')
    const { clientHeight, clientWidth } = document.documentElement
    if (!pickerEl) return
    const padding = 25
    let top = Math.max(y + (18 - offsetY) - tbHeight / 2, padding)
    top = Math.min(top, clientHeight - tbHeight - padding)
    let left = Math.max(x + padding, padding)
    left = Math.min(left, clientWidth - tbWidth - padding)
    pickerEl.style.top = `${top}px`
    pickerEl.style.left = `${left}px`

    if (!colorPickerToolbarRef.value) return
    if (value) value = value.replace(/\s/g, '')
    colorPickerToolbarRef.value.init({ onChanged, value })
    showColorPickerToolbar(title)
  },
  'gradient-color-toolbar-show': ({ event: mouseEvent, value, onChanged }) => {
    if (!gradientColorToolbarRef.value) return
    gradientColorToolbarRef.value.init({ onChanged, value })
    showGradientColorToolbar()
  },
  'app-resize': () => {
    setupSoundEffectViewPos()
    setupCustomThemeEditViewPos()
    setupGradientColorToolbarPos()
  },
  'popover-hint-register': registerPopoverHints,
  'playingViewCustomTheme-applyTheme': param => {
    const { theme, isPreviewMode } = param || {}
    setupPlayingView(theme, isPreviewMode)
  },
})

onMounted(setupPlayingView)

watch(customThemeEditViewShow, setupCustomThemeEditViewPos)
watch(gradientColorToolbarShow, setupGradientColorToolbarPos)
watch(soundEffectViewShow, setupSoundEffectViewPos)
watch(playlistExportToolbarShow, setupPlaylistExportToolbarPos)
watch(customPlayingThemeEditViewShow, setupCustomPlayingThemeEditViewPos)

watch(() => getCurrentTheme(), (nv) => {
  const { appBackgroundScope: scope } = nv
  Object.assign(appBackgroundScope, { ...scope })
}, { deep: true, immediate: true })
</script>

<template>
  <div id="popovers">
    <!-- 浮层(Component、View)-->
    <transition name="fade-ex">
      <PlaylistCategoryView id="playlist-category-view"
        :class="{ autolayout: isDefaultClassicLayout, 'app-custom-theme-bg': appBackgroundScope.categoryView }"
        v-show="playlistCategoryViewShow">
      </PlaylistCategoryView>
    </transition>

    <transition name="fade-ex">
      <ArtistCategoryView id="artist-category-view"
        :class="{ autolayout: isDefaultClassicLayout, 'app-custom-theme-bg': appBackgroundScope.categoryView }"
        v-show="artistCategoryViewShow">
      </ArtistCategoryView>
    </transition>

    <transition name="fade-ex">
      <RadioCategoryView id="radio-category-view"
        :class="{ autolayout: isDefaultClassicLayout, 'app-custom-theme-bg': appBackgroundScope.categoryView }"
        v-show="radioCategoryViewShow">
      </RadioCategoryView>
    </transition>

    <transition name="fade-ex">
      <TagsCategoryView id="tags-category-view"
        :class="{ autolayout: isDefaultClassicLayout, 'app-custom-theme-bg': appBackgroundScope.categoryView }"
        v-show="tagsCategoryViewShow">
      </TagsCategoryView>
    </transition>

    <transition name="fade-ex">
      <PlatformCategoryView id="platform-category-view"
        :class="{ autolayout: isDefaultClassicLayout, 'app-custom-theme-bg': appBackgroundScope.categoryView }"
        v-show="platformCategoryViewShow">
      </PlatformCategoryView>
    </transition>

    <CommonContextMenu v-show="commonCtxMenuShow" :class="{ 'app-custom-theme-bg': appBackgroundScope.contextMenu }"
      :posStyle="ctxMenuPosStyle" :data="commonCtxMenuData">
    </CommonContextMenu>

    <AddToListSubmenu v-show="addToListSubmenuShow" :class="{ 'app-custom-theme-bg': appBackgroundScope.contextMenu }"
      :posStyle="ctxSubmenuPosStyle">
    </AddToListSubmenu>

    <ArtistListSubmenu v-show="artistListSubmenuShow" :class="{ 'app-custom-theme-bg': appBackgroundScope.contextMenu }"
      :posStyle="ctxSubmenuPosStyle">
    </ArtistListSubmenu>

    <!-- 通用通知 -->
    <transition>
      <Notification class="common-ntf" :class="{ 'app-custom-theme-bg': appBackgroundScope.toast }"
        v-show="commonNotificationShow" @click.stop="">
        <template #text>
          <svg v-show="commonNotificationType == 0" width="36" height="36" viewBox="0 0 938.64 938.69"
            xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
              <g id="Layer_1-2" data-name="Layer 1">
                <path
                  d="M938.46,466.59C937,602.08,888.74,717.76,790.36,811.31,722.44,875.92,641.39,915.54,549,931.7,306.41,974.12,70.65,819.29,13.17,579.86-38.14,366.13,63.88,146.91,260.42,49A462.65,462.65,0,0,1,435.07,1.28Q552.46-7.2,660,40.58c15.8,7,24.57,19.69,25.33,37.09s-6.88,30.65-22,39.18C651,123.88,638,124,625,118.26a376.21,376.21,0,0,0-96.43-28.41c-69.72-10.57-137.89-4-202.85,23.59C197.76,167.71,119,263.69,91.84,399.89s26.83,280,135.37,367.47q85.32,68.79,194,82.94c192.43,25.2,376.66-101.94,421.23-290.4a408.28,408.28,0,0,0,10.9-96.56c-.08-13.64-.79-27.46,1-40.89,2.93-21.41,23-36.29,44.43-34.79A42.34,42.34,0,0,1,938.4,428.6C938.75,441.26,938.46,453.93,938.46,466.59Z" />
                <path
                  d="M470.19,495.64c1.38-2,2.4-3.95,3.9-5.45Q668.36,295.61,862.65,101.05c8.69-8.71,18.42-14.78,30.91-15.44A42.62,42.62,0,0,1,926.39,158c-19.87,20.19-40,40.14-60,60.18Q683.73,401,501.09,583.9C490.92,594.08,479,599,464.58,597.61A41.12,41.12,0,0,1,439,585.32q-64-63.95-127.93-128a42.29,42.29,0,0,1,.12-60.22c16.85-16.81,43.36-16.72,60.59.42q46.78,46.56,93.36,93.3C466.4,492.08,467.73,493.29,470.19,495.64Z" />
              </g>
            </g>
          </svg>
          <svg v-show="commonNotificationType == 1" class="warning" width="36" height="36" viewBox="0 0 832.69 833.08"
            xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_2" data-name="Layer 2">
              <g id="Layer_1-2" data-name="Layer 1">
                <path
                  d="M0,418.14C2,184.11,181.54,3.07,414.93,0,639.74-2.89,831.55,180.28,832.68,415.49c1.05,217.63-172.6,416.07-409.88,417.58C194.72,834.53.54,657.29,0,418.14Zm75.72,3.78c3.1,196.32,163.2,339.48,350.11,335.38,191.56-4.21,332.05-161.39,331.12-342-1-191.48-157.61-341.62-342.68-340C236.24,76.93,73.14,219.63,75.72,421.92Z" />
                <path
                  d="M454.23,345c0,41.82.08,83.63-.09,125.45A56.72,56.72,0,0,1,452,487.12c-6.05,18.87-28.39,28.48-49,21.57-15-5-23.76-16.62-24.43-32.4-.08-2-.1-4-.1-6q0-125.44.08-250.9a56.36,56.36,0,0,1,2.1-16.71c5.27-16.66,22.26-25.72,42.18-23.21,17.37,2.19,30,15.26,31.06,32.55.48,8.14.3,16.32.31,24.48Q454.25,290.72,454.23,345Z" />
                <path
                  d="M452.88,599.79c-.06,22.38-15.21,37.83-37,37.71-21.28-.12-36.23-15.84-36.18-38,.05-22,15.29-37.76,36.5-37.8C437.74,561.63,452.94,577.45,452.88,599.79Z" />
              </g>
            </g>
          </svg>
          <p class="ntf-text" v-html="commonNotificationText"></p>
        </template>
      </Notification>
    </transition>

    <!-- 顶层浮动窗口 -->
    <transition name="fade-y">
      <component id="playing-view" :class="{ 'app-custom-theme-bg': appBackgroundScope.playingView }"
        v-show="playingViewShow" :is="currentPlayingView">
      </component>
    </transition>

    <transition name="fade-ex">
      <PlaybackQueueView id="playback-queue-view" :class="{ 'app-custom-theme-bg': appBackgroundScope.playbackQueue }"
        v-show="playbackQueueViewShow">
      </PlaybackQueueView>
    </transition>

    <transition name="fade-ex">
      <PlayingThemeListView id="playing-theme-list-view" v-show="playingThemeListViewShow">
      </PlayingThemeListView>
    </transition>

    <!-- 顶层浮动窗口 -->
    <transition name="fade-y">
      <VideoPlayingView id="video-playing-view" v-show="videoPlayingViewShow">
      </VideoPlayingView>
    </transition>

    <SoundEffectView id="sound-effect-view" :class="{ 'app-custom-theme-bg': appBackgroundScope.soundEffectView }"
      v-show="soundEffectViewShow" @click.stop="">
    </SoundEffectView>

    <LyricToolbar id="lyric-toolbar" :class="{ 'app-custom-theme-bg': appBackgroundScope.lyricToolbar }"
      v-show="lyricToolbarShow" @click.stop="">
    </LyricToolbar>

    <RandomMusicToolbar id="random-music-toolbar"
      :class="{ 'app-custom-theme-bg': appBackgroundScope.randomMusicToolbar }" v-show="randomMusicToolbarShow"
      @click.stop="">
    </RandomMusicToolbar>

    <CustomThemeEditView id="custom-theme-edit-view" v-show="customThemeEditViewShow" @click.stop="">
    </CustomThemeEditView>

    <CustomPlayingThemeEditView id="custom-playing-theme-edit-view" v-show="customPlayingThemeEditViewShow" @click.stop="">
    </CustomPlayingThemeEditView>

    <ColorPickerToolbar id="color-picker-toolbar" ref="colorPickerToolbarRef" v-show="colorPickerToolbarShow"
      @click.stop="">
    </ColorPickerToolbar>

    <GradientColorToolbar id="gradient-color-toolbar" ref="gradientColorToolbarRef" v-show="gradientColorToolbarShow"
      @click.stop="">
    </GradientColorToolbar>

    <Notification class="popover-hint" :class="{ 'app-custom-theme-bg': appBackgroundScope.toast }"
      v-show="popoverHintShow" @click.stop="">
      <template #text>
        <div v-html="popoverHintText"></div>
      </template>
    </Notification>

    <PlaylistExportToolbar id="playlist-export-toolbar" v-show="playlistExportToolbarShow" @click.stop="">
    </PlaylistExportToolbar>
  </div>
</template>

<style>
#playlist-category-view,
#artist-category-view,
#radio-category-view,
#tags-category-view,
#platform-category-view {
  position: fixed;
  top: 85px;
  right: 0px;
  width: 404px;
  width: 40.4%;
  z-index: 55;
  background-color: var(--app-bg-color);
  background-image: var(--app-bg-image);
  box-shadow: var(--box-shadow);
}

#playback-queue-view {
  position: fixed;
  top: 0;
  right: 0px;
  width: 335px;
  max-width: 404px;
  width: 33.5%;
  height: 100%;
  z-index: 99;
  box-shadow: var(--box-shadow);
  border-top-right-radius: var(--border-macstyle-border-radius);
  border-bottom-right-radius: var(--border-macstyle-border-radius);
}

#playing-view,
#video-playing-view {
  position: fixed;
  top: 0;
  left: 0px;
  width: 100%;
  height: 100%;
  z-index: 99;
  background-position: center;
  background-size: cover;
  border-radius: var(--border-macstyle-border-radius);
}

#playing-theme-list-view {
  position: fixed;
  top: 0;
  right: 0px;
  width: 335px;
  max-width: 404px;
  width: 33.5%;
  height: 100%;
  z-index: 100;
  box-shadow: var(--box-shadow);
  border-top-right-radius: var(--border-macstyle-border-radius);
  border-bottom-right-radius: var(--border-macstyle-border-radius);
}

#custom-playing-theme-edit-view {
  position: fixed;
  right: 30px;
  bottom: 80px;
  width: 768px;
  height: 520px;
  z-index: 100;
  background-color: var(--app-bg-color);
  box-shadow: var(--box-shadow);
  border-radius: 15px;
}

#video-playing-view {
  z-index: 100;
}

#sound-effect-view {
  position: fixed;
  right: 30px;
  bottom: 80px;
  width: 725px;
  height: 550px;
  z-index: 99;
  box-shadow: var(--box-shadow);
  border-radius: 15px;
}

#lyric-toolbar {
  position: fixed;
  top: 202px;
  right: 30px;
  z-index: 99;
  box-shadow: var(--box-shadow);
  border-radius: 5px;
}

#random-music-toolbar {
  position: fixed;
  bottom: 128px;
  right: 30px;
  z-index: 99;
  box-shadow: var(--box-shadow);
  border-radius: 10px;
}

#custom-theme-edit-view {
  position: fixed;
  right: 30px;
  bottom: 80px;
  width: 768px;
  height: 520px;
  z-index: 99;
  background-color: var(--app-bg-color);
  box-shadow: var(--box-shadow);
  border-radius: 15px;
}

#color-picker-toolbar {
  position: fixed;
  left: 50%;
  bottom: 125px;
  z-index: 101;
  background-color: var(--app-bg-color);
  box-shadow: var(--box-shadow);
  border-radius: 5px;
}

#gradient-color-toolbar {
  position: fixed;
  left: 50%;
  bottom: 125px;
  width: 768px;
  height: 568px;
  z-index: 100;
  background-color: var(--app-bg-color);
  box-shadow: var(--box-shadow);
  border-radius: 15px;
}

#playlist-export-toolbar {
  position: fixed;
  left: 50%;
  top: 50%;
  width: 520px;
  height: 211px;
  z-index: 100;
  background-color: var(--app-bg-color);
  box-shadow: var(--box-shadow);
  border-radius: 15px;
}

.app-custom-theme-bg .ntf-dialog-mask {
  background-color: var(--app-bg-color);
  background-image: var(--app-bg-image);
}

#popovers .common-ntf {
  position: fixed;
  left: 50%;
  top: 50%;
}

#popovers .common-ntf,
#popovers .common-ntf .ntf-dialog-mask {
  border-radius: 12px;
}

#popovers .common-ntf .ntf-text {
  max-height: calc(var(--ntf-height) - 50px);
  width: calc(var(--ntf-width) - 30px);
  overflow: hidden;
  word-wrap: break-word;
  line-break: anywhere;
  /*white-space: pre-wrap;*/
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

#popovers .common-ctx-menu,
#popovers .common-ctx-menu .container,
#popovers .common-ctx-submenu,
#popovers .common-ctx-submenu .container {
  border-radius: 8px;
}


#popovers .autolayout {
  top: 60px;
}

#popovers .popover-hint {
  z-index: 1024;
}

#popovers .popover-hint .ntf-dialog-mask {
  border-radius: 6px;
}

#popovers .popover-hint .ntf-dialog {
  width: auto !important;
  height: auto !important;
  align-items: flex-start;
}

#popovers .popover-hint .ntf-text {
  font-size: var(--content-text-tip-text-size);
  padding: 6px 15px;
}

#popovers .popover-hint .ntf-text div {
  min-width: 20px;
  max-width: 520px;
  width: max-content !important;
  height: auto !important;
  text-align: left;
  align-items: center;
}
</style>