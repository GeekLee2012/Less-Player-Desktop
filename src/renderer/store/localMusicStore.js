import { defineStore } from "pinia";
import { Track } from "../../common/Track";
import { useIpcRenderer } from "../../common/Utils";



const ipcRenderer = useIpcRenderer()

export const useLocalMusicStore = defineStore('localMusic', {
    state: () => ({
        localDirs: [],
        localTracks: [],
        isLoading: false
    }),
    getters: {
        getLocalSongs() {
            return this.localTracks
        }
    },
    actions: {
        async addFolders() {
            if (!ipcRenderer) return
            this.isLoading = true
            const result = await ipcRenderer.invoke('open-audio-dirs')

            if (result) {
                this.localDirs.push(result.path)
                result.data.forEach(item => {
                    this.localTracks.push(Object.assign(new Track(), item))
                })
            }
            this.isLoading = false
        },
        async addFiles() {
            if (!ipcRenderer) return
            this.isLoading = true
            const result = await ipcRenderer.invoke('open-audios')

            if (result) {
                result.forEach(item => {
                    this.localTracks.push(Object.assign(new Track(), item))
                })
            }
            this.isLoading = false
        },
        removeItem(item) {
            const index = this.localTracks.findIndex((e) => item.id === e.id)
            if (index > -1) this.localTracks.splice(index, 1)
        },
        resetAll() {
            this.localDirs.length = 0
            this.localTracks.length = 0
        }
    },
    persist: {
        enabled: true,
        strategies: [
            {
                storage: localStorage,
                paths: ['localDirs', 'localTracks']
            }
        ]
    }
})