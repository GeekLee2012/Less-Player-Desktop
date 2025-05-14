import { defineStore } from 'pinia';
import { ipcRendererInvoke, ipcRendererSend, isMacOS, useWebZoom } from '../../common/Utils';
import { useThemeStore } from './themeStore';
import { usePlatformStore } from './platformStore';
import { useAppCommonStore } from './appCommonStore';
import { onEvents, emitEvents } from '../../common/EventBusWrapper';



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
    id: 'small',
    name: '低清'
},{
    id: 'normal',
    name: '普通'
}, {
    id: 'medium',
    name: '中等'
}, {
    id: 'big',
    name: '高清'
}, {
    id: 'bigger',
    name: '超清'
}]

const SIMPLE_LAYOUT_INDEX = 3

//TODO 本地缓存导致Store State数据不一致
export const useSettingStore = defineStore('setting', {
    state: () => ({
        /* 主题 */
        theme: {
            index: 1,
            //主题分类，0 => 推荐，1 => 自定义
            type: 0,
            //nativeTheme模式，0 => system（跟随系统），1 => light（浅色）, 2 => dark（深色）
            nativeMode: 0,
            /* Light Mode */
            lightIndex: 1,
            lightType: 0,
            /* Dark Mode */
            darkIndex: 0,
            darkType: 0,
        },
        layout: {
            index: 0,
            //回退index，即从简约/迷你模式退出时，返回的普通布局index
            fallbackIndex: 1
        },
        common: {
            //窗口缩放
            winZoom: 85,
            //锁定为初始值
            //在创建应用窗口时，作为webPreference的配置参数
            useWinZoomForCreate: false,
            //窗口控件风格，0 => 自动，1 => macOS, 2 => Windows
            winCtlStyle: 0,
            //元素圆角风格（预设），0 => 自动，1 => macOS, 2 => Windows
            borderRadiusCtlStyle: 0,
            //单位：px
            //此处设置为空对象：为保证首次启动时，自动根据系统平台选择预设值
            borderRadius: {},
            /*
            borderRadius: {
                appWin: 12,
                popover: 8,
                btn: 999,
                flowBtn: 6,
                inputs: 3,
                listItem: 999,
                listItemVertical: 5,
                imageTextTile: 5,
                imageSmall: 3,
                
            },*/
            //
            useWinCenterStrict: true,
            //字体名称
            fontFamily: '',
            //字体大小
            fontSize: 17.5,
            //预设字体大小等级index
            fontSizeLevel: 3,
            //字体粗细
            fontWeight: 400,
            //字体自动加粗显示
            fontAutoWeight: false,
            //图片质量，0 => 普通，1 => 中等，2 => 高清
            imgQualityIndex: 1,
            //分页方式，0 => 普通，1 => 瀑布流
            paginationStyleIndex: 0,
            //歌单、专辑等Tile样式，0 => 普通，1 => 卡片
            imageTextTileStyleIndex: 1,
            //卡片Tile样式阴影效果
            shadowForCardStyleTile: true,
            //H卡片Tile - 反转布局
            reversedForHCardStyleTile: true,
            //H卡片Tile - 小图标
            smallIconForHCardStyleTile: true,
            //歌曲控件样式，0 => 经典，1 => 主流
            songItemStyleIndex: 1,
            //窗口自定义阴影
            winCustomShadowSize: 5, // 0 - 10
            //开关选项标题关联点击
            toggleCtlTitleActionEnable: true,
            //设置页导航按钮
            settingViewNavbarShow: false,
            //设置页面提示
            settingViewTipsShow: true,
            //本地歌曲首页提示
            localMusicViewTipsShow: true,
            localMusicViewPlaylistTipsShow: true,
            //自由FM首页提示
            freeFMViewTipsShow: true,
            freeFMViewRadiosTipsShow: true,
            //当前播放提示
            playbackQueueViewTipsShow: true,
            //插件管理提示
            pluginsViewTipsShow: true,
            //网络存储提示
            cloudStorageViewTipsShow: true,
        },
        modules: {  //功能模块
            off: {  //关闭列表
                playlists: [],
                artists: [],
                radios: [],
                search: [],
                cloudstorage: []
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
            //当前播放 - 列表自动定位
            playbackQueueAutoPositionOnShow: false,
            //当前播放 - 关闭按钮，Electron平台兼容性问题，主要为Windows等平台冗余设计
            playbackQueueCloseBtnShow: false,
            //当前播放 - 定位按钮
            playbackQueuePositionBtnShow: true,
            //当前播放 - 历史播放按钮，即最近播放快捷入口
            playbackQueueHistoryBtnShow: true,
            //当前播放 - MV标识、MV播放按钮
            playbackQueueMvBtnShow: true,
            //当前播放 - 批量操作按钮
            playbackQueueBatchActionBtnShow: true,
            //当前播放 - 保存按钮
            playbackQueueSaveBtnShow: true,
            //当前播放 - 操作按钮仅显示图标，不显示对应文字(图标模式)
            playbackQueueBtnIconMode: true,
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
            //启用在线封面
            useOnlineCover: true,
            /* 本地歌曲 */
            //本地歌曲 - 显示音频格式
            audioTypeFlagShow: false,
            //本地歌曲 - 扫描目录时，启用深度遍历
            useDeeplyScanForDirectory: true,
            //本地歌曲 - 启用Dnd操作，创建本地歌单
            useDndForCreateLocalPlaylist: true,
            //本地歌曲 - 启用Dnd操作，为本地歌单添加歌曲
            useDndForAddLocalTracks: true,
            //本地歌曲 - 启用Dnd操作，导出本地歌单
            useDndForExportLocalPlaylist: true,
            //本地歌曲 - 普通分页，本地歌曲每页记录数
            limitPerPageForLocalPlaylist: 30,
            //本地歌曲 - 歌单未设置封面时策略: 0 -> 默认、1 - 第一顺位、2 - 随机、3 - 随机颜色
            //默认策略：使用默认封面
            //第一顺位策略：从歌单中的第一首有封面的歌曲中获取封面；随机策略类似
            //随机颜色策略：顾名思义，随机一个颜色作为封面
            coverAbsentStrategyForLocalPlaylist: 0,
            //本地歌曲 - 自动下载歌词文件
            downloadLyricForLocalTrack: false,
            //高亮当前右键菜单对应的歌曲
            highlightCtxMenuItem: true,
            //拖拽保存
            dndSave: false, 
            dndSavePath: null, 
            //图文控件 - 专辑标题单行显示
            singleLineAlbumTitleStyle: false,
            //图文控件 - 自由FM标题单行显示
            singleLineRadioTitleStyle: false,
            //图文控件 - 电台标题单击播放 / 添加到当前播放
            radioTileTitleClickPlay: true,
            //播放页 - 封面图片背景效果
            playingViewUseBgCoverEffect: false,
            playingViewBgCoverEffectIndex: 0,
            //渐变模式 - 渐变顺序
            playingViewBgCoverEffectGradientMode: 0,
            //渐变模式 - 渐变风格
            playingViewBgCoverEffectGradientType: 2, 
            //渐变模式 - 渐变风格 - 渐变亮度
            playingViewBgCoverEffectGradientBrightness: 1, 
            //播放页 - 封面图片边框
            playingViewCoverBorderShow: true,
            //播放页 - 播放控件风格
            playingViewPlayCtlStyleIndex: 0,
            //播放页 - 播放控件颜色
            playingViewThemeColorIndex: 0,
            //播放页 - 歌词高亮样式
            playingViewLyricHighlightMode: 0,
            //播放页 - 纯净模式
            playingViewFocusMode: false,
            //歌曲控件序号
            songItemIndexShow: true,
            //mpv binary文件路径
            mpvBinaryPath: null,
        },
        search: {
            //场景化提示
            autoPlaceholder: true,
            //在线歌单页
            onlinePlaylistShow: true,
            //本地歌单页
            localPlaylistShow: true,
            //我的主页 - 创建的歌单
            customPlaylistShow: true,
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
            //标题字号
            titleFontSize: 32,
            //歌手、专辑字号
            aralFontSize: 18,
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
            //标题信息，0 => 默认, 1 => 单行, 2 => 双行
            titleMetaLines: 0,
            //歌手、专辑布局, 0 => 分行, 1 => 同行, 2 => 隐藏
            aralMetaLayout: 0,
            //歌手、专辑标签, 0 => 文字, 1 => 隐藏, 2 => 图标
            aralMetaLabelStyle: 0,
            //专辑信息，0 => 默认, 1 => 隐藏, 2 => 显示
            albumMetaShow: 0,
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
            //高亮行颜色 - 翻译文字
            extraTextHlColor: null,
            //已废弃，窗口自动高度，跟随显示模式
            autoHeight: true,
            //窗口自动大小，跟随显示模式
            autoSize: true,
            //文字显示方向，0 => 横屏，1 => 竖屏   
            textDirection: 0,
        },
        /* 缓存 */
        cache: {
            //退出前保存播放状态：包括当前歌曲、播放列表等
            storePlayState: true,
            //退出前保存当前播放进度
            storePlayProgressState: false,
            //退出前记录已经添加的本地歌曲
            storeLocalMusic: true,
            //记录最近播放
            storeRecentPlay: true,
            //最近播放 - 自动清理
            autoClearRecentPlay: false,
            //最近播放 - 保留时长（单位：天）
            liveTimeForRecentPlay: 10, 
            //最近播放 - 清理类型
            // 歌曲、歌单、专辑、FM电台
            autoClearRecentTypes: [true, true, true, true],
        },
        /* 菜单栏、Windows平台为系统托盘 */
        tray: {
            //是否在菜单栏显示
            show: false,
            //是否最小化到菜单栏
            showOnMinimized: false,
            //本地化风格图标，仅macOS平台有效
            nativeIcon: false,
        },
        /* 导航栏 */
        navigation: {
            /* 左侧导航 */
            miniNavBarMode: false,
            //自建歌单
            customPlaylistsShow: false,
            //播放队列
            savedPlaybackQueuesShow: false,
            //我的收藏
            favoritePlaylistsShow: false,
            //我关注的歌手
            followArtistsShow: false,
            /* 顶部导航*/
            //相约电波模式按钮
            radioModeShortcut: false,
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
            //视频入口按钮
            freeVideoShortcut: false,
            //网络存储按钮
            cloudStorageShortcut: false,
            //点击简约布局按钮时，切换为迷你布局 / 简约布局
            simpleLayoutShortcutForMiniLayout: false,
            //主题显示模式
            themeNativeModeShortcut: false,
        },
        /* 对话框 */
        dialog: {
            //退出应用
            quitApp: true,
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
            //删除自由FM电台（单个）
            deleteFreeFM: true,
            //访问插件官网链接
            visitPluginRepository: true,
            //删除插件
            deletePlugins: true,
            //缩放 - 超出常规范围时
            //abnormalZoom: true,
            suspiciousZoom: true,
            //清空全部（已保存的）播放队列
            clearPlaybackQueues: true,
            //删除（已保存的）播放队列
            deletePlaybackQueue: true,
        },
        /* 快捷键，可修改 */
        keys: {
            //是否全局（系统级别）快捷键
            global: false,
        },
        /* 快捷键 - 默认值，只读 */
        keysDefault: {
            data: [{
                id: 'visitShortcutKeys',
                name: '快捷键列表',
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
                name: '当前播放',
                binding: 'Q',
                gBinding: 'Alt + Shift + Q'
            }, {
                id: 'toggleLyricToolbar',
                name: '歌词设置',
                binding: 'L',
                gBinding: 'Alt + Shift + L'
            }, {
                id: 'visitThemes',
                name: '主题页',
                binding: 'T',
                gBinding: 'Alt + Shift + T'
            }, {
                id: 'visitUserHome',
                name: '我的主页',
                binding: 'H',
                gBinding: 'Alt + Shift + H'
            }, {
                id: 'visitModulesSetting',
                name: '功能管理',
                binding: 'G',
                gBinding: 'Alt + Shift + G'
            }, {
                id: 'visitPlugins',
                name: '插件管理',
                binding: 'U',
                gBinding: 'Alt + Shift + U'
            }, {
                id: 'quickSearch',
                name: '搜索页',
                binding: 'S',
                gBinding: 'Ctrl + Alt + Shift + S'
            }, {
                id: 'visitRecents',
                name: '最近播放',
                binding: 'R',
                gBinding: 'Alt + Shift + R'
            }, {
                id: 'togglePlayingThemes',
                name: '播放样式',
                binding: 'V',
                gBinding: 'Alt + Shift + V'
            }, {
                id: 'resetSetting',
                name: '恢复默认设置',
                binding: 'Ctrl + P',
                gBinding: 'Ctrl + Alt + Shift + P'
            }, {
                id: 'toggleTrackResourceToolView',
                name: '搜索歌曲资源',
                binding: 'Z',
                gBinding: 'Alt + Shift + Z'
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
            checkPreReleaseVersion: true,
            //版本 - 新版本更新提醒（设置按钮上的小红点）
            updatesHintShow: true,
        },
        //“黑洞”state，永远无需持久化
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
        isStorePlayProgressStateBeforeQuit() {
            return this.cache.storePlayProgressState
        },
        isStoreLocalMusicBeforeQuit(state) {
            return this.cache.storeLocalMusic
        },
        isStoreRecentPlay() {
            return this.cache.storeRecentPlay
        },
        isDefaultLayout() { //默认布局
            const index = this.layout.index
            return index == 0 || index == 1 || index == 2
        },
        isDefaultLayoutWithBottom() {
            const index = this.layout.index
            return index == 0 || index == 1 || index == 2
        },
        //已移除，不再支持
        isDefaultOldLayout() {  //旧版布局，第一个版本发布时的布局
            return this.layout.index == -1
        },
        isAutoLayout() {  //根据OS平台自动布局
            return this.layout.index == 0
        },
        isDefaultClassicLayout() {
            return this.layout.index == 1
        },
        isDefaultNewLayout() {
            return this.layout.index == 2
        },
        isSimpleLayout() {
            return this.layout.index == SIMPLE_LAYOUT_INDEX
        },
        isMiniLayout() {
            return this.layout.index == 4
        },
        getWindowZoom() {
            return this.common.winZoom
        },
        isUseWinZoomForCreate() {
            return this.common.useWinZoomForCreate
        },
        isUseWinCenterStrict() {
            return this.common.useWinCenterStrict
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
        currentBorderRadiusCtlStyle() {
            return this.common.borderRadiusCtlStyle
        },
        isUseAutoBorderRadiusCtl() {
            return this.common.borderRadiusCtlStyle == 0
        },
        isUseMacOSBorderRadiusCtl() {
            return this.common.borderRadiusCtlStyle == 1
        },
        isUseWindowsBorderRadiusCtl() {
            return this.common.borderRadiusCtlStyle == 2
        },
        isPlayCountShow() {
            //listenNumShow为旧版本名称
            return this.track.playCountShow || this.track.listenNumShow
        },
        lyricMetaPos() {
            return this.lyric.metaPos
        },
        lyricAralMetaLayout() {
            return this.lyric.aralMetaLayout
        },
        lyricAralMetaLabelStyle() {
            return this.lyric.aralMetaLabelStyle
        },
        lyricTitleMetaLines() {
            return this.lyric.titleMetaLines
        },
        lyricAlbumMetaShow() {
            return this.lyric.albumMetaShow
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
        isSimpleLayoutShortcutForMiniLayoutEnable() {
            return this.navigation.simpleLayoutShortcutForMiniLayout
        },
        isFreeVideoShortcutEnable() {
            return this.navigation.freeVideoShortcut
        },
        isCloudStorageShortcutEnable() {
            return this.navigation.cloudStorageShortcut
        },
        isThemeNativeModeShortcutEnable() {
            return this.navigation.themeNativeModeShortcut
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
        isPlaybackQueueSaveBtnShow() {
            return this.track.playbackQueueSaveBtnShow
        },
        isPlaybackQueueBtnIconMode() {
            return this.track.playbackQueueBtnIconMode
        },
        isTrayShow() {
            return this.tray.show
        },
        isHideToTrayOnMinimized() {
            return this.tray.showOnMinimized
        },
        isNativeIcon() {
            return this.tray.nativeIcon
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
        },
        isUseDndForAddLocalTracksEnable() {
            return this.track.useDndForAddLocalTracks
        },
        isUseDndForExportLocalPlaylistEnable() {
            return this.track.useDndForExportLocalPlaylist
        },
        getLimitPerPageForLocalPlaylist() {
            return this.track.limitPerPageForLocalPlaylist
        },
        coverAbsentStrategyForLocalPlaylist() {
            return this.track.coverAbsentStrategyForLocalPlaylist
        },
        isAudioTypeFlagShowEnable() {
            return this.track.audioTypeFlagShow
        },
        isDownloadLyricForLocalTrack() {
            return this.track.downloadLyricForLocalTrack
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
        isSearchForCustomPlaylistShow() {
            return this.search.customPlaylistShow
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
        isShowDialogBeforeQuitApp() {
            return this.dialog.quitApp
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
        isShowDialogBeforeDeleteFreeFM() {
            return this.dialog.deleteFreeFM
        },
        isShowDialogBeforeVisitPluginRepository() {
            return this.dialog.visitPluginRepository
        },
        isShowDialogBeforeDeletePlugins() {
            return this.dialog.deletePlugins
        },
        isShowDialogBeforeSuspiciousZoom() {
            return this.dialog.suspiciousZoom
        },
        isShowDialogBeforeClearPlaybackQueues() {
            return this.dialog.clearPlaybackQueues
        },
        isShowDialogBeforeDeletePlaybackQueue() {
            return this.dialog.deletePlaybackQueue
        },
        isCheckPreReleaseVersion() {
            return this.others.checkPreReleaseVersion
        },
        isUpdatesHintShowEnable() {
            return this.others.updatesHintShow
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
        isModulesCloudStorageOff() {
            return (platform) => {
                return this.modules.off.cloudstorage.includes(platform)
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
        imageTextTileStyleIndex() {
            return this.common.imageTextTileStyleIndex
        },
        isUseCardStyleImageTextTile() {
            return this.common.imageTextTileStyleIndex == 1
        },
        isUseHCardStyleImageTextTile() {
            return this.common.imageTextTileStyleIndex == 2
        },
        getSongItemStyleIndex() {
            return this.common.songItemStyleIndex
        },
        selectedAudioOutputDeviceId() {
            return this.track.audioOutputDeviceId
        },
        isDndSaveEnable() {
            return this.track.dndSave
        },
        isPlayingViewUseBgCoverEffect() {
            return this.track.playingViewBgCoverEffectIndex 
                && this.track.playingViewBgCoverEffectIndex > 0
        },
        playingViewBgCoverEffectIndex() {
            return this.track.playingViewBgCoverEffectIndex
        },
        playingViewBgCoverEffectGradientMode() {
            return this.track.playingViewBgCoverEffectGradientMode
        },
        playingViewBgCoverEffectGradientType() {
            return this.track.playingViewBgCoverEffectGradientType
        },
        playingViewBgCoverEffectGradientBrightness() {
            return this.track.playingViewBgCoverEffectGradientBrightness
        },
        playingViewLyricHighlightMode() {
            return this.track.playingViewLyricHighlightMode
        },
        playingViewPlayCtlStyleIndex() {
            return this.track.playingViewPlayCtlStyleIndex
        },
        playingViewThemeColorIndex() {
            return this.track.playingViewThemeColorIndex
        },
        isUseShadowForCardStyleTile() {
            return this.common.shadowForCardStyleTile
        },
        isUseReversedForHCardStyleTile() {
            return this.common.reversedForHCardStyleTile
        },
        isUseSmallIconForHCardStyleTile() {
            return this.common.smallIconForHCardStyleTile
        },
        isPlayingViewCoverBorderShow() {
            return this.track.playingViewCoverBorderShow
        },
        playingViewFocusMode() {
            return this.track.playingViewFocusMode
        },
        isSingleLineAlbumTitleStyle() {
            return this.track.singleLineAlbumTitleStyle
        },
        isSingleLineRadioTitleStyle() {
            return this.track.singleLineRadioTitleStyle
        },
        isRadioTileTitleClickPlay() {
            return this.track.radioTileTitleClickPlay
        },
        winCustomShadowSize() {
            return this.common.winCustomShadowSize
        },
        isToggleCtlTitleActionEnable() {
            return this.common.toggleCtlTitleActionEnable
        },
        isSettingViewTipsShow() {
            return this.common.settingViewTipsShow
        },
        isLocalMusicViewTipsShow() {
            return this.common.localMusicViewTipsShow
        },
        isLocalMusicViewPlaylistTipsShow() {
            return this.common.localMusicViewPlaylistTipsShow
        },
        isFreeFMViewTipsShow() {
            return this.common.freeFMViewTipsShow
        },
        isFreeFMViewRadiosTipsShow() {
            return this.common.freeFMViewRadiosTipsShow
        },
        isPlaybackQueueViewTipsShow() {
            return this.common.playbackQueueViewTipsShow
        },
        isPluginsViewTipsShow() {
            return this.common.pluginsViewTipsShow
        },
        isCloudStorageViewTipsShow() {
            return this.common.cloudStorageViewTipsShow
        },
        commonBorderRadius() {
            return this.common.borderRadius
        },
        isFontAutoWeight() {
            return this.common.fontAutoWeight
        },
        isSongItemIndexShow() {
            return this.track.songItemIndexShow
        },
        isAutoClearRecentPlayEnable() {
            return this.cache.autoClearRecentPlay
        },
        liveTimeForRecentPlay() {
            return this.cache.liveTimeForRecentPlay
        },
        autoClearRecentTypes() {
            return this.cache.autoClearRecentTypes
        },
        needClearRecentSongs() {
            return this.autoClearRecentTypes[0]
        },
        needClearRecentPlaylists() {
            return this.autoClearRecentTypes[1]
        },
        needClearRecentAlbums() {
            return this.autoClearRecentTypes[2]
        },
        needClearRecentRadios() {
            return this.autoClearRecentTypes[3]
        },
        mpvBinaryPath() {
            return this.track.mpvBinaryPath
        },
        themeNativeMode() {
            return this.theme.nativeMode
        },
        isMiniNavBarMode() {
            return this.navigation.miniNavBarMode
        }
    },
    actions: {
        setThemeIndex(index, type, noCansade) {
            this.theme.index = index || 0
            this.theme.type = type || 0

            //不级联更新
            if(noCansade) return
            switch(this.theme.nativeMode) {
                case 0:
                    this.setThemeIndexByNativeMode()
                    break
                case 1:
                    this.setThemeLightIndex(this.theme.index, this.theme.type)
                    break
                case 2:
                    this.setThemeDarkIndex(this.theme.index, this.theme.type)
                    break
            }
        },
        setThemeLightIndex(index, type) {
            this.theme.lightIndex = (typeof index == 'undefined') ? 1 : index
            this.theme.lightType = type || 0
        },
        setThemeDarkIndex(index, type) {
            this.theme.darkIndex = index || 0
            this.theme.darkType = type || 0
        },
        setThemeNativeMode(mode) {
            this.theme.nativeMode = mode || 0
        },
        switchThemeNativeMode() {
            this.theme.nativeMode = (this.theme.nativeMode + 1) % 3
        },
        async setThemeIndexByNativeMode() {
            const shouldUseDarkColors = await ipcRendererInvoke('app-nativeTheme-shouldUseDarkColors')
            const { index, type } = this.theme
            shouldUseDarkColors ? this.setThemeDarkIndex(index, type) 
                : this.setThemeLightIndex(index, type)
        },
        switchToTheme(index, type, defaultIndex, defaultType) {
            defaultIndex = defaultIndex || 0
            defaultType = defaultType || 0
            const { getTheme } = useThemeStore()
            const item = getTheme(type, index)
            if(!item) return this.setThemeIndex(defaultIndex, defaultType)
            this.setThemeIndex(index, type, true)
            emitEvents('theme-applyTheme')
        },
        switchToLightTheme(){
            const { lightIndex, lightType } = this.theme
            this.switchToTheme(lightIndex, lightType, 1)
        },
        switchToDarkTheme(){
            const { darkIndex, darkType } = this.theme
            this.switchToTheme(darkIndex, darkType)
        },
        setLayoutIndex(index) {
            const { isMaxScreen } = useAppCommonStore()
            //硬编码，简约 / 迷你布局
            const isSmallLayout = (index == SIMPLE_LAYOUT_INDEX) || (index == 4)
            if (isMaxScreen && isSmallLayout) return

            this.layout.index = index || 0
            const currentIndex = this.layout.index
            const shouldMarkFallback = (!this.isSimpleLayout && !this.isMiniLayout)
            if (shouldMarkFallback) {
                this.layout.fallbackIndex = currentIndex
            } else {
                ipcRendererSend('app-markBoundsState')
            }
            emitEvents('app-layout')
        },
        switchToFallbackLayout() {
            if(this.layout.fallbackIndex > 2) this.layout.fallbackIndex = 0
            this.setLayoutIndex(this.layout.fallbackIndex)
            this.setupWindowZoom()
            ipcRendererSend('app-restoreBoundsState', this.common.useWinCenterStrict)
        },
        switchToSimpleLayout() {
            this.setLayoutIndex(SIMPLE_LAYOUT_INDEX)
        },
        switchToMiniLayout() {
            this.setLayoutIndex(4)
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
        toggleSettingViewNavbarShow() {
            this.common.settingViewNavbarShow = !this.common.settingViewNavbarShow
        },
        setWindowZoom(value) {
            if (!value) return
            const zoom = Number(value || 85)
            if (zoom < 50 || zoom > 300) return
            if (this.common.winZoom == zoom) return
            this.common.winZoom = zoom
            this.setupWindowZoom()
        },
        toggleUseWinZoomForCreate() {
            this.common.useWinZoomForCreate = !this.common.useWinZoomForCreate
            this.setupWindowZoom()
        },
        toggleUseWinCenterStrict() {
            this.common.useWinCenterStrict = !this.common.useWinCenterStrict
        },
        setWindowCtlStyle(value) {
            const index = parseInt(value || 0)
            if (index < 0 || index > 2) return
            this.common.winCtlStyle = index
        },
        setBorderRadiusCtlStyle(value) {
            const index = parseInt(value || 0)
            if (index < 0 || index > 2) return
            this.common.borderRadiusCtlStyle = index
        },
        getPresetBorderRadius(isWinOS) {
            const presets = [
                {
                    appWin: 12,
                    popover: 8,
                    btn: 999,
                    flowBtn: 6,
                    inputs: 3,
                    listItem: 999,
                    listItemVertical: 5,
                    imageTextTile: 5,
                    imageSmall: 3,
                }, {
                    appWin: 3,
                    popover: 3,
                    btn: 5,
                    flowBtn: 3,
                    inputs: 3,
                    listItem: 3,
                    listItemVertical: 3,
                    imageTextTile: 3,
                    imageSmall: 3,
                }
            ]
            return presets[isWinOS ? 1 : 0]
        },
        setCommonBorderRadius(borderRadius) {
            if(typeof borderRadius != 'object') return
            Object.assign(this.common.borderRadius, { ...borderRadius })
        },
        setPresetBorderRadius(isWinOS) {
            this.setCommonBorderRadius(this.getPresetBorderRadius(isWinOS))
        },
        currentFontSize() {
            return this.common.fontSize
        },
        setFontSize(fontSize, byPresetLevel) {
            fontSize = Number(fontSize || 17.5)
            if (fontSize < 10 || fontSize > 30) return
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
            emitEvents('setting-fontSize', this.common.fontSize)
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
            //emitEvents('setting-fontSizeLevel', this.common.fontSizeLevel)
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
        togglePlaybackQueueSaveBtnShow() {
            this.track.playbackQueueSaveBtnShow = !this.track.playbackQueueSaveBtnShow
        },
        togglePlaybackQueueBtnIconMode() {
            this.track.playbackQueueBtnIconMode = !this.track.playbackQueueBtnIconMode
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
        toggleSingleLineAlbumTitleStyle() {
            this.track.singleLineAlbumTitleStyle = !this.track.singleLineAlbumTitleStyle
        },
        toggleSingleLineRadioTitleStyle() {
            this.track.singleLineRadioTitleStyle = !this.track.singleLineRadioTitleStyle
        },
        toggleRadioTileTitleClickPlay() {
            this.track.radioTileTitleClickPlay = !this.track.radioTileTitleClickPlay
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
        togglePlayingViewCoverBorderShow() {
            this.track.playingViewCoverBorderShow = !this.track.playingViewCoverBorderShow
        },
        setImageTextTileStyleIndex(value) {
            const index = parseInt(value || 0)
            if (index < 0 || index > 2) return
            this.common.imageTextTileStyleIndex = index
        },
        setSongItemStyleIndex(value) {
            const index = parseInt(value || 0)
            if (index < 0 || index > 1) return
            this.common.songItemStyleIndex = index
        },
        toggleUseShadowForCardStyleTile() {
            this.common.shadowForCardStyleTile = !this.common.shadowForCardStyleTile
        },
        toggleUseReversedForHCardStyleTile() {
            this.common.reversedForHCardStyleTile = !this.common.reversedForHCardStyleTile
        },
        toggleUseSmallIconForHCardStyleTile() {
            this.common.smallIconForHCardStyleTile = !this.common.smallIconForHCardStyleTile
        },
        toggleUseOnlineCover() {
            this.track.useOnlineCover = !this.track.useOnlineCover
        },
        toggleAudioTypeFlagShow() {
            this.track.audioTypeFlagShow = !this.track.audioTypeFlagShow
        },
        toggleDownloadLyricForLocalTrack() {
            this.track.downloadLyricForLocalTrack = !this.track.downloadLyricForLocalTrack
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
        toggleUseDndForExportLocalPlaylist() {
            this.track.useDndForExportLocalPlaylist = !this.track.useDndForExportLocalPlaylist
        },
        setLimitPerPageForLocalPlaylist(value) {
            value = parseInt(value || 30)
            if (value < 10 || value > 200) return
            this.track.limitPerPageForLocalPlaylist = value
        },
        setCoverAbsentStrategyForLocalPlaylist(value) {
            this.track.coverAbsentStrategyForLocalPlaylist = value
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
        toggleSearchForCustomPlaylistShow() {
            this.search.customPlaylistShow = !this.search.customPlaylistShow
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
        toggleTrayNativeIcon() {
            this.tray.nativeIcon = !this.tray.nativeIcon
            this.setupTray()
        },
        toggleCustomPlaylistsShow() {
            this.navigation.customPlaylistsShow = !this.navigation.customPlaylistsShow
        },
        toggleFavoritePlaylistsShow() {
            this.navigation.favoritePlaylistsShow = !this.navigation.favoritePlaylistsShow
        },
        toggleSavedPlaybackQueuesShow() {
            this.navigation.savedPlaybackQueuesShow = !this.navigation.savedPlaybackQueuesShow
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
        toggleSimpleLayoutShortcutForMiniLayout() {
            this.navigation.simpleLayoutShortcutForMiniLayout = !this.navigation.simpleLayoutShortcutForMiniLayout
        },
        toggleFreeVideoShortcut() {
            this.navigation.freeVideoShortcut = !this.navigation.freeVideoShortcut
        },
        toggleCloudStorageShortcut() {
            this.navigation.cloudStorageShortcut = !this.navigation.cloudStorageShortcut
        },
        toggleThemeNativeModeShortcut() {
            this.navigation.themeNativeModeShortcut = !this.navigation.themeNativeModeShortcut
        },
        toggleKeysGlobal() {
            this.keys.global = !this.keys.global
            this.setupGlobalShortcut()
        },
        toggleStorePlayState() {
            this.cache.storePlayState = !this.cache.storePlayState
        },
        toggleStorePlayProgressState() {
            this.cache.storePlayProgressState = !this.cache.storePlayProgressState
        },
        toggleStoreLocalMusic() {
            this.cache.storeLocalMusic = !this.cache.storeLocalMusic
        },
        toggleStoreRecentPlay() {
            this.cache.storeRecentPlay = !this.cache.storeRecentPlay
        },
        setupWindowZoom(noResize) {
            const { winZoom: zoom, 
                useWinZoomForCreate: useForCreate, 
                useWinCenterStrict: useCenterStrict
            } = this.common
            ipcRendererSend('app-zoom', { zoom, noResize, useForCreate, useCenterStrict })
            emitEvents('app-zoom', zoom)
        },
        setupAppSuspension() {
            ipcRendererSend('app-suspension', this.track.playingWithoutSleeping)
        },
        setupTray() {
            ipcRendererSend('app-tray', this.tray.show, this.tray.nativeIcon)
        },
        setupGlobalShortcut() {
            ipcRendererSend("app-globalShortcut", this.keys.global)
        },
        setupFontFamily() {
            emitEvents('setting-fontFamily', this.common.fontFamily)
        },
        setupFontWeight() {
            const weight = this.common.fontWeight || 400
            emitEvents('setting-fontWeight', weight)
        },
        toggleFontAutoWeight() {
            this.common.fontAutoWeight = !this.common.fontAutoWeight
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
        setLyricTitleFontSize(value) {
            const fontSize = parseInt(value || 32)
            if (fontSize < 10 || fontSize > 100) return
            this.lyric.titleFontSize = fontSize
            this.setupLyricTitleFontSize()
        },
        setLyricAralFontSize(value) {
            const fontSize = parseInt(value || 18)
            if (fontSize < 10 || fontSize > 100) return
            this.lyric.aralFontSize = fontSize
            this.setupLyricAralFontSize()
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
        setLyricAralMetaLayout(value) {
            this.lyric.aralMetaLayout = value || 0
            this.setupLyricAralMetaLayout()
        },
        setLyricAralMetaLabelStyle(value) {
            this.lyric.aralMetaLabelStyle = value || 0
            this.setupLyricAralMetaLabelStyle()
        },
        setLyricTitleMetaLines(value) {
            this.lyric.titleMetaLines = value || 0
            this.setupLyricTitleMetaLines()
        },
        setLyricAlbumMetaShow(value) {
            this.lyric.albumMetaShow = value || 0
            this.setupLyricAlbumMetaShow()
        },
        setLyricAlignment(value) {
            this.lyric.alignment = value || 0
            this.setupLyricAlignment()
        },
        resetLyricSetting() {
            this.setLyricFontSize()
            this.setLyricTitleFontSize()
            this.setLyricAralFontSize()
            this.setLyricHighlightFontSize()
            this.setLyricLineHeight()
            this.setLyricLineSpacing()
            this.setLyricFontWeight()
            this.setLyricOffset()
            this.setLyricMetaPos()
            this.setLyricAralMetaLayout()
            this.setLyricAralMetaLabelStyle()
            this.setLyricTitleMetaLines()
            this.setLyricAlbumMetaShow()
            this.setLyricAlignment()
        },
        setupLyricFontSize() {
            const fontSize = this.lyric.fontSize || 24
            emitEvents('lyric-fontSize', fontSize)
        },
        setupLyricTitleFontSize() {
            const fontSize = this.lyric.titleFontSize || 32
            emitEvents('lyric-titleFontSize', fontSize)
        },
        setupLyricAralFontSize() {
            const fontSize = this.lyric.aralFontSize || 18
            emitEvents('lyric-aralFontSize', fontSize)
        },
        setupLyricHighlightFontSize() {
            const fontSize = this.lyric.hlFontSize || 25
            emitEvents('lyric-hlFontSize', fontSize)
        },
        setupLyricFontWeight() {
            const fontWeight = this.lyric.fontWeight || 400
            emitEvents('lyric-fontWeight', fontWeight)
        },
        setupLyricLineHeight() {
            const lineHeight = this.lyric.lineHeight || 33
            emitEvents('lyric-lineHeight', lineHeight)
        },
        setupLyricLineSpacing() {
            const lineSpacing = this.lyric.lineSpacing || 28
            emitEvents('lyric-lineSpacing', lineSpacing)
        },
        setupLyricOffset() {
            const offset = this.lyric.offset || 0
            emitEvents('lyric-offset', offset)
        },
        setupLyricMetaPos() {
            const metaPos = this.lyric.metaPos || 0
            emitEvents('lyric-metaPos', metaPos)
        },
        setupLyricAralMetaLayout() {
            const aralMetaLayout = this.lyric.aralMetaLayout || 0
            emitEvents('lyric-aralMetaLayout', aralMetaLayout)
        },
        setupLyricAralMetaLabelStyle() {
            const aralMetaLabelStyle = this.lyric.aralMetaLabelStyle || 0
            emitEvents('lyric-aralMetaLabelStyle', aralMetaLabelStyle)
        },
        setupLyricTitleMetaLines() {
            const titleMetaLines = this.lyric.titleMetaLines || 0
            emitEvents('lyric-titleMetaLines', titleMetaLines)
        },
        setupLyricAlbumMetaShow() {
            const albumMetaShow = this.lyric.albumMetaShow || 0
            emitEvents('lyric-albumMetaShow', albumMetaShow)
        },
        setupLyricAlignment() {
            const alignment = this.lyric.alignment || 0
            emitEvents('lyric-alignment', alignment)
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
            ipcRendererSend('app-setGlobalProxy', proxy)
        },
        setupStateRefreshFrequency() {
            emitEvents('track-stateRefreshFrequency', this.track.stateRefreshFrequency || 60)
        },
        setupSpectrumRefreshFrequency() {
            emitEvents('track-spectrumRefreshFrequency', this.track.spectrumRefreshFrequency || 3)
        },
        getStateRefreshFrequency() {
            return this.track.stateRefreshFrequency
        },
        toggleShowDialogBeforeQuitApp() {
            this.dialog.quitApp = !this.dialog.quitApp
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
        toggleShowDialogBeforeDeleteFreeFM() {
            this.dialog.deleteFreeFM = !this.dialog.deleteFreeFM
        },
        toggleShowDialogBeforeVisitPluginRepository() {
            this.dialog.visitPluginRepository = !this.dialog.visitPluginRepository
        },
        toggleShowDialogBeforeDeletePlugins() {
            this.dialog.deletePlugins = !this.dialog.deletePlugins
        },
        toggleShowDialogBeforeSuspiciousZoom() {
            this.dialog.suspiciousZoom = !this.dialog.suspiciousZoom
        },
        toggleShowDialogBeforeClearPlaybackQueues() {
            this.dialog.clearPlaybackQueues = !this.dialog.clearPlaybackQueues
        },
        toggleShowDialogBeforeDeletePlaybackQueue() {
            this.dialog.deletePlaybackQueue = !this.dialog.deletePlaybackQueue
        },
        toggleCheckPreReleaseVersion() {
            this.others.checkPreReleaseVersion = !this.others.checkPreReleaseVersion
        },
        togglUpdatesHintShow() {
            this.others.updatesHintShow = !this.others.updatesHintShow
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
            /*const { activePlatforms } = usePlatformStore()
            const { setExploreModeActiveState } = useAppCommonStore()
            setExploreModeActiveState(0, activePlatforms('playlists').length > 0)*/
        },
        toggleModulesArtistsOff(platform) {
            this.toggleModulesPlatformOff(this.modules.off.artists, platform)
        },
        toggleModulesRadiosOff(platform) {
            this.toggleModulesPlatformOff(this.modules.off.radios, platform)
        },
        toggleModulesSearchOff(platform) {
            this.toggleModulesPlatformOff(this.modules.off.search, platform)
            emitEvents('modules-toggleSearchPlatform')
        },
        toggleModulesCloudStorageOff(platform) {
            this.toggleModulesPlatformOff(this.modules.off.cloudstorage, platform)
        },
        setDesktopLyricFontSize(value) {
            const fontSize = parseInt(value || 23)
            if (fontSize < 10 || fontSize > 365) return
            this.desktopLyric.fontSize = fontSize
            this.syncSettingToDesktopLyric(false)
        },
        setDesktopLyricColor(value) {
            this.desktopLyric.color = value
            this.syncSettingToDesktopLyric(false)
        },
        setDesktopLyricHighlightColor(value) {
            this.desktopLyric.hlColor = value
            this.syncSettingToDesktopLyric(false)
        },
        setDesktopLyricExtraTextHighlightColor(value) {
            this.desktopLyric.extraTextHlColor = value
            this.syncSettingToDesktopLyric(false)
        },
        setDesktopLyricLineSpacing(value) {
            value = parseInt(value || 23)
            if (value < 0 || value > 1024) return
            this.desktopLyric.lineSpacing = value
            this.syncSettingToDesktopLyric(false)
        },
        setDesktopLyricTextDirection(value) {
            this.desktopLyric.textDirection = value
            this.syncSettingToDesktopLyric(true)
        },
        setDesktopLyricAlignment(value) {
            this.desktopLyric.alignment = value
            this.syncSettingToDesktopLyric(false)
        },
        setDesktopLyricLayoutMode(value) {
            this.desktopLyric.layoutMode = value
            if (this.desktopLyric.layoutMode !== 1 
                && this.desktopLyric.alignment === 3) {
                this.desktopLyric.alignment = 1
            }
            this.syncSettingToDesktopLyric(true)
        },
        setDesktopLyricAutoSize(value) {
            this.desktopLyric.autoSize = value
        },
        toggleDesktopLyricAutoSize() {
            this.desktopLyric.autoSize = !this.desktopLyric.autoSize
            this.syncSettingToDesktopLyric(false)
        },
        syncSettingFromDesktopLyric(data) {
            const { alignment, fontSize, layoutMode, lineSpacing, textDirection } = data
            this.desktopLyric.alignment = alignment
            this.desktopLyric.fontSize = fontSize
            this.desktopLyric.layoutMode = layoutMode
            this.desktopLyric.lineSpacing = lineSpacing
            this.desktopLyric.textDirection = textDirection
        },
        syncSettingToDesktopLyric(needResize) {
            const _needResize = this.desktopLyric.autoSize && needResize 
            emitEvents('setting-syncToDesktopLyric', {  ...this.desktopLyric, needResize: _needResize })
        },
        setAudioOutputDeviceId(value) {
            this.track.audioOutputDeviceId = value
            this.setupAudioOutputDevice()
        },
        setupAudioOutputDevice() {
            emitEvents('outputDevice-setup', this.track.audioOutputDeviceId)
        },
        togglePlayingViewUseBgCoverEffect() {
            this.track.playingViewUseBgCoverEffect = !this.track.playingViewUseBgCoverEffect
        },
        togglePlayingViewFocusMode() {
            this.track.playingViewFocusMode = !this.track.playingViewFocusMode
        },
        setPlayingViewBgCoverEffectIndex(value) {
            this.track.playingViewBgCoverEffectIndex = value
        },
        setPlayingViewBgCoverEffectGradientMode(value) {
            this.track.playingViewBgCoverEffectGradientMode = value
        },
        setPlayingViewBgCoverEffectGradientType(value) {
            this.track.playingViewBgCoverEffectGradientType = value
        },
        setPlayingViewBgCoverEffectGradientBrightness(value) {
            this.track.playingViewBgCoverEffectGradientBrightness = value
        },
        setPlayingViewLyricHighlightMode(value) {
            this.track.playingViewLyricHighlightMode = value
        },
        setWindowCustomShadowSize(value) {
            this.common.winCustomShadowSize = parseInt(value)
        },
        setPlayingViewPlayCtlStyleIndex(value) {
            this.track.playingViewPlayCtlStyleIndex = value
        },
        setPlayingViewThemeColorIndex(value) {
            this.track.playingViewThemeColorIndex = value
        },
        toggleToggleCtlTitleActionEnable() {
            this.common.toggleCtlTitleActionEnable = !this.common.toggleCtlTitleActionEnable
        },
        toggleSettingViewTipsShow() {
            this.common.settingViewTipsShow = !this.common.settingViewTipsShow
        },
        toggleLocalMusicViewTipsShow() {
            this.common.localMusicViewTipsShow = !this.common.localMusicViewTipsShow
        },
        toggleLocalMusicViewPlaylistTipsShow() {
            this.common.localMusicViewPlaylistTipsShow = !this.common.localMusicViewPlaylistTipsShow
        },
        toggleFreeFMViewTipsShow() {
            this.common.freeFMViewTipsShow = !this.common.freeFMViewTipsShow
        },
        toggleFreeFMViewRadiosTipsShow() {
            this.common.freeFMViewRadiosTipsShow = !this.common.freeFMViewRadiosTipsShow
        },
        togglePlaybackQueueViewTipsShow() {
            this.common.playbackQueueViewTipsShow = !this.common.playbackQueueViewTipsShow
        },
        togglePluginsViewTipsShow() {
            this.common.pluginsViewTipsShow = !this.common.pluginsViewTipsShow
        },
        toggleCloudStorageViewTipsShow() {
            this.common.cloudStorageViewTipsShow = !this.common.cloudStorageViewTipsShow
        },
        toggleSongItemIndexShow() {
            this.track.songItemIndexShow = !this.track.songItemIndexShow
        },
        toggleAutoClearRecentPlay() {
            this.cache.autoClearRecentPlay = !this.cache.autoClearRecentPlay
        },
        setLiveTimeForRecentPlay(value) {
            this.cache.liveTimeForRecentPlay = Math.max(value || 10, 1)
        },
        setAutoClearRecentTypes(index, value) {
            /*
            const types = this.cache.autoClearRecentTypes
            if(!Array.isArray(types)) {
                this.cache.autoClearRecentTypes = [true, true, true, true]
            }
            */
            this.cache.autoClearRecentTypes[index] = value || false
        },
        setMpvBinaryPath(value) {
            this.track.mpvBinaryPath = value
        },
        setupMpvBinaryPath() {
            emitEvents('mpvBinary-setPath', this.track.mpvBinaryPath)
        },
        toggleMiniNavBarMode() {
            this.navigation.miniNavBarMode = !this.navigation.miniNavBarMode
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