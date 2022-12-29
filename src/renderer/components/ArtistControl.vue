<script setup>
import { inject } from 'vue';
import EventBus from '../../common/EventBus';



const { visitArtist } = inject('appRoute')

const props = defineProps({
    visitable: Boolean,
    platform: String,
    data: Array,
    trackId: String
})

let updatedArtist = { trackId: '', artist: [] }

const visitArtistDetail = (platform, item, index, callback) => {
    if (!props.visitable) return
    visitArtist({ platform, item, index, callback, updatedArtist })
}

//TODO 下面代码存在问题，惊群效应
//前期接口未能提供完整数据，后期某个接口更新补全数据
EventBus.on('track-artistUpdated', data => {
    if (!data) return
    if (data.trackId != props.trackId) return
    updatedArtist = data
})
</script>

<template>
    <div class="artist-ctl" v-show="data && data.length > 0">
        <template v-for="(item, index) in data">
            <span @click="visitArtistDetail(platform, item, index)" class="artist-item"
                :class="{ visitable: visitable }" v-html="item.name">
            </span>
            <template v-if="index < (data.length - 1)">、</template>
        </template>
    </div>
</template>

<style scoped>
.artist-ctl {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    /* -webkit-app-region: none; */
    text-align: left;
}

.artist-ctl .visitable {
    cursor: pointer;
}

.artist-ctl .visitable:hover {
    background: var(--hl-text-bg);
    -webkit-background-clip: text;
    color: transparent;
}
</style>