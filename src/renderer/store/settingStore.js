import { defineStore } from 'pinia';
import EventBus from '../../common/EventBus';
import { useIpcRenderer } from '../../common/Utils';
import { useThemeStore } from './themeStore';
import { usePlatformStore } from './platformStore';
import { useAppCommonStore } from './appCommonStore';



const ipcRenderer = useIpcRenderer()

const TRACK_QUALITIES = [{
    id: 'standard',
    name: '标准'
}, {
    id: 'high',
    name: '高品'
}, {
    id: 'sq',
    name: '无损'
}, {
    id: 'hi-res',
    name: 'Hi-Res'
}]

const FONTSIZE_LEVELS = [{
    id: 'default',
    name: '默认',
    value: 15.5
}, {
    id: 'small',
    name: '小',
    value: 14.5
}, {
    id: 'standard',
    name: '标准',
    value: 15.5
}, {
    id: 'medium',
    name: '中等',
    value: 16.5
}, {
    id: 'large',
    name: '大',
    value: 17.5
}, {
    id: 'larger',
    name: '较大',
    value: 18.5
}, {
    id: 'largest',
    name: '更大',
    value: 19.5
}]

const IMAGE_QUALITIES = [{
    id: 'normal',
    name: '普通'
}, {
    id: 'medium',
    name: '中等'
}, {
    id: 'big',
    name: '高清'
}]

//TODO 本地缓存导致Store State数据不一致
export const useSettingStore = defineStore('setting', {
    state: () => ({
        /* 主题 */
        theme: {
            index: 1,
            //主题分类，0 => 推荐，1 => 自定义
            type: 0,
        },
        layout: {
            //当前index
            index: 1,
            //回退index，即从简约模式退出时，返回的普通布局index
            fallbackIndex: 1
        },
        common: {
            //窗口缩放
            winZoom: 85,
            //窗口控件风格，0 => 自动，1 => macOS, 2 => Windows
            winCtlStyle: 0,
            //字体名称
            fontFamily: '',
            //字体大小
            fontSize: 17.5,
            //预设字体大小等级index
            fontSizeLevel: 3,
            //字体粗细
            fontWeight: 400,
            //图片质量，0 => 普通，1 => 中等，2 => 高清
            imgQualityIndex: 1,
            //分页方式，0 => 普通，1 => 瀑布流
            paginationStyleIndex: 0,
            //歌单、专辑等Tile样式，0 => 普通，1 => 卡片
            imageTextTileStyleIndex: 1,
            //卡片Tile样式阴影效果
            shadowForCardStyleTile: true,
        },
        modules: {  //功能模块
            off: {  //关闭列表
                playlists: [],
                artists: [],
                radios: [],
                search: []
            }
        },
        /* 播放歌曲 */
        track: {
            //音频输出设备
            audioOutputDeviceId: null,
            //音质
            quality: {
                index: 0,
            },
            //VIP收费歌曲，是否自动切换到免费歌曲（可能来自不同平台）
            vipTransfer: true,
            //VIP标识，无用之物
            vipFlagShow: false,
            //歌单分类栏随机显示
            playlistCategoryBarRandom: false,
            //歌单分类浮动按钮
            playlistCategoryBarFlowBtnShow: false,
            //当前播放列表自动定位
            playbackQueueAutoPositionOnShow: false,
            //关闭按钮，Electron平台兼容性问题，主要为Windows等平台冗余设计
            playbackQueueCloseBtnShow: false,
            //定位按钮
            playbackQueuePositionBtnShow: true,
            //历史播放按钮，即最近播放快捷入口
            playbackQueueHistoryBtnShow: true,
            //MV标识、MV播放按钮
            playbackQueueMvBtnShow: true,
            //批量操作按钮
            playbackQueueBatchActionBtnShow: true,
            //歌单播放量
            //listenNumShow: false,
            playCountShow: false,
            //视频播放时，自动暂停播放歌曲
            pauseOnPlayingVideo: true,
            //视频播放退出后，自动继续播放歌曲
            resumePlayAfterVideo: true,
            //视频播完后，自动关闭视频播放页面
            quitVideoAfterEnded: true,
            //播放歌曲时，防止系统睡眠
            playingWithoutSleeping: true,
            //歌曲进度更新频度，默认为60，范围：1 - 1024
            stateRefreshFrequency: 60,
            //歌曲频谱刷新频度，默认为3，范围：1 - 256
            spectrumRefreshFrequency: 3,
            /* 本地歌曲 */
            //启用在线封面
            useOnlineCover: true,
            //显示音频格式
            audioTypeFlagShow: false,
            //扫描目录时，启用深度遍历
            useDeeplyScanForDirectory: true,
            //启用Dnd操作，创建本地歌单
            useDndForCreateLocalPlaylist: true,
            //启用Dnd操作，为本地歌单添加歌曲
            useDndForAddLocalTracks: true,
            //普通分页，本地歌曲每页记录数
            limitPerPageForLocalPlaylist: 30,
            //高亮当前右键菜单对应的歌曲
            highlightCtxMenuItem: true,
            //拖拽保存
            dndSave: false, 
            dndSavePath: null, 
            //播放页封面图片背景效果
            playingViewUseBgCoverEffect: false,
        },
        search: {
            //场景化提示
            autoPlaceholder: true,
            //在线歌单页
            onlinePlaylistShow: true,
            //本地歌单页
            localPlaylistShow: true,
            //批量操作页
            batchActionShow: true,
            //自由FM
            freeFMShow: true,
            //插件管理
            pluginsViewShow: true
        },
        /* 普通歌词 */
        lyric: {
            //普通行字号
            fontSize: 24,
            //高亮行字号
            hlFontSize: 25,
            //字重，即字体粗细
            fontWeight: 400,
            //行高
            lineHeight: 33,
            //行间距
            lineSpacing: 28,
            //时间补偿值，快慢
            offset: 0,
            //歌曲信息, 0 => 默认, 1 => 隐藏, 2 => 顶部
            metaPos: 0,
            //对齐方式, 0 => 左, 1 => 中, 2 => 右
            alignment: 0,
            //翻译
            trans: true,
            //发音 
            roma: true
        },
        /* 桌面歌词 */
        desktopLyric: {
            //普通行字号
            fontSize: 23,
            /*
            //高亮行字号
            hlFontSize: 30, 
            fontWeight: 400,
            lineHeight: 36,
            */
            //行间距
            lineSpacing: 23,
            //对齐方式, 0 => 左, 1 => 中, 2 => 右, 3 => 左、右分开（双行模式）
            alignment: 1,
            // 显示模式（布局），0 => 单行， 1 => 双行, 2 => 全显
            layoutMode: 0,
            //普通行颜色
            color: null,
            //高亮行颜色
            hlColor: null,
            //已废弃，窗口自动高度，跟随显示模式
            autoHeight: true,
            //窗口自动大小，跟随显示模式
            autoSize: true,
            //文字显示方向，0 => 横屏，1 => 竖屏   
            textDirection: 0,
        },
        /* 缓存 */
        cache: {
            //退出后保存播放状态：包括当前歌曲、播放列表等
            storePlayState: true,
            //退出后记录已经添加的本地歌曲
            storeLocalMusic: true,
            //记录最近播放
            storeRecentPlay: true,
        },
        /* 菜单栏、Windows平台为系统托盘 */
        tray: {
            //是否在菜单栏显示
            show: false,
            //是否最小化到菜单栏
            showOnMinimized: false,
        },
        /* 导航栏 */
        navigation: {
            /* 左侧导航 */
            //自建歌单
            customPlaylistsShow: false,
            //我的收藏
            favoritePlaylistsShow: false,
            //我关注的歌手
            followArtistsShow: false,
            /* 顶部导航*/
            //相约电波模式按钮
            radioModeShortcut: true,
            //功能管理按钮
            modulesSettingShortcut: false,
            //插件管理按钮
            pluginsSettingShortcut: true,
            //主题按钮
            themesShortcut: true,
            //我的主页按钮
            userHomeShortcut: true,
            //简约布局按钮
            simpleLayoutShortcut: true,
        },
        /* 对话框 */
        dialog: {
            //批量删除
            batchDelete: true,
            //删除创建的歌单
            deleteCustomPlaylist: true,
            //清空最近播放
            clearRecents: true,
            //清空当前播放（列表）
            clearPlaybackQueue: true,
            //恢复默认设置
            resetSetting: true,
            //清空本地歌曲
            clearLocalMusics: true,
            //清空自由FM
            clearFreeFM: true,
            //访问插件官网链接
            visitPluginRepository: true,
            //删除插件
            deletePlugins: true,
        },
        /* 快捷键，可修改 */
        keys: {
            //是否全局（系统平台级别）快捷键
            global: false,
        },
        /* 快捷键 - 默认值，只读 */
        keysDefault: {
            data: [{
                id: 'visitShortcutKeys',
                name: '查看快捷键设置',
                binding: 'K',
                gBinding: 'Alt + Shift + K'
            }, {
                id: 'togglePlay',
                name: '播放 / 暂停',
                binding: 'Space',
                gBinding: 'Alt + Shift + Space'
            }, {
                id: 'togglePlayMode',
                name: '切换播放模式',
                binding: 'M',
                gBinding: 'Alt + Shift + M'
            }, {
                id: 'playPrev',
                name: '上一曲',
                binding: 'Left',
                gBinding: 'Alt + Shift + Left'
            }, {
                id: 'playNext',
                name: '下一曲',
                binding: 'Right',
                gBinding: 'Alt + Shift + Right'
            }, {
                id: 'volumeUp',
                name: '增加音量',
                binding: 'Up',
                gBinding: 'Alt + Shift + Up'
            }, {
                id: 'volumeDown',
                name: '减小音量',
                binding: 'Down',
                gBinding: 'Alt + Shift + Down'
            }, {
                id: 'volumeMuteOrMax',
                name: '静音 / 最大音量',
                binding: 'O',
                gBinding: 'Alt + Shift + O'
            }, {
                id: 'toggleSetting',
                name: '打开设置',
                binding: 'P',
                gBinding: 'Alt + Shift + P'
            }, {
                id: 'togglePlaybackQueue',
                name: '打开 / 关闭当前播放',
                binding: 'Q',
                gBinding: 'Alt + Shift + Q'
            }, {
                id: 'toggleLyricToolbar',
                name: '打开 / 关闭歌词设置',
                binding: 'L',
                gBinding: 'Alt + Shift + L'
            }, {
                id: 'visitThemes',
                name: '打开主题页',
                binding: 'T',
                gBinding: 'Alt + Shift + T'
            }, {
                id: 'visitUserHome',
                name: '打开我的主页',
                binding: 'H',
                gBinding: 'Alt + Shift + H'
            }, {
                id: 'visitModulesSetting',
                name: '打开功能管理',
                binding: 'G',
                gBinding: 'Alt + Shift + G'
            }, {
                id: 'visitPlugins',
                name: '打开插件管理',
                binding: 'U',
                gBinding: 'Alt + Shift + U'
            }, {
                id: 'quickSearch',
                name: '快速打开搜索',
                binding: 'S',
                gBinding: 'Ctrl + Alt + Shift + S'
            },{
                id: 'visitRecents',
                name: '打开最近播放',
                binding: 'R',
                gBinding: 'Alt + Shift + R'
            },{
                id: 'togglePlayingThemes',
                name: '打开 / 关闭播放样式',
                binding: 'V',
                gBinding: 'Alt + Shift + V'
            },{
                id: 'resetSetting',
                name: '恢复默认设置',
                binding: 'Ctrl + P',
                gBinding: 'Ctrl + Alt + Shift + P'
            }]
        },
        /* 网络 */
        network: {
            httpProxy: {
                enable: false,
                host: null,
                port: 80,
                username: null,
                password: null
            },
            socksProxy: {
                enable: false,
                host: null,
                port: 80,
                username: null,
                password: null
            }
        },
        /* 其他 */
        others: {
            //版本 - 检查更新时，是否忽略开发预览版
            checkPreReleaseVersion: true
        },
        //“黑洞 ”state，永远不需要持久化
        //仅用于触发某些机制，但现在暂时已经用处不大啦
        blackHole: null,
    }),
    getters: {
        isVipTransferEnable() {
            return this.track.vipTransfer
        },
        isPlaylistCategoryBarRandom() {
            return this.track.playlistCategoryBarRandom
        },
        isPlaylistCategoryBarFlowBtnShow() {
            return this.track.playlistCategoryBarFlowBtnShow
        },
        isStorePlayStateBeforeQuit(state) {
            return this.cache.storePlayState
        },
        isStoreLocalMusicBeforeQuit(state) {
            return this.cache.storeLocalMusic
        },
        isStoreRecentPlay() {
            return this.cache.storeRecentPlay
        },
        isDefaultLayout() { //默认布局，目前包含2种
            const index = this.layout.index
            return index == 0 || index == 1
        },
        isDefaultOldLayout() {  //旧版布局，第一个版本发布时的布局
            return this.layout.index == 0
        },
        isDefaultClassicLayout() {
            return this.layout.index == 1
        },
        isSimpleLayout() {
            return this.layout.index == 2
        },
        getWindowZoom() {
            return this.common.winZoom
        },
        isUseAutoWinCtl() {
            return this.common.winCtlStyle == 0
        },
        isUseMacOSWinCtl() {
            return this.common.winCtlStyle == 1
        },
        isUseWindowsWinCtl() {
            return this.common.winCtlStyle == 2
        },
        isPlayCountShow() {
            //listenNumShow为旧版本名称
            return this.track.playCountShow || this.track.listenNumShow
        },
        lyricMetaPos() {
            return this.lyric.metaPos
        },
        lyricTransActived() {
            return this.lyric.trans
        },
        lyricRomaActived() {
            return this.lyric.roma
        },
        isHttpProxyEnable() {
            return this.network.httpProxy.enable
        },
        isSocksProxyEnable() {
            return this.network.socksProxy.enable
        },
        isRadioModeShortcutEnable() {
            return this.navigation.radioModeShortcut
        },
        isModulesSettingShortcutEnable() {
            return this.navigation.modulesSettingShortcut
        },
        isPluginsSettingShortcutEnable() {
            return this.navigation.pluginsSettingShortcut
        },
        isThemesShortcutEnable() {
            return this.navigation.themesShortcut
        },
        isUserHomeShortcutEnable() {
            return this.navigation.userHomeShortcut
        },
        isSimpleLayoutShortcutEnable() {
            return this.navigation.simpleLayoutShortcut
        },
        isPlaybackQueueAutoPositionOnShow() {
            return this.track.playbackQueueAutoPositionOnShow
        },
        isPlaybackQueueCloseBtnShow() {
            return this.track.playbackQueueCloseBtnShow
        },
        isPlaybackQueuePositionBtnShow() {
            return this.track.playbackQueuePositionBtnShow
        },
        isPlaybackQueueHistoryBtnShow() {
            return this.track.playbackQueueHistoryBtnShow
        },
        isPlaybackQueueMvBtnShow() {
            return this.track.playbackQueueMvBtnShow
        },
        isPlaybackQueueBatchActionBtnShow() {
            return this.track.playbackQueueBatchActionBtnShow
        },
        isHideToTrayOnMinimized() {
            return this.tray.showOnMinimized
        },
        currentTheme() {
            return this.getCurrentTheme()
        },
        isPauseOnPlayingVideoEnable() {
            return this.track.pauseOnPlayingVideo
        },
        isResumePlayAfterVideoEnable() {
            return this.track.resumePlayAfterVideo
        },
        isQuitVideoAfterEndedEnable() {
            return this.track.quitVideoAfterEnded
        },
        isUseOnlineCoverEnable() {
            return this.track.useOnlineCover
        },
        isUseDeeplyScanForDirectoryEnable() {
            return this.track.useDeeplyScanForDirectory
        },
        isUseDndForCreateLocalPlaylistEnable() {
            return this.track.useDndForCreateLocalPlaylist
        }
        ,
        isUseDndForAddLocalTracksEnable() {
            return this.track.useDndForAddLocalTracks
        },
        getLimitPerPageForLocalPlaylist() {
            return this.track.limitPerPageForLocalPlaylist
        },
        isAudioTypeFlagShowEnable() {
            return this.track.audioTypeFlagShow
        },
        isSearchBarAutoPlaceholderEnable() {
            return this.search.autoPlaceholder
        },
        isSearchForOnlinePlaylistShow() {
            return this.search.onlinePlaylistShow
        },
        isSearchForLocalPlaylistShow() {
            return this.search.localPlaylistShow
        },
        isSearchForBatchActionShow() {
            return this.search.batchActionShow
        },
        isSearchForFreeFMShow() {
            return this.search.freeFMShow
        },
        isSearchForPluginsViewShow() {
            return this.search.pluginsViewShow
        },
        isShowDialogBeforeBatchDelete() {
            return this.dialog.batchDelete
        },
        isShowDialogBeforeDeleteCustomPlaylist() {
            return this.dialog.deleteCustomPlaylist
        },
        isShowDialogBeforeClearRecents() {
            return this.dialog.clearRecents
        },
        isShowDialogBeforeClearPlaybackQueue() {
            return this.dialog.clearPlaybackQueue
        },
        isShowDialogBeforeResetSetting() {
            return this.dialog.resetSetting
        },
        isShowDialogBeforeClearLocalMusics() {
            return this.dialog.clearLocalMusics
        },
        isShowDialogBeforeClearFreeFM() {
            return this.dialog.clearFreeFM
        },
        isShowDialogBeforeVisitPluginRepository() {
            return this.dialog.visitPluginRepository
        },
        isShowDialogBeforeDeletePlugins() {
            return this.dialog.deletePlugins
        },
        isCheckPreReleaseVersion() {
            return this.others.checkPreReleaseVersion
        },
        isModulesPlaylistsOff() {
            return (platform) => {
                return this.modules.off.playlists.includes(platform)
            }
        },
        isModulesArtistsOff() {
            return (platform) => {
                return this.modules.off.artists.includes(platform)
            }
        },
        isModulesRadiosOff() {
            return (platform) => {
                return this.modules.off.radios.includes(platform)
            }
        },
        isModulesSearchOff() {
            return (platform) => {
                return this.modules.off.search.includes(platform)
            }
        },
        filterActiveModulesPlatforms() {
            return (platforms, scope) => {
                if (!platforms || platforms.length < 1) return []
                const offPlatforms = this.modules.off[scope]
                return platforms.filter(item => (!offPlatforms || !offPlatforms.includes(item.code || item)))
            }
        },
        isHighlightCtxMenuItemEnable() {
            return this.track.highlightCtxMenuItem
        },
        getPaginationStyleIndex() {
            return this.common.paginationStyleIndex
        },
        isUseCardStyleImageTextTile() {
            return this.common.imageTextTileStyleIndex == 1
        },
        selectedAudioOutputDeviceId() {
            return this.track.audioOutputDeviceId
        },
        isDndSaveEnable() {
            return this.track.dndSave
        },
        isPlayingViewUseBgCoverEffect() {
            return this.track.playingViewUseBgCoverEffect
        },
        isUseShadowForCardStyleTile() {
            return this.common.shadowForCardStyleTile
        }
    },
    actions: {
        setThemeIndex(index, type) {
            this.theme.index = index || 0
            this.theme.type = type || 0
            //const themeId = THEMES[index].id
            //EventBus.emit("switchTheme", themeId)
        },
        setLayoutIndex(index) {
            this.layout.index = index || 0
            const currentIndex = this.layout.index
            if (currentIndex < 2) this.layout.fallbackIndex = currentIndex
            EventBus.emit("app-layout")
        },
        switchToFallbackLayout() {
            this.setLayoutIndex(this.layout.fallbackIndex)
            this.setupWindowZoom()
        },
        presetThemes() {
            const { getPresetThemes } = useThemeStore()
            return getPresetThemes()
        },
        getCurrentTheme() {
            const { getTheme } = useThemeStore()
            const { type, index } = this.theme
            return getTheme(type, index)
        },
        isCurrentTheme(theme) {
            if (!theme || !theme.id) return false
            const current = this.getCurrentTheme()
            return current.id === theme.id
        },
        getCurrentThemeHighlightColor() {
            const { getTheme } = useThemeStore()
            const { type, index } = this.theme
            return getTheme(type, index).content.highlightColor
        },
        getCurrentThemeContentBgColor() {
            const { getTheme } = useThemeStore()
            const { type, index } = this.theme
            return getTheme(type, index).content.bgColor
        },
        setWindowZoom(value) {
            if (!value) return
            const zoom = Number(value || 85)
            if (zoom < 50 || zoom > 300) return
            if (this.common.winZoom == zoom) return
            this.common.winZoom = zoom
            this.setupWindowZoom()
        },
        setWindowCtlStyle(value) {
            const index = parseInt(value || 0)
            if (index < 0 || index > 2) return
            this.common.winCtlStyle = index
        },
        currentFontSize() {
            return this.common.fontSize
        },
        setFontSize(fontSize, byPresetLevel) {
            fontSize = Number(fontSize || 17.5)
            if (fontSize < 10 || fontSize > 25) return
            this.common.fontSize = fontSize
            if (!byPresetLevel) { //使用预设大小时，自动更新预设大小等级
                const levels = this.allFontSizeLevels()
                let index = -1
                for (var i = 0; i < levels.length; i++) {
                    if (levels[i].value == fontSize) {
                        index = i
                        break
                    }
                }
                this.common.fontSizeLevel = index
            }
            EventBus.emit('setting-fontSize', this.common.fontSize)
        },
        allFontSizeLevels() {
            return FONTSIZE_LEVELS.slice(1)
        },
        currentFontSizeLevel() {
            return this.common.fontSizeLevel
        },
        setFontSizeLevel(index) {
            this.common.fontSizeLevel = index
            const currentLevel = this.allFontSizeLevels()[index]
            if (currentLevel) this.setFontSize(currentLevel.value, true)
            //EventBus.emit('setting-fontSizeLevel', this.common.fontSizeLevel)
        },
        allImageQualities() {
            return IMAGE_QUALITIES
        },
        getImageQualityIndex() {
            return this.common.imgQualityIndex
        },
        setImageQualityIndex(index) {
            index = Math.max(index, 0)
            index = Math.min(index, IMAGE_QUALITIES.length - 1)
            this.common.imgQualityIndex = index
        },
        getImageUrlByQuality(urls) {
            if (!urls || urls.length < 1) return null
            let result = null, count = 0
            let index = this.getImageQualityIndex()
            do {
                result = urls[index]
                if (result) break
                index = ++index % urls.length
            } while (++count < urls.length)
            return result
        },
        setPaginationStyleIndex(index) {
            this.common.paginationStyleIndex = index
        },
        toggleDndSave() {
            this.track.dndSave = !this.track.dndSave
        },
        getDndSavePath() {
            return this.track.dndSavePath
        },
        setDndSavePath(path) {
            this.track.dndSavePath = path
        },
        setTrackQualityIndex(index) {
            this.track.quality.index = index
        },
        toggleVipTransfer() {
            this.track.vipTransfer = !this.track.vipTransfer
        },
        toggleCategoryBarRandom() {
            this.track.playlistCategoryBarRandom = !this.track.playlistCategoryBarRandom
        },
        togglePlaylistCategoryBarFlowBtnShow() {
            this.track.playlistCategoryBarFlowBtnShow = !this.track.playlistCategoryBarFlowBtnShow
        },
        togglePauseOnPlayingVideo() {
            this.track.pauseOnPlayingVideo = !this.track.pauseOnPlayingVideo
        },
        toggleResumePlayAfterVideo() {
            this.track.resumePlayAfterVideo = !this.track.resumePlayAfterVideo
        },
        toggleQuitVideoAfterEnded() {
            this.track.quitVideoAfterEnded = !this.track.quitVideoAfterEnded
        },
        togglePlayingWithoutSleeping() {
            this.track.playingWithoutSleeping = !this.track.playingWithoutSleeping
            this.setupAppSuspension()
        },
        togglePlaybackQueueAutoPositionOnShow() {
            this.track.playbackQueueAutoPositionOnShow = !this.track.playbackQueueAutoPositionOnShow
        },
        togglePlaybackQueueCloseBtnShow() {
            this.track.playbackQueueCloseBtnShow = !this.track.playbackQueueCloseBtnShow
        },
        togglePlaybackQueuePositionBtnShow() {
            this.track.playbackQueuePositionBtnShow = !this.track.playbackQueuePositionBtnShow
        },
        togglePlaybackQueueHistoryBtnShow() {
            this.track.playbackQueueHistoryBtnShow = !this.track.playbackQueueHistoryBtnShow
        },
        togglePlaybackQueueMvBtnShow() {
            this.track.playbackQueueMvBtnShow = !this.track.playbackQueueMvBtnShow
        },
        togglePlaybackQueueBatchActionBtnShow() {
            this.track.playbackQueueBatchActionBtnShow = !this.track.playbackQueueBatchActionBtnShow
        },
        togglePlayCountShow() {
            this.track.playCountShow = !this.track.playCountShow
        },
        toggleVipFlagShow() {
            this.track.vipFlagShow = !this.track.vipFlagShow
        },
        toggleHightlightCtxMenuItem() {
            this.track.highlightCtxMenuItem = !this.track.highlightCtxMenuItem
        },
        setStateRefreshFrequency(value) {
            const freq = parseInt(value || 60)
            if (freq < 1 || freq > 1024) return
            this.track.stateRefreshFrequency = freq
            this.setupStateRefreshFrequency()
        },
        setSpectrumRefreshFrequency(value) {
            const freq = parseInt(value || 3)
            if (freq < 1 || freq > 256) return
            this.track.spectrumRefreshFrequency = freq
            this.setupSpectrumRefreshFrequency()
        },
        setImageTextTileStyleIndex(value) {
            const index = parseInt(value || 0)
            if (index < 0 || index > 1) return
            this.common.imageTextTileStyleIndex = index
        },
        toggleUseShadowForCardStyleTile() {
            this.common.shadowForCardStyleTile = !this.common.shadowForCardStyleTile
        },
        toggleUseOnlineCover() {
            this.track.useOnlineCover = !this.track.useOnlineCover
        },
        toggleAudioTypeFlagShow() {
            this.track.audioTypeFlagShow = !this.track.audioTypeFlagShow
        },
        toggleUseDeeplyScanForDirectory() {
            this.track.useDeeplyScanForDirectory = !this.track.useDeeplyScanForDirectory
        },
        toggleUseDndForCreateLocalPlaylist() {
            this.track.useDndForCreateLocalPlaylist = !this.track.useDndForCreateLocalPlaylist
        },
        toggleUseDndForAddLocalTracks() {
            this.track.useDndForAddLocalTracks = !this.track.useDndForAddLocalTracks
        },
        setLimitPerPageForLocalPlaylist(value) {
            value = parseInt(value || 30)
            if (value < 10 || value > 200) return
            this.track.limitPerPageForLocalPlaylist = value
        },
        toggleSearchBarAutoPlaceholder() {
            this.search.autoPlaceholder = !this.search.autoPlaceholder
            if (!this.search.autoPlaceholder) {
                const { setSearchPlaceHolderIndex } = useAppCommonStore()
                setSearchPlaceHolderIndex(0)
            }
        },
        toggleSearchForOnlinePlaylistShow() {
            this.search.onlinePlaylistShow = !this.search.onlinePlaylistShow
        },
        toggleSearchForLocalPlaylistShow() {
            this.search.localPlaylistShow = !this.search.localPlaylistShow
        },
        toggleSearchForBatchActionShow() {
            this.search.batchActionShow = !this.search.batchActionShow
        },
        toggleSearchForFreeFMShow() {
            this.search.freeFMShow = !this.search.freeFMShow
        },
        toggleSearchForPluginsViewShow() {
            this.search.pluginsViewShow = !this.search.pluginsViewShow
        },
        toggleTrayShow() {
            this.tray.show = !this.tray.show
            this.setupTray()
        },
        toggleTrayShowOnMinimized() {
            this.tray.showOnMinimized = !this.tray.showOnMinimized
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
        toggleRadioModeShortcut() {
            this.navigation.radioModeShortcut = !this.navigation.radioModeShortcut
        },
        toggleModulesSettingShortcut() {
            this.navigation.modulesSettingShortcut = !this.navigation.modulesSettingShortcut
        },
        togglePluginsSettingShortcut() {
            this.navigation.pluginsSettingShortcut = !this.navigation.pluginsSettingShortcut
        },
        toggleThemesShortcut() {
            this.navigation.themesShortcut = !this.navigation.themesShortcut
        },
        toggleUserHomeShortcut() {
            this.navigation.userHomeShortcut = !this.navigation.userHomeShortcut
        },
        toggleSimpleLayoutShortcut() {
            this.navigation.simpleLayoutShortcut = !this.navigation.simpleLayoutShortcut
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
        toggleStoreRecentPlay() {
            this.cache.storeRecentPlay = !this.cache.storeRecentPlay
        },
        setupWindowZoom(noResize) {
            const zoom = this.common.winZoom
            if (ipcRenderer) ipcRenderer.send("app-zoom", { zoom, noResize })
            EventBus.emit("app-zoom", zoom)
        },
        setupAppSuspension() {
            if (ipcRenderer) ipcRenderer.send("app-suspension", this.track.playingWithoutSleeping)
        },
        setupTray() {
            if (ipcRenderer) ipcRenderer.send("app-tray", this.tray.show)
        },
        setupGlobalShortcut() {
            if (ipcRenderer) ipcRenderer.send("app-globalShortcut", this.keys.global)
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
        allQualities() {
            return TRACK_QUALITIES
        },
        resolveFont(value, noWrap) {
            value = (value || '').trim()
            value = value.replace(/'/g, '').replace(/"/g, '')
            if (value.includes(" ") && !noWrap) value = '"' + value + '"'
            return value
        },
        //TODO 算法有问题
        formatFontFamily(value) {
            let fontFamily = (value || '').trim()
            const fonts = fontFamily.split(',')
            if (fonts.length > 1) {
                let temp = ''
                fonts.reduce((prev, curr) => {
                    temp = temp + "," + this.resolveFont(prev) + "," + this.resolveFont(curr)
                    temp = temp.trim()
                })
                fontFamily = temp.substring(1).replaceAll(",,", ",")
            } else {
                fontFamily = this.resolveFont(fontFamily)
            }
            return fontFamily
        },
        setFontFamily(value) {
            this.common.fontFamily = this.formatFontFamily(value)
            this.setupFontFamily()
        },
        setFontWeight(value) {
            const weight = parseInt(value || 400)
            if (weight < 100 || weight > 1000) return
            this.common.fontWeight = weight
            this.setupFontWeight()
        },
        setLyricFontSize(value) {
            const fontSize = parseInt(value || 24)
            if (fontSize < 10 || fontSize > 100) return
            this.lyric.fontSize = fontSize
            this.setupLyricFontSize()
        },
        setLyricHighlightFontSize(value) {
            const fontSize = parseInt(value || 25)
            if (fontSize < 10 || fontSize > 100) return
            this.lyric.hlFontSize = fontSize
            this.setupLyricHighlightFontSize()
        },
        setLyricFontWeight(value) {
            const weight = parseInt(value || 400)
            if (weight < 100 || weight > 1000) return
            this.lyric.fontWeight = weight
            this.setupLyricFontWeight()
        },
        setLyricLineHeight(value) {
            const lineHeight = parseInt(value || 33)
            if (lineHeight < 10 || lineHeight > 168) return
            this.lyric.lineHeight = lineHeight
            this.setupLyricLineHeight()
        },
        setLyricLineSpacing(value) {
            const lineSpacing = parseInt(value || 28)
            if (lineSpacing < 0 || lineSpacing > 100) return
            this.lyric.lineSpacing = lineSpacing
            this.setupLyricLineSpacing()
        },
        setLyricOffset(value) {
            const offset = parseInt(value || 0)
            this.lyric.offset = offset
            this.setupLyricOffset()
        },
        setLyricMetaPos(value) {
            this.lyric.metaPos = value || 0
            this.setupLyricMetaPos()
        },
        setLyricAlignment(value) {
            this.lyric.alignment = value || 0
            this.setupLyricAlignment()
        },
        resetLyricSetting() {
            this.setLyricFontSize()
            this.setLyricHighlightFontSize()
            this.setLyricLineHeight()
            this.setLyricLineSpacing()
            this.setLyricFontWeight()
            this.setLyricOffset()
            this.setLyricMetaPos()
            this.setLyricAlignment()
        },
        setupLyricFontSize() {
            const fontSize = this.lyric.fontSize || 24
            EventBus.emit('lyric-fontSize', fontSize)
        },
        setupLyricHighlightFontSize() {
            const fontSize = this.lyric.hlFontSize || 25
            EventBus.emit('lyric-hlFontSize', fontSize)
        },
        setupLyricFontWeight() {
            const fontWeight = this.lyric.fontWeight || 400
            EventBus.emit('lyric-fontWeight', fontWeight)
        },
        setupLyricLineHeight() {
            const lineHeight = this.lyric.lineHeight || 33
            EventBus.emit('lyric-lineHeight', lineHeight)
        },
        setupLyricLineSpacing() {
            const lineSpacing = this.lyric.lineSpacing || 28
            EventBus.emit('lyric-lineSpacing', lineSpacing)
        },
        setupLyricOffset() {
            const offset = this.lyric.offset || 0
            EventBus.emit('lyric-offset', offset)
        },
        setupLyricMetaPos() {
            const metaPos = this.lyric.metaPos || 0
            EventBus.emit('lyric-metaPos', metaPos)
        },
        setupLyricAlignment() {
            const alignment = this.lyric.alignment || 0
            EventBus.emit('lyric-alignment', alignment)
        },
        toggleLyricTrans() {
            this.lyric.trans = !this.lyric.trans
        },
        toggleLyricRoma() {
            this.lyric.roma = !this.lyric.roma
        },
        toggleHttpProxy() {
            this.network.httpProxy.enable = !this.network.httpProxy.enable
        },
        setHttpProxy(host, port, username, password) {
            this.network.httpProxy.host = host
            this.network.httpProxy.port = parseInt(port) || 80
            this.network.httpProxy.username = username
            this.network.httpProxy.password = password
        },
        resetHttpProxy() {
            this.network.httpProxy.enable = false
            this.setHttpProxy(null, 80, null, null)
        },
        toggleSocksProxy() {
            this.network.socksProxy.enable = !this.network.socksProxy.enable
        },
        setSocksProxy(host, port, username, password) {
            this.network.socksProxy.host = host
            this.network.socksProxy.port = parseInt(port) || 80
            this.network.socksProxy.username = username
            this.network.socksProxy.password = password
        },
        resetSocksProxy() {
            this.network.socksProxy.enable = false
            this.setSocksProxy(null, 80, null, null)
        },
        resetProxies() {
            this.resetHttpProxy()
            this.resetSocksProxy()
        },
        setupAppGlobalProxy() {
            const proxy = { http: null, socks: null }
            if (this.isHttpProxyEnable) {
                const { host, port, username, password } = this.network.httpProxy
                Object.assign(proxy, { http: { host, port, username, password } })
            }
            if (this.isSocksProxyEnable) {
                const { host, port, username, password } = this.network.socksProxy
                Object.assign(proxy, { socks: { host, port, username, password } })
            }
            if (ipcRenderer) ipcRenderer.send('app-setGlobalProxy', proxy)
        },
        setupStateRefreshFrequency() {
            EventBus.emit('track-stateRefreshFrequency', this.track.stateRefreshFrequency || 60)
        },
        setupSpectrumRefreshFrequency() {
            EventBus.emit('track-spectrumRefreshFrequency', this.track.spectrumRefreshFrequency || 3)
        },
        getStateRefreshFrequency() {
            return this.track.stateRefreshFrequency
        },
        toggleShowDialogBeforeBatchDelete() {
            this.dialog.batchDelete = !this.dialog.batchDelete
        },
        toggleShowDialogBeforeCustomPlaylistDelete() {
            this.dialog.deleteCustomPlaylist = !this.dialog.deleteCustomPlaylist
        },
        toggleShowDialogBeforeClearRecents() {
            this.dialog.clearRecents = !this.dialog.clearRecents
        },
        toggleShowDialogBeforeClearPlaybackQueue() {
            this.dialog.clearPlaybackQueue = !this.dialog.clearPlaybackQueue
        },
        toggleShowDialogBeforeResetSetting() {
            this.dialog.resetSetting = !this.dialog.resetSetting
        },
        toggleShowDialogBeforeClearLocalMusics() {
            this.dialog.clearLocalMusics = !this.dialog.clearLocalMusics
        },
        toggleShowDialogBeforeClearFreeFM() {
            this.dialog.clearFreeFM = !this.dialog.clearFreeFM
        },
        toggleShowDialogBeforeVisitPluginRepository() {
            this.dialog.visitPluginRepository = !this.dialog.visitPluginRepository
        },
        toggleShowDialogBeforeDeletePlugins() {
            this.dialog.deletePlugins = !this.dialog.deletePlugins
        },
        toggleCheckPreReleaseVersion() {
            this.others.checkPreReleaseVersion = !this.others.checkPreReleaseVersion
        },
        toggleModulesPlatformOff(module, platform) {
            if (!module || !platform) return
            const index = module.findIndex(item => (item === platform))
            if (index < 0) {
                module.push(platform)
            } else {
                module.splice(index, 1)
            }
        },
        toggleModulesPlaylistsOff(platform) {
            this.toggleModulesPlatformOff(this.modules.off.playlists, platform)
            const { activePlatforms } = usePlatformStore()
            const { setExploreModeActiveState } = useAppCommonStore()
            setExploreModeActiveState(0, activePlatforms('playlists').length > 0)
        },
        toggleModulesArtistsOff(platform) {
            this.toggleModulesPlatformOff(this.modules.off.artists, platform)
            const { activePlatforms } = usePlatformStore()
            const { setExploreModeActiveState } = useAppCommonStore()
            setExploreModeActiveState(1, activePlatforms('artists').length > 0)
        },
        toggleModulesRadiosOff(platform) {
            this.toggleModulesPlatformOff(this.modules.off.radios, platform)
            const { activePlatforms } = usePlatformStore()
            const { setExploreModeActiveState } = useAppCommonStore()
            setExploreModeActiveState(2, activePlatforms('radios').length > 0)
        },
        toggleModulesSearchOff(platform) {
            this.toggleModulesPlatformOff(this.modules.off.search, platform)
            EventBus.emit('modules-toggleSearchPlatform')
        },
        setDesktopLyricFontSize(value) {
            const fontSize = parseInt(value || 23)
            if (fontSize < 10 || fontSize > 365) return
            this.desktopLyric.fontSize = fontSize
            this.syncSettingToDesktopLyric()
        },
        setDesktopLyricColor(value) {
            this.desktopLyric.color = value
            this.syncSettingToDesktopLyric()
        },
        setDesktopLyricHighlightColor(value) {
            this.desktopLyric.hlColor = value
            this.syncSettingToDesktopLyric()
        },
        setDesktopLyricLineSpacing(value) {
            value = parseInt(value || 23)
            if (value < 0 || value > 1024) return
            this.desktopLyric.lineSpacing = value
            this.syncSettingToDesktopLyric()
        },
        setDesktopLyricTextDirection(value) {
            this.desktopLyric.textDirection = value
            this.setupDesktopLyricAutoSize(true)
            this.syncSettingToDesktopLyric()
        },
        setDesktopLyricAlignment(value) {
            this.desktopLyric.alignment = value
            this.syncSettingToDesktopLyric()
        },
        setDesktopLyricLayoutMode(value) {
            this.desktopLyric.layoutMode = value
            if (this.desktopLyric.layoutMode !== 1 && this.desktopLyric.alignment === 3) {
                this.desktopLyric.alignment = 1
            }
            this.syncSettingToDesktopLyric()
        },
        toggleDesktopLyricAutoHeight() {
            this.desktopLyric.autoHeight = !this.desktopLyric.autoHeight
            if (ipcRenderer) ipcRenderer.send('app-desktopLyric-autoHeight', this.desktopLyric.autoHeight)
        },
        toggleDesktopLyricAutoSize() {
            this.desktopLyric.autoSize = !this.desktopLyric.autoSize
            this.setupDesktopLyricAutoSize()
        },
        setupDesktopLyricAutoSize(isInit) {
            if (ipcRenderer) ipcRenderer.send('app-desktopLyric-autoSize', this.desktopLyric.autoSize, this.desktopLyric.textDirection == 1, isInit)
        },
        syncSettingFromDesktopLyric(data) {
            const { alignment, fontSize, layoutMode, lineSpacing, textDirection } = data
            this.desktopLyric.alignment = alignment
            this.desktopLyric.fontSize = fontSize
            this.desktopLyric.layoutMode = layoutMode
            this.desktopLyric.lineSpacing = lineSpacing
            this.desktopLyric.textDirection = textDirection
        },
        syncSettingToDesktopLyric() {
            EventBus.emit('setting-syncToDesktopLyric', this.desktopLyric)
        },
        setAudioOutputDeviceId(value) {
            this.track.audioOutputDeviceId = value
            this.setupAudioOutputDevice()
        },
        setupAudioOutputDevice() {
            EventBus.emit('outputDevice-setup', this.track.audioOutputDeviceId)
        },
        togglePlayingViewUseBgCoverEffect() {
            this.track.playingViewUseBgCoverEffect = !this.track.playingViewUseBgCoverEffect
        },
    },
    persist: {
        enabled: true,
        strategies: [
            {
                //key: 'setting',
                storage: localStorage,
                paths: ['theme', 'layout', 'common', 'modules', 'track',
                    'lyric', 'desktopLyric', 'cache', 'tray', 'navigation',
                    'dialog', 'keys', 'network', 'others']
            },
        ],
    },
})