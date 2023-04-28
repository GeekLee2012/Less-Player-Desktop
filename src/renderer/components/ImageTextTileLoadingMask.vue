<script setup>
import { onMounted } from 'vue';

const props = defineProps({
    count: Number
})

/*
onMounted(() => {
    EventBus.emit("imageTextTiles-mounted")
})
*/
</script>

<template>
    <div class="tiles-loading-mask">
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
    width: var(--image-text-tile-mask-width);
    height: 206px;
    margin: 15px 13px;
}

.tiles-loading-mask .tile .cover {
    width: 100%;
    height: var(--image-text-tile-mask-width);
    border-radius: 6px;
}

.tiles-loading-mask .tile .title {
    width: 100%;
    height: 28px;
    margin-top: 5px;
    border-radius: 3px;
}
</style>