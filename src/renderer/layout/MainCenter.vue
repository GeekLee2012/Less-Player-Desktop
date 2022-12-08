<script setup>
import { inject, onMounted, shallowRef, watch } from 'vue';
import MainTop from './MainTop.vue';
import ClassicMainTop from './ClassicMainTop.vue';
import ClassicMainBottom from './ClassicMainBottom.vue';
import MainContent from './MainContent.vue';
import MainBottom from './MainBottom.vue';
import { useAppCommonStore } from '../store/appCommonStore';
import { usePlayStore } from '../store/playStore';
import { useSettingStore } from '../store/settingStore';
import { storeToRefs } from 'pinia';
import PlaylistCategoryView from '../views/PlaylistCategoryView.vue';
import ArtistCategoryView from '../views/ArtistCategoryView.vue';
import RadioCategoryView from '../views/RadioCategoryView.vue';
import EventBus from '../../common/EventBus';
import Mousetrap from 'mousetrap';


const currentMainTop = shallowRef(null)
const currentMainBottom = shallowRef(null)

const  { visitRoute, visitSetting } = inject('appRoute')

const { playlistCategoryViewShow, artistCategoryViewShow, 
    radioCategoryViewShow, videoPlayingViewShow,
    playingViewThemeIndex, playingViewShow, 
    audioEffectViewShow, lyricToolbarShow } = storeToRefs(useAppCommonStore())
const { hideAllCategoryViews, hideAllCtxMenus,
    hidePlaybackQueueView, togglePlaybackQueueView, 
    toggleLyricToolbar, hideLyricToolbar } = useAppCommonStore()

const { togglePlay, switchPlayMode, 
    playPrevTrack, playNextTrack,
    toggleVolumeMute, updateVolumeByOffset } = usePlayStore()

const { layout, lyricMetaPos } = storeToRefs(useSettingStore())
const { setupWindowZoomWithoutResize } = useSettingStore()

const minAppWidth = 1080, minAppHeight = 720 

//注册默认应用级别快捷键
const registryDefaultLocalKeys = () => {
    // 播放或暂停
    Mousetrap.bind('space', togglePlay)
    // 播放模式切换
    Mousetrap.bind(['m'], switchPlayMode, 'keyup')
    // 上 / 下一曲
    Mousetrap.bind(['left'], playPrevTrack)
    Mousetrap.bind(['right'], playNextTrack)
    // 增加 / 减小音量
    Mousetrap.bind(['up'], ()=> updateVolumeByOffset(0.01))
    Mousetrap.bind(['down'], ()=> updateVolumeByOffset(-0.01))
    // 最大音量 / 静音
    Mousetrap.bind(['o'], toggleVolumeMute, 'keyup')
    // 打开设置
    Mousetrap.bind(['p'], visitSetting, 'keyup')
    // 打开当前播放
    Mousetrap.bind(['q'], togglePlaybackQueueView, 'keyup')
    // 打开/关闭歌词设置
    Mousetrap.bind(['l'], () => {
        if(playingViewShow.value) toggleLyricToolbar()
    }, 'keyup')
}

const setPlayMetaSize = () => {
    //const minClientWidth = 999, minClientHeight = 666 
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    //const hScaleRatio = clientHeight / minClientHeight
    const width = 211 * Math.max(wScaleRatio, 1)
    const el1 = document.querySelector(".play-meta .title-wrap")
    const el2 = document.querySelector(".play-meta .audio-title")
    const el3 = document.querySelector(".play-meta .time-volume-wrap")
    el1.style.width = width + "px"
    el2.style.width = width + "px"
    el3.style.width = width + "px"
}

const setSearchBarSize = () => {
    //const minClientWidth = 999, minClientHeight = 666 
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    //const hScaleRatio = clientHeight / minAppHeight
    const size = 115 * Math.max(wScaleRatio, 1)
    const el = document.querySelector(".main-top .search-bar .keyword")
    if(!el) return 
    el.style.width = size + "px"
}

const setCategoryViewSize = () => {
    const mainContent = document.getElementById('main-content')
    const playlistCategory = document.querySelector('#playlist-category-view')
    const artistCategory = document.querySelector('#artist-category-view')
    const radioCategory = document.querySelector('#radio-category-view')
    const { clientHeight } = mainContent, padding = 30
    const height = (clientHeight - padding)
    if(playlistCategory) playlistCategory.style.height = height + "px"
    if(artistCategory) artistCategory.style.height = height + "px"
    if(radioCategory) radioCategory.style.height = height + "px"
}

const setImageTextTileSize = () => {
    const tileMinWidth = 165;
    const tileHMargin = 12.5;
    const mainMargin = 33;
    const scrollBarWidth = 6
    const limits = [ 5, 4 ]
    const mainContent = document.getElementById('main-content')
    const { clientWidth }  = mainContent
    const minWidths = limits.map(item => item * (tileMinWidth + tileHMargin * 2) + mainMargin * 2 + scrollBarWidth)
    const tileCovers = document.querySelectorAll(".image-text-tile .cover")
    const tileTitles = document.querySelectorAll(".image-text-tile .title")
    let tileWidth = 165, limit = 0
    if(clientWidth > minWidths[0]) {
        limit = limits[0]
    } else if(clientWidth > minWidths[1]) {
        limit = limits[1]
    }
    if(limit > 0) tileWidth = (clientWidth - 2 * mainMargin - scrollBarWidth) / limit - tileHMargin * 2
    tileCovers.forEach(item => {
        item.style.width = tileWidth + "px"
        item.style.height = tileWidth + "px"
    })
    tileTitles.forEach(item => {
        item.style.width =  tileWidth + "px"
    })
}

const setImageTextTileLoadingMaskSize = () => {
    const tileMinWidth = 165;
    const tileHMargin = 12.5;
    const mainMargin = 33;
    const titleHeight = 28, titleMarginTop = 5;
    const scrollBarWidth = 6
    const limits = [ 5, 4 ]
    const mainContent = document.getElementById('main-content')
    const { clientWidth }  = mainContent
    const minWidths = limits.map(item => item * (tileMinWidth + tileHMargin * 2) + mainMargin * 2 + scrollBarWidth)
    const tiles = document.querySelectorAll(".tiles-loading-mask .tile")
    const tileCovers = document.querySelectorAll(".tiles-loading-mask .tile .cover")
    let tileWidth = 165, limit = 0, isLastVisible = true
    if(clientWidth > minWidths[0]) {
        limit = limits[0]
        isLastVisible = false
    } else if(clientWidth > minWidths[1]) {
        limit = limits[1]
        isLastVisible = true
    }
    if(limit > 0) tileWidth = (clientWidth - 2 * mainMargin - scrollBarWidth) / limit - tileHMargin * 2
    for(let i = 0; i < tiles.length; i++) {
        const item = tiles[i]
        item.style.width = tileWidth + "px"
        item.style.height = tileWidth + titleHeight + titleMarginTop + "px"
        if(i == (tiles.length - 1)) {
            item.style.display = isLastVisible ? "block" : "none"
        }
    }
    tileCovers.forEach(item => {
        item.style.height = tileWidth + "px"
    })
}

const setImageTextTileComponentSize = () => {
    setImageTextTileSize()
    setImageTextTileLoadingMaskSize()
}

const setPlaybackQueueSize = () => {
    //const minClientWidth = 999, minClientHeight = 666 
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight
    let size = 335 * Math.max(wScaleRatio * 0.85, 1)
    const el = document.querySelector("#playback-queue-view")
    el.style.width = size + "px"
}

const setPlayingCoverSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight
    let size = 333 * Math.min(wScaleRatio, hScaleRatio)
    const el = document.querySelector(".playing-view .cover img")
    if(!el) return 
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
    if(lyricMetaPos.value > 0) {
        height = clientHeight - padding
        marginTop = 0
    }
    const el = document.querySelector(".playing-view .lyric-ctl .center")
    const noLyricEl = document.querySelector(".playing-view .no-lyric")
    if(el) {
        el.style.height = height + "px"
        el.style.marginTop = marginTop + "px"
    }
    if(noLyricEl) noLyricEl.style.height = height + "px"
}

const setVisualPlayingViewCenterSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight
    const padding = 56 * 2
    const height = clientHeight - padding
    const el = document.querySelector(".visual-playing-view .center")
    if(!el) return 
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
    if(lyricMetaPos.value > 0) {
        const centerEl = document.querySelector(".visual-playing-view .center")
        if(centerEl) height = (centerEl.clientHeight || 628)
    }
    const el = document.querySelector(".visual-playing-view .lyric-ctl .center")
    const noLyricEl = document.querySelector(".visual-playing-view .no-lyric")
    if(el) el.style.height = height + "px"
    if(noLyricEl) noLyricEl.style.height = height + "px"
}

const setVisualPlayingViewCoverSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight
    const size = 365 * Math.min(wScaleRatio, hScaleRatio)
    const el = document.querySelector(".visual-playing-view .cover img")
    if(!el) return 
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
    if(!el) return 
    el.width = width
    el.height = height
}

//TODO
const setBatchViewListSize = () => {
    const mainContent = document.getElementById('main-content')
    const el = document.querySelector('#batch-action-view .content')
    const { clientHeight } = mainContent, padding = 52
    const height = (clientHeight - 133 - padding)
    if(el) el.style.height = height + "px"
}

const setVideoViewSize = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const el = document.querySelector(".video-holder")
    el.style.width = clientWidth + "px"
    el.style.height = (clientHeight - 39) + "px"
}

const hideAllPopoverViews = () => {
    //隐藏当前播放
    hidePlaybackQueueView()
    //隐藏全部分类
    hideAllCategoryViews()
    //隐藏上下文菜单
    hideAllCtxMenus()
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

const setAudioEffectViewAlignment = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const view = document.querySelector("#audio-effect-view")
    const width = 725, height = 550
    if(!view) return
    const left = (clientWidth - width) / 2
    const top = (clientHeight - height) / 2
    view.style.left = left + 'px'
    view.style.top = top + 'px'
}

const setLyricToolbarPos = () => {
    const { clientWidth, clientHeight } = document.documentElement
    const el = document.querySelector("#lyric-toolbar")
    if(!el) return
    //const width = 150, height = 446, padding = 30
    const width = 168, height = 549, padding = 33
    const left = (clientWidth - width - padding)
    const top = (clientHeight - height) / 2
    //el.style.right = padding + 'px'
    el.style.left = left + 'px'
    el.style.top = top + 'px'
}

const setupLayout = () => {
    const index = layout.value.index
    switch (index) {
        case 1:
            currentMainTop.value = ClassicMainTop
            currentMainBottom.value = ClassicMainBottom
            break;
        default:
            currentMainTop.value = MainTop
            currentMainBottom.value = MainBottom
            break;
    }
}

setupLayout()

onMounted (() => {
    //窗口大小变化事件监听
    window.addEventListener('resize', e => {
        //自适应播放元信息组件大小
        setPlayMetaSize()
        //自适应搜索框大小
        setSearchBarSize()
        //自适应ImageTextTile组件大小
        setImageTextTileSize()
        setImageTextTileLoadingMaskSize()
        //自适应分类列表大小
        setCategoryViewSize()
        //自适应当前播放列表大小
        //setPlaybackQueueSize()
        //自适应播放页组件大小
        setPlayingViewSize()
        //自适应批量操作页面列表大小
        setBatchViewListSize()
        //自适应视频页面大小
        setVideoViewSize()
        //音效窗口自动居中
        setAudioEffectViewAlignment()

        //隐藏上下文菜单
        hideAllCtxMenus()
        //TODO 偶发Bug，放在最后执行确保缩放
        setupWindowZoomWithoutResize()
    })
    
    //点击事件监听
    document.addEventListener('click', e => {
        //强制分类列表重置大小
        setCategoryViewSize()
        //隐藏全部浮层
        hideAllPopoverViews()
    })

    //按键事件监听
    window.addEventListener('keydown', e => {
        //Space键
        if(e.key == ' ') e.preventDefault()
    })
    registryDefaultLocalKeys()
})

EventBus.on("imageTextTile-load", setImageTextTileComponentSize)
EventBus.on("imageTextTileLoadingMask-load", setImageTextTileComponentSize)
EventBus.on("batchView-show", setBatchViewListSize)
EventBus.on('playingView-changed', setPlayingViewSize)
EventBus.on("app-layout", setupLayout)

//TODO
watch([ playlistCategoryViewShow, artistCategoryViewShow, radioCategoryViewShow ], setCategoryViewSize)
watch([ videoPlayingViewShow ], setVideoViewSize)
watch([ audioEffectViewShow ], setAudioEffectViewAlignment)
watch([ playingViewShow ], () => {
    hideLyricToolbar()
    setPlayingViewSize()
})
watch(lyricToolbarShow, setLyricToolbarPos)
watch(lyricMetaPos, () => {
    setPlayingLyricCtlSize()
    setVisualPlayingViewLyricCtlSize()
})
//watch([ playingViewThemeIndex ], setPlayingViewSize)
</script>

<template>
    <div id="main-center">
        <component id="main-top" :is="currentMainTop">
        </component>
        <MainContent id="main-content" 
            :class="{ autopadding: (layout.index == 1) }">
        </MainContent>
        <component id="main-bottom" :is="currentMainBottom">
        </component>

        <!-- 浮层(Component、View)-->
        <transition name="fade-ex">
            <PlaylistCategoryView id="playlist-category-view" 
                :class="{ autolayout: (layout.index == 1) }"
                v-show="playlistCategoryViewShow">
            </PlaylistCategoryView> 
        </transition>

        <transition name="fade-ex">
            <ArtistCategoryView id="artist-category-view" 
                :class="{ autolayout: (layout.index == 1) }"
                v-show="artistCategoryViewShow">
            </ArtistCategoryView> 
        </transition>

        <transition name="fade-ex">
            <RadioCategoryView id="radio-category-view" 
                :class="{ autolayout: (layout.index == 1) }"
                v-show="radioCategoryViewShow">
            </RadioCategoryView> 
        </transition>
    </div>
</template>

<style>
#main-center {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;    
    background: var(--main-center-bg);
}

#main-center,
#main-top,
#main-content,
#main-bottom  {
    z-index: 1;
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

#main-center .autolayout {
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
#main-center .autopadding .playlist-square-view,
#main-center .autopadding .artist-square-view,
#main-center .autopadding .radio-square-view,
#main-center .autopadding #setting-view .title,
#main-center .autopadding #search-view,
#main-center .autopadding #user-profile-view, 
#main-center .autopadding #batch-action-view,
#main-center .autopadding #user-info-edit-view,
#main-center .autopadding #custom-playlist-edit-view,
#main-center .autopadding #data-backup-view, 
#main-center .autopadding #data-restore-view {
    padding-top: 10px;
}

#main-center .autopadding #local-music-view,
#main-center .autopadding #playlist-detail-view, 
#main-center .autopadding #artist-detail-view, 
#main-center .autopadding #album-detail-view, 
#main-center .autopadding #custom-playlist-detail-view {
    padding-top: 15px;
}
</style>