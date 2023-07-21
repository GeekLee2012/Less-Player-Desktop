<script setup>
import { inject } from 'vue';
import PaginationTiles from './PaginationTiles.vue';
import ImageTextTileLoadingMask from './ImageTextTileLoadingMask.vue';



const { visitAlbum } = inject('appRoute')

const props = defineProps({
    data: Array,
    checkbox: Boolean,
    checkedAll: Boolean,
    ignoreCheckAllEvent: Boolean,
    checkChangedFn: Function,
    loading: Boolean
})

const visitItem = (item) => {
    const { checkbox } = props
    if (checkbox) return
    const { id, platform } = item
    visitAlbum({ platform, id, data: item })
}
</script>

<template>
    <div class="albumlist-ctl">
        <div class="content" v-show="!loading">
            <ImageTextTile v-for="item in data" :cover="item.cover" :title="item.title"
                :subtitle="item.subtitle || item.publishTime" @click="visitItem(item)" :checkbox="checkbox"
                :checked="checkedAll" :ignoreCheckAllEvent="ignoreCheckAllEvent"
                :checkChangedFn="(checked) => checkChangedFn(checked, item)">
            </ImageTextTile>
        </div>
        <ImageTextTileLoadingMask :count="20" v-show="loading">
        </ImageTextTileLoadingMask>
    </div>
</template>

<style scoped>
.albumlist-ctl .image-text-tile {
    /* margin-top: 25px; */
}

.albumlist-ctl .content {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    flex: 1;
}
</style>