<script setup>
import { useRouter } from 'vue-router';
import PaginationTiles from './PaginationTiles.vue';
import { useAlbumDetailStore } from '../store/albumDetailStore';
import { storeToRefs } from 'pinia';
import { useMainViewStore } from '../store/mainViewStore';

const props = defineProps({
    data: Array,
    checkbox: Boolean,
    checkedAll: Boolean,
    ignoreCheckAllEvent: Boolean,
    checkChangedFn: Function
})

const router = useRouter()
const { updateAlbumDetailKeys } = useAlbumDetailStore()
const { exploreModeCode } = storeToRefs(useMainViewStore())

const visitItem = (item) => {
    const { checkbox } = props
    if(checkbox) return
    const { id, platform } = item
    const platformValid = platform && (platform.trim().length > 0)
    const idValid = (id != 0)
    const visitable = platformValid && idValid
    if(visitable) {
        const url = '/' + exploreModeCode.value + '/album/' + platform + "/" + id
        router.push(url)
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
                    @click="visitItem(item)"
                    :checkbox="checkbox"
                    :checked="checkedAll"
                    :ignoreCheckAllEvent="ignoreCheckAllEvent"
                    :checkChangedFn="(checked) => checkChangedFn(checked, item)" >
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