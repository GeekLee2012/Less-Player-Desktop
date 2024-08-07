<script setup>
import { inject } from 'vue';
import { usePlatformStore } from '../store/platformStore';
import PaginationTiles from './PaginationTiles.vue';
import ImageTextTileLoadingMask from './ImageTextTileLoadingMask.vue';



const { visitArtist } = inject('appRoute')

const props = defineProps({
    data: Array,
    loading: Boolean
})

const { updateCurrentPlatformByCode } = usePlatformStore()

const visitItem = (item) => {
    const { platform } = item
    visitArtist({ platform, item, onReadyRoute: () => updateCurrentPlatformByCode(platform) })
}
</script>

<template>
    <div class="artistlist-ctl">
        <div class="pag-content" v-show="!loading">
            <ImageTextTile v-for="item in data" :cover="item.cover" :title="item.title" @click="visitItem(item)">
            </ImageTextTile>
        </div>
        <ImageTextTileLoadingMask :count="20" v-show="loading"></ImageTextTileLoadingMask>
    </div>
</template>

<style>
.artistlist-ctl .image-text-tile {
    margin-top: 25px !important;
    margin-bottom: 10px !important;
}

.artistlist-ctl>.pag-content {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    flex: 1;
}

.artistlist-ctl .image-text-tile .cover {
    border-radius: 10rem !important;
}

.artistlist-ctl .image-text-tile .title {
    text-align: center !important;
    margin-top: 5px !important;
}


.artistlist-ctl .image-text-tile-card {
    box-shadow: none !important;
    background-color: transparent !important;
}

.artistlist-ctl .image-text-tile-card .cover {
    height: var(--others-image-text-tile-cover-size) !important;
}

.artistlist-ctl .tiles-loading-mask .tile {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.artistlist-ctl .tiles-loading-mask .tile .cover {
    border-radius: 10rem !important;
}

.artistlist-ctl .tiles-loading-mask .tile .title {
    text-align: center !important;
    margin-top: 10px !important;
    width: 80%;
    height: 36px !important;
    border-radius: 3px;
}

.artistlist-ctl .tiles-card-loading-mask .tile {
    min-height: auto !important;
    margin-top: 25px !important;
    margin-bottom: 10px !important;
}

.artistlist-ctl .tiles-card-loading-mask .tile .cover {
    height: var(--others-image-text-tile-cover-size) !important;
}

.artistlist-ctl .image-text-tile-card .layer {
    display: none !important;
    background: transparent !important;
}
</style>