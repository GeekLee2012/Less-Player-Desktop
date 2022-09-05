import { createRouter,  createWebHashHistory } from 'vue-router';
import PlaylistSquareView from '../views/PlaylistSquareView.vue';
import ArtistSquareView from '../views/ArtistSquareView.vue';
import LocalMusicView from '../views/LocalMusicView.vue';
import SettingView from '../views/SettingView.vue';
import UserHomeView from '../views/UserHomeView.vue';
import SearchView from '../views/SearchView.vue';
import PlaylistDetailView from '../views/PlaylistDetailView.vue';
import ArtistDetailView from '../views/ArtistDetailView.vue';
import AlbumDetailView from '../views/AlbumDetailView.vue';

const routes = [ 
    { //默认
        path: '/', 
        redirect: '/playlists/square/qq'
    },{ //歌单广场
        path: '/playlists/square/:platform', 
        component: PlaylistSquareView 
    },{ //歌手广场
        path: '/artists/square/:platform', 
        component: ArtistSquareView 
    },
    {  //本地歌曲
        path: '/local', 
        component:  LocalMusicView 
    },
    {  //我的主页
        path: '/userhome', 
        component:  UserHomeView 
    },
    {  //设置
        path: '/setting', 
        component:  SettingView 
    },
    {  //搜索
        path: '/search/:keyword', 
        props: true,
        component:  SearchView 
    },
    {  //歌单详情
        path: '/:exploreMode/playlist/:platform/:id',
        props: true, 
        component:  PlaylistDetailView 
    },
    {  //歌手详情
        path: '/:exploreMode/artist/:platform/:id',
        props: true, 
        component:  ArtistDetailView 
    },
    {  //专辑详情
        path: '/:exploreMode/album/:platform/:id',
        props: true, 
        component:  AlbumDetailView 
    },
]

export const router = createRouter({
    //为了简单起见，在这里使用 hash 模式。
    history: createWebHashHistory(),
    routes
})
