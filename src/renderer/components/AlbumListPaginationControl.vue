<script setup>
import { computed, inject, toRef } from 'vue';
import PaginationTiles from './PaginationTiles.vue';
import ImageTextTileLoadingMask from './ImageTextTileLoadingMask.vue';
import { Track } from '../../common/Track';



const { visitAlbum } = inject('appRoute')
const { playAlbum } = inject('player')

const props = defineProps({
    data: Array,
    checkbox: Boolean,
    checkedAll: Boolean,
    ignoreCheckAllEvent: Boolean,
    checkChangedFn: Function,
    loading: Boolean,
    isAlbumArtistSutitle: Boolean,
    singleLineTitleStyle: Boolean,
    loadingMaskNum: Number,
    paginationStyleType: Number,
    limit: Number,
    loadPage: Function,
    nextPagePendingMark: Number,
    refreshAllPendingMark: Number,
    needReset: Boolean, //播放前是否清空当前播放
    hideExtra: Boolean,
    maxPage: Number,
    useMaxPage: Boolean,
})

const limitFromProps  = toRef(props, 'limit')
const dataFromProps = toRef(props, 'data')
const maxPageFromProps = toRef(props, 'maxPage')

const visitItem = (item) => {
    const { checkbox } = props
    if (checkbox) return
    const { id, platform } = item
    visitAlbum({ platform, id, data: item })
}

const computedItemSubtitle = computed(() => {
    return (item) => {
        const { isAlbumArtistSutitle } = props
        if (isAlbumArtistSutitle) return Track.artistName(item).replace('未知艺人', '')
        return item.subtitle
    }
})

const computedMaxPage = computed(() => {
    const maxPage = maxPageFromProps.value
    const data = dataFromProps.value
    const limit = limitFromProps.value
    if(maxPage && maxPage >= 0) return maxPage
    if (!data || data < 0) return 0
    return Math.ceil(data.length / limit)
})

const computedItemExtra = computed(() => {
    return (item) => {
        const { hideExtra } = props
        return hideExtra ? '' : item.publishTime
    }
})

const playAction = (item) => {
    const { needReset } = props
    playAlbum(item, { needReset })
}
</script>

<template>
    <div class="albumlist-ctl">
        <PaginationTiles :data="data" 
            :limit="limit" 
            :maxPage="computedMaxPage"
            :useMaxPage="useMaxPage"
            :loadPage="loadPage"
            :paginationStyleType="paginationStyleType"
            :nextPagePendingMark="nextPagePendingMark" 
            :refreshAllPendingMark="refreshAllPendingMark"
            :loading="loading">
            <template v-slot="{ item, index }">
                <ImageTextTile :cover="item.cover" 
                    :title="item.title"
                    :singleLineTitleStyle="singleLineTitleStyle || isAlbumArtistSutitle" 
                    :subtitle="computedItemSubtitle(item)"
                    :extraText="computedItemExtra(item)"
                    @click="visitItem(item)" 
                    :checkbox="checkbox" 
                    :playable="true"
                    :playAction="() => playAction(item)" 
                    :checked="checkedAll" 
                    :ignoreCheckAllEvent="ignoreCheckAllEvent"
                    :checkChangedFn="(checked) => checkChangedFn(checked, item)">
                </ImageTextTile>
            </template>
            <template #loading1>
            </template>
            <template #loading2>
                <ImageTextTileLoadingMask :count="loadingMaskNum || 20" v-show="loading">
                </ImageTextTileLoadingMask>
            </template>
        </PaginationTiles>
    </div>
</template>

<style scoped>
.albumlist-ctl .pag-content {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    flex: 1;
}
</style>