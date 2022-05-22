<script setup>
import { onMounted } from 'vue';
import MainTop from './MainTop.vue';
import MainContent from './MainContent.vue';
import { useMainViewStore } from '../store/mainViewStore'
import { storeToRefs } from 'pinia';
import CategoryView from '../views/CategoryView.vue';
import EventBus from '../../common/EventBus';

const { categoryViewShow } = storeToRefs(useMainViewStore())
const { hideCategoryView, hidePlaybackQueueView } = useMainViewStore()

onMounted (() => {
    window.addEventListener('resize', e => {
        bindCategoryHeight()
    })
    
    document.addEventListener('click', e => {
        //隐藏当前播放列表
        hidePlaybackQueueView()
        //隐藏全部分类
        hideCategoryView()
    })

    document.addEventListener('keydown', e => {
        handleKeys(e)
    })

    const bindCategoryHeight = () => {
        const mainContent = document.getElementById('main-content')
        const categoryView = document.getElementById('category-view')
        categoryView.style.height = (mainContent.clientHeight - 37) + "px"
    }

    //应用级别按键监听
    const handleKeys = (e) => {
        //空格键
        if(e.keyCode == 32 || e.code.toLowerCase() === 'space') {
            EventBus.emit('key-togglePlay')
        }
    }

    bindCategoryHeight()
})
</script>

<template>
    <div id="main-center">
        <MainTop id="main-top"></MainTop>
        <MainContent id="main-content"></MainContent>
        <div id="main-bottom"></div>

        <!-- 浮层(Component、View)-->
        <transition name="fade-ex">
            <CategoryView id="category-view" v-show="categoryViewShow">
            </CategoryView> 
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

#category-view {
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