import { defineStore } from 'pinia';
import { LocalMusic } from '../../vendor/localmusic';
import { FreeFM } from '../../vendor/freefm';
import { useAppCommonStore } from './appCommonStore';
import { isBlank, toLowerCaseTrimString, toTrimString } from '../../common/Utils';
import { useSettingStore } from './settingStore';



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
    text: '共0首歌曲',
    ctext: '已选择0首歌曲',
    stext: '约找到0首歌曲',
}, {
    code: 'hot-songs',
    name: '热门歌曲',
    text: '共0首歌曲',
    ctext: '已选择0首歌曲',
    stext: '约找到0首歌曲',
}, {
    code: 'albums',
    name: '专辑',
    text: '共0张专辑',
    ctext: '已选0张专辑',
    stext: '约找到0张专辑',
}, {
    code: 'videos',
    name: '视频',
    text: '共0个视频',
    ctext: '已选0个视频',
    stext: '约找到0个视频',
}, {
    code: 'about',
    name: '详情',
    text: '',
    ctext: '',
    stext: '',
}, {
    code: 'playlists',
    name: '歌单',
    text: '共0个歌单',
    ctext: '已选0个歌单',
    stext: '约找到0个歌单',
}, {
    code: 'artists',
    name: '歌手',
    text: '共0个歌手',
    ctext: '已选0个歌手',
    stext: '约找到0个歌手',
}, {
    code: 'fm-radios',
    name: 'FM电台',
    text: '共0个电台',
    ctext: '已选0个电台',
    stext: '约找到0个电台',
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
        types: null
    },
    {
        code: LocalMusic.CODE,
        vendor: LocalMusic,
        name: '本地歌曲',
        shortName: 'LO',
        online: false,
        types: ['playlists', 'artists'],
        scopes: ['playlists', 'artists', 'search'],
        artistTabs: [ 'all-songs', 'about' ],
        searchTabs: [ 'all-songs', 'playlists', 'albums', 'artists' ],
    },
    {
        code: FreeFM.CODE,
        vendor: FreeFM,
        name: '自由FM',
        shortName: 'FREE',
        online: true,
        types: ['fm-radios'],
        scopes: ['radios', 'userhome'],
        weight: 5
    }
    /*{
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
                const { isArtistMode, isRadioMode, isUserHomeMode } = useAppCommonStore()
                if (isArtistMode) {
                    return this.getScopePlatforms('artists')
                } else if (isRadioMode) {
                    return this.getScopePlatforms('radios')
                } else if (isUserHomeMode) {
                    return this.getScopePlatforms('userhome')
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
            if (!code || code.trim().length < 1) {
                this.updateCurrentPlatform(-1)
                return
            }
            const platformArr = this.activePlatforms()
            for (var i = 0; i < platformArr.length; i++) {
                if (code === platformArr[i].code) {
                    this.updateCurrentPlatform(i)
                    return
                }
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
        assertsPlatform(code, refCode) {
            if (!this.isPlatformValid(code)) return false
            return toTrimString(code) == refCode
        },
        isLocalMusic(code) {
            return this.assertsPlatform(code, LocalMusic.CODE)
        },
        isFreeFM(code) {
            return this.assertsPlatform(code, FreeFM.CODE)
        },
        isFMRadioPlatform(code) {
            const platform = this.getPlatform(code)
            return platform && platform.types && platform.types.includes('fm-radios')
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
            return type === 'playlists'
        },
        isArtistType(type) {
            return type === 'artists'
        },
        isAlbumType(type) {
            return type === 'albums'
        },
        isAnchorRadioType(type) {
            return type === 'anchor-radios'
        },
        isFMRadioType(type) {
            return type === 'fm-radios'
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
            return toLowerCaseTrimString(code) === 'all-songs'
        },
        isHotSongsTab(code) {
            return toLowerCaseTrimString(code) === 'hot-songs'
        },
        isPlaylistsTab(code) {
            return toLowerCaseTrimString(code) === 'playlists'
        },
        isAlbumsTab(code) {
            return toLowerCaseTrimString(code) === 'albums'
        },
        isArtistsTab(code) {
            return toLowerCaseTrimString(code) === 'artists'
        },
        isVideosTab(code) {
            return toLowerCaseTrimString(code) === 'videos'
        },
        isAboutTab(code) {
            return toLowerCaseTrimString(code) === 'about'
        },
        isFMRadiosTab(code) {
            return toLowerCaseTrimString(code) === 'fm-radios'
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
        }
    }
})