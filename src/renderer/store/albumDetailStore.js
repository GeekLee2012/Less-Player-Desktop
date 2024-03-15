import { defineStore } from "pinia";
import { usePlatformStore } from "./platformStore";



//TODO 古早版本，大部分逻辑都写在store里啦
export const useAlbumDetailStore = defineStore('albumDetail', {
    state: () => ({
        albumId: '',
        platform: '',
        albumName: '未知专辑',
        albumCover: '',
        artistName: '未知歌手',
        company: '',
        publishTime: '',
        allSongs: [],
        about: '',
        activeTab: -1,
        tabTipText: '',
        tabs: []
    }),
    getters: {
        activeTabCode(state) {
            if (state.activeTab < 0) return ''
            return state.tabs[state.activeTab].code
        }
    },
    actions: {
        setActiveTab(index) {
            //TODO 边界检查
            this.activeTab = index
        },
        resetAllSongs() {
            this.allSongs.length = 0
        },
        resetAbout() {
            this.about = ''
        },
        resetAlbumDetail() {
            this.updateAlbum('未知专辑', '', '未知歌手', '', '')
        },
        resetAll() {
            this.resetAlbumDetail()
            this.resetAllSongs()
            this.resetAbout()
            this.setActiveTab(-1)
            this.updateTabTipText(0)
        },
        updateAlbumDetailKeys(platform, id) {
            this.platform = platform
            this.albumId = id
            //this.resetAlbumDetail()
            if(this.tabs.length < 1) this.updateTabs()
        },
        updateAlbum(title, cover, artistName, company, publishTime) {
            this.albumName = title
            this.albumCover = cover
            this.artistName = artistName
            this.company = company
            this.publishTime = publishTime
        },
        updateAllSongs(tracks) {
            this.resetAllSongs()
            this.allSongs.push(...tracks)
        },
        updateCover(cover) {
            this.albumCover = cover
        },
        updateArtistName(artistName) {
            this.artistName = artistName
        },
        updatePublishTime(publishTime) {
            this.publishTime = publishTime
        },
        updateAbout(about) {
            //this.resetAbout()
            this.about = about
        },
        isAlbumDetailLoaded() {
            return this.albumName != '未知专辑'
                && this.artistName != '未知歌手'
        },
        isAllSongsTabLoaded() {
            return this.allSongs.length > 0
        },
        isAboutTabLoaded() {
            return this.about.trim().length > 0
        },
        updateTabTipText(length) {
            if (this.activeTab < 0) {
                this.tabTipText = ''
            } else {
                this.tabTipText = this.tabs[this.activeTab].text.replace('0', length)
            }
        },
        updateTabs() {
            const { getAlbumTabs } = usePlatformStore()
            const tabs = getAlbumTabs(this.platform)
            this.tabs.length = 0
            if(tabs && tabs.length > 0) this.tabs.push(...tabs)
        },
    }
})