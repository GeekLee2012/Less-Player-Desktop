import { defineStore } from "pinia";
import { randomTextWithinAlphabetNums } from "../../common/Utils";
import { Playlist } from "../../common/Playlist";


export const useLocalMusicStore = defineStore('localMusic', {
    state: () => ({
        localDirs: [],
        localTracks: [],
        //上面状态已废弃，后期会全部移除掉
        localPlaylists: [],
        importTaskCount: 0, //正在进行中的导入任务数
    }),
    getters: {
        getLocalPlaylists() {
            //return this.localPlaylists
            //移除属性data，采用延迟加载，但感觉没减少什么内存占用
            //因为localPlaylists本身，并没有采用“属性分离”设计，一上来就会加载到内存中.....
            //另外, 即使采用“属性分离”设计，也不一定实现了延迟加载
            //因为使用useXxxStore()后，Store的state可能也全部加载到内存中了.....
            //而数据库，就可以很容易实现延迟加载，但数据读写操作上会复杂很多
            return this.localPlaylists.map(item => {
                const total = item.data ? item.data.length : 0
                const clone = { ...item, total }
                Reflect.deleteProperty(clone, 'data')
                return clone
            })
        },
    },
    actions: {
        resetAll() {
            this.localDirs.length = 0
            this.localTracks.length = 0
            this.localPlaylists.length = 0
        },
        addLocalPlaylist(title, tags, about, cover, data) {
            const id = Playlist.LOCAL_PLAYLIST_ID_PREFIX + randomTextWithinAlphabetNums(12)
            const created = Date.now()
            const updated = created
            tags = tags || ''
            about = about || ''
            cover = cover || ''
            data = data || []
            data.forEach(item => item.pid = id)
            this.localPlaylists.push({ id, platform: 'local', type: Playlist.NORMAL_TYPE, title, tags, about, cover, data, created, updated })
            return id
        },
        updateLocalPlaylist(id, title, tags, about, cover) {
            if (this.localPlaylists.length < 1) return
            const index = this.localPlaylists.findIndex(e => e.id === id)
            if (index < 0) return

            const updated = Date.now()
            return Object.assign(this.localPlaylists[index], { platform: 'local', title, about, tags, cover, updated })
        },
        getLocalPlaylist(id) {
            if (this.localPlaylists.length < 1) return null
            const index = this.localPlaylists.findIndex(e => e.id === id)
            return index < 0 ? null : this.localPlaylists[index]
        },
        addToLocalPlaylist(id, track) {
            const playlist = this.getLocalPlaylist(id)
            if (!playlist) return false

            const { platform } = track
            if (platform != 'local') return false
            if (Playlist.isFMRadioType(track)) return false

            const index = playlist.data.findIndex(e => e.id === track.id)
            if (index > -1) return false
            Object.assign(track, { pid: id })
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
        moveToLocalPlaylist(toId, fromId, track) {
            if (!toId || !fromId) return false
            if (toId == fromId) return false

            if (this.addToLocalPlaylist(toId, track)) {
                return this.removeFromLocalPlaylist(fromId, track)
            }
            return false
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
        increaseImportTaskCount() {
            ++this.importTaskCount
        },
        decreaseImportTaskCount() {
            this.importTaskCount = Math.max(this.importTaskCount - 1, 0)
        },
        getLocalPlaylistTrack(pid, id) {
            const playlist = this.getLocalPlaylist(pid)
            if(!playlist) return 
            const { data } = playlist
            if(!data || data.length < 1) return 

            for(let i = 0; i < data.length; i ++) {
                if(id == data[i].id) return data[i]
            }
            return null
        }
    },
    persist: {
        enabled: true,
        strategies: [
            {
                storage: localStorage,
                paths: ['localPlaylists']
            }
        ]
    }
})