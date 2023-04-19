<script setup>
import { provide } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import EventBus from '../common/EventBus';
import { Playlist } from '../common/Playlist';
import { useArtistDetailStore } from './store/artistDetailStore';
import { useAlbumDetailStore } from './store/albumDetailStore';
import { useAppCommonStore } from './store/appCommonStore';
import { usePlatformStore } from './store/platformStore';
import { useUserProfileStore } from './store/userProfileStore';
import { useSettingStore } from './store/settingStore';
import { isDevEnv } from '../common/Utils';



const { updateArtistDetailKeys } = useArtistDetailStore()
const { updateAlbumDetailKeys } = useAlbumDetailStore()
const { isArtistDetailVisitable, isAlbumDetailVisitable,
    updateCurrentPlatformByCode } = usePlatformStore()
const { exploreModeCode, isUserHomeMode } = storeToRefs(useAppCommonStore())
const { setExploreMode, setArtistExploreMode,
    setRadioExploreMode, setUserHomeExploreMode,
    hideAllCtxMenus, hidePlayingView,
    updateCommonCtxItem, hidePlaybackQueueView,
    setPlaylistExploreMode, hideVideoPlayingView,
    hideLyricToolbar, hideRandomMusicToolbar,
    hideSoundEffectView } = useAppCommonStore()
const { findCustomPlaylistIndex } = useUserProfileStore()
const { isSimpleLayout } = storeToRefs(useSettingStore())
const { switchToFallbackLayout } = useSettingStore()

/* 全局Router设置  */
const router = useRouter()
const setupRouter = () => {
    router.beforeResolve((to, from) => {
        if (isDevEnv()) console.log("[ ROUTE ] ==>>> " + to.path)
        autoSwitchExploreMode(to)
        highlightPlatform(to)
        highlightNavigationCustomPlaylist(to, from)
        hideRelativeComponents(to)
    })
}

//TODO 数据量大时，可能有卡顿风险
const highlightNavigationCustomPlaylist = (to, from) => {
    const path = to.path
    let index = -1
    if (path.includes('/customPlaylist/')
        && !path.includes('/create')
        && !path.includes('/edit')) {
        const id = path.split('/')[3]
        index = findCustomPlaylistIndex(id)
    }
    EventBus.emit("navigation-refreshCustomPlaylistIndex", index)
}

const autoSwitchExploreMode = (to) => {
    const path = to.path
    if (path.includes('/playlists/')) {
        setExploreMode(0)
    } else if (path.includes('/artists/')) {
        setArtistExploreMode()
    } else if (path.includes('/radios')) {
        setRadioExploreMode()
    } else if (path.includes('/userhome')) {
        setUserHomeExploreMode()
    } else {
        //setExploreMode(0)
    }
}

const hideRelativeComponents = (to) => {
    //const path = to.path
    //TODO
    hidePlayingView()
    hideVideoPlayingView()
    hideAllCtxMenus()
    updateCommonCtxItem(null)

    hideLyricToolbar()
    hideRandomMusicToolbar()
    hideSoundEffectView()
}

const createCommonRoute = (toPath, onRouteReady) => ({
    toPath,
    onRouteReady,
    //不完全等价 router.beforeResovle()
    beforeRoute: (toPath) => {
        //hidePlayingView()
        hideRelativeComponents()
        if (isSimpleLayout.value) switchToFallbackLayout()
        if (!toPath.includes('/artist/')) hidePlaybackQueueView()
        if (toPath.includes('/theme') ||
            toPath.includes('/setting')) {
            if (isUserHomeMode.value) setPlaylistExploreMode()
        }
        EventBus.emit('app-beforeRoute', toPath)
    }
})

const currentRoutePath = () => (router.currentRoute.value.path)
const resolveExploreMode = (exploreMode) => (exploreMode || exploreModeCode.value)
const resolveRoute = (route) => (typeof (route) == 'object' ? route : { toPath: route.toString() })

//TODO Reject是否需要实现待考虑
const visitRoute = (route) => {
    return new Promise((resolve, reject) => {
        if (!route) {
            //if(reject) reject()
            return
        }
        const { toPath, onRouteReady, beforeRoute } = resolveRoute(route)
        if (!toPath) {
            //if(reject) reject()
            return
        }
        if (beforeRoute) beforeRoute(toPath)
        const fromPath = currentRoutePath()
        const isSame = (fromPath == toPath)
        if (isSame) {
            //if(reject) reject()
            return
        }
        if (onRouteReady) onRouteReady(toPath)
        router.push(toPath)
        if (resolve) resolve()
    })
}

const highlightPlatform = (to) => {
    const path = to.path
    let platform = ''
    if (path.includes('/square') || path.includes('/playlist')
        || path.includes('/artist') || path.includes('/album')) {
        platform = path.split('/')[3]
    } else if (path.includes('/local')) {
        platform = 'local'
    } else if (path.includes('/userhome')) {
        const parts = path.split('/')
        // /userhome/{code}
        if (parts.length === 3) platform = parts[2]
        // /userhome/customPlaylist/{id}
        if (parts.length === 4 && parts[2] === 'customPlaylist') platform = 'all'
    }
    updateCurrentPlatformByCode(platform)
}

const valiadateArtistId = (id) => {
    return (typeof (id) == 'string') ? (id.trim().length > 0) : (id > 0)
}

const visitArtistDetail = ({ platform, item, index, callback, updatedArtist, onRouteReady }) => {
    let id = item.id
    const platformValid = isArtistDetailVisitable(platform)
    let idValid = valiadateArtistId(id)
    //TODO 二次确认数据，太别扭啦
    if (!idValid && updatedArtist) {
        if (updatedArtist.trackId == props.trackId
            && updatedArtist.artist.length > 0
            && index > -1 && index < updatedArtist.artist.length) {
            const name = updatedArtist.artist[index].name
            if (item.name == name) {
                id = updatedArtist.artist[index].id
                idValid = valiadateArtistId(id)
            }
        }
    }
    const visitable = platformValid && idValid
    platform = platform.trim()
    if (visitable) {
        let exploreMode = exploreModeCode.value
        //let moduleName = 'artist'
        //TODO 存在隐藏Bug，歌手页存在，但在当前exploreMode下找不到平台
        //如豆瓣FM有歌手页的，但无专辑页
        exploreMode = exploreMode == 'radios' ? 'playlists' : exploreMode
        const toPath = `/${exploreMode}/artist/${platform}/${id}`
        visitRoute(createCommonRoute(toPath, onRouteReady)).then(() => updateArtistDetailKeys(platform, id))
        hideAllCtxMenus()
    }
    if (callback) callback(visitable)
}

//TODO 单一责任
const visitAlbumDetail = (platform, id, callback) => {
    const platformValid = isAlbumDetailVisitable(platform)
    const idValid = (typeof (id) == 'string') ? (id.trim().length > 0) : (id > 0)
    const visitable = platformValid && idValid
    platform = platform.trim()
    if (visitable) {
        let exploreMode = exploreModeCode.value
        let moduleName = 'album', isAlbum = true
        if (id.toString().startsWith(Playlist.ANCHOR_RADIO_ID_PREFIX)) {
            exploreMode = exploreMode == 'userhome' ? 'userhome' : 'radios'
            moduleName = 'playlist'
            isAlbum = false
        } else { //TODO
            exploreMode = exploreMode == 'radios' ? 'playlists' : exploreMode
        }
        const toPath = `/${exploreMode}/${moduleName}/${platform}/${id}`
        visitRoute(createCommonRoute(toPath)).then(() => {
            if (isAlbum) updateAlbumDetailKeys(platform, id)
        })
        hideAllCtxMenus()
    }
    if (callback) callback(visitable)
}

setupRouter()

//TODO 世界上没有什么是绝对完美的，没有代码提示是硬伤 ~
provide('appRoute', {
    currentRoutePath,
    visitRoute,
    backward: () => router.back(),
    forward: () => router.forward(),
    visitHome: () => (visitRoute(createCommonRoute('/'))),
    visitThemes: () => (visitRoute(createCommonRoute('/themes'))),
    visitUserHome: () => (visitRoute(createCommonRoute('/userhome/all'))),
    visitSetting: () => (visitRoute(createCommonRoute('/setting'))),
    visitSearch: (keyword) => (visitRoute(createCommonRoute(`/search/${keyword}`))),
    visitPlaylist: (platform, id) => {
        const exploreMode = resolveExploreMode()
        return visitRoute(createCommonRoute(`/${exploreMode}/playlist/${platform}/${id}`))
    },
    visitArtist: ({ platform, item, index, callback, onRouteReady }) => {
        visitArtistDetail({ platform, item, index, callback, onRouteReady })
    },
    visitAlbum: ({ platform, id, callback }) => {
        visitAlbumDetail(platform, id, callback)
    },
    //类似visitPlaylist，但有些区别
    visitFavoritePlaylist: (platform, id) => {
        let exploreMode = resolveExploreMode()
        if (id.toString().startsWith(Playlist.ANCHOR_RADIO_ID_PREFIX)) {
            exploreMode = exploreMode == 'userhome' ? 'userhome' : 'radios'
        }
        return visitRoute(`/${exploreMode}/playlist/${platform}/${id}`)
    },
    visitCustomPlaylistCreate: (exploreMode) => {
        exploreMode = resolveExploreMode(exploreMode)
        return visitRoute(createCommonRoute(`/${exploreMode}/customPlaylist/create`))
    },
    visitCustomPlaylist: (id, exploreMode) => {
        exploreMode = resolveExploreMode(exploreMode)
        return visitRoute(`/${exploreMode}/customPlaylist/${id}`)
    },
    visitCustomPlaylistEdit: (id, exploreMode) => {
        exploreMode = resolveExploreMode(exploreMode)
        return visitRoute(`/${exploreMode}/customPlaylist/edit/${id}`)
    },
    visitBatchCustomPlaylist: (id, exploreMode) => {
        exploreMode = resolveExploreMode(exploreMode)
        return visitRoute(`/${exploreMode}/batch/customPlaylist/${id}`)
    },
    visitBatchLocalMusic: () => {
        return visitRoute("/playlists/batch/local/0")
    },
    visitDataBackup: () => {
        return visitRoute("/data/backup")
    },
    visitDataRestore: () => {
        return visitRoute("/data/restore")
    },
    visitUserInfoEdit: () => {
        return visitRoute("/userhome/user/edit")
    },
})
</script>

<template>
    <slot></slot>
</template>

<style scoped></style>