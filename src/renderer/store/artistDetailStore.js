import { defineStore } from "pinia";
import { usePlatformStore } from "./platformStore";



//TODO 古早版本，大部分逻辑都写在store里啦
export const useArtistDetailStore = defineStore('artistDetail', {
    state: () => ({
        artistId: '',
        platform: '',
        artistName: '未知歌手',
        artistAlias: '',
        artistCover: '',
        hotSongs: [],
        allSongs: [],
        albums: [],
        about: '',
        activeTab: -1,
        tabTipText: '',
        tabs: [],
    }),
    getters: {
        activeTabCode() {
            if (this.activeTab < 0) return ''
            return this.tabs[this.activeTab].code
        },
        hasHotSongsTab() {
            return this.tabs.findIndex(tab => (tab.code === 'hot-songs')) > -1
        },
        hasAllSongsTab() {
            return this.tabs.findIndex(tab => (tab.code === 'all-songs')) > -1
        },
    },
    actions: {
        setActiveTab(index) {
            //TODO 边界检查
            this.activeTab = index
        },
        resetHotSongs() {
            this.hotSongs.length = 0
        },
        resetAllSongs() {
            this.allSongs.length = 0
        },
        resetAlbums() {
            this.albums.length = 0
        },
        resetAbout() {
            this.about = ''
        },
        resetArtistDetail() {
            this.updateArtist('未知歌手', '', '')
        },
        resetAll() {
            this.resetArtistDetail()
            this.resetHotSongs()
            this.resetAllSongs()
            this.resetAlbums()
            this.resetAbout()
            this.setActiveTab(0)
            this.updateTabTipText(0)
        },
        updateArtistDetailKeys(platform, id) {
            this.artistId = id
            this.platform = platform
            //this.resetArtistDetail()
            this.updateTabs()
        },
        updateArtist(title, cover, alias) {
            this.artistName = title
            this.artistCover = cover
            this.artistAlias = alias ? alias : ''
        },
        updateHotSongs(tracks) {
            this.resetHotSongs()
            this.hotSongs.push(...tracks)
        },
        updateAllSongs(tracks) {
            this.resetAllSongs()
            this.appendAllSongs(tracks)
        },
        appendAllSongs(tracks) {
            this.allSongs.push(...tracks)
        },
        updateAlbums(albums) {
            this.resetAlbums()
            this.albums.push(...albums)
        },
        updateAbout(about) {
            this.resetAbout()
            this.about = about
        },
        isArtistDetailLoaded() {
            if (!this.artistId) return false
            if (!this.artistName) return false
            if (this.artistId.length < 1) return false

            this.artistName = this.artistName.trim()
            if (this.artistName.length < 1) return false
            if (this.artistName == '未知歌手') return false
            return true
        },
        isHotSongsTabLoaded() {
            return this.hotSongs.length > 0
        },
        isAllSongsTabLoaded() {
            return this.allSongs.length > 0
        },
        isAlbumsTabLoaded() {
            return this.albums.length > 0
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
            const { getArtistTabs } = usePlatformStore()
            const tabs = getArtistTabs(this.platform)
            this.tabs.length = 0
            if(tabs && tabs.length > 0) this.tabs.push(...tabs)
        },
    }
})