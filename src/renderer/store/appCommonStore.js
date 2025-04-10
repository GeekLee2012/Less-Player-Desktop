import { defineStore } from "pinia";
import { isDevEnv, randomTextWithinAlphabetNums,
    ipcRendererSend, ipcRendererInvoke,
 } from "../../common/Utils";
import { onEvents, emitEvents } from "../../common/EventBusWrapper";
import { usePlatformStore } from "./platformStore";


const resetCategoryScroll = (prefix) => emitEvents(`${prefix}Category-resetScroll`)
const resetPlaylistCategoryScroll = () => resetCategoryScroll('playlist')
const resetArtistCategoryScroll = () => resetCategoryScroll('artist')
const resetRadioCategoryScroll = () => resetCategoryScroll('radio')
const resetTagsCategoryScroll = () => resetCategoryScroll('tags')


let toastTimer = null
const playingViewCustomThemePrefix = 'custom_'

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
        playingThemeListViewShow: false,
        playingViewPresetThemes: [{
            id: 'default_cover',
            name: '默认封面',
            type: 0,
            dynamic: false,
            light: false,
        }, {
            id: 'spectrum_cover',
            name: '动感频谱',
            type: 0,
            dynamic: false,
            light: false,
        }, {
            id: 'dynamic_pyramid',
            name: '波光嶙嶙',
            type: 0,
            dynamic: true,
            light: false,
        }, {
            id: 'dynamic_zoom',
            name: '时空穿梭',
            type: 0,
            dynamic: true,
            light: false,
        }, {
            id: 'dynamic_purple',
            name: '紫色心情',
            type: 0,
            dynamic: true,
            light: true,
        }/*, {
            id: 'dynamic_sky',
            name: '浩瀚星空',
            light: false,
        }*/],
        playingViewCustomThemes: [],
        customPlayingThemeEditViewShow: false,
        playingViewThemeIndex: 0,
        playingViewThemeType: 0, // 0 => 预设， 1 => 自定义
        isPlayingViewCustomThemePreview: false,
        playingViewCustomThemePreviewCache: null,
        workingCustomPlayingTheme: null, //当前工作区的自定义播放样式，即正在编辑的播放样式
        videoPlayingViewShow: false,
        soundEffectViewShow: false,
        customThemeEditViewShow: false,
        workingCustomTheme: null, //当前工作区的自定义主题，即正在编辑的主题
        customAppBorderRadiusViewShow: false,
        //探索模式，歌单、歌手
        exploreModes: ['playlists', 'artists', 'radios', 'userhome', 'cloudstorage'],
        exploreModeIndex: 0,
        //defaultExploreModeActiveStates: [true, true, true, false, true],
        exploreModeActiveStates: [true, true, true, false, true],
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
        spectrumIndex: 1,
        spectrumParams: null,
        exVisualCanvasShow: false,
        exVisualCanvasIndex: 0,
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
        colorPickerToolbarTitle: '颜色设置',
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
        miniNavBarMode: false,
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
        isCloudStorageMode() {
            return this.exploreModeIndex == 4
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
                if(exploreMode == 'userhome') return false

                const { activePlatforms } = usePlatformStore()
                const platforms =  activePlatforms(exploreMode)
                return platforms && platforms.length > 0
            }
        },
        isArtistModeEnable() {
            return this.isExploreModeEnable('artists')
        },
        isRadioModeEnable() {
            return this.isExploreModeEnable('radios')
        },
        isCloudStorageModeEnable() {
            return this.isExploreModeEnable('cloudstorage')
        },
        isMiniNavBarMode() {
            return this.miniNavBarMode
        },
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
            if (!this.playlistCategoryViewShow) resetPlaylistCategoryScroll()
        },
        hidePlaylistCategoryView() {
            this.playlistCategoryViewShow = false
            resetPlaylistCategoryScroll()
        },
        toggleArtistCategoryView() {
            this.artistCategoryViewShow = !this.artistCategoryViewShow
            if (!this.artistCategoryViewShow) resetArtistCategoryScroll()
        },
        hideArtistCategoryView() {
            this.artistCategoryViewShow = false
            resetArtistCategoryScroll()
        },
        toggleRadioCategoryView() {
            this.radioCategoryViewShow = !this.radioCategoryViewShow
            if (!this.radioCategoryViewShow) resetRadioCategoryScroll()
        },
        hideRadioCategoryView() {
            this.radioCategoryViewShow = false
            resetRadioCategoryScroll()
        },
        toggleTagsCategoryView() {
            this.tagsCategoryViewShow = !this.tagsCategoryViewShow
            if (!this.tagsCategoryViewShow) resetTagsCategoryScroll()
        },
        hideTagsCategoryView() {
            this.tagsCategoryViewShow = false
            resetTagsCategoryScroll()
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
        showPlayingThemeListView() {
            this.playingThemeListViewShow = true
        },
        hidePlayingThemeListView() {
            this.playingThemeListViewShow = false
        },
        togglePlayingThemeListView() {
            this.playingThemeListViewShow = !this.playingThemeListViewShow
            this.hidePlaybackQueueView()
        },
        showCustomPlayingThemeEditView(customPlayingTheme) {
            this.customPlayingThemeEditViewShow = true
            this.workingCustomPlayingTheme = customPlayingTheme
        },
        hideCustomPlayingThemeEditView() {
            this.customPlayingThemeEditViewShow = false
            this.workingCustomPlayingTheme = null
        },
        toggleCustomPlayingThemeEditView() {
            this.customPlayingThemeEditViewShow = !this.customPlayingThemeEditViewShow
            if(!this.customPlayingThemeEditViewShow) {
                this.workingCustomPlayingTheme = null
            }
        },
        setPlayingViewCustomThemePreview(value) {
            this.isPlayingViewCustomThemePreview = value
        },
        setPlayingViewCustomThemePreviewCache(value) {
            this.playingViewCustomThemePreviewCache = value
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
            ipcRendererSend('app-quit')
        },
        minimize(isToTray) {
            ipcRendererSend('app-min', isToTray)
        },
        maximize() {
            this.toggleMaxScreen()
            ipcRendererSend('app-max')
        },
        normalize() {
            ipcRendererSend('app-normalize')
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
                if (this.isExploreModeEnable(this.exploreModes[index])) {
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
            this.exploreModeActiveStates = this.defaultExploreModeActiveStates
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
        setCloudStorageExploreMode() {
            this.setExploreMode(4)
        },
        setupCommonNotification(text, type) {
            //没有内容就不显示
            const hasText = (text && text.toString().trim().length > 1) 
            if(hasText) {
                this.commonNotificationText = text
                this.commonNotificationType = type || 0
                this.commonNotificationShow = hasText
            } else {
                this.commonNotificationShow = hasText
                this.commonNotificationType = type || 0
                this.commonNotificationText = text
            }
            return hasText
        },
        hideCommonNotification() {
            this.commonNotificationImportant = false
            this.setupCommonNotification(null, -1)
        },
        doToast(text, type, callback, delay) {
            clearTimeout(toastTimer)
            if(!this.setupCommonNotification(text, type)) return
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
        hideAllCtxMenus(clearCache) {
            clearCache = (clearCache === undefined) ? true : clearCache
            this.hideCommonCtxMenu(clearCache)
            this.hideAddToListSubmenu()
            this.hideArtistListSubmenu()
        },
        setExitToHomeBtnVisible(value) {
            this.exitToHomeBtnShow = value
        },
        switchPlayingViewTheme() {
            this.playingViewThemeIndex = (this.playingViewThemeIndex + 1) % 5
            this.hideSoundEffectView()
        },
        setPlayingViewThemeIndex(index, type) {
            this.playingViewThemeIndex = index
            this.playingViewThemeType = type || 0
            this.hideSoundEffectView()
        },
        switchSpectrumIndex() {
            this.setSpectrumIndex(this.spectrumIndex + 1)
        },
        setSpectrumIndex(value) {
            this.spectrumIndex = value
        },
        setSpectrumParams(params) {
            this.spectrumParams = params
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
            if(!this.colorPickerToolbarShow) {
                this.colorPickerToolbarTitle = null
            }
        },
        hideColorPickerToolbar() {
            this.colorPickerToolbarShow = false
            this.colorPickerToolbarTitle = null
        },
        showColorPickerToolbar(title) {
            this.colorPickerToolbarShow = true
            this.colorPickerToolbarTitle = title || '颜色设置'
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
            !noSend && ipcRendererSend('app-desktopLyric-toggle')
        },
        setDesktopLyricCtxData(value) {
            this.desktopLyricCtxData = value
        },
        setPendingPlay(value) {
            this.pendingPlay = value
        },
        setPendingPlayPercent(value) {
            this.pendingPlayPercent = value
        },
        toggleExVisualCanvasShow() {
            this.exVisualCanvasShow = !this.exVisualCanvasShow
        },
        setExVisualCanvasIndex(index) {
            this.exVisualCanvasIndex = index
        },
        savePlayingViewCustomTheme(theme) {
            if (!theme) return
            let index = -1
            //强制属性，避免被窜改
            Object.assign(theme, { type: 1, dynamic: true })
            if (theme.id) {
                if (!theme.id.startsWith(playingViewCustomThemePrefix)) return
                index = this.playingViewCustomThemes.findIndex(item => item.id == theme.id)
            }
            if (index < 0) {
                const id = playingViewCustomThemePrefix + randomTextWithinAlphabetNums(8)
                Object.assign(theme, { id })
                this.playingViewCustomThemes.push(theme)
            } else {
                const _theme = this.playingViewCustomThemes[index]
                Object.assign(_theme, { ...theme })
            }
            return true
        },
        removePlayingViewCustomTheme({ id }) {
            if (!id || !id.startsWith(playingViewCustomThemePrefix)) return
            const index = this.playingViewCustomThemes.findIndex(item => item.id === id)
            if (index > -1) this.playingViewCustomThemes.splice(index, 1)
        },
        isCurrentPlayingTheme(theme) {
            const { id } = theme
            if (!id || !id.startsWith(playingViewCustomThemePrefix)) return
            const index = this.playingViewCustomThemes.findIndex(item => item.id === id)
            if(index < 0) return false
            return this.playingViewThemeType == 1 
                && this.playingViewThemeIndex == index
        },
        toggleCustomAppBorderRadiusViewShow() {
            this.customAppBorderRadiusViewShow = !this.customAppBorderRadiusViewShow
        },
        hideCustomAppBorderRadiusView() {
            this.customAppBorderRadiusViewShow = false
        },
        toggleMiniNavBarMode() {
            this.miniNavBarMode = !this.miniNavBarMode
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
                    'pendingPlay', 'pendingPlayPercent',
                    'exVisualCanvasShow', 'exVisualCanvasIndex', 
                    'playingViewCustomThemes', 'playingViewThemeType',
                    'miniNavBarMode' ]
            },
        ],
    },
})