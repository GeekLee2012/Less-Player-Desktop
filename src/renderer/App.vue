<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import { onMounted, provide, ref, watch } from 'vue';
import PlayBoostrap from './components/PlayBoostrap.vue';
import Themes from './components/Themes.vue';
import MainLeft from './layout/MainLeft.vue';
import MainCenter from './layout/MainCenter.vue';
import PopoversCtl from './components/PopoversCtl.vue';
import EventBus from '../common/EventBus';
import { useSettingStore } from './store/settingStore';

const { getCurrentThemeId, setupAppSuspension } = useSettingStore()

const initialize = () => {
  setupAppSuspension()
}

//TODO 直接在setup()时初始化，不需要等待其他生命周期
initialize()
</script>

<template>
    <PlayBoostrap></PlayBoostrap>
    <Themes>
      <MainLeft></MainLeft> 
      <MainCenter></MainCenter>
      <PopoversCtl></PopoversCtl>
    </Themes>
</template>

<style>
html, body, #app {
  background-color: var(--bg-color);
  background: var(--app-bg);
  background-position: center;
  background-size: cover;
  /*
  background-image: linear-gradient(rgba(0, 0, 255, 0.5), rgba(0, 0, 0, 0.68)), 
      url("../renderer/assets/images/clean-sky.jpg");
  background-image: var(--bg-img);
  background-position: center;
  background-size: cover;
  */
  margin: 0px auto;
  height: 100%;
  font-size: var(--text-size);
  color: var(--text-color);
  overflow: hidden;
}

#app {
  display: flex;
  font-family: var(--text-family);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
</style>
