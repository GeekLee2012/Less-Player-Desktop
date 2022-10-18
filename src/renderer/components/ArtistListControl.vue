<script setup>
import { useRouter } from 'vue-router';
import PaginationTiles from './PaginationTiles.vue';
import { useArtistDetailStore } from '../store/artistDetailStore';
import { usePlatformStore } from '../store/platformStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { storeToRefs } from 'pinia';
import ImageTextTileLoadingMask from './ImageTextTileLoadingMask.vue';

const props = defineProps({
    data: Array,
    loading: Boolean
})

const router = useRouter()
const { updateArtistDetailKeys } = useArtistDetailStore()
const { updateCurrentPlatformByCode, isPlatformValid } = usePlatformStore()
const { exploreModeCode } = storeToRefs(useAppCommonStore())

const visitItem = (platform, id) => {
    const platformValid = isPlatformValid(platform)
    const idValid = (typeof(id) == 'string') ? (id.trim().length > 0) : (id > 0)
    const visitable = platformValid && idValid
    if(visitable) {
        const url = '/' + exploreModeCode.value + '/artist/' + platform + "/" + id
        router.push(url)
        updateArtistDetailKeys(platform, id)
        updateCurrentPlatformByCode(platform)
    }
}
</script>

<template>
    <div class="artistlist-ctl">
         <PaginationTiles v-show="!loading">
            <ImageTextTile v-for="item in data" 
                :cover="item.cover" 
                :title="item.title"
                @click="visitItem(item.platform, item.id)" >
            </ImageTextTile>
        </PaginationTiles>
        <ImageTextTileLoadingMask :count="16" v-show="loading"></ImageTextTileLoadingMask>
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