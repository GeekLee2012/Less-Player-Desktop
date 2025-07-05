import { defineStore } from "pinia";
import { toRaw } from "vue";
import { randomTextWithinAlphabetNums, } from "../../common/Utils";
import { Playlist } from "../../common/Playlist";
import { usePlatformStore } from "./platformStore";
import { emitEvents } from "../../common/EventBusWrapper";


//TODO
export const refreshUserHome = (scope, action) => emitEvents('userHome-refresh', { scope, action })
export const refreshFavoritedState = () => emitEvents('track-refreshFavoritedState')

const filterByPlatform = (state, platform) => {
    if (!platform || platform.trim() == 'all') return state
    return state.filter(item => (item.platform == platform.trim()))
}

let resultTimer = null
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
        /*
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
        */
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
        //我的收藏
        addFavoritePlaylist(id, platform, title, cover, type) {
            this.addItem(this.favorites.playlists, {
                id, platform, title, cover, type
            })
        },
        addFavoriteAlbum(id, platform, title, cover, publishTime, artist, company) {
            this.addItem(this.favorites.albums, {
                id, platform, title, cover, publishTime, artist, company
            })
        },
        addFavoriteTrack(track) {
            /*
            const { id, platform, title, artist, album, duration, cover,
                type, pid, mv, songlistId, extra1, extra2, 
                payPlay, payDownload, songID, strMediaMid, hash, extraHash,
            } = track
            */
            const _track = { ...track }
            const excludeProps = ['lyric', 'lyricTran', 'lyricTrans', 
                'lyricRoma', 'score', 'isCandidate']
            //TODO
            if(!Playlist.isAnchorRadioType(track)) excludeProps.push('url')
            excludeProps.forEach(prop => Reflect.deleteProperty(_track, prop))
            //本地歌曲暂不支持
            const { isLocalMusic } = usePlatformStore()
            if (isLocalMusic(_track.platform)) return false

            this.addItem(this.favorites.songs, _track)
            return true
        },
        //清洗收藏的歌曲
        cleanFavoriteTracks() {
            if(this.favorites.songs.length < 1) return 
            const excludeProps = ['lyric', 'lyricTran', 'lyricTrans', 
                'lyricRoma', 'score', 'isCandidate']
            this.favorites.songs.forEach(song => {
                excludeProps.forEach(prop => Reflect.deleteProperty(song, prop))
                if(!Playlist.isAnchorRadioType(song)) Reflect.deleteProperty(song, 'url')
            })            
        },
        addFavoriteRadio(track) {
            /*
            const { id, platform, title, cover, artist, url,
                type, pid, songlistId, extra1, extra2, position } = track
            */
            const _track = { ...toRaw(track) }
            const excludeProps = ['lyric', 'lyricTran', 'lyricTrans', 
                'lyricRoma', 'payPlay', 'payDownload', 
                'publishTime', 'score', 'isCandidate']
            excludeProps.forEach(prop => Reflect.deleteProperty(_track, prop))
            this.addItem(this.favorites.radios, _track)
        },
        removeFavoritePlaylist(id, platform) {
            this.removeItem(this.favorites.playlists, { id, platform })
        },
        removeFavoriteAlbum(id, platform) {
            this.removeItem(this.favorites.albums, { id, platform })
        },
        removeFavoriteSong(id, platform) {
            this.removeItem(this.favorites.songs, { id, platform })
            refreshFavoritedState()
        },
        removeFavoriteRadio(id, platform) {
            this.removeItem(this.favorites.radios, { id, platform })
            refreshFavoritedState()
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
        getFavoriteSong(id, platform) {
            const index = this.findItemIndex(this.favorites.songs, { id, platform })
            return this.favorites.songs[index]
        },
        removeAllFavorites() {
            this.favorites.songs.length = 0
            this.favorites.playlists.length = 0
            this.favorites.albums.length = 0
            this.favorites.radios.length = 0
            refreshUserHome()
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
        addCustomPlaylist(title, about, cover, data) {
            const id = Playlist.CUSTOM_ID_PREFIX + randomTextWithinAlphabetNums(12)
            const _data = []
            if (Array.isArray(data)) {
                _data.push(...data)
            } else if (data) {
                _data.push(data)
            }
            this.addItem(this.customPlaylists, {
                id, title, about, cover, data: _data
            }, (e1, e2) => e1.id === e2.id)
            return id
        },
        updateCustomPlaylist(id, title, about, cover) {
            if (this.customPlaylists.length < 1) return
            const index = this.findItemIndex(this.customPlaylists, { id },
                (e1, e2) => e1.id === e2.id)
            if (index < 0) return
            const updated = Date.now()
            return Object.assign(this.customPlaylists[index], { title, about, cover, updated })
        },
        getCustomPlaylist(id) {
            if (this.customPlaylists.length < 1) return { id }
            const index = this.findItemIndex(this.customPlaylists, { id },
                (e1, e2) => e1.id === e2.id)
            return index < 0 ? { id } : this.customPlaylists[index]
        },
        getCustomPlaylistAsync(id) {
            return new Promise((resolve, reject) => {
                if (this.customPlaylists.length < 1) return { id }
                const index = this.findItemIndex(this.customPlaylists, { id },
                    (e1, e2) => e1.id === e2.id)
                const result = this.customPlaylists[index] || { id }
                const { data } = result
                const total = (data & data.length) || 0
                const timeout = Math.min(total * 10, 2588)
                if(resultTimer) clearTimeout(resultTimer)
                resultTimer = setTimeout(() => {
                    resolve(result)
                }, timeout)
            })
            
        },
        removeCustomPlaylist(id) {
            this.removeItem(this.customPlaylists, { id }, (e1, e2) => e1.id === e2.id)
        },
        addToCustomPlaylist(id, track) {
            const playlist = this.getCustomPlaylist(id)
            if (!playlist) return false
            const { platform } = track
            const { isLocalMusic } = usePlatformStore()
            if (isLocalMusic(platform) 
                || Playlist.isFMRadioType(track)) {
                return false
            }

            const index = this.findItemIndex(playlist.data, track)
            if (index > -1) return false

            playlist.data.push(track)
            const updated = Date.now()
            Object.assign(playlist, { updated })
            return true
        },
        removeFromCustomPlaylist(id, track) {
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
                return this.removeFromCustomPlaylist(fromId, track)
            }
            return false
        },
        removeAllFromCustomPlaylist(id) {
            const playlist = this.getCustomPlaylist(id)
            if (!playlist) return false

            playlist.data.length = 0
            const updated = Date.now()
            Object.assign(playlist, { updated })
            return true
        },
        _findListItemIndex(id, list) {
            if (!id || id.trim().length < 1) return -1
            if (!list || list.length < 1) return -1
            return this.findItemIndex(list, { id },
                (e1, e2) => e1.id === e2.id)
        },
        findCustomPlaylistIndex(id) {
            return this._findListItemIndex(id, this.customPlaylists)
        },
        findFavouritePlaylistIndex(id) {
            return this._findListItemIndex(id, this.favorites.playlists)
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
        removeAllRecents() {
            this.recents.songs.length = 0
            this.recents.playlists.length = 0
            this.recents.albums.length = 0
            this.recents.radios.length = 0
            refreshUserHome()
        },
        nextDecoration() {
            ++this.decoration.current
        },
        resetDecoration() {
            this.decoration.current = 1001
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