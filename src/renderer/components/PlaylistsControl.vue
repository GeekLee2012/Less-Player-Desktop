<script setup>
import { useRouter } from 'vue-router';
import PaginationTiles from './PaginationTiles.vue';
import { usePlatformStore } from '../store/platformStore';
import { usePlayStore } from '../store/playStore';
import EventBus from '../../common/EventBus';
import { useMainViewStore } from '../store/mainViewStore';
import { storeToRefs } from 'pinia';
import { Track } from '../../common/Track';

const props = defineProps({
    data: Array
})

const router = useRouter()
const { getVender, isPlatformValid } = usePlatformStore()
const { addTrack, playTrack, resetQueue } = usePlayStore()
const { exploreModeCode } = storeToRefs(useMainViewStore())

const visitItem = (item) => {
    const platform = item.platform
    const id = item.id
    const platformValid = isPlatformValid(platform)
    const idValid = (typeof(id) == 'string') ? (id.trim().length > 0) : (id > 0)
    const visitable = platformValid && idValid
    if(item.isFMRadio) { //FM广播
        const track = Track.fromChannel(item.channel, true)
        addTrack(track)
        playTrack(track)
    } else if(item.isRadioType) { //音乐电台歌单
        nextRadioTrack(platform, id)
    } else if(visitable) { //普通歌单
        const url = '/' + exploreModeCode.value + '/playlist/' + platform + "/" + id
        router.push(url)
    }
}

const nextRadioTrack = (platform, channel, track) => {
    if(!track || !track.hasId()) resetQueue()
    getVender(platform).nextRadioTrack(channel, track).then(result => {
        if(!result || !result.hasId()) return 
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
                    :cover="item.cover" 
                    :title="item.title"
                    @click="visitItem(item)" >
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