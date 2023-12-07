import { defineStore } from 'pinia';
import { randomTextWithinAlphabetNums } from '../../common/Utils';



export const usePluginStore = defineStore('plugins', {
    state: () => ({
        plugins: []
    }),
    actions: {
        pluginIndex({ id, name, version, author }) {
            if(id) return this.plugins.findIndex(item => (item.id == id))
            if(title && version) {
                return this.plugins.findIndex(item => {
                    return item.name == name 
                        && item.version == version
                        && item.author == author
                })
            }
            return -1
        },
        addPlugin(plugin) {
            if(!plugin) return 
            const { name, version, author } = plugin
            const index = this.plugins.findIndex(item => {
                return item.name == name 
                    && item.version == version
                    && item.author == author
            })
            if(index > -1) return
            const id = randomTextWithinAlphabetNums(10)
            Object.assign(plugin, { id })
            this.plugins.push(plugin)
            return id
        },
        updatePluginState(plugin, state) {
            const index = this.pluginIndex(plugin)
            if(index > -1) this.plugins[index].state = state || 0
        },
        removePlugin(plugin) {
            const index = this.pluginIndex(plugin)
            if(index > -1) return this.plugins.splice(index, 1)
        }
    },
    persist: {
        enabled: true,
        strategies: [
            {
                storage: localStorage,
            }
        ]
    }
})