<script setup>
import { useRouter } from 'vue-router';
import PaginationTiles from './PaginationTiles.vue';
import { usePlatformStore } from '../store/platformStore';
import { usePlayStore } from '../store/playStore';
import EventBus from '../../common/EventBus';
import { useAppCommonStore } from '../store/appCommonStore';
import { storeToRefs } from 'pinia';
import { Track } from '../../common/Track';
import { useUserProfileStore } from '../store/userProfileStore';
import ImageTextTileLoadingMask from './ImageTextTileLoadingMask.vue';
import { Playlist } from '../../common/Playlist';

const props = defineProps({
    data: Array,
    checkbox: Boolean,
    checkedAll: Boolean,
    ignoreCheckAllEvent: Boolean,
    checkChangedFn: Function,
    loading: Boolean
})

const router = useRouter()
const { getVender, isPlatformValid } = usePlatformStore()
const { addTrack, addTracks, playTrack, resetQueue, playNextTrack } = usePlayStore()
const { exploreModeCode } = storeToRefs(useAppCommonStore())
const { showToast } = useAppCommonStore()
const { addRecentPlaylist } = useUserProfileStore()

const visitItem = (item) => {
    const { checkbox } = props
    if(checkbox) return
    const { id, platform } = item
    const platformValid = isPlatformValid(platform)
    const idValid = (typeof(id) == 'string') ? (id.trim().length > 0) : (id > 0)
    const visitable = platformValid && idValid
    if(Playlist.isFMRadioType(item)) { //FM广播电台
        const track = item.data[0]
        addTrack(track)
        playTrack(track)
    } else if(Playlist.isNormalRadioType(item)) { //普通歌单电台
        nextRadioTrack(platform, id)
    } else if(visitable) { //其他，如普通歌单、主播电台歌单等
        const url = '/' + exploreModeCode.value + '/playlist/' + platform + "/" + id
        router.push(url)
    }
}

const playItem = (item) => {
    const { id, platform } = item
    if(Playlist.isNormalRadioType(item) 
        || Playlist.isFMRadioType(item)) {
        visitItem(item)
        return 
    }
    const vender = getVender(platform)
    if(!vender) return 
    vender.playlistDetail(id, 0, 1000, 1).then(result => {
        playAll(result)
    })
}

//目前以加入当前播放列表为参考标准
const traceRecentPlay = (playlist) => {
    const { id, platform, title, cover, type } = playlist
    addRecentPlaylist(id, platform, title, cover, type)
}

const playAll = (playlist) => {
    if(!playlist || playlist.data.length < 1) return 
    resetQueue()
    addTracks(playlist.data)
    showToast("即将为您播放全部！")
    traceRecentPlay(playlist)
    playNextTrack()
}

const nextRadioTrack = (platform, channel, track) => {
    if(!Track.hasId(track)) resetQueue()
    getVender(platform).nextRadioTrack(channel, track).then(result => {
        if(!Track.hasId(result)) return 
        addTrack(result)
        playTrack(result)
    })
}

EventBus.on('radio-nextTrack', track => nextRadioTrack(track.platform, track.channel, track))
</script>

<template>
    <div class="playlists-ctl">
         <PaginationTiles v-show="!loading">
            <ImageTextTile v-for="item in data"
                @click="visitItem(item)"
                :cover="item.cover" 
                :title="item.title"
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