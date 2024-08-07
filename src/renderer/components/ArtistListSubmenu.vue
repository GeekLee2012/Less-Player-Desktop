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
    <CommonContextSubmenu :data="menuData" :posStyle="posStyle">
    </CommonContextSubmenu>
</template>

<style></style>