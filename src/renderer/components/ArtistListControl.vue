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
        <PaginationTiles v-show="!loading">
            <ImageTextTile v-for="item in data" :cover="item.cover" :title="item.title" @click="visitItem(item)">
            </ImageTextTile>
        </PaginationTiles>
        <ImageTextTileLoadingMask :count="20" v-show="loading"></ImageTextTileLoadingMask>
    </div>
</template>

<style>
.artistlist-ctl .image-text-tile {
    margin-top: 25px !important;
    margin-bottom: 15px;
}

.artistlist-ctl .image-text-tile .cover {
    border-radius: 10rem !important;
}

.artistlist-ctl .image-text-tile .title {
    text-align: center !important;
    margin-top: 10px !important;
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
    width: 75%;
}
</style>