import { defineStore } from "pinia";
import EventBus from '../../common/EventBus';

const ipcRenderer = electronAPI.ipcRenderer

export const useMainViewStore = defineStore('mainView', {
    state: () => ({
        coverMaskShow: false,
        playlistCategoryViewShow: false,
        artistCategoryViewShow: false,
        playbackQueueViewShow: false,
        playingViewShow: false,
        //探索模式，歌单、歌手
        exploreModes: [ 'playlists', 'artists', 'userhome' ], 
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
    }),
    getters: {
        isPlaylistMode() {
            return this.exploreModeIndex == 0
        },
        isArtistMode() {
            return this.exploreModeIndex == 1
        },
        isUserHomeMode() {
            return this.exploreModeIndex == 2
        },
        exploreModeCode() {
            return this.exploreModes[this.exploreModeIndex]
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
        showPlayingView() {
            this.playingViewShow = true
        },
        hidePlayingView() {
            this.playingViewShow = false
        },
        toggleCoverMask() {
            this.coverMaskShow = !this.coverMaskShow
        },
        quit() {
            ipcRenderer.send('app-quit')
        },
        minimize() {
            ipcRenderer.send('app-min')
        },
        maximize() {
            ipcRenderer.send('app-max')
        },
        setExploreMode(index) {
            if(!index || index < 0  || index > 2) index = 0
            this.exploreModeIndex = index
        },
        setArtistExploreMode() {
            this.setExploreMode(1)
        },
        setUserExploreMode() {
            this.setExploreMode(2)
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
            this.commonNotificationType = 0
        },
        showToast(text, callback, delay) {
            text = text || "操作成功！"
            EventBus.emit("toast", { text, callback, delay })
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
        hideAllCtxMenus() {
            this.hideCommonCtxMenu()
            this.hideAddToListSubmenu()
            this.hideArtistListSubmenu()
        }
    }
})