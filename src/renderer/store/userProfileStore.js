import { defineStore } from "pinia";
import EventBus from "../../common/EventBus";
import { randomTextWithinAlphabetNums } from "../../common/Utils";


const filterByPlatform = (state, platform) => {
    if(!platform || platform.trim() == 'all') {
        return state
    }
    return state.filter(item => (item.platform == platform.trim()))
}

export const useUserProfileStore = defineStore("userProfile", {
    state: () => ({
        user: {
            id: 0,
            nickname: "我的主页(测试阶段)",
            cover: "",
            about: "这个人很懒，什么也没留下~"
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
        
    }),
    getters: {
        getFavouriteSongs() {
            return (platform) => filterByPlatform(this.favorites.songs, platform)
        },
        getFavouritePlaylilsts() {
            return (platform) => filterByPlatform(this.favorites.playlists, platform)
        },
        getFavouriteAlbums() {
            return (platform) => filterByPlatform(this.favorites.albums, platform)
        },
        getFavouriteRadios() {
            return this.favorites.radios
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
            return this.recents.radios
        },
    },
    actions: {
        updateUser(nickname, about, cover) {
            Object.assign(this.user, { nickname, about, cover })
        },
        //TODO state合法性待校验
        findItemIndex(state, item, compareFn) {
            if(!state) return -1
            if(!item) return -1
            return state.findIndex(e => {
                return compareFn ? compareFn(item, e) : 
                    (item.id === e.id && item.platform == e.platform)
            })
        },
        addItem(state, item, compareFn) {
            if(!state) return
            const index = this.findItemIndex(state, item, compareFn)
            if(index != -1) return false
            const created = Date.now()
            const updated = created
            Object.assign(item, { created, updated })
            state.push(item)
            this.refreshUserHome()
            return true
        },
        insertFirst(state, item, compareFn) {
            if(!state) return
            const index = this.findItemIndex(state, item, compareFn)
            if(index != -1) return false
            const created = Date.now()
            const updated = created
            Object.assign(item, { created, updated })
            state.splice(0, 0, item)
            this.refreshUserHome()
            return true
        },
        removeItem(state, item, compareFn) {
            if(!state) return 
            if(!item) return
            const index = this.findItemIndex(state, item, compareFn)
            if(index != -1) state.splice(index, 1)
            this.refreshUserHome()
        },
        uniqueInsertFirst(state, item, compareFn) {
            this.removeItem(state, item, compareFn)
            this.insertFirst(state, item, compareFn)
        },
        //我的收藏
        addFavouritePlaylist(id, platform, title, cover) {
            this.addItem(this.favorites.playlists, {
                id, platform, title, cover
            })
        },
        addFavouriteAlbum(id, platform, title, cover, publishTime) {
            this.addItem(this.favorites.albums, {
                id, platform, title, cover, publishTime
            })
        },
        addFavouriteSong(id, platform, title, artist, album, duration, cover) {
            this.addItem(this.favorites.songs, {
                id, platform, title, artist, album, duration, cover
            })
        },
        addFavouriteTrack(track) {
            const { id, platform, title, artist, album, duration, cover } = track
            this.addFavouriteSong(id, platform, title, artist, album, duration, cover)
        },
        addFavouriteRadio(track) {
            const { id, platform, title, cover, artist, isFMRadio, channel } = track
            this.addItem(this.favorites.radios, {
                id, platform, title, cover, artist, isFMRadio, channel
            })
        },
        removeFavouritePlaylist(id, platform) {
            this.removeItem(this.favorites.playlists, { id, platform })
        },
        removeFavouriteAlbum(id, platform) {
            this.removeItem(this.favorites.albums, { id, platform })
        },
        removeFavouriteSong(id, platform) {
            this.removeItem(this.favorites.songs, { id, platform })
        },
        removeFavouriteRadio(id, platform) {
            this.removeItem(this.favorites.radios, { id, platform })
        },
        isFavouritePlaylist(id, platform) {
            return this.findItemIndex(this.favorites.playlists, { id, platform}) > -1
        },
        isFavouriteAlbum(id, platform) {
            return this.findItemIndex(this.favorites.albums, { id, platform}) > -1
        },
        isFavouriteSong(id, platform) {
            return this.findItemIndex(this.favorites.songs, { id, platform}) > -1
        },
        isFavouriteRadio(id, platform) {
            return this.findItemIndex(this.favorites.radios, { id, platform}) > -1
        },
        //清理
        cleanUpAllSongs(states) {
            states = states || [ this.favorites.songs, this.recents.songs ]
            const props = ['url', 'lyric']
            states.forEach(state => {
                state.forEach(item => {
                    props.forEach(p => {
                        Reflect.deleteProperty(item, p)
                    })
                })
            })
        },
        //自建歌单
        addCustomPlaylist(title, about, cover){
            const id = randomTextWithinAlphabetNums(16)
            this.addItem(this.customPlaylists, {
                id, title, about, cover, data: []
            }, (e1, e2) => e1.id === e2.id)
        },
        updateCustomPlaylist(id, title, about, cover){
            if(this.customPlaylists.length < 1) return 
            const index = this.findItemIndex(this.customPlaylists, { id }, 
                (e1, e2) => e1.id === e2.id)
            if(index < 0) return 
            const updated = Date.now()
            Object.assign(this.customPlaylists[index], { title, about, cover, updated })
        },
        getCustomPlaylist(id){
            if(this.customPlaylists.length < 1) return 
            const index = this.findItemIndex(this.customPlaylists, { id }, 
                (e1, e2) => e1.id === e2.id)
            return index < 0 ? { id } : this.customPlaylists[index]
        },
        removeCustomPlaylist(id) {
            this.removeItem(this.customPlaylists, { id }, (e1, e2) => e1.id === e2.id)
        },
        addToCustomPlaylist(id, track) {
            const playlist = this.getCustomPlaylist(id)
            if(!playlist) return false
            const index = this.findItemIndex(playlist.data, track)
            if(index > -1) return false
            playlist.data.push(track)
            const updated = Date.now()
            Object.assign(playlist, { updated })
            return true
        },
        removeTrackFromCustomPlaylist(id, track) {
            const playlist = this.getCustomPlaylist(id)
            if(!playlist) return false
            const index = this.findItemIndex(playlist.data, track)
            if(index < 0) return false 
            playlist.data.splice(index, 1)
            const updated = Date.now()
            Object.assign(playlist, { updated })
            return true
        },
        moveToCustomPlaylist(toId, fromId, track) {
            if(!toId || !fromId) return false
            if(toId == fromId) return false
            if(this.addToCustomPlaylist(toId, track)) {
                return this.removeTrackFromCustomPlaylist(fromId, track)
            }
            return false
        },
        removeAllTracksFromCustomPlaylist(id) {
            const playlist = this.getCustomPlaylist(id)
            if(!playlist) return false
            playlist.data.length = 0
            const updated = Date.now()
            Object.assign(playlist, { updated })
            return true
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
            const { id, platform, title, artist, album, duration, cover } = track
            if(!platform || platform.trim().length < 1) return 
            this.uniqueInsertFirst(this.recents.songs, { 
                id, platform, title, artist, album, duration, cover 
            })
        },
        addRecentPlaylist(id, platform, title, cover) {
            this.uniqueInsertFirst(this.recents.playlists, {
                id, platform, title, cover
            })
        },
        addRecentAlbum(id, platform, title, cover, publishTime) {
            this.uniqueInsertFirst(this.recents.albums, {
                id, platform, title, cover, publishTime
            })
        },
        addRecentRadio(track) {
            const { id, platform, title, cover, artist, isFMRadio, channel } = track
            this.uniqueInsertFirst(this.recents.radios, {
                id, platform, title, cover, artist, isFMRadio, channel
            })
        },
        removeRecentSong(track) {
            const { id, platform } = track
            this.removeItem(this.recents.songs, { id, platform })
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