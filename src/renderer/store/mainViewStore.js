import { defineStore } from "pinia";
import EventBus from '../../common/EventBus';

const ipcRenderer = electronApi.ipcRenderer

export const useMainViewStore = defineStore('mainView', {
    state: () => ({
        coverMaskShow: false,
        categoryViewShow: false,
        playbackQueueViewShow: false,
        playingViewShow: false
    }),
    actions: {
        hidePlaybackQueueView() {
            this.playbackQueueViewShow = false
        },
        togglePlaybackQueueView() {
            this.playbackQueueViewShow = !this.playbackQueueViewShow
        },
        toggleCategoryView() {
            this.categoryViewShow = !this.categoryViewShow
            if(!this.categoryViewShow) {
                EventBus.emit("category-resetScroll")
            }
        },
        hideCategoryView() {
            this.categoryViewShow = false
            EventBus.emit("category-resetScroll")
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
        }
    }
})