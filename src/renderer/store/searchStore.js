import { defineStore } from "pinia";
import { usePlatformStore } from "./platformStore";


export const useSearchStore = defineStore('search', {
    state: () => ({
        keyword: '',
        currentPlatformIndex: 0,
        tabs: [],
        activeTab: -1,
        _activeTabCode: null,
        tabTipText: '',
        foundSongs: [],
        foundPlaylists: [],
        foundAlbums: [],
        foundArtists: [],
        foundVideos: []
    }),
    getters: {
        platforms() {
            const { activePlatforms } = usePlatformStore()
            return activePlatforms('search')
        },
        activeTabCode(state) {
            if(this._activeTabCode) return this._activeTabCode
            return this.activeTab < 0 ? '' : this.tabs[this.activeTab].code
        },
    },
    actions: {
        setKeyword(keyword) {
            this.keyword = keyword
        },
        setActiveTab(index, code) {
            this.activeTab = index
            this._activeTabCode = code
        },
        setCurrentPlatformIndex(index) {
            this.currentPlatformIndex = index
        },
        resetAll() {
            this.keyword = ''
            this.foundSongs.length = 0
            this.foundPlaylists.length = 0
            this.foundAlbums.length = 0
            this.foundArtists.length = 0
            this.foundVideos.length = 0
        },
        updateTabTipText(length) {
            const index = this.activeTab
            this.tabTipText = index < 0 ? '' : (this.tabs[index].stext || this.tabs[index].text).replace('0', length)
        },
        currentPlatform() {
            const index = this.currentPlatformIndex
            return this.platforms[index].code
        },
        currentVender() {
            const { getVendor } = usePlatformStore()
            const platform = this.currentPlatform()
            return getVendor(platform)
        },
        resetSearch() {
            this.setActiveTab(0)
            this.resetAll()
        },
        updateTabs() {
            const code = this.currentPlatform()
            const { getSearchTabs } = usePlatformStore()
            const tabs = getSearchTabs(code)
            this.tabs.length = 0
            if(tabs && tabs.length > 0) this.tabs.push(...tabs)
        },
        getTabIndex(code) {
            return this.tabs.findIndex(tab => (tab.code == code))
        }
    }
})