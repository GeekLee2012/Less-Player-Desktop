<script setup>
import { storeToRefs } from 'pinia';
import { onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import EventBus from '../../common/EventBus';
import { useAppCommonStore } from '../store/appCommonStore';
import { usePlatformStore } from '../store/platformStore';
import CommonContextSubmenu from './CommonContextSubmenu.vue';
import { useArtistDetailStore } from '../store/artistDetailStore';

const props = defineProps({
    posStyle: Object
})

const router = useRouter()
const { commonCtxMenuCacheItem, exploreModeCode } = storeToRefs(useAppCommonStore())
const { hideAllCtxMenus } = useAppCommonStore()
const { isArtistDetailVisitable } = usePlatformStore()
const { updateArtistDetailKeys } = useArtistDetailStore()
const menuData = reactive([])

const valiadateArtistId = (id) => {
    return (typeof(id) == 'string') ? (id.trim().length > 0) : (id > 0)
}

const visitArtist = (item, index) => {
    let id = item.id
    const { platform } = commonCtxMenuCacheItem.value
    const platformValid = isArtistDetailVisitable(platform)
    let idValid = valiadateArtistId(id)
    const visitable = platformValid && idValid
    if(visitable) {
        const fromPath = router.currentRoute.value.path
        const toPath = '/' + exploreModeCode.value + '/artist/' + platform + "/" + id
        if(fromPath != toPath) {
            router.push(toPath)
            updateArtistDetailKeys(platform, id)
        }
        hideAllCtxMenus()
    }
}

const initData = () => {
    menuData.length = 0
    const { artist } = commonCtxMenuCacheItem.value
    artist.forEach((item, index) => {
        menuData.push({
            name: item.name,
            action: () => visitArtist(item, index),
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