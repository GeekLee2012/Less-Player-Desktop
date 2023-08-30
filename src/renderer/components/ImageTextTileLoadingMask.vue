<script setup>
import { storeToRefs } from 'pinia';
import { useSettingStore } from '../../renderer/store/settingStore';



const props = defineProps({
    count: Number
})

const { isUseCardStyleImageTextTile } = storeToRefs(useSettingStore())
</script>

<template>
    <div class="tiles-loading-mask" :class="{ 'tiles-card-loading-mask': isUseCardStyleImageTextTile }">
        <div class="tile" v-for="i in count">
            <div class="cover loading-mask"></div>
            <div class="title loading-mask"></div>
        </div>
    </div>
</template>

<style scoped>
.tiles-loading-mask {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
}

.tiles-loading-mask .tile {
    width: var(--others-image-text-tile-mask-width);
    height: 206px;
    margin: 15px 13px;
}

.tiles-loading-mask .tile .cover {
    width: 100%;
    height: var(--others-image-text-tile-mask-width);
    border-radius: 6px;
}

.tiles-loading-mask .tile .title {
    width: 100%;
    height: 28px;
    margin-top: 5px;
    border-radius: 3px;
}

.tiles-card-loading-mask .tile .cover {
    border-bottom-left-radius: 0px;
    border-bottom-right-radius: 0px;
}

.tiles-card-loading-mask .tile .title {
    margin-top: 0px;
    border-top-left-radius: 0px;
    border-top-right-radius: 0px;
}
</style>