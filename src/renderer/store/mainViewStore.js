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
        exploreModes: [ 'playlists', 'artists' ], 
        exploreModeIndex: 0, 
    }),
    getters: {
        isPlaylistMode() {
            return this.exploreModeIndex == 0
        },
        isArtistMode() {
            return this.exploreModeIndex == 1
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
            ipcRenderer.send('hide-winBtn')
        },
        hidePlayingView() {
            this.playingViewShow = false
            ipcRenderer.send('show-winBtn')
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
            if(index != 0 && index != 1) index = 0
            this.exploreModeIndex = index
        },
        setArtistExploreMode(mode) {
            this.setExploreMode(1)
        }
    }
})