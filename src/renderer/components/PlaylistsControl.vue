<script setup>
import { inject, reactive, watch, ref, onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlatformStore } from '../store/platformStore';
import { useSettingStore } from '../store/settingStore';
import PaginationTiles from './PaginationTiles.vue';
import ImageTextTileLoadingMask from './ImageTextTileLoadingMask.vue';
import { Playlist } from '../../common/Playlist';



const { visitPlaylist, visitFreeFMEdit } = inject('appRoute')
const { playPlaylist } = inject('player')

const props = defineProps({
    data: Array,
    checkbox: Boolean,
    checkedAll: Boolean,
    ignoreCheckAllEvent: Boolean,
    checkChangedFn: Function,
    loading: Boolean,
    customLoadingCount: Number,
    paginationStyleType: Number,
    limit: Number,
    loadPage: Function,
    nextPagePendingMark: Number,
    refreshAllPendingMark: Number,
})

const { isPlatformValid, isFreeFM } = usePlatformStore()
const { isListenNumShow } = storeToRefs(useSettingStore())

const visitItem = (item) => {
    const { checkbox } = props
    if (checkbox) return
    const { id, platform } = item
    const platformValid = isPlatformValid(platform)
    const idValid = (typeof (id) == 'string') ? (id.trim().length > 0) : (id > 0)
    const visitable = platformValid && idValid

    if (isFreeFM(platform)) {
        visitFreeFMEdit(id)
    } else if (Playlist.isFMRadioType(item)
        || Playlist.isNormalRadioType(item)) {
        //FM广播电台、普通歌单电台
        playPlaylist(item)
    } else if (visitable) {
        //其他，如普通歌单、主播电台歌单等
        visitPlaylist(platform, id)
    }
}

const getSubtitle = (item) => {
    return getListenNumText(item) || item.subtitle || item.tags
}

const getListenNumText = (item) => {
    if (!isListenNumShow.value) return null
    let num = item.listenNum
    if (!num) return null
    const unit = 10000
    if (num >= unit) num = parseFloat(num / unit).toFixed(1) + "万"
    return `播放量：${num}`
}

const computedMaxPage = computed(() => {
    const { data, limit } = props
    return (!data || !limit) ? 0 : Math.ceil(data.length / limit)
})
</script>

<template>
    <div class="playlists-ctl">
        <PaginationTiles :data="data" :paginationStyleType="paginationStyleType" :limit="limit" :maxPage="computedMaxPage"
            :loadPage="loadPage" :nextPagePendingMark="nextPagePendingMark" :refreshAllPendingMark="refreshAllPendingMark"
            :loading="loading">
            <template v-slot="{ item, index }">
                <ImageTextTile @click="visitItem(item)" :cover="item.cover" :title="item.title"
                    :subtitle="getSubtitle(item)" :platform="item.platform" :color="item.color" :playable="true"
                    :playAction="() => playPlaylist(item)" :checkbox="checkbox" :checked="checkedAll"
                    :ignoreCheckAllEvent="ignoreCheckAllEvent" :checkChangedFn="(checked) => checkChangedFn(checked, item)">
                </ImageTextTile>
            </template>
            <template #loading1>
                <ImageTextTileLoadingMask :count="customLoadingCount" v-show="customLoadingCount && customLoadingCount > 0">
                </ImageTextTileLoadingMask>
            </template>
            <template #loading2>
                <ImageTextTileLoadingMask :count="20" v-show="loading"></ImageTextTileLoadingMask>
            </template>
        </PaginationTiles>
    </div>
</template>

<style scoped>
.playlists-ctl {
    /* margin-top: 15px; */
    margin-top: 5px;
}
</style>