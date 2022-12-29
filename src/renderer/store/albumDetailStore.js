import { defineStore } from "pinia";



const TAB_LIST = [
    {
        code: 'all-songs',
        name: '歌曲',
        text: '共0首歌曲'
    },
    {
        code: 'about',
        name: '专辑详情',
        text: ''
    }]

export const useAlbumDetailStore = defineStore('albumDetail', {
    state: () => ({
        albumId: '',
        platform: '',
        albumName: '山川湖海，日月星辰',
        albumCover: 'default_cover.png',
        artistName: '未知歌手',
        company: '',
        publishTime: '',
        allSongs: [],
        about: '',
        activeTab: -1,
        tabTipText: '',
        tabs: TAB_LIST
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
            this.updateAlbum('山川湖海，日月星辰', 'default_cover.png', '未知歌手', '', '')
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
        updateAbout(about) {
            this.resetAbout()
            this.about = about
        },
        isAlbumDetailLoaded() {
            return this.albumName != '山川湖海，日月星辰'
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
        isAllSongsTab() {
            return this.activeTabCode == 'all-songs'
        },
        isAboutTab() {
            return this.activeTabCode == 'about'
        }
    }
})