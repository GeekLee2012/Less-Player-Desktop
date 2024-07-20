<script setup>
import { storeToRefs } from 'pinia';
import { inject, onMounted, reactive } from 'vue';
import { useAppCommonStore } from '../store/appCommonStore';
import CommonContextSubmenu from './CommonContextSubmenu.vue';
import { onEvents, emitEvents } from '../../common/EventBusWrapper';



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

onEvents({
    'artistListSubmenu-init': initData,
})
</script>

<template>
    <CommonContextSubmenu :data="menuData" :posStyle="posStyle">
    </CommonContextSubmenu>
</template>

<style></style>