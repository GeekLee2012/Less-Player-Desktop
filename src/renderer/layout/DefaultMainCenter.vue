<script setup>
import { onActivated, onMounted, shallowRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';
import DefaultMainTop from './DefaultMainTop.vue';
import DefaultMainContent from './DefaultMainContent.vue';
import DefaultMainBottom from './DefaultMainBottom.vue';
import ClassicMainTop from './ClassicMainTop.vue';
import ClassicMainBottom from './ClassicMainBottom.vue';
import PlaylistCategoryView from '../views/PlaylistCategoryView.vue';
import ArtistCategoryView from '../views/ArtistCategoryView.vue';
import RadioCategoryView from '../views/RadioCategoryView.vue';
import EventBus from '../../common/EventBus';



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
    const titleWrapEl = document.querySelector(".play-meta .title-wrap")
    const audioTitleEl = document.querySelector(".play-meta .audio-title")
    const timeVolWrapEl = document.querySelector(".play-meta .time-volume-wrap")
    if (titleWrapEl) titleWrapEl.style.width = width + "px"
    if (audioTitleEl) audioTitleEl.style.width = width + "px"
    if (timeVolWrapEl) timeVolWrapEl.style.width = width + "px"
}

const setSearchBarSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    //const hScaleRatio = clientHeight / minAppHeight
    const size = 115 * Math.max(wScaleRatio, 1)
    const el = document.querySelector(".default-main-top .search-bar .keyword")
    if (el) el.style.width = size + "px"
}

const setCategoryViewSize = () => {
    const mainContent = document.getElementById('default-main-content')
    const playlistCategory = document.querySelector('#playlist-category-view')
    const artistCategory = document.querySelector('#artist-category-view')
    const radioCategory = document.querySelector('#radio-category-view')
    if (!mainContent) return
    const { clientHeight } = mainContent, padding = 30
    const height = (clientHeight - padding)
    if (playlistCategory) playlistCategory.style.height = height + "px"
    if (artistCategory) artistCategory.style.height = height + "px"
    if (radioCategory) radioCategory.style.height = height + "px"
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
    const tileCovers = document.querySelectorAll(".image-text-tile .cover")
    const tileTitles = document.querySelectorAll(".image-text-tile .title")
    const tileSubtitles = document.querySelectorAll(".image-text-tile .subtitle")
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
    document.documentElement.style.setProperty('--image-text-tile-cover-size', `${tileWidth}px`)
    /*
    tileCovers.forEach(item => {
        item.style.width = tileWidth + "px"
        item.style.height = tileWidth + "px"
    })
    tileTitles.forEach(item => {
        item.style.width = tileWidth + "px"
    })
    tileSubtitles.forEach(item => {
        item.style.width = tileWidth + "px"
    })
    */
}
/*
let dynamicSizeStyleElem = null
const setImageTextTileSize0 = () => {
    const tileMinWidth = 173
    const tileHMargin = 13
    const mainMargin = 33
    const scrollBarWidth = 6
    const limits = [8, 7, 6, 5, 4] //TODO 宽屏、超宽屏，需更好兼容性
    const mainContent = document.getElementById('default-main-content')
    if (!mainContent) return
    const { clientWidth } = mainContent
    const minWidths = limits.map(num => num * (tileMinWidth + tileHMargin * 2) + mainMargin * 2 + scrollBarWidth)
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
    if (!dynamicSizeStyleElem) {
        dynamicSizeStyleElem = document.createElement('style')
        dynamicSizeStyleElem.setAttribute('type', 'text/css')
        document.head.appendChild(dynamicSizeStyleElem)

    }
    dynamicSizeStyleElem.innerHTML = `.dynamic-width{width:${tileWidth}px !important;}\n`
        + `.dynamic-height{height:${tileWidth}px !important;\n}`
        + `.dynamic-size{width:${tileWidth}px !important;height:${tileWidth}px !important;line-height:${tileWidth}px !important;}\n`
}

const setImageTextTileLoadingMaskSize = () => {
    const tileMinWidth = 173;
    const tileHMargin = 13;
    const mainMargin = 33;
    const titleHeight = 28, titleMarginTop = 5;
    const scrollBarWidth = 6
    const limits = [8, 7, 6, 5, 4]
    const mainContent = document.getElementById('default-main-content')
    if (!mainContent) return
    const { clientWidth } = mainContent
    const minWidths = limits.map(item => item * (tileMinWidth + tileHMargin * 2) + mainMargin * 2 + scrollBarWidth)
    const tiles = document.querySelectorAll(".tiles-loading-mask .tile")
    const tileCovers = document.querySelectorAll(".tiles-loading-mask .tile .cover")
    const tileTitles = document.querySelectorAll(".tiles-loading-mask .tile .title")
    let tileWidth = tileMinWidth, limit = 4, isLastVisible = true
    for (var i = 0; i < limits.length; i++) {
        if (clientWidth >= minWidths[i]) {
            limit = limits[i]
            //TODO
            isLastVisible = (i == 4)
            break
        }
    }
    tileWidth = (clientWidth - 2 * mainMargin - scrollBarWidth) / limit - tileHMargin * 2
    //浮点数运算有误差，保险起见，设置一个误差值
    tileWidth = parseInt(tileWidth) - 2
    for (var i = 0; i < tiles.length; i++) {
        const item = tiles[i]
        item.style.width = tileWidth + "px"
        item.style.height = tileWidth + titleHeight + titleMarginTop + "px"
        if (i == (tiles.length - 1)) {
            item.style.display = isLastVisible ? "block" : "none"
        }
    }
    tileCovers.forEach(item => {
        item.style.width = tileWidth + "px"
        item.style.height = tileWidth + "px"
    })
    tileTitles.forEach(item => {
        item.style.width = tileWidth + "px"
    })
}
*/
const setImageTextTileComponentSize = () => {
    setImageTextTileSize()
    //setImageTextTileLoadingMaskSize()
}

const setPlayingCoverSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight
    let size = 333 * Math.min(wScaleRatio, hScaleRatio)
    const el = document.querySelector(".playing-view .cover img")
    if (!el) return
    el.style.width = size + "px"
    el.style.height = size + "px"
}

const setPlayingLyricCtlSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight
    const padding = 56 + 86 + 36
    let height = 399 * Math.min(hScaleRatio, hScaleRatio)
    let marginTop = 15
    if (lyricMetaPos.value > 0) {
        height = clientHeight - padding
        marginTop = 0
    }
    const el = document.querySelector(".playing-view .lyric-ctl .center")
    //const noLyricEl = document.querySelector(".playing-view .no-lyric")
    if (el) {
        el.style.height = height + "px"
        el.style.marginTop = marginTop + "px"
    }
    //if (noLyricEl) noLyricEl.style.height = height + "px"
}

const setVisualPlayingViewCenterSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight
    const padding = 56 * 2
    const height = clientHeight - padding
    const el = document.querySelector(".visual-playing-view .center")
    if (!el) return
    //el.style.width = width + "px"
    el.style.height = height + "px"
}

const setVisualPlayingViewLyricCtlSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight
    //const height = 435 * Math.min(hScaleRatio, hScaleRatio)
    const padding = hScaleRatio >= 1.25 ? 50 : 0
    let height = 435 * Math.min(hScaleRatio, hScaleRatio) + padding
    if (lyricMetaPos.value > 0) {
        const centerEl = document.querySelector(".visual-playing-view .center")
        if (centerEl) height = (centerEl.clientHeight || 628)
    }
    const el = document.querySelector(".visual-playing-view .lyric-ctl .center")
    const noLyricEl = document.querySelector(".visual-playing-view .no-lyric")
    if (el) el.style.height = height + "px"
    if (noLyricEl) noLyricEl.style.height = height + "px"
}

const setVisualPlayingViewCoverSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight
    const size = 365 * Math.min(wScaleRatio, hScaleRatio)
    const el = document.querySelector(".visual-playing-view .cover img")
    if (!el) return
    el.style.width = size + "px"
    el.style.height = size + "px"
}

const setVisualPlayingViewCanvasSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight
    const width = 404 * Math.min(wScaleRatio, hScaleRatio)
    const height = 66 * Math.min(wScaleRatio, hScaleRatio)
    const el = document.querySelector(".visual-playing-view .center canvas")
    if (!el) return
    el.width = width
    el.height = height
}

//TODO
const setBatchViewListSize = () => {
    const mainContent = document.getElementById('default-main-content')
    if (!mainContent) return
    const el = document.querySelector('#batch-action-view .content')
    const { clientHeight } = mainContent, padding = 52
    //const height = (clientHeight - 133 - padding)
    //header 87, margin 15, action 31
    const height = (clientHeight - 87 - 15 - 31)
    if (el) el.style.height = height + "px"
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

const setSoundEffectViewAlignment = () => {
    EventBus.emit('app-elementAlignCenter', {
        selector: '.default-layout #sound-effect-view',
        width: 725,
        height: 550
    })
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
    el.style.left = left + 'px'
    el.style.top = top + 'px'
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
    const mainContent = document.querySelector('#themes-view .center .content')
    if (!mainContent) return
    const { clientWidth } = mainContent
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

    const height = tileWidth * 95 / 160
    document.documentElement.style.setProperty('--theme-preview-tile-width', `${tileWidth}px`)
    document.documentElement.style.setProperty('--theme-preview-tile-height', `${height}px`)
}

onActivated(setupDefaultLayout)

onMounted(() => {
    //窗口大小变化事件监听
    window.addEventListener('resize', e => {
        if (!isDefaultLayout.value) return
        //自适应播放元信息组件大小
        setPlayMetaSize()
        //自适应搜索框大小
        setSearchBarSize()
        //自适应ImageTextTile组件大小
        setImageTextTileComponentSize()
        //自适应分类列表大小
        setCategoryViewSize()
        //自适应播放页组件大小
        setPlayingViewSize()
        //自适应批量操作页面列表大小
        setBatchViewListSize()
        //自适应视频页面大小
        //setVideoViewSize()
        //音效窗口自动居中
        setSoundEffectViewAlignment()
        //主题页
        setThemeViewItemsSize()

        //隐藏上下文菜单
        hideAllCtxMenus()
        //TODO 窗口缩放Bug，放在最后执行确保缩放
        //setupWindowZoom(true)
    })

    //点击事件监听
    document.addEventListener('click', e => {
        //强制分类列表重置大小
        setCategoryViewSize()
    })

})

//EventBus.on('imageTextTiles-update', setImageTextTileComponentSize)
//EventBus.on('imageTextTiles-mounted', setImageTextTileComponentSize)
EventBus.on('batchView-show', setBatchViewListSize)
EventBus.on('playingView-changed', setPlayingViewSize)
EventBus.on('app-layout-default', setupDefaultLayout)

//TODO
watch([playlistCategoryViewShow, artistCategoryViewShow, radioCategoryViewShow], setCategoryViewSize)
watch([soundEffectViewShow], setSoundEffectViewAlignment)
watch([playingViewShow], (nv, ov) => {
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

        <!-- 浮层(Component、View)-->
        <transition name="fade-ex">
            <PlaylistCategoryView id="playlist-category-view" :class="{ autolayout: isDefaultClassicLayout }"
                v-show="playlistCategoryViewShow">
            </PlaylistCategoryView>
        </transition>

        <transition name="fade-ex">
            <ArtistCategoryView id="artist-category-view" :class="{ autolayout: isDefaultClassicLayout }"
                v-show="artistCategoryViewShow">
            </ArtistCategoryView>
        </transition>

        <transition name="fade-ex">
            <RadioCategoryView id="radio-category-view" :class="{ autolayout: isDefaultClassicLayout }"
                v-show="radioCategoryViewShow">
            </RadioCategoryView>
        </transition>
    </div>
</template>

<style>
#default-main-center {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    background: var(--default-main-center-bg);
}

#default-main-center,
#default-main-top,
#default-main-content,
#default-main-bottom {
    z-index: 0;
}

#playlist-category-view,
#artist-category-view,
#radio-category-view {
    position: fixed;
    top: 85px;
    right: 0px;
    width: 404px;
    width: 40.4%;
    padding-bottom: 30px;
    z-index: 55;
    background: var(--app-bg);
    box-shadow: 0px 0px 10px #161616;
}

#default-main-center .autolayout {
    top: 60px;
}

/* 可以为进入和离开动画设置不同的持续时间和动画函数 */
.fade-ex-enter-active,
.fade-ex-leave-active {
    transition: all 0.3s ease;
}

/*
.fade-ex-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}
*/

.fade-ex-enter-from,
.fade-ex-leave-to {
    transform: translateX(404px);
    transform: translateX(40.4%);
    opacity: 0;
}

/* TODO */
#default-main-center .autopadding .playlist-square-view,
#default-main-center .autopadding .artist-square-view,
#default-main-center .autopadding .radio-square-view,
#default-main-center .autopadding #themes-view .title,
#default-main-center .autopadding #setting-view .title,
#default-main-center .autopadding #search-view,
#default-main-center .autopadding #user-profile-view,
#default-main-center .autopadding #batch-action-view,
#default-main-center .autopadding #user-info-edit-view,
#default-main-center .autopadding #custom-playlist-edit-view,
#default-main-center .autopadding #data-backup-view,
#default-main-center .autopadding #data-restore-view {
    padding-top: 5px;
}

#default-main-center .autopadding #local-music-view,
#default-main-center .autopadding #playlist-detail-view,
#default-main-center .autopadding #artist-detail-view,
#default-main-center .autopadding #album-detail-view,
#default-main-center .autopadding #custom-playlist-detail-view {
    padding-top: 13px;
}
</style>