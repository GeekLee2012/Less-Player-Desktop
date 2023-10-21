<script setup>
import { nextTick, onActivated, onMounted, shallowRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';
import DefaultMainTop from './DefaultMainTop.vue';
import DefaultMainContent from './DefaultMainContent.vue';
import DefaultMainBottom from './DefaultMainBottom.vue';
import ClassicMainTop from './ClassicMainTop.vue';
import ClassicMainBottom from './ClassicMainBottom.vue';
import EventBus from '../../common/EventBus';
import { isDevEnv } from '../../common/Utils';



const currentMainTop = shallowRef(null)
const currentMainBottom = shallowRef(null)

const { playlistCategoryViewShow, artistCategoryViewShow,
    radioCategoryViewShow, playingViewShow,
    soundEffectViewShow, lyricToolbarShow } = storeToRefs(useAppCommonStore())
const { hideAllCtxMenus, hideLyricToolbar } = useAppCommonStore()

const { lyricMetaPos, isDefaultLayout,
    isDefaultClassicLayout } = storeToRefs(useSettingStore())
const { setupWindowZoom } = useSettingStore()

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

const setCategoryViewSize = () => {
    const mainContent = document.getElementById('default-main-content')
    if (!mainContent) return

    const playlistCategory = document.querySelector('#playlist-category-view')
    const artistCategory = document.querySelector('#artist-category-view')
    const radioCategory = document.querySelector('#radio-category-view')
    const tagsCategory = document.querySelector('#tags-category-view')

    const categories = [playlistCategory, artistCategory, radioCategory, tagsCategory]

    const { clientHeight } = mainContent, padding = 0
    const height = (clientHeight - padding)
    categories.forEach(item => {
        if (item) item.style.height = `${height}px`
    })
}

const setImageTextTileSize = () => {
    const tileMinWidth = 173
    const tileHMargin = 13
    const mainMargin = 33
    const scrollBarWidth = 6
    const limits = [8, 7, 6, 5, 4] //TODO 宽屏、超宽屏，需更好兼容性
    const mainContent = document.getElementById('default-main-content')
    if (!mainContent) return
    const { clientWidth } = mainContent
    const minWidths = limits.map(num => num * (tileMinWidth + tileHMargin * 2) + mainMargin * 2 + scrollBarWidth)
    /*
    const tileCovers = document.querySelectorAll('.image-text-tile .cover')
    const tileTitles = document.querySelectorAll('.image-text-tile .title')
    const tileSubtitles = document.querySelectorAll('.image-text-tile .subtitle')
    */
    let tileWidth = tileMinWidth, limit = 4
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
    /*
    document.documentElement.style.setProperty('--others-image-text-tile-cover-size', `${tileWidth}px`)
    document.documentElement.style.setProperty('--others-card-image-text-tile-title-width', `${tileWidth - 20}px`)
    document.documentElement.style.setProperty('--others-image-text-tile-card-cover-height', `${cardTileHeight}px`)
    document.documentElement.style.setProperty('--others-image-text-tile-card-min-height', `${cardTileHeight + 66}px`)
    */
    const changes = {
        '--others-image-text-tile-cover-size': `${tileWidth}px`,
        //'--others-card-image-text-tile-title-width': `${tileWidth - 20}px`,
        '--others-image-text-tile-card-cover-height': `${cardTileHeight}px`,
        '--others-image-text-tile-card-min-height': `${cardTileHeight + 73}px`
    }
    for (const [key, value] of Object.entries(changes)) {
        document.documentElement.style.setProperty(key, value)
    }
}

const setPlayingCoverSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight
    let size = 356 * Math.min(wScaleRatio, hScaleRatio)
    const coverEl = document.querySelector('.playing-view .cover')
    if (!coverEl) return
    coverEl.style.marginRight = 41 * Math.min(wScaleRatio, hScaleRatio) + 'px'
    const imgEl = coverEl.querySelector('img')
    if (!imgEl) return
    imgEl.style.width = `${size + 3}px`
    imgEl.style.height = `${size + 3}px`
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
    //const height = 435 * Math.min(hScaleRatio, hScaleRatio)
    const padding = hScaleRatio >= 1.25 ? 50 : 0
    let height = 439 * Math.min(hScaleRatio, hScaleRatio) + padding
    if (lyricMetaPos.value > 0) {
        const centerEl = document.querySelector('.visual-playing-view .center')
        if (centerEl) height = (centerEl.clientHeight || 628)
    }
    const el = document.querySelector('.visual-playing-view .lyric-ctl .center')
    const noLyricEl = document.querySelector('.visual-playing-view .no-lyric')
    if (el) el.style.height = `${height}px`
    if (noLyricEl) noLyricEl.style.height = `${height}px`
}

const setVisualPlayingViewCoverSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight
    const size = 365 * Math.min(wScaleRatio, hScaleRatio)
    const el = document.querySelector('.visual-playing-view .cover img')
    if (!el) return
    el.style.width = `${size}px`
    el.style.height = `${size}px`
}

const setVisualPlayingViewCanvasSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight
    const width = 404 * Math.min(wScaleRatio, hScaleRatio)
    const height = 66 * Math.min(wScaleRatio, hScaleRatio)
    const canvasEl = document.querySelector('.visual-playing-view .center canvas')
    if (!canvasEl) return
    //canvasEl.width = width
    //canvasEl.height = height
    canvasEl.style.height = `${height}px`
}

//TODO
const setBatchViewListSize = () => {
    const mainContent = document.getElementById('default-main-content')
    if (!mainContent) return
    const el = document.querySelector('#batch-action-view .content')
    const { clientHeight } = mainContent
    const padding = isDefaultClassicLayout.value ? 8 : 30
    //header 87, margin 15, action 31
    const height = (clientHeight - 87 - 15 - 31 - padding)
    if (el) el.style.height = `${height}px`
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
}

const setLyricToolbarPos = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const el = document.querySelector('#lyric-toolbar')
    if (!el) return
    //const width = 150, height = 446, padding = 30
    const width = 168, height = 549, padding = 33
    const left = (clientWidth - width - padding)
    const top = (clientHeight - height) / 2
    //el.style.right = padding + 'px'
    el.style.left = `${left}px`
    el.style.top = `${top}px`
}

const setupDefaultLayout = () => {
    if (isDefaultClassicLayout.value) {
        currentMainTop.value = ClassicMainTop
        currentMainBottom.value = ClassicMainBottom
    } else {
        currentMainTop.value = DefaultMainTop
        currentMainBottom.value = DefaultMainBottom
    }
}

const setThemeViewItemsSize = () => {
    const tileMinWidth = 160
    const tileHMargin = 25
    const scrollBarWidth = 6
    const limits = [8, 7, 6, 5, 4] //TODO 宽屏、超宽屏，需更好兼容性
    const mainContent = document.querySelector('#themes-view .center')
    if (!mainContent) return
    const { clientWidth } = mainContent
    if (!clientWidth) return
    const minWidths = limits.map(num => num * (tileMinWidth + tileHMargin) + scrollBarWidth)

    let tileWidth = tileMinWidth, limit = 4
    for (var i = 0; i < limits.length; i++) {
        if (clientWidth >= minWidths[i]) {
            limit = limits[i]
            break
        }
    }
    tileWidth = (clientWidth - scrollBarWidth) / limit - tileHMargin

    //浮点数运算有误差，保险起见，设置一个误差值
    tileWidth = parseInt(tileWidth) - 3

    const tileHeight = tileWidth * 95 / 160
    document.documentElement.style.setProperty('--others-theme-preview-tile-width', `${tileWidth}px`)
    document.documentElement.style.setProperty('--others-theme-preview-tile-height', `${tileHeight}px`)
}

const setPaginationSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    //const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight
    const minHeight = 430 * hScaleRatio
    const el = document.querySelector('.pagination-tiles')

    if (el) el.style.setProperty('--content-min-height', `${minHeight}px`)
}

onActivated(setupDefaultLayout)

onMounted(() => {
    //窗口大小变化事件监听
    window.addEventListener('resize', event => {
        if (!isDefaultLayout.value) return
        //TODO 窗口缩放Bug
        //nextTick(() => setupWindowZoom(true))
        //自适应播放元信息组件大小
        setPlayMetaSize()
        //自适应搜索框大小
        //setSearchBarSize()
        //自适应ImageTextTile组件大小
        setImageTextTileSize()
        //自适应分类列表大小
        setCategoryViewSize()
        //自适应播放页组件大小
        setPlayingViewSize()
        //自适应批量操作页面列表大小
        setBatchViewListSize()
        //主题页
        setThemeViewItemsSize()
        //分页组件
        setPaginationSize()

        //隐藏上下文菜单
        hideAllCtxMenus()
        //TODO 窗口缩放Bug，放在最后执行确保缩放
        setupWindowZoom(true)
        //nextTick(() => setupWindowZoom(true))
        if (isDevEnv()) console.log('[ RESIZE ]')
    })

    //点击事件监听
    document.addEventListener('click', e => {
        //强制分类列表重置大小
        setCategoryViewSize()
    })

})

EventBus.on('batchView-show', setBatchViewListSize)
EventBus.on('playingView-changed', setPlayingViewSize)
EventBus.on('app-layout-default', setupDefaultLayout)

//TODO
watch([playlistCategoryViewShow, artistCategoryViewShow, radioCategoryViewShow], setCategoryViewSize)
watch(playingViewShow, (nv, ov) => {
    hideLyricToolbar()
    setPlayingViewSize()
    //TODO
    EventBus.emit('lyric-alignment')
})
watch(lyricToolbarShow, setLyricToolbarPos)
watch(lyricMetaPos, () => {
    setPlayingLyricCtlSize()
    setVisualPlayingViewLyricCtlSize()
})
</script>

<template>
    <div id="default-main-center">
        <component id="default-main-top" :is="currentMainTop">
        </component>
        <DefaultMainContent id="default-main-content" :class="{ autopadding: isDefaultClassicLayout }">
        </DefaultMainContent>
        <component id="default-main-bottom" :is="currentMainBottom">
        </component>
    </div>
</template>

<style>
#default-main-center {
    display: flex;
    flex-direction: column;
    flex: 1;
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
#default-main-center .autopadding #freefm-view,
#default-main-center .autopadding #search-view,
#default-main-center .autopadding #user-profile-view,
#default-main-center .autopadding #batch-action-view,
#default-main-center .autopadding #user-info-edit-view,
#default-main-center .autopadding #custom-playlist-edit-view,
#default-main-center .autopadding #local-playlist-edit-view,
#default-main-center .autopadding #freefm-edit-view,
#default-main-center .autopadding #data-backup-view,
#default-main-center .autopadding #data-restore-view {
    padding-top: 5px;
}

#default-main-center .autopadding #playlist-detail-view,
#default-main-center .autopadding #artist-detail-view,
#default-main-center .autopadding #album-detail-view,
#default-main-center .autopadding #custom-playlist-detail-view,
#default-main-center .autopadding #local-playlist-detail-view {
    padding-top: 13px;
}
</style>