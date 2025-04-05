<script setup>
import { storeToRefs } from 'pinia';
import { inject, onMounted, onUnmounted, reactive } from 'vue';
import { useAppCommonStore } from '../store/appCommonStore';
import CommonContextSubmenu from './CommonContextSubmenu.vue';
import { onEvents, emitEvents, offEvents } from '../../common/EventBusWrapper';



const { visitArtist } = inject('appRoute')

const props = defineProps({
    posStyle: Object
})

const { commonCtxMenuCacheItem } = storeToRefs(useAppCommonStore())
const menuData = reactive([])

const initData = () => {
    menuData.length = 0
    if(!commonCtxMenuCacheItem.value) return 
    
    const { artist } = commonCtxMenuCacheItem.value
    artist.forEach((item, index) => {
        menuData.push({
            icon: '<svg width="15" height="15" viewBox="0 0 810 854.54" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M385,0c117.88.3,213.35,96.08,213,213.66-.38,118.12-95.71,213.26-213.49,213.07s-213.49-96.16-213-213.58C172,95,267.43-.3,385,0Zm-.58,341.47c70.36.28,127.94-56.94,128.31-127.5a128,128,0,1,0-256-.64C256.5,283.64,313.83,341.19,384.37,341.47Z"/><path d="M640.7,682.51v-20q0-74,0-148c0-19.27,8.52-33,25.74-41.6,27.27-13.56,54.42-27.36,81.76-40.78,25.87-12.7,55.2,1.93,61,30.15,3.72,18-5.84,37.41-22.29,45.6-18.92,9.41-37.7,19.1-56.66,28.43-3.37,1.66-4.38,3.6-4.38,7.23q.17,107.74.09,215.48c0,46.09-36,88-81.81,93.46-20.79,2.51-42,3.79-62.43-2.85-38.64-12.58-61.61-39.33-68.54-79.37-.83-4.8.79-10.24,2.08-15.17a97.51,97.51,0,0,1,100-72.67C623.48,682.9,631.8,682.51,640.7,682.51Z"/><path d="M312.19,512q56.49,0,113,0c21.61,0,38.67,12.73,43.48,32.1,6.92,27.84-13.42,53.25-43,53.34-46.49.15-93,0-139.46,0-25.33,0-50.66-.34-76,.16-65,1.29-119.65,52.93-123.4,117.82-1.79,30.89-.74,61.95-.8,92.94,0,9.06-1.78,17.5-6.67,25.2a42.56,42.56,0,0,1-47,18.26C14.33,847,1,831.09.85,812.66c-.32-32.49-1.95-65.13.39-97.45,6.53-89.82,52.23-152.77,135-188.31,25.72-11,53.08-14.93,81-14.92Z"/></g></g></svg>',
            name: item.name,
            action: () => {
                const { platform } = commonCtxMenuCacheItem.value
                visitArtist({ platform, item, index })
            },
        })
    })
}



/* 生命周期、监听 */
const eventsRegistration = {
    'artistListSubmenu-init': initData,
}
onMounted(() => {
    onEvents(eventsRegistration)
    initData()
})
onUnmounted(() => offEvents(eventsRegistration))
</script>

<template>
    <CommonContextSubmenu class="artist-list-submenu" :data="menuData" :posStyle="posStyle">
    </CommonContextSubmenu>
</template>

<style>
.common-ctx-submenu.artist-list-submenu .menuItem span {
    font-size: calc(var(--content-text-subtitle-size) - 1px);
}
</style>