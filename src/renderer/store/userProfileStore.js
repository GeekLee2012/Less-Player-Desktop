import { defineStore } from "pinia";

const choice = 'ABCDEFGHIJKLMNOPQRSTUVWSYZabcdefghijklmnopqrstuvwsyz01234567890'
//随机字符串
const randomText = (src, len) => {
    let result = []
    for (let i = 0; i < len; i++) {
        const index = Math.floor(Math.random() * (src.length - 1))
        result.push(src.charAt(index))
    }
    return result.join('')
}

export const useUserProfileStore = defineStore("userProfile", {
    state: () => ({
        user: {
            id: 0,
            nickname: "我的主页",
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
            return this.favorites.songs
        },
        getFavouritePlaylilsts() {
            return this.favorites.playlists
        },
        getFavouriteAlbums() {
            return this.favorites.albums
        },
        getFavouriteRadios() {
            return this.favorites.radios
        },
        getCustomPlaylists() {
            return this.customPlaylists
        },
        getFollowArtists() {
            return this.follows.artists
        },
    },
    actions: {
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
            if(index != -1) return 
            const created = Date.now()
            const updated = created
            Object.assign(item, { created, updated })
            state.push(item)
        },
        removeItem(state, item, compareFn) {
            if(!state) return 
            if(!item) return
            const index = this.findItemIndex(state, item, compareFn)
            if(index != -1) state.splice(index, 1)
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
            return this.findItemIndex(this.favorites.playlists, { id, platform}) != -1
        },
        isFavouriteAlbum(id, platform) {
            return this.findItemIndex(this.favorites.albums, { id, platform}) != -1
        },
        isFavouriteSong(id, platform) {
            return this.findItemIndex(this.favorites.songs, { id, platform}) != -1
        },
        isFavouriteRadio(id, platform) {
            return this.findItemIndex(this.favorites.radios, { id, platform}) != -1
        },
        //清理
        cleanUpAllSongs(currentTrack) {
            const states = [ this.favorites.songs, this.recents.songs ]
            const props = ['url', 'lyric']
            const { id, platform } = currentTrack
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
            const id = randomText(choice, 16)
            this.addItem(this.customPlaylists, {
                id, title, about, cover, data: []
            }, (e1, e2) => e1.id === e2.id)
        },
        updateCustomPlaylist(id, title, about, cover){
            if(this.customPlaylists.length < 1) return 
            const index = this.findItemIndex(this.customPlaylists, { id }, 
                (e1, e2) => e1.id === e2.id)
            if(index < 0) return 
            Object.assign(this.customPlaylists[index], { title, about, cover })
        },
        getCustomPlaylist(id){
            if(this.customPlaylists.length < 1) return 
            const index = this.findItemIndex(this.customPlaylists, { id }, 
                (e1, e2) => e1.id === e2.id)
            return index < 0 ? { id } : this.customPlaylists[index]
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
        }
        //最近播放
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