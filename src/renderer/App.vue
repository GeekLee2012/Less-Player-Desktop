<script setup>
import { onMounted, provide, ref, shallowRef, watch } from 'vue';
import PlayerBoostrap from './PlayerBoostrap.vue';
import Themes from './Themes.vue';
import EventBus from '../common/EventBus';
import { useSettingStore } from './store/settingStore';
import { storeToRefs } from 'pinia';
import AppRoute from './AppRoute.vue';
import SimpleLayout from './layout/SimpleLayout.vue';

const currentAppSkin = shallowRef(SimpleLayout)

const { isStorePlayStateBeforeQuit, isStoreLocalMusicBeforeQuit } = storeToRefs(useSettingStore())
const { setupWindowZoom, setupAppSuspension, 
  setupTray, setupGlobalShortcut } = useSettingStore()

const isReservedPath = (path) => {
  const reservedPaths = [ 'id', 'name', 'binding', 'gBinding' ]
  return reservedPaths.indexOf(path) > -1
}

const deepInState = (state, cache) => {
    for(let path in state) {
        const value = state[path]
        if(typeof(value) === 'object') {
            deepInState(state[path], cache[path])
        } else {
            state[path] = (isReservedPath(path) ? state[path] : cache[path])
        }
    }
}

//TODO 清理设置，解决不同版本导致的数据不一致问题
const cleanupSetting = () => {
    const store = useSettingStore()
    const key = "setting"
    const cache = localStorage.getItem(key)
    if(cache) {
        const cacheStates = JSON.parse(cache)
        store.$reset()
        localStorage.removeItem(key)
        deepInState(store.$state, cacheStates)
    }
    store.$patch({ blackHole: Math.random() * 100000000 })
}

const setupCache = () => {
  if(!isStorePlayStateBeforeQuit.value) {
      localStorage.removeItem('player')
  }
  if(!isStoreLocalMusicBeforeQuit.value) {
      localStorage.removeItem('localMusic')
  }
}

const initialize = () => {
  cleanupSetting()
  setupWindowZoom()
  setupAppSuspension()
  setupCache()
  setupTray()
  setupGlobalShortcut()
}

//TODO 直接在setup()时初始化，不需要等待其他生命周期
initialize()
</script>

<template>
  <AppRoute>
    <PlayerBoostrap>
      <Themes>
        <component :is="currentAppSkin">
        </component>
      </Themes>
    </PlayerBoostrap>
  </AppRoute>
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
  /* font-family: var(--text-font-family); */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
</style>
