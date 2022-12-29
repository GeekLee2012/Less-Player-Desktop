<script setup>
import { storeToRefs } from 'pinia';
import { inject, onMounted, reactive } from 'vue';
import EventBus from '../../common/EventBus';
import { useAppCommonStore } from '../store/appCommonStore';
import CommonContextSubmenu from './CommonContextSubmenu.vue';



const { visitArtist } = inject('appRoute')

const props = defineProps({
    posStyle: Object
})

const { commonCtxMenuCacheItem } = storeToRefs(useAppCommonStore())
const menuData = reactive([])

const initData = () => {
    menuData.length = 0
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

onMounted(() => initData())

EventBus.on("artistListSubmenu-init", initData)
</script>

<template>
    <CommonContextSubmenu :data="menuData" :posStyle="posStyle">
    </CommonContextSubmenu>
</template>

<style>

</style>