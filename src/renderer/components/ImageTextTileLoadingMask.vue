<script setup>
import { storeToRefs } from 'pinia';
import { useSettingStore } from '../../renderer/store/settingStore';



const props = defineProps({
    count: Number,
    videoStyle: Boolean,
})

const { isUseCardStyleImageTextTile, isUseHCardStyleImageTextTile } = storeToRefs(useSettingStore())
</script>

<template>
    <div class="tiles-loading-mask" :class="{
        'tiles-card-loading-mask': isUseCardStyleImageTextTile,
        'tiles-video-loading-mask': videoStyle,
        'tiles-card-horizion-loading-mask': isUseHCardStyleImageTextTile,
    }">
        <div class="tile" v-for="i in count">
            <div class="cover loading-mask"></div>
            <div class="title loading-mask" v-show="!isUseHCardStyleImageTextTile"></div>
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

.tiles-card-horizion-loading-mask {
    --others-image-text-tile-cover-size: 168px;
}

.tiles-card-horizion-loading-mask .tile {
    width: calc(var(--others-image-text-tile-cover-size) * var(--others-image-text-tile-hcard-width-ratio));
    margin-top: 18px !important;
    margin-bottom: 12px !important;
    margin-left: 13px !important;
    margin-right: 13px !important;
    height: auto !important;
}

.tiles-card-horizion-loading-mask .tile .cover {
    height: 151px !important;
}

/* Mini NavBar Mode */
.mini-navbar-mode .tiles-loading-mask .tile {
    margin-top: 18px;
    margin-bottom: 15px;
}

.mini-navbar-mode .tiles-card-loading-mask .tile {
    margin-top: 21px;
    margin-bottom: 20px;
    transform: scaleY(1.03);
}

.mini-navbar-mode .tiles-video-loading-mask .tile {
    margin: 20px 15px;
    width: calc(var(--others-image-text-tile-cover-size) * 1.24);
}


.mini-navbar-mode .tiles-card-horizion-loading-mask {
    --others-image-text-tile-cover-size: 168px;
}

.mini-navbar-mode .tiles-card-horizion-loading-mask .tile {
    width: calc(var(--others-image-text-tile-cover-size) * var(--others-image-text-tile-hcard-width-ratio));
    margin-top: 18px !important;
    margin-bottom: 12px !important;
    margin-left: 13px !important;
    margin-right: 13px !important;
    height: auto !important;
}

.mini-navbar-mode .tiles-card-horizion-loading-mask .tile .cover {
    height: 151px !important;
}
</style>