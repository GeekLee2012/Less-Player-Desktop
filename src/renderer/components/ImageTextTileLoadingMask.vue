<script setup>
import { onMounted } from 'vue';
import EventBus from '../../common/EventBus';



const props = defineProps({
    count: Number
})
onMounted(() => {
    EventBus.emit("imageTextTileLoadingMask-load")
})
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
    width: 175px;
    height: 208px;
    margin: 15px 12px;
}

.tiles-loading-mask .tile .cover {
    width: 100%;
    height: 175px;
    border-radius: 6px;
}

.tiles-loading-mask .tile .title {
    width: 100%;
    height: 28px;
    margin-top: 5px;
    border-radius: 3px;
}
</style>