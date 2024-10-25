import { reactive } from 'vue';
import { createRouter, createWebHashHistory, useRouter } from 'vue-router';
import AppMain from '../AppMain.vue';
import HomePageView from '../views/HomePageView.vue';
import PlaylistSquareView from '../views/PlaylistSquareView.vue';
import ArtistSquareView from '../views/ArtistSquareView.vue';
import RadioSquareView from '../views/RadioSquareView.vue';
import LocalMusicView from '../views/LocalMusicView.vue';
import ThemesView from '../views/ThemesView.vue';
import SettingView from '../views/SettingView.vue';
import UserHomeView from '../views/UserHomeView.vue';
import SearchView from '../views/SearchView.vue';
import PlaylistDetailView from '../views/PlaylistDetailView.vue';
import ArtistDetailView from '../views/ArtistDetailView.vue';
import AlbumDetailView from '../views/AlbumDetailView.vue';
import CustomPlaylistEditView from '../views/CustomPlaylistEditView.vue';
import CustomPlaylistDetailView from '../views/CustomPlaylistDetailView.vue';
import UserInfoEditView from '../views/UserInfoEditView.vue';
import BatchActionView from '../views/BatchActionView.vue';
import DataBackupView from '../views/DataBackupView.vue';
import DataRestoreView from '../views/DataRestoreView.vue';
import LocalPlaylistEditView from '../views/LocalPlaylistEditView.vue';
import LocalPlaylistDetailView from '../views/LocalPlaylistDetailView.vue';
import FreeFMView from '../views/FreeFMView.vue';
import FreeFMEditView from '../views/FreeFMEditView.vue';
import ModulesSettingView from '../views/ModulesSettingView.vue';
import FreeVideoEditView from '../views/FreeVideoEditView.vue';
import TrackDetailView from '../views/TrackDetailView.vue';
import PluginsView from '../views/PluginsView.vue';
import PluginDetailView from '../views/PluginDetailView.vue';
import AppDesktopLyric from '../AppDesktopLyric.vue';
import VideoDetailView from '../views/VideoDetailView.vue';
import WebDavView from '../views/WebDavView.vue';
import WebDavSessionEditView from '../views/WebDavSessionEditView.vue';
import WebDavSessionDetailView from '../views/WebDavSessionDetailView.vue';
import NavidromeView from '../views/NavidromeView.vue';
import NavidromeSessionEditView from '../views/NavidromeSessionEditView.vue';
import NavidromeSessionDetailView from '../views/NavidromeSessionDetailView.vue';
import JellyfinView from '../views/JellyfinView.vue';
import JellyfinSessionEditView from '../views/JellyfinSessionEditView.vue';
import JellyfinSessionDetailView from '../views/JellyfinSessionDetailView.vue';
import GenreDetailView from '../views/GenreDetailView.vue';
import EmbyView from '../views/EmbyView.vue';
import EmbySessionEditView from '../views/EmbySessionEditView.vue';
import EmbySessionDetailView from '../views/EmbySessionDetailView.vue';



const routes = [
    { //默认
        path: '/',
        name: 'appmain',
        component: AppMain,
        children: [
            {
                path: '/',
                //name: 'homepage',
                component: HomePageView
            },
            { //歌单广场
                path: '/playlists/square/:platform',
                component: PlaylistSquareView
            }, { //歌手广场
                path: '/artists/square/:platform',
                component: ArtistSquareView
            }, { //电台广场
                path: '/radios/square/:platform',
                component: RadioSquareView
            },
            {  //分类歌单 - 本地歌曲
                path: '/playlists/local',
                component: LocalMusicView
            },
            {  //万千歌手 - 本地歌曲
                path: '/artists/local',
                component: ArtistSquareView
            },
            {  //主题
                path: '/themes',
                component: ThemesView
            },
            {  //我的主页
                path: '/userhome/:platform',
                component: UserHomeView
            },
            {  //设置
                path: '/setting',
                component: SettingView
            },
            {  //搜索
                path: '/search/:keyword',
                props: true,
                component: SearchView
            },
            {  //歌单详情
                path: '/:exploreMode/playlist/:platform/:id',
                props: true,
                component: PlaylistDetailView
            },
            {  //歌手详情
                path: '/:exploreMode/artist/:platform/:id',
                props: true,
                component: ArtistDetailView
            },
            {  //专辑详情
                path: '/:exploreMode/album/:platform/:id',
                props: true,
                component: AlbumDetailView
            },
            {  //歌曲详情
                path: '/:exploreMode/:platform/track/:id',
                component: TrackDetailView,
                props: route => ({ ...route.query })
            },
            {  //我的主页 - 用户信息 - 编辑
                path: '/userhome/user/edit',
                component: UserInfoEditView
            },
            {  //我的主页 - 自建歌单
                path: '/:exploreMode/custom/create',
                props: true,
                component: CustomPlaylistEditView
            },
            {  //我的主页 - 自建歌单 - 编辑
                path: '/:exploreMode/custom/edit/:id',
                props: true,
                component: CustomPlaylistEditView
            },
            {  //我的主页 - 自建歌单 - 详情
                path: '/:exploreMode/custom/:id',
                props: true,
                component: CustomPlaylistDetailView
            },
            {  //批量操作
                path: '/:exploreMode/batch/:source/:id',
                props: true,
                component: BatchActionView
            },
            {  //数据备份
                path: '/data/backup',
                component: DataBackupView
            },
            {  //数据还原
                path: '/data/restore',
                component: DataRestoreView
            },
            {  //分类歌单 - 本地歌曲 - 自建歌单
                path: '/:exploreMode/local/create',
                props: true,
                component: LocalPlaylistEditView
            },
            {  //分类歌单 - 本地歌曲 - 自建歌单 - 编辑
                path: '/:exploreMode/local/edit/:id',
                props: true,
                component: LocalPlaylistEditView
            },
            {  //分类歌单 - 自建本地歌单 - 详情
                path: '/:exploreMode/local/:id',
                props: true,
                component: LocalPlaylistDetailView
            },
            {  //相约电波 - 自由FM
                path: '/:exploreMode/freefm',
                component: FreeFMView
            },
            {  //相约电波 - 自由FM - 创建FM电台
                path: '/:exploreMode/freefm/create',
                props: true,
                component: FreeFMEditView
            },
            {  //相约电波 - 自由FM - 编辑FM电台
                path: '/:exploreMode/freefm/edit/:id',
                props: true,
                component: FreeFMEditView
            },
            {  //设置 - 功能管理
                path: '/setting/modules',
                component: ModulesSettingView
            },
            {  //视频 - 创建播放源
                path: '/videos/video/create',
                component: FreeVideoEditView
            },
            {  //设置 - 插件管理（音源等）
                path: '/plugins',
                component: PluginsView
            },
            {  //插件管理 - 插件详情
                path: '/plugins/plugin/:id',
                props: true,
                component: PluginDetailView
            },
            {  //视频 - 视频详情
                path: '/videos/video/:platform/:id',
                props: true,
                component: VideoDetailView
            },
            {  //网络存储 - WebDAV
                path: '/cloudstorage/webdav',
                component: WebDavView
            },
            {  //网络存储 - WebDAV - 创建会话
                path: '/cloudstorage/webdav/create',
                props: true,
                component: WebDavSessionEditView
            },
            {  //网络存储 - WebDAV - 编辑会话
                path: '/cloudstorage/webdav/edit/:id',
                props: true,
                component: WebDavSessionEditView
            },
            {  //网络存储 - WebDAV - 会话详情
                path: '/cloudstorage/webdav/:id',
                props: true,
                component: WebDavSessionDetailView
            },
            {  //网络存储 - Navidrome
                path: '/cloudstorage/navidrome',
                component: NavidromeView
            },
            {  //网络存储 - Navidrome - 创建会话
                path: '/cloudstorage/navidrome/create',
                props: true,
                component: NavidromeSessionEditView
            },
            {  //网络存储 - Navidrome - 编辑会话
                path: '/cloudstorage/navidrome/edit/:id',
                props: true,
                component: NavidromeSessionEditView
            },
            {  //网络存储 - Navidrome - 会话详情
                path: '/cloudstorage/navidrome/:id',
                props: true,
                component: NavidromeSessionDetailView
            },
            {  //网络存储 - Jellyfin
                path: '/cloudstorage/jellyfin',
                component: JellyfinView
            },
            {  //网络存储 - Jellyfin - 创建会话
                path: '/cloudstorage/jellyfin/create',
                props: true,
                component: JellyfinSessionEditView
            },
            {  //网络存储 - Jellyfin - 编辑会话
                path: '/cloudstorage/jellyfin/edit/:id',
                props: true,
                component: JellyfinSessionEditView
            },
            {  //网络存储 - Jellyfin - 会话详情
                path: '/cloudstorage/jellyfin/:id',
                props: true,
                component: JellyfinSessionDetailView
            },
            {  //流派详情
                path: '/:exploreMode/:platform/genre/:id',
                props: true,
                component: GenreDetailView
            },
            {  //网络存储 - Emby
                path: '/cloudstorage/emby',
                component: EmbyView
            },
            {  //网络存储 - Emby - 创建会话
                path: '/cloudstorage/emby/create',
                props: true,
                component: EmbySessionEditView
            },
            {  //网络存储 - Emby - 编辑会话
                path: '/cloudstorage/emby/edit/:id',
                props: true,
                component: EmbySessionEditView
            },
            {  //网络存储 - Emby - 会话详情
                path: '/cloudstorage/emby/:id',
                props: true,
                component: EmbySessionDetailView
            },
        ]
    },
    {
        path: '/desktopLyric',
        component: AppDesktopLyric
    }
]

export const router = createRouter({
    //为了简单起见，在这里使用 hash 模式。
    history: createWebHashHistory(),
    routes
})

export const onBeforeResolve = (callback) => {
    if(!callback || typeof callback != 'function') return 
    router.beforeResolve(callback)
}

export const currentRoute = () => (router.currentRoute.value)

export const currentRoutePath = () => (currentRoute().path || '')

const homePaths = ['/']
export const addHomePath = (path) => {
    const index = homePaths.findIndex(item => (item == path))
    if(index == -1) homePaths.push(path)
}

const isBackable = () => {
    const currentPath = currentRoutePath()
    for(const path of homePaths) if(path == currentPath) return false
    return true
}

export const backward = () => (isBackable() && router.back())

export const forward = () => router.forward()

export const addRoute = (route) => router.addRoute(route)

export const pushRoute = (route) => router.push(route)
