import { defineStore } from 'pinia';
import { Playlist } from "../../common/Playlist";
import { randomTextWithinAlphabetNums } from "../../common/Utils";


export const usePlaybackQueueStore = defineStore('playbackQueueStore', {
    state: () => ({
        queues: [],
    }),
    getters: {
        getQueues() {
            //return this.queues
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
        getQueueAsync(id) {
            return new Promise((resolve, reject) => {
                const index = this.findQueueIndex(id)
                const result = this.queues[index] || { id }
                const { data } = result
                const total = (data & data.length) || 0
                const timeout = Math.min(total * 10, 2588)
                setTimeout(() => {
                    resolve(result)
                }, timeout)
            })
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