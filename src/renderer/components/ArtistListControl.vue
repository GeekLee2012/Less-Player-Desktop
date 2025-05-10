<script setup>
import { inject } from 'vue';
import { usePlatformStore } from '../store/platformStore';
import PaginationTiles from './PaginationTiles.vue';
import ImageTextTileLoadingMask from './ImageTextTileLoadingMask.vue';



const { visitArtist } = inject('appRoute')
const { playArtist, followArtist } = inject('player')

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
            <ImageTextTile v-for="item in data" 
                :cover="item.cover"
                :playable="true"
                :playAction="() => playArtist(item)"
                :favorable="true"
                :favorAction="() => followArtist(item)"
                :title="item.title"
                @click="visitItem(item)">
            </ImageTextTile>
        </div>
        <ImageTextTileLoadingMask :count="20" v-show="loading">
        </ImageTextTileLoadingMask>
    </div>
</template>

<style>
.artistlist-ctl .image-text-tile {
    margin-top: 20px !important;
    margin-bottom: 10px !important;
}

.artistlist-ctl > .pag-content {
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

.artistlist-ctl .image-text-tile-card .cover-wrap {
    border-bottom: 1px solid transparent !important;
}


.artistlist-ctl .image-text-tile .cover,
.artistlist-ctl .image-text-tile-card .cover {
    width: calc(var(--others-image-text-tile-cover-size) * 0.95) !important;
    height: calc(var(--others-image-text-tile-cover-size) * 0.95) !important;
}

/* Horizion Card */
.artistlist-ctl .image-text-tile-card-horizion {
    --others-image-text-tile-cover-size: 168px !important;
}

.artistlist-ctl .image-text-tile-card-horizion .cover {
    width: calc(var(--others-image-text-tile-cover-size) * 0.66) !important;
    height: calc(var(--others-image-text-tile-cover-size) * 0.66) !important;
}

.artistlist-ctl .image-text-tile-card-horizion .title {
    text-align: left !important;
}



/* Loading Mask */
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
    margin-top: 5px !important;
    width: 80%;
    height: 36px !important;
    border-radius: 3px;
}

.artistlist-ctl .tiles-card-loading-mask .tile {
    min-height: auto !important;
    margin-top: 25px !important;
    margin-bottom: 10px !important;
}

.artistlist-ctl .tiles-loading-mask .tile .cover,
.artistlist-ctl .tiles-card-loading-mask .tile .cover {
    width: calc(var(--others-image-text-tile-cover-size) * 0.95) !important;
    height: calc(var(--others-image-text-tile-cover-size) * 0.95) !important;
}

.artistlist-ctl .image-text-tile-card .layer {
    display: none !important;
    background: transparent !important;
}

.artistlist-ctl .tiles-loading-mask .tile {
    margin-top: 10px !important;
    margin-bottom: 0px !important;
}

.artistlist-ctl .tiles-card-horizion-loading-mask .tile {
    --others-image-text-tile-cover-size: 168px !important;
    /*background: var(--content-list-item-hover-bg-color) !important;*/
    margin-top: 18px !important;
    margin-bottom: 10px !important;
}


.artistlist-ctl .tiles-card-horizion-loading-mask .tile .cover {
    width: calc(var(--others-image-text-tile-cover-size) * var(--others-image-text-tile-hcard-width-ratio)) !important;
    border-radius: var(--border-img-text-tile-border-radius) !important;
    height: 151px !important;
}

.artistlist-ctl .tiles-card-horizion-loading-mask .tile .title {
    display: none !important;
}
</style>