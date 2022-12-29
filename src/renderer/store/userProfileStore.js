import { defineStore } from "pinia";
import EventBus from "../../common/EventBus";
import { randomTextWithinAlphabetNums } from "../../common/Utils";
import { Playlist } from "../../common/Playlist";



const filterByPlatform = (state, platform) => {
    if (!platform || platform.trim() == 'all') {
        return state
    }
    return state.filter(item => (item.platform == platform.trim()))
}

export const useUserProfileStore = defineStore("userProfile", {
    state: () => ({
        user: {
            id: 0,
            nickname: "",
            cover: "",
            about: ""
        },
        favorites: {
            playlists: [],
            albums: [],
            songs: [],
            radios: [],
        },
        customPlaylists: [],
        follows: {
            artists: [],
        },
        recents: {
            playlists: [],
            albums: [],
            songs: [],
            radios: [],
        },
        decoration: {
            current: 1001
        },

    }),
    getters: {
        getUserCover() { //Potrait
            return this.user.cover
        },
        getUserNickName() {
            let nickname = this.user.nickname
            if (nickname && nickname.trim().length > 0) {
                return nickname.trim()
            }
            return "我的主页"
        },
        getUserAbout() {
            let about = this.user.about
            if (about && about.trim().length > 0) {
                return about.trim()
            }
            return "这个人很懒，什么也没留下~"
        },
        getFavoriteSongs() {
            return (platform) => filterByPlatform(this.favorites.songs, platform)
        },
        getFavoritePlaylilsts() {
            return (platform) => filterByPlatform(this.favorites.playlists, platform)
        },
        getFavoriteAlbums() {
            return (platform) => filterByPlatform(this.favorites.albums, platform)
        },
        getFavoriteRadios() {
            return (platform) => filterByPlatform(this.favorites.radios, platform)
        },
        getCustomPlaylists() {
            return this.customPlaylists
        },
        getFollowArtists() {
            return (platform) => filterByPlatform(this.follows.artists, platform)
        },
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
        updateUser(nickname, about, cover) {
            Object.assign(this.user, { nickname, about, cover })
        },
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
            this.refreshUserHome()
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
            this.refreshUserHome()
            return true
        },
        removeItem(state, item, compareFn) {
            if (!state) return
            if (!item) return
            const index = this.findItemIndex(state, item, compareFn)
            if (index != -1) state.splice(index, 1)
            this.refreshUserHome()
        },
        uniqueInsertFirst(state, item, compareFn) {
            this.removeItem(state, item, compareFn)
            this.insertFirst(state, item, compareFn)
        },
        //我的收藏
        addFavoritePlaylist(id, platform, title, cover, type) {
            this.addItem(this.favorites.playlists, {
                id, platform, title, cover, type
            })
        },
        addFavoriteAlbum(id, platform, title, cover, publishTime) {
            this.addItem(this.favorites.albums, {
                id, platform, title, cover, publishTime
            })
        },
        addFavoriteTrack(track) {
            const { id, platform, title, artist, album, duration, cover,
                type, pid, songlistId, extra1, extra2, mv,
                payPlay, payDownload } = track
            //TODO
            const url = Playlist.isAnchorRadioType(track) ? track.url : null
            this.addItem(this.favorites.songs, {
                id, platform, title, artist, album, duration, cover, url,
                type, pid, songlistId, extra1, extra2, mv,
                payPlay, payDownload
            })
        },
        addFavoriteRadio(track) {
            const { id, platform, title, cover, artist, url,
                type, pid, songlistId, extra1, extra2 } = track
            this.addItem(this.favorites.radios, {
                id, platform, title, cover, artist, url,
                type, pid, songlistId, extra1, extra2
            })
        },
        removeFavoritePlaylist(id, platform) {
            this.removeItem(this.favorites.playlists, { id, platform })
        },
        removeFavoriteAlbum(id, platform) {
            this.removeItem(this.favorites.albums, { id, platform })
        },
        removeFavoriteSong(id, platform) {
            this.removeItem(this.favorites.songs, { id, platform })
        },
        removeFavoriteRadio(id, platform) {
            this.removeItem(this.favorites.radios, { id, platform })
        },
        isFavoritePlaylist(id, platform) {
            return this.findItemIndex(this.favorites.playlists, { id, platform }) > -1
        },
        isFavoriteAlbum(id, platform) {
            return this.findItemIndex(this.favorites.albums, { id, platform }) > -1
        },
        isFavoriteSong(id, platform) {
            return this.findItemIndex(this.favorites.songs, { id, platform }) > -1
        },
        isFavoriteRadio(id, platform) {
            return this.findItemIndex(this.favorites.radios, { id, platform }) > -1
        },
        removeAllFavorites() {
            this.favorites.songs.length = 0
            this.favorites.playlists.length = 0
            this.favorites.albums.length = 0
            this.favorites.radios.length = 0
            this.refreshUserHome()
        },
        //TODO 清理, 数据量较大时卡住，暂时废弃不用
        cleanUpAllSongs(states) {
            states = states || [this.favorites.songs, this.recents.songs]
            const props = ['url', 'lyric']
            try {
                states.forEach(state => {
                    state.forEach(item => {
                        if (Playlist.isFMRadioType(item)) return
                        props.forEach(p => {
                            Reflect.deleteProperty(item, p)
                        })
                    })
                })
            } catch (error) {
                //TODO
            }
        },
        //自建歌单
        addCustomPlaylist(title, about, cover) {
            const id = Playlist.CUSTOM_ID_PREFIX + randomTextWithinAlphabetNums(12)
            this.addItem(this.customPlaylists, {
                id, title, about, cover, data: []
            }, (e1, e2) => e1.id === e2.id)
        },
        updateCustomPlaylist(id, title, about, cover) {
            if (this.customPlaylists.length < 1) return
            const index = this.findItemIndex(this.customPlaylists, { id },
                (e1, e2) => e1.id === e2.id)
            if (index < 0) return
            const updated = Date.now()
            Object.assign(this.customPlaylists[index], { title, about, cover, updated })
        },
        getCustomPlaylist(id) {
            if (this.customPlaylists.length < 1) return { id }
            const index = this.findItemIndex(this.customPlaylists, { id },
                (e1, e2) => e1.id === e2.id)
            return index < 0 ? { id } : this.customPlaylists[index]
        },
        removeCustomPlaylist(id) {
            this.removeItem(this.customPlaylists, { id }, (e1, e2) => e1.id === e2.id)
        },
        addToCustomPlaylist(id, track) {
            const playlist = this.getCustomPlaylist(id)
            if (!playlist) return false
            const index = this.findItemIndex(playlist.data, track)
            if (index > -1) return false
            playlist.data.push(track)
            const updated = Date.now()
            Object.assign(playlist, { updated })
            return true
        },
        removeTrackFromCustomPlaylist(id, track) {
            const playlist = this.getCustomPlaylist(id)
            if (!playlist) return false
            const index = this.findItemIndex(playlist.data, track)
            if (index < 0) return false
            playlist.data.splice(index, 1)
            const updated = Date.now()
            Object.assign(playlist, { updated })
            return true
        },
        moveToCustomPlaylist(toId, fromId, track) {
            if (!toId || !fromId) return false
            if (toId == fromId) return false
            if (this.addToCustomPlaylist(toId, track)) {
                return this.removeTrackFromCustomPlaylist(fromId, track)
            }
            return false
        },
        removeAllTracksFromCustomPlaylist(id) {
            const playlist = this.getCustomPlaylist(id)
            if (!playlist) return false
            playlist.data.length = 0
            const updated = Date.now()
            Object.assign(playlist, { updated })
            return true
        },
        findCustomPlaylistIndex(id) {
            if (!id || id.trim().length < 1) return -1
            if (this.customPlaylists.length < 1) return -1
            return this.findItemIndex(this.customPlaylists, { id },
                (e1, e2) => e1.id === e2.id)
        },
        //关注的歌手
        addFollowArtist(id, platform, title, cover) {
            this.addItem(this.follows.artists, {
                id, platform, title, cover
            })
        },
        removeFollowArtist(id, platform) {
            this.removeItem(this.follows.artists, { id, platform })
        },
        isFollowArtist(id, platform) {
            return this.findItemIndex(this.follows.artists, { id, platform }) != -1
        },
        //最近播放
        addRecentSong(track) {
            const { id, platform, title, artist, album, duration, cover,
                type, pid, songlistId, extra1, extra2, mv,
                payPlay, payDownload } = track
            if (!platform || platform.trim().length < 1) return
            //TODO
            const url = Playlist.isAnchorRadioType(track) ? track.url : null
            this.uniqueInsertFirst(this.recents.songs, {
                id, platform, title, artist, album, duration, cover, url,
                type, pid, songlistId, extra1, extra2, mv,
                payPlay, payDownload
            })
            //TODO
            const limit = 999
            if (this.recents.songs.length > limit) {
                const deleteCount = this.recents.songs.length - limit
                this.recents.songs.splice(limit, deleteCount)
                this.refreshUserHome()
            }
        },
        addRecentPlaylist(id, platform, title, cover, type) {
            this.uniqueInsertFirst(this.recents.playlists, {
                id, platform, title, cover, type
            })
        },
        addRecentAlbum(id, platform, title, cover, publishTime) {
            this.uniqueInsertFirst(this.recents.albums, {
                id, platform, title, cover, publishTime
            })
        },
        addRecentRadio(track) {
            const { id, platform, title, cover, type, } = track
            this.uniqueInsertFirst(this.recents.radios, {
                id, platform, title, cover, type, data: [track]
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
            this.refreshUserHome()
        },
        refreshUserHome() {
            EventBus.emit("userHome-refresh")
        },
        nextDecoration() {
            const start = 1001, count = 3
            const max = start + count - 1
            let num = this.decoration.current
            this.decoration.current = ((++num > max) ? start : num)
        }
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