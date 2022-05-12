<!--
<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'AlbumDetailView'
}
</script>
-->

<script setup>
import { storeToRefs } from 'pinia';
import { onMounted, onActivated, ref, shallowRef, watch } from 'vue';
import PlayAddAllBtn from '../components/PlayAddAllBtn.vue';
import SongListControl from '../components/SongListControl.vue';
import TextListControl from '../components/TextListControl.vue';
import { useAlbumDetailStore } from '../store/albumDetailStore';
import { usePlatformStore } from '../store/platformStore';
import { usePlayStore } from '../store/playStore';

const props = defineProps({
    platform: String,
    id: String
})

const { albumId, albumName, albumCover, 
        artistName, publishTime, company,
        activeTab, tabs, tabTipText, 
        allSongs, about
    } = storeToRefs(useAlbumDetailStore())
const { setActiveTab, updateTabTipText, 
        isAllSongsTab, isAboutTab,
        isAllSongsTabLoaded, isAlbumDetailLoaded,
        updateAllSongs, updateAlbum, 
        updateAbout, resetAll
    } = useAlbumDetailStore()

const { getVender } = usePlatformStore()
const { addTracks, playNextTrack, resetQueue } = usePlayStore()

let currentTabView = shallowRef(null)
const tabData = ref([])

const visitTab = (index) => {
    setActiveTab(index)
    switchTab()
}

const playAll = () => {
    resetQueue()
    addAll()
    playNextTrack()
}

const addAll = () => {
    addTracks(allSongs.value)
} 

const updateTabData = (data) => {
    tabData.value.length = 0
    if(typeof(data) == 'string') {
        tabData.value.push(data)
        updateTabTipText(0)
    } else {
        tabData.value.push(...data)
        updateTabTipText(tabData.value.length)
    }
}

const getAlbumDetail = () => {
    if(isAlbumDetailLoaded()) {
        return 
    }
    const vender = getVender(props.platform)
    if(!vender) return
    const id = albumId.value
    vender.albumDetail(id).then(result => {
        console.log(result)
        const artistName = result.artist.length > 0 ? (result.artist[0].name) : ''
        updateAlbum(result.title, result.cover, artistName, result.company, result.publishTime)
        updateAbout(result.about)
        if(result.hasTracks()) {
            updateAllSongs(result.data)
            updateTabData(allSongs.value)
            currentTabView.value = SongListControl
            return 
        }
    })
}

const loadAllSongs = ()=> {
    if(isAllSongsTabLoaded()) {
        updateTabData(allSongs.value)
        currentTabView.value = SongListControl
        return 
    }
    const vender = getVender(props.platform)
    if(!vender) return
    const id = albumId.value
    vender.albumDetailAllSongs(id, 0, 100).then(result => {
        console.log(result)
        updateAllSongs(result.data)
        updateTabData(allSongs.value)
        currentTabView.value = SongListControl
    })
}

const loadAbout = () => {
    updateTabData(about.value)
    currentTabView.value = TextListControl
}

const scrollToTop = () => {
    const view = document.querySelector('#album-detail')
    view.scrollTop = 0
}


const reloadAll = () =>  {
    resetAll()
    loadAll()
}

const loadAll = () =>  {
    scrollToTop()
    visitTab(0)
}

const switchTab = () => {
    currentTabView.value = null
    getAlbumDetail()
    if(isAllSongsTab()) {
        loadAllSongs()
    } else if(isAboutTab()) {
        loadAbout()
    }
}

onMounted(() => loadAll())
onActivated(() => loadAll())
watch(activeTab, (nv,ov) => switchTab())
//watch(albumId, (nv, ov) => reloadAll())
watch(()=> props.id, (nv, ov) => reloadAll())
</script>

<template>
    <div id="album-detail">
        <div class="header">
            <div>
                <img class="cover" v-lazy="albumCover" />
            </div>
            <div class="right">
                <div class="title" v-html="albumName"></div>
                <div class="info">
                    <div class="info-row">
                        <span><b>歌手:</b> {{ artistName }} </span>
                    </div>
                    <div class="info-row">
                        <span class="col1"><b>发行时间:</b> {{ publishTime }} </span>
                        <span class="col2"><b>发行公司:</b> {{ company }} </span>
                    </div>
                </div>
                <div class="action">
                    <PlayAddAllBtn :leftAction="playAll" :rightAction="addAll"></PlayAddAllBtn>
                </div>
            </div>
        </div>
        <div class="center">
            <div class="tab-nav">
                <span class="tab" :class="{ active: activeTab == index }"
                    v-for="(tab,index) in tabs" 
                    @click="visitTab(index)"
                    v-html="tab.name" >
                </span>
                <span class="tab-tip" v-html="tabTipText" ></span>
            </div>
            <component :is="currentTabView" :data="tabData" 
                :artistVisitable="true" 
                :albumVisitable="true" >
            </component>
        </div>
    </div>
</template>

<style>
#album-detail {
    display: flex;
    flex-direction: column;
    padding: 25px 33px 15px 33px;
    flex: 1;
    overflow: auto;
}

#album-detail .header {
    display: flex;
    flex-direction: row;
    margin-bottom: 20px;
}

#album-detail .header .right {
    flex: 1;
    margin-left: 20px;
}

#album-detail .header .title {
    text-align: left;
    margin-top: 5px;
    font-size: 25px;
    font-weight: bold;
}

#album-detail .header .cover {
    width: 175px;
    height: 175px;
    border-radius: 6px;
    box-shadow: 0px 0px 10px #161616;
}

#album-detail .header .info {
    margin-top: 15px;
    margin-bottom: 30px;
    font-size: 16px;
    text-align: left;
}

#album-detail .header .info-row {
    margin-top: 10px;
}

#album-detail .header .info-row span {
    color: #ababab;
}

#album-detail .header .info-row b {
    margin-right: 8px;
}

#album-detail .header .info-row .col1 {
    width: 200px;
    display: inline-block;
}

#album-detail .header .info-row .col2 {
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    text-align: left;
}

#album-detail .tab-nav {
    position: relative;
    display: flex;
    height: 30px;
    margin-bottom: 3px;
    border-bottom: 1px solid #464646;
}

#album-detail .tab {
    font-size: 16px;
    padding-left: 6px;
    padding-right: 6px;
    margin-right: 15px;
    border-bottom: 2px solid transparent;
    cursor: pointer;
}

#album-detail .tab-nav .active {
    border-color: #28c83f;
}

#album-detail .tab-tip {
    position: absolute;
    right: 10px;
    font-size: 16px;
    background: linear-gradient(to top right, #1ca388, #28c83f);
    -webkit-background-clip: text;
    color: transparent;
}

#album-detail  .songlist {
    display: flex;
    flex-direction: column;
}

#album-detail .text-ctl p {
    margin-top: 15px;
    margin-bottom: 5px;
}
</style>