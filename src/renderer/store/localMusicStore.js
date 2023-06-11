import { defineStore } from "pinia";
import { Track } from "../../common/Track";
import { randomTextWithinAlphabetNums } from "../../common/Utils";
import { Playlist } from "../../common/Playlist";



export const useLocalMusicStore = defineStore('localMusic', {
    state: () => ({
        localDirs: [],
        localTracks: [],
        //上面状态，后期会全部移除掉
        localPlaylists: []
    }),
    getters: {
        getLocalSongs() {
            return this.localTracks
        },
    },
    actions: {
        resetAll() {
            this.localDirs.length = 0
            this.localTracks.length = 0
            this.localPlaylists.length = 0
        },
        addLocalPlaylist(title, tags, about, cover) {
            const id = Playlist.LOCAL_PLAYLIST_ID_PREFIX + randomTextWithinAlphabetNums(12)
            const created = Date.now()
            const updated = created
            cover = cover || 'default_cover.png'
            this.localPlaylists.push({ id, platform: 'local', title, tags, about, cover, data: [], created, updated })
            return id
        },
        updateLocalPlaylist(id, title, tags, about, cover) {
            if (this.localPlaylists.length < 1) return
            const index = this.localPlaylists.findIndex(e => e.id === id)
            if (index < 0) return
            const updated = Date.now()
            Object.assign(this.localPlaylists[index], { platform: 'local', title, about, tags, cover, updated })
        },
        getLocalPlaylist(id) {
            if (this.localPlaylists.length < 1) return { id }
            const index = this.localPlaylists.findIndex(e => e.id === id)
            return index < 0 ? { id } : this.localPlaylists[index]
        },
        addToLocalPlaylist(id, track) {
            const playlist = this.getLocalPlaylist(id)
            if (!playlist) return false
            const index = playlist.data.findIndex(e => e.id === track.id)
            if (index > -1) return false
            playlist.data.push(track)
            const updated = Date.now()
            Object.assign(playlist, { updated })
            return true
        },
        removeFromLocalPlaylist(id, track) {
            const playlist = this.getLocalPlaylist(id)
            if (!playlist) return false
            const index = playlist.data.findIndex(e => e.id === track.id)
            if (index < 0) return false
            playlist.data.splice(index, 1)
            const updated = Date.now()
            Object.assign(playlist, { updated })
            return true
        },
        removeAllFromLocalPlaylist(id) {
            const playlist = this.getLocalPlaylist(id)
            if (!playlist) return false
            playlist.data.length = 0
            const updated = Date.now()
            Object.assign(playlist, { updated })
            return true
        },
        removeLocalPlaylist(id) {
            if (this.localPlaylists.length < 1) return false
            const index = this.localPlaylists.findIndex(e => e.id === id)
            if (index < 0) return false
            this.localPlaylists.splice(index, 1)
            return true
        },
    },
    persist: {
        enabled: true,
        strategies: [
            {
                storage: localStorage,
                paths: ['localDirs', 'localTracks', 'localPlaylists']
            }
        ]
    }
})