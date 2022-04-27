<script setup>
import { useRouter } from 'vue-router';
import { useAlbumDetailStore } from '../store/albumDetailStore';
import { useMainViewStore } from '../store/mainViewStore';
import { usePlatformStore } from '../store/platformStore';

const router = useRouter()
const { hidePlayingView } = useMainViewStore()
const { updateAlbumDetailKeys } = useAlbumDetailStore()
const { isAlbumDetailVisitable } = usePlatformStore()

const props = defineProps({
    visitable: Boolean,
    platform: String,
    data: Object
})

const visitAlbumDetail = (platform, id) => {
    const platformValid = isAlbumDetailVisitable(platform)
    const idValid = (id > 0)
    const visitable = props.visitable && platformValid && idValid 
    if(visitable) {
        router.push('/album/' + platform + "/" + id)
        updateAlbumDetailKeys(platform, id)
        hidePlayingView()
    }
}

</script>

<template>
    <span @click="visitAlbumDetail(platform, data.id)" class="album-ctl">{{ data.name }}</span>
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
    background: linear-gradient(to top right, #1ca388, #28c83f);
    -webkit-background-clip: text;
    color: transparent;
}
</style>