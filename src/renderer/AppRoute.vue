<script setup>
import { provide } from 'vue';
import { storeToRefs } from 'pinia';
import { useUserProfileStore } from './store/userProfileStore';
import { useSettingStore } from './store/settingStore';
import { useArtistDetailStore } from './store/artistDetailStore';
import { useAlbumDetailStore } from './store/albumDetailStore';
import { useAppCommonStore } from './store/appCommonStore';
import { usePlatformStore } from './store/platformStore';
import { Playlist } from '../common/Playlist';
import { isDevEnv, toTrimString, isBlank } from '../common/Utils';
import { onEvents, emitEvents } from '../common/EventBusWrapper';
import { currentRoute, currentRoutePath, onBeforeResolve, 
    backward, forward, addRoute, pushRoute, addHomePath, } from './route/router';



const { isArtistDetailVisitable, isAlbumDetailVisitable,
    updateCurrentPlatformByCode, isLocalMusic,
    isFMRadioPlatform, isFreeFM, } = usePlatformStore()
const { exploreModeCode, isUserHomeMode } = storeToRefs(useAppCommonStore())
const { setExploreMode, setArtistExploreMode,
    setRadioExploreMode, setUserHomeExploreMode,
    hideAllCtxMenus, hidePlayingView,
    updateCommonCtxItem, hidePlaybackQueueView,
    setPlaylistExploreMode, hideVideoPlayingView,
    hideLyricToolbar, hideRandomMusicToolbar,
    hideSoundEffectView, hidePopoverHint,
    setSearchPlaceHolderIndex, setRouterCtxCacheItem,
    hidePlayingThemeListView, setCloudStorageExploreMode } = useAppCommonStore()
const { findCustomPlaylistIndex } = useUserProfileStore()
const { isSimpleLayout, isSearchBarAutoPlaceholderEnable } = storeToRefs(useSettingStore())
const { switchToFallbackLayout } = useSettingStore()


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
    emitEvents("navigation-refreshCustomPlaylistIndex", index)
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
    } else if (toPath.includes('/cloudstorage')) {
        setCloudStorageExploreMode()
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

    const { path } = to
    let index = 0
    if (path.includes('/local')) {
        index = 1
    } else if (path.includes('/setting')) {
        index = 2
        if (path.includes('/modules')) index = 8
        else if (path.includes('/plugins')) index = 9
    } else if (path.includes('/radios')) {
        index = 3
    } else if (path.includes('/themes')) {
        index = 4
    } else if (path.includes('/data/backup')) {
        index = 5
    } else if (path.includes('/data/restore')) {
        index = 6
    } else if (path.includes('/userhome')) {
        index = 7
    }
    const MINUTE = 60000
    setSearchPlaceHolderIndex(index)
    clearTimeout(searchPlaceHolderTimer)
    searchPlaceHolderTimer = setTimeout(() => {
        if (index != 0) setSearchPlaceHolderIndex(0)
    }, MINUTE)

}

const hideRelativeComponents = (to) => {
    hidePlayingView()
    hideVideoPlayingView()
    updateCommonCtxItem(null)
    hideAllCtxMenus()
    hidePopoverHint()

    hideLyricToolbar()
    hideRandomMusicToolbar()
    hideSoundEffectView()
    hidePlayingThemeListView()
}

const createCommonRoute = (route, onRouteReady) => {
    route = route || { path: '/' }
    if (typeof route === 'string') route = { path: route }
    return {
        ...route,
        path: (route.path || route.toPath),
        onRouteReady: (onRouteReady || route.onRouteReady),
        //不完全等价于 router.beforeResovle()
        beforeRoute: (toPath, fromPath) => {
            //hidePlayingView()
            setRouterCtxCacheItem(null)
            hideRelativeComponents()

            if (isSimpleLayout.value) switchToFallbackLayout()
            if (!toPath.includes('/artist/')) hidePlaybackQueueView()
            
            emitEvents('app-beforeRoute', { toPath, fromPath })
        }
    }
}

const transformExploreMode = (exploreMode) => (exploreMode || exploreModeCode.value)
const transformRoute = (route) => ((typeof route == 'object') ? route : { path: toTrimString(route) })

const visitRoute = (route) => {
    return new Promise((resolve, reject) => {
        if (!route) return reject('noRoute')
        route = transformRoute(route)
        const { path: toPath, beforeRoute, onRouteReady, replace, override, rejectOnSame } = route
        if (!toPath) return reject('noRoute')

        //beforeRoute设置后，一般都会执行，除非route不存在
        if (beforeRoute && (typeof beforeRoute == 'function')) beforeRoute(toPath)

        const fromPath = currentRoutePath()
        const isSamePath = (fromPath == toPath)
        if (isSamePath && !replace && !override) {
            return (rejectOnSame && typeof rejectOnSame == 'boolean') 
                && reject('sameRoute')
        }
        //相同且要求覆盖，才进行替换
        if (isSamePath && (override && typeof override == 'boolean')) Object.assign(route, { replace: true })

        //onRouteReady设置后，仅在route有效时执行
        if (onRouteReady && (typeof onRouteReady == 'function')) onRouteReady(toPath)
        pushRoute(route)

        resolve(route)
    })
}

const visitCommonRoute = (route, onRouteReady) => {
    return visitRoute(createCommonRoute(route, onRouteReady))
}

const visitCommonRouteCatchError = (route, onRouteReady, onError) => {
    visitCommonRoute(route, onRouteReady)
        .catch(error => {
            if(onError && typeof onError == 'function') onError(error)
        })
}


const visitNotFound = (to, from) => {
    return visitCommonRoute('/')
}

const refresh = () => {
    const route = currentRoute()
    Object.assign(route, { override: true })
    visitCommonRoute(route)
}

const highlightPlatform = (to) => {
    const { path } = to
    if(path.startsWith('/setting')
        || path.startsWith('/themes')
        || path.startsWith('/plugins')
        || path.startsWith('/data')) {
        return
    } 

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
    } else if (path.startsWith('/cloudstorage')) {
        const parts = path.split('/')
        platform = parts[2]
    } 
    updateCurrentPlatformByCode(platform)
}

const visitUserHome = (onRouteReady, rejectOnSame) => (visitCommonRoute({ path: '/userhome/all', rejectOnSame, onRouteReady } ))

const visitRadio = async (platform) => {
    const toPath = isFreeFM(platform) ? `/radios/${platform}` : `/radios/square/${platform}`
    return visitCommonRouteCatchError(toPath)
}

const valiadateArtistId = (id) => {
    id = id || ''
    return (typeof id == 'string') ? !isBlank(id) : (parseInt(id) > 0)
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
    platform = toTrimString(platform)
    if (visitable) {
        let exploreMode = transformExploreMode()
        exploreMode = exploreMode == 'radios' ? 'playlists' : exploreMode
        const toPath = `/${exploreMode}/artist/${platform}/${id}`
        visitCommonRouteCatchError(toPath, onRouteReady)
        hideAllCtxMenus()
    } else if (isFMRadioPlatform(platform)) {
        visitRadio(platform)
        hideAllCtxMenus()
    }
    if (callback && (typeof callback == 'function')) callback(visitable)
}


const visitAlbumDetail = (platform, id, callback, data) => {
    if (isLocalMusic(platform)) id = data.name || data.title
    const platformValid = isAlbumDetailVisitable(platform)
    const idValid = (typeof id == 'string') ? !isBlank(id) : (id > 0)
    const visitable = platformValid && idValid
    platform = toTrimString(platform)
    id = toTrimString(id)
    if (visitable) {
        let exploreMode = transformExploreMode()
        let moduleName = 'album', isAlbum = true
        if (id.startsWith(Playlist.ANCHOR_RADIO_ID_PREFIX)) {
            exploreMode = (exploreMode == 'userhome') ? 'userhome' : 'radios'
            moduleName = 'playlist'
            isAlbum = false
        } else { //TODO 单一责任
            exploreMode = (exploreMode == 'radios') ? 'playlists' : exploreMode
        }
        const toPath = `/${exploreMode}/${moduleName}/${platform}/${id}`
        visitCommonRouteCatchError(toPath)
        hideAllCtxMenus()
    }
    if (callback && (typeof callback == 'function')) callback(visitable)
}


/* 全局Router设置  */
onBeforeResolve((to, from) => {
    if (isDevEnv()) console.log("[ ROUTE ] ==>>> " + to.path)

    if (to.matched.length < 1) return visitNotFound(to, from)

    autoSwitchExploreMode(to, from)
    highlightPlatform(to)
    highlightNavigationCustomPlaylist(to, from)
    hideRelativeComponents(to)
    autoSwitchSearchPlaceHolder(to)
})

//TODO 世界上没有什么是绝对完美的，没有代码提示是硬伤 ~
provide('appRoute', {
    currentRoute,
    currentRoutePath,
    addHomePath,
    backward,
    forward,
    visitRoute,
    visitCommonRoute,
    refresh,
    visitHome: () => (visitCommonRoute('/')),
    visitThemes: () => (visitCommonRoute('/themes')),
    visitUserHome,
    visitSetting: () => (visitCommonRoute('/setting')),
    visitSearch: (keyword) => (visitCommonRoute(`/search/${keyword}`)),
    visitLocalMusic: () => (visitCommonRoute('/playlists/local')),
    visitPlaylistSquare: (platform) => (visitCommonRoute(`/playlists/square/${platform}`)),
    visitPlaylist: (platform, id, exploreMode, onRouteReady, rejectOnSame) => {
        const noArgMode = !exploreMode
        exploreMode = transformExploreMode(exploreMode)
        if (platform === 'local') {
            return visitCommonRoute(`/${exploreMode}/local/${id}`)
        }
        if (exploreMode != 'radios' && noArgMode) exploreMode = 'playlists'
        return visitCommonRoute({
            path: `/${exploreMode}/playlist/${platform}/${id}`, onRouteReady, rejectOnSame
        })
    },
    visitArtist: ({ platform, item, index, callback, onRouteReady }) => {
        visitArtistDetail({ platform, item, index, callback, onRouteReady })
    },
    visitAlbum: ({ platform, id, callback, data }) => {
        visitAlbumDetail(platform, id, callback, data)
    },
    //类似visitPlaylist，但有些区别
    visitFavoritePlaylist: (platform, id) => {
        let exploreMode = transformExploreMode()
        if (toTrimString(id).startsWith(Playlist.ANCHOR_RADIO_ID_PREFIX)) {
            exploreMode = (exploreMode == 'userhome') ? 'userhome' : 'radios'
        }
        return visitCommonRoute(`/${exploreMode}/playlist/${platform}/${id}`)
    },
    visitCustomPlaylistCreate: (exploreMode, onRouteReady) => {
        exploreMode = transformExploreMode(exploreMode)
        return visitCommonRoute({ path: `/${exploreMode}/custom/create`, override: true, onRouteReady })
    },
    visitCustomPlaylist: (id, exploreMode) => {
        exploreMode = transformExploreMode(exploreMode)
        return visitCommonRoute(`/${exploreMode}/custom/${id}`)
    },
    visitCustomPlaylistEdit: (id, exploreMode) => {
        exploreMode = transformExploreMode(exploreMode)
        return visitCommonRoute({ path: `/${exploreMode}/custom/edit/${id}`, override: true })
    },
    visitBatchCustomPlaylist: (id, exploreMode) => {
        exploreMode = transformExploreMode(exploreMode)
        return visitCommonRoute(`/${exploreMode}/batch/custom/${id}`)
    },
    visitBatchLocalMusic: () => {
        return visitCommonRoute('/playlists/batch/local/0')
    },
    visitBatchLocalPlaylist: (id) => {
        return visitCommonRoute(`/playlists/batch/local/${id}`)
    },
    visitBatchPlaybackQueue: () => {
        return visitCommonRoute('/playlists/batch/playbackQueue/0')
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
        exploreMode = transformExploreMode(exploreMode)
        return visitCommonRoute({ path: `/${exploreMode}/local/create`, override: true })
    },
    visitLocalPlaylistEdit: (id, exploreMode) => {
        exploreMode = transformExploreMode(exploreMode)
        return visitCommonRoute({ path: `/${exploreMode}/local/edit/${id}`, override: true })
    },
    visitFreeFMCreate: (exploreMode) => {
        exploreMode = transformExploreMode(exploreMode)
        return visitCommonRoute({ path: `/${exploreMode}/freefm/create`, override: true })
    },
    visitFreeFMEdit: (id, exploreMode) => {
        exploreMode = transformExploreMode(exploreMode)
        return visitCommonRoute({ path: `/${exploreMode}/freefm/edit/${id}`, override: true })
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
    visitTrack: ({ id, platform, title, cover, artist, album }, onRouteReady) => {
        if(!id || !platform) return
        const exploreMode = transformExploreMode()
        return visitCommonRoute({
            path: `/${exploreMode}/${platform}/track/${id}`,
            //replace: false,   //Vue-Router原生支持选项，但有副作用
            override: true,     //自定义选项
            query: { id, platform, title, cover, artist, album },
            onRouteReady
        })
    },
    visitRecents: () => {
        //实现方式1：通过setTimeout函数延时调用
        //缺点：不确定性，即不同设备性能不一样，路由导航所耗费时间不一样
        //setTimeout(() => emitEvents('userHome-visitRecentsTab'), 66)
        //visitUserHome()

        //实现方式2：路由上下文对象 + 回调
        visitUserHome(() => setRouterCtxCacheItem({ id: 'visitRecents' }), true)
            .catch(error => {
                if (error == 'sameRoute') emitEvents('userHome-visitRecentsTab')
            })
    },
    visitRadio,
    visitPlugins: () => {
        return visitCommonRoute('/plugins')
    },
    visitPluginDetail: (id) => {
        return visitCommonRoute(`/plugins/plugin/${id}`)
    },
    addCustomRoute: (route) => {
        return addRoute('appmain', route)
    },
    visitVideoCreate: () => {
        return visitCommonRoute('/videos/video/create')
    },
    visitVideoDetail: (platform, id, detailUrl, video) => {
        return visitCommonRoute(`/videos/video/${platform}/${id}`, 
            () => setRouterCtxCacheItem({ platform, id, detailUrl, video})
        )
    },
    visitWebDavSessionCreate: () => {
        return visitCommonRoute('/cloudstorage/webdav/create')
    },
    visitWebDavSessionEdit: (id) => {
        return visitCommonRoute(`/cloudstorage/webdav/edit/${id}`)
    },
    visitWebDavSessionDetail: (id) => {
        return visitCommonRoute(`/cloudstorage/webdav/${id}`)
    },
    visitNavidromeSessionCreate: () => {
        return visitCommonRoute('/cloudstorage/navidrome/create')
    },
    visitNavidromeSessionEdit: (id) => {
        return visitCommonRoute(`/cloudstorage/navidrome/edit/${id}`)
    },
    visitNavidromeSessionDetail: (id) => {
        return visitCommonRoute(`/cloudstorage/navidrome/${id}`)
    }
})
</script>

<template>
    <slot></slot>
</template>

<style>
</style>