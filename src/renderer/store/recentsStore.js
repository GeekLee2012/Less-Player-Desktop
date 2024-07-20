import { defineStore } from "pinia";
import { trimArray } from "../../common/Utils";
import { Playlist } from "../../common/Playlist";
import { usePlatformStore } from "./platformStore";
import { refreshUserHome } from "./userProfileStore";



const filterByPlatform = (state, platform) => {
    if (!platform || platform.trim() == 'all') {
        return state
    }
    return state.filter(item => (item.platform == platform.trim()))
}

export const useRecentsStore = defineStore('recents', {
    state: () => ({
        recents: {
            playlists: [],
            albums: [],
            songs: [],
            radios: [],
        }
    }),
    getters: {
        getRecentSongs() {
            return (platform) => filterByPlatform(this.recents.songs, platform)
        },
        getRecentPlaylilsts() {
            return (platform) => filterByPlatform(this.recents.playlists, platform)
        },
        getRecentAlbums() {
            return (platform) => filterByPlatform(this.recents.albums, platform)
        },
        getRecentRadios() {
            return (platform) => filterByPlatform(this.recents.radios, platform)
        },
    },
    actions: {
        //TODO state合法性待校验
        findItemIndex(state, item, compareFn) {
            if (!state) return -1
            if (!item) return -1
            return state.findIndex(e => {
                return compareFn ? compareFn(item, e) :
                    (item.id && e.id
                        && (item.id + '') === (e.id + '')
                        && item.platform == e.platform)
            })
        },
        addItem(state, item, compareFn) {
            if (!state) return
            const index = this.findItemIndex(state, item, compareFn)
            if (index != -1) return false
            const created = Date.now()
            const updated = created
            Object.assign(item, { created, updated })
            state.push(item)
            refreshUserHome()
            return true
        },
        insertFirst(state, item, compareFn) {
            if (!state) return
            const index = this.findItemIndex(state, item, compareFn)
            if (index != -1) return false
            const created = Date.now()
            const updated = created
            Object.assign(item, { created, updated })
            state.splice(0, 0, item)
            refreshUserHome()
            return true
        },
        removeItem(state, item, compareFn) {
            if (!state) return
            if (!item) return
            const index = this.findItemIndex(state, item, compareFn)
            if (index != -1) {
                state.splice(index, 1)
                refreshUserHome()
            }

        },
        removeItems(state, item, compareFn) {
            if (!state) return
            if (!item) return
            let index = - 1, count = 0
            while (true) {
                index = this.findItemIndex(state, item, compareFn)
                if (index == -1 || count > 10) break
                state.splice(index, 1)
                ++count
            }
            if (count) refreshUserHome()
        },
        uniqueInsertFirst(state, item, compareFn) {
            this.removeItems(state, item, compareFn)
            this.insertFirst(state, item, compareFn)
        },
        //最近播放
        addRecentSong(track) {
            const { id, platform, title, artist, album, duration, cover,
                type, pid, songlistId, extra1, extra2, mv,
                payPlay, payDownload, songID, strMediaMid, hash, extraHash,  
            } = track
            if (!platform || platform.trim().length < 1) return
            //TODO
            const url = Playlist.isAnchorRadioType(track) ? track.url : null
            this.uniqueInsertFirst(this.recents.songs, {
                id, platform, title, artist, album, duration, cover, url,
                type, pid, songlistId, extra1, extra2, mv, 
                payPlay, payDownload, songID, strMediaMid, hash, extraHash, 
            })
            trimArray(this.recents.songs, 999).then(deleteCount => {
                if (deleteCount) refreshUserHome()
            })
        },
        addRecentPlaylist(id, platform, title, cover, type) {
            this.uniqueInsertFirst(this.recents.playlists, {
                id, platform, title, cover, type
            })
            trimArray(this.recents.playlists, 666).then(deleteCount => {
                if (deleteCount) refreshUserHome()
            })
        },
        addRecentAlbum(id, platform, title, cover, publishTime) {
            this.uniqueInsertFirst(this.recents.albums, {
                id, platform, title, cover, publishTime
            })
            trimArray(this.recents.albums, 666).then(deleteCount => {
                if (deleteCount) refreshUserHome()
            })
        },
        addRecentRadio(track) {
            const { id, platform, title, cover, type, } = track
            const { isFreeFM } = usePlatformStore()
            const compareFn = (item, e) => {
                if (item.data && item.data.length > 0
                    && e.data && e.data.length > 0) {
                    return item.data[0].url === e.data[0].url
                }
                return false
            }
            this.uniqueInsertFirst(this.recents.radios, {
                id, platform, title, cover, type, data: [track]
            }, isFreeFM(platform) ? compareFn : null)
            trimArray(this.recents.radios, 366).then(count => {
                if (count) refreshUserHome()
            })
        },
        removeRecentSong(track) {
            const { id, platform } = track
            this.removeItem(this.recents.songs, { id, platform })
        },
        removeRecentPlaylist(playlist) {
            const { id, platform } = playlist
            this.removeItem(this.recents.playlists, { id, platform })
        },
        removeRecentAlbum(album) {
            const { id, platform } = album
            this.removeItem(this.recents.albums, { id, platform })
        },
        removeRecentRadio(track) {
            const { id, platform } = track
            this.removeItem(this.recents.radios, { id, platform })
        },
        removeAllRecents() {
            this.recents.songs.length = 0
            this.recents.playlists.length = 0
            this.recents.albums.length = 0
            this.recents.radios.length = 0
            refreshUserHome()
        },
    },
    persist: {
        enabled: true,
        strategies: [
            {
                storage: localStorage,
            },
        ],
    }
})