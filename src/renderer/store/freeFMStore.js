import { defineStore } from "pinia";
import { Track } from "../../common/Track";
import { coverDefault, randomTextWithinAlphabetNums } from "../../common/Utils";
import { Playlist } from "../../common/Playlist";



export const useFreeFMStore = defineStore('freeFM', {
    state: () => ({
        freeRadios: [],
        importTaskCount: 0
    }),
    getters: {
        getFreeRadios() {
            return this.freeRadios
        }
    },
    actions: {
        resetAll() {
            this.freeRadios.length = 0
        },
        addFreeRadio(title, url, streamType, tags, about, cover) {
            const index = this.freeRadios.findIndex(e => {
                if (e.data && e.data.length > 0) {
                    return e.data[0].url === url
                }
                return false
            })
            if (index != -1) return

            const id = randomTextWithinAlphabetNums(16)
            const created = Date.now()
            const updated = created
            tags = tags || ''
            about = about || ''
            cover = cover || ''

            const platform = 'freefm'
            const artist = [{ id: '', name: '自由FM' }]
            const album = { id: '', name: tags || '自由FM' }
            const channelTrack = new Track(id, platform, title, artist, album, 0, cover, url)
            Object.assign(channelTrack, {
                streamType,
                type: Playlist.FM_RADIO_TYPE
            })

            const data = [channelTrack]
            this.freeRadios.push({ id, platform, type: Playlist.FM_RADIO_TYPE, title, tags, about, cover, data, created, updated })
            return id
        },
        updateFreeRadio(id, title, url, streamType, tags, about, cover) {
            if (this.freeRadios.length < 1) return false
            const index = this.freeRadios.findIndex(e => e.id === id)
            if (index < 0) return false
            const updated = Date.now()
            const { data } = this.freeRadios[index]
            if (data && data.length > 0) {
                const album = { id: '', name: tags || '自由FM' }
                cover = coverDefault(cover)

                data[0].lyric = null    //重置歌词
                Object.assign(data[0], {
                    title,
                    url,
                    streamType,
                    album,
                    cover,
                    type: Playlist.FM_RADIO_TYPE
                })
            }
            Object.assign(this.freeRadios[index], { platform: 'freefm', title, about, tags, cover, data, updated })
            return true
        },
        getFreeRadio(id) {
            if (this.freeRadios.length < 1) return { id }
            const index = this.freeRadios.findIndex(e => e.id === id)
            return index < 0 ? { id } : this.freeRadios[index]
        },
        removeFreeRadio({ id }) {
            if (this.freeRadios.length < 1) return false
            const index = this.freeRadios.findIndex(e => e.id === id)
            if (index < 0) return false
            this.freeRadios.splice(index, 1)
            return true
        },
        increaseImportTaskCount() {
            ++this.importTaskCount
        },
        decreaseImportTaskCount() {
            this.importTaskCount = Math.max(this.importTaskCount - 1, 0)
        },
    },
    persist: {
        enabled: true,
        strategies: [
            {
                storage: localStorage,
                paths: ['freeRadios']
            }
        ]
    }
})