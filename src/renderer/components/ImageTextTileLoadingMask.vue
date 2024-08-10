<script setup>
import { storeToRefs } from 'pinia';
import { useSettingStore } from '../../renderer/store/settingStore';



const props = defineProps({
    count: Number,
    videoStyle: Boolean
})

const { isUseCardStyleImageTextTile } = storeToRefs(useSettingStore())
</script>

<template>
    <div class="tiles-loading-mask" :class="{
        'tiles-card-loading-mask': isUseCardStyleImageTextTile,
        'tiles-video-loading-mask': videoStyle,
    }">
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
    width: var(--others-image-text-tile-cover-size);
    /*height: 206px;*/
    height: 235px;
    /*margin: 15px 13px;*/
    margin: 15px 13px 11px 13px;
}

.tiles-loading-mask .tile .cover {
    width: 100%;
    height: var(--others-image-text-tile-cover-size);
    border-radius: var(--border-img-text-tile-border-radius);
}

.tiles-loading-mask .tile .title {
    width: 100%;
    /*height: 28px;*/
    height: 43px;
    margin-top: 10px;
    border-radius: 3px;
}


.tiles-card-loading-mask .tile {
    height: 224px;
    min-height: var(--others-image-text-tile-card-min-height);
    margin-top: 18px;
    margin-bottom: 15px;
}

.tiles-card-loading-mask .tile .cover {
    border-bottom-left-radius: 0px;
    border-bottom-right-radius: 0px;
    height: var(--others-image-text-tile-card-cover-height);
}

.tiles-card-loading-mask .tile .title {
    margin-top: 0px;
    border-radius: var(--border-img-text-tile-border-radius);
    border-top-left-radius: 0px;
    border-top-right-radius: 0px;
    height: 66px;
}

.tiles-video-loading-mask .tile {
    margin: 20px 15px;
    width: calc(var(--others-image-text-tile-cover-size) * 1.35);
}

.tiles-video-loading-mask .tile .cover {
    width: 100%;
    height: calc(var(--others-image-text-tile-cover-size * 0.85));
}


.tiles-video-loading-mask .tile .title {
    width: 100%;
}

.default-old-layout .tiles-card-loading-mask .tile {
    margin-bottom: 25px;
}
</style>