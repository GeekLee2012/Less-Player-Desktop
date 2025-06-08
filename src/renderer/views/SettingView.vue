<script setup>
import { computed, inject, onActivated, onMounted, onDeactivated, onUnmounted, ref, watch, reactive } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { usePlayStore } from '../store/playStore';
import { useUserProfileStore } from '../store/userProfileStore';
import { useRecentsStore } from '../store/recentsStore';
import { useSettingStore } from '../store/settingStore';
import { useThemeStore } from '../store/themeStore';
import { isWinOS, useGitRepository, toTrimString,
    toLowerCaseTrimString, ipcRendererSend, ipcRendererInvoke, 
    onIpcRendererEvent, isMacOS, transformPath, stringEquals,
} from '../../common/Utils';
import ToggleControl from '../components/ToggleControl.vue';
import KeysInputControl from '../components/KeysInputControl.vue';
import ColorInputControl from '../components/ColorInputControl.vue';
import MultiSelectionControl from '../components/MultiSelectionControl.vue';
import { onEvents, emitEvents, offEvents } from '../../common/EventBusWrapper';




const { visitThemes, visitDataBackup,
    visitDataRestore, visitModulesSetting,
    visitBatchRecents, visitPlugins } = inject('appRoute')
const { resetSetting,  } = inject('appCommon')
const { showConfirm, visitLink } = inject('apiExpose')
const { version, lastVersion, giteeLastVersion,
  githubLastVersion, checkingUpdates, checkForUpdates,
  giteeHasNewRelease,  githubHasNewRelease,
  isLastRelease, hasNewRelease,
  giteeReleasesUrl, githubReleasesUrl, 
  changelogUrl, mpvDocUrl,
} = inject('appVersion')

const { GITHUB, GITEE } = useGitRepository()

const { theme, layout, common, track, desktopLyric,
    keys, keysDefault, tray, navigation, dialog, cache,
    network, others, search, isHttpProxyEnable, isSocksProxyEnable,
    isShowDialogBeforeResetSetting, isCheckPreReleaseVersion,
    isUseCardStyleImageTextTile, isSettingViewTipsShow, 
    isToggleCtlTitleActionEnable, isShowDialogBeforeSuspiciousZoom, 
    isShowDialogBeforeClearRecents, isStoreRecentPlay,
    isAutoClearRecentPlayEnable, autoClearRecentTypes,
    isUseHCardStyleImageTextTile,
} = storeToRefs(useSettingStore())
const { setThemeIndex,
    setThemeNativeMode,
    setLayoutIndex,
    toggleSettingViewNavbarShow,
    toggleToggleCtlTitleActionEnable,
    togglePresetThemeActionShow,
    setWindowZoom,
    toggleUseWinZoomForCreate,
    setWindowCtlStyle,
    setBorderRadiusCtlStyle,
    toggleUseWinCenterStrict,
    setFontFamily,
    setFontWeight,
    toggleFontAutoWeight,
    toggleThemeNativeModeShortcut,
    toggleRadioModeShortcut,
    toggleFreeVideoShortcut,
    setTrackQualityIndex,
    toggleVipTransfer,
    toggleVipFlagShow,
    toggleSongItemIndexShow,
    toggleCategoryBarRandom,
    togglePlaylistCategoryBarFlowBtnShow,
    togglePlayCountShow,
    togglePauseOnPlayingVideo,
    toggleResumePlayAfterVideo,
    toggleQuitVideoAfterEnded,
    togglePlayingWithoutSleeping,
    togglePlayingViewUseBgCoverEffect,
    togglePlayingViewCoverBorderShow,
    toggleUseShadowForCardStyleTile,
    toggleUseReversedForHCardStyleTile,
    toggleUseSmallIconForHCardStyleTile,
    toggleUseCoverNopaddingForHCardStyleTile,
    toggleUseCoverNoshadowForHCardStyleTile,
    toggleStorePlayState,
    toggleStorePlayProgressState,
    toggleStoreLocalMusic,
    toggleStoreRecentPlay,
    toggleAutoClearRecentPlay,
    setLiveTimeForRecentPlay,
    setAutoClearRecentTypes,
    toggleTrayShow,
    toggleTrayShowOnMinimized,
    toggleTrayNativeIcon,
    toggleMiniNavBarMode,
    toggleCustomPlaylistsShow,
    toggleFavoritePlaylistsShow,
    toggleSavedPlaybackQueuesShow,
    toggleFollowArtistsShow,
    toggleKeysGlobal,
    updateBlackHole,
    presetThemes,
    allQualities,
    toggleHttpProxy,
    toggleSocksProxy,
    resetProxies,
    setupAppGlobalProxy,
    allFontSizeLevels,
    setFontSizeLevel,
    setFontSize,
    resolveFont,
    allImageQualities,
    setImageQualityIndex,
    setPaginationStyleIndex,
    setImageTextTileStyleIndex,
    setSongItemStyleIndex,
    toggleDndSave,
    setDndSavePath,
    toggleSingleLineAlbumTitleStyle,
    toggleSingleLineRadioTitleStyle,
    toggleRadioTileTitleClickPlay,
    setStateRefreshFrequency,
    setSpectrumRefreshFrequency,
    togglePlaybackQueueBtnIconMode,
    togglePlaybackQueueAutoPositionOnShow,
    togglePlaybackQueueCloseBtnShow,
    togglePlaybackQueuePositionBtnShow,
    togglePlaybackQueueHistoryBtnShow,
    togglePlaybackQueueMvBtnShow,
    togglePlaybackQueueBatchActionBtnShow,
    togglePlaybackQueueSaveBtnShow,
    toggleHightlightCtxMenuItem,
    toggleUseOnlineCover,
    toggleUseDndForCreateLocalPlaylist,
    toggleUseDndForAddLocalTracks,
    toggleUseDndForExportLocalPlaylist,
    setLimitPerPageForLocalPlaylist,
    toggleUseDeeplyScanForDirectory,
    toggleAudioTypeFlagShow,
    toggleDownloadLyricForLocalTrack,
    toggleSearchBarAutoPlaceholder,
    toggleSearchForOnlinePlaylistShow,
    toggleSearchForLocalPlaylistShow,
    toggleSearchForCustomPlaylistShow,
    setCoverAbsentStrategyForLocalPlaylist,
    toggleSearchForBatchActionShow,
    toggleSearchForFreeFMShow,
    toggleSearchForPluginsViewShow,
    toggleShowDialogBeforeQuitApp,
    toggleShowDialogBeforeBatchDelete,
    toggleShowDialogBeforeSavePresetThemeAsCustom,
    toggleShowDialogBeforeCustomPlaylistDelete,
    toggleShowDialogBeforeCustomThemeDelete,
    toggleShowDialogBeforeCustomPlayingThemeDelete,
    toggleShowDialogBeforeCustomEQ,
    toggleShowDialogBeforeClearRecents,
    toggleShowDialogBeforeClearPlaybackQueue,
    toggleShowDialogBeforeResetSetting,
    toggleShowDialogBeforeClearLocalMusics,
    toggleShowDialogBeforeClearFreeFM,
    toggleShowDialogBeforeDeleteFreeFM,
    toggleShowDialogBeforeVisitPluginRepository,
    toggleShowDialogBeforeDeletePlugins,
    toggleShowDialogBeforeSuspiciousZoom,
    toggleShowDialogBeforeDeletePlaybackQueue,
    toggleShowDialogBeforeClearPlaybackQueues,
    toggleCheckPreReleaseVersion,
    togglUpdatesHintShow,
    toggleModulesSettingShortcut,
    togglePluginsSettingShortcut,
    toggleThemesShortcut,
    toggleUserHomeShortcut,
    toggleSimpleLayoutShortcut,
    toggleSimpleLayoutShortcutForMiniLayout,
    toggleCloudStorageShortcut,
    setDesktopLyricFontSize,
    setDesktopLyricColor,
    setDesktopLyricHighlightColor,
    setDesktopLyricExtraTextHighlightColor,
    setDesktopLyricLineSpacing,
    setDesktopLyricAlignment,
    setDesktopLyricLayoutMode,
    toggleDesktopLyricAutoSize,
    setDesktopLyricTextDirection,
    setAudioOutputDeviceId,
    setWindowCustomShadowSize,
    toggleSettingViewTipsShow,
    toggleLocalMusicViewTipsShow,
    toggleLocalMusicViewPlaylistTipsShow,
    toggleFreeFMViewTipsShow,
    toggleFreeFMViewRadiosTipsShow,
    togglePlaybackQueueViewTipsShow,
    togglePluginsViewTipsShow,
    toggleCloudStorageViewTipsShow,
    setMpvBinaryPath,
    setThemeLightIndex,
    setThemeDarkIndex,
} = useSettingStore()

const { showToast, showImportantToast, 
    toggleCustomAppBorderRadiusViewShow,
    toggleThemeSelectionView, toggleFontSelectionToolbar, } = useAppCommonStore()
const { isMaxScreen, routerCtxCacheItem } = storeToRefs(useAppCommonStore())
const { audioOutputDevices } = storeToRefs(usePlayStore())
const { removeAllRecents } = useRecentsStore()
const { getTheme } = useThemeStore()

/*
const switchLayout = (index) => {
    //TODO 硬编码
    if (isMaxScreen.value && index == 3) return
    setLayoutIndex(index)
}
*/

/* 数据 - 重置 */
const resetData = async () => {
    const ok = await showConfirm('数据重置，将会清空我的主页、当前播放等全部数据，并恢复默认设置。' 
        + '但不会清空本地歌曲、自由FM、插件等数据。  确定要继续吗？')
    if (!ok) return

    const relativeStores = {
        player: usePlayStore(),
        appCommon: useAppCommonStore(),
        userProfile: useUserProfileStore(),
        recents: useRecentsStore(),
        //localMusic: useLocalMusicStore(),
        setting: useSettingStore()
    }
    for (var [key, store] of Object.entries(relativeStores)) {
        store.$reset()
        localStorage.removeItem(key)
    }

    emitEvents('setting-reset')
    showImportantToast("数据已重置成功")
}

/* 数据 - 恢复默认设置 */
/*
const resetSettingData = async () => {
    if (isShowDialogBeforeResetSetting.value) {
        const ok = await showConfirm('确定要恢复默认设置吗？')
        if (!ok) return
    }
    const settingStore = useSettingStore()
    settingStore.$reset()
    const storeKeys = ['setting']
    storeKeys.forEach(key => {
        localStorage.removeItem(key)
    })
    emitEvents('setting-reset')
    showImportantToast("已恢复默认设置")
}
*/

/* 通用设置 */
const zoomTickmarks = [50, 70, 85, 90, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300]
const fontWeights = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]

const updateWinZoom = (event) => {
    setWindowZoom(event.target.value)
}

const checkUpdateWinZoom = async (event, item) => {
    const _value = (item || event.target.value)
    const maySuspicius = (_value < 75 || _value > 125)
    if (maySuspicius && isShowDialogBeforeSuspiciousZoom.value) {
        const ok = await showConfirm(`窗口缩放设置为${_value}%。确定要继续吗？`)
        if (!ok) return
    }
    setWindowZoom(_value)
}

const updateWinCustomShadowSize = (evnet) => {
    setWindowCustomShadowSize(event.target.value)
}

const updateFontFamily = (event) => {
    setFontFamily(event.target.value)
}

const selectFont = () => {
    toggleFontSelectionToolbar({
        mounted: () => {
            const { fontFamily } = common.value
            return fontFamily
        },
        selected: ({ index, item }) => {
            setFontFamily(item)
        }
    })
}

const updateFontSize = (event) => {
    setFontSize(event.target.value)
}

const updateFontWeight = (event) => {
    setFontWeight(event.target.value)
}

const updateStateRefreshFrequency = (event) => {
    setStateRefreshFrequency(event.target.value)
}

const updateSpectrumRefreshFrequency = (event) => {
    setSpectrumRefreshFrequency(event.target.value)
}

const updateLimitPerPageForLocalPlaylist = (event) => {
    setLimitPerPageForLocalPlaylist(event.target.value)
}

const updateLiveTimeForRecentPlay = (event) => {
    setLiveTimeForRecentPlay(event.target.value)
}

const updateDesktopLyricFontSize = (event) => {
    setDesktopLyricFontSize(event.target.value)
}

const updateDesktopLyricLineSpacing = (event) => {
    setDesktopLyricLineSpacing(event.target.value)
}

const showDeskLyricAlignItem = computed(() => {
    return (index) => {
        if (index !== 3) return true
        return desktopLyric.value.layoutMode == 1
    }
})


const formatVersion = (version) => {
    const _version = toLowerCaseTrimString(version)

    const prefix = 'v'
    const hasPrefix = _version.startsWith(prefix)
    const needPrefix = false

    if(hasPrefix && !needPrefix) return _version.substring(prefix.length)
    if(!hasPrefix && needPrefix) return `${prefix}${_version}`
    return _version
}


//TODO test功能暂未实现
const applySetupProxy = () => {
    setupProxy('网络代理配置已更新')
}

const setupProxy = (text) => {
    setupAppGlobalProxy()
    text && showToast(text)
}

const closeProxy = () => {
    resetProxies()
    ipcRendererSend('app-setGlobalProxy', { http: null, socks: null })
    showToast('网络代理已重置')
}

const toggleHttpProxyShow = () => {
    toggleHttpProxy()
    if (!isHttpProxyEnable.value) setupProxy('HTTP网络代理已关闭')
}

const toggleSocksProxyShow = () => {
    toggleSocksProxy()
    if (!isSocksProxyEnable.value) setupProxy('SOCKS网络代理已关闭')
}

const clearRecents = async () => {
    if (isShowDialogBeforeClearRecents.value) {
        const ok = await showConfirm('确定要清空最近播放吗？')
        if(!ok) return 
    }
    removeAllRecents()
    showToast("最近播放已清空")
}

const updateAutoClearRecentTypes = (values, index) => {
    const types = autoClearRecentTypes.value
    console.log(index, types, types[index], !types[index])
    setAutoClearRecentTypes(index, !types[index])
}

const sessionCacheSize = ref(0)
const sessionCacheSizeText = computed(() => {
    const cacheSize = sessionCacheSize.value
    if (cacheSize < 0) return '未知'
    const kb = isWinOS() ? 1024 : 1000
    const mb = cacheSize / kb / kb
    const floatMb = parseFloat(mb).toFixed(1)
    const intMb = parseInt(mb)
    return intMb == floatMb ? `${intMb} M` : `${floatMb} M`
})

const updateSessionCacheSize = async () => {
    const cacheSize = await ipcRendererInvoke('app-cacheSize')
    sessionCacheSize.value = cacheSize
}

const clearSessionCache = async () => {
    const result = await ipcRendererInvoke('app-clearCaches')
    if (!result) return 
    updateSessionCacheSize()
    showToast('资源缓存已清理')
}

const selectDndDir = async () => {
    const result = await ipcRendererInvoke('choose-dirs')
    result && setDndSavePath(result[0])
}

const selectMpvFile = async () => {
    const result = await ipcRendererInvoke('choose-files', { title: '请选择mpv binary可执行文件', single: true })
    if (!result) return
    const { filePaths } = result
    setMpvBinaryPath(transformPath(filePaths[0]))
}

const changeAudioOutputDevices = (event) => {
    const deviceId = event.target.value
    setAudioOutputDeviceId(deviceId)
}

const refreshSettingViewTips = (nv) => {
    const visibility = nv ? 'block' : 'none'
    const tipTextEls = document.querySelectorAll('#setting-view .tip-text') || []
    tipTextEls.forEach(el => el.style.display = visibility)
}

const setupToggleCtlTitleClass = () => {
    const actionClass = 'btn'
    const toggleCtlEls = document.querySelectorAll(`#setting-view .toggle-ctl`) || []
    toggleCtlEls.forEach(el => {
        const prevSiblingEl = el.previousElementSibling
        if(!prevSiblingEl) return 
        if(prevSiblingEl.classList.contains('cate-subtitle')
            || prevSiblingEl.classList.contains('sec-title')) {
            const isEnable = isToggleCtlTitleActionEnable.value
            prevSiblingEl.classList.remove(actionClass)
            if(isEnable) prevSiblingEl.classList.add(actionClass)
        }
    })
}


const setupToggleCtlTitleAction = () => {
    const toggleCtlEls = document.querySelectorAll(`#setting-view .toggle-ctl`) || []
    toggleCtlEls.forEach(el => {
        const prevSiblingEl = el.previousElementSibling
        if(!prevSiblingEl) return
        if(prevSiblingEl.classList.contains('cate-subtitle')
            || prevSiblingEl.classList.contains('sec-title')) {
            prevSiblingEl.addEventListener('click', () => {
                const isEnable = isToggleCtlTitleActionEnable.value
                if(isEnable) el.click()
            })
        }
    })
}


const displayFrequency = ref(60)
const setDisplayFrequency = (value) => displayFrequency.value = value

const getDisplayFrequency = async () => {
    const displayFrequency = await ipcRendererInvoke('app-displayFrequency')
    setDisplayFrequency(displayFrequency)
}

/*
const anchorTo = (subSelector) => {
    const el = document.querySelector(`#setting-view .${subSelector}`)
    if(el) el.scrollIntoView()
}

const navbarShow = ref(false)
const setNavbarShow = (value) => navbarShow.value = value

const settingViewRef = ref(null)
const onScroll = (event) => {
    if(!settingViewRef.value) return 
    setNavbarShow(settingViewRef.value.scrollTop >= 202)
}
*/

const settingNavItems = reactive([])

const initSettingNavItems = () => {
    settingNavItems.length = 0
    const list = document.querySelectorAll("#setting-view > .center > div > .cate-name") || []
    list.forEach(item => settingNavItems.push(item))
}

const navbarCollapsed = ref(true)
const setNavbarCollapsed = (value) => (navbarCollapsed.value = value)
const scrollByNavItem = (event, item) => {
    item.scrollIntoView()
    setNavbarCollapsed(true)
}

const scrollToSettingNavItemByText = (text) => {
    let targetItem = null
    for(let i = 0; i < settingNavItems.length; i++) {
        const item = settingNavItems[i]
        if(stringEquals(item.textContent, text)) {
            targetItem = item 
            break
        }
    }
    if(targetItem) scrollByNavItem(null, targetItem)
}

const getThemeItemPreviewBackground = (index, type) => {
    const item = getTheme(type, index)
    if (!item) return {}
    const { previewBg, appBackground } = item
    //预设
    if(type == 0) return { 'background': previewBg }
    //自定义
    const { bgColor, bgImage, bgImageGradient } = appBackground
    let themeBgImage = null
    if (bgImage && bgImageGradient) {
        themeBgImage = `${bgImageGradient}, url('${bgImage}')`
    } else if (bgImage) {
        themeBgImage = `url('${bgImage}')`
    } else if (bgImageGradient) {
        themeBgImage = bgImageGradient
    }
    return {
        'background-color': bgColor,
        'background-image': themeBgImage,
        'background-size': 'cover',
        'background-position': 'center'
    }
}

const computedLightItemBackground = computed(() => {
    const { lightIndex, lightType } = theme.value
    return getThemeItemPreviewBackground(lightIndex, lightType)
})

const computedDarkItemBackground = computed(() => {
    const { darkIndex, darkType } = theme.value
    return getThemeItemPreviewBackground(darkIndex, darkType)
})

const toggleLightThemeSelection = () => {
    toggleThemeSelectionView({
        mounted: () => {
            const { lightIndex: index, lightType: type } = theme.value
            return { subtitle: '浅色', index, type }
        },
        selected: ({ index, type }) => {
            setThemeLightIndex(index, type)
            emitEvents('theme-nativeMode-updated')
        }
    })
}

const toggleDarkThemeSelection = () => {
    toggleThemeSelectionView({
        mounted: () => {
            const { darkIndex: index, darkType: type } = theme.value
            return { subtitle: '深色', index, type }
        },
        selected: ({ index, type }) => {
            setThemeDarkIndex(index, type)
            emitEvents('theme-nativeMode-updated')
        }
    })
}

const visitRouterCtxCacheItem = () => {
    if (!routerCtxCacheItem.value) return
    const { navItemText } = routerCtxCacheItem.value
    if (navItemText) scrollToSettingNavItemByText(navItemText)
} 


/* 生命周期、监听 */
watch(isSettingViewTipsShow, refreshSettingViewTips)
watch(isToggleCtlTitleActionEnable, setupToggleCtlTitleClass)

watch(() => common.value.useWinZoomForCreate, (nv) => {
    const action = nv ? '开启' : '关闭'
    showToast(`已${action}“锁定为初始值”<br>下次重启后生效`)
})


const eventsRegistration = {
    'setting-scrollToNavItem': scrollToSettingNavItemByText,
}

onMounted(() => {
    onEvents(eventsRegistration)
    getDisplayFrequency()
    setupToggleCtlTitleAction()
    setupToggleCtlTitleClass()
    initSettingNavItems()
})

onActivated(() => {
    visitRouterCtxCacheItem()
    updateSessionCacheSize()
    updateBlackHole(Math.random() * 100000000)
})

onDeactivated(() => setNavbarCollapsed(true))
onUnmounted(() => offEvents(eventsRegistration))
</script>

<template>
    <div id="setting-view" ref="settingViewRef" @scroll="onScroll" @click="() => setNavbarCollapsed(true)">
        <div class="navbar" v-show="common.settingViewNavbarShow"
            :class="{ collapse: navbarCollapsed }" 
            @click.stop="() => setNavbarCollapsed(false)"
            @contextmenu.stop="" >
            <svg width="16" height="16" viewBox="0 0 682.31 511.62" xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <path d="M341.27,84.78q-148.21,0-296.43,0c-20,0-35.34-10-41.87-27.24A42.42,42.42,0,0,1,41,.07C42.31,0,43.64,0,45,0H637.34C658,0,674.12,11,680.06,29c9.25,28-11.11,55.68-41.35,55.71q-134.48.15-268.94,0Z"/>
                        <path d="M341.19,426.84q148.21,0,296.43,0c20.07,0,35.29,10,41.84,27.26a42.41,42.41,0,0,1-38,57.44c-1.5.07-3,.07-4.5.07H45.56c-20.48,0-36.15-10.18-42.71-27.65-10.27-27.36,9.59-56.91,38.91-57,71-.26,142-.11,213-.12Z"/>
                        <path d="M341.15,213.42q147,0,293.92.11a62.77,62.77,0,0,1,19.61,2.76c18.5,6.26,29.77,25.53,27.27,45.07a42.23,42.23,0,0,1-38.51,36.53c-2.49.19-5,.3-7.48.3q-294.68,0-589.35.07c-13.06,0-24.83-3-34.06-12.63C.24,272.76-3.2,257.49,3.05,240.9c6.17-16.38,18.6-25.51,36.19-27.18,3.14-.29,6.32-.29,9.49-.29Z"/>
                    </g>
                </g>
            </svg>
            <ul>
                <li class="nav-item" v-for="(item, index) in settingNavItems"
                    :class="{ first: (index == 0)}"
                    v-html="item.textContent" 
                    @click.stop="(event) => scrollByNavItem(event, item)">
                </li>
            </ul>
        </div>
        <div class="header">
            <div class="title">设置</div>
        </div>
        <div class="center">
            <div class="theme row">
                <span class="cate-name"><b @click="visitThemes">主题</b></span>
                <div class="content">
                    <div class="theme-mode-wrap">
                        <div class="theme-mode max-content-mr-36">
                            <span class="cate-subtitle">显示模式：</span>
                            <span v-for="(item, index) in ['自动', '浅色', '深色']" class="quality-item"
                                :class="{ active: index == theme.nativeMode, 'first-item': index == 0 }" 
                                @click="setThemeNativeMode(index)" >
                                {{ item }}
                            </span>
                        </div>
                        <div class="light-item mode-preview-item" 
                            :style="computedLightItemBackground"
                            @click="toggleLightThemeSelection" >
                            <span class="cate-subtitle">浅色</span>
                        </div>
                        <div class="dark-item mode-preview-item" 
                            :style="computedDarkItemBackground"
                            @click="toggleDarkThemeSelection" >
                            <span class="cate-subtitle">深色</span>
                        </div>
                    </div>
                    <div class="preset-themes last" >
                        <div class="item" v-for="(item, index) in presetThemes()"
                            :class="{ active: index == theme.index && theme.type === 0 }"
                            :style="{ background: item.previewBg }" @click="setThemeIndex(index)">
                            <span class="cate-subtitle">{{ item.name }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="layout row">
                <span class="cate-name">布局</span>
                <div class="content">
                    <div class="last">
                        <span v-for="(item, index) in ['自动', '经典', '主流', '简约', '迷你']" class="layout-item"
                            :class="{ active: index == layout.index, 'first-item': index == 0 }" 
                            @click="setLayoutIndex(index)" >
                            {{ item }}
                        </span>
                    </div>
                </div>
            </div>
            <div class="common row">
                <span class="cate-name">通用</span>
                <div class="content">
                    <div class="tip-text">提示：当前应用的输入框，按下Enter键生效，或光标焦点离开后自动生效</div>
                    <div class="titled-w258">
                        <span class="cate-subtitle">设置页启用导航按钮：</span>
                        <ToggleControl @click="toggleSettingViewNavbarShow" :value="common.settingViewNavbarShow">
                        </ToggleControl>
                    </div>
                    <div class="titled-w258">
                        <span class="cate-subtitle">设置页开关选项标题联动：</span>
                        <ToggleControl @click="toggleToggleCtlTitleActionEnable" :value="common.toggleCtlTitleActionEnable">
                        </ToggleControl>
                        <div class="tip-text spacing">提示：开启后，试点击一下左边标题</div>
                    </div>
                    <div class="titled-w258" v-if="false">
                        <span class="cate-subtitle">推荐主题显示编辑按钮：</span>
                        <ToggleControl @click="togglePresetThemeActionShow" :value="common.presetThemeActionShow">
                        </ToggleControl>
                    </div>
                    <div class="tip-text">提示：建议开启“锁定为初始值”，以解决窗口缩放闪动Bug<br>
                        但开启“锁定”后，每次改变“窗口缩放”时需重启应用；否则会触发窗口缩放闪动Bug<br>
                        若需经常改变“窗口缩放”，则不建议开启“锁定为初始值”
                    </div>
                    <div class="window-zoom">
                        <div class="zoom-title">
                            <span>窗口缩放：</span>
                            <input type="number" 
                                min="50" max="300" step="10" 
                                :value="common.winZoom"
                                placeholder="50-300，默认85" 
                                @keydown.enter="checkUpdateWinZoom" 
                                @focusout="checkUpdateWinZoom" />
                            <span>%</span>
                            <div class="checkbox text-btn spacing" @click="toggleUseWinZoomForCreate">
                                <svg v-show="!common.useWinZoomForCreate" width="16" height="16" viewBox="0 0 731.64 731.66"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <g id="Layer_2" data-name="Layer 2">
                                        <g id="Layer_1-2" data-name="Layer 1">
                                            <path
                                                d="M365.63,731.65q-120.24,0-240.47,0c-54.2,0-99.43-30.93-117.6-80.11A124.59,124.59,0,0,1,0,608q0-242.21,0-484.42C.11,60.68,43.7,10.45,105.88,1.23A128.67,128.67,0,0,1,124.81.06q241-.09,481.93,0c61.43,0,110.72,39.85,122.49,99.08a131.72,131.72,0,0,1,2.3,25.32q.19,241.47.07,482.93c0,60.87-40.25,110.36-99.18,121.9a142.56,142.56,0,0,1-26.83,2.29Q485.61,731.81,365.63,731.65ZM48.85,365.45q0,121.76,0,243.5c0,41.57,32.38,73.82,73.95,73.83q243,.06,486,0c41.57,0,73.93-32.24,73.95-73.84q.11-243.24,0-486.49c0-41.3-32.45-73.55-73.7-73.57q-243.24-.06-486.49,0a74.33,74.33,0,0,0-14.89,1.42c-34.77,7.2-58.77,36.58-58.8,72.1Q48.76,244,48.85,365.45Z" />
                                        </g>
                                    </g>
                                </svg>
                                <svg v-show="common.useWinZoomForCreate" class="checked-svg" width="16" height="16"
                                    viewBox="0 0 767.89 767.94" xmlns="http://www.w3.org/2000/svg">
                                    <g id="Layer_2" data-name="Layer 2">
                                        <g id="Layer_1-2" data-name="Layer 1">
                                            <path
                                                d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                                        </g>
                                    </g>
                                </svg>
                                <span>锁定为初始值</span>
                            </div>
                        </div>
                        <div>
                            <input type="range" min="50" max="300" 
                                :value="common.winZoom" step="2" 
                                @input="checkUpdateWinZoom"
                                list="zoom-tickmarks" />
                        </div>
                        <div>
                            <datalist id="zoom-tickmarks">
                                <option v-for="(item, index) in zoomTickmarks" 
                                    :value="item" :label="item"
                                    @click="(event) => checkUpdateWinZoom(event, item)">
                                </option>
                            </datalist>
                        </div>
                    </div>
                    <div class="window-ctl">
                        <span class="sec-title cate-subtitle">窗口按钮风格：</span>
                        <span v-for="(item, index) in ['自动', 'macOS', 'Windows']" class="quality-item"
                            :class="{ active: index == common.winCtlStyle, 'first-item': index == 0 }" @click="setWindowCtlStyle(index)">
                            {{ item }}
                        </span>
                    </div>
                    <div class="border-radius-ctl">
                        <span class="sec-title cate-subtitle">预设圆角风格：</span>
                        <span v-for="(item, index) in ['自动', 'macOS', 'Windows']" class="quality-item"
                            :class="{ active: index == common.borderRadiusCtlStyle, 'first-item': index == 0 }" @click="setBorderRadiusCtlStyle(index)">
                            {{ item }}
                        </span>
                    </div>
                    <div class="border-radius-ctl">
                        <span class="sec-title cate-subtitle">圆角自定义：</span>
                        <SvgTextButton text="前往设置" :leftAction="toggleCustomAppBorderRadiusViewShow">
                        </SvgTextButton>
                    </div>
                    <div class="tip-text" v-show="isWinOS()">提示：窗口阴影大小，仅对Windows、Linux等平台有效<br>
                        若系统平台默认自带阴影，则请将阴影大小设置为0即可
                    </div>
                    <div class="window-custom-shadow" v-show="isWinOS()">
                        <span class="sec-title">窗口阴影大小：</span>
                        <input type="number" :value="common.winCustomShadowSize" placeholder="0-10，默认5" min="0" max="10"
                            step="1" @keydown.enter="updateWinCustomShadowSize" @focusout="updateWinCustomShadowSize" />
                    </div>
                    <div class="tip-text">提示：当在非主屏幕显示当前应用时，请关闭当前选项</div>
                    <div class="titled-w258">
                        <span class="cate-subtitle">窗口在主屏幕严格居中显示：</span>
                        <ToggleControl @click="toggleUseWinCenterStrict" :value="common.useWinCenterStrict">
                        </ToggleControl>
                    </div>
                    <div class="max-content-mr-36" @keydown.stop="">
                        <span class="cate-subtitle">字体名称：</span>
                        <!--
                        <input type="text" :value="resolveFont(common.fontFamily, true)" placeholder="请参考CSS - FontFamily"
                            @keydown.enter="updateFontFamily" @focusout="updateFontFamily" />
                        -->
                        <div class="font-input-ctl">
                            <input class="text-input-ctl" v-model="common.fontFamily" 
                                placeholder="字体名称，请参考CSS - FontFamily"
                                @keydown.enter="updateFontFamily" 
                                @focusout="updateFontFamily" />
                            <div class="select-btn" @click="selectFont">选择</div>
                        </div>
                    </div>
                    <div class="max-content-mr-36">
                        <span class="cate-subtitle">字体大小：</span>
                        <input type="number" :value="common.fontSize" placeholder="10-30，默认15.5" min="10" max="30"
                            step="0.1" @keydown.enter="updateFontSize" @focusout="updateFontSize" />
                    </div>
                    <div class="max-content-mr-36">
                        <span class="cate-subtitle">预设大小：</span>
                        <span v-for="(item, index) in allFontSizeLevels()" class="fslevel-item"
                            :class="{ active: index == common.fontSizeLevel, 'first-item': index == 0 }" @click="setFontSizeLevel(index)">
                            {{ item.name }}
                        </span>
                    </div>
                    <div class="max-content-mr-36">
                        <span class="cate-subtitle">字体粗细：</span>
                        <input type="number" :value="common.fontWeight" placeholder="100-1000，默认400" min="100" max="1000"
                            step="10" @keydown.enter="updateFontWeight" @focusout="updateFontWeight" />
                        <datalist id="fontweight-suggests" v-if="false">
                            <option v-for="(item, index) in fontWeights" :value="item">
                            </option>
                        </datalist>
                    </div>
                    <div class="titled-w258">
                        <span class="cate-subtitle">高亮字体自动加粗：</span>
                        <ToggleControl @click="toggleFontAutoWeight" :value="common.fontAutoWeight">
                        </ToggleControl>
                    </div>
                    <div class="tip-text">提示：图片清晰度越高，视觉体验越好，但内存占用越高<br>
                    图片清晰度完全依赖官方平台，无法保证设置完全有效<br>
                    设置变更前，已加载好的图片，在设置变更后，无法对其产生任何效果
                    </div>
                    <div>
                        <span class="sec-title cate-subtitle">图片清晰度：</span>
                        <span v-for="(item, index) in allImageQualities()" class="quality-item"
                            :class="{ active: index == common.imgQualityIndex, 'first-item': index == 0 }" @click="setImageQualityIndex(index)">
                            {{ item.name }}
                        </span>
                    </div>
                    <div class="tip-text">提示：图文控件风格，适用于歌单、专辑、歌手、电台、视频等预览控件</div>
                    <div>
                        <span class="sec-title cate-subtitle">图文控件风格：</span>
                        <span v-for="(item, index) in ['普通', '卡片', 'H卡片']" class="quality-item"
                            :class="{ active: index == common.imageTextTileStyleIndex, 'first-item': index == 0 }"
                            @click="setImageTextTileStyleIndex(index)">
                            {{ item }}
                        </span>
                    </div>
                    <div class="titled-w258" v-show="isUseCardStyleImageTextTile || isUseHCardStyleImageTextTile">
                        <span class="cate-subtitle">卡片显示底部阴影：</span>
                        <ToggleControl @click="toggleUseShadowForCardStyleTile" :value="common.shadowForCardStyleTile">
                        </ToggleControl>
                        <div class="tip-text spacing3">提示：仅支持部分主题</div>
                    </div>
                    <div class="titled-w258" v-show="isUseHCardStyleImageTextTile">
                        <span class="cate-subtitle">H卡片启用反转布局：</span>
                        <ToggleControl @click="toggleUseReversedForHCardStyleTile" :value="common.reversedForHCardStyleTile">
                        </ToggleControl>
                    </div>
                    <div class="titled-w258" v-show="isUseHCardStyleImageTextTile">
                        <span class="cate-subtitle">H卡片启用小图标按钮：</span>
                        <ToggleControl @click="toggleUseSmallIconForHCardStyleTile" :value="common.smallIconForHCardStyleTile">
                        </ToggleControl>
                    </div>
                    <div class="titled-w258" v-show="isUseHCardStyleImageTextTile">
                        <span class="cate-subtitle">H卡片启用无边距封面：</span>
                        <ToggleControl @click="toggleUseCoverNopaddingForHCardStyleTile" :value="common.coverNopaddingForHCardStyleTile">
                        </ToggleControl>
                    </div>
                    <div class="titled-w258" v-show="isUseHCardStyleImageTextTile">
                        <span class="cate-subtitle">H卡片启用无阴影封面：</span>
                        <ToggleControl @click="toggleUseCoverNoshadowForHCardStyleTile" :value="common.coverNoshadowForHCardStyleTile">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="sec-title cate-subtitle">歌曲控件风格：</span>
                        <span v-for="(item, index) in ['经典', '主流']" class="quality-item"
                            :class="{ active: index == common.songItemStyleIndex, 'first-item': index == 0 }"
                            @click="setSongItemStyleIndex(index)">
                            {{ item }}
                        </span>
                    </div>
                    <div>
                        <span class="sec-title cate-subtitle">列表分页风格：</span>
                        <span v-for="(item, index) in ['普通', '瀑布流']" class="quality-item"
                            :class="{ active: index == common.paginationStyleIndex, 'first-item': index == 0 }"
                            @click="setPaginationStyleIndex(index)">
                            {{ item }}
                        </span>
                    </div>
                    <div>
                        <span class="sec-title cate-subtitle">功能管理：</span>
                        <SvgTextButton text="前往管理" :leftAction="visitModulesSetting">
                        </SvgTextButton>
                    </div>
                    <div class="last">
                        <span class="sec-title cate-subtitle">插件管理：</span>
                        <SvgTextButton text="前往管理" :leftAction="visitPlugins">
                        </SvgTextButton>
                    </div>
                </div>
            </div>
            <div class="tutorial row">
                <span class="cate-name">提示</span>
                <div class="content">
                    <div>
                        <span class="cate-subtitle">设置页提示：</span>
                        <ToggleControl @click="toggleSettingViewTipsShow" :value="common.settingViewTipsShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">本地歌曲首页文字提示：</span>
                        <ToggleControl @click="toggleLocalMusicViewTipsShow" :value="common.localMusicViewTipsShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">本地歌曲首页歌单列表提示：</span>
                        <ToggleControl @click="toggleLocalMusicViewPlaylistTipsShow" :value="common.localMusicViewPlaylistTipsShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">自由FM首页文字提示：</span>
                        <ToggleControl @click="toggleFreeFMViewTipsShow" :value="common.freeFMViewTipsShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">自由FM首页电台列表提示：</span>
                        <ToggleControl @click="toggleFreeFMViewRadiosTipsShow" :value="common.freeFMViewRadiosTipsShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">当前播放提示：</span>
                        <ToggleControl @click="togglePlaybackQueueViewTipsShow" :value="common.playbackQueueViewTipsShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">插件管理提示：</span>
                        <ToggleControl @click="togglePluginsViewTipsShow" :value="common.pluginsViewTipsShow">
                        </ToggleControl>
                    </div>
                    <div class="last">
                        <span class="cate-subtitle">网络存储提示：</span>
                        <ToggleControl @click="toggleCloudStorageViewTipsShow" :value="common.cloudStorageViewTipsShow">
                        </ToggleControl>
                    </div>
                </div>
            </div>
            <div class="track row">
                <span class="cate-name">播放选项</span>
                <div class="content">
                    <div v-if="false">
                        <span class="cate-subtitle">音频输出设备：</span>
                        <select class="select-list-ctl" @change="changeAudioOutputDevices">
                            <option v-for="(item, index) in audioOutputDevices" :value="item.deviceId"
                                :selected="item.deviceId == track.audioOutputDeviceId">{{ item.label }}
                            </option>
                        </select>
                    </div>
                    <div class="max-content-mr-36">
                        <span class="cate-subtitle">优先音质（暂未支持）：</span>
                        <span v-for="(item, index) in allQualities()" class="quality-item"
                            :class="{ active: index == track.quality.index, 'first-item': index == 0 }" @click="setTrackQualityIndex(index)">
                            {{ item.name }}
                        </span>
                    </div>
                    <div>
                        <span class="cate-subtitle">VIP歌曲试切换为免费版本：</span>
                        <ToggleControl @click="toggleVipTransfer" :value="track.vipTransfer">
                        </ToggleControl>
                        <div class="tip-text spacing">提示：实验性功能，匹配准确度无法保证</div>
                    </div>
                    <div>
                        <span class="cate-subtitle">歌曲显示VIP标识：</span>
                        <ToggleControl @click="toggleVipFlagShow" :value="track.vipFlagShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">歌曲显示序号：</span>
                        <ToggleControl @click="toggleSongItemIndexShow" :value="track.songItemIndexShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">歌单分类栏，随机显示：</span>
                        <ToggleControl @click="toggleCategoryBarRandom" :value="track.playlistCategoryBarRandom">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">歌单分类浮动按钮：</span>
                        <ToggleControl @click="togglePlaylistCategoryBarFlowBtnShow"
                            :value="track.playlistCategoryBarFlowBtnShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">歌单显示播放量：</span>
                        <ToggleControl @click="togglePlayCountShow" :value="track.playCountShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">专辑控件标题单行显示：</span>
                        <ToggleControl @click="toggleSingleLineAlbumTitleStyle" :value="track.singleLineAlbumTitleStyle">
                        </ToggleControl>
                        <div class="tip-text spacing">提示：仅支持部分页面的图文控件</div>
                    </div>
                    <div>
                        <span class="cate-subtitle">电台控件标题单行显示：</span>
                        <ToggleControl @click="toggleSingleLineRadioTitleStyle" :value="track.singleLineRadioTitleStyle">
                        </ToggleControl>
                        <div class="tip-text spacing">提示：仅支持自由FM的图文控件</div>
                    </div>
                    <div>
                        <span class="cate-subtitle">电台控件标题单击播放：</span>
                        <ToggleControl @click="toggleRadioTileTitleClickPlay" :value="track.radioTileTitleClickPlay">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">当前播放列表自动定位：</span>
                        <ToggleControl @click="togglePlaybackQueueAutoPositionOnShow"
                            :value="track.playbackQueueAutoPositionOnShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">当前播放列按钮图标模式：</span>
                        <ToggleControl @click="togglePlaybackQueueBtnIconMode" :value="track.playbackQueueBtnIconMode">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">当前播放列表关闭按钮：</span>
                        <ToggleControl @click="togglePlaybackQueueCloseBtnShow" :value="track.playbackQueueCloseBtnShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">当前播放列表定位按钮：</span>
                        <ToggleControl @click="togglePlaybackQueuePositionBtnShow"
                            :value="track.playbackQueuePositionBtnShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">当前播放列表历史按钮：</span>
                        <ToggleControl @click="togglePlaybackQueueHistoryBtnShow"
                            :value="track.playbackQueueHistoryBtnShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">当前播放列表批量按钮：</span>
                        <ToggleControl @click="togglePlaybackQueueBatchActionBtnShow"
                            :value="track.playbackQueueBatchActionBtnShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">当前播放列表保存按钮：</span>
                        <ToggleControl @click="togglePlaybackQueueSaveBtnShow"
                            :value="track.playbackQueueSaveBtnShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">当前播放列表MV按钮：</span>
                        <ToggleControl @click="togglePlaybackQueueMvBtnShow" :value="track.playbackQueueMvBtnShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">右键菜单显示时，高亮歌曲：</span>
                        <ToggleControl @click="toggleHightlightCtxMenuItem" :value="track.highlightCtxMenuItem">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">视频播放时，自动暂停歌曲：</span>
                        <ToggleControl @click="togglePauseOnPlayingVideo" :value="track.pauseOnPlayingVideo">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">视频播完时，自动退出页面：</span>
                        <ToggleControl @click="toggleQuitVideoAfterEnded" :value="track.quitVideoAfterEnded">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">视频退出后，自动续播歌曲：</span>
                        <ToggleControl @click="toggleResumePlayAfterVideo" :value="track.resumePlayAfterVideo">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">播放歌曲时，防止系统睡眠：</span>
                        <ToggleControl @click="togglePlayingWithoutSleeping" :value="track.playingWithoutSleeping">
                        </ToggleControl>
                        <div class="tip-text spacing">提示：不会影响系统正常熄屏、锁屏</div>
                    </div>
                    <div>
                        <span class="cate-subtitle">播放页封面图片边框：</span>
                        <ToggleControl @click="togglePlayingViewCoverBorderShow"
                            :value="track.playingViewCoverBorderShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">歌曲启用在线封面：</span>
                        <ToggleControl @click="toggleUseOnlineCover" :value="track.useOnlineCover">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">封面图片、歌词等拖拽保存：</span>
                        <ToggleControl @click="toggleDndSave" :value="track.dndSave">
                        </ToggleControl>
                        <div class="tip-text spacing">提示：实验性功能</div>
                    </div>
                    <div class="tip-text">提示：由于系统平台的安全机制，访问用户目录可能需要授权。</div>
                    <div>
                        <span class="cate-subtitle">拖拽保存位置（目录）：</span>
                        <div class="dir-input-ctl">
                            <input class="text-input-ctl" v-model="track.dndSavePath" placeholder="默认为用户目录下的Downloads" />
                            <div class="select-btn" @click="selectDndDir">选择</div>
                        </div>
                    </div>
                    <div class="tip-text">提示：每次打开设置页时，自动检测屏幕刷新率，不可修改；正常值为正整数，仅供参考
                    </div>
                    <div>
                        <span class="cate-subtitle">屏幕刷新率（系统检测值）：</span>
                        <input type="number" :value="displayFrequency" readonly/>
                    </div>
                    <div class="tip-text">提示：当前应用，更新频度，是指每多少个动画帧进行一次更新操作<br>
                        频度值越小，歌词更新延迟越低，动画可能越流畅，而CPU占用则会越高<br>
                        歌曲（歌词）进度更新频度，建议与当前设备的屏幕刷新率保持一致<br>
                    </div>
                     <!-- 屏幕刷新率检测值，无法完全保证准确性。因此，将下面“xxx更新频度”设置项的主动权交还给用户，自由度也会更高 -->
                    <div>
                        <span class="cate-subtitle">歌曲（歌词）进度更新频度：</span>
                        <input type="number" :value="track.stateRefreshFrequency" placeholder="屏幕刷新率，1-1024，默认60" min="1"
                            max="1024" step="1" @input="" @keydown.enter="updateStateRefreshFrequency"
                            @focusout="updateStateRefreshFrequency" />
                    </div>
                    <div>
                        <span class="cate-subtitle">歌曲频谱更新频度：</span>
                        <input type="number" :value="track.spectrumRefreshFrequency" placeholder="1-256，默认3" min="1"
                            max="256" step="1" @input="" @keydown.enter="updateSpectrumRefreshFrequency"
                            @focusout="updateSpectrumRefreshFrequency" />
                    </div>
                    <div class="tip-text rich-tip-text">
                        <p>
                            提示：当前应用支持启用mpv播放音频，需配置mpv binary可执行文件所在位置<br>
                            macOS和Linux上文件全称（含扩展名）一般为mpv，Windows则为mpv.exe<br>
                            目前mpv仅用于兜底播放，即音频播放失败时才启用mpv，暂不支持音效、频谱等<br>
                        </p>
                        <p>
                            在当前应用配置mpv时，若有问题，请先参考项目文档：
                            <a href="#" @click.prevent="visitLink(mpvDocUrl)" class="link">mpv.md</a>
                        </p>
                    </div>
                    <div class="last">
                        <span class="cate-subtitle">mpv binary可执行文件位置：</span>
                        <div class="dir-input-ctl">
                            <input class="text-input-ctl" v-model="track.mpvBinaryPath" placeholder="mpv binary可执行文件" />
                            <div class="select-btn" @click="selectMpvFile">选择</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="track localTrack row">
                <span class="cate-name">本地歌曲</span>
                <div class="content">
                    <div>
                        <span class="cate-subtitle">显示音频格式标识：</span>
                        <ToggleControl @click="toggleAudioTypeFlagShow" :value="track.audioTypeFlagShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">自动下载歌词文件：</span>
                        <ToggleControl @click="toggleDownloadLyricForLocalTrack" :value="track.downloadLyricForLocalTrack">
                        </ToggleControl>
                    </div>
                    <div v-show="false">
                        <span class="cate-subtitle">歌单封面策略（未设置时）：</span>
                        <span v-for="(item, index) in ['默认', '第一顺位', '随机']" class="quality-item"
                            :class="{ active: index == track.coverAbsentStrategyForLocalPlaylist, 'first-item': index == 0 }"
                            @click="setCoverAbsentStrategyForLocalPlaylist(index)">
                            {{ item }}
                        </span>
                    </div>
                    <div>
                        <span class="cate-subtitle">扫描目录时，启用深度遍历：</span>
                        <ToggleControl @click="toggleUseDeeplyScanForDirectory" :value="track.useDeeplyScanForDirectory">
                        </ToggleControl>
                        <div class="tip-text spacing">提示：扫描多级子目录，较耗性能</div>
                    </div>
                    <div class="tip-text">提示：支持拖拽单个目录、文件；仅在本地歌曲相关页面、指定区域内才会有效</div>
                    <div>
                        <span class="cate-subtitle">允许拖拽方式，导入歌单：</span>
                        <ToggleControl @click="toggleUseDndForCreateLocalPlaylist"
                            :value="track.useDndForCreateLocalPlaylist">
                        </ToggleControl>
                        <div class="tip-text spacing">提示：首页有效；支持目录、歌单文件</div>
                    </div>
                    <div>
                        <span class="cate-subtitle">允许拖拽方式，导入歌曲：</span>
                        <ToggleControl @click="toggleUseDndForAddLocalTracks" :value="track.useDndForAddLocalTracks">
                        </ToggleControl>
                        <div class="tip-text spacing">提示：歌单页有效；支持目录、音频文件</div>
                    </div>
                    <div>
                        <span class="cate-subtitle">允许拖拽方式，导出歌单：</span>
                        <ToggleControl @click="toggleUseDndForExportLocalPlaylist"
                            :value="track.useDndForExportLocalPlaylist">
                        </ToggleControl>
                        <div class="tip-text spacing">提示：首页图文控件有效</div>
                    </div>
                    <div class="last">
                        <span class="cate-subtitle">歌单分页时，每页记录数：</span>
                        <input type="number" :value="track.limitPerPageForLocalPlaylist" placeholder="10-200，默认30" min="10"
                            max="200" step="0.1" @keydown.enter="updateLimitPerPageForLocalPlaylist"
                            @focusout="updateLimitPerPageForLocalPlaylist" />
                    </div>
                </div>
            </div>
            <div class="desktopLyric row">
                <span class="cate-name">桌面歌词</span>
                <div class="content">
                    <div class="tip-text">提示：在未锁定状态下，背景颜色默认为：当前主题的背景颜色
                        <br>当文字（高亮）颜色、桌面歌词背景颜色相同时，仅在锁定状态下，才能看到文字效果
                    </div>
                    <div>
                        <span class="sec-title cate-subtitle">歌词字体大小：</span>
                        <input type="number" :value="desktopLyric.fontSize" placeholder="10-365，默认23" min="10" max="365"
                            step="0.1" @keydown.enter="updateDesktopLyricFontSize" @focusout="updateDesktopLyricFontSize" />
                    </div>
                    <div>
                        <span class="sec-title cate-subtitle">歌词文字颜色：</span>
                        <ColorInputControl label="歌词文字颜色" :value="desktopLyric.color" :colorMode="true" :onChanged="setDesktopLyricColor">
                        </ColorInputControl>
                    </div>
                    <div>
                        <span class="sec-title cate-subtitle">歌词高亮颜色：</span>
                        <ColorInputControl label="歌词高亮颜色" :value="desktopLyric.hlColor" :onChanged="setDesktopLyricHighlightColor">
                        </ColorInputControl>
                    </div>
                    <div>
                        <span class="sec-title cate-subtitle">翻译高亮颜色：</span>
                        <ColorInputControl label="翻译高亮颜色" :value="desktopLyric.extraTextHlColor" :onChanged="setDesktopLyricExtraTextHighlightColor">
                        </ColorInputControl>
                    </div>
                    <div>
                        <span class="sec-title cate-subtitle">歌词行间距：</span>
                        <input type="number" :value="desktopLyric.lineSpacing" placeholder="0-1024，默认23" min="0" max="1024"
                            step="1" @keydown.enter="updateDesktopLyricLineSpacing"
                            @focusout="updateDesktopLyricLineSpacing" />
                    </div>
                    <div>
                        <span class="sec-title cate-subtitle">歌词文字方向：</span>
                        <span v-for="(item, index) in ['横屏', '竖屏']" class="quality-item"
                            :class="{ active: index === desktopLyric.textDirection, 'first-item': index == 0 }"
                            @click="setDesktopLyricTextDirection(index)">
                            {{ item }}
                        </span>
                    </div>
                    <div v-show="desktopLyric.textDirection == 0">
                        <span class="sec-title cate-subtitle">歌词对齐方式：</span>
                        <span v-for="(item, index) in ['左对齐', '居中', '右对齐', '左、右对齐']" class="quality-item"
                            v-show="showDeskLyricAlignItem(index)" :class="{ active: index === desktopLyric.alignment, 'first-item': index == 0 }"
                            @click="setDesktopLyricAlignment(index)">
                            {{ item }}
                        </span>
                    </div>
                    <div v-show="desktopLyric.textDirection == 1">
                        <span class="sec-title cate-subtitle">歌词对齐方式：</span>
                        <span v-for="(item, index) in ['上对齐', '居中', '下对齐', '上、下对齐']" class="quality-item"
                            v-show="showDeskLyricAlignItem(index)" :class="{ active: index === desktopLyric.alignment, 'first-item': index == 0 }"
                            @click="setDesktopLyricAlignment(index)">
                            {{ item }}
                        </span>
                    </div>
                    <div>
                        <span class="sec-title cate-subtitle">歌词显示模式：</span>
                        <span v-for="(item, index) in ['单行', '双行', '全部']" class="quality-item"
                            :class="{ active: index === desktopLyric.layoutMode, 'first-item': index == 0 }"
                            @click="setDesktopLyricLayoutMode(index)">
                            {{ item }}
                        </span>
                    </div>
                    <div class="tip-text">提示：开启时，跟随显示模式，自动调整为对应默认的大小</div>
                    <div class="last">
                        <span class="sec-title cate-subtitle">窗口自适应大小：</span>
                        <ToggleControl @click="toggleDesktopLyricAutoSize" :value="desktopLyric.autoSize">
                        </ToggleControl>
                    </div>
                </div>
            </div>
            <div class="search row">
                <span class="cate-name">搜索</span>
                <div class="content">
                    <div class="tip-text">提示：场景化提示，即不同页面场景下，搜索框placeholder显示相应的提示</div>
                    <div>
                        <span class="cate-subtitle">搜索框场景化提示：</span>
                        <ToggleControl @click="toggleSearchBarAutoPlaceholder" :value="search.autoPlaceholder">
                        </ToggleControl>
                    </div>
                    <div class="tip-text">提示：独占搜索框模式，通过临时独占搜索框，实现不同场景的搜索</div>
                    <div>显示独占搜索框模式：</div>
                    <div>
                        <span class="cate-subtitle">在线歌单（详情）页：</span>
                        <ToggleControl @click="toggleSearchForOnlinePlaylistShow" :value="search.onlinePlaylistShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">本地歌单（详情）页：</span>
                        <ToggleControl @click="toggleSearchForLocalPlaylistShow" :value="search.localPlaylistShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">创建的歌单（详情）页：</span>
                        <ToggleControl @click="toggleSearchForCustomPlaylistShow" :value="search.customPlaylistShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">自由FM：</span>
                        <ToggleControl @click="toggleSearchForFreeFMShow" :value="search.freeFMShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">插件管理：</span>
                        <ToggleControl @click="toggleSearchForPluginsViewShow" :value="search.pluginsViewShow">
                        </ToggleControl>
                    </div>
                    <div class="last">
                        <span class="cate-subtitle">批量操作：</span>
                        <ToggleControl @click="toggleSearchForBatchActionShow" :value="search.batchActionShow">
                        </ToggleControl>
                    </div>
                </div>
            </div>
            <div class="cache row">
                <span class="cate-name">缓存</span>
                <div class="content">
                    <div class="tip-text">提示：最近播放记录，当记录过多时，部分列表容易卡顿
                        <br>建议开启自动清理最近播放，或定期进行手动清理
                    </div>
                    <div>
                        <span class="cate-subtitle">保存当前播放（列表）状态：</span>
                        <ToggleControl @click="toggleStorePlayState" :value="cache.storePlayState">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">保存当前歌曲播放进度：</span>
                        <ToggleControl @click="toggleStorePlayProgressState" :value="cache.storePlayProgressState">
                        </ToggleControl>
                    </div>
                    <div v-show="false">
                        <span class="cate-subtitle">应用退出前，保存本地歌曲：</span>
                        <ToggleControl @click="toggleStoreLocalMusic" :value="cache.storeLocalMusic">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">保存最近播放记录：</span>
                        <ToggleControl @click="toggleStoreRecentPlay" :value="cache.storeRecentPlay">
                        </ToggleControl>
                        <div class="spacing2">
                            <SvgTextButton text="前往清理" 
                                :leftAction="visitBatchRecents" 
                                :rightAction="clearRecents">
                                <template #left-img>
                                </template>
                                <template #right-img>
                                    <svg width="15" height="15" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 256 256">
                                        <path
                                            d="M1040,669H882c-12.79-4.93-17.16-14.62-17.1-27.83.26-52.77.11-105.55.11-158.32V477c-6,0-11.42-.32-16.84.09-6.54.48-11.66-1.39-15.17-7.08v-7c3.16-5.7,8-7.48,14.44-7.36,18.29.32,36.58.12,54.88.1,1.75,0,3.5-.16,5.48-.25,0-7.76,0-14.91,0-22.05a18.56,18.56,0,0,1,6.6-14.52c2.85-2.39,6.37-4,9.59-5.92h73c13.83,5.64,17.27,10.84,17.25,26.08,0,5.41,0,10.82,0,16.68h7.53c17.61,0,35.21.2,52.81-.12,6.43-.12,11.27,1.63,14.41,7.36v7c-3.5,5.7-8.63,7.56-15.17,7.08-5.41-.4-10.89-.09-16.84-.09v6.36c0,52.6-.15,105.2.11,157.8C1057.17,654.36,1052.81,664.08,1040,669ZM886.24,477.29V640.4c0,8.44-.49,7.34,7.11,7.35q67.95,0,135.9,0c6.51,0,6.52,0,6.52-6.43v-164Zm106.5-42.78H929.37v21h63.37Z"
                                            transform="translate(-833 -413)" />
                                        <path
                                            d="M950.29,562.2c0-13.47,0-26.94,0-40.41,0-7.94,4.25-12.84,10.82-12.77,6.36.07,10.59,5,10.6,12.52,0,27.28,0,54.55,0,81.83,0,5.13-1.71,9.17-6.5,11.36-7.39,3.36-14.87-2.16-14.94-11.11-.11-13.81,0-27.61,0-41.42Z"
                                            transform="translate(-833 -413)" />
                                        <path
                                            d="M1014.25,562.63c0,13.48,0,27,0,40.42,0,7.88-4.3,12.82-10.87,12.64-6.29-.18-10.35-5.13-10.36-12.75q0-41.16,0-82.33c0-5.91,3-9.91,8-11.26a10.29,10.29,0,0,1,11.85,5.16,16.06,16.06,0,0,1,1.33,6.71c.12,13.8.06,27.61.06,41.41Z"
                                            transform="translate(-833 -413)" />
                                        <path
                                            d="M929,562.53q0,21,0,41.92c0,4.8-2.09,8.39-6.49,10.29-4.21,1.81-8.49,1.25-11.43-2.23a13.57,13.57,0,0,1-3.17-8c-.23-28.1-.19-56.21-.12-84.32,0-6.74,4.63-11.34,10.74-11.19s10.41,4.78,10.44,11.59C929.05,534.59,929,548.56,929,562.53Z"
                                            transform="translate(-833 -413)" />
                                    </svg>
                                </template>
                            </SvgTextButton>
                        </div>
                    </div>
                    <div class="tip-text">提示：自动清理最近播放，在每次应用启动时，进行自动检查和清理</div>
                    <div v-show="isStoreRecentPlay">
                        <span class="cate-subtitle">自动清理最近播放：</span>
                        <ToggleControl @click="toggleAutoClearRecentPlay" :value="cache.autoClearRecentPlay">
                        </ToggleControl>
                    </div>
                    <div v-show="isStoreRecentPlay && isAutoClearRecentPlayEnable">
                        <span class="cate-subtitle">自动清理N天前记录：</span>
                        <input type="number" :value="cache.liveTimeForRecentPlay" placeholder="单位为天，1-366，默认为10" min="1"
                            max="366" step="1" @keydown.enter="updateLiveTimeForRecentPlay"
                            @focusout="updateLiveTimeForRecentPlay" />
                    </div>
                    <!--
                    <div v-show="isStoreRecentPlay && isAutoClearRecentPlayEnable">
                        <span class="cate-subtitle">自动清理记录类型：</span>
                        <span v-for="(item, index) in ['歌曲', '歌单', '专辑', 'FM电台']" class="quality-item"
                            :class="{ active: autoClearRecentTypes[index], 'first-item': index == 0 }"
                            @click="updateAutoClearRecentTypes(index)">
                            {{ item }}
                        </span>
                    </div>
                    -->
                    <div v-show="isStoreRecentPlay && isAutoClearRecentPlayEnable">
                        <span class="cate-subtitle">自动清理记录类型：</span>
                        <MultiSelectionControl 
                            :data="['歌曲', '歌单', '专辑', 'FM电台']"
                            :values="autoClearRecentTypes"
                            :onChanged="updateAutoClearRecentTypes" >
                        </MultiSelectionControl>
                    </div>
                    <div class="tip-text">提示：资源缓存，默认上限为500M左右；在每次应用启动时，自动检查和清理</div>
                    <div class="last">
                        <span class="cate-subtitle">资源缓存占用约为：</span>
                        <div class="cache-size-text">{{ sessionCacheSizeText }}</div>
                        <div class="spacing">
                            <SvgTextButton text="清空缓存" :leftAction="clearSessionCache">
                            </SvgTextButton>
                        </div>
                    </div>
                </div>
            </div>
            <div class="menu row">
                <span class="cate-name">菜单栏</span>
                <div class="content">
                    <div class="tip-text">提示：macOS平台下的菜单栏，在Windows平台为系统托盘
                    </div>
                    <div>
                        <span class="cate-subtitle">在菜单栏显示应用图标：</span>
                        <ToggleControl @click="toggleTrayShow" :value="tray.show">
                        </ToggleControl>
                    </div>
                    <div v-show="isMacOS()">
                        <span class="cate-subtitle">本地化风格图标：</span>
                        <ToggleControl @click="toggleTrayNativeIcon" :value="tray.nativeIcon">
                        </ToggleControl>
                    </div>
                    <div class="last">
                        <span class="cate-subtitle">最小化到菜单栏：</span>
                        <ToggleControl @click="toggleTrayShowOnMinimized" :value="tray.showOnMinimized">
                        </ToggleControl>
                    </div>
                </div>
            </div>
            <div class="navigation row">
                <span class="cate-name">导航栏</span>
                <div class="content">
                    <div class="cate-subtitle">左侧导航栏显示：</div>
                    <div>
                        <span class="cate-subtitle">迷你模式：</span>
                        <ToggleControl @click="toggleMiniNavBarMode" :value="navigation.miniNavBarMode">
                        </ToggleControl>
                        <div class="tip-text spacing">提示：试点击左侧导航的应用Logo</div>
                    </div>
                    <div>
                        <span class="cate-subtitle">创建的歌单：</span>
                        <ToggleControl @click="toggleCustomPlaylistsShow" :value="navigation.customPlaylistsShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">播放队列：</span>
                        <ToggleControl @click="toggleSavedPlaybackQueuesShow" :value="navigation.savedPlaybackQueuesShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">收藏的歌单：</span>
                        <ToggleControl @click="toggleFavoritePlaylistsShow" :value="navigation.favoritePlaylistsShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">关注的歌手：</span>
                        <ToggleControl @click="toggleFollowArtistsShow" :value="navigation.followArtistsShow">
                        </ToggleControl>
                    </div>
                    <div class="tip-text">提示：顶部导航栏，不同布局下，部分快捷入口可能会失效</div>
                    <div>顶部导航栏显示：</div>
                    <div>
                        <span class="cate-subtitle">主题显示模式：</span>
                        <ToggleControl @click="toggleThemeNativeModeShortcut" :value="navigation.themeNativeModeShortcut">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">相约电波：</span>
                        <ToggleControl @click="toggleRadioModeShortcut" :value="navigation.radioModeShortcut">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">视频播放：</span>
                        <ToggleControl @click="toggleFreeVideoShortcut" :value="navigation.freeVideoShortcut">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">网络存储：</span>
                        <ToggleControl @click="toggleCloudStorageShortcut" :value="navigation.cloudStorageShortcut">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">功能管理：</span>
                        <ToggleControl @click="toggleModulesSettingShortcut" :value="navigation.modulesSettingShortcut">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">插件管理：</span>
                        <ToggleControl @click="togglePluginsSettingShortcut" :value="navigation.pluginsSettingShortcut">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">主题页：</span>
                        <ToggleControl @click="toggleThemesShortcut" :value="navigation.themesShortcut">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">我的主页：</span>
                        <ToggleControl @click="toggleUserHomeShortcut" :value="navigation.userHomeShortcut">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">简约布局：</span>
                        <ToggleControl @click="toggleSimpleLayoutShortcut" :value="navigation.simpleLayoutShortcut">
                        </ToggleControl>
                    </div>
                    <div>"简约布局"按钮，点击时切换为：</div>
                    <div class="last">
                        <span class="cate-subtitle">迷你布局：</span>
                        <ToggleControl @click="toggleSimpleLayoutShortcutForMiniLayout" :value="navigation.simpleLayoutShortcutForMiniLayout">
                        </ToggleControl>
                    </div>
                </div>
            </div>
            <div class="dialog row">
                <span class="cate-name">对话框</span>
                <div class="content">
                    <div class="tip-text">提示：当前使用系统提供的对话框，可能会和当前应用的风格不一致</div>
                    <div>当进行下列操作时，需要确认：</div>
                    <div>
                        <span class="cate-subtitle">退出应用：</span>
                        <ToggleControl @click="toggleShowDialogBeforeQuitApp" :value="dialog.quitApp">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">批量删除：</span>
                        <ToggleControl @click="toggleShowDialogBeforeBatchDelete" :value="dialog.batchDelete">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">删除创建的歌单：</span>
                        <ToggleControl @click="toggleShowDialogBeforeCustomPlaylistDelete"
                            :value="dialog.deleteCustomPlaylist">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">推荐主题创建为自定义主题：</span>
                        <ToggleControl @click="toggleShowDialogBeforeSavePresetThemeAsCustom"
                            :value="dialog.savePresetThemeAsCustom">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">删除自定义主题：</span>
                        <ToggleControl @click="toggleShowDialogBeforeCustomThemeDelete"
                            :value="dialog.deleteCustomTheme">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">删除自定义播放样式：</span>
                        <ToggleControl @click="toggleShowDialogBeforeCustomPlayingThemeDelete"
                            :value="dialog.deleteCustomPlayingTheme">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">删除自定义均衡器：</span>
                        <ToggleControl @click="toggleShowDialogBeforeCustomEQ"
                            :value="dialog.deleteCustomEQ">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">清空当前播放（列表）：</span>
                        <ToggleControl @click="toggleShowDialogBeforeClearPlaybackQueue" :value="dialog.clearPlaybackQueue">
                        </ToggleControl>
                        <div class="tip-text spacing" >提示：仅对电台歌单有效</div>
                    </div>
                    <div>
                        <span class="cate-subtitle">清空最近播放：</span>
                        <ToggleControl @click="toggleShowDialogBeforeClearRecents" :value="dialog.clearRecents">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">清空本地歌曲：</span>
                        <ToggleControl @click="toggleShowDialogBeforeClearLocalMusics" :value="dialog.clearLocalMusics">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">清空自由FM：</span>
                        <ToggleControl @click="toggleShowDialogBeforeClearFreeFM" :value="dialog.clearFreeFM">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">删除自由FM电台：</span>
                        <ToggleControl @click="toggleShowDialogBeforeDeleteFreeFM" :value="dialog.deleteFreeFM">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">删除插件：</span>
                        <ToggleControl @click="toggleShowDialogBeforeDeletePlugins" :value="dialog.deletePlugins">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">访问插件官网：</span>
                        <ToggleControl @click="toggleShowDialogBeforeVisitPluginRepository"
                            :value="dialog.visitPluginRepository">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">窗口缩放（偏大 / 小）：</span>
                        <ToggleControl @click="toggleShowDialogBeforeSuspiciousZoom"
                            :value="dialog.suspiciousZoom">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">删除播放队列：</span>
                        <ToggleControl @click="toggleShowDialogBeforeDeletePlaybackQueue"
                            :value="dialog.deletePlaybackQueue">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">清空全部播放队列：</span>
                        <ToggleControl @click="toggleShowDialogBeforeClearPlaybackQueues"
                            :value="dialog.clearPlaybackQueues">
                        </ToggleControl>
                    </div>
                    <div class="last">
                        <span class="cate-subtitle">恢复默认设置：</span>
                        <ToggleControl @click="toggleShowDialogBeforeResetSetting" :value="dialog.resetSetting">
                        </ToggleControl>
                    </div>
                </div>
            </div>
            <div class="keys row">
                <span class="cate-name">快捷键</span>
                <div class="content">
                    <div class="toggle-global">
                        <span class="cate-subtitle">开启全局快捷键：</span>
                        <ToggleControl @click="toggleKeysGlobal" :value="keys.global">
                        </ToggleControl>
                        <SvgTextButton text="恢复默认" style="display: none"></SvgTextButton>
                    </div>
                    <div class="tip-text">提示：暂不支持自定义，一般不建议开启全局快捷键，容易与其他应用产生冲突</div>
                    <div class="local-keys" v-for="(item, index) in keysDefault.data"
                        :class="{ last: index == (keysDefault.data.length - 1) }">
                        <span class="cate-subtitle">{{ item.name }}：</span>
                        <KeysInputControl :value="item.binding" :class="{ keysInputAdptWidth: !keys.global }">
                        </KeysInputControl>
                        <KeysInputControl :value="item.gBinding" class="global-keys-ctrl" v-show="keys.global">
                        </KeysInputControl>
                    </div>
                </div>
            </div>
            <div class="network row">
                <span class="cate-name">网络</span>
                <div class="content" @keydown.stop="">
                    <div class="tip-text">提示：国内网络下，一般无需配置；开启代理后，若配置不当，当前应用将无法正常联网
                        <br>需用户名/密码验证的代理功能，暂时未经测试，无法确保可以正常使用
                        <br>开启代理，并修改配置后，请点击“应用更改”按钮，新配置才会生效哦
                    </div>
                    <div>网络代理配置（实验性功能）：
                        <div class="spacing">
                            <SvgTextButton text="应用更改" :leftAction="applySetupProxy" :rightAction="closeProxy">
                                <template #left-img>
                                </template>
                                <template #right-img>
                                    <svg width="14" height="14" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 256 256">
                                        <path
                                            d="M1040,669H882c-12.79-4.93-17.16-14.62-17.1-27.83.26-52.77.11-105.55.11-158.32V477c-6,0-11.42-.32-16.84.09-6.54.48-11.66-1.39-15.17-7.08v-7c3.16-5.7,8-7.48,14.44-7.36,18.29.32,36.58.12,54.88.1,1.75,0,3.5-.16,5.48-.25,0-7.76,0-14.91,0-22.05a18.56,18.56,0,0,1,6.6-14.52c2.85-2.39,6.37-4,9.59-5.92h73c13.83,5.64,17.27,10.84,17.25,26.08,0,5.41,0,10.82,0,16.68h7.53c17.61,0,35.21.2,52.81-.12,6.43-.12,11.27,1.63,14.41,7.36v7c-3.5,5.7-8.63,7.56-15.17,7.08-5.41-.4-10.89-.09-16.84-.09v6.36c0,52.6-.15,105.2.11,157.8C1057.17,654.36,1052.81,664.08,1040,669ZM886.24,477.29V640.4c0,8.44-.49,7.34,7.11,7.35q67.95,0,135.9,0c6.51,0,6.52,0,6.52-6.43v-164Zm106.5-42.78H929.37v21h63.37Z"
                                            transform="translate(-833 -413)" />
                                        <path
                                            d="M950.29,562.2c0-13.47,0-26.94,0-40.41,0-7.94,4.25-12.84,10.82-12.77,6.36.07,10.59,5,10.6,12.52,0,27.28,0,54.55,0,81.83,0,5.13-1.71,9.17-6.5,11.36-7.39,3.36-14.87-2.16-14.94-11.11-.11-13.81,0-27.61,0-41.42Z"
                                            transform="translate(-833 -413)" />
                                        <path
                                            d="M1014.25,562.63c0,13.48,0,27,0,40.42,0,7.88-4.3,12.82-10.87,12.64-6.29-.18-10.35-5.13-10.36-12.75q0-41.16,0-82.33c0-5.91,3-9.91,8-11.26a10.29,10.29,0,0,1,11.85,5.16,16.06,16.06,0,0,1,1.33,6.71c.12,13.8.06,27.61.06,41.41Z"
                                            transform="translate(-833 -413)" />
                                        <path
                                            d="M929,562.53q0,21,0,41.92c0,4.8-2.09,8.39-6.49,10.29-4.21,1.81-8.49,1.25-11.43-2.23a13.57,13.57,0,0,1-3.17-8c-.23-28.1-.19-56.21-.12-84.32,0-6.74,4.63-11.34,10.74-11.19s10.41,4.78,10.44,11.59C929.05,534.59,929,548.56,929,562.53Z"
                                            transform="translate(-833 -413)" />
                                    </svg>
                                </template>
                            </SvgTextButton>
                        </div>
                    </div>
                    <!--
                    <div class="tip-text">提示：开启代理，并修改配置后，请点击“应用更改”按钮，新配置才会生效哦</div>
                    -->
                    <div>
                        <span class="cate-subtitle">HTTP代理模式：</span>
                        <ToggleControl @click="toggleHttpProxyShow" v-model="network.httpProxy.enable"
                            :value="network.httpProxy.enable">
                        </ToggleControl>
                    </div>
                    <div class="http-proxy" v-show="network.httpProxy.enable">
                        <div class="network-item">
                            <span>主机: </span>
                            <input type="text" placeholder="IP、域名" v-model="network.httpProxy.host" />
                        </div>
                        <div class="network-item spacing">
                            <span>端口:</span>
                            <input type="number" placeholder="范围0 - 65535，默认80" min="0" max="65535" step="1"
                                v-model="network.httpProxy.port" />
                        </div>
                    </div>
                    <div class="http-proxy" v-show="network.httpProxy.enable">
                        <div class="network-item">
                            <span>用户: </span>
                            <input type="text" placeholder="用户名" v-model="network.httpProxy.username" />
                        </div>
                        <div class="network-item spacing">
                            <span>密码:</span>
                            <input type="password" placeholder="密码" v-model="network.httpProxy.password" />
                        </div>
                    </div>
                    <div :class="{ last: !network.socksProxy.enable }">
                        <span class="cate-subtitle">SOCKS代理模式：</span>
                        <ToggleControl @click="toggleSocksProxyShow" v-model="network.socksProxy.enable"
                            :value="network.socksProxy.enable">
                        </ToggleControl>
                    </div>
                    <div class="socks-proxy" v-show="network.socksProxy.enable">
                        <div class="network-item">
                            <span>主机: </span>
                            <input type="text" placeholder="IP、域名" v-model="network.socksProxy.host" />
                        </div>
                        <div class="network-item spacing">
                            <span>端口:</span>
                            <input type="number" placeholder="范围0 - 65535，默认80" min="0" max="65535" step="1"
                                v-model="network.socksProxy.port" />
                        </div>
                    </div>
                    <div class="socks-proxy last" v-show="network.socksProxy.enable">
                        <div class="network-item">
                            <span>用户: </span>
                            <input type="text" placeholder="用户名" v-model="network.socksProxy.username" />
                        </div>
                        <div class="network-item spacing">
                            <span>密码:</span>
                            <input type="password" placeholder="密码" v-model="network.socksProxy.password" />
                        </div>
                    </div>
                </div>
            </div>
            <div class="data row">
                <span class="cate-name">数据</span>
                <div class="content">
                    <div class="last">
                        <SvgTextButton text="备份" :leftAction="visitDataBackup" :rightAction="visitDataRestore">
                            <template #right-text>
                                <div class="text">还原</div>
                            </template>
                        </SvgTextButton>
                        <SvgTextButton text="恢复默认设置" :leftAction="resetSetting" class="spacing">
                        </SvgTextButton>
                        <SvgTextButton text="重置" :leftAction="resetData" class="spacing">
                            <template #left-img>
                                <svg width="14" height="14" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 256 256">
                                    <path
                                        d="M1040,669H882c-12.79-4.93-17.16-14.62-17.1-27.83.26-52.77.11-105.55.11-158.32V477c-6,0-11.42-.32-16.84.09-6.54.48-11.66-1.39-15.17-7.08v-7c3.16-5.7,8-7.48,14.44-7.36,18.29.32,36.58.12,54.88.1,1.75,0,3.5-.16,5.48-.25,0-7.76,0-14.91,0-22.05a18.56,18.56,0,0,1,6.6-14.52c2.85-2.39,6.37-4,9.59-5.92h73c13.83,5.64,17.27,10.84,17.25,26.08,0,5.41,0,10.82,0,16.68h7.53c17.61,0,35.21.2,52.81-.12,6.43-.12,11.27,1.63,14.41,7.36v7c-3.5,5.7-8.63,7.56-15.17,7.08-5.41-.4-10.89-.09-16.84-.09v6.36c0,52.6-.15,105.2.11,157.8C1057.17,654.36,1052.81,664.08,1040,669ZM886.24,477.29V640.4c0,8.44-.49,7.34,7.11,7.35q67.95,0,135.9,0c6.51,0,6.52,0,6.52-6.43v-164Zm106.5-42.78H929.37v21h63.37Z"
                                        transform="translate(-833 -413)" />
                                    <path
                                        d="M950.29,562.2c0-13.47,0-26.94,0-40.41,0-7.94,4.25-12.84,10.82-12.77,6.36.07,10.59,5,10.6,12.52,0,27.28,0,54.55,0,81.83,0,5.13-1.71,9.17-6.5,11.36-7.39,3.36-14.87-2.16-14.94-11.11-.11-13.81,0-27.61,0-41.42Z"
                                        transform="translate(-833 -413)" />
                                    <path
                                        d="M1014.25,562.63c0,13.48,0,27,0,40.42,0,7.88-4.3,12.82-10.87,12.64-6.29-.18-10.35-5.13-10.36-12.75q0-41.16,0-82.33c0-5.91,3-9.91,8-11.26a10.29,10.29,0,0,1,11.85,5.16,16.06,16.06,0,0,1,1.33,6.71c.12,13.8.06,27.61.06,41.41Z"
                                        transform="translate(-833 -413)" />
                                    <path
                                        d="M929,562.53q0,21,0,41.92c0,4.8-2.09,8.39-6.49,10.29-4.21,1.81-8.49,1.25-11.43-2.23a13.57,13.57,0,0,1-3.17-8c-.23-28.1-.19-56.21-.12-84.32,0-6.74,4.63-11.34,10.74-11.19s10.41,4.78,10.44,11.59C929.05,534.59,929,548.56,929,562.53Z"
                                        transform="translate(-833 -413)" />
                                </svg>
                            </template>
                        </SvgTextButton>
                    </div>
                </div>
            </div>
            <div class="version row">
                <span class="cate-name">版本</span>
                <div class="content">
                    <div>
                        <div class="current-version" :class="{ oldflag: hasNewRelease }">
                            <span v-html="formatVersion(version)"></span>
                        </div>
                        <a href="#" @click.prevent="visitLink(changelogUrl)" class="link spacing">更新日志</a>
                        <!--<div class="tip-text spacing">提示：当前应用会访问系统默认下载目录，检查是否已存在更新文件</div>-->
                        <!--
                        <div class="update-check text-btn spacing1" @click="checkForUpdates">
                            <svg :class="{ 'refresh-flag': checkingUpdates }" width="14" height="14" viewBox="0 0 847.92 853.23" xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <g id="Layer_2-2" data-name="Layer 2">
                                            <g id="Layer_1-2-2" data-name="Layer 1-2">
                                                <path d="M722.91,136.61c0-17.65-.35-35.3.09-52.93.58-23,19.65-41,42.64-40.9A42.56,42.56,0,0,1,808,85.56v0c.16,38.17,0,76.33,0,114.49v54.5c-.07,25.68-18.46,44.14-44.12,44.16q-84.75.08-169.49,0c-21.66-.07-38.86-15.64-42.08-37.35-2.94-19.81,9.9-39.91,29.79-45.85a54.59,54.59,0,0,1,15.26-1.9c25.16-.19,50.32-.09,76.53-.09a51.87,51.87,0,0,0-3-4.35c-53.4-65-120.89-107-204.41-119.23-120.29-17.69-221,21.23-301.17,112-43.89,49.66-69.09,108.57-79,174-.8,5.26-1.24,10.59-2.17,15.83-3.89,21.83-24.31,37.22-46,34.82C15.69,424.12-1.76,405.28.14,383A356.16,356.16,0,0,1,9.31,326.4C42,196.44,117.61,100.17,237.93,40.47,302.23,8.56,371-4,442.53,1.11,551,9,642.25,53.63,717.11,132.23l4.7,5Z"/>
                                                <path d="M125.34,715.25v6.31c0,16.16.27,32.34-.19,48.49-.65,23-19.8,40.89-42.82,40.71-22.63-.18-42-18.42-42.1-41q-.48-87,0-174c.12-22.34,19.12-40.8,41.66-40.89,57.32-.22,114.65-.09,172,0a40.33,40.33,0,0,1,7.43.81A42.52,42.52,0,0,1,296,600.34c-1.35,21.43-18.92,39-40.45,39.47-24.82.49-49.66.18-74.48.21h-6.55a21.06,21.06,0,0,0,1.55,2.93c53.45,65.66,121.36,107.14,205.23,120.83,132.88,21.7,259.15-40.37,328.92-148.61a342.29,342.29,0,0,0,53-149.18c2.45-21.73,19.28-38.14,40-39.15,21.49-1.06,40.64,12.81,44,34.06,1.62,10.24.12,21.26-1.49,31.69-11.52,74.95-40.28,142.66-87.62,202-66,82.72-150.85,135.93-255.6,152.64-144.38,23-267.87-20.37-370.17-124.57C130.27,720.55,128.32,718.41,125.34,715.25Z"/>
                                            </g>
                                        </g>
                                    </g>
                                </g>
                            </svg>
                            <span>检查更新</span>
                        </div>
                        -->
                        <div class="new-version-wrap spacing1" v-show="hasNewRelease">
                            <span class="newflag content-text-highlight">最新版本</span>
                            <div class="release-url-link">
                                <span v-show="githubHasNewRelease">
                                    <svg width="17" height="17" @click.prevent="visitLink(githubReleasesUrl)"
                                        viewBox="0 0 896.57 896.13" xmlns="http://www.w3.org/2000/svg">
                                        <g id="Layer_2" data-name="Layer 2">
                                            <g id="Layer_1-2" data-name="Layer 1">
                                                <path
                                                    d="M530.94,661.76c9.72-1.55,20.09-3,30.37-4.87,29-5.35,56.87-13.91,82.47-28.93,34.06-20,58.17-48.61,72-85.41,17.43-46.46,22-94.58,14.29-143.53-4.89-31.28-18.72-58.83-39.16-83-2.4-2.84-3-5.13-1.83-8.86,11.22-34.68,9-69.25-1.37-103.68-.39-1.28-.85-2.53-1.28-3.79-3.61-10.76-4-11.08-15.5-10.44a129.51,129.51,0,0,0-51.66,14.21c-18.8,9.55-36.85,20.61-55.08,31.25-3,1.73-5.36,2.33-8.77,1.42C506.13,223,456,218.6,405.37,224.37c-21.76,2.48-43.23,7.56-64.76,11.81-3.63.72-6.2.37-9.2-1.67-24.46-16.6-49.88-31.4-78.41-40-11.84-3.57-23.86-6.12-36.39-4.87-2.8.28-4.43,1.19-5.44,4-13.43,38.1-17,76.51-4.17,115.58a6.28,6.28,0,0,1-1.11,5.15c-34.63,40.19-46.48,87.38-43.47,139.33,1.64,28.22,5.51,56,15,82.75,20.12,56.56,60.27,92,116.48,110.58,22.55,7.44,45.74,11.75,69.22,14.81.62.08,1.23.23,2.57.49-8.9,8.71-15.67,18.39-19.59,29.61-3.23,9.23-5.28,18.86-8,28.26-.45,1.55-1.37,3.65-2.63,4.18-25.86,11-52.27,15.86-79.58,5.66-21-7.82-35.64-22.95-46.76-41.78-8.78-14.85-19.45-27.91-34-37.39-14-9.13-29-14.94-46.19-12a24,24,0,0,0-4.8,1.3c-6.05,2.4-7.74,6.72-3.62,11.69,4,4.81,8.56,9.55,13.8,12.84,20.41,12.81,33.76,31.35,44.07,52.46,5,10.15,8.5,21.07,14.13,30.81,17.73,30.63,45.39,46.51,79.92,50.74a181.82,181.82,0,0,0,31.91.72c10.43-.57,20.77-2.62,31.79-4.1.09,1.48.29,3.19.3,4.91.22,23.5.47,47,.6,70.49.11,19.5-14.42,29.89-33,23.45a429.5,429.5,0,0,1-128.92-70.85C87.5,753.23,31,663.11,9.8,553c-28.65-148.76,5.39-282.82,103.76-398.79,59-69.58,133.7-115.82,222-139.57,49.52-13.33,99.89-17.33,151-13,187.9,15.94,347.67,152.93,394.17,339.6,38.12,153,7.54,292.8-92,415.79-52,64.23-118.34,109.22-196.38,136.71a29.35,29.35,0,0,1-19.14.58c-8.52-2.76-12.88-9.07-14.08-17.68a59.85,59.85,0,0,1-.28-8.48q.18-60,.42-120c.1-21.4-2.63-42.31-12.39-61.59C542.47,678,536.4,670.17,530.94,661.76Z" />
                                            </g>
                                        </g>
                                    </svg>
                                    <a href="#" @click.prevent="visitLink(githubReleasesUrl)" class="link"
                                        v-html="formatVersion(githubLastVersion)">
                                    </a>
                                </span>
                                <span :class="{ spacing5: githubHasNewRelease }" v-show="giteeHasNewRelease">
                                    <svg width="15" height="15" @click.prevent="visitLink(giteeReleasesUrl)"
                                        viewBox="0 0 49.87 49.82" xmlns="http://www.w3.org/2000/svg">
                                        <g id="Layer_2" data-name="Layer 2">
                                            <g id="Layer_1-2" data-name="Layer 1">
                                                <g id="Layer_2-2" data-name="Layer 2">
                                                    <g id="Layer_1-2-2" data-name="Layer 1-2">
                                                        <g id="LOGO">
                                                            <g id="Artboard">
                                                                <g id="logo-black">
                                                                    <g id="Group">
                                                                        <path id="G" class="cls-1"
                                                                            d="M47.62,19.93H22.15a2.21,2.21,0,0,0-2.22,2.2v5.55a2.21,2.21,0,0,0,2.2,2.22H37.65a2.23,2.23,0,0,1,2.22,2.21h0v.56h0v.55a6.65,6.65,0,0,1-6.65,6.65h-21A2.21,2.21,0,0,1,10,37.65h0v-21A6.65,6.65,0,0,1,16.65,10h31a2.21,2.21,0,0,0,2.22-2.2h0V2.21A2.21,2.21,0,0,0,47.66,0h-31A16.6,16.6,0,0,0,0,16.54V47.61a2.21,2.21,0,0,0,2.21,2.21H34.88A15,15,0,0,0,49.83,34.88V22.15a2.21,2.21,0,0,0-2.2-2.22Z" />
                                                                    </g>
                                                                </g>
                                                            </g>
                                                        </g>
                                                    </g>
                                                </g>
                                            </g>
                                        </g>
                                    </svg>
                                    <a href="#" @click.prevent="visitLink(giteeReleasesUrl)" class="link"
                                        v-html="formatVersion(giteeLastVersion)">
                                    </a>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="last">
                        <div class="update-check text-btn" @click="checkForUpdates">
                            <svg :class="{ 'refresh-flag': checkingUpdates }" width="14" height="14" viewBox="0 0 847.92 853.23" xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <g id="Layer_2-2" data-name="Layer 2">
                                            <g id="Layer_1-2-2" data-name="Layer 1-2">
                                                <path d="M722.91,136.61c0-17.65-.35-35.3.09-52.93.58-23,19.65-41,42.64-40.9A42.56,42.56,0,0,1,808,85.56v0c.16,38.17,0,76.33,0,114.49v54.5c-.07,25.68-18.46,44.14-44.12,44.16q-84.75.08-169.49,0c-21.66-.07-38.86-15.64-42.08-37.35-2.94-19.81,9.9-39.91,29.79-45.85a54.59,54.59,0,0,1,15.26-1.9c25.16-.19,50.32-.09,76.53-.09a51.87,51.87,0,0,0-3-4.35c-53.4-65-120.89-107-204.41-119.23-120.29-17.69-221,21.23-301.17,112-43.89,49.66-69.09,108.57-79,174-.8,5.26-1.24,10.59-2.17,15.83-3.89,21.83-24.31,37.22-46,34.82C15.69,424.12-1.76,405.28.14,383A356.16,356.16,0,0,1,9.31,326.4C42,196.44,117.61,100.17,237.93,40.47,302.23,8.56,371-4,442.53,1.11,551,9,642.25,53.63,717.11,132.23l4.7,5Z"/>
                                                <path d="M125.34,715.25v6.31c0,16.16.27,32.34-.19,48.49-.65,23-19.8,40.89-42.82,40.71-22.63-.18-42-18.42-42.1-41q-.48-87,0-174c.12-22.34,19.12-40.8,41.66-40.89,57.32-.22,114.65-.09,172,0a40.33,40.33,0,0,1,7.43.81A42.52,42.52,0,0,1,296,600.34c-1.35,21.43-18.92,39-40.45,39.47-24.82.49-49.66.18-74.48.21h-6.55a21.06,21.06,0,0,0,1.55,2.93c53.45,65.66,121.36,107.14,205.23,120.83,132.88,21.7,259.15-40.37,328.92-148.61a342.29,342.29,0,0,0,53-149.18c2.45-21.73,19.28-38.14,40-39.15,21.49-1.06,40.64,12.81,44,34.06,1.62,10.24.12,21.26-1.49,31.69-11.52,74.95-40.28,142.66-87.62,202-66,82.72-150.85,135.93-255.6,152.64-144.38,23-267.87-20.37-370.17-124.57C130.27,720.55,128.32,718.41,125.34,715.25Z"/>
                                            </g>
                                        </g>
                                    </g>
                                </g>
                            </svg>
                            <span>检查更新</span>
                        </div>
                        <div class="checkbox text-btn spacing1" @click="toggleCheckPreReleaseVersion">
                            <svg v-show="!others.checkPreReleaseVersion" width="16" height="16" viewBox="0 0 731.64 731.66"
                                xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M365.63,731.65q-120.24,0-240.47,0c-54.2,0-99.43-30.93-117.6-80.11A124.59,124.59,0,0,1,0,608q0-242.21,0-484.42C.11,60.68,43.7,10.45,105.88,1.23A128.67,128.67,0,0,1,124.81.06q241-.09,481.93,0c61.43,0,110.72,39.85,122.49,99.08a131.72,131.72,0,0,1,2.3,25.32q.19,241.47.07,482.93c0,60.87-40.25,110.36-99.18,121.9a142.56,142.56,0,0,1-26.83,2.29Q485.61,731.81,365.63,731.65ZM48.85,365.45q0,121.76,0,243.5c0,41.57,32.38,73.82,73.95,73.83q243,.06,486,0c41.57,0,73.93-32.24,73.95-73.84q.11-243.24,0-486.49c0-41.3-32.45-73.55-73.7-73.57q-243.24-.06-486.49,0a74.33,74.33,0,0,0-14.89,1.42c-34.77,7.2-58.77,36.58-58.8,72.1Q48.76,244,48.85,365.45Z" />
                                    </g>
                                </g>
                            </svg>
                            <svg v-show="others.checkPreReleaseVersion" class="checked-svg" width="16" height="16"
                                viewBox="0 0 767.89 767.94" xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                                    </g>
                                </g>
                            </svg>
                            <span>不忽略Pre-release预览版</span>
                        </div>
                        <div class="checkbox text-btn spacing5" @click="togglUpdatesHintShow">
                            <svg v-show="!others.updatesHintShow" width="16" height="16" viewBox="0 0 731.64 731.66"
                                xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M365.63,731.65q-120.24,0-240.47,0c-54.2,0-99.43-30.93-117.6-80.11A124.59,124.59,0,0,1,0,608q0-242.21,0-484.42C.11,60.68,43.7,10.45,105.88,1.23A128.67,128.67,0,0,1,124.81.06q241-.09,481.93,0c61.43,0,110.72,39.85,122.49,99.08a131.72,131.72,0,0,1,2.3,25.32q.19,241.47.07,482.93c0,60.87-40.25,110.36-99.18,121.9a142.56,142.56,0,0,1-26.83,2.29Q485.61,731.81,365.63,731.65ZM48.85,365.45q0,121.76,0,243.5c0,41.57,32.38,73.82,73.95,73.83q243,.06,486,0c41.57,0,73.93-32.24,73.95-73.84q.11-243.24,0-486.49c0-41.3-32.45-73.55-73.7-73.57q-243.24-.06-486.49,0a74.33,74.33,0,0,0-14.89,1.42c-34.77,7.2-58.77,36.58-58.8,72.1Q48.76,244,48.85,365.45Z" />
                                    </g>
                                </g>
                            </svg>
                            <svg v-show="others.updatesHintShow" class="checked-svg" width="16" height="16"
                                viewBox="0 0 767.89 767.94" xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                                    </g>
                                </g>
                            </svg>
                            <span>小红点提醒</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="about row last-row">
                <span class="cate-name">关于</span>
                <div class="content">
                    <div>
                        <span>开发者：</span>
                        <span>RIVE2012</span>
                    </div>
                    <div class="repository">
                        <div>
                            <span>访问源码：</span>
                        </div>
                        <div @click.prevent="visitLink(GITHUB)">
                            <!--<svg width="21" height="21" viewBox="0 0 887.63 729.14" xmlns="http://www.w3.org/2000/svg" ><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M449.7,519H436.94v7c0,38.49.27,77-.29,115.47a274.62,274.62,0,0,1-4,40.72c-3.81,23-30.6,45.61-53.93,46.47-4,.15-8.32,0-10.19-4.59-1.63-3.93.13-7.33,3.11-9.78,11.85-9.69,15.75-22.91,16-37.33.83-50.31,1.3-100.63,1.89-151,0-.79-.15-1.57-.38-3.75-2.81,3.17-5.1,5.26-6.79,7.75-5.31,7.8-7.58,16.62-7.65,26-.27,35.16-.86,70.33-.43,105.49.19,15.38-6.25,26.19-18.3,34.39-15.42,10.51-32.44,15.36-51.1,12.9-3.13-.41-6-2.71-9-4.13,1.55-3,2.46-6.6,4.76-8.76,4.72-4.42,10.19-8,15.32-12,10.23-7.94,15.63-17.76,15.19-31.34-.77-23.31-.37-46.66-.45-70,0-1.79,0-3.58,0-5.88-6.72.65-12.81,1.4-18.91,1.79-17.31,1.12-34.64,2-51.76-1.82-29.85-6.66-50.12-25-63-52.15-2.49-5.26-4.72-10.64-7.19-15.92a109.74,109.74,0,0,0-39.66-45.91c-2.92-1.92-6.06-3.77-8.3-6.35-1.9-2.19-4.12-5.78-3.51-8s4.39-4.4,7.13-5c13.42-3,26.65-1.51,37.69,6.75,9.1,6.82,17.2,15.13,25,23.51,7.1,7.68,13.23,16.29,19.65,24.59,11.62,15,26.59,23.6,45.76,25.23,19.38,1.65,38.24.63,56.26-7.47,3.29-1.48,4.92-3.52,5.63-7.28,3.42-18.3,13.64-32.63,27.17-44.88,1.1-1,2.24-1.94,4.29-3.71-5.84-.75-10.78-1.36-15.71-2-40.45-5.44-79.44-15.3-114.2-37.84a159.38,159.38,0,0,1-51.41-53.63c-.94-1.6-3.46-3.3-5.19-3.25-41,1.18-81.86,4-121.74,14.65-16.56,4.41-33.07,9-49.6,13.52-1.45.4-3,1.16-4.35.95S2.08,391,.81,390.19c.73-1.15,1.22-2.92,2.25-3.33a66,66,0,0,1,8.63-2.42c24.5-6.23,48.85-13.17,73.54-18.5,29.39-6.35,59.44-7.56,89.42-8.77,1.64-.07,3.27-.19,5.47-.31-2.26-5.39-4.19-10.49-6.59-15.34-.49-1-2.78-1.55-4.21-1.49-29.45,1.37-59,2-88.33,4.58-25.32,2.24-50.44,6.81-75.67,10.15-1.66.22-3.54-1.28-5.32-2,1.4-1.31,2.66-3.54,4.22-3.78,22.86-3.5,45.67-7.69,68.67-9.81,32.32-3,64.79-4.39,97-6.46-2.4-10.3-5.64-21.32-7.49-32.56-5.72-34.71-7.69-69.54-.64-104.35,4.15-20.47,13.7-38.45,26-55.07,3.88-5.21,7.72-10.47,11.92-15.42,2.42-2.85,2.79-5.42,1.86-9-8.29-32.13-8.47-64.23,1.15-96.16,1.34-4.45,3.54-8.65,4.72-13.13,1.26-4.75,4.33-5.57,8.54-5.53,16.07.15,31.25,4.35,46.1,10,23.35,8.89,44.62,21.57,65,35.87a7.25,7.25,0,0,0,7.65,1c19.25-7,39.42-9.53,59.67-11.38a498.19,498.19,0,0,1,95.84.15c15.85,1.62,31.56,4.82,47.27,7.61a10.51,10.51,0,0,0,8.3-1.46C571,27.45,596.93,13.2,625.51,4.6,634,2,643.09,1.21,652,.11c5.43-.68,9.13,1.8,11.53,7.27,9,20.54,11,42.12,9.8,64.08-.68,12.45-2.74,24.81-3.89,37.24a10,10,0,0,0,1.82,6.28c6,8.2,12.62,16,18.44,24.26,19.06,27.24,28,58,30.05,90.82a337.44,337.44,0,0,1-8.8,99.67c-.3,1.25-.44,2.54-.72,4.23H741A665.71,665.71,0,0,1,882.8,348.82c.32.07.77,0,1,.16,1.32,1.2,2.58,2.46,3.86,3.7-1.59.77-3.3,2.38-4.76,2.17-7.24-1-14.43-2.47-21.61-3.91C814,341.45,766.05,339.77,718,340c-9.64,0-9.64.08-12.84,9l-2.85,8.05c10.28.61,20.05,1.13,29.82,1.78A653.33,653.33,0,0,1,880.67,385.8c1.73.53,4.36,3,4.14,4.13-.71,3.69-3.8,2.17-6.06,1.49A662.29,662.29,0,0,0,749,366.36c-15.42-1.43-30.92-2.08-46.39-2.87-1.4-.07-3.66,1.05-4.22,2.24-21,44.53-58.59,67.5-104.1,80.17-23.81,6.62-48.14,10.34-72.66,13.06-.95.11-1.91.24-3.44.44.65.85.9,1.44,1.35,1.73,21.74,13.78,31.1,34.66,34.35,59.23,4,30.54,2.54,61.22,2.59,91.86,0,14.33-.23,28.67-.66,43-.29,9.64,3,17.8,9.86,24.21,6.31,5.89,13.44,10.9,19.89,16.66,2.28,2,3.63,5.11,5.41,7.72-2.79,1.53-5.45,4.09-8.38,4.42-21.32,2.4-41.32-.76-57.51-16.33-8.69-8.37-12.41-18.89-12.54-31-.39-36.32-.91-72.65-2-109-.2-6.79-2.73-13.62-4.83-20.22-1.16-3.66-4-6.45-9-6.85-.09,2-.23,3.71-.23,5.45,0,45.16.15,90.33-.11,135.49-.08,14.82,4,27.84,13.19,39.4a89.9,89.9,0,0,1,6.9,9.79c2.06,3.43,2.83,7.3.43,10.88s-6.37,3.79-9.94,2.82c-29.29-8-51.75-23.39-55.15-54.81-1.3-12.07-2.06-24.24-2.15-36.37-.26-37.33-.07-74.67-.06-112Zm-1.94-79c0-.43,0-.86,0-1.3,17.49,0,35,.22,52.48,0,23.86-.37,47.58-2.25,70.69-8.73,22.65-6.35,43.37-16.24,59.6-33.8C651.47,373.51,658.39,346,657.91,316c-.84-52.11-33.27-89.91-84.54-99.22-21-3.81-41.84-2-62.75-.46-43.79,3.23-87.56,2.55-131.36.15-21.08-1.16-42.15-3.93-63.32-.55-30.2,4.81-55.53,17.73-73.94,42.89-32.64,44.57-21.6,116.83,30.24,149.74,28.19,17.9,59.46,25.83,92.14,28.21C392.1,438.79,420,439,447.76,440ZM199.1,484.39c2.86-2.77,6.17-4.47,6.39-6.51.41-3.77-3.46-4.41-6.44-4.43s-6.84.75-6.44,4.46C192.82,479.94,196.19,481.63,199.1,484.39Zm91.43,57.36c3-2.62,6.53-4.21,6.8-6.23.47-3.61-3.14-4.54-6.33-4.6s-6.81.74-6.66,4.28C284.43,537.18,287.8,539,290.53,541.75ZM164.17,457.14c3.07-2.67,6.48-4.21,6.81-6.24.6-3.75-3.33-5-6.17-4.56-2.49.41-4.68,2.7-7,4.16Zm21.54,11.63c3-2.64,6.46-4.25,6.72-6.28.48-3.65-3.15-4.51-6.32-4.57s-6.81.75-6.62,4.31C179.59,464.21,183,466,185.71,468.77Zm24.74,33.16c2.92-2.72,6.3-4.39,6.52-6.4.41-3.66-3.28-4.49-6.39-4.5s-6.8.77-6.48,4.41C204.27,497.44,207.61,499.17,210.45,501.93Zm13.25,16.64c2.83-2.76,6.2-4.52,6.37-6.55.3-3.65-3.42-4.39-6.53-4.34s-6.85.7-6.39,4.45C217.41,514.19,220.79,515.86,223.7,518.57Zm92,19.24c2.89-2.67,6.37-4.38,6.53-6.36.28-3.54-3.33-4.48-6.51-4.47s-6.81.89-6.51,4.46C309.4,533.42,312.85,535.14,315.72,537.81ZM266,529c-2.85,2.72-6.26,4.45-6.42,6.44-.29,3.58,3.39,4.47,6.52,4.44s6.8-.86,6.42-4.51C272.26,533.38,268.86,531.71,266,529Zm-24.66,3.72c2.85-2.79,6.13-4.5,6.37-6.56.45-3.8-3.32-4.37-6.37-4.37s-6.82.57-6.37,4.38C235.16,528.24,238.44,529.94,241.29,532.73Z"/><path d="M144.79,471.34c2.07,8.47,4.6,16.86,6.06,25.44.9,5.27-2.07,7.59-7.41,7.46-4.43-.1-7.14-2.23-6.71-6.75a80.78,80.78,0,0,1,2.46-12.67c1.17-4.49,2.77-8.86,4.18-13.28Z"/><path d="M283.59,316.26c.3-17.22,4.36-35,17.11-49.7,15.84-18.21,37-18.13,53-.18,21.84,24.54,23.05,73.17,2.45,98.08C340,384,314,384,298.07,364.19,287.22,350.73,283.7,334.87,283.59,316.26Z"/><path d="M607,316.08c-.35,19.12-3.84,35.15-15,48.63-15.89,19.16-41.54,19.12-57.42,0-8.58-10.33-12.82-22.47-14.23-35.6-2.1-19.69.58-38.56,11.34-55.61a57.4,57.4,0,0,1,9.58-11.4c13.31-12.22,30.77-12.17,44.17,0,12.18,11,17.75,25.44,20.33,41.22C606.54,308.17,606.72,313.18,607,316.08Z"/><path d="M442.05,418c-10.23-.05-18.13-4.67-24.06-12.78a11.3,11.3,0,0,1-2.39-5.37c-.11-1.56,1.21-3.22,1.9-4.83,1.24,1,3.06,1.81,3.62,3.12,4.59,10.69,17.28,16.64,28.08,12.73,5.76-2.08,9.91-5.8,11.53-12.08.37-1.46,2.25-2.54,3.43-3.79.8,1.74,2.46,3.59,2.25,5.19-1.15,8.91-10.68,16.83-20.88,17.8C444.38,418.05,443.21,418,442.05,418Z"/><path d="M452.16,372.23A10.36,10.36,0,0,1,442,383a10.49,10.49,0,0,1-.47-21A10.35,10.35,0,0,1,452.16,372.23Z"/></g></g></svg>-->
                            <svg width="17" height="17" viewBox="0 0 896.57 896.13" xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M530.94,661.76c9.72-1.55,20.09-3,30.37-4.87,29-5.35,56.87-13.91,82.47-28.93,34.06-20,58.17-48.61,72-85.41,17.43-46.46,22-94.58,14.29-143.53-4.89-31.28-18.72-58.83-39.16-83-2.4-2.84-3-5.13-1.83-8.86,11.22-34.68,9-69.25-1.37-103.68-.39-1.28-.85-2.53-1.28-3.79-3.61-10.76-4-11.08-15.5-10.44a129.51,129.51,0,0,0-51.66,14.21c-18.8,9.55-36.85,20.61-55.08,31.25-3,1.73-5.36,2.33-8.77,1.42C506.13,223,456,218.6,405.37,224.37c-21.76,2.48-43.23,7.56-64.76,11.81-3.63.72-6.2.37-9.2-1.67-24.46-16.6-49.88-31.4-78.41-40-11.84-3.57-23.86-6.12-36.39-4.87-2.8.28-4.43,1.19-5.44,4-13.43,38.1-17,76.51-4.17,115.58a6.28,6.28,0,0,1-1.11,5.15c-34.63,40.19-46.48,87.38-43.47,139.33,1.64,28.22,5.51,56,15,82.75,20.12,56.56,60.27,92,116.48,110.58,22.55,7.44,45.74,11.75,69.22,14.81.62.08,1.23.23,2.57.49-8.9,8.71-15.67,18.39-19.59,29.61-3.23,9.23-5.28,18.86-8,28.26-.45,1.55-1.37,3.65-2.63,4.18-25.86,11-52.27,15.86-79.58,5.66-21-7.82-35.64-22.95-46.76-41.78-8.78-14.85-19.45-27.91-34-37.39-14-9.13-29-14.94-46.19-12a24,24,0,0,0-4.8,1.3c-6.05,2.4-7.74,6.72-3.62,11.69,4,4.81,8.56,9.55,13.8,12.84,20.41,12.81,33.76,31.35,44.07,52.46,5,10.15,8.5,21.07,14.13,30.81,17.73,30.63,45.39,46.51,79.92,50.74a181.82,181.82,0,0,0,31.91.72c10.43-.57,20.77-2.62,31.79-4.1.09,1.48.29,3.19.3,4.91.22,23.5.47,47,.6,70.49.11,19.5-14.42,29.89-33,23.45a429.5,429.5,0,0,1-128.92-70.85C87.5,753.23,31,663.11,9.8,553c-28.65-148.76,5.39-282.82,103.76-398.79,59-69.58,133.7-115.82,222-139.57,49.52-13.33,99.89-17.33,151-13,187.9,15.94,347.67,152.93,394.17,339.6,38.12,153,7.54,292.8-92,415.79-52,64.23-118.34,109.22-196.38,136.71a29.35,29.35,0,0,1-19.14.58c-8.52-2.76-12.88-9.07-14.08-17.68a59.85,59.85,0,0,1-.28-8.48q.18-60,.42-120c.1-21.4-2.63-42.31-12.39-61.59C542.47,678,536.4,670.17,530.94,661.76Z" />
                                    </g>
                                </g>
                            </svg>
                            <span class="link">Github</span>
                        </div>
                        <div class="spacing" @click.prevent="visitLink(GITEE)">
                            <svg width="15" height="15" viewBox="0 0 49.87 49.82" xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <g id="Layer_2-2" data-name="Layer 2">
                                            <g id="Layer_1-2-2" data-name="Layer 1-2">
                                                <g id="LOGO">
                                                    <g id="Artboard">
                                                        <g id="logo-black">
                                                            <g id="Group">
                                                                <path id="G" class="cls-1"
                                                                    d="M47.62,19.93H22.15a2.21,2.21,0,0,0-2.22,2.2v5.55a2.21,2.21,0,0,0,2.2,2.22H37.65a2.23,2.23,0,0,1,2.22,2.21h0v.56h0v.55a6.65,6.65,0,0,1-6.65,6.65h-21A2.21,2.21,0,0,1,10,37.65h0v-21A6.65,6.65,0,0,1,16.65,10h31a2.21,2.21,0,0,0,2.22-2.2h0V2.21A2.21,2.21,0,0,0,47.66,0h-31A16.6,16.6,0,0,0,0,16.54V47.61a2.21,2.21,0,0,0,2.21,2.21H34.88A15,15,0,0,0,49.83,34.88V22.15a2.21,2.21,0,0,0-2.2-2.22Z" />
                                                            </g>
                                                        </g>
                                                    </g>
                                                </g>
                                            </g>
                                        </g>
                                    </g>
                                </g>
                            </svg>
                            <span class="link">Gitee</span>
                        </div>
                    </div>
                    <div class="license" @click.prevent="visitLink('https://www.apache.org/licenses/LICENSE-2.0.html')">
                        <div><span>开源许可：</span></div>
                        <div>
                            <svg width="18" height="18" viewBox="0 0 682.53 853.37" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M597.27,85.49H85.58V682.75H91.3c40.16,0,80.33-.06,120.49,0,20.73.05,37.17,12.1,42.43,30.72,7.81,27.62-12.35,54.34-41.4,54.46-41,.17-82,0-123,0q-22.25,0-44.49,0C17.86,768,0,750.17,0,722.59q0-160.5,0-321Q0,223.36,0,45.13C0,23.57,11.47,7.32,30.82,1.84A51.16,51.16,0,0,1,44.61.07Q340.85,0,637.07,0c27.52,0,45.42,17.78,45.43,45.27q.06,157.24,0,314.48,0,178.74-.07,357.48c0,6.77-.1,13.82-1.86,20.27-5.45,19.92-25.56,32.91-45.52,30.26-22-2.92-37.74-20.56-37.77-42.76q-.15-101.25,0-202.49,0-215.74,0-431.48Z"/><path d="M351.65,744c-35.16-27.29-53.79-62.8-52.88-107.35.74-36.25,15.18-66.86,41.87-91.38,51.7-47.49,133.42-43.39,180.56,8.49,49.65,54.65,44.22,142.85-19.61,190.24.71,1.34,1.39,2.78,2.19,4.17,8.05,14,16.44,27.79,24.11,42,14,25.84-.6,56.52-29.31,62.4A42.14,42.14,0,0,1,454.37,833c-8.56-14.07-16.59-28.47-24.86-42.72-.83-1.43-1.68-2.85-2.86-4.85-1.19,1.91-2.15,3.39-3,4.91-8.44,14.53-16.41,29.36-25.44,43.52-9.71,15.23-24.49,21.5-42.14,18.82-17.26-2.62-28.92-13-34.18-29.78-3.79-12.06-2-23.67,4.4-34.61q11.43-19.62,22.74-39.33C349.89,747.38,350.69,745.77,351.65,744Zm32.4-104a42.6,42.6,0,1,0,42.47-42.67A42.7,42.7,0,0,0,384.05,640Z"/><path d="M341,256c-42.32,0-84.63.07-126.94,0-23.1-.05-40.65-15.91-43.26-38.75-2.65-23.24,16-45.64,39.48-46.2,26.3-.64,52.64-.26,79-.27q89,0,177.91,0c21.11,0,37.66,11.86,43,30.61C518.07,229,498,255.82,469,256,426.33,256.14,383.68,256,341,256Z"/><path d="M277.52,341.25c20.82,0,41.64-.13,62.46,0,22.4.17,40.43,15.24,43.33,35.89,3.71,26.42-14.63,49-41.6,49.38-43,.61-85.94.54-128.91,0-23.05-.28-39.83-16.77-42.05-39.47-2-20.3,12.32-39.83,32.92-44.58a57.74,57.74,0,0,1,12.39-1.22C236.54,341.19,257,341.25,277.52,341.25Z"/></g></g></svg>
                            <span class="link">
                                Apache License 2.0
                            </span>
                        </div>
                    </div>
                    <div class="annoucement last">
                        <span>郑重声明：Less Player开源免费，仅供学习交流；若谁做非法用途，后果自负！</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
#setting-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    text-align: left;
    overflow: scroll;
    overflow-x: hidden;
    position: relative;
}

/*TODO 为更方便点击，把按钮调大，先挖个坑吧*/
#setting-view .toggle-ctl {
    width: 42px;
    height: 21px;
}

#setting-view .toggle-ctl .thumb {
    width: 17px;
    height: 17px;
}

#setting-view .navbar {
    --height-factor: 36px;
    position: fixed;
    top: calc(var(--main-top-height) + 3px + var(--app-win-custom-shadow-size) + var(--height-factor) / 2);
    right: calc(0px + var(--app-win-custom-shadow-size));
    height: calc(100% - var(--main-top-height) - var(--main-bottom-height) - 6px - 30px - var(--app-win-custom-shadow-size) * 2 - var(--height-factor));
    padding: 15px 0px;
    /*background: var(--content-bg-color);
    background: var(--content-bg-color-no-transparent);*/
    background: var(--app-bg-color);
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    overflow: auto;
    overflow-x: hidden;
    box-shadow: var(--box-shadow);
    border-top-left-radius: var(--border-popover-border-radius);
    border-bottom-left-radius: var(--border-popover-border-radius);
    /*border-radius: var(--border-popover-border-radius);
    background: var(--content-left-nav-bg-color);*/
}

/*
#setting-view .navbar::-webkit-scrollbar {
    width: 0;
}
*/
#setting-view .navbar svg {
    display: none;
}

#setting-view .navbar ul {
    padding: 0px 15px;
    background: transparent;
}

#setting-view .navbar li {
    list-style: none;
    padding: 6px 40px 6px 20px;
    margin-top: 8px;
    text-align: left;
    font-size: calc(var(--content-text-size) - 1px);
    border-radius: var(--border-list-item-vertical-border-radius);
    cursor: pointer;
}

#setting-view .navbar li.first {
    margin-top: 0px;
}

#setting-view .navbar li:hover {
    /*background: var(--content-list-item-hover-bg-color);
    font-weight: bold;
    transform: scale(1.03);*/
    /*
    background: var(--button-icon-text-btn-bg-color);
    color: var(--button-icon-text-btn-text-color);
    */
    background: var(--content-list-item-hl-bg-color) !important;
    color: var(--content-list-item-hl-text-color) !important;
    transform: scale(1.03);
}

.contrast-mode #setting-view .navbar li:hover {
    font-weight: bold;
}

#setting-view .navbar.collapse {
    top: auto;
    bottom: calc(var(--main-bottom-height) + 15px + var(--app-win-custom-shadow-size));
    right: calc(20px + var(--app-win-custom-shadow-size));
    padding: 0px;
    width: 36px;
    height: 36px;
    overflow: hidden;
    border: 0.1px solid var(--border-color);
    box-shadow: 0px 0px 1px #161616;
    background: var(--button-icon-text-btn-bg-color);
    border-radius: var(--border-flow-btn-border-radius);
    align-items: center;
    justify-content: center;
}

#setting-view .navbar.collapse:hover {
    background: var(--button-icon-text-btn-hover-bg-color);
    cursor: pointer;
}

#setting-view .navbar.collapse ul {
    display: none;
}

#setting-view .navbar.collapse svg {
    fill: var(--button-icon-text-btn-icon-color) !important;
    display: block;
}


#setting-view .title {
    margin-left: 35px;
    margin-right: 35px;
    margin-bottom: 10px;
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
    border-bottom: 2px solid transparent;
}

#setting-view .center {
    padding: 0px 33px 33px 33px;
}

#setting-view .center .row {
    display: flex;
    flex-direction: row;
    padding-top: 35px;
    padding-bottom: 35px;
    border-bottom: 1px solid var(--border-color);
}

#setting-view .center .last-row {
    border-color: transparent;
}

#setting-view .center .row > .cate-name {
    font-size: var(--content-text-tab-title-size);
    margin-left: 10px;
    width: 110px;
}

#setting-view .content,
#setting-view .content > div,
#setting-view .keys-input-ctl {
    flex: 1;
}

#setting-view .content > div {
    margin-bottom: 33px;
    display: flex;
    flex-direction: row;
    align-items: center;
}

#setting-view .content > div .cate-subtitle {
    width: var(--content-setting-cate-subtitle-width);
    margin-right: 25px;
}

#setting-view .track .content > div.last .cate-subtitle {
    min-width: var(--content-setting-cate-subtitle-width);
}


#setting-view .max-content-mr-20 .cate-subtitle {
    max-width: max-content;
    margin-right: 20px;
}

#setting-view .max-content-mr-36 .cate-subtitle {
    max-width: max-content !important;
    margin-right: 36px;
}

#setting-view .content .last {
    margin-bottom: 0px;
}

#setting-view .theme {
    padding-bottom: 10px !important;
}

#setting-view .theme .cate-name b {
    font-weight: normal;
}

#setting-view .theme .cate-name b:hover {
    cursor: pointer;
    font-weight: bold;
    background: var(--content-text-highlight-color);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent !important;
}

#setting-view .theme .content {
    display: flex;
    flex-direction: column;
}

#setting-view .theme .content .theme-mode-wrap {
    display: flex;
    flex-direction: row;
    align-items: center;
}

#setting-view .theme .content .theme-mode {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-right: 36px;
}

#setting-view .theme .content .preset-themes {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
}

#setting-view .theme .content .theme-mode-wrap .mode-preview-item,
#setting-view .theme .content .preset-themes .item {
    --size: 50px;
    width: var(--size);
    max-width: var(--size);
    height: var(--size);
    border-radius: var(--border-inputs-border-radius);
    box-shadow: 0px 0px 1px #212121;
    text-align: center;
    margin-right: 23px;
    margin-bottom: 25px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 3px solid transparent;
}

#setting-view .theme .content .theme-mode-wrap .mode-preview-item {
    margin-bottom: 15px;
    border-color: #ffd700;
    position: relative;
}

#setting-view .theme .content .theme-mode-wrap .mode-preview-item span,
#setting-view .theme .content .preset-themes .item span {
    background-color: var(--app-bg-color);
    opacity: 0.68;
    line-height: 51px;
    border-radius: var(--border-inputs-border-radius);
    overflow: hidden;
    visibility: hidden;
    font-size: 16px;
    margin: 0px !important;
}

#setting-view .theme .content .theme-mode-wrap .mode-preview-item span {
    overflow: hidden;
    text-overflow: ellipsis;
    word-wrap: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;

    position: absolute;
    bottom: -43px;
    background: transparent;
    opacity: 1;
    line-height: auto;
    /*font-weight: bold;*/
    font-size: calc(var(--content-text-tip-text-size) - 1px);
    color: var(--content-subtitle-text-color);
    visibility: visible;
    width: fit-content;
}

#setting-view .theme .content .theme-mode-wrap .mode-preview-item:hover span,
#setting-view .theme .content .theme-mode-wrap .mode-preview-item span:hover {
    font-weight: bold;
    background: var(--content-text-highlight-color);
    background-clip: text !important;
    -webkit-background-clip: text !important;
    color: transparent !important;
}

#setting-view .theme .content .preset-themes .item:hover span {
    visibility: visible;
}

#setting-view .theme .content .preset-themes .active {
    border-color: #ffd700;
}

#setting-view .theme .content .preset-themes .lightText {
    color: #fff !important;
}

#setting-view .common .content {
    display: flex;
    flex-direction: column;
    margin-right: 30px;
}

#setting-view .common .window-zoom {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
}

#setting-view .common .window-zoom div {
    display: flex;
    flex-direction: row;
    flex: 1;
    width: 100%;
    align-items: center;
}

#setting-view .common .window-zoom .zoom-title input {
    border-radius: var(--border-inputs-border-radius);
    padding: 8px;
    border: 1px solid var(--border-inputs-border-color);
    background-color: var(--content-inputs-bg-color);
    margin-right: 15px;
    margin-left: 15px;
    color: var(--content-inputs-text-color);
}

#setting-view .content .layout-item,
#setting-view .common .content .fslevel-item,
#setting-view .content .quality-item {
    min-width: 68px;
    padding: 6px 8px;
    text-align: center;
    margin-left: 15px;
    border-radius: var(--border-list-item-border-radius);
    border: 0px solid var(--border-color);
    cursor: pointer;
}

#setting-view .content .first-item {
    margin-left: 0px !important;
}

#setting-view .common .content .fslevel-item.first-item {
    margin-left: 10px !important;
}

#setting-view .common .content .fslevel-item {
    min-width: 52px !important;
}

#setting-view .content .layout-item:hover,
#setting-view .common .content .fslevel-item:hover,
#setting-view .content .quality-item:hover {
    background-color: var(--border-color);
    background-color: var(--content-list-item-hover-bg-color);
}

#setting-view .theme-mode .active,
#setting-view .layout .content .active,
#setting-view .common .content .active,
#setting-view .track .content .active,
#setting-view .desktopLyric .content .active,
#setting-view .cache .content .active {
    /*
    background: var(--button-icon-text-btn-bg-color) !important;
    color: var(--button-icon-text-btn-icon-color) !important;
    */
    /*border: 1px solid var(--border-color);*/
    background: var(--content-list-item-hl-bg-color) !important;
    color: var(--content-list-item-hl-text-color) !important;
}

.contrast-mode #setting-view .theme-mode .active,
.contrast-mode #setting-view .layout .content .active,
.contrast-mode #setting-view .common .content .active,
.contrast-mode #setting-view .track .content .active,
.contrast-mode #setting-view .cache .content .active,
.contrast-mode #setting-view .desktopLyric .content .active,
.contrast-mode #setting-view .font-input-ctl .select-btn,
.contrast-mode #setting-view .dir-input-ctl .select-btn {
    font-weight: bold;
}

#setting-view .common .content .sec-title {
    width: 136px;
}

#setting-view .titled-w258 .cate-subtitle {
    width: 258px !important;
}

#setting-view .window-ctl .sec-title,
#setting-view .border-radius-ctl .sec-title,
#setting-view .window-custom-shadow .sec-title,
#setting-view .keys .cate-subtitle {
    width: 159px !important;
}

#setting-view .keys .toggle-global .cate-subtitle {
    width: var(--content-setting-cate-subtitle-width) !important;
    margin-right: 25px;
}

#setting-view .window-custom-shadow input {
    margin-left: 0px !important;
}

#setting-view .desktopLyric .content .sec-title {
    width: 159px;
}

#setting-view .keys .global-keys-ctrl {
    margin-left: 35px;
    margin-right: 20px;
}

#setting-view .keys .svg-text-btn {
    margin-left: 188px;
}


#setting-view .keys-input-ctl input {
    min-width: 159px;
    /*width: 93.5%;*/
    width: 93%;
    padding: 8px;
}

#setting-view .keysInputAdptWidth input {
    width: 41%;
}

#setting-view .center .spacing {
    margin-left: 25px;
}

#setting-view .center .spacing1 {
    margin-left: 50px;
}

#setting-view .center .spacing2 {
    margin-left: 72px;
}

#setting-view .center .spacing3 {
    margin-left: 40px;
}

#setting-view .center .spacing4 {
    margin-left: 28px;
}

#setting-view .center .spacing5 {
    margin-left: 35px;
}

#setting-view .link {
    color: var(--content-text-color);
}


#setting-view datalist {
    background: transparent;
}

#setting-view #zoom-tickmarks {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
    writing-mode: lr;
    flex: 1;
}

#setting-view #zoom-tickmarks option {
    font-size: 13px;
    cursor: pointer;
}

#setting-view input[type=range] {
    padding: 0px 1px;
    width: 100%;
    cursor: pointer;
    background: transparent;
    appearance: none;
    margin-top: 10px;
    margin-bottom: 5px;
}

#setting-view input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 22px;
    width: 8px;
    /*background: var(--content-text-highlight-color);*/
    background: var(--content-highlight-color);
    border-radius: 10rem;
    margin-top: -8px;
}

#setting-view input[type=range]::-webkit-slider-runnable-track {
    background: var(--others-progressbar-bg-color);
    border-radius: 10rem;
    height: 6px;
}

#setting-view .cache-size-text {
    width: 88px;
}

#setting-view .common input[type='text'],
#setting-view .common input[type='number'],
#setting-view .track input[type='number'],
#setting-view .desktopLyric input[type='number'],
#setting-view .cache input[type='number'],
#setting-view .network input {
    border-radius: var(--border-inputs-border-radius);
    padding: 8px;
    border: 1px solid var(--border-inputs-border-color);
    background-color: var(--content-inputs-bg-color);
    margin-left: 10px;
    min-width: 258px;
    width: 50%;
    color: var(--content-inputs-text-color);
}

#setting-view .track input[type='number'],
#setting-view .desktopLyric input[type='number'],
#setting-view .cache input[type='number'] {
    margin-left: 0px;
}

#setting-view .cache .content .multi-selection-ctl {
    justify-content: flex-start;
}

#setting-view .cache .content .multi-selection-ctl .item {
    font-size: calc(var(--content-text-size) - 1px);
    padding: 5px 23px;
}


#setting-view .desktopLyric .color-input-ctl {
    min-width: 276px;
    width: calc(50% + 18px);
}

#setting-view .network .network-item {
    width: 47%;
    display: flex;
    align-items: center;
}

#setting-view .network .network-item span {
    min-width: max-content !important;
    margin-right: 5px;
}

#setting-view .network input {
    min-width: 235px !important;
    flex: 1;
}

#setting-view .version .download-wrap {
    display: flex;
    align-items: center;
}

#setting-view .version .download-wrap .progress-bar {
    width: 211px;
    height: 5px;
}

#setting-view .version .newflag {
    border-radius: var(--border-inputs-border-radius);
    border: 1.3px solid var(--content-highlight-color);
    padding: 3px 6px;
    font-size: var(--content-text-tip-text-size);
    font-weight: bold;
    margin-right: 25px;
}

#setting-view .about .content span {
    width: auto;
    margin-right: 6px;
}

#setting-view .center .repository div,
#setting-view .center .license div {
    display: flex;
    flex-direction: row;
    align-items: center;
}

#setting-view .repository svg,
#setting-view .center .license svg {
    fill: var(--content-text-color);
    cursor: pointer;
}

#setting-view .center .license svg {
    transform: translateY(1px);
}

#setting-view .repository .link,
#setting-view .center .license .link {
    text-decoration: underline;
    cursor: pointer;
    color: var(--content-text-color);
    padding-left: 6px;
}


#setting-view .annoucement {
    font-weight: bold;
}


#setting-view .version .current-version {
    display: flex;
    min-height: 36px;
    align-items: center;
    text-align: left;
}

#setting-view .version .current-version.oldflag {
    text-decoration: line-through;
    color: var(--content-subtitle-text-color);
}

#setting-view .version .new-version-wrap {
    display: flex;
    align-items: center;
}

/*
#setting-view .version .new-version-wrap .release-url-link {
    margin-left: 15px;
}
*/

#setting-view .version .new-version-wrap .release-url-link svg {
    margin-bottom: -2px;
    padding-right: 6px;
    cursor: pointer;
}

#setting-view .version .update-check {
    display: flex;
    align-items: center;
}

#setting-view .version .refresh-flag {
    /*margin-left: 8px;*/
    /*transform: translateY(8px);*/
    transform-box: fill-box; 
    transform-origin: center;
    animation: rotate360 1s linear infinite;
}

#setting-view .center .font-input-ctl,
#setting-view .center .dir-input-ctl {
    display: flex;
    align-items: center;
    width: calc(50% + 18px);
    justify-content: flex-end;
}

#setting-view .center .font-input-ctl {
    margin-left: 10px;
}

#setting-view .center .font-input-ctl .text-input-ctl,
#setting-view .center .dir-input-ctl .text-input-ctl {
    border-top-right-radius: 0px !important;
    border-bottom-right-radius: 0px !important;
    border-right: 0px;
    flex: 1;
    height: 20px;
}

#setting-view .center .font-input-ctl .select-btn,
#setting-view .center .dir-input-ctl .select-btn {
    background: var(--button-icon-text-btn-bg-color);
    color: var(--button-icon-text-btn-icon-color);
    width: 68px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--button-icon-text-btn-bg-color);
    border: 1px solid var(--border-inputs-border-color);
    border-top-right-radius: 3px;
    border-bottom-right-radius: 3px;
    font-size: var(--content-text-tip-text-size);
    border-left: 0px;
    cursor: pointer;
}

#setting-view .rich-tip-text {
    flex-direction: column !important;
    align-items: flex-start !important;
}

#setting-view .rich-tip-text .link {
    color: var(--content-subtitle-text-color) !important;
}

/* 别扭挖坑的方式 */
#setting-view .container-win-style .font-input-ctl .select-btn,
#setting-view .container-win-style .dir-input-ctl .select-btn {
    /*height: 40px;*/
    height: 38px;
}
</style>