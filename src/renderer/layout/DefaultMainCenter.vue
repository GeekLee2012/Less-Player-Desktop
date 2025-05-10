<script setup>
import { inject, nextTick, onActivated, onDeactivated, onMounted, onUnmounted, shallowRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';
import DefaultMainTop from './DefaultMainTop.vue';
import DefaultMainContent from './DefaultMainContent.vue';
import DefaultMainBottom from './DefaultMainBottom.vue';
import ClassicMainTop from './ClassicMainTop.vue';
import ClassicMainBottom from './ClassicMainBottom.vue';
import { isDevEnv, generateOrderNums } from '../../common/Utils';
import { onEvents, emitEvents, offEvents } from '../../common/EventBusWrapper';



const props = defineProps({
    hideTop: Boolean,
    hideBottom: Boolean,
})

const { applyDocumentStyle } = inject('appStyle')

const currentMainTop = shallowRef(null)
const currentMainBottom = shallowRef(null)

const { playlistCategoryViewShow, artistCategoryViewShow,
    radioCategoryViewShow, playingViewShow,
    soundEffectViewShow, lyricToolbarShow,
    playingThemeListViewShow, } = storeToRefs(useAppCommonStore())
const { hideAllCtxMenus, hideLyricToolbar } = useAppCommonStore()

const { lyricMetaPos, isDefaultLayout,
    isDefaultClassicLayout, isDefaultNewLayout,
    isAutoLayout, winCustomShadowSize, 
    isMiniNavBarMode, isUseHCardStyleImageTextTile,
    imageTextTileStyleIndex,
} = storeToRefs(useSettingStore())
const { setupWindowZoom } = useSettingStore()

//TODO 硬编码
const minAppWidth = 1080, minAppHeight = 720

const setPlayMetaSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    const width = 211 * Math.max(wScaleRatio, 1)
    const titleWrapEl = document.querySelector('.play-meta .title-wrap')
    const audioTitleEl = document.querySelector('.play-meta .audio-title')
    const timeVolWrapEl = document.querySelector('.play-meta .time-volume-wrap')
    if (titleWrapEl) titleWrapEl.style.width = `${width}px`
    if (audioTitleEl) audioTitleEl.style.width = `${width}px`
    if (timeVolWrapEl) timeVolWrapEl.style.width = `${width}px`
}

const setSearchBarSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    //const hScaleRatio = clientHeight / minAppHeight
    const size = 123 * Math.max(wScaleRatio, 1)
    const el = document.querySelector('.default-main-top .search-bar .keyword')
    if (el) el.style.width = `${size}px`
}

/*
const setImageTextTileSize = () => {
    const tileMinWidth = 173
    const tileHMargin = 14
    const mainMargin = 33
    const scrollBarWidth = 6
    //TODO 宽屏、超宽屏，需更好兼容性
    const limits = [8, 7, 6, 5]
    if(!isMiniNavBarMode.value) limits.push(4)

    const mainContent = document.getElementById('default-main-content')
    if (!mainContent) return
    const { clientWidth } = mainContent
    const minWidths = limits.map(num => num * (tileMinWidth + tileHMargin * 2) + mainMargin * 2 + scrollBarWidth)
    
    let tileWidth = tileMinWidth, limit = limits[limits.length - 1]
    for (var i = 0; i < limits.length; i++) {
        if (clientWidth >= minWidths[i]) {
            limit = limits[i]
            break
        }
    }
    tileWidth = (clientWidth - 2 * mainMargin - scrollBarWidth) / limit - tileHMargin * 2

    //浮点数运算有误差，保险起见，设置一个误差值
    tileWidth = parseInt(tileWidth) - 1
    const cardTileHeight = parseInt(tileWidth * 0.883)
    
    applyDocumentStyle({
        '--others-image-text-tile-cover-size': `${tileWidth}px`,
        //'--others-card-image-text-tile-title-width': `${tileWidth - 20}px`,
        '--others-image-text-tile-card-cover-height': `${cardTileHeight}px`,
        '--others-image-text-tile-card-min-height': `${cardTileHeight + 73}px`
    })
}
*/
const setImageTextTileSize = () => {
    if(isUseHCardStyleImageTextTile.value) {
        return setHCardImageTextTileSize()
    }

    const tileMinWidth = 173
    const tileHMargin = 14
    const mainMargin = 33
    const scrollBarWidth = 6
    //TODO 宽屏、超宽屏，需更好兼容性
    const limits = generateOrderNums(20, (isMiniNavBarMode.value ? 5 : 4), -1)
    
    const mainContent = document.getElementById('default-main-content')
    if (!mainContent) return
    const { clientWidth } = mainContent

    const tileWidths = limits.map(num => (clientWidth - 2 * mainMargin - scrollBarWidth) / num - tileHMargin * 2)
    let tileWidth = tileMinWidth, tileNum = limits[limits.length - 1]
    for (var i = 0; i < tileWidths.length; i++) {
        if (Math.abs(tileWidths[i] - tileMinWidth) <= 20) {
            tileWidth = tileWidths[i]
            tileNum = limits[i]
            break
        }
    }

    //浮点数运算有误差，保险起见，设置一个误差值
    tileWidth = parseInt(tileWidth) - 1
    //再次确认，计算补偿值
    const totalWidth = tileNum * (tileWidth + tileHMargin * 2) + mainMargin * 2 + scrollBarWidth
    const offsetWidth = (clientWidth - totalWidth)
    if(offsetWidth >= 10) tileWidth += parseInt(offsetWidth / tileNum)

    const cardTileHeight = parseInt(tileWidth * 0.883)
    
    applyDocumentStyle({
        '--others-image-text-tile-cover-size': `${tileWidth}px`,
        //'--others-card-image-text-tile-title-width': `${tileWidth - 20}px`,
        '--others-image-text-tile-card-cover-height': `${cardTileHeight}px`,
        '--others-image-text-tile-card-min-height': `${cardTileHeight + 73}px`
    })
}

const setHCardImageTextTileSize = () => {
    const tileMinWidth = 168 * 1.8
    const tileHMargin = 14
    const mainMargin = 33
    const scrollBarWidth = 6
    //TODO 宽屏、超宽屏，需更好兼容性
    const limits = generateOrderNums(16, (isMiniNavBarMode.value ? 3 : 2), -1)
    
    const mainContent = document.getElementById('default-main-content')
    if (!mainContent) return
    const { clientWidth } = mainContent

    const tileWidths = limits.map(num => (clientWidth - 2 * mainMargin - scrollBarWidth) / num - tileHMargin * 2)
    let tileWidth = tileMinWidth, tileNum = limits[limits.length - 1]
    for (var i = 0; i < tileWidths.length; i++) {
        if (Math.abs(tileWidths[i] - tileMinWidth) <= 30) {
            tileWidth = tileWidths[i]
            tileNum = limits[i]
            break
        }
    }

    //浮点数运算有误差，保险起见，设置一个误差值
    tileWidth = parseInt(tileWidth) - 1
    //再次确认，计算补偿值
    const totalWidth = tileNum * (tileWidth + tileHMargin * 2) + mainMargin * 2 + scrollBarWidth
    const offsetWidth = (clientWidth - totalWidth)
    if(offsetWidth >= 10) tileWidth += parseInt(offsetWidth / tileNum)
    const widthRatio = (tileWidth / 168)
    
    applyDocumentStyle({
        '--others-image-text-tile-hcard-width-ratio': `${widthRatio}`
    })
}

const setPlayingCoverSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight
    const size = Math.round(366 * Math.min(wScaleRatio, hScaleRatio))
    const coverWrapEl = document.querySelector('.playing-view .cover-wrap')
    if (!coverWrapEl) return
    const coverEl = coverWrapEl.querySelector('.cover')
    if (!coverEl) return
    coverEl.style.width = `${size}px`
    coverEl.style.height = `${size}px`
    const formatEl = coverWrapEl.querySelector('.format')
    if (!formatEl) return
    formatEl.style.width = `${size + 12}px`
}

const setPlayingLyricCtlSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight
    const lyricWrapEl = document.querySelector('.playing-view .lyric-wrap')
    if (!lyricWrapEl) return
    lyricWrapEl.style.marginLeft = 41 * Math.min(wScaleRatio, hScaleRatio) + 'px'
    const padding = 56 + 86 + 36
    let height = 399 * Math.min(hScaleRatio, hScaleRatio)
    let marginTop = 15
    if (lyricMetaPos.value > 0) {
        height = clientHeight - padding
        marginTop = 0
    }
    const lyricContentEl = document.querySelector('.playing-view .lyric-ctl .center')
    //const noLyricEl = document.querySelector('.playing-view .no-lyric')
    if (lyricContentEl) {
        lyricContentEl.style.height = `${height}px`
        lyricContentEl.style.marginTop = `${marginTop}px`
    }
    //if (noLyricEl) noLyricEl.style.height = height + 'px'
}

const setVisualPlayingViewCenterSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight
    const padding = 56 * 2
    const height = clientHeight - padding
    const el = document.querySelector('.visual-playing-view .center')
    if (!el) return
    //el.style.width = width + 'px'
    el.style.height = `${height}px`
}

const setVisualPlayingViewLyricCtlSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight
    /*
    const padding = hScaleRatio >= 1.25 ? 50 : 0
    let height = 439 * Math.min(hScaleRatio, hScaleRatio) + padding
    if (lyricMetaPos.value > 0) {
        const centerEl = document.querySelector('.visual-playing-view .center')
        height = centerEl && (centerEl.clientHeight - 33) || 618
    }
    */

    const lyricWrapEl = document.querySelector('.visual-playing-view .center .lyric-wrap')
    if (!lyricWrapEl) return

    //const headerEl = document.querySelector('.visual-playing-view .lyric-ctl .header')
    //const lyricContentEl = document.querySelector('.visual-playing-view .lyric-ctl .center')
    //const noLyricEl = document.querySelector('.visual-playing-view .no-lyric')

    //const marginTop = 15 * Math.min(wScaleRatio, hScaleRatio)
    const marginTop = 30 * Math.min(wScaleRatio, hScaleRatio)
    const isHeaderShow = (lyricMetaPos.value == 0)
    //const headerHeight = isHeaderShow ? (headerEl && (headerEl.clientHeight + marginTop)) : 0
    //let { clientHeight: wrapHeight } = lyricWrapEl
    //wrapHeight = wrapHeight || (clientHeight - 56 * 2)
    //const height = wrapHeight - headerHeight - 33

    if (lyricWrapEl && isHeaderShow) lyricWrapEl.style.marginTop = `${marginTop}px`
    //if (lyricContentEl) lyricContentEl.style.height = `${height}px`
    //if (noLyricEl) noLyricEl.style.height = `${height}px`
}

const setVisualPlayingViewCoverSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight
    const size = Math.round(365 * Math.min(wScaleRatio, hScaleRatio))
    const coverEl = document.querySelector('.visual-playing-view .cover-wrap .cover')
    if (!coverEl) return
    coverEl.style.width = `${size}px`
    coverEl.style.height = `${size}px`
}

const setVisualPlayingViewCanvasSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight

    const progressWrapEl = document.querySelector('.visual-playing-view .center .progress-wrap')
    const coverCanvasWrapEl = document.querySelector('.visual-playing-view .center .cover-spectrum-wrap')
    const canvasWrapEl = document.querySelector('.visual-playing-view .center .canvas-wrap')

    let width = 480 * Math.min(wScaleRatio, hScaleRatio)
    width = progressWrapEl ? (progressWrapEl.clientWidth || width) : width

    const canvasEl = document.querySelector('.visual-playing-view .center .spectrum-canvas')
    const exVisualCanvasWrapEl = document.querySelector('.visual-playing-view .center .ex-visual-canvas-wrap')
    //const exCanvasEl = document.querySelector('.visual-playing-view .center .ex-spectrum-canvas')

    if (coverCanvasWrapEl) {
        const paddingTop = 33 * Math.min(wScaleRatio, hScaleRatio)
        coverCanvasWrapEl.style.paddingTop = `${paddingTop}px`
    }

    if (canvasWrapEl) {
        const marginTop = 15 * Math.min(wScaleRatio, hScaleRatio)
        canvasWrapEl.style.marginTop = `${marginTop}px`
    }

    if (canvasEl) {
        const height = 66 * Math.min(wScaleRatio, hScaleRatio)
        canvasEl.width = width
        canvasEl.height = height
    }

    if (exVisualCanvasWrapEl) {
        const height = 494 * Math.min(hScaleRatio, hScaleRatio)
        exVisualCanvasWrapEl.style.height = `${height}px`
    }
}

//自适应播放页组件大小
const setPlayingViewSize = () => {
    setPlayingCoverSize()
    setPlayingLyricCtlSize()

    setVisualPlayingViewCenterSize()
    setVisualPlayingViewCoverSize()
    setVisualPlayingViewLyricCtlSize()
    setVisualPlayingViewCanvasSize()

    setLyricToolbarPos()
    setPlayingThemeListViewSize()
}

//播放页 - 播放样式
const setPlayingThemeListViewSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight
    const height = Math.round(190 * Math.min(wScaleRatio, hScaleRatio))
    applyDocumentStyle({
        '--content-playing-theme-list-item-height': `${height}px`
    })
}

const setLyricToolbarPos = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const el = document.querySelector('#lyric-toolbar')
    if (!el) return
    //const width = 150, height = 446, padding = 30
    const { clientWidth: eWidth, clientHeight: eHeight } = el
    //const width = 168, height = 549, padding = 33
    //const left = (clientWidth - eWidth - padding)
    const top = (clientHeight - eHeight) / 2
    //el.style.right = padding + 'px'
    //el.style.left = `${left}px`
    el.style.top = `${top}px`
}

const setupDefaultLayout = () => {
    if (isAutoLayout.value || isDefaultClassicLayout.value || isDefaultNewLayout.value) {
        currentMainTop.value = ClassicMainTop
        currentMainBottom.value = ClassicMainBottom
    } else {
        currentMainTop.value = DefaultMainTop
        currentMainBottom.value = DefaultMainBottom
    }
}

const setThemesViewItemsSize = () => {
    //const tileMinWidth = isMiniNavBarMode.value ? 160 : 165 //160
    const tileMinWidth = 165
    const tileHMargin = 25
    const scrollBarWidth = 6
    //TODO 宽屏、超宽屏，需更好兼容性
    const limits = generateOrderNums(20, (isMiniNavBarMode.value ? 5 : 4), -1)

    const mainContent = document.querySelector('#themes-view .center')
    if (!mainContent) return
    const { clientWidth } = mainContent
    if (!clientWidth) return
    
    const tileWidths = limits.map(num => ((clientWidth - scrollBarWidth - 35 * 2) / num - tileHMargin))
    let tileWidth = tileMinWidth
    for (var i = 0; i < tileWidths.length; i++) {
        if (Math.abs(tileWidths[i] - tileMinWidth) <= 20) {
            tileWidth = tileWidths[i]
            break
        }
    }

    //浮点数运算有误差，保险起见，设置一个误差值
    tileWidth = parseInt(tileWidth) - 3

    const tileHeight = tileWidth * 100 / tileMinWidth //95
    applyDocumentStyle({
        '--others-theme-preview-tile-width': `${tileWidth}px`,
        '--others-theme-preview-tile-height': `${tileHeight}px`
    })
}

const setPaginationSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    //const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight
    const minHeight = 430 * hScaleRatio
    const el = document.querySelector('.pagination-tiles')

    if (el) el.style.setProperty('--content-min-height', `${minHeight}px`)
}

const resizeViewItems = (event) => {
    if (!isDefaultLayout.value) return

    //TODO 窗口缩放Bug
    //nextTick(() => setupWindowZoom(true))
    //自适应播放元信息组件大小
    setPlayMetaSize()
    //自适应ImageTextTile组件大小
    setImageTextTileSize()
    //自适应播放页组件大小
    setPlayingViewSize()
    //主题页
    setThemesViewItemsSize()
    //分页组件
    setPaginationSize()

    //隐藏上下文菜单
    hideAllCtxMenus()
    //TODO Electron窗口缩放Bug
    // 目前现象: 窗口内容时不时“抽一下......”，其实是缩放比由100% => 用户自定义缩放百分比（下面的代码强制设置的结果）
    // 放在最后执行确保按用户设置百分比缩放
    setupWindowZoom(true)

    if (isDevEnv()) console.log('[ WINDOW - Resize ]')
}



/* 生命周期、监听 */
watch(playingViewShow, (nv, ov) => {
    hideLyricToolbar()
    setPlayingViewSize()
    //TODO
    emitEvents('lyric-alignment')
})
watch(lyricToolbarShow, () => nextTick(setLyricToolbarPos))
watch(lyricMetaPos, () => {
    setPlayingLyricCtlSize()
    setVisualPlayingViewLyricCtlSize()
})
watch(winCustomShadowSize, resizeViewItems)
watch(isMiniNavBarMode, resizeViewItems)
watch(playingThemeListViewShow, setPlayingThemeListViewSize, { immediate: true })
watch(imageTextTileStyleIndex, setImageTextTileSize, { immediate: true })

const eventsRegistration = {
    //'batchView-show': setBatchViewListSize,
    //'pluginsView-show': setPluginsViewListSize,
    'playingView-changed': setPlayingViewSize,
    'app-layout-default': setupDefaultLayout,
    'themesView-actived': setThemesViewItemsSize,
}

onMounted(() => {
    onEvents(eventsRegistration)

    //窗口大小变化事件监听
    window.addEventListener('resize', resizeViewItems)
})

onUnmounted(() => offEvents(eventsRegistration))

onActivated(() => {
    setupDefaultLayout()
    nextTick(resizeViewItems)
})
</script>

<template>
    <div id="default-main-center">
        <component id="default-main-top" :is="currentMainTop" v-if="!hideTop">
        </component>
        <DefaultMainContent id="default-main-content" 
            :class="{ 
                autopadding: (isAutoLayout || isDefaultClassicLayout || isDefaultNewLayout),
                newpadding: isDefaultNewLayout
            }">
        </DefaultMainContent>
        <component id="default-main-bottom" :is="currentMainBottom" v-if="!hideBottom">
        </component>
    </div>
</template>

<style>
#default-main-center {
    display: flex;
    flex-direction: column;
    flex: 1;
    flex: 4;
    overflow: hidden;
    background: var(--content-bg-color);
}

#default-main-center,
#default-main-content {
    z-index: 0;
}

#default-main-top,
#default-main-bottom {
    z-index: 1;
}

#default-main-center .autolayout {
    top: 60px;
}

/* TODO */
#default-main-center .autopadding .playlist-square-view,
#default-main-center .autopadding .artist-square-view,
#default-main-center .autopadding .radio-square-view,
#default-main-center .autopadding #local-music-view,
#default-main-center .autopadding #themes-view .title,
#default-main-center .autopadding #setting-view .title,
#default-main-center .autopadding #home-page-view .title,
#default-main-center .autopadding #modules-setting-view .title,
#default-main-center .autopadding #plugins-view,
#default-main-center .autopadding #plugin-detail-view,
#default-main-center .autopadding #freefm-view,
#default-main-center .autopadding #search-view,
#default-main-center .autopadding #user-profile-view,
#default-main-center .autopadding #batch-action-view,
#default-main-center .autopadding #user-info-edit-view,
#default-main-center .autopadding #custom-playlist-edit-view,
#default-main-center .autopadding #local-playlist-edit-view,
#default-main-center .autopadding #freefm-edit-view,
#default-main-center .autopadding #free-video-edit-view,
#default-main-center .autopadding #data-backup-view,
#default-main-center .autopadding #data-restore-view,
#default-main-center .autopadding #webdav-view,
#default-main-center .autopadding #webdav-session-edit-view,
#default-main-center .autopadding #webdav-session-detail-view,
#default-main-center .autopadding #navidrome-view,
#default-main-center .autopadding #navidrome-session-edit-view,
#default-main-center .autopadding #navidrome-session-detail-view,
#default-main-center .autopadding #jellyfin-view,
#default-main-center .autopadding #jellyfin-session-edit-view,
#default-main-center .autopadding #jellyfin-session-detail-view,
#default-main-center .autopadding #genre-detail-view,
#default-main-center .autopadding #emby-view,
#default-main-center .autopadding #emby-session-edit-view,
#default-main-center .autopadding #emby-session-detail-view {
    padding-top: 3px;
}

#default-main-center .autopadding #playlist-detail-view,
#default-main-center .autopadding #artist-detail-view,
#default-main-center .autopadding #album-detail-view,
#default-main-center .autopadding #track-detail-view,
#default-main-center .autopadding #custom-playlist-detail-view,
#default-main-center .autopadding #local-playlist-detail-view {
    padding-top: 8px;
}

#default-main-center .newpadding .playlist-square-view,
#default-main-center .newpadding .artist-square-view,
#default-main-center .newpadding .radio-square-view,
#default-main-center .newpadding #local-music-view,
#default-main-center .newpadding #themes-view .title,
#default-main-center .newpadding #setting-view .title,
#default-main-center .newpadding #home-page-view .title,
#default-main-center .newpadding #modules-setting-view .title,
#default-main-center .newpadding #plugins-view,
#default-main-center .newpadding #plugin-detail-view,
#default-main-center .newpadding #freefm-view,
#default-main-center .newpadding #search-view,
#default-main-center .newpadding #user-profile-view,
#default-main-center .newpadding #batch-action-view,
#default-main-center .newpadding #user-info-edit-view,
#default-main-center .newpadding #custom-playlist-edit-view,
#default-main-center .newpadding #local-playlist-edit-view,
#default-main-center .newpadding #freefm-edit-view,
#default-main-center .newpadding #free-video-edit-view,
#default-main-center .newpadding #data-backup-view,
#default-main-center .newpadding #data-restore-view,
#default-main-center .newpadding #playlist-detail-view,
#default-main-center .newpadding #artist-detail-view,
#default-main-center .newpadding #album-detail-view,
#default-main-center .newpadding #track-detail-view,
#default-main-center .newpadding #custom-playlist-detail-view,
#default-main-center .newpadding #local-playlist-detail-view,
#default-main-center .newpadding #webdav-view,
#default-main-center .newpadding #webdav-session-edit-view,
#default-main-center .newpadding #webdav-session-detail-view,
#default-main-center .newpadding #navidrome-view,
#default-main-center .newpadding #navidrome-session-edit-view,
#default-main-center .newpadding #navidrome-session-detail-view,
#default-main-center .newpadding #jellyfin-view,
#default-main-center .newpadding #jellyfin-session-edit-view,
#default-main-center .newpadding #jellyfin-session-detail-view,
#default-main-center .autopadding #genre-detail-view,
#default-main-center .newpadding #emby-view,
#default-main-center .newpadding #emby-session-edit-view,
#default-main-center .newpadding #emby-session-detail-view {
    padding-top: 0px;
}
</style>