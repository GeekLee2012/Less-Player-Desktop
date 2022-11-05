<script setup>
import { onMounted, watch } from 'vue';
import MainTop from './MainTop.vue';
import MainContent from './MainContent.vue';
import { useAppCommonStore } from '../store/appCommonStore';
import { usePlayStore } from '../store/playStore';
import { storeToRefs } from 'pinia';
import PlaylistCategoryView from '../views/PlaylistCategoryView.vue';
import ArtistCategoryView from '../views/ArtistCategoryView.vue';
import RadioCategoryView from '../views/RadioCategoryView.vue';
import EventBus from '../../common/EventBus';
import Mousetrap from 'mousetrap';
import { useRouter } from 'vue-router';


const { playlistCategoryViewShow, artistCategoryViewShow, radioCategoryViewShow } = storeToRefs(useAppCommonStore())
const { hideAllCategoryViews, hideAllCtxMenus,
    hidePlaybackQueueView, hidePlayingView,
    togglePlaybackQueueView, togglePlayingView } = useAppCommonStore()

const { togglePlay, switchPlayMode, 
    playPrevTrack, playNextTrack,
    toggleVolumeMute, updateVolumeByOffset } = usePlayStore()
const router = useRouter()

//const minAppWidth = 999, minAppHeight = 666 
const minAppWidth = 1080, minAppHeight = 720 

const visitRoute = (path) => {
    hidePlaybackQueueView()
    hidePlayingView()
    router.push(path)
}

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
    Mousetrap.bind(['p'], () => visitRoute('/setting'), 'keyup')
    // 打开当前播放
    Mousetrap.bind(['q'], togglePlaybackQueueView, 'keyup')
}

const setPlayMetaSize = () => {
    //const minClientWidth = 999, minClientHeight = 666 
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    //const hScaleRatio = clientHeight / minClientHeight
    const width = 211 * Math.max(wScaleRatio, 1)
    const el1 = document.querySelector(".play-meta .title-wrap")
    const el2 = document.querySelector(".play-meta .time-volume-wrap")
    el1.style.width = width + "px"
    el2.style.width = width + "px"
}

const setSearchBarSize = () => {
    //const minClientWidth = 999, minClientHeight = 666 
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    //const hScaleRatio = clientHeight / minAppHeight
    const size = 115 * Math.max(wScaleRatio, 1)
    const el = document.querySelector(".search-bar .keyword")
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
    const tileMinWidth = 175;
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
    let tileWidth = 175, limit = 0, isLastVisible = true
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

const setPlaybackQueueSize = () => {
    //const minClientWidth = 999, minClientHeight = 666 
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight
    let size = 335 * Math.max(wScaleRatio * 0.85, 1)
    const el = document.querySelector("#playback-queue")
    el.style.width = size + "px"
}

const setPlayingCoverSize = () => {
    //const minClientWidth = 999, minClientHeight = 666 
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight
    let size = 300 * Math.min(wScaleRatio, hScaleRatio)
    const el = document.querySelector(".playing-view .cover img")
    el.style.width = size + "px"
    el.style.height = size + "px"
}

const setPlayingLyricCtlSize = () => {
    //const minClientWidth = 999, minClientHeight = 666 
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minAppWidth
    const hScaleRatio = clientHeight / minAppHeight
    let size = 399 * Math.min(wScaleRatio, hScaleRatio)
    const el = document.querySelector(".lyric-ctl .center")
    el.style.width = size + "px"
    el.style.height = size + "px"
}

//TODO
const setBatchViewListSize = () => {
    const mainContent = document.getElementById('main-content')
    const el = document.querySelector('#batch-action-view .content')
    const { clientHeight } = mainContent, padding = 52
    const height = (clientHeight - 133 - padding)
    if(el) el.style.height = height + "px"
}

const hideAllPopoverViews = () => {
    //隐藏当前播放
    hidePlaybackQueueView()
    //隐藏全部分类
    hideAllCategoryViews()
    //隐藏上下文菜单
    hideAllCtxMenus()
}

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
        //自适应播放页封面大小
        setPlayingCoverSize()
        //自适应播放页歌词组件大小
        setPlayingLyricCtlSize()
        //自适应批量操作页面列表大小
        setBatchViewListSize()
        //隐藏上下文菜单
        hideAllCtxMenus()
    })
    
    //点击事件监听
    document.addEventListener('click', e => {
        //强制分类列表重置大小
        setCategoryViewSize()
        //隐藏全部浮层
        hideAllPopoverViews()
    })

    //按键事件监听
    window.addEventListener('keydown', e =>  e.preventDefault())
    registryDefaultLocalKeys()
})

EventBus.on("imageTextTile-load", () => {
    setImageTextTileSize()
    setImageTextTileLoadingMaskSize()
})
EventBus.on("imageTextTileLoadingMask-load", () => {
    setImageTextTileSize()
    setImageTextTileLoadingMaskSize()
})
EventBus.on("batchView-show", setBatchViewListSize)
//TODO
watch([ playlistCategoryViewShow, artistCategoryViewShow, radioCategoryViewShow ], setCategoryViewSize)
</script>

<template>
    <div id="main-center">
        <MainTop id="main-top"></MainTop>
        <MainContent id="main-content"></MainContent>
        <div id="main-bottom"></div>

        <!-- 浮层(Component、View)-->
        <transition name="fade-ex">
            <PlaylistCategoryView id="playlist-category-view" v-show="playlistCategoryViewShow">
            </PlaylistCategoryView> 
        </transition>

        <transition name="fade-ex">
            <ArtistCategoryView id="artist-category-view" v-show="artistCategoryViewShow">
            </ArtistCategoryView> 
        </transition>

        <transition name="fade-ex">
            <RadioCategoryView id="radio-category-view" v-show="radioCategoryViewShow">
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

#main-bottom {
    height: 52px;
}

#playlist-category-view,
#artist-category-view,
#radio-category-view {
    position: fixed;
    top: 75px;
    top: 85px;
    right: 0px;
    width: 404px;
    width: 40.4%;
    padding-bottom: 30px;
    z-index: 55;
    background: var(--app-bg);
    box-shadow: 0px 0px 10px #161616;
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
</style>