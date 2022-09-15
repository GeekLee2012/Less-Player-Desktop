<script setup>
import { onMounted, ref } from 'vue';
import { usePlayStore } from '../store/playStore';
import { useMainViewStore } from '../store/mainViewStore';
import EventBus from '../../common/EventBus';
import { toYyyymmddHhMmSs } from "../../common/Times";

const { showToast } = useMainViewStore()

const props = defineProps({
    index: Number,
    data: Object 
})
</script>

<template>
    <div class="custom-playlist-item" ref="itemRef">
        <div class="sqno">{{ index + 1 }}</div>
        <div class="title spacing">
            <span v-html="data.title" ></span>
        </div>
        <div class="time spacing">
            <span>{{ toYyyymmddHhMmSs(data.created) }}</span>
        </div>
        <div class="time">
            <span>{{ toYyyymmddHhMmSs(data.updated) }}</span>
        </div>
    </div>
</template>

<style scoped>
.custom-playlist-item {
    width: 100%;
    display: flex;
    flex-direction: row;
    flex: 1;
    margin-bottom: 3px;
}

.custom-playlist-item:hover {
    background-color: var(--list-item-hover);
}

.custom-playlist-item > div {
    line-height: 50px;
    vertical-align: middle;
    font-size: 16px;
}

.custom-playlist-item .spacing {
    margin-left: 12px;
}

.custom-playlist-item .sqno {
    width: 35px;
    padding-left: 8px;
    text-align: left;
}

.custom-playlist-item .title {
    flex: 1;
    position: relative;
    text-align: left;
}

.custom-playlist-item .time {
    width: 22%;
}
</style>