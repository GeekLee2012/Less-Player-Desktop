import { defineStore } from "pinia";
import EventBus from '../../common/EventBus';
import { isDevEnv, useIpcRenderer } from "../../common/Utils";



const ipcRenderer = useIpcRenderer()
let toastTimer = null

export const useAppCommonStore = defineStore('appCommon', {
    state: () => ({
        isMaxScreen: false, //Electron存在系统兼容性问题，部分OS平台下无法全屏FullScreen显示
        coverMaskShow: false,
        playlistCategoryViewShow: false,
        artistCategoryViewShow: false,
        radioCategoryViewShow: false,
        tagsCategoryViewShow: false,
        platformCategoryViewShow: false,
        playbackQueueViewShow: false,
        playingViewShow: false,
        videoPlayingViewShow: false,
        soundEffectViewShow: false,
        customThemeEditViewShow: false,
        workingCustomTheme: null, //当前工作区的自定义主题，即正在编辑的主题
        //探索模式，歌单、歌手
        exploreModes: ['playlists', 'artists', 'radios', 'userhome'],
        exploreModeIndex: 0,
        exploreModeActiveStates: [true, true, true, false],
        //通用通知
        commonNotificationShow: false,
        commonNotificationText: null,
        commonNotificationType: 0, //类型，0 -> 普通成功消息，1 -> 失败消息
        commonNotificationImportant: false, //是否可以被新消息覆盖
        //通用上下文菜单
        commonCtxMenuShow: false,
        commonCtxMenuData: [],
        commonCtxItem: {},  //菜单的上下文对象，用于公共参数传递
        commonCtxMenuCacheItem: {}, //菜单缓存对象，与具体点击的菜单项相关
        commonCtxMenuSeparatorNums: 0,
        commonCtxMenuCacheItemIndex: -1, //菜单(右键)触发时，触发源对象对应的Index
        addToListSubmenuShow: false,
        artistListSubmenuShow: false,
        exitToHomeBtnShow: false,
        playingViewThemeIndex: 0,
        spectrumIndex: 1,
        //歌词设置
        lyricToolbarShow: false,
        //随便听听设置
        randomMusicToolbarShow: false,
        randomMusicPlatformCodes: [],
        randomMusicTypeCodes: [],
        currentMusicCategoryName: null,
        //当前调用链路追踪ID
        currentTraceId: null,
        colorPickerToolbarShow: false,
        gradientColorToolbarShow: false,
        //悬浮提示
        popoverHintShow: false,
        popoverHintText: null,
        popoverHintTarget: null,
        //搜索框
        searchBarExclusiveAction: null, //独占模式
        playlistExportToolbarShow: false,
        playlistExportContextItem: null,
        searchPlaceHolderIndex: 0,
        //路由上下文缓存
        routerCtxCacheItem: null,
        //桌面歌词
        desktopLyricShow: false,
        desktopLyricLocked: false,
        desktopLyricCtxData: null,
        //播放挂起状态
        pendingPlay: false,
        pendingPlayPercent: 0,
    }),
    getters: {
        isPlaylistMode() {
            return this.exploreModeIndex == 0
        },
        isArtistMode() {
            return this.exploreModeIndex == 1
        },
        isRadioMode() {
            return this.exploreModeIndex == 2
        },
        isUserHomeMode() {
            return this.exploreModeIndex == 3
        },
        exploreModeCode() {
            return this.exploreModes[this.exploreModeIndex]
        },
        exploreModeLength() {
            return this.exploreModes.length
        },
        isActiveRandomMusicPlatform() {
            return (platform) => {
                return this.randomMusicPlatformCodes.includes(platform)
            }
        },
        isActiveRandomMusicType() {
            return (type) => {
                return this.randomMusicTypeCodes.includes(type)
            }
        },
        isExploreModeEnable() {
            return (exploreMode) => {
                const index = this.exploreModes.findIndex(item => (item == exploreMode))
                return this.exploreModeActiveStates[index]
            }
        },
        isArtistModeEnable() {
            return this.isExploreModeEnable('artists')
        },
        isRadioModeEnable() {
            return this.isExploreModeEnable('radios')
        }
    },
    actions: {
        setMaxScreen(value) {
            this.isMaxScreen = value
        },
        toggleMaxScreen() {
            this.setMaxScreen(!this.isMaxScreen)
        },
        hidePlaybackQueueView() {
            this.playbackQueueViewShow = false
        },
        togglePlaybackQueueView() {
            this.playbackQueueViewShow = !this.playbackQueueViewShow
        },
        togglePlaylistCategoryView() {
            this.playlistCategoryViewShow = !this.playlistCategoryViewShow
            if (!this.playlistCategoryViewShow) {
                EventBus.emit("playlistCategory-resetScroll")
            }
        },
        hidePlaylistCategoryView() {
            this.playlistCategoryViewShow = false
            EventBus.emit("playlistCategory-resetScroll")
        },
        toggleArtistCategoryView() {
            this.artistCategoryViewShow = !this.artistCategoryViewShow
            if (!this.artistCategoryViewShow) {
                EventBus.emit("artistCategory-resetScroll")
            }
        },
        hideArtistCategoryView() {
            this.artistCategoryViewShow = false
            EventBus.emit("artistCategory-resetScroll")
        },
        toggleRadioCategoryView() {
            this.radioCategoryViewShow = !this.radioCategoryViewShow
            if (!this.radioCategoryViewShow) {
                EventBus.emit("radioCategory-resetScroll")
            }
        },
        hideRadioCategoryView() {
            this.radioCategoryViewShow = false
            EventBus.emit("radioCategory-resetScroll")
        },
        toggleTagsCategoryView() {
            this.tagsCategoryViewShow = !this.tagsCategoryViewShow
            if (!this.tagsCategoryViewShow) {
                EventBus.emit("tagsCategory-resetScroll")
            }
        },
        hideTagsCategoryView() {
            this.tagsCategoryViewShow = false
            EventBus.emit("tagsCategory-resetScroll")
        },
        togglePlatformCategoryView() {
            this.platformCategoryViewShow = !this.platformCategoryViewShow
        },
        hidePlatformCategoryView() {
            this.platformCategoryViewShow = false
        },
        showPlayingView() {
            this.playingViewShow = true
        },
        hidePlayingView() {
            this.playingViewShow = false
        },
        togglePlayingView() {
            this.playingViewShow = !this.playingViewShow
        },
        hideVideoPlayingView() {
            this.videoPlayingViewShow = false
        },
        toggleVideoPlayingView() {
            this.videoPlayingViewShow = !this.videoPlayingViewShow
        },
        hideSoundEffectView() {
            this.soundEffectViewShow = false
        },
        toggleSoundEffectView() {
            this.soundEffectViewShow = !this.soundEffectViewShow
        },
        showCustomThemeEditView(customTheme) {
            this.customThemeEditViewShow = true
            this.workingCustomTheme = customTheme
        },
        hideCustomThemeEditView() {
            this.customThemeEditViewShow = false
            this.workingCustomTheme = null
        },
        toggleCoverMask() {
            this.coverMaskShow = !this.coverMaskShow
        },
        quit() {
            if (ipcRenderer) ipcRenderer.send('app-quit')
        },
        minimize(isToTray) {
            if (ipcRenderer) ipcRenderer.send('app-min', isToTray)
        },
        maximize() {
            this.toggleMaxScreen()
            if (ipcRenderer) ipcRenderer.send('app-max')
        },
        normalize() {
            if (ipcRenderer) ipcRenderer.send('app-normalize')
        },
        setExploreMode(index) {
            if (!index || index < 0) index = 0
            this.exploreModeIndex = index % this.exploreModeLength
        },
        nextExploreMode() {
            /*
            const length = this.exploreModeLength
            if (this.exploreModeIndex == length - 2) {
                this.setExploreMode(0)
            } else {
                this.setExploreMode(this.exploreModeIndex + 1)
            }
            */
            const length = this.exploreModeLength
            let index = this.exploreModeIndex, count = 1
            do {
                index = (index + 1) % length
                if (this.exploreModeActiveStates[index]) {
                    this.setExploreMode(index)
                    break
                }
                ++count
            } while (count < length)
        },
        setExploreModeActiveState(index, active) {
            this.exploreModeActiveStates[index] = active
            if (!active && index == this.exploreModeIndex) {
                this.nextExploreMode()
            }
        },
        resetExploreModeActiveStates() {
            this.exploreModeActiveStates.length = 0
            this.exploreModeActiveStates = [true, true, true, false]
        },
        setPlaylistExploreMode() {
            this.setExploreMode(0)
        },
        setArtistExploreMode() {
            this.setExploreMode(1)
        },
        setRadioExploreMode() {
            this.setExploreMode(2)
        },
        setUserHomeExploreMode() {
            this.setExploreMode(3)
        },
        setCommonNotificationType(type) {
            this.commonNotificationType = type || 0
        },
        showCommonNotification(text) {
            //没有内容就不显示
            if (!text || (typeof text != 'string') || text.trim().length < 1) return
            this.commonNotificationText = text
            this.commonNotificationShow = true
        },
        hideCommonNotification() {
            this.commonNotificationShow = false
            this.commonNotificationText = null
            this.commonNotificationImportant = false
            this.setCommonNotificationType(-1)
        },
        doToast(text, type, callback, delay) {
            if (toastTimer) clearTimeout(toastTimer)
            this.showCommonNotification(text)
            this.setCommonNotificationType(type)
            toastTimer = setTimeout(() => {
                this.hideCommonNotification()
                try {
                    if (callback && (typeof callback == 'function')) callback()
                } catch (error) {
                    if (isDevEnv()) console.log(error)
                }
            }, (delay || 1500))
        },
        showToast(text, callback, delay) {
            if (this.commonNotificationImportant) return
            this.doToast(text || "当前操作成功", 0, callback, delay || 1688)
        },
        showFailToast(text, callback, delay) {
            this.doToast(text || "当前操作失败", 1, callback, delay || 2233)
        },
        showImportantToast(text, callback, delay, type) {
            this.commonNotificationImportant = true
            this.doToast(text || "当前操作成功", type || 0, callback, delay || 1688)
        },
        updateCommonCtxItem(value) {
            this.commonCtxItem = value
        },
        updateCommonCtxMenuCacheItem(value) {
            this.commonCtxMenuCacheItem = value
        },
        updateCommonCtxMenuCacheItemIndex(index) {
            this.commonCtxMenuCacheItemIndex = index
        },
        showCommonCtxMenu(value) {
            this.commonCtxMenuShow = true
            this.updateCommonCtxMenuCacheItem(value)
        },
        hideCommonCtxMenu(clearCache) {
            this.commonCtxMenuShow = false
            if (clearCache) this.updateCommonCtxMenuCacheItem(null)
            this.updateCommonCtxMenuCacheItemIndex(-1)
        },
        setCommonCtxMenuData(data) {
            this.commonCtxMenuData.length = 0
            if (data) {
                let spCnt = 0
                data.forEach(item => {
                    this.commonCtxMenuData.push(item)
                    if (item.separator) ++spCnt
                });
                this.commonCtxMenuSeparatorNums = spCnt
            }
        },
        showAddToListSubmenu() {
            this.addToListSubmenuShow = true
        },
        hideAddToListSubmenu() {
            this.addToListSubmenuShow = false
        },
        showArtistListSubmenu() {
            this.artistListSubmenuShow = true
        },
        hideArtistListSubmenu() {
            this.artistListSubmenuShow = false
        },
        hideAllCategoryViews() {
            this.hidePlaylistCategoryView()
            this.hideArtistCategoryView()
            this.hideRadioCategoryView()
            this.hideTagsCategoryView()
            this.hidePlatformCategoryView()
        },
        hideAllCtxMenus() {
            this.hideCommonCtxMenu(true)
            this.hideAddToListSubmenu()
            this.hideArtistListSubmenu()
        },
        setExitToHomeBtnVisible(value) {
            this.exitToHomeBtnShow = value
        },
        switchPlayingViewTheme() {
            this.playingViewThemeIndex = (this.playingViewThemeIndex + 1) % 2
            this.hideSoundEffectView()
        }
        ,
        switchSpectrumIndex() {
            this.setSpectrumIndex(this.spectrumIndex + 1)
        },
        setSpectrumIndex(value) {
            this.spectrumIndex = value
        },
        hideLyricToolbar() {
            this.lyricToolbarShow = false
        },
        toggleLyricToolbar() {
            this.lyricToolbarShow = !this.lyricToolbarShow
        },
        hideRandomMusicToolbar() {
            this.randomMusicToolbarShow = false
        },
        toggleRandomMusicToolbar() {
            this.randomMusicToolbarShow = !this.randomMusicToolbarShow
        },
        toggleRandomMusicPlatform(platform) {
            const index = this.randomMusicPlatformCodes.indexOf(platform)
            if (index == -1) {
                this.randomMusicPlatformCodes.push(platform)
            } else {
                this.randomMusicPlatformCodes.splice(index, 1)
            }
        },
        toggleRandomMusicType(type) {
            const index = this.randomMusicTypeCodes.indexOf(type)
            if (index == -1) {
                this.randomMusicTypeCodes.push(type)
            } else {
                this.randomMusicTypeCodes.splice(index, 1)
            }
        },
        setCurrentMusicCategoryName(value) {
            value = value ? value.toString().trim() : value
            this.currentMusicCategoryName = value
        },
        setCurrentTraceId(id) {
            this.currentTraceId = id
        },
        isCurrentTraceId(id) {
            return this.currentTraceId == id
        },
        toggleColorPickerToolbar() {
            this.colorPickerToolbarShow = !this.colorPickerToolbarShow
        },
        hideColorPickerToolbar() {
            this.colorPickerToolbarShow = false
        },
        showColorPickerToolbar() {
            this.colorPickerToolbarShow = true
        },
        toggleGradientColorToolbar() {
            this.gradientColorToolbarShow = !this.gradientColorToolbarShow
        },
        hideGradientColorToolbar() {
            this.gradientColorToolbarShow = false
        },
        showGradientColorToolbar() {
            this.gradientColorToolbarShow = true
        },
        showPopoverHint(el, text) {
            this.popoverHintTarget = el
            this.popoverHintText = text
            this.popoverHintShow = true
        },
        hidePopoverHint() {
            this.popoverHintShow = false
            this.popoverHintTarget = null
            this.popoverHintText = null
        },
        isSamePopoverHintShow(el) {
            return this.popoverHintTarget
                && this.popoverHintTarget === el
        },
        setSearchBarExclusiveAction(action) {
            this.searchBarExclusiveAction = action
        },
        showPlaylistExportToolbar(contextItem) {
            this.playlistExportContextItem = contextItem
            this.playlistExportToolbarShow = true
        },
        hidePlaylistExportToolbar() {
            this.playlistExportContextItem = null
            this.playlistExportToolbarShow = false
        },
        setSearchPlaceHolderIndex(index) {
            this.searchPlaceHolderIndex = index
        },
        setRouterCtxCacheItem(value) {
            this.routerCtxCacheItem = value
        },
        toggleDesktopLyricShow(noSend) {
            this.setDesktopLyricShow(!this.desktopLyricShow, noSend)
        },
        setDesktopLyricShow(value, noSend) {
            this.desktopLyricShow = value
            if (ipcRenderer && !noSend) ipcRenderer.send('app-desktopLyric-toggle')
        },
        setDesktopLyricCtxData(value) {
            this.desktopLyricCtxData = value
        },
        setPendingPlay(value) {
            this.pendingPlay = value
        },
        setPendingPlayPercent(value) {
            this.pendingPlayPercent = value
        }
    },
    persist: {
        enabled: true,
        strategies: [
            {
                //key: 'appCommon',
                storage: localStorage,
                paths: ['playingViewThemeIndex', 'spectrumIndex',
                    'randomMusicPlatformCodes', 'randomMusicTypeCodes',
                    'currentMusicCategoryName', 'exploreModeActiveStates', 
                    'pendingPlay', 'pendingPlayPercent']
            },
        ],
    },
})