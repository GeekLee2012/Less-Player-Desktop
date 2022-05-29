<script setup>
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import EventBus from '../../common/EventBus';
import { Track } from '../../common/Track';
import { useArtistDetailStore } from '../store/artistDetailStore';
import { useMainViewStore } from '../store/mainViewStore';
import { usePlatformStore } from '../store/platformStore';

const props = defineProps({
    visitable: Boolean,
    platform: String,
    data: Array,
    trackId: String
})

const router = useRouter()
const { hidePlayingView } = useMainViewStore()
const { exploreModeCode } = storeToRefs(useMainViewStore())
const { updateArtistDetailKeys } = useArtistDetailStore()
const { isArtistDetailVisitable } = usePlatformStore()
let updatedArtist = { trackId: '', artist: [] }

const visitArtistDetail = (platform, item, index) => {
    let id = item.id
    const platformValid = isArtistDetailVisitable(platform)
    let idValid = valiadateArtistId(id)
    if(!idValid) { // 二次确认数据
        if(updatedArtist.trackId == props.trackId) {
            const name = updatedArtist.artist[index].name
            if(item.name == name) {
                id = updatedArtist.artist[index].id
                idValid = valiadateArtistId(id)
            } 
        }
    }
    const visitable = props.visitable && platformValid && idValid
    platform = platform.trim()
    if(visitable) {
        const fromPath = router.currentRoute.value.path
        const toPath = '/' + exploreModeCode.value + '/artist/' + platform + "/" + id
        if(fromPath != toPath) {
            router.push(toPath)
            updateArtistDetailKeys(platform, id)
        }
        hidePlayingView()
    }
}

const valiadateArtistId = (id) => {
    return (typeof(id) == 'string') ? (id.trim().length > 0) : (id > 0)
}

//前期接口未能提供完整数据，后期某个接口更新补全数据
EventBus.on('track-artistUpdated', data => {
    if(!data) return
    updatedArtist = data
})
</script>

<template>
    <div class="artist-ctl" v-show="data.length > 0" @click.stop="">
        <template v-for="(item, index) in data">
            <span @click="visitArtistDetail(platform, item, index)"
                class="artist-item" v-html="item.name" >
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
    text-align: left;
}

.artist-ctl .artist-item{
    cursor: pointer;
}

.artist-ctl .artist-item:hover {
    background: linear-gradient(to top right, #1ca388, #28c83f);
    -webkit-background-clip: text;
    color: transparent;
}
</style>