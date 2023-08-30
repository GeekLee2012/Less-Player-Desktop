<script setup>
import { inject, computed } from 'vue';
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
const { isListenNumShow, isUseCardStyleImageTextTile } = storeToRefs(useSettingStore())

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
    if (num >= (unit * unit)) num = parseFloat(num / (unit * unit)).toFixed(5) + "亿"
    else if (num >= unit) num = parseFloat(num / unit).toFixed(1) + "万"
    if (!isUseCardStyleImageTextTile.value) return `播放量：${num}`
    return `<div class='play-cnt'><svg width="14" height="14" viewBox="0 0 139 139" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink">
                <path
                    d="M117.037,61.441L36.333,14.846c-2.467-1.424-5.502-1.424-7.972,0c-2.463,1.423-3.982,4.056-3.982,6.903v93.188  c0,2.848,1.522,5.479,3.982,6.9c1.236,0.713,2.61,1.067,3.986,1.067c1.374,0,2.751-0.354,3.983-1.067l80.704-46.594  c2.466-1.422,3.984-4.054,3.984-6.9C121.023,65.497,119.502,62.866,117.037,61.441z" />
            </svg> ${num}</div>`
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

<style>
.playlists-ctl {
    /* margin-top: 15px; */
    margin-top: 5px;
}

.playlists-ctl .play-cnt {
    display: flex;
    align-items: center;
}

/*
.playlists-ctl .image-text-tile-card .play-cnt {
    justify-content: center;
}
*/

.playlists-ctl .play-cnt svg {
    fill: var(--content-subtitle-text-color);
    margin-right: 4px;
}
</style>