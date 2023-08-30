import { createRouter, createWebHashHistory } from 'vue-router';
import AppContent from '../AppContent.vue';
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
import AppDesktopLyric from '../AppDesktopLyric.vue';



const routes = [
    { //默认
        path: '/',
        //redirect: '/playlists/square/qq'
        component: AppMain,
        children: [
            {
                path: '/',
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
            {  //本地歌曲
                path: '/:exploreMode/local',
                component: LocalMusicView
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
                path: '/:exploreMode/:platform/track',
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
            }
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