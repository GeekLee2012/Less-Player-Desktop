<script setup>
import { onMounted, watch } from 'vue';
import MainTop from './MainTop.vue';
import MainContent from './MainContent.vue';
import { useMainViewStore } from '../store/mainViewStore'
import { storeToRefs } from 'pinia';
import PlaylistCategoryView from '../views/PlaylistCategoryView.vue';
import ArtistCategoryView from '../views/ArtistCategoryView.vue';
import EventBus from '../../common/EventBus';

const { playlistCategoryViewShow, artistCategoryViewShow } = storeToRefs(useMainViewStore())
const { hidePlaylistCategoryView, hideArtistCategoryView, 
    hidePlaybackQueueView, hideAllCtxMenus } = useMainViewStore()


//应用级别按键监听
const handleKeys = (e) => {
    //空格键
    if(e.keyCode == 32 || e.code.toLowerCase() === 'space') {
        EventBus.emit('key-togglePlay')
    }
}

const setPlayMetaSize = () => {
    const minClientWidth = 999, minClientHeight = 666 
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minClientWidth
    //const hScaleRatio = clientHeight / minClientHeight
    const width = 205 * Math.max(wScaleRatio, 1)
    const el1 = document.querySelector(".play-meta .title-wrap")
    const el2 = document.querySelector(".play-meta .time-volume-wrap")
    el1.style.width = width + "px"
    el2.style.width = width + "px"
}

const setSearchBarSize = () => {
    const minClientWidth = 999, minClientHeight = 666 
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minClientWidth
    //const hScaleRatio = clientHeight / minClientHeight
    const size = 115 * Math.max(wScaleRatio, 1)
    const el = document.querySelector(".search-bar .keyword")
    el.style.width = size + "px"
}

const setCategorySize = () => {
    const mainContent = document.getElementById('main-content')
    const playlistCategory = document.querySelector('#playlist-category-view')
    const artistCategory = document.querySelector('#artist-category-view')
    const { clientHeight } = mainContent, padding = 37
    const height = (clientHeight - padding)
    if(playlistCategory) playlistCategory.style.height = height + "px"
    if(artistCategory) artistCategory.style.height = height + "px"
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

const setPlaybackQueueSize = () => {
    const minClientWidth = 999, minClientHeight = 666 
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minClientWidth
    const hScaleRatio = clientHeight / minClientHeight
    let size = 335 * Math.max(wScaleRatio * 0.85, 1)
    const el = document.querySelector("#playback-queue")
    el.style.width = size + "px"
}

const setPlayingCoverSize = () => {
    const minClientWidth = 999, minClientHeight = 666 
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minClientWidth
    const hScaleRatio = clientHeight / minClientHeight
    let size = 265 * Math.min(wScaleRatio, hScaleRatio)
    const el = document.querySelector(".playing-view .cover img")
    el.style.width = size + "px"
    el.style.height = size + "px"
}

const setPlayingLyricCtlSize = () => {
    const minClientWidth = 999, minClientHeight = 666 
    const { clientWidth, clientHeight } = document.documentElement
    const wScaleRatio = clientWidth / minClientWidth
    const hScaleRatio = clientHeight / minClientHeight
    let size = 366 * Math.min(wScaleRatio, hScaleRatio)
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

onMounted (() => {
    //窗口大小变化事件监听
    window.addEventListener('resize', e => {
        //自适应播放元信息组件大小
        setPlayMetaSize()
        //自适应搜索框大小
        setSearchBarSize()
        //自适应ImageTextTile组件大小
        setImageTextTileSize()
        //自适应分类列表大小
        setCategorySize()
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
        //隐藏当前播放列表
        hidePlaybackQueueView()
        //强制分类列表重置大小
        setCategorySize()
        //隐藏歌单分类列表
        hidePlaylistCategoryView()
        //隐藏歌手分类列表
        hideArtistCategoryView()
        //隐藏上下文菜单
        hideAllCtxMenus()
    })

    //按键事件监听
    document.addEventListener('keydown', e => {
        handleKeys(e)
    })
})

EventBus.on("imageTextTile-load", setImageTextTileSize)
EventBus.on("batchView-show", setBatchViewListSize)
//TODO
watch([playlistCategoryViewShow, artistCategoryViewShow], setCategorySize)
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
    </div>
</template>

<style>
#main-center {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    
}

#main-center,
#main-top,
#main-content,
#main-bottom  {
    z-index: 1;
}

#main-bottom {
    height: 30px;
}

#playlist-category-view,
#artist-category-view {
    position: fixed;
    top: 75px;
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