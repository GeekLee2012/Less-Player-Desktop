import { defineStore } from "pinia";
import { randomTextWithinAlphabetNums } from "../../common/Utils";
import { presetThemes, presetCustomThemes } from "./themes.json";



/*
const PRESET_THEMES = [{
    id: 'dark',
    name: '默认1',
    color: '#555',
    hlColor: '#28c83f',
    dark: true
}, {
    id: 'white',
    name: '默认2',
    color: '#fafafa',
    hlColor: '#28c83f',
    dark: false
}, {
    id: 'light',
    name: '浅色',
    color: '#e7e1e3',
    hlColor: '#979193',
    dark: false
}, {
    id: 'pink',
    name: '粉色1',
    color: '#e667af',
    hlColor: '#e667af',
    dark: false
}, {
    id: 'pink2',
    name: '粉色2',
    color: '#fc589c',
    hlColor: '#fc589c',
    dark: false
}, {
    id: 'pink-red',
    name: '粉红',
    color: '#fc7688',
    hlColor: '#fff',
    dark: false
}, {
    id: 'red',
    name: '红色1',
    color: '#f9453f',
    hlColor: '#f9453f',
    dark: false
}, {
    id: 'red2',
    name: '红色2',
    color: '#d53943',
    hlColor: '#d53943',
    dark: false
}, {
    id: 'green',
    name: '绿色1',
    color: '#cfdec3',
    hlColor: '#64903f',
    dark: false
}, {
    id: 'green2',
    name: '绿色2',
    color: '#054a34',
    hlColor: '#e1e0a7',
    dark: true
}, {
    id: 'blue',
    name: '蓝色1',
    color: '#2783fb',
    hlColor: '#2783fb',
    dark: false
}, {
    id: 'blue2',
    name: '蓝色2',
    color: '#a8c5cb',
    hlColor: '#273b42',
    dark: false
}, {
    id: 'yellow',
    name: '黄色1',
    color: '#ffb300',
    hlColor: '#ffb300',
    dark: false
}, {
    id: 'yellow2',
    name: '黄色2',
    color: '#fc9b29',
    hlColor: '#fc9b29',
    dark: false
}, {
    id: 'purple',
    name: '紫色1',
    color: '#9c27b0',
    hlColor: '#9c27b0',
    dark: true
}, {
    id: 'purple2',
    name: '紫色2',
    color: '#4d3e72',
    hlColor: '#e5bc8c',
    dark: true
}]
*/
const THEME_ID_PREFIX = 'theme-'
const CUSTOM_DEMO_ID = 'CUSTDEMO'

export const useThemeStore = defineStore('themes', {
    state: () => ({
        customThemes: []
    }),
    getters: {

    },
    actions: {
        newThemeId(id) {
            const _id = id || randomTextWithinAlphabetNums(8)
            return THEME_ID_PREFIX + _id
        },
        getTheme(type, index) {
            index = index > 0 ? index : 0
            const allThemes = [presetThemes, this.customThemes]
            return allThemes[type][index]
        },
        getPresetThemes() {
            return presetThemes
        },
        getCustomThemes() {
            const demoTheme = presetCustomThemes[0]
            let index = this.customThemes.findIndex(item => (this.isDemoTheme(item)))
            index = Math.max(0, index)
            this.customThemes.splice(index, 1, demoTheme)
            return this.customThemes
        },
        getExportableThemes() {
            return this.getCustomThemes().filter(item => !item.id.includes(CUSTOM_DEMO_ID)) || []
        },
        isDemoTheme(theme) {
            if (!theme) return false
            const { id } = theme
            return id === CUSTOM_DEMO_ID 
                || id === (THEME_ID_PREFIX + CUSTOM_DEMO_ID)
        },
        saveCustomTheme(theme, forceNew) {
            if (!theme) return
            if (this.isDemoTheme(theme)) return
            const index = this.customThemes.findIndex(item => item.id == theme.id)
            const now = Date.now()
            if (forceNew || index < 0) {
                const id = this.newThemeId()
                Object.assign(theme, { id, created: now, updated: now })
                this.customThemes.push(theme)
            } else {
                const _theme = this.customThemes[index]
                Object.assign(_theme, { ...theme, updated: now })
            }
        },
        removeCustomTheme(theme) {
            if(!theme) return false
            if (this.isDemoTheme(theme)) return false
            const { id } = theme
            const index = this.customThemes.findIndex(item => item.id === id)
            if (index > -1) return this.customThemes.splice(index, 1)
            return false
        }
    },
    persist: {
        enabled: true,
        strategies: [{
            storage: localStorage,
            //paths: [ ]
        },]
    }
})