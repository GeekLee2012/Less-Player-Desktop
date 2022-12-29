import { createRouter, createWebHashHistory } from 'vue-router';
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



const routes = [
    { //默认
        path: '/',
        redirect: '/playlists/square/qq'
    }, { //歌单广场
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
        path: '/local',
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
    {  //我的主页 - 用户信息 - 编辑
        path: '/userhome/user/edit',
        component: UserInfoEditView
    },
    {  //我的主页 - 自建歌单
        path: '/:exploreMode/customPlaylist/create',
        props: true,
        component: CustomPlaylistEditView
    },
    {  //我的主页 - 自建歌单 - 编辑
        path: '/:exploreMode/customPlaylist/edit/:id',
        props: true,
        component: CustomPlaylistEditView
    },
    {  //我的主页 - 自建歌单 - 详情
        path: '/:exploreMode/customPlaylist/:id',
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
]

export const router = createRouter({
    //为了简单起见，在这里使用 hash 模式。
    history: createWebHashHistory(),
    routes
})