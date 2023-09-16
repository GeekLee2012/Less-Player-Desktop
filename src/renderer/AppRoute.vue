<script setup>
import { provide } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import EventBus from '../common/EventBus';
import { useUserProfileStore } from './store/userProfileStore';
import { useSettingStore } from './store/settingStore';
import { useArtistDetailStore } from './store/artistDetailStore';
import { useAlbumDetailStore } from './store/albumDetailStore';
import { useAppCommonStore } from './store/appCommonStore';
import { usePlatformStore } from './store/platformStore';
import { Playlist } from '../common/Playlist';
import { isDevEnv } from '../common/Utils';



const { updateArtistDetailKeys } = useArtistDetailStore()
const { updateAlbumDetailKeys } = useAlbumDetailStore()
const { isArtistDetailVisitable, isAlbumDetailVisitable,
    updateCurrentPlatformByCode, isLocalMusic } = usePlatformStore()
const { exploreModeCode, isUserHomeMode } = storeToRefs(useAppCommonStore())
const { setExploreMode, setArtistExploreMode,
    setRadioExploreMode, setUserHomeExploreMode,
    hideAllCtxMenus, hidePlayingView,
    updateCommonCtxItem, hidePlaybackQueueView,
    setPlaylistExploreMode, hideVideoPlayingView,
    hideLyricToolbar, hideRandomMusicToolbar,
    hideSoundEffectView, hidePopoverHint,
    setSearchPlaceHolderIndex, setRouterCtxCacheItem } = useAppCommonStore()
const { findCustomPlaylistIndex } = useUserProfileStore()
const { isSimpleLayout, isSearchBarAutoPlaceholderEnable } = storeToRefs(useSettingStore())
const { switchToFallbackLayout } = useSettingStore()

/* 全局Router设置  */
const router = useRouter()
const setupRouter = () => {
    router.beforeResolve((to, from) => {
        if (isDevEnv()) console.log("[ ROUTE ] ==>>> " + to.path)
        autoSwitchExploreMode(to, from)
        highlightPlatform(to)
        highlightNavigationCustomPlaylist(to, from)
        hideRelativeComponents(to)
        autoSwitchSearchPlaceHolder(to)
    })
}

//TODO 数据量大时，可能有卡顿风险
const highlightNavigationCustomPlaylist = (to, from) => {
    const { path } = to
    let index = -1
    if (path.includes('/custom/')
        && !path.includes('/create')
        && !path.includes('/edit')) {
        const id = path.split('/')[3]
        index = findCustomPlaylistIndex(id)
    }
    EventBus.emit("navigation-refreshCustomPlaylistIndex", index)
}

const autoSwitchExploreMode = (to, from) => {
    const { path: toPath } = to
    const { path: fromPath } = from
    if (toPath.includes('/playlists/') || toPath == '/'
        || (fromPath.includes('/batch/') && toPath.includes('/setting'))) {
        setPlaylistExploreMode()
    } else if (toPath.includes('/artists/')) {
        setArtistExploreMode()
    } else if (toPath.includes('/radios')) {
        setRadioExploreMode()
    } else if (toPath.includes('/userhome')) {
        setUserHomeExploreMode()
    } else if (toPath.includes('/theme') ||
        toPath.includes('/search') ||
        toPath.includes('/setting')) {
        if (isUserHomeMode.value) setPlaylistExploreMode()
    }
}

//TODO 硬编码
let searchPlaceHolderTimer = null
const autoSwitchSearchPlaceHolder = (to) => {
    if (!isSearchBarAutoPlaceholderEnable.value) return
    clearTimeout(searchPlaceHolderTimer)

    const { path } = to
    let index = 0
    if (path.includes('/local')) {
        index = 1
    } else if (path.includes('/radios')) {
        index = 2
    } else if (path.includes('/setting')) {
        index = path.includes('/modules') ? 8 : 3
    } else if (path.includes('/themes')) {
        index = 4
    } else if (path.includes('/data/backup')) {
        index = 5
    } else if (path.includes('/data/restore')) {
        index = 6
    } else if (path.includes('/userhome')) {
        index = 7
    }
    setSearchPlaceHolderIndex(index)
    searchPlaceHolderTimer = setTimeout(() => {
        if (index != 0) setSearchPlaceHolderIndex(0)
    }, 60000)

}

const hideRelativeComponents = (to) => {
    hidePlayingView()
    hideVideoPlayingView()
    hideAllCtxMenus()
    updateCommonCtxItem(null)
    hidePopoverHint()

    hideLyricToolbar()
    hideRandomMusicToolbar()
    hideSoundEffectView()
}

const createCommonRoute = (route, onRouteReady) => {
    route = route || { path: '/' }
    if (typeof (route) === 'string') route = { path: route }
    return {
        ...route,
        path: (route.path || route.toPath),
        onRouteReady,
        //不完全等价 router.beforeResovle()
        beforeRoute: (toPath) => {
            //hidePlayingView()
            setRouterCtxCacheItem(null)
            hideRelativeComponents()
            if (isSimpleLayout.value) switchToFallbackLayout()
            if (!toPath.includes('/artist/')) hidePlaybackQueueView()
            EventBus.emit('app-beforeRoute', toPath)
        }
    }
}

const currentRoutePath = () => (router.currentRoute.value.path)
const resolveExploreMode = (exploreMode) => (exploreMode || exploreModeCode.value)
const resolveRoute = (route) => (typeof (route) == 'object' ? route : { path: route.toString() })

const visitRoute = (route) => {
    return new Promise((resolve, reject) => {
        if (!route) {
            return reject('noRoute')
        }
        route = resolveRoute(route)
        const { path: toPath, onRouteReady, beforeRoute, replace, override } = route
        if (!toPath) {
            return reject('noRoute')
        }
        if (beforeRoute && typeof (beforeRoute) == 'function') beforeRoute(toPath)
        const fromPath = currentRoutePath()
        const isSame = (fromPath == toPath)
        if (isSame && !replace && !override) {
            return reject('sameRoute')
        }
        //相同且要求覆盖，才进行替换
        if (isSame && override) Object.assign(route, { replace: true })
        if (onRouteReady && typeof (onRouteReady) == 'function') onRouteReady(toPath)
        router.push(route)
        resolve(route)
    })
}

const visitCommonRoute = (route, onRouteReady) => {
    return visitRoute(createCommonRoute(route, onRouteReady))
}

const refresh = () => {
    const route = router.currentRoute.value
    Object.assign(route, { override: true })
    visitCommonRoute(route)
}

const highlightPlatform = (to) => {
    const { path } = to
    let platform = null
    if (path.includes('/local')) {
        platform = 'local'
    } else if (path.includes('/freefm')) {
        platform = 'freefm'
    } else if (path.includes('/track')) {
        platform = path.split('/')[2]
    } else if (path.includes('/square') || path.includes('/playlist')
        || path.includes('/artist') || path.includes('/album')) {
        platform = path.split('/')[3]
    } else if (path.includes('/userhome')) {
        const parts = path.split('/')
        // /userhome/{code}
        if (parts.length === 3) platform = parts[2]
        // /userhome/custom/{id}
        if (parts.length === 4 && parts[2] === 'custom') platform = 'all'
    }
    if (platform) updateCurrentPlatformByCode(platform)
}

const valiadateArtistId = (id) => {
    return (typeof (id) == 'string') ? (id.trim().length > 0) : (id > 0)
}

const visitArtistDetail = ({ platform, item, index, callback, updatedArtist, onRouteReady }) => {
    let id = item.id
    if (isLocalMusic(platform)) id = item.name || item.title
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
        let exploreMode = resolveExploreMode()
        exploreMode = exploreMode == 'radios' ? 'playlists' : exploreMode
        const toPath = `/${exploreMode}/artist/${platform}/${id}`
        visitCommonRoute(toPath, onRouteReady).then(() => updateArtistDetailKeys(platform, id))
        hideAllCtxMenus()
    }
    if (callback) callback(visitable)
}

//TODO 单一责任
const visitAlbumDetail = (platform, id, callback, data) => {
    if (isLocalMusic(platform)) id = data.name || data.title
    const platformValid = isAlbumDetailVisitable(platform)
    const idValid = (typeof (id) == 'string') ? (id.trim().length > 0) : (id > 0)
    const visitable = platformValid && idValid
    platform = platform.trim()
    if (visitable) {
        let exploreMode = resolveExploreMode()
        let moduleName = 'album', isAlbum = true
        if (id.toString().startsWith(Playlist.ANCHOR_RADIO_ID_PREFIX)) {
            exploreMode = exploreMode == 'userhome' ? 'userhome' : 'radios'
            moduleName = 'playlist'
            isAlbum = false
        } else { //TODO
            exploreMode = exploreMode == 'radios' ? 'playlists' : exploreMode
        }
        const toPath = `/${exploreMode}/${moduleName}/${platform}/${id}`
        visitCommonRoute(toPath).then(() => {
            if (isAlbum) updateAlbumDetailKeys(platform, id)
        })
        hideAllCtxMenus()
    }
    if (callback) callback(visitable)
}

const visitUserHome = (onRouteReady) => (visitCommonRoute('/userhome/all', onRouteReady))

setupRouter()

//TODO 世界上没有什么是绝对完美的，没有代码提示是硬伤 ~
provide('appRoute', {
    currentRoutePath,
    visitRoute,
    visitCommonRoute,
    backward: () => router.back(),
    forward: () => router.forward(),
    refresh,
    visitHome: () => (visitCommonRoute('/')),
    visitThemes: () => (visitCommonRoute('/themes')),
    visitUserHome,
    visitSetting: () => (visitCommonRoute('/setting')),
    visitSearch: (keyword) => (visitCommonRoute(`/search/${keyword}`)),
    visitLocalMusic: () => (visitCommonRoute('/playlists/local')),
    visitPlaylistSquare: (platform) => (visitCommonRoute(`/playlists/square/${platform}`)),
    visitPlaylist: (platform, id) => {
        const exploreMode = resolveExploreMode()
        if (platform === 'local') {
            return visitCommonRoute(`/${exploreMode}/local/${id}`)
        }
        return visitCommonRoute(`/${exploreMode}/playlist/${platform}/${id}`)
    },
    visitArtist: ({ platform, item, index, callback, onRouteReady }) => {
        visitArtistDetail({ platform, item, index, callback, onRouteReady })
    },
    visitAlbum: ({ platform, id, callback, data }) => {
        visitAlbumDetail(platform, id, callback, data)
    },
    //类似visitPlaylist，但有些区别
    visitFavoritePlaylist: (platform, id) => {
        let exploreMode = resolveExploreMode()
        if (id.toString().startsWith(Playlist.ANCHOR_RADIO_ID_PREFIX)) {
            exploreMode = (exploreMode == 'userhome') ? 'userhome' : 'radios'
        }
        return visitCommonRoute(`/${exploreMode}/playlist/${platform}/${id}`)
    },
    visitCustomPlaylistCreate: (exploreMode) => {
        exploreMode = resolveExploreMode(exploreMode)
        return visitCommonRoute(`/${exploreMode}/custom/create`)
    },
    visitCustomPlaylist: (id, exploreMode) => {
        exploreMode = resolveExploreMode(exploreMode)
        return visitCommonRoute(`/${exploreMode}/custom/${id}`)
    },
    visitCustomPlaylistEdit: (id, exploreMode) => {
        exploreMode = resolveExploreMode(exploreMode)
        return visitCommonRoute(`/${exploreMode}/custom/edit/${id}`)
    },
    visitBatchCustomPlaylist: (id, exploreMode) => {
        exploreMode = resolveExploreMode(exploreMode)
        return visitCommonRoute(`/${exploreMode}/batch/custom/${id}`)
    },
    visitBatchLocalMusic: () => {
        return visitCommonRoute('/playlists/batch/local/0')
    },
    visitBatchLocalPlaylist: (id) => {
        return visitCommonRoute(`/playlists/batch/local/${id}`)
    },
    visitDataBackup: () => {
        return visitCommonRoute('/data/backup')
    },
    visitDataRestore: () => {
        return visitCommonRoute('/data/restore')
    },
    visitUserInfoEdit: () => {
        return visitCommonRoute('/userhome/user/edit')
    },
    visitLocalPlaylistCreate: (exploreMode) => {
        exploreMode = resolveExploreMode(exploreMode)
        return visitCommonRoute(`/${exploreMode}/local/create`)
    },
    visitLocalPlaylistEdit: (id, exploreMode) => {
        exploreMode = resolveExploreMode(exploreMode)
        return visitCommonRoute(`/${exploreMode}/local/edit/${id}`)
    },
    visitFreeFM: () => {
        return visitCommonRoute(`/radios/freefm`)
    },
    visitFreeFMCreate: (exploreMode) => {
        exploreMode = resolveExploreMode(exploreMode)
        return visitCommonRoute(`/${exploreMode}/freefm/create`)
    },
    visitFreeFMEdit: (id, exploreMode) => {
        exploreMode = resolveExploreMode(exploreMode)
        return visitCommonRoute(`/${exploreMode}/freefm/edit/${id}`)
    },
    visitBatchFreeFM: () => {
        return visitCommonRoute('/radios/batch/freefm/0')
    },
    visitModulesSetting: () => {
        return visitCommonRoute('/setting/modules')
    },
    visitBatchRecents: () => {
        return visitCommonRoute('/userhome/batch/recents/0')
    },
    visitFreeVideoCreate: () => {
        return visitCommonRoute('/videos/video/create')
    },
    visitTrack: ({ id, platform, title, cover, artist, album }, onRouteReady) => {
        const exploreMode = resolveExploreMode()
        return visitCommonRoute({
            path: `/${exploreMode}/${platform}/track/${id}`,
            //replace: false,   //Vue-Router原生支持选项，但有副作用
            override: true,     //自定义选项
            query: { id, platform, title, cover, artist, album }
        }, onRouteReady)
    },
    visitRecents: () => {
        //setTimeout(() => EventBus.emit('userHome-visitTab', 3), 66)
        visitUserHome(() => setRouterCtxCacheItem({ id: 'visitRecents' }))
            .catch(() => EventBus.emit('userHome-visitTab', 3))
    }
})
</script>

<template>
    <slot></slot>
</template>

<style scoped></style>