<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import MainLeft from './layout/MainLeft.vue';
import MainCenter from './layout/MainCenter.vue';
import { useMainViewStore } from './store/mainViewStore';
import { storeToRefs } from 'pinia';

const { playbackQueueViewShow, playingViewShow } = storeToRefs(useMainViewStore())

</script>

<template>
    <MainLeft></MainLeft> 
    <MainCenter></MainCenter>
    <transition name="fade-y">
      <PlayingView id="playing-view" v-show="playingViewShow"></PlayingView>
    </transition>
    
    <PlaybackQueueView id="playback-queue" v-show="playbackQueueViewShow"></PlaybackQueueView>
    <!--
    <transition name="fade-x">
      <PlaybackQueueView id="playback-queue" v-show="playbackQueueViewShow"></PlaybackQueueView> 
    </transition>
    -->
</template>

<style>
:root {
  /* 全局背景 */
  --bg-color: #313131;
  /* 文本 */
  --text-family: STHeitiSC-Medium, "Heiti SC Medium";
  --text-size: 15px;
  --text-color: #eaeaea;
  --text-sub-color: #989898;
  /* 按钮 */
  --svg-color: #eaeaea;
  --svg-text-color: #eaeaea;
  --btn-bg: linear-gradient(to right, #1ca388, #28c83f);
  --btn-hover-bg: linear-gradient(to top right, #2edfa3, #28c83f) !important;
  /* 进度条 */
  --progress-track-bg: linear-gradient(to right, #464646, #666) !important;
  --progress-bg: linear-gradient(to top right, #2edfa3, #28c83f);
  /*滚动条*/
  --scrollbar-thumb-bg: #666;
}

* {
  margin: 0;
  padding: 0;
  user-select: none;
}

html, body, #app {
  background-color: var(--bg-color);
  margin: 0 auto;
  height: 100%;
  font-size: var(--text-size);
  color: var(--text-color);
  overflow: hidden;
}

img {
  -webkit-user-drag: none;
}

#app {
  display: flex;
  font-family: var(--text-family);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}

::-webkit-scrollbar {
  width: 5px;
  height: 99px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb-bg);
  border: 1px solid var(--scrollbar-thumb-bg);
  width: 5px;
  height: 66px;
  border-radius: 8px;
}

#playback-queue {
    position: absolute;
    top: 0;
    right: 0px;
    width: 335px;
    height: 100%;
    z-index: 99;
    background-color: #373737;
    box-shadow: 0px 0px 10px #161616;
    visibility: visible;
}

#playing-view {
    position: absolute;
    top: 0;
    left: 0px;
    width: 100%;
    height: 100%;
    z-index: 88;
    background-color: #373737;
}

/* fade-y */
.fade-y-enter-active,
.fade-y-leave-active {
    transition: all 0.3s ease;
}

.fade-y-enter-from,
.fade-y-leave-to {
    transform: translateY(-100%);
}

.fade-y-enter-to,
.fade-y-leave-from {
    transform: translateY(0);
}

/* fade-x */
.fade-x-enter-active,
.fade-x-leave-active {
  transition: all 0.5s ease-in-out;
}

.fade-x-enter-from,
.fade-x-leave-to {
    transform: translateX(520px);
}

.fade-x-enter-to,
.fade-x-leave-from {
    transform: translateX(0);
}

</style>
