import { defineStore } from "pinia";
import { Track } from "../../common/Track";

const ipcRenderer = electronApi.ipcRenderer

export const useLocalMusicStore = defineStore('localMusic', {
    state: () => ({
        localDirs: [],
        localTracks: [],
        isLoading: false
    }),
    getters: {

    },
    actions: {
        async addFolders() {
            this.isLoading = true
            const result = await ipcRenderer.invoke('open-dirs')
            console.log(result)
            if(result) {
                this.localDirs.push(result.path)
                result.data.forEach(item => {
                    this.localTracks.push(Object.assign(new Track(), item))
                })
            }
            this.isLoading = false
        },
        async addFiles() {
            this.isLoading = true
            const result = await ipcRenderer.invoke('open-files')
            console.log(result)
            if(result) {
                result.forEach(item => {
                    this.localTracks.push(Object.assign(new Track(), item))
                })
            }
            this.isLoading = false
        },
        removeItem(index) {
            if(isNaN(index)) return
            if(index > -1) {
                this.localTracks.splice(index, 1)
            }
        },
        resetAll() {
            this.localDirs.length = 0
            this.localTracks.length = 0
        }
    }
})