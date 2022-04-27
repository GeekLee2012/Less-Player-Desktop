<script setup>
import { useRouter } from 'vue-router';
import PaginationTiles from './PaginationTiles.vue';
import { useAlbumDetailStore } from '../store/albumDetailStore';

const props = defineProps({
    data: Array
})

const router = useRouter()
const { updateAlbumDetailKeys } = useAlbumDetailStore()

const visitItem = (platform, id) => {
    const platformValid = platform && (platform.trim().length > 0)
    const idValid = (id != 0)
    const visitable = platformValid && idValid
    if(visitable) {
        router.push('/album/' + platform + "/" + id)
        updateAlbumDetailKeys(platform, id)
    }
}

</script>

<template>
    <div class="albumlist-ctl">
         <PaginationTiles>
            <template #data>
                <ImageTextTile v-for="item in data" 
                    :cover="item.cover" 
                    :title="item.title" 
                    :subtitle="item.publishTime"
                    @click="visitItem(item.platform, item.id)" >
                </ImageTextTile>
            </template>
        </PaginationTiles>
    </div>
</template>

<style scoped>
.albumlist-ctl .image-text-tile {
    margin-top: 25px;
}
</style>