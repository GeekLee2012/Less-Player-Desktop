<script setup>
import { useRouter } from 'vue-router';
import { useMainViewStore } from '../store/mainViewStore';
import { usePlatformStore } from '../store/platformStore';

const router = useRouter()
const { updateCurrentPlatformByCode } = usePlatformStore()
const { setExploreMode, setArtistExploreMode, setUserExploreMode,
    hideAllCtxMenus, hidePlayingView, updateCommonCtxItem } = useMainViewStore()

router.beforeResolve((to, from) => {
    console.log("[ ROUTE ] ==>>> " + to.path)
    autoSwitchExploreMode(to)
    highlightPlatform(to)
    hideRelativeComponents(to)
})

const highlightPlatform = (to) => {
    const path = to.path
    let code = ''
    if(path.includes('/square') || path.includes('/playlist')
         || path.includes('/artist')  || path.includes('/album')) {
        code = path.split('/')[3]
    } else if(path.includes('/local')) {
        code = 'local'
    }  else if(path.includes('/userhome')) {
        code = path.split('/')[2]
    } 
    updateCurrentPlatformByCode(code)
}

const autoSwitchExploreMode = (to) => {
    const path = to.path
    if(path.includes('/playlists/')) {
        setExploreMode(0)
    } else if(path.includes('/artists/')) {
        setArtistExploreMode()
    } else if(path.includes('/userhome')) {
        setUserExploreMode()
    } else {
        setExploreMode(0)
    }
}

const hideRelativeComponents = (to) => {
    //const path = to.path
    //TODO
    hidePlayingView()
    hideAllCtxMenus()
    updateCommonCtxItem(null)
}

const excludes = [ 'CustomPlaylistEditView', 'UserInfoEditView', 'BatchActionView' ]
</script>

<template>
    <div id="main-content">
        <router-view v-slot="{ Component }">
            <keep-alive :exclude="excludes" :max="10">
                <component :is="Component" />
            </keep-alive>
        </router-view>
    </div>  
</template>

<style>
#main-content {
    display: flex;
    flex: 1;
    overflow: auto;
    margin-right: 2px;
}
</style>