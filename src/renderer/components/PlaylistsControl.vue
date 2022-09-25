<script setup>
import { useRouter } from 'vue-router';
import PaginationTiles from './PaginationTiles.vue';
import { usePlatformStore } from '../store/platformStore';
import { usePlayStore } from '../store/playStore';
import EventBus from '../../common/EventBus';
import { useMainViewStore } from '../store/mainViewStore';
import { storeToRefs } from 'pinia';
import { Track } from '../../common/Track';
import { useUserProfileStore } from '../store/userProfileStore';

const props = defineProps({
    data: Array
})

const router = useRouter()
const { getVender, isPlatformValid } = usePlatformStore()
const { addTrack, addTracks, playTrack, resetQueue, playNextTrack } = usePlayStore()
const { exploreModeCode } = storeToRefs(useMainViewStore())
const { showToast } = useMainViewStore()
const { addRecentPlaylist } = useUserProfileStore()

const visitItem = (item) => {
    const { id, platform, isFMRadio, isRadioType } = item
    const platformValid = isPlatformValid(platform)
    const idValid = (typeof(id) == 'string') ? (id.trim().length > 0) : (id > 0)
    const visitable = platformValid && idValid
    if(isFMRadio) { //FM广播
        const track = Track.fromChannel(item.channel, true)
        addTrack(track)
        playTrack(track)
    } else if(isRadioType) { //音乐电台歌单
        nextRadioTrack(platform, id)
    } else if(visitable) { //普通歌单
        const url = '/' + exploreModeCode.value + '/playlist/' + platform + "/" + id
        router.push(url)
    }
}

const playItem = (item) => {
    const { id, platform, isFMRadio, isRadioType } = item
    if(isFMRadio || isRadioType) {
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
    const { id, platform, title, cover } = playlist
    addRecentPlaylist(id, platform, title, cover)
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
         <PaginationTiles>
            <template #data>
                <ImageTextTile v-for="item in data"
                    @click="visitItem(item)"
                    :cover="item.cover" 
                    :title="item.title"
                    :playable="true"
                    :playAction="() => playItem(item)" >
                </ImageTextTile>
            </template>
        </PaginationTiles>
    </div>
</template>

<style scoped>
.playlists-ctl {
    margin-top: 15px;
}
</style>