import { defineStore } from 'pinia';
import { Playlist } from "../../common/Playlist";
import { randomTextWithinAlphabetNums } from "../../common/Utils";


export const usePlaybackQueueStore = defineStore('playbackQueueStore', {
    state: () => ({
        queues: [],
    }),
    getters: {
        queueMetas() {
            return this.queues.map(item => {
                const total = item.data ? item.data.length : 0
                const clone = { ...item, total }
                Reflect.deleteProperty(clone, 'data')
                return clone
            })
        },
    },
    actions: {
        findQueueIndex(id) {
            return this.queues.findIndex(item => (item.id == id))
        },
        getQueue(id) {
            const index = this.findQueueIndex(id)
            return this.queues[index]
        },
        addQueue(queue) {
            const id = Playlist.SAVED_PLAYBACK_QUEUE_ID_PREFIX + randomTextWithinAlphabetNums(12)
            const created = Date.now()
            const updated = created
            Object.assign(queue, { id, created, updated })
            this.queues.push(queue)
        },
        updateQueue(queue) {
            const { id } = queue
            const item = this.getQueue(id)
            if(!item) return 
            Object.assign(item, { ...queue })
        },
        removeQueue(queue) {
            const { id } = queue
            const index = this.findQueueIndex(id)
            if(index > -1) this.queues.splice(index, 1)
        },
        clearQueues() {
            this.queues.length = 0
        }
    },
    persist: {
        enabled: true,
        strategies: [
            {
                storage: localStorage,
                paths: ['queues']
            }
        ]
    }     
})