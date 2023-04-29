<script setup>
import { inject, onActivated, onMounted, ref, toRaw, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useSettingStore } from '../store/settingStore';
import ToggleControl from '../components/ToggleControl.vue';
import KeysInputControl from '../components/KeysInputControl.vue';
import SvgTextButton from '../components/SvgTextButton.vue';
import packageCfg from '../../../package.json';
import { useAppCommonStore } from '../store/appCommonStore';
import { useIpcRenderer, isMacOS, isWinOS } from '../../common/Utils';
import { useUserProfileStore } from '../store/userProfileStore';
import { getDoc } from '../../common/HttpClient';
import { usePlayStore } from '../store/playStore';
import EventBus from '../../common/EventBus';



const { visitThemes, visitDataBackup, visitDataRestore, } = inject('appRoute')

const ipcRenderer = useIpcRenderer()

const { theme, layout, common, track,
    keys, tray, navigation, dialog,
    cache, network, other,
    isHttpProxyEnable, isSocksProxyEnable } = storeToRefs(useSettingStore())
const { setThemeIndex,
    setLayoutIndex,
    setWindowZoom,
    setFontFamily,
    setFontWeight,
    toggleRadioModeShortcut,
    setTrackQualityIndex,
    toggleVipTransfer,
    toggleVipFlagShow,
    toggleCategoryBarRandom,
    togglePlaylistCategoryBarFlowBtnShow,
    toggleListenNumShow,
    togglePlayingWithoutSleeping,
    toggleStorePlayState,
    toggleStoreLocalMusic,
    toggleStoreRecentPlay,
    toggleTrayShow,
    toggleCustomPlaylistsShow,
    toggleFavoritePlaylistsShow,
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
    setStateRefreshFrequency,
    setSpectrumRefreshFrequency,
    togglePlaybackQueueAutoPositionOnShow,
} = useSettingStore()

const { showToast } = useAppCommonStore()

//打开默认浏览器，并访问超链接
const visitLink = (url) => {
    if (ipcRenderer) ipcRenderer.send('visit-link', url)
}

/* 数据 - 重置 */
const resetData = async () => {
    if (!ipcRenderer) return
    const ok = await ipcRenderer.invoke('show-confirm', {
        title: "确认",
        msg: "数据重置，将会清空我的主页、恢复默认设置、当前播放等全部数据。  确定要继续吗？"
    })
    if (!ok) return
    const settingStore = useSettingStore()
    const appCommonStore = useAppCommonStore()
    const playStore = usePlayStore()
    const userProfileStore = useUserProfileStore()

    appCommonStore.$reset()
    playStore.$reset()
    userProfileStore.$reset()
    settingStore.$reset()

    const storeKeys = ['player', 'appCommon', 'userProfile', 'setting']
    storeKeys.forEach(key => {
        localStorage.removeItem(key)
    })
    EventBus.emit('setting-reset')
    showToast("数据已重置成功!")
}

/* 数据 - 恢复默认设置 */
const resetSettingData = () => {
    const settingStore = useSettingStore()
    settingStore.$reset()
    const storeKeys = ['setting']
    storeKeys.forEach(key => {
        localStorage.removeItem(key)
    })
    EventBus.emit('setting-reset')
    showToast("已恢复默认设置!")
}

/* 通用设置 */
const zoomTickmarks = [50, 70, 85, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300]
const fontWeights = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]

const updateWinZoom = (e) => {
    setWindowZoom(e.target.value)
}

const updateFontFamily = (e) => {
    setFontFamily(e.target.value)
}

const updateFontSize = (e) => {
    setFontSize(e.target.value)
}

const updateFontWeight = (e) => {
    setFontWeight(e.target.value)
}

const updateStateRefreshFrequency = (e) => {
    setStateRefreshFrequency(e.target.value)
}

const updateSpectrumRefreshFrequency = (e) => {
    setSpectrumRefreshFrequency(e.target.value)
}

/* 应用更新升级 */
const changelogUrl = "https://gitee.com/rive08/less-player-desktop/blob/master/CHANGELOG.md"
const lastReleaseUrlRoot = "https://gitee.com/rive08/less-player-desktop/releases/tag/"
const { version } = packageCfg
const lastVersion = ref(version)
const isLastRelease = ref(true)
const downloadState = ref(0)
const progressBarRef = ref(null)
const downloadProgress = ref('准备开始下载')
let localSavePath = null

const setLastRelease = (value) => {
    isLastRelease.value = value
}

const setDownloadState = (value) => {
    downloadState.value = value
}

const isDownloadError = () => (downloadState.value == -1)
const isUnstarted = () => (downloadState.value <= 0)
const isDownloading = () => (downloadState.value == 1)
const isDownloaded = () => (downloadState.value == 2)

const updateDownloadProgress = (received, total) => {
    let receivedMB = 0, totalMB = 0
    if (isMacOS()) {
        receivedMB = parseFloat(received / (1000 * 1000)).toFixed(2)
        totalMB = parseFloat(total / (1000 * 1000)).toFixed(2)
    } else {
        receivedMB = parseFloat(received / (1024 * 1024)).toFixed(2)
        totalMB = parseFloat(total / (1024 * 1024)).toFixed(2)
    }
    if (receivedMB >= totalMB && total > 0) {
        downloadProgress.value = '下载完成，请手动安装更新'
        setDownloadState(2)
    } else if (total > 0) {
        downloadProgress.value = `${receivedMB}MB / ${totalMB}MB`
    } else {
        downloadProgress.value = '准备开始下载'
    }
    const percent = total > 0 ? received / total : 0
    if (progressBarRef) progressBarRef.value.updateProgress(percent)
}

const resetDownloadProgress = () => {
    setDownloadState(0)
    updateDownloadProgress(0, 0)
}

const getLastReleaseVersion = () => {
    return new Promise((resolve, reject) => {
        getDoc(changelogUrl).then(doc => {
            let lastVersion = doc.querySelector('.file_content h3').textContent.trim()
            resolve(lastVersion)
        }).catch(reason => {
            reject(version)
        })
    })
}

const getVersionReleaseUrl = (version) => {
    return new Promise((resolve, reject) => {
        const url = lastReleaseUrlRoot + version
        let targetExt = 'NULL'
        if (isMacOS()) targetExt = '.dmg'
        else if (isWinOS()) targetExt = '.exe'

        let releaseUrl = null
        getDoc(url).then(doc => {
            const els = doc.querySelectorAll('.releases-download-list .item a')
            els.forEach(el => {
                const href = el.getAttribute('href').trim()
                if (!href.endsWith(targetExt)) return
                releaseUrl = "https://gitee.com" + href
            })
            resolve(releaseUrl)
        }, reason => {
            resolve(null)
        })
    })
}

const getTagReleasePageUrl = (version) => `https://gitee.com/rive08/less-player-desktop/releases/tag/${version}`

//是否已经下载，且存在下载文件但未进行安装
const checkDownloaded = async () => {
    if (!ipcRenderer) return
    let targetExt = 'NULL'
    if (isMacOS()) targetExt = '.dmg'
    else if (isWinOS()) targetExt = '.exe'
    const path = await ipcRenderer.invoke('download-checkExists', {
        //必须同时满足
        nameContains: ['Less Player', lastVersion.value, targetExt]
    })
    if (path) {
        localSavePath = path
        downloadProgress.value = "更新已下载，请手动安装"
        setDownloadState(2)
    }
}

//TODO 目前仅考虑单任务下载
const startDownload = async () => {
    //非macOS平台，使用默认浏览器下载
    if (!isMacOS()) {
        const url = lastReleaseUrlRoot + lastVersion.value
        visitLink(url)
        return
    }
    //macOS平台，使用本应用内置下载功能
    if (!ipcRenderer) return
    const lastReleaseUrl = await getVersionReleaseUrl(lastVersion.value)
    if (!lastReleaseUrl) {
        setDownloadState(-1)
        downloadProgress.value = '下载失败！请稍候再重试'
        return
    }
    setDownloadState(1)
    ipcRenderer.on('download-progressing', (e, item) => {
        const { url, savePath, received, total } = item
        localSavePath = savePath
        updateDownloadProgress(received, total)
    })
    ipcRenderer.send('download-item', { url: lastReleaseUrl })
}

const checkForUpdate = () => {
    getLastReleaseVersion().then(result => {
        const currentVersion = ("v" + version)
        lastVersion.value = result
        setLastRelease(currentVersion >= result)
        //只针对macOS平台，检查是否已经下载好更新
        //if (isMacOS()) checkDownloaded()
    })
}

const cancelDownload = () => {
    if (ipcRenderer) ipcRenderer.send('download-cancel')
    resetDownloadProgress()
}

const showPathInFolder = async () => {
    if (!ipcRenderer) return
    ipcRenderer.send('path-showInFolder', localSavePath)
}

//TODO test功能暂未实现
const applySetupProxy = () => {
    setupProxy('网络代理配置已更新')
}

const setupProxy = (text) => {
    setupAppGlobalProxy()
    if (text) showToast(text)
}

const closeProxy = () => {
    resetProxies()
    const proxy = { http: null, socks: null }
    if (ipcRenderer) ipcRenderer.send('app-setGlobalProxy', proxy)
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

/* 生命周期、监听 */
onActivated(() => {
    updateBlackHole(Math.random() * 100000000)
})

onMounted(checkForUpdate)
</script>

<template>
    <div id="setting-view">
        <div class="header">
            <div class="title">设置</div>
        </div>
        <div class="center">
            <div class="theme row">
                <span class="cate-name"><b @click="visitThemes">主题</b></span>
                <div class="content">
                    <div class="last" v-for="(item, index) in presetThemes()"
                        :class="{ active: index == theme.index, lightText: item.dark }" :style="{ background: item.color }"
                        @click="setThemeIndex(index)">
                        <span class="cate-subtitle">{{ item.name }}</span>
                    </div>
                </div>
            </div>
            <div class="layout row">
                <span class="cate-name">布局</span>
                <div class="content">
                    <div class="last">
                        <span v-for="(item, index) in ['默认', '经典主流', '简约']" class="layout-item"
                            :class="{ active: index == layout.index }" @click="setLayoutIndex(index)">
                            {{ item }}
                        </span>
                    </div>
                </div>
            </div>
            <div class="common row">
                <span class="cate-name">通用</span>
                <div class="content">
                    <div class="tip-text">提示：当前应用，所有输入框，Enter键生效或焦点离开后自动生效</div>
                    <div class="window-zoom">
                        <div class="zoom-title">窗口缩放 (%)：
                            <input type="number" min="50" max="300" step="0.01" :value="common.winZoom"
                                placeholder="范围50-300，默认100，支持2位小数点" @keydown.enter="updateWinZoom"
                                @focusout="updateWinZoom" />
                        </div>
                        <div>
                            <input type="range" min="50" max="300" :value="common.winZoom" step="2" @input="updateWinZoom"
                                list="zoom-tickmarks" />
                        </div>
                        <div>
                            <datalist id="zoom-tickmarks">
                                <option v-for="(item, index) in zoomTickmarks" :value="item" :label="item"
                                    @click="() => setWindowZoom(item)">
                                </option>
                            </datalist>
                        </div>
                    </div>
                    <div class="font" @keydown.stop="">
                        <span>字体名称：</span>
                        <input type="text" :value="common.fontFamily" placeholder="字体名称，格式请参考CSS - FontFamily"
                            @keydown.enter="updateFontFamily" @focusout="updateFontFamily" />
                    </div>
                    <div>
                        <span>字体大小：</span>
                        <input type="number" :value="common.fontSize" placeholder="字体大小，范围10-25，默认15.5" min="10" max="25"
                            step="0.1" @keydown.enter="updateFontSize" @focusout="updateFontSize" />
                    </div>
                    <div>
                        <span style="margin-right: 8px;">预设大小：</span>
                        <span v-for="(item, index) in allFontSizeLevels()" class="fslevel-item"
                            :class="{ active: index == common.fontSizeLevel }" @click="setFontSizeLevel(index)">
                            {{ item.name }}
                        </span>
                    </div>
                    <div class="last">
                        <span>字体粗细：</span>
                        <input type="number" :value="common.fontWeight" placeholder="字体粗细，范围100-1000，默认400" min="100"
                            max="1000" step="10" @keydown.enter="updateFontWeight" @focusout="updateFontWeight" />
                        <datalist id="fontweight-suggests" v-if="false">
                            <option v-for="(item, index) in fontWeights" :value="item">
                            </option>
                        </datalist>
                    </div>
                </div>
            </div>
            <div class="track row">
                <span class="cate-name">播放歌曲</span>
                <div class="content">
                    <div>
                        <span class="cate-subtitle">优先音质（目前无法支持）：</span>
                        <span v-for="(item, index) in allQualities()" class="quality-item"
                            :class="{ active: index == track.quality.index }" @click="setTrackQualityIndex(index)">
                            {{ item.name }}
                        </span>
                    </div>
                    <div>
                        <span class="cate-subtitle">VIP歌曲试切换为免费版本：</span>
                        <ToggleControl @click="toggleVipTransfer" :value="track.vipTransfer">
                        </ToggleControl>
                        <div class="tip-text spacing">提示：目前无法支持</div>
                    </div>
                    <div>
                        <span class="cate-subtitle">歌曲显示VIP标识：</span>
                        <ToggleControl @click="toggleVipFlagShow" :value="track.vipFlagShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">歌单分类栏，随机显示分类：</span>
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
                        <ToggleControl @click="toggleListenNumShow" :value="track.listenNumShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">当前播放列表自动定位：</span>
                        <ToggleControl @click="togglePlaybackQueueAutoPositionOnShow"
                            :value="track.playbackQueueAutoPositionOnShow">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">播放歌曲时，防止系统睡眠：</span>
                        <ToggleControl @click="togglePlayingWithoutSleeping" :value="track.playingWithoutSleeping">
                        </ToggleControl>
                        <div class="tip-text spacing">提示：不会影响系统熄屏、锁屏</div>
                    </div>
                    <div class="tip-text">提示：当前应用，更新频度指每多少个动画帧更新一次；频度越小，动画越流畅，CPU占用越高</div>
                    <div>
                        <span class="cate-subtitle">歌曲（歌词）进度更新频度：</span>
                        <input type="number" :value="track.stateRefreshFrequency" placeholder="屏幕刷新率，范围1-1024，默认60" min="1"
                            max="1024" step="1" @input="updateStateRefreshFrequency"
                            @focusout="updateStateRefreshFrequency" />
                    </div>
                    <div class="last">
                        <span class="cate-subtitle">歌曲频谱更新频度：</span>
                        <input type="number" :value="track.spectrumRefreshFrequency" placeholder="范围1 - 256，默认3" min="1"
                            max="256" step="1" @input="updateSpectrumRefreshFrequency"
                            @focusout="updateSpectrumRefreshFrequency" />
                    </div>
                </div>
            </div>
            <div class="cache row">
                <span class="cate-name">缓存</span>
                <div class="content">
                    <div>
                        <span class="cate-subtitle">应用退出前，保存播放状态：</span>
                        <ToggleControl @click="toggleStorePlayState" :value="cache.storePlayState">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">应用退出前，保存本地歌曲：</span>
                        <ToggleControl @click="toggleStoreLocalMusic" :value="cache.storeLocalMusic">
                        </ToggleControl>
                    </div>
                    <div class="last">
                        <span class="cate-subtitle">保存最近播放记录：</span>
                        <ToggleControl @click="toggleStoreRecentPlay" :value="cache.storeRecentPlay">
                        </ToggleControl>
                    </div>
                </div>
            </div>
            <div class="menu row">
                <span class="cate-name">菜单栏</span>
                <div class="content">
                    <div class="last">
                        <span class="cate-subtitle">在菜单栏（系统托盘）显示：</span>
                        <ToggleControl @click="toggleTrayShow" :value="tray.show">
                        </ToggleControl>
                    </div>
                </div>
            </div>
            <div class="navigation row">
                <span class="cate-name">导航栏</span>
                <div class="content">
                    <div class="cate-subtitle">左侧导航栏显示：</div>
                    <div>
                        <span class="cate-subtitle">创建的歌单：</span>
                        <ToggleControl @click="toggleCustomPlaylistsShow" :value="navigation.customPlaylistsShow">
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
                    <br />
                    <div>顶部导航栏显示（快捷入口）：</div>
                    <div class="last">
                        <span class="cate-subtitle">相约电波：</span>
                        <ToggleControl @click="toggleRadioModeShortcut" :value="navigation.radioModeShortcut">
                        </ToggleControl>
                    </div>
                </div>
            </div>
            <div class="dialog row" style="display: none;">
                <span class="cate-name">对话框</span>
                <div class="content">
                    <div>当进行如下操作时，需要确认：</div>
                    <div>
                        <span class="cate-subtitle">清空当前播放：</span>
                        <ToggleControl @click="" :value="dialog.clearQueue">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">批量添加：</span>
                        <ToggleControl @click="" :value="dialog.batchAdd">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">批量移动：</span>
                        <ToggleControl @click="" :value="dialog.batchMove">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">批量删除：</span>
                        <ToggleControl @click="" :value="dialog.batchDelete">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">数据还原：</span>
                        <ToggleControl @click="" :value="dialog.restore">
                        </ToggleControl>
                    </div>
                    <div>
                        <span class="cate-subtitle">数据重置：</span>
                        <ToggleControl @click="" :value="dialog.reset">
                        </ToggleControl>
                    </div>
                    <div class="last">
                        <span class="cate-subtitle">应用退出：</span>
                        <ToggleControl @click="" :value="dialog.quit">
                        </ToggleControl>
                    </div>
                </div>
            </div>
            <div class="keys row">
                <span class="cate-name">快捷键</span>
                <div class="content">
                    <div>
                        <span class="cate-subtitle">开启全局快捷键：</span>
                        <ToggleControl @click="toggleKeysGlobal" :value="keys.global">
                        </ToggleControl>
                        <SvgTextButton text="恢复默认" style="display: none"></SvgTextButton>
                        <div class="tip-text" v-show="false">提示：目前暂时不支持自定义</div>
                    </div>
                    <div v-for="(item, index) in keys.data" :class="{ last: index == (keys.data.length - 1) }">
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
                    <div class="tip-text">提示：国内网络下，一般无需配置；开启代理后，若配置不当，当前应用将无法正常联网</div>
                    <div>网络代理配置：
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
                    <div class="tip-text">提示：开启代理，并修改配置后，请点击“应用更改”按钮，新配置才会生效哦</div>
                    <div>
                        <span class="cate-subtitle">HTTP代理模式：</span>
                        <ToggleControl @click="toggleHttpProxyShow" v-model="network.httpProxy.enable"
                            :value="network.httpProxy.enable">
                        </ToggleControl>
                    </div>
                    <div class="http-proxy" v-show="network.httpProxy.enable">
                        <div>
                            <span>主机: </span>
                            <input type="text" placeholder="IP或域名" v-model="network.httpProxy.host" />
                        </div>
                        <div class="spacing">
                            <span>端口:</span>
                            <input type="number" placeholder="范围0 - 65535，默认80" min="0" max="65535" step="1"
                                v-model="network.httpProxy.port" />
                        </div>
                    </div>
                    <div class="http-proxy" v-show="network.httpProxy.enable">
                        <div>
                            <span>用户: </span>
                            <input type="text" placeholder="用户名" v-model="network.httpProxy.username" />
                        </div>
                        <div class="spacing">
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
                        <div>
                            <span>主机: </span>
                            <input type="text" placeholder="IP或域名" v-model="network.socksProxy.host" />
                        </div>
                        <div class="spacing">
                            <span>端口:</span>
                            <input type="number" placeholder="范围0 - 65535，默认80" min="0" max="65535" step="1"
                                v-model="network.socksProxy.port" />
                        </div>
                    </div>
                    <div class="socks-proxy last" v-show="network.socksProxy.enable">
                        <div>
                            <span>用户: </span>
                            <input type="text" placeholder="用户名" v-model="network.socksProxy.username" />
                        </div>
                        <div class="spacing">
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
                        <SvgTextButton text="恢复默认设置" :leftAction="resetSettingData" class="spacing">
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
                    <div :class="{ last: isLastRelease }">
                        <div><span v-html="packageCfg.version"></span></div>
                        <a href="#" @click.prevent="visitLink(changelogUrl)" class="spacing link">更新日志</a>
                        <!--<div class="tip-text spacing">提示：当前应用会访问系统默认下载目录，检查是否已存在更新文件</div>-->
                    </div>
                    <!--<div class="tip-text" :class="{ last: isLastRelease }">提示：当前应用会访问系统默认下载目录，检查是否已存在更新文件</div>-->
                    <div :class="{ last: !isLastRelease }" v-show="!isLastRelease">
                        <!--
                        <SvgTextButton v-show="!isLastRelease && isUnstarted()" text="下载更新" :leftAction="startDownload">
                        </SvgTextButton>
                        <SvgTextButton v-show="isDownloading()" text="取消下载" :leftAction="cancelDownload">
                        </SvgTextButton>
                        <SvgTextButton v-show="isDownloaded()" text="打开文件" :leftAction="showPathInFolder">
                        </SvgTextButton>
                        <div v-show="!isLastRelease && isUnstarted()" class="spacing">
                            <span>发现新版本：<a href="#" @click.prevent="visitLink(getTagReleasePageUrl(lastVersion))"
                                    class="link" v-html="lastVersion"></a>
                            </span>
                        </div>
                        <div v-show="isDownloadError()" class="download-wrap spacing">
                            <span class="warning" v-html="downloadProgress"></span>
                        </div>
                        <div v-show="isDownloading()" class="download-wrap spacing">
                            <ProgressBar ref="progressBarRef"></ProgressBar>
                            <span class="spacing" v-html="downloadProgress"></span>
                        </div>
                        <div v-show="isDownloaded()" class="download-wrap spacing">
                            <span v-html="downloadProgress"></span>
                        </div>
                        -->
                        <div>
                            <span class="newflag">最新版本</span>
                            <span class="spacing">
                                <a href="#" @click.prevent="visitLink(getTagReleasePageUrl(lastVersion))" class="link"
                                    v-html="lastVersion"></a>
                            </span>
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
                        <div><span>访问源码：</span></div>
                        <div @click.prevent="visitLink('https://github.com/GeekLee2012/Less-Player-Desktop/')">
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
                        <div class="spacing" @click.prevent="visitLink('https://gitee.com/rive08/less-player-desktop/')">
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
                    <div class="license last">
                        <span>开源许可证：</span>
                        <span class="link" @click="visitLink('https://www.apache.org/licenses/LICENSE-2.0.html')">Apache
                            License 2.0</span>
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
}

#setting-view .tip-text {
    /*font-size: 13.5px;*/
    font-size: var(--tip-text-size);
    color: var(--text-sub-color);
}

#setting-view .title {
    margin-left: 35px;
    margin-right: 35px;
    padding-top: 25px;
    /*font-size: 30px;*/
    font-size: var(--text-main-title-size);
    font-weight: bold;
    padding-bottom: 20px;
    border-bottom: 2px solid var(--setting-bottom-border-color);
    /* border-bottom: 2px solid transparent; */
}

#setting-view .center {
    padding-left: 35px;
    padding-right: 35px;
    padding-bottom: 30px;
}

#setting-view .center .row {
    display: flex;
    flex-direction: row;
    padding-top: 35px;
    padding-bottom: 35px;
    border-bottom: 2px solid var(--setting-bottom-border-color);
    /* border-bottom: 2px solid transparent; */
}

#setting-view .center .last-row {
    border-color: transparent;
}

#setting-view .center .row>.cate-name {
    font-size: var(--tab-title-text-size);
    margin-left: 10px;
    width: 110px;
}

#setting-view .content,
#setting-view .content>div,
#setting-view .keys-input-ctl {
    flex: 1;
}

#setting-view .content>div {
    margin-bottom: 30px;
    display: flex;
    flex-direction: row;
    align-items: center;
}

#setting-view .content>div .cate-subtitle {
    width: var(--setting-cate-subtitle-width);
    margin-right: 25px;
}

#setting-view .navigation .cate-subtitle,
#setting-view .keys .cate-subtitle,
#setting-view .network .cate-subtitle {
    width: 225px !important;
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
    color: var(--hl-color);
}

#setting-view .theme .content {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
}

#setting-view .theme .content div {
    --size: 50px;
    width: var(--size);
    max-width: var(--size);
    height: var(--size);
    border-radius: 5px;
    box-shadow: 0px 0px 1px #212121;
    text-align: center;
    margin-right: 23px;
    margin-bottom: 25px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 3px solid transparent;
    /* flex: 1; */
}

#setting-view .theme .content div span {
    background-color: #16161656;
    line-height: var(--size);
    border-radius: 5px;
    visibility: hidden;
    font-size: 16px;
    margin: 0px !important;
}

#setting-view .theme .content div:hover span {
    visibility: visible;
}

#setting-view .theme .content .active {
    border-color: #ffd700;
}

#setting-view .theme .content .lightText {
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

#setting-view .common .window-zoom .zoom-title span {
    margin-left: 18px;
    padding-top: 2px;
}

#setting-view .common .window-zoom .zoom-title input {
    border-radius: 3px;
    padding: 8px;
    border: 1px solid var(--input-border-color);
    background-color: var(--input-bg);
    margin-left: 15px;
    color: var(--text-color);
    /*text-align: center;
    min-width: 66px; */
}

#setting-view .layout .content .layout-item,
#setting-view .common .content .fslevel-item,
#setting-view .track .content .quality-item {
    min-width: 68px;
    padding: 6px;
    text-align: center;
    border-radius: 10rem;
    margin-right: 20px;
    border: 0px solid var(--border-color);
    cursor: pointer;
}

#setting-view .layout .content .layout-item {
    width: auto;
    min-width: 93px;
}

#setting-view .common .content .fslevel-item {
    min-width: 56px !important;
}

#setting-view .layout .content .layout-item:hover,
#setting-view .common .content .fslevel-item:hover,
#setting-view .track .content .quality-item:hover {
    background-color: var(--border-color);
    background-color: var(--list-item-hover);
}

#setting-view .layout .content .active,
#setting-view .common .content .active,
#setting-view .track .content .active {
    background: var(--btn-bg) !important;
    color: var(--svg-btn-color) !important;
    /*border: 1px solid var(--border-color);*/
}

#setting-view .keys .global-keys-ctrl {
    margin-left: 35px;
    margin-right: 20px;
}

#setting-view .keys .svg-text-btn {
    margin-left: 188px;
}

#setting-view .about .content span {
    width: auto;
    margin-right: 6px;
}

#setting-view .center .repository div {
    display: flex;
    flex-direction: row;
    align-items: center;
}

#setting-view .repository svg {
    fill: var(--text-color);
    cursor: pointer;
}

#setting-view .repository .link,
#setting-view .license .link {
    text-decoration: underline;
    cursor: pointer;
    color: var(--text-color);
    padding-left: 5px;
}


#setting-view .keys-input-ctl input {
    min-width: 159px;
    width: 93.5%;
    padding: 8px;
}

#setting-view .keysInputAdptWidth input {
    width: 42%;
}

#setting-view .center .spacing {
    margin-left: 25px;
}

#setting-view .link {
    color: var(--text-color);
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
    width: 100%;
    cursor: pointer;
    background: transparent;
    -webkit-appearance: none;
    margin-top: 10px;
    margin-bottom: 5px;
    padding: 0px;
}

#setting-view input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 22px;
    width: 6px;
    background: var(--hl-color);
    border-radius: 10rem;
    margin-top: -8px;
}

#setting-view input[type=range]::-webkit-slider-runnable-track {
    background: var(--progress-track-bg);
    border-radius: 10rem;
    height: 6px;
}

#setting-view .font {
    display: flex;
    margin-top: 3px;
}

#setting-view .font div {
    flex: 1;
}

#setting-view .common input[type='text'],
#setting-view .common input[type='number'],
#setting-view .track input[type='number'],
#setting-view .network input {
    border-radius: 3px;
    padding: 8px;
    border: 1px solid var(--input-border-color);
    background-color: var(--input-bg);
    margin-left: 10px;
    min-width: 258px;
    color: var(--text-color);
}

#setting-view .network input {
    min-width: 235px !important;
    width: 235px
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
    color: var(--hl-color);
    border-radius: 3px;
    border: 1.3px solid var(--hl-color);
    padding: 1px 3px;
    /*font-size: 12px;*/
    font-size: var(--tip-text-size);
    font-weight: 600;
    margin-right: 5px;
}
</style>