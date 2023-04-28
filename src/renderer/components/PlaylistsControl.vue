<script setup>
import { inject } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlatformStore } from '../store/platformStore';
import { useSettingStore } from '../store/settingStore';
import PaginationTiles from './PaginationTiles.vue';
import ImageTextTileLoadingMask from './ImageTextTileLoadingMask.vue';
import { Playlist } from '../../common/Playlist';



const { visitPlaylist } = inject('appRoute')
const { playPlaylist } = inject('player')

const props = defineProps({
    data: Array,
    checkbox: Boolean,
    checkedAll: Boolean,
    ignoreCheckAllEvent: Boolean,
    checkChangedFn: Function,
    loading: Boolean
})

const { isPlatformValid } = usePlatformStore()
const { isListenNumShow } = storeToRefs(useSettingStore())

const visitItem = (item) => {
    const { checkbox } = props
    if (checkbox) return
    const { id, platform } = item
    const platformValid = isPlatformValid(platform)
    const idValid = (typeof (id) == 'string') ? (id.trim().length > 0) : (id > 0)
    const visitable = platformValid && idValid

    if (Playlist.isFMRadioType(item)
        || Playlist.isNormalRadioType(item)) {
        //FM广播电台、普通歌单电台
        playPlaylist(item)
    } else if (visitable) {
        //其他，如普通歌单、主播电台歌单等
        visitPlaylist(platform, id)
    }
}

const getListenNumText = (item) => {
    if (!isListenNumShow.value) return null
    let num = item.listenNum
    if (!num) return null
    const unit = 10000
    if (num >= unit) num = parseFloat(num / unit).toFixed(1) + "万"
    return '播放：' + num
}
</script>

<template>
    <div class="playlists-ctl">
        <PaginationTiles v-show="!loading">
            <ImageTextTile v-for="item in data" @click="visitItem(item)" :cover="item.cover" :title="item.title"
                :subtitle="getListenNumText(item)" :playable="true" :playAction="() => playPlaylist(item)"
                :checkbox="checkbox" :checked="checkedAll" :ignoreCheckAllEvent="ignoreCheckAllEvent"
                :checkChangedFn="(checked) => checkChangedFn(checked, item)">
            </ImageTextTile>
        </PaginationTiles>
        <ImageTextTileLoadingMask :count="20" v-show="loading"></ImageTextTileLoadingMask>
    </div>
</template>

<style scoped>
.playlists-ctl {
    margin-top: 15px;
}
</style>