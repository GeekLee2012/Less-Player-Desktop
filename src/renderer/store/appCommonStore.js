import { defineStore } from "pinia";
import EventBus from '../../common/EventBus';
import { useIpcRenderer } from "../../common/Utils";

const ipcRenderer = useIpcRenderer()

export const useAppCommonStore = defineStore('appCommon', {
    state: () => ({
        coverMaskShow: false,
        playlistCategoryViewShow: false,
        artistCategoryViewShow: false,
        radioCategoryViewShow: false,
        playbackQueueViewShow: false,
        playingViewShow: false,
        videoPlayingViewShow: false,
        audioEffectViewShow: false,
        //探索模式，歌单、歌手
        exploreModes: [ 'playlists', 'artists', 'radios', 'userhome' ], 
        exploreModeIndex: 0, 
        //播放状态通知
        playNotificationShow: false,
        //通用通知
        commonNotificationShow: false,
        commonNotificationText: null,
        commonNotificationType: 0, //类型，0 - 普通成功消息，1-失败消息
        //通用上下文菜单
        commonCtxMenuShow: false,
        commonCtxMenuData: [],
        commonCtxItem: {},  //菜单的上下文对象，用于公共参数传递
        commonCtxMenuCacheItem: {}, //菜单缓存对象，与具体点击的菜单项相关
        commonCtxMenuSeparatorNums: 0,
        addToListSubmenuShow: false,
        artistListSubmenuShow: false,
        exitToHomeBtnShow: false,
        playingViewThemeIndex: 0,
        spectrumIndex: 0,
        //歌词设置
        lyricToolbarShow: false,
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
        }
    },
    actions: {
        hidePlaybackQueueView() {
            this.playbackQueueViewShow = false
        },
        togglePlaybackQueueView() {
            this.playbackQueueViewShow = !this.playbackQueueViewShow
        },
        togglePlaylistCategoryView() {
            this.playlistCategoryViewShow = !this.playlistCategoryViewShow
            if(!this.playlistCategoryViewShow) {
                EventBus.emit("playlistCategory-resetScroll")
            }
        },
        hidePlaylistCategoryView() {
            this.playlistCategoryViewShow = false
            EventBus.emit("playlistCategory-resetScroll")
        },
        toggleArtistCategoryView() {
            this.artistCategoryViewShow = !this.artistCategoryViewShow
            if(!this.artistCategoryViewShow) {
                EventBus.emit("artistCategory-resetScroll")
            }
        },
        hideArtistCategoryView() {
            this.artistCategoryViewShow = false
            EventBus.emit("artistCategory-resetScroll")
        },
        toggleRadioCategoryView() {
            this.radioCategoryViewShow = !this.radioCategoryViewShow
            if(!this.radioCategoryViewShow) {
                EventBus.emit("radioCategory-resetScroll")
            }
        },
        hideRadioCategoryView() {
            this.radioCategoryViewShow = false
            EventBus.emit("radioCategory-resetScroll")
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
        hideAudioEffectView() {
            this.audioEffectViewShow = false
        },
        toggleAudioEffectView() {
            this.audioEffectViewShow = !this.audioEffectViewShow
        },
        toggleCoverMask() {
            this.coverMaskShow = !this.coverMaskShow
        },
        quit() {
            if(ipcRenderer) ipcRenderer.send('app-quit')
        },
        minimize() {
            if(ipcRenderer) ipcRenderer.send('app-min')
        },
        maximize() {
            if(ipcRenderer) ipcRenderer.send('app-max')
        },
        setExploreMode(index) {
            if(!index || index < 0) index = 0
            this.exploreModeIndex = index % this.exploreModeLength
        },
        nextExploreMode() {
            const length = this.exploreModeLength
            if(this.exploreModeIndex == length - 2) {
                this.setExploreMode(0)
            } else {
                this.setExploreMode(this.exploreModeIndex + 1)
            }
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
        showPlayNotification() {
            this.playNotificationShow = true
        },
        hidePlayNotification() {
            this.playNotificationShow = false
        },
        showCommonNotification(text) {
            this.commonNotificationShow = true
            this.commonNotificationText = text || "操作成功！"
        },
        setCommonNotificationType(type) {
            this.commonNotificationType = type || 0
        },
        hideCommonNotification() {
            this.commonNotificationShow = false
            this.commonNotificationText = null
            this.commonNotificationType = null
        },
        showToast(text, callback, delay) {
            text = text || "操作成功！"
            this.setCommonNotificationType(this.commonNotificationType)
            EventBus.emit("toast", { text, callback, delay })
        },
        showFailToast(text, callback, delay) {
            this.setCommonNotificationType(1)
            this.showToast((text || "操作失败！"), callback, delay)
        },
        updateCommonCtxItem(value) {
            this.commonCtxItem = value
        },
        updateCommonCtxMenuCacheItem(value) {
            this.commonCtxMenuCacheItem = value
        },
        showCommonCtxMenu(value) {
            this.commonCtxMenuShow = true
            this.updateCommonCtxMenuCacheItem(value)
        }, 
        hideCommonCtxMenu(clearCache) {
            this.commonCtxMenuShow = false
            if(clearCache) this.updateCommonCtxMenuCacheItem(null)
        },
        setCommonCtxMenuData(data) {
            this.commonCtxMenuData.length = 0
            if(data) {
                let spCnt = 0
                data.forEach(item => {
                    this.commonCtxMenuData.push(item)
                    if(item.separator) ++spCnt
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
        },
        hideAllCtxMenus() {
            this.hideCommonCtxMenu()
            this.hideAddToListSubmenu()
            this.hideArtistListSubmenu()
        },
        setExitToHomeBtnVisible(value) {
            this.exitToHomeBtnShow = value
        },
        switchPlayingViewTheme() {
            this.playingViewThemeIndex = (this.playingViewThemeIndex + 1) % 2
            this.hideAudioEffectView()
        }
        ,
        switchSpectrumIndex() {
            this.spectrumIndex = (this.spectrumIndex + 1) % 2
        },
        hideLyricToolbar() {
            this.lyricToolbarShow = false
        },
        toggleLyricToolbar() {
            this.lyricToolbarShow = !this.lyricToolbarShow
        }
    },
    persist: {
        enabled: true,
        strategies: [
            {
                //key: 'appCommon',
                storage: localStorage,
                paths: [ 'playingViewThemeIndex', 'spectrumIndex' ]
            },
        ],
    },
})