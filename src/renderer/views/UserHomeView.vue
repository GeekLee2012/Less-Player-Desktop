<script setup>
import { storeToRefs } from 'pinia';
import { onMounted, onActivated ,ref, shallowRef, watch, reactive } from 'vue';
import AlbumListControl from '../components/AlbumListControl.vue';
import PlayAddAllBtn from '../components/PlayAddAllBtn.vue';
import SongListControl from '../components/SongListControl.vue';
import { useUserProfileStore } from '../store/userProfileStore';
import { usePlatformStore } from '../store/platformStore';
import { usePlayStore } from '../store/playStore';
import { useMainViewStore } from '../store/mainViewStore';
import DeleteAllBtn from '../components/DeleteAllBtn.vue';
import EventBus from '../../common/EventBus';
import CreatePlaylistBtn from '../components/CreatePlaylistBtn.vue';
import PlaylistsControl from '../components/PlaylistsControl.vue';
import { useRouter } from 'vue-router';
import CustomPlaylistListControl from '../components/CustomPlaylistListControl.vue';
import ArtistListControl from '../components/ArtistListControl.vue';

const tabs = [ {
        code: 'favourites',
        name: '我的收藏',
        text: '',
        hasSubTabs: true
    },
    {
        code: 'customPlaylist',
        name: '创建的歌单',
        text: '共0个歌单',
        hasSubTabs: false
    },
    {
        code: 'favouriteArtists',
        name: '关注的歌手',
        text: '共0个歌手',
        hasSubTabs: false
    },
    {
        code: 'recents',
        name: '最近播放',
        text: '',
        hasSubTabs: true
    }]

const typeTabs = [ {
        code: 'songs',
        name: '歌曲',
        text: '共0首歌曲'
    },
    {
        code: 'playlists',
        name: '歌单',
        text: '共0个歌单'
    },
    {
        code: 'albums',
        name: '专辑',
        text: '共0张专辑'
    },
    {
        code: 'radios',
        name: 'FM电台',
        text: '共0个FM电台'
    }]

const route = useRouter()
const { getVender } = usePlatformStore()
const { addTracks, playNextTrack, resetQueue, currentTrack } = usePlayStore()
const { playingViewShow } = storeToRefs(useMainViewStore() )
const { showToast } = useMainViewStore() 
const { user, getFavouriteSongs, getFavouritePlaylilsts, 
    getFavouriteAlbums, getFavouriteRadios,
    getCustomPlaylists, getFollowArtists } = storeToRefs(useUserProfileStore())
const { cleanUpAllSongs } = useUserProfileStore()
const { nickname, about } = user.value

const currentTabView = shallowRef(null)
const tabData = reactive([])
const tabTipText = ref("")
let offset = 0
let page = 1
let limit = 30
const loading = ref(false)
const activeTab = ref(0)
const activeSubTab = ref(0)
const subTabShow = ref(true)
const subTabTipText = ref("")
let isDiffTab = true

const visitCreateCustomPlaylistView = () => {
    route.push("/userhome/customPlaylist/create")
}

const visitTab = (index) => {
    if(loading.value) return
    isDiffTab = (activeTab.value != index)
    setActiveTab(index)
    switchTab()
}

const playAllSongs = () => {
    resetQueue()
    addAllSongs("即将为您播放全部！")
    playNextTrack()
}

const addAllSongs = (text) => {
    addTracks(allSongs.value)
    showToast(text || "歌曲已全部添加！")
}

const switchTab = () => {
    tabData.length = 0
    currentTabView.value = null

    if(activeTab.value == 1) {
        tabData.push(...getCustomPlaylists.value)
        currentTabView.value = CustomPlaylistListControl
    } if(activeTab.value == 2) {
        tabData.push(...getFollowArtists.value)
        currentTabView.value = ArtistListControl
    }
    //TODO
    tabTipText.value = tabs[activeTab.value].text.replace('0', tabData.length)

    //子标签页
    subTabTipText.value = ""
    if(subTabShow.value) visitSubTab(activeSubTab.value)
} 

const setActiveTab = (index) => {
    activeTab.value = index
    subTabShow.value = tabs[activeTab.value].hasSubTabs
    if(isDiffTab) activeSubTab.value = 0
}

const visitSubTab = (index) => {
    if(loading.value) return
    setActiveSubTab(index)
    switchSubTab()
}

const setActiveSubTab = (index) => {
    activeSubTab.value = index
}

const switchSubTab = () => {
    tabData.length = 0
    currentTabView.value = null
    subTabTipText.value = ""
    if(activeSubTab.value == 0) {
        if(activeTab.value == 0) tabData.push(...getFavouriteSongs.value)
        currentTabView.value = SongListControl
    } else if(activeSubTab.value == 1) {
        if(activeTab.value == 0) tabData.push(...getFavouritePlaylilsts.value)
        currentTabView.value = PlaylistsControl
    } else if(activeSubTab.value == 2) {
        if(activeTab.value == 0) tabData.push(...getFavouriteAlbums.value)
        currentTabView.value = AlbumListControl
    } else if(activeSubTab.value == 3) {
        if(activeTab.value == 0) tabData.push(...getFavouriteRadios.value)
        currentTabView.value = PlaylistsControl
    }
    subTabTipText.value = typeTabs[activeSubTab.value].text.replace('0', tabData.length)
}

//TODO
const clearAll = () => {
    ["userProfile", "user", "profile"].forEach(key => localStorage.removeItem(key))
    const store = useUserProfileStore()
    store.$reset()
    visitTab(0)
    EventBus.emit("userProfile-reset")
    showToast("全部数据已被清空！")
}

onActivated(() => {
    visitTab(activeTab.value)
    //TODO
    cleanUpAllSongs(currentTrack)
})
watch(playingViewShow, (nv, ov) => {
    if(!nv) visitTab(activeTab.value)
})
</script>
    
<template>
    <div id="user-profile" ref="userProfileRef" >
        <div class="header">
            <div>
                <img class="cover" v-lazy="" />
            </div>
            <div class="right">
                <div class="title" v-html="nickname"></div>
                <div class="about" v-html="about"></div>
                <div class="action">
                    <CreatePlaylistBtn :leftAction="visitCreateCustomPlaylistView" class="spacing">
                    </CreatePlaylistBtn>
                    <DeleteAllBtn text="清空全部" :leftAction="clearAll" class="spacing">
                    </DeleteAllBtn>
                </div>
            </div>
        </div>
        <div class="center">
            <div class="tab-nav">
                <span class="tab" v-for="(tab,index) in tabs" 
                    :class="{ active: activeTab == index }"
                    @click="visitTab(index)"
                    v-html="tab.name" >
                </span>
                <span class="tab-tip" v-html="tabTipText"></span>
            </div>
            <div class="sub-tab-nav" v-show="subTabShow">
                <span class="sub-tab" v-for="(tab, index) in typeTabs" 
                    :class="{ active: activeSubTab == index }"
                    @click="visitSubTab(index)"
                    v-html="tab.name" >
                </span>
                <span class="tab-tip" v-html="subTabTipText"></span>
            </div>
            <component :is="currentTabView" 
                :data="tabData"
                :artistVisitable="true" 
                :albumVisitable="true" >
            </component>
            <div v-show="loading">
                <div class="loading-mask" v-for="i in 12" style="width: 100%;  height: 36px; margin-bottom: 5px; display: inline-block;"></div>
            </div>
        </div>
    </div>
</template>
    
<style>
#user-profile {
    display: flex;
    flex-direction: column;
    padding: 25px 33px 15px 33px;
    flex: 1;
    overflow: auto;
}

#user-profile .header {
    display: flex;
    flex-direction: row;
    margin-bottom: 20px;
}

#user-profile .header .right {
    flex: 1;
    margin-left: 20px;
}

#user-profile .header .title{
    text-align: left;
    margin-top: 5px;
    margin-bottom: 20px;
    font-size: 25px;
    font-weight: bold;
}

#user-profile .header .about{
    text-align: left;
    margin-bottom: 20px;
    font-size: 15px;
    color: var(--text-sub-color);
}

#user-profile .header .cover {
    width: 168px;
    height: 168px;
    border-radius: 10rem;
    box-shadow: 0px 0px 10px #161616;
}

#user-profile .action {
    display: flex;
    flex-direction: row;
}

#user-profile .spacing {
    margin-right: 20px;
}

#user-profile .tab-nav {
    position: relative;
    display: flex;
    height: 30px;
    margin-bottom: 3px;
    border-bottom: 1px solid var(--border-color);
}

#user-profile .tab {
    font-size: 16px;
    padding-left: 6px;
    padding-right: 6px;
    margin-right: 15px;
    border-bottom: 2px solid transparent;
    cursor: pointer;
}

#user-profile .tab-tip {
    position: absolute;
    right: 10px;
    font-size: 16px;
    background: var(--hl-text-bg);
    -webkit-background-clip: text;
    color: transparent;
}

#user-profile .tab-nav .active {
    border-color: #28c83f;
    border-color: var(--hl-color);
}

#user-profile .sub-tab-nav {
    position: relative;
    display: flex;
    height: 20px;
    margin-top: 15px;
    margin-bottom: 3px;
}

#user-profile .sub-tab {
    font-size: 14px;
    padding-left: 6px;
    padding-right: 6px;
    margin-right: 15px;
    cursor: pointer;
}

#user-profile .sub-tab-nav .active {
    color: var(--hl-color);
    font-weight: bold;
}

#user-profile .sub-tab-nav .tab-tip {
    position: absolute;
    right: 10px;
    font-size: 15px;
    background: var(--hl-text-bg);
    -webkit-background-clip: text;
    color: transparent;
}


#user-profile .songlist {
    display: flex;
    flex-direction: column;
}
</style>