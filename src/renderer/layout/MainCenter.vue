<script setup>
import { onMounted } from 'vue';
import MainTop from './MainTop.vue';
import MainContent from './MainContent.vue';
import { useMainViewStore } from '../store/mainViewStore'
import { storeToRefs } from 'pinia';
import PlaylistCategoryView from '../views/PlaylistCategoryView.vue';
import ArtistCategoryView from '../views/ArtistCategoryView.vue';
import EventBus from '../../common/EventBus';

const { playlistCategoryViewShow, artistCategoryViewShow } = storeToRefs(useMainViewStore())
const { hidePlaylistCategoryView, hideArtistCategoryView, 
    hidePlaybackQueueView, hideSongItemCtxMenu, 
    hidePlaybackQueueItemCtxMenu } = useMainViewStore()

//隐藏上下文菜单
const hideCtxMenu = () => {
    hideSongItemCtxMenu()
    hidePlaybackQueueItemCtxMenu()
}

//应用级别按键监听
const handleKeys = (e) => {
    //空格键
    if(e.keyCode == 32 || e.code.toLowerCase() === 'space') {
        EventBus.emit('key-togglePlay')
    }
}

onMounted (() => {
    //窗口大小变化事件监听
    window.addEventListener('resize', e => {
        setCategoryHeight()
        //隐藏上下文菜单
        hideCtxMenu()
    })
    
    //点击事件监听
    document.addEventListener('click', e => {
        //隐藏当前播放列表
        hidePlaybackQueueView()
        //强制重置高度
        setCategoryHeight()
        //隐藏歌单分类列表
        hidePlaylistCategoryView()
        //隐藏歌手分类列表
        hideArtistCategoryView()
        //隐藏上下文菜单
        hideCtxMenu()
    })

    //按键事件监听
    document.addEventListener('keydown', e => {
        handleKeys(e)
    })

    const setCategoryHeight = () => {
        const mainContent = document.getElementById('main-content')
        const playlistCategory = document.querySelector('#playlist-category-view')
        const artistCategory = document.querySelector('#artist-category-view')
        const viewHeight = (mainContent.clientHeight - 37) + "px"
        if(playlistCategory) playlistCategory.style.height = viewHeight
        if(artistCategory) artistCategory.style.height = viewHeight
    }

})
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
    padding-bottom: 30px;
    z-index: 55;
    background-color: var(--bg-color);
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
  opacity: 0;
}
</style>