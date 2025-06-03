import { defineStore } from 'pinia';
import { LocalMusic } from '../../vendor/localmusic';
import { FreeFM } from '../../vendor/freefm';
import { useAppCommonStore } from './appCommonStore';
import { isBlank, toLowerCaseTrimString, toTrimString, stringEqualsIgnoreCase } from '../../common/Utils';
import { useSettingStore } from './settingStore';
import { WebDav } from '../../vendor/webdav';
import { Navidrome } from '../../vendor/navidrome';
import { Jellyfin } from '../../vendor/jellyfin';
import { Emby } from '../../vendor/emby';



//内置类型
//weight权重，范围：1 - 10
const PRESET_TYPES = [{
    code: 'songs',
    name: '歌曲',
    weight: 5
}, {
    code: 'playlists',
    name: '歌单',
    weight: 8,    //包括歌单电台
}, {
    code: 'artists',
    name: '歌手',
    weight: 6
}, {
    code: 'albums',
    name: '专辑',
    weight: 5
}, {
    code: 'fm-radios',
    name: '广播电台',
    weight: 4
}, {
    code: 'anchor-radios',
    name: '主播电台',
    weight: 3
}]

//内置Tab信息
const PRESET_TABS = [{
    code: 'all-songs',
    name: '歌曲',
    text: '0首歌曲',
    ctext: '已选择0首歌曲',
    stext: '约0首歌曲',
}, {
    code: 'hot-songs',
    name: '热门歌曲',
    text: '0首歌曲',
    ctext: '已选择0首歌曲',
    stext: '约0首歌曲',
}, {
    code: 'albums',
    name: '专辑',
    text: '0张专辑',
    ctext: '已选0张专辑',
    stext: '约0张专辑',
}, {
    code: 'videos',
    name: '视频',
    text: '0个视频',
    ctext: '已选0个视频',
    stext: '约0个视频',
}, {
    code: 'lyrics',
    name: '歌词',
    text: '0首歌词',
    ctext: '已选0首歌词',
    stext: '约0首歌词',
}, {
    code: 'about',
    name: '详情',
    text: '',
    ctext: '',
    stext: '',
}, {
    code: 'playlists',
    name: '歌单',
    text: '0个歌单',
    ctext: '已选0个歌单',
    stext: '约0个歌单',
}, {
    code: 'artists',
    name: '歌手',
    text: '0个歌手',
    ctext: '已选0个歌手',
    stext: '约0个歌手',
}, {
    code: 'fm-radios',
    name: 'FM电台',
    text: '0个电台',
    ctext: '已选0个电台',
    stext: '约0个电台',
}, {
    code: 'genres',
    name: '流派',
    text: '0个流派',
    ctext: '已选0个流派',
    stext: '约0个流派',
}, {
    code: 'folders',
    name: '目录',
    text: '0个目录',
    ctext: '已选0个目录',
    stext: '约0个目录',
}, {
    code: 'suggestions',
    name: '推荐',
    text: '',
    ctext: '',
    stext: '',
}]


//内置平台
const PRESET_PLATFORMS = [
    {
        code: 'all',
        vendor: null,
        name: '全部平台',
        shortName: 'ALL',
        online: null,
        scopes: ['userhome'],
        types: null,
        weight: 999,
    },
    {
        code: LocalMusic.CODE,
        vendor: LocalMusic,
        name: '本地歌曲',
        shortName: 'LO',
        online: false,
        types: ['playlists', 'artists'],
        scopes: ['playlists', 'artists', 'search', 'resource-search'],
        artistTabs: [ 'all-songs', 'about' ],
        searchTabs: [ 'all-songs', 'playlists', 'albums', 'artists' ],
        weight: 666,
    },
    {
        code: FreeFM.CODE,
        vendor: FreeFM,
        name: '自由FM',
        shortName: 'FREE',
        online: true,
        types: ['fm-radios'],
        scopes: ['radios', 'userhome'],
        weight: 666,
    },
    {
        code: WebDav.CODE,
        vendor: WebDav,
        name: 'WebDAV',
        shortName: 'DAV',
        online: true,
        types: ['playlists', 'videos'],
        scopes: ['cloudstorage'],
        weight: 3,
    },
    {
        code: Emby.CODE,
        vendor: Emby,
        name: 'Emby',
        shortName: 'EMB',
        online: true,
        types: ['playlists', 'albums', 'artists', 'videos'],
        scopes: ['cloudstorage'],
        artistTabs: [ 'albums','about' ],
        //searchTabs: [ 'all-songs', 'playlists', 'albums', 'artists', 'videos' ],
        weight: 3,
    },
    {
        code: Jellyfin.CODE,
        vendor: Jellyfin,
        name: 'Jellyfin',
        shortName: 'JEF',
        online: true,
        types: ['playlists', 'albums', 'artists', 'videos'],
        scopes: ['cloudstorage'],
        artistTabs: [ 'albums','about' ],
        //searchTabs: [ 'all-songs', 'playlists', 'albums', 'artists', 'videos' ],
        weight: 3,
    },
    {
        code: Navidrome.CODE,
        vendor: Navidrome,
        name: 'Navidrome',
        shortName: 'NVD',
        online: true,
        types: ['playlists', 'albums', 'artists', 'videos'],
        scopes: ['cloudstorage'],
        artistTabs: [ 'hot-songs', 'albums','about' ],
        //searchTabs: [ 'all-songs', 'playlists', 'albums', 'artists', 'videos' ],
        weight: 3,
    },
    /* {
        code: QQ.CODE,
        vendor: QQ,
        name: 'QQ音乐',
        shortName: 'QQ',
        online: true,
        types: ['playlists', 'artists', 'albums', 'videos'],
        scopes: ['playlists', 'artists', 'albums', 'search', 'userhome', 'random', 'united'],
        artistTabs: [ 'hot-songs', 'albums','about' ],
        searchTabs: [ 'all-songs', 'playlists', 'albums', 'artists', 'videos' ],
        weight: 8
    },
    {
        code: NetEase.CODE,
        vendor: NetEase,
        name: '网易云音乐',
        shortName: 'WY',
        online: true,
        types: ['playlists', 'artists', 'albums', 'anchor-radios', 'videos'],
        scopes: ['playlists', 'artists', 'albums', 'radios', 'search', 'userhome', 'random', 'united'],
        artistTabs: [ 'hot-songs', 'albums','about' ],
        searchTabs: [ 'all-songs', 'playlists', 'albums', 'artists', 'videos' ],
        weight: 8
    },
    {
        code: KuWo.CODE,
        vendor: KuWo,
        name: '酷我音乐',
        shortName: 'KW',
        online: true,
        types: ['playlists', 'artists', 'albums', 'videos'],
        scopes: ['playlists', 'artists', 'albums', 'search', 'userhome', 'random', 'united'],
        artistTabs: [ 'all-songs', 'albums','about' ],
        searchTabs: [ 'all-songs', 'playlists', 'albums', 'artists', 'videos' ],
        weight: 8
    },
    {
        code: KuGou.CODE,
        vendor: KuGou,
        name: '酷狗音乐',
        shortName: 'KG',
        online: true,
        types: ['playlists', 'artists', 'albums'],
        scopes: ['playlists', 'artists', 'albums', 'search', 'userhome', 'random', 'united'],
        artistTabs: [ 'all-songs', 'albums','about' ],
        searchTabs: [ 'all-songs', 'playlists', 'albums', 'videos' ],
        weight: 8
    },
    {
        code: DouBan.CODE,
        vendor: DouBan,
        name: '豆瓣FM',
        shortName: 'DB',
        online: true,
        types: ['playlists', 'albums'],
        scopes: ['playlists', 'userhome', 'random'],
        artistTabs: [ 'all-songs', 'albums','about' ],
        weight: 8
    },
    {
        code: RadioCN.CODE,
        vendor: RadioCN,
        name: '央广云听',
        shortName: 'YT',
        online: true,
        //types: ['fm-radios', 'anchor-radios'],
        types: ['fm-radios'],
        scopes: ['radios', 'userhome', 'random'],
        weight: 5
    },
    {
        code: Qingting.CODE,
        vendor: Qingting,
        name: '蜻蜓FM',
        shortName: 'QT',
        online: true,
        types: ['anchor-radios'],
        scopes: ['radios', 'userhome', 'random'],
        weight: 5
    },
    {
        code: Ximalaya.CODE,
        vendor: Ximalaya,
        name: '喜马拉雅FM',
        shortName: 'XMLY',
        online: true,
        types: ['fm-radios'],
        scopes: ['radios', 'userhome', 'random'],
        weight: 5
    } */
]

//平台相关Store
export const usePlatformStore = defineStore('platforms', {
    //State
    state: () => ({
        currentPlatformIndex: 0,
        allPlatforms: [...PRESET_PLATFORMS]
    }),
    //Getters
    getters: {
        platforms() { //根据使用范围获取平台
            return (scope) => {
                const result = this.getScopePlatforms(scope)
                if (result) return result

                //缺少范围或不匹配，按模式获取
                const { isArtistMode, isRadioMode, 
                    isUserHomeMode, isCloudStorageMode } = useAppCommonStore()
                if (isArtistMode) {
                    return this.getScopePlatforms('artists')
                } else if (isRadioMode) {
                    return this.getScopePlatforms('radios')
                } else if (isUserHomeMode) {
                    return this.getScopePlatforms('userhome')
                } else if (isCloudStorageMode) {
                    return this.getScopePlatforms('cloudstorage')
                }
                return this.getScopePlatforms('playlists')
            }
        },
        activePlatforms() {
            return (scope) => {
                const { filterActiveModulesPlatforms } = useSettingStore()
                const { exploreModeCode } = useAppCommonStore()
                return filterActiveModulesPlatforms(this.platforms(scope), scope || exploreModeCode)
            }
        },
        currentPlatform() {
            return this.activePlatforms()[this.currentPlatformIndex]
        },
        currentPlatformCode() {
            return this.currentPlatform ? this.currentPlatform.code : ''
        },
        randomMusicTypes() {
            return PRESET_TYPES.filter(item => (item.code != 'songs'))
        },
    },
    //Actions
    actions: {
        findPlatformIndex(code){
            return this.allPlatforms.findIndex(item => (item.code == toLowerCaseTrimString(code)))
        },
        getPlatform(code){
            const index = this.findPlatformIndex(code)
            return this.allPlatforms[index]
        },
        getScopePlatforms(scope){
            scope = toLowerCaseTrimString(scope)
            return scope && this.allPlatforms.filter(item => (item.scopes && item.scopes.includes(scope)))
        },
        updateCurrentPlatform(index) {
            this.currentPlatformIndex = index
        },
        updateCurrentPlatformByCode(code) {
            if (!code || code.trim().length < 1) return this.updateCurrentPlatform(-1)
            const platformArr = this.activePlatforms()
            for (var i = 0; i < platformArr.length; i++) {
                if (code === platformArr[i].code) return this.updateCurrentPlatform(i)
            }
            this.updateCurrentPlatform(-1)
        },
        getVendor(code) {
            const platform = this.getPlatform(code)
            return platform && platform.vendor
        },
        currentVender() {
            return this.getVendor(this.currentPlatformCode)
        },
        getPresetVendor(scopes) {
            if(!scopes || scopes.length < 1) return 
            for(let i = 0; i < scopes.length; i++) {
                const scope = scopes[i]
                if(scope == WebDav.CODE) return WebDav
            }
        },
        assertsPlatform(code, refCode) {
            if (!this.isPlatformValid(code)) return false
            return stringEqualsIgnoreCase(code, refCode)
        },
        isLocalMusic(code) {
            return this.assertsPlatform(code, LocalMusic.CODE)
        },
        isWebDav(code) {
            return this.assertsPlatform(code, WebDav.CODE)
        },
        isNavidrome(code) {
            return this.assertsPlatform(code, Navidrome.CODE)
        },
        isJellyfin(code) {
            return this.assertsPlatform(code, Jellyfin.CODE)
        },
        isEmby(code) {
            return this.assertsPlatform(code, Emby.CODE)
        },
        isCloudStorage(code) {
            return this.isWebDav(code) 
                || this.isNavidrome(code) 
                || this.isJellyfin(code)
                || this.isEmby(code)
        },
        isFreeFM(code) {
            return this.assertsPlatform(code, FreeFM.CODE)
        },
        isFMRadioPlatform(code) {
            const platform = this.getPlatform(code)
            return platform && platform.types 
                && platform.types.includes('fm-radios')
        },
        isTrackRemovablePlatform(code) {
            return !(this.isLocalMusic(code)
                || this.isFMRadioPlatform(code)
                || this.isWebDav(code)
                || this.isCloudStorage(code)
                || this.isFreeFM(code))
        },
        isArtistDetailVisitable(code) {
            return this.isPlatformValid(code)
        },
        isAlbumDetailVisitable(code) {
            if(this.isFMRadioPlatform(code)) return false
            return this.isPlatformValid(code)
        },
        isPlatformValid(code) {
            return !isBlank(code)
        },
        isPlaylistType(type) {
            return stringEqualsIgnoreCase(type, 'playlists')
        },
        isArtistType(type) {
            return stringEqualsIgnoreCase(type, 'artists')
        },
        isAlbumType(type) {
            return stringEqualsIgnoreCase(type, 'albums')
        },
        isAnchorRadioType(type) {
            return stringEqualsIgnoreCase(type, 'anchor-radios')
        },
        isFMRadioType(type) {
            return stringEqualsIgnoreCase(type, 'fm-radios')
        },
        getPlatformName(code) {
            const platform = this.getPlatform(code)
            return platform ? platform.name : null
        },
        getPlatformShortName(code) {
            const platform = this.getPlatform(code)
            return platform ? platform.shortName : null
        },
        addPlatform(platform) {
            if(!platform) return 
            const { code, vendor, name, shortName, online, types, scopes, weight } = platform
            const _code = toLowerCaseTrimString(code)
            if(!_code) return
            const index = this.findPlatformIndex(_code)
            if(index > -1) return
            if(!vendor || typeof vendor == 'string') {
                const _scopes = vendor ? [vendor] : scopes
                const presetVendor = this.getPresetVendor(_scopes)
                if(presetVendor) Object.assign(platform, { vendor: presetVendor })
            }
            
            this.allPlatforms.push({ ...platform, code: _code })
        },
        removePlatform(code) {
            code = toLowerCaseTrimString(code)
            if(!code) return
            const index = this.findPlatformIndex(code)
            if(index < 0) return
            //内置平台不允许删除
            if(PRESET_PLATFORMS.findIndex(item => item.code == code) > -1) return 
            this.allPlatforms.splice(index, 1)
        },
        isAllSongsTab(code) {
            return stringEqualsIgnoreCase(code, 'all-songs')
        },
        isHotSongsTab(code) {
            return stringEqualsIgnoreCase(code, 'hot-songs')
        },
        isPlaylistsTab(code) {
            return stringEqualsIgnoreCase(code, 'playlists')
        },
        isAlbumsTab(code) {
            return stringEqualsIgnoreCase(code, 'albums')
        },
        isArtistsTab(code) {
            return stringEqualsIgnoreCase(code, 'artists')
        },
        isVideosTab(code) {
            return stringEqualsIgnoreCase(code, 'videos')
        },
        isLyricsTab(code) {
            return stringEqualsIgnoreCase(code, 'lyrics')
        },
        isAboutTab(code) {
            return stringEqualsIgnoreCase(code, 'about')
        },
        isFMRadiosTab(code) {
            return stringEqualsIgnoreCase(code, 'fm-radios')
        },
        isGenresTab(code) {
            return stringEqualsIgnoreCase(code, 'genres')
        },
        isFoldersTab(code) {
            return stringEqualsIgnoreCase(code, 'folders')
        },
        isSuggestionsTab(code) {
            return stringEqualsIgnoreCase(code, 'suggestions')
        },
        getPlatformTab(code) {
            code = toLowerCaseTrimString(code)
            for(var i = 0; i < PRESET_TABS.length; i++) {
                if(PRESET_TABS[i].code == code) return PRESET_TABS[i]
            }
        },
        getPlatformTabs(...codes) {
            const tabs = []
            if(codes && codes.length > 0)
            codes.forEach(code => {
                const tab = this.getPlatformTab(toLowerCaseTrimString(code))
                if(tab) tabs.push(tab)
            })
            return tabs
        },
        getArtistTabs(code) {
            const platform = this.getPlatform(code)
            if(!platform) return 
            const { artistTabs } = platform
            if(!artistTabs || artistTabs.length < 1) return
            const tabs = []
            artistTabs.forEach(tcode => {
                const tab = this.getPlatformTab(tcode)
                if(tab) tabs.push(tab) 
            })
            return tabs
        },
        getAlbumTabs(code) {
            return this.getPlatformTabs('all-songs', 'about')
        },
        getSearchTabs(code) {
            const platform = this.getPlatform(code)
            if(!platform) return 
            const { searchTabs } = platform
            if(!searchTabs || searchTabs.length < 1) return
            const tabs = []
            searchTabs.forEach(tcode => {
                const tab = this.getPlatformTab(tcode)
                if(tab) tabs.push(tab)
            })
            return tabs
        },
        getPreferTypeTabs() {
            return this.getPlatformTabs('all-songs', 'playlists', 'albums', 'fm-radios')
        },
        getNavidromeTypeTabs() {
            return this.getPlatformTabs('albums', 'artists', 'playlists', 'all-songs','fm-radios')
        },
        getJellyfinTypeTabs() {
            return this.getPlatformTabs('albums', 'artists', 'playlists', 'all-songs', 'genres')
        },
        getEmbyTypeTabs() {
            return this.getPlatformTabs('suggestions', 'albums', 'artists', 'all-songs', 'genres', 'folders')
        },
        getGenreTypeTabs() {
            return this.getPlatformTabs('albums', 'artists', 'all-songs')
        },
    }
})