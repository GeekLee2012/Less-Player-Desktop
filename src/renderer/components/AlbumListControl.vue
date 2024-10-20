<script setup>
import { computed, inject } from 'vue';
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
    needReset: Boolean, //播放前是否清空当前播放
    hideExtra: Boolean,
})

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
        <div class="pag-content" v-show="!loading">
            <ImageTextTile v-for="item in data" 
                :cover="item.cover" 
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
        </div>
        <ImageTextTileLoadingMask :count="loadingMaskNum || 20" v-show="loading">
        </ImageTextTileLoadingMask>
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