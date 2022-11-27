import { defineStore } from 'pinia';
import EventBus from '../../common/EventBus';
import { useIpcRenderer } from '../../common/Utils';

const ipcRenderer = useIpcRenderer()

const THEMES = [{
    id: 'dark',
    name: '默认1',
    color: '#313131',
    hlColor: '#28c83f',
    dark: true
}, {
    id: 'white',
    name: '默认2',
    //color: '#1ca388',
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
    //color: '#e667af',
    color: '#e667af',
    hlColor: '#e667af',
    dark: false
}, {
    id: 'pink2',
    name: '粉色2',
    //color: '#e667af',
    color: '#fc589c',
    hlColor: '#fc589c',
    dark: false
}, {
    id: 'pink-red',
    name: '粉红',
    //color: '#ef5350',
    color: '#fc7688',
    //hlColor: '#fc7688',
    hlColor: '#fff',
    dark: false
}, {
    id: 'red',
    name: '红色1',
    //color: '#ef5350',
    color: '#f9453f',
    hlColor: '#f9453f',
    dark: false
}, {
    id: 'red2',
    name: '红色2',
    //color: '#ef5350',
    color: '#d53943',
    hlColor: '#d53943',
    dark: false
}, {
    id: 'green',
    name: '绿色1',
    //color: '#1ca388',
    //color: '#28c83f',
    color: '#cfdec3',
    hlColor: '#323232',
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
    color: '#56ccf2',
    hlColor: '#42a5f5',
    dark: false
}, {
    id: 'blue2',
    name: '蓝色2',
    color: '#a8c5cb',
    hlColor: '#273b42',
    dark: false
},/*{
    id: 'blue3',
    name: '蓝色3',
    color: '#293581',
    hlColor: '#293581',
    dark: false
}, */ {
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
}, /*{
    id: 'purple3',
    name: '紫色3',
    color: '#5f3d70',
    hlColor: '#5f3d70',
    dark: true
} */]   

const QUALITIES = [{
    id: 'NQ',
    name: '普通'
}, {
    id: 'HQ',
    name: '高'
}, {
    id: 'SQ',
    name: '无损'
}]

//TODO 本地缓存导致Store State数据不一致
export const useSettingStore = defineStore('setting', {
    state: ()=> ({
        /* 主题 */
        theme: {
            index: 0,
        },
        layout: {
            index: 0,
        },
        common: {
            winZoom: 100,
            fontFamily: '',
            fontWeight: 400,
        },
        /* 播放歌曲 */
        track: {
            //音质级别：NQ(普通)、HQ（高音质）、SQ（超高、无损）
            quality: {
                index: 0,
            },  
            //VIP收费歌曲，是否自动切换到免费歌曲（可能来自不同平台），默认暂停播放
            vipTransfer: false,  
            //歌单分类栏随机显示
            categoryBarRandom: false, 
            //播放歌曲时，防止系统睡眠
            playingWithoutSleeping: false, 
        },
        /* 缓存 */
        cache: {
            storePlayState: true,  //退出后保存播放状态：包括当前歌曲、播放列表等
            storeLocalMusic: false, //退出后记录已经添加的本地歌曲
        },
        /* 菜单栏、系统托盘 */
        tray: {
            show: false, //是否在系统托盘显示
        },
        /* 导航栏 */
        navigation: {
            customPlaylistsShow: false,
            favoritePlaylistsShow: false,
            followArtistsShow: false,
        },
        /* 对话框 */
        dialog: {
            clearQueue: true,
            batchAdd: false,
            batchMove: true,
            batchDelete: true,
            restore: true,
            reset: true,
            quit: false,
        },
        /* 快捷键 */
        keys: {
            global: false, //是否全局（系统平台级别）快捷键
            data: [ {
                id: 'togglePlay',
                name: '播放 / 暂停',
                binding: 'Space',
                gBinding: 'Shift + Space'
            }, {
                id: 'togglePlayMode',
                name: '切换播放模式',
                binding: 'M',
                gBinding: 'Shift + M'
            }, {
                id: 'playPrev',
                name: '上一曲',
                binding: 'Left',
                gBinding: 'Shift + Left'
            }, {
                id: 'playNext',
                name: '下一曲',
                binding: 'Right',
                gBinding: 'Shift + Right'
            }, {
                id: 'volumeUp',
                name: '增加音量',
                binding: 'Up',
                gBinding: 'Shift + Up'
            }, {
                id: 'volumeDown',
                name: '减小音量',
                binding: 'Down',
                gBinding: 'Shift + Down'
            }, {
                id: 'volumeMuteOrMax',
                name: '静音 / 最大音量',
                binding: 'O',
                gBinding: 'Shift + O'
            }, {
                id: 'toggleSetting',
                name: '打开设置',
                binding: 'P',
                gBinding: 'Shift + P'
            }, {
                id: 'togglePlaybackQueue',
                name: '打开 / 关闭当前播放',
                binding: 'Q',
                gBinding: 'Shift + Q'
            } ]
        },
        /* 其他 */
        other: {

        },
        blackHole: null, //黑洞state，永远不需要持久化
    }),
    getters: {
        isPlaylistCategoryBarRandom(state) {
            return this.track.categoryBarRandom
        },
        isStorePlayStateBeforeQuit(state) {
            return this.cache.storePlayState
        },
        isStoreLocalMusicBeforeQuit(state) {
            return this.cache.storeLocalMusic
        },
        getWindowZoom() {
            return this.common.winZoom
        }
    },
    actions: {
        setThemeIndex(index) {
            this.theme.index = index
            //const themeId = THEMES[index].id
            //EventBus.emit("switchTheme", themeId)
        },
        setLayoutIndex(index) {
            this.layout.index = index
            EventBus.emit("app-layout")
        },
        getCurrentThemeId() {
            let index = this.theme.index
            index = index > 0 ? index : 0
            return THEMES[index].id
        },
        getCurrentThemeColor() {
            let index = this.theme.index
            index = index > 0 ? index : 0
            return THEMES[index].color
        },
        getCurrentThemeHlColor() {
            let index = this.theme.index
            index = index > 0 ? index : 0
            return THEMES[index].hlColor
        },
        setWindowZoom(value) {
            this.common.winZoom = value
            this.setupWindowZoom()
        },
        setTrackQualityIndex(index) {
            this.track.quality.index = index
        },
        toggleVipTransfer() {
            this.track.vipTransfer = !this.track.vipTransfer
        },
        toggleCategoryBarRandom() {
            this.track.categoryBarRandom = !this.track.categoryBarRandom
        },
        togglePlayingWithoutSleeping() {
            this.track.playingWithoutSleeping = !this.track.playingWithoutSleeping
            this.setupAppSuspension()
        },
        toggleTrayShow() {
            this.tray.show = !this.tray.show
            this.setupTray()
        },
        toggleCustomPlaylistsShow() {
            this.navigation.customPlaylistsShow = !this.navigation.customPlaylistsShow
        },
        toggleFavoritePlaylistsShow() {
            this.navigation.favoritePlaylistsShow = !this.navigation.favoritePlaylistsShow
        },
        toggleFollowArtistsShow() {
            this.navigation.followArtistsShow = !this.navigation.followArtistsShow
        },
        toggleKeysGlobal() {
            this.keys.global = !this.keys.global
            this.setupGlobalShortcut()
        },
        toggleStorePlayState() {
            this.cache.storePlayState = !this.cache.storePlayState
        },
        toggleStoreLocalMusic() {
            this.cache.storeLocalMusic = !this.cache.storeLocalMusic
        },
        resetKeys() {
            
        },
        setupWindowZoom() {
            const winZoom = this.common.winZoom
            if(ipcRenderer) ipcRenderer.send("app-zoom", winZoom)
            EventBus.emit("app-zoom", winZoom)
        }, 
        setupAppSuspension() {
            if(ipcRenderer) ipcRenderer.send("app-suspension", this.track.playingWithoutSleeping)
        },
        setupTray() {
            if(ipcRenderer) ipcRenderer.send("app-tray", this.tray.show)
        },
        setupGlobalShortcut() {
            if(ipcRenderer) ipcRenderer.send("app-globalShortcut", this.keys.global)
        },
        setupFontFamily() {
            EventBus.emit('setting-fontFamily', this.common.fontFamily)
        },
        setupFontWeight() {
            const weight = this.common.fontWeight || 400
            EventBus.emit('setting-fontWeight', weight)
        },
        updateBlackHole(value) {
            this.blackHole = value
        },
        allThemes () {
            return THEMES
        },
        allQualities() {
            return QUALITIES
        },
        setFontFamily(value) {
            const fontFamily = (value || '').trim()
            this.common.fontFamily = fontFamily
            this.setupFontFamily()
        },
        setFontWeight(value) {
            const weight = parseInt(value || 400)
            if(weight < 100 || weight > 1000) return
            this.common.fontWeight = weight
            this.setupFontWeight()
        },
    },
    persist: {
        enabled: true,
        strategies: [
            {
                //key: 'setting',
                storage: localStorage,
                paths: [ 'theme', 'layout', 'common', 'track', 'cache', 
                    'tray', 'navigation', 'dialog', 'keys' ]
            },
        ],
    },
})