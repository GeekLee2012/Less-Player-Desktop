<script setup>
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { Playlist } from '../../common/Playlist';
import { useAlbumDetailStore } from '../store/albumDetailStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { usePlatformStore } from '../store/platformStore';

const props = defineProps({
    visitable: Boolean,
    platform: String,
    data: Object
})

const router = useRouter()
const { updateAlbumDetailKeys } = useAlbumDetailStore()
const { isAlbumDetailVisitable } = usePlatformStore()
const { exploreModeCode } = storeToRefs(useAppCommonStore())
const { hidePlayingView } = useAppCommonStore()

//TODO 单一责任
const visitAlbumDetail = (platform, id) => {
    const platformValid = isAlbumDetailVisitable(platform)
    const idValid = (typeof(id) == 'string') ? (id.trim().length > 0) : (id > 0)
    const visitable = props.visitable && platformValid && idValid 
    platform = platform.trim()
    if(visitable) {
        const fromPath = router.currentRoute.value.path
        let exploreMode = exploreModeCode.value
        let moduleName = 'album'
        let isAlbum = true
        if(id.startsWith(Playlist.ANCHOR_RADIO_ID_PREFIX)) {
            exploreMode = exploreMode == 'userhome' ? 'userhome' : 'radios'
            moduleName = 'playlist'
            isAlbum = false
        }
        const toPath = `/${exploreMode}/${moduleName}/${platform}/${id}`
        if(fromPath != toPath) {
            router.push(toPath)
            if(isAlbum) updateAlbumDetailKeys(platform, id)
        }
        hidePlayingView()
    }
}

</script>

<template>
    <span @click="visitAlbumDetail(platform, data.id)" 
        class="album-ctl" v-html="data.name" > 
    </span>
</template>

<style>
.album-ctl {
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    text-align: left;
}

.album-ctl:hover {
    background: var(--hl-text-bg);
    -webkit-background-clip: text;
    color: transparent;
}
</style>