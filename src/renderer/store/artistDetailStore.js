import { defineStore } from "pinia";
import { usePlatformStore } from "./platformStore";



const TAB_LIST = [{
    code: 'hot-songs',
    name: '热门歌曲',
    text: '共0首歌曲'
},
{
    code: 'all-songs',
    name: '歌曲',
    text: '共0首歌曲'
},
{
    code: 'albums',
    name: '专辑',
    text: '共0张专辑'
},
{
    code: 'about',
    name: '歌手详情',
    text: ''
}]

export const useArtistDetailStore = defineStore('artistDetail', {
    state: () => ({
        artistId: '',
        platform: '',
        artistName: '未知歌手',
        artistAlias: '',
        artistCover: 'default_cover.png',
        hotSongs: [],
        allSongs: [],
        albums: [],
        about: '',
        activeTab: -1,
        tabTipText: '',
        tabs: TAB_LIST,
        hasHotSongTab: true,
        hasAllSongTab: true
    }),
    getters: {
        activeTabCode() {
            if (this.activeTab < 0) return ''
            return this.tabs[this.activeTab].code
        }
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
            this.updateArtist('未知歌手', 'default_cover.png', '')
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
        setupSongTabs(hasHotSongs, hasAllSongs) {
            this.hasHotSongTab = hasHotSongs
            this.hasAllSongTab = hasAllSongs
        },
        updateTabs() {
            const { isQQ, isNetEase, isKuWo, isKuGou, isDouBan } = usePlatformStore()
            if (isQQ(this.platform)
                || isNetEase(this.platform)) {
                this.tabs = [TAB_LIST[0], TAB_LIST[2], TAB_LIST[3]]
                this.setupSongTabs(true, false)
            } else if (isKuWo(this.platform)
                || isKuGou(this.platform)) {
                this.tabs = [TAB_LIST[1], TAB_LIST[2], TAB_LIST[3]]
                this.setupSongTabs(false, true)
            } else if (isDouBan(this.platform)) {
                this.tabs = [TAB_LIST[1], TAB_LIST[3]]
                this.setupSongTabs(false, true)
            } else {
                this.tabs = TAB_LIST
                this.setupSongTabs(true, true)
            }
        },
        isHotSongsTab() {
            return this.activeTabCode == 'hot-songs'
        },
        isAllSongsTab() {
            return this.activeTabCode == 'all-songs'
        },
        isAlbumsTab() {
            return this.activeTabCode == 'albums'
        },
        isAboutTab() {
            return this.activeTabCode == 'about'
        }
    }
})