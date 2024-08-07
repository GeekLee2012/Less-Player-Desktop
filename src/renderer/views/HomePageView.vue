<script setup>
import { storeToRefs } from 'pinia';
import { inject, onActivated } from 'vue';
import { usePlatformStore } from '../store/platformStore';



const { visitPlaylistSquare, visitLocalMusic } = inject('appRoute')

const { activePlatforms } = storeToRefs(usePlatformStore())
const { isLocalMusic } = usePlatformStore()

const visitFirstActivePlatform = () => {
    const { code } = activePlatforms.value('playlists')[0]
    if (isLocalMusic(code)) {
        visitLocalMusic()
    } else {
        visitPlaylistSquare(code)
    }
}


/* 生命周期、监听 */
onActivated(visitFirstActivePlatform)
</script>

<template>
    <div id="home-page-view">
        <div class="header">
            <div class="title">首页</div>
        </div>
        <div class="center"></div>
    </div>
</template>

<style>
#home-page-view {
    flex: 1;
    display: flex;
    text-align: left;
    flex-direction: column;
    overflow: scroll;
    overflow-x: hidden;
}

#home-page-view .header {
    padding-left: 35px;
    padding-right: 35px;
    margin-bottom: 10px;
}


#home-page-view .header .title {
    margin-bottom: 35px;
    padding-top: 20px;
    /*font-size: 30px;*/
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
}

#home-page-view .center {
    display: flex;
    flex-direction: column;
    flex: 1;
    margin-left: 35px;
    margin-right: 35px;
    padding-bottom: 56px;
}
</style>