import { defineStore } from 'pinia';
import { QQ } from '../../vendor/qq';
import { NetEase } from '../../vendor/netease';
import { KuWo } from '../../vendor/kuwo';
import { KuGou } from '../../vendor/kugou';
import { DouBan } from '../../vendor/douban';
import { RadioCN } from '../../vendor/radiocn';
import { Qingting } from '../../vendor/qingting';
import { LocalMusic } from '../../vendor/localmusic';
import { useAppCommonStore } from './appCommonStore';
import { Ximalaya } from '../../vendor/ximalaya';

//音乐平台
const allPlatforms = [
    { 
        code: 'all',
        name: '全部平台',
        online: null
    }, 
    { 
        code: QQ.CODE,
        name: 'QQ音乐',
        online: true
    }, 
    { 
        code: NetEase.CODE,
        name: '网易云音乐',
        online: true
    }, 
    { 
        code: KuWo.CODE,
        name: '酷我音乐',
        online: true
    }, 
    { 
        code: KuGou.CODE,
        name: '酷狗音乐',
        online: true
    },
    { 
        code: DouBan.CODE,
        name: '豆瓣FM',
        online: true
    },
    { 
        code: RadioCN.CODE,
        name: '央广云听',
        online: true
    },
    { 
        code: Qingting.CODE,
        name: '蜻蜓FM',
        online: true
    },
    { 
        code: Ximalaya.CODE,
        name: '喜马拉雅FM',
        online: true
    },
    { 
        code: LocalMusic.CODE,
        name: '本地歌曲',
        online: false
    }
]

const radioCount = 3
const playlistPlatforms = allPlatforms.slice(1)
playlistPlatforms.splice(5, radioCount)
const artistPlatforms = allPlatforms.slice(1, 5)
const radioPlatforms = [ allPlatforms[2], allPlatforms[6], allPlatforms[7], allPlatforms[8] ]
const userhomePlatforms = allPlatforms.slice(0, allPlatforms.length - 1)
const onlinePlatformFilter = allPlatforms.slice(0, allPlatforms.length - (radioCount + 1))

const venders = {
    qq: QQ, 
    netease: NetEase,
    kuwo: KuWo,
    kugou: KuGou,
    douban: DouBan,
    radiocn: RadioCN,
    qingting: Qingting,
    ximalaya: Ximalaya,
    local: LocalMusic
}

//平台相关Store
export const usePlatformStore = defineStore('platform', {
    //State
    state: () => ({
        currentPlatformIndex: 0,
        venders,
    }),
    //Getters
    getters: {
        platforms() {
            return () => {
                const { isArtistMode, isRadioMode, isUserHomeMode } = useAppCommonStore()
                if(isArtistMode) return artistPlatforms
                if(isRadioMode) return radioPlatforms
                if(isUserHomeMode) return userhomePlatforms
                return playlistPlatforms
            }
        },
        currentPlatform(state) {
            const { exploreMode } = useAppCommonStore()
            return state.platforms(exploreMode)[state.currentPlatformIndex]
        },
        currentPlatformCode(state) {
            return this.currentPlatform ? this.currentPlatform.code : ''
        },
        onlinePlatformsFilter() {
            return onlinePlatformFilter
        },
        isLocal(state) {
            return this.currentPlatformCode === 'local';
        },
        isAll(state) {
            return this.currentPlatformCode === 'all';
        }
    }, 
    //Actions
    actions: {
        updateCurrentPlatform(index) {
            this.currentPlatformIndex = index
        },
        updateCurrentPlatformByCode(code) {
            if(!code || code.trim().length < 1) {
                this.updateCurrentPlatform(-1)
                return
            }
            const { exploreMode } = useAppCommonStore()
            const pms = this.platforms(exploreMode)
            for(var i = 0; i < pms.length; i++) {
                if(code === pms[i].code) {
                    this.updateCurrentPlatform(i)
                    return
                }
            }
            this.updateCurrentPlatform(-1)
        },
        getVender(name) {
            name = name.toLowerCase().trim()
            return this.venders[name]
        },
        currentVender() {
            return this.getVender(this.currentPlatformCode)
        },
        isQQ(platform) {
            if(!this.isPlatformValid(platform)) return false
            return platform.trim() == QQ.CODE
        },
        isNetEase(platform) {
            if(!this.isPlatformValid(platform)) return false
            return platform.trim() == NetEase.CODE
        },
        isKuWo(platform) {
            if(!this.isPlatformValid(platform)) return false
            return platform.trim() == KuWo.CODE
        },
        isKuGou(platform) {
            if(!this.isPlatformValid(platform)) return false
            return platform.trim() == KuGou.CODE
        },
        isDouBan(platform) {
            if(!this.isPlatformValid(platform)) return false
            return platform.trim() == DouBan.CODE
        },
        isLocalMusic(platform) {
            if(!this.isPlatformValid(platform)) return false
            return platform.trim() == LocalMusic.CODE
        },
        isArtistDetailVisitable(platform) {
            if(!this.isPlatformValid(platform)) return false
            return !this.isLocalMusic(platform)
        },
        isAlbumDetailVisitable(platform) {
            if(!this.isPlatformValid(platform)) return false
            return !this.isDouBan(platform) || !this.isLocal(platform)
        },
        isPlatformValid(platform) {
            return platform && platform.trim().length > 0
        }
    }
})