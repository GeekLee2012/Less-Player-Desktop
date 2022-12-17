<script setup>
import PaginationTiles from './PaginationTiles.vue';
import { usePlatformStore } from '../store/platformStore';
import { usePlayStore } from '../store/playStore';
import EventBus from '../../common/EventBus';
import { useAppCommonStore } from '../store/appCommonStore';
import { Track } from '../../common/Track';
import { useUserProfileStore } from '../store/userProfileStore';
import { useSettingStore } from '../store/settingStore';
import ImageTextTileLoadingMask from './ImageTextTileLoadingMask.vue';
import { Playlist } from '../../common/Playlist';
import { inject } from 'vue';
import { storeToRefs } from 'pinia';

const { visitPlaylist } = inject('appRoute')

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

const playItem = (playlist, text) => EventBus.emit('playlist-play', { playlist, text})

const visitItem = (item) => {
    const { checkbox } = props
    if(checkbox) return
    const { id, platform } = item
    const platformValid = isPlatformValid(platform)
    const idValid = (typeof(id) == 'string') ? (id.trim().length > 0) : (id > 0)
    const visitable = platformValid && idValid

    if(Playlist.isFMRadioType(item) 
        || Playlist.isNormalRadioType(item)) {
         //FM广播电台、普通歌单电台
        playItem(item)
    } else if(visitable) { 
        //其他，如普通歌单、主播电台歌单等
        visitPlaylist(platform, id)
    }
}

const getListenNumText = (item) => {
    if(!isListenNumShow.value) return null
    let num = item.listenNum
    if(!num) return null
    const unit = 10000
    if(num >= unit) num = parseFloat(num / unit).toFixed(1) + "万"
    return '播放：' + num
}
</script>

<template>
    <div class="playlists-ctl">
         <PaginationTiles v-show="!loading">
            <ImageTextTile v-for="item in data"
                @click="visitItem(item)"
                :cover="item.cover" 
                :title="item.title"
                :subtitle="getListenNumText(item)"
                :playable="true"
                :playAction="() => playItem(item)"
                :checkbox="checkbox"
                :checked="checkedAll"
                :ignoreCheckAllEvent="ignoreCheckAllEvent"
                :checkChangedFn="(checked) => checkChangedFn(checked, item)" >
            </ImageTextTile>
        </PaginationTiles>
        <ImageTextTileLoadingMask :count="16" v-show="loading"></ImageTextTileLoadingMask>
    </div>
</template>

<style scoped>
.playlists-ctl {
    margin-top: 15px;
}
</style>