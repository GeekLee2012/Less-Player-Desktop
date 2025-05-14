<script setup>
import { inject, computed, readonly } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlatformStore } from '../store/platformStore';
import { useSettingStore } from '../store/settingStore';
import PaginationTiles from './PaginationTiles.vue';
import ImageTextTileLoadingMask from './ImageTextTileLoadingMask.vue';
import { Playlist } from '../../common/Playlist';
import { isBlank, toUpperCaseTrimString, transformUrl } from '../../common/Utils';
import { FILE_SCHEME } from '../../common/Constants';


const { visitPlaylist, visitFreeFMEdit, visitVideoDetail, 
    visitGenreDetail, visitAlbum, visitPlaybackQueue } = inject('appRoute')
const { playPlaylist, favorPlaylist, addFmRadioToQueue } = inject('player')

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
    videoStyle: Boolean,
    singleLineTitleStyle: Boolean,
    tileOnDropFn: Function,
    draggable: Boolean,
    tileOnDragStartFn: Function,
    tileOnDragEnterFn: Function,
    tileOnDragEndFn: Function,
    playable: Boolean,
    favorable: Boolean,
})

const { isPlatformValid, isFreeFM } = usePlatformStore()
const { isPlayCountShow, isRadioTileTitleClickPlay, } = storeToRefs(useSettingStore())

const visitItem = (item) => {
    const { checkbox } = props
    if (checkbox) return
    const { id, platform } = item
    const platformValid = isPlatformValid(platform)
    let idValid = false
    if(typeof id == 'string') idValid = !isBlank(id)
    if(typeof id == 'number') idValid = (id > 0)
    const visitable = platformValid && idValid

    if (isFreeFM(platform)) {
        visitFreeFMEdit(id)
    } else if (Playlist.isFMRadioType(item)
        || Playlist.isNormalRadioType(item)
        || Playlist.isSongType(item)) {
        //FM广播电台、普通歌单电台、歌曲
        playPlaylist(item)
    } else if (Playlist.isVideoType(item)) {
        //视频
        const { detailUrl } = item
        detailUrl ? visitVideoDetail(platform, id, detailUrl, item) : playPlaylist(item)
    } else if (Playlist.isGenreType(item)) {
        visitGenreDetail(platform, id)
    } else if (Playlist.isAlbumType(item)) {
        visitAlbum({ platform, id, data: item })
    } else if (Playlist.isPlaybackQueueType(item)) {
        visitPlaybackQueue(id)
    } else if (visitable) {
        //其他，如普通歌单、主播电台歌单等
        const exploreMode = Playlist.isAnchorRadioType(item) ? 'radios' : null
        visitPlaylist(platform, id, exploreMode)
    }
}

const getSubtitle = (item) => {
    //if (Playlist.isVideoType(item)) return item.subtitle
    return item.subtitle || item.tags
}

const getPlayCountText = (item) => {
    if (!isPlayCountShow.value) return null
    //listenNum为旧版本名称，简单做下兼容处理
    let num = item.playCount || item.listenNum
    if (!num) return null
    const unit = 10000
    if (num >= (unit * unit)) num = parseFloat(num / (unit * unit)).toFixed(2) + '亿'
    else if (num >= unit) num = parseFloat(num / unit).toFixed(1) + '万'
    if (typeof num == 'string') num = toUpperCaseTrimString(num).replace('W', '万')
    //if (!isUseCardStyleImageTextTile.value) return `播放量：${num}`
    /*
    return `<div class='play-cnt'><svg width="14" height="14" viewBox="0 0 139 139" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink">
                <path
                    d="M117.037,61.441L36.333,14.846c-2.467-1.424-5.502-1.424-7.972,0c-2.463,1.423-3.982,4.056-3.982,6.903v93.188  c0,2.848,1.522,5.479,3.982,6.9c1.236,0.713,2.61,1.067,3.986,1.067c1.374,0,2.751-0.354,3.983-1.067l80.704-46.594  c2.466-1.422,3.984-4.054,3.984-6.9C121.023,65.497,119.502,62.866,117.037,61.441z" />
            </svg> ${num}</div>`
    */
   return `${num}`
}

const computedMaxPage = computed(() => {
    const { data, limit } = props
    return (!data || !limit) ? 0 : Math.ceil(data.length / limit)
})

const computedTileOnDrop = computed(() => {
    const { tileOnDropFn } = props
    return (event, item, index) => {
        tileOnDropFn && tileOnDropFn(event, item, index)
    }
})

const computedCenterTitleStyle = computed(() => {
    return (item) => {
        const { type } = item
        return type == Playlist.NORMAL_RADIO_TYPE ||
            type == Playlist.FM_RADIO_TYPE
    }
})

const computedPlayable = computed(() => {
    return (item) => {
        const { playable } = props
        const { type } = item
        return playable
    }
})

const computedFavorable = computed(() => {
    return (item) => {
        const { favorable } = props
        const { type } = item
        return favorable && (type != Playlist.NORMAL_RADIO_TYPE)
    }
})

const onTileTitleClick = (event, item) => {
    if(!item) return 

    const { platform } = item
    if(isFreeFM(platform) || Playlist.isFMRadioType(item)) {
        const isClickPlay = isRadioTileTitleClickPlay.value
        isClickPlay ? playPlaylist(item) : addFmRadioToQueue(item, 'FM电台添加成功')
        //阻止click事件冒泡，避免父级元素再次处理（处理逻辑可能相同、也可能不同）
        //但有副作用：阻止了window对click事件的全局监听处理
        event.stopPropagation()
        //重新触发click事件的全局监听处理
        document.body.click()
    }
}
</script>

<template>
    <div class="playlists-ctl">
        <PaginationTiles :data="data" 
            :paginationStyleType="paginationStyleType" 
            :limit="limit" 
            :maxPage="computedMaxPage"
            :loadPage="loadPage" 
            :nextPagePendingMark="nextPagePendingMark" 
            :refreshAllPendingMark="refreshAllPendingMark"
            :loading="loading">
            <template v-slot="{ item, index }">
                <ImageTextTile @click="visitItem(item)" 
                    :platform="item.platform" :color="item.color"
                    :cover="transformUrl(item.cover, FILE_SCHEME)" 
                    :coverFit="item.coverFit"
                    :title="item.title" 
                    :subtitle="getSubtitle(item)" 
                    :playCount="getPlayCountText(item)"
                    :duration="item.duration"
                    :videoStyle="videoStyle"
                    :songStyle="Playlist.isSongType(item)"
                    :centerTitleStyle="computedCenterTitleStyle(item)"
                    :singleLineTitleStyle="singleLineTitleStyle"
                    :playable="computedPlayable(item)" 
                    :playAction="() => (playable && playPlaylist(item))" 
                    :favorable="computedFavorable(item)" 
                    :favorAction="() => (favorable && favorPlaylist(item))" 
                    :titleAction="(event) => onTileTitleClick(event, item)"
                    :checkbox="checkbox" 
                    :checked="checkedAll"
                    :ignoreCheckAllEvent="ignoreCheckAllEvent"
                    :checkChangedFn="(checked) => checkChangedFn(checked, item)"
                    @dragover="e => e.preventDefault()" 
                    @drop="(event) => (tileOnDropFn && tileOnDropFn(event, item, index))"
                    :draggable="draggable" 
                    @dragstart="(event) => (tileOnDragStartFn && tileOnDragStartFn(event, item, index))"
                    @dragenter="(event) => (tileOnDragEnterFn && tileOnDragEnterFn(event, item, index))"
                    @dragend="(event) => (tileOnDragEndFn && tileOnDragEndFn(event, item, index))">
                </ImageTextTile>
            </template>
            <template #loading1>
                <ImageTextTileLoadingMask :videoStyle="videoStyle" :count="customLoadingCount"
                    v-show="customLoadingCount && customLoadingCount > 0">
                </ImageTextTileLoadingMask>
            </template>
            <template #loading2>
                <ImageTextTileLoadingMask :videoStyle="videoStyle" :count="customLoadingCount"
                    v-show="data && data.length < 1 && customLoadingCount && customLoadingCount > 0">
                </ImageTextTileLoadingMask>
                <ImageTextTileLoadingMask :videoStyle="videoStyle" :count="20" v-show="!customLoadingCount && loading">
                </ImageTextTileLoadingMask>
            </template>
        </PaginationTiles>
    </div>
</template>

<style>
.playlists-ctl {
    /* margin-top: 15px; */
    /* margin-top: 5px; */
    margin-top: 2px;
}

.playlists-ctl .play-cnt {
    display: flex;
    align-items: center;
}

.playlists-ctl .play-cnt svg {
    fill: var(--content-subtitle-text-color);
    margin-right: 4px;
}
</style>