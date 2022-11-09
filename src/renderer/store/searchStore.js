import { defineStore } from "pinia";
import { usePlatformStore } from "./platformStore";

const ALL_TABS = [ {
        code: 'songs',
        name: '歌曲',
        text: '约找到0首歌曲'
    }, {
        code: 'playlists',
        name: '歌单',
        text: '约找到0个歌单'
    }, {
        code: 'albums',
        name: '专辑',
        text: '约找到0张专辑'
    }, {
        code: 'artists',
        name: '歌手',
        text: '约找到0个歌手'
    }
]

export const useSearchStore = defineStore('search', {
    state: () => ({
        keyword: '',
        currentPlatformIndex: 1,
        tabs: ALL_TABS,
        activeTab: -1,
        tabTipText: '',
        foundSongs: [],
        foundPlaylists: [],
        foundAlbums: [],
        foundArtists: []
    }),
    getters: {
        platforms(state) {
            const { onlinePlatformsFilter } = usePlatformStore()
            return onlinePlatformsFilter.slice(1)
        },
        activeTabCode(state) {
            if(this.activeTab < 0) return ''
            return this.tabs[this.activeTab].code
        }
    },
    actions: {
        setKeyword(keyword) {
            this.keyword = keyword
        },
        setActiveTab(index) {
            this.activeTab = index
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
        },
        updateTabTipText(length) {
            const index = this.activeTab
            if(index < 0) {
                this.tabTipText = ''
            } else {
                this.tabTipText = this.tabs[index].text.replace('0', length)
            }
        },
        currentVender() {
            const { getVendor } = usePlatformStore()
            const index = this.currentPlatformIndex
            const platform = this.platforms[index].code
            return getVendor(platform)
        },
        isSongsTab() {
            return this.activeTabCode == 'songs'
        },
        isPlaylistsTab() {
            return this.activeTabCode == 'playlists'
        },
        isAlbumsTab() {
            return this.activeTabCode == 'albums'
        },
        isArtistsTab() {
            return this.activeTabCode == 'artists'
        },
        resetSearch() {
            this.setActiveTab(0)
            this.resetAll()
        }
    }
})