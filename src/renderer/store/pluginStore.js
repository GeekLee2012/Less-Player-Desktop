import { defineStore } from 'pinia';
import { randomTextWithinAlphabetNums, stringEqualsIgnoreCase } from '../../common/Utils';



export const usePluginStore = defineStore('plugins', {
    state: () => ({
        ignoreErrorPlugins: false,
        ignoreDeveloperPlugins: true,
        isReplaceMode: false,
        plugins: []
    }),
    getters: {
        
    },
    actions: {
        toggleIgnoreErrorPlugins() {
            this.ignoreErrorPlugins = !this.ignoreErrorPlugins
        },
        toggleIgnoreDeveloperPlugins() {
            this.ignoreDeveloperPlugins = !this.ignoreDeveloperPlugins
        },
        toggleReplaceMode() {
            this.isReplaceMode = !this.isReplaceMode
        },
        pluginIndex(plugin) {
            if(!plugin) return -1
            const { id, name, version, author } = plugin
            if(id) return this.plugins.findIndex(item => (item.id == id))
            if(name && author) {
                return this.plugins.findIndex(item => {
                    return item.name == name 
                        && item.author == author
                        //&& item.version == version
                })
            }
            return -1
        },
        getPlugin(id) {
            const index = this.pluginIndex({ id })
            if(index < 0) return
            return this.plugins[index]
        },
        addPlugin(plugin) {
            if(!plugin) return { id: null, index: null }
            const { name, version, author } = plugin
            const index = this.plugins.findIndex(item => {
                return item.name == name 
                    && item.author == author
                    //&& item.version == version
            })
            if(index > -1) {
                const { id: sId, version: sVersion }= this.plugins[index]
                return { id: sId, index, version: sVersion }
            }
            const id = randomTextWithinAlphabetNums(10)
            const created = Date.now()
            Object.assign(plugin, { id, created })
            this.plugins.push(plugin)
            return { id, index, version }
        },
        updatePlugin(plugin, changes) {
            const index = this.pluginIndex(plugin)
            if(index < 0) return
            if(!changes || typeof changes != 'object') return 
            //const updatableKeys = 'about|repository|state|path|main|mainModule|alias'.split('|')
            const excludeKeys = 'id|name|author'.split('|')
            for(const [key, value] of Object.entries(changes)) {
                //if(!updatableKeys.includes(key)) continue
                if(excludeKeys.includes(key)) continue
                this.plugins[index][key] = value
            }
            const updated = Date.now()
            Object.assign(this.plugins[index], { updated })
        },
        removePlugin(plugin) {
            const index = this.pluginIndex(plugin)
            if(index > -1) return this.plugins.splice(index, 1)
        },
        getPluginOptions(plugin) {
            const fixedKeys = 'id|name|author|version|type|created'.split('|')
            const updatableKeys = 'about|repository|state|path|main|mainModule|alias|updated'.split('|')
            const clone = JSON.parse(JSON.stringify(plugin))
            const excludeKeys = [...fixedKeys, ...updatableKeys]
            excludeKeys.forEach(key => Reflect.deleteProperty(clone, key))
            return clone
        },
        updatePluginOptions(id, options) {
            const plugin = this.getPlugin(id)
            if(!plugin) return 
            const oldOptions = this.getPluginOptions(plugin)
            const oldOptionsKeys = Object.keys(oldOptions) || []
            const newOptionsKeys = Object.keys(options) || []
            this.updatePlugin(plugin, options)
            oldOptionsKeys.forEach(key => {
                if(!newOptionsKeys || !newOptionsKeys.includes(key)) {
                    Reflect.deleteProperty(plugin, key)
                }
            })
            //兼容Cookie的写法，并统一为小写cookie
            const cookieKey = 'cookie'
            Object.entries(plugin).forEach(([key, value]) => {
                if(!stringEqualsIgnoreCase(key, cookieKey)) return 
                if(key == cookieKey) return
                Object.assign(plugin, { [cookieKey]: value })
                Reflect.deleteProperty(plugin, key)
            })
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