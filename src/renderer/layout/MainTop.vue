<script setup>
import PlayMeta from '../components/PlayMeta.vue';
import SearchBar from '../components/SearchBar.vue';
import Navigator from '../components/Navigator.vue';
import { useRouter } from 'vue-router';
import { usePlayStore } from '../store/playStore';
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import EventBus from '../../common/EventBus';

const router = useRouter()
const progressBarRef = ref(null)
const { progress } = storeToRefs(usePlayStore())

const visitSettingView = () => {
    router.push('/setting')
}

const seekTrack = (percent) => {
    EventBus.emit('track-seek', percent)
}

watch(progress, (nv, ov) => {
    progressBarRef.value.updateProgress(nv)
})
</script>

<template>
    <div id="main-top">
        <div id="play-nav">
            <PlayMeta id="play-meta"></PlayMeta>
            <PlayControl id="play-ctl"></PlayControl>
            <div class="top-right">
                <SearchBar></SearchBar>
                <div id="setting-btn" @click="visitSettingView">
                    <svg width="22" height="21" viewBox="0 0 19.53 18" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path class="cls-1" d="M.32,10.34a3,3,0,0,1,0-2.68l3-6A3,3,0,0,1,6,0h7.53a3,3,0,0,1,2.68,1.66l3,6a3,3,0,0,1,0,2.68l-3,6A3,3,0,0,1,13.53,18H6a3,3,0,0,1-2.68-1.66ZM2.11,8.55a1,1,0,0,0,0,.9l3,6A1,1,0,0,0,6,16h7.53a1,1,0,0,0,.89-.55l3-6a1,1,0,0,0,0-.9l-3-6A1,1,0,0,0,13.53,2H6a1,1,0,0,0-.89.55ZM7.76,9a2,2,0,1,0,2-2A2,2,0,0,0,7.76,9Zm2,4a4,4,0,1,1,4-4A4,4,0,0,1,9.76,13Z"/></g></g></svg>
                </div>
                <Navigator></Navigator>
            </div>
        </div>
        <ProgressBar ref="progressBarRef" :onseek="seekTrack"></ProgressBar>
    </div>
</template>

<style scoped>
#main-top, #play-nav {
    display: flex;
}

#main-top {
    flex-direction: column;
    height: 71px;
    -webkit-app-region: drag;
}

#play-nav #play-meta {
    width: 33.83%;
}

#play-nav #play-ctl {
    flex: 1;
    align-items: center;
    justify-content: center;
    margin-left: 15px;
    margin-right: 15px;
}

#play-nav .top-right {
    width: 39.83%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
}

#setting-btn {
    cursor: pointer;
    -webkit-app-region: none;
    margin-right: 10px;
}

#setting-btn svg {
    margin-top: 4px;
    margin-left: 15px;
    fill: var(--svg-color);
}

#setting-btn svg:hover {
    fill: linear-gradient(to top right, #28c83f, #1ca388) !important;
    fill: #28c83f;
}
</style>