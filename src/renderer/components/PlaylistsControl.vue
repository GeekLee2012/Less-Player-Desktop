<script setup>
import { useRouter } from 'vue-router';
import PaginationTiles from './PaginationTiles.vue';

const props = defineProps({
    data: Array
})

const router = useRouter()

const visitItem = (platform, id) => {
    const platformValid = platform && (platform.trim().length > 0)
    const idValid = (id != 0)
    const visitable = platformValid && idValid
    if(visitable) {
        router.push('/playlist/' + platform + "/" + id)
    }
}

</script>

<template>
    <div class="playlists-ctl">
         <PaginationTiles>
            <template #data>
                <ImageTextTile v-for="item in data" 
                    :cover="item.cover" 
                    :title="item.title"
                    @click="visitItem(item.platform, item.id)" >
                </ImageTextTile>
            </template>
        </PaginationTiles>
    </div>
</template>

<style scoped>
.playlists-ctl {
    margin-top: 15px;
}
</style>