<!--
<script>
//定义名称，方便用于<keep-alive>
export default { name: 'AlbumDetailView' }
</script>
-->

<script setup>
import { inject, ref, reactive, shallowRef, watch, toRaw, nextTick, computed, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { useUserProfileStore } from '../store/userProfileStore';
import { useAlbumDetailStore } from '../store/albumDetailStore';
import { usePlatformStore } from '../store/platformStore';
import { usePlayStore } from '../store/playStore';
import SongListControl from '../components/SongListControl.vue';
import TextListControl from '../components/TextListControl.vue';
import FavoriteShareBtn from '../components/FavoriteShareBtn.vue';
import PlayAddAllBtn from '../components/PlayAddAllBtn.vue';
import { Album } from '../../common/Album';
import { coverDefault, randomTextWithinAlphabetNums } from '../../common/Utils';
import { useSettingStore } from '../store/settingStore';
import { onEvents, emitEvents, offEvents } from '../../common/EventBusWrapper';



const props = defineProps({
    platform: String,
    id: String
})

const { playAlbum, addAlbumToQueue, dndSaveCover } = inject('player')

const { albumId, albumName, albumCover, platform,
    artistName, publishTime, company,
    activeTab, tabs, tabTipText,
    allSongs, about, activeTabCode,
} = storeToRefs(useAlbumDetailStore())
const { setActiveTab, updateTabTipText,
    isAllSongsTabLoaded, isAlbumDetailLoaded,
    updateAllSongs, updateAlbum,
    updateAbout, resetAll,
    updateCover, updateArtistName,
    updatePublishTime,
    updateAlbumDetailKeys,
} = useAlbumDetailStore()

const { getVendor, isLocalMusic, isAllSongsTab, 
    isAboutTab, isWebDav, isNavidrome, 
    isCloudStorage 
} = usePlatformStore()
const { addTracks } = usePlayStore()
const { showToast, showFailToast, hideAllCtxMenus } = useAppCommonStore()
const { isDndSaveEnable, isMiniNavBarMode } = storeToRefs(useSettingStore())


let currentTabView = shallowRef(null)
const tabData = ref([])
const detail = reactive({})
const dataType = ref(0)
const isLoadingDetail = ref(false)
const isLoading = ref(false)
const setLoadingDetail = (value) => isLoadingDetail.value = value
const setLoading = (value) => isLoading.value = value
const titleRef = ref(null)
const isTwoLinesTitle = ref(false)
const setTwoLinesTitle = (value) => isTwoLinesTitle.value = value

const visitTab = (index, isClick) => {
    if (isLoading.value && isClick) return
    setActiveTab(index)
    switchTab()
}

const playAll = () => {
    const data = allSongs.value
    const album = { ...toRaw(detail), data }
    playAlbum(album, { text: '即将为您播放全部' })
}

const addAll = (text) => {
    //addTracks(allSongs.value)
    //showToast(text || "歌曲已全部添加")

    const data = allSongs.value
    const album = { ...toRaw(detail), data }
    addAlbumToQueue(album, { text: (text || "歌曲已全部添加") })
}

//TODO
const { addFavoriteAlbum, removeFavoriteAlbum, isFavoriteAlbum } = useUserProfileStore()
const favorited = ref(false)
const toggleFavorite = () => {
    if(isLocalMusic(platform.value) 
        || isCloudStorage(platform.value)) {
        return showFailToast('当前平台暂不支持收藏')
    }

    favorited.value = !favorited.value
    let text = "专辑收藏成功"
    if (favorited.value) {
        const { title, cover, publishTime, artist, company } = detail
        addFavoriteAlbum(albumId.value, platform.value, title, cover, publishTime, artist, company)
    } else {
        removeFavoriteAlbum(albumId.value, platform.value)
        text = "专辑已取消收藏"
    }
    showToast(text)
}

const checkFavorite = () => {
    favorited.value = isFavoriteAlbum(albumId.value, platform.value)
}

const updateTabData = (data) => {
    tabData.value.length = 0
    if (typeof data === 'string' && isAboutTab(activeTabCode.value)) {
        tabData.value.push(data)
        updateTabTipText(0)
    } else if (Array.isArray(data) && data.length > 0) {
        tabData.value.push(...data)
        updateTabTipText(tabData.value.length)
    }
}

const updateLocalMusicAlbumCover = (songs) => {
    if(!songs || songs.length < 1) return
    const { id, platform } = props
    if(!isLocalMusic(platform)) return
    const { title, cover, publishTime, artist, company } = detail
    if(cover) return 
    for(let i = 0; i < songs.length; i++) {
        const { cover: sCover } = songs[i]
        if(sCover) {
            updateCover(sCover)
            break
        }
    }
}

const getAlbumDetail = async () => {
    setLoadingDetail(true)
    checkFavorite()
    if (isAlbumDetailLoaded()) {
        setLoadingDetail(false)
        return
    }
    const vendor = getVendor(platform.value)
    if (!vendor || !vendor.albumDetail) return
    const id = albumId.value
    let result = null, retry = 1
    do {
        result = await vendor.albumDetail(id)
    } while (!result && retry++ <= 3)
    if (!result) return
    const artistName = Album.artistName(result)
    const { title, cover, company, publishTime, about } = result
    updateAlbum(title, cover, artistName, company, publishTime)
    updateAbout(about)
    Object.assign(detail, result)
    setLoadingDetail(false)
    if (Album.hasTracks(result)) {
        updateAllSongs(result.data)
        updateTabData(allSongs.value)
        currentTabView.value = SongListControl
        setLoading(false)
    }
}

const loadAllSongs = async () => {
    setLoading(true)
    currentTabView.value = SongListControl
    if (isAllSongsTabLoaded()) {
        updateTabData(allSongs.value)
        updateLocalMusicAlbumCover(allSongs.value)
        setLoading(false)
        return
    }
    const vendor = getVendor(platform.value)
    if (!vendor || !vendor.albumDetailAllSongs) return
    const id = albumId.value
    let result = null, retry = 1
    do {
        result = await vendor.albumDetailAllSongs(id, 0, 100)
    } while (!result && retry++ <= 3)
    if (!isAllSongsTab(activeTabCode.value) || !result) return
    const { data, cover, artistName, publishTime } = result
    updateAllSongs(data)
    updateTabData(allSongs.value)
    if (isLocalMusic(platform.value)) {
        updateCover(cover)
        updateArtistName(artistName)
        updatePublishTime(publishTime)
    }
    updateLocalMusicAlbumCover(allSongs.value)
    setLoading(false)
}

const loadAbout = () => {
    currentTabView.value = TextListControl
    if (!isAboutTab(activeTabCode.value)) return
    updateTabData(about.value)
}

const detailRef = ref(null)
const onScroll = () => {
    hideAllCtxMenus()
}

const scrollToTop = () => {
    if (detailRef.value) detailRef.value.scrollTop = 0
}

const reloadAll = () => {
    dataType.value = isLocalMusic(platform.value) ? 11 : 0

    setLoadingDetail(true)
    setLoading(true)
    resetAll()
    loadAll()
}

const loadAll = () => {
    scrollToTop()
    getAlbumDetail()
    visitTab(0)
}

const resetView = () => {
    currentTabView.value = null
    updateTabTipText(0)
    checkFavorite()
}

const switchTab = () => {
    resetView()
    setLoading(true)
    const code = activeTabCode.value
    if (isAllSongsTab(code)) {
        loadAllSongs()
    } else if (isAboutTab(code)) {
        loadAbout()
        setLoading(false)
    }
}

const detectTitleHeight = () => {
    const titleEl = titleRef.value
    if (!titleEl) return
    const { clientHeight } = titleEl
    if (!clientHeight) return
    setTwoLinesTitle(clientHeight > 50)
}

const computedTabName = computed(() => {
    return (tab) => {
        const { code, name } = tab
        return (tab.code === 'about') ? `专辑${name}` : name
    }
})



/* 生命周期、监听 */
//TODO 需要梳理优化
watch(() => [props.platform, props.id], ([nv1, nv2]) => {
    updateAlbumDetailKeys(nv1, nv2)
    reloadAll()
}, { immediate: true })
watch([isLoading, isLoadingDetail], () => nextTick(detectTitleHeight))
watch(isMiniNavBarMode, () => nextTick(detectTitleHeight))

//TODO
const eventsRegistration = {
    'ctxMenu-removeFromLocal': reloadAll,
    'app-resize': detectTitleHeight,
}

onMounted(() => onEvents(eventsRegistration))
onUnmounted(() => offEvents(eventsRegistration))
</script>

<template>
    <div id="album-detail-view" ref="detailRef" @scroll="onScroll">
        <div class="header">
            <div>
                <img class="cover" v-lazy="coverDefault(albumCover)" :class="{ 'draggable': isDndSaveEnable }"
                    :draggable="isDndSaveEnable" @dragstart="(event) => dndSaveCover(event, detail)" />
            </div>
            <div class="right" v-show="!isLoading">
                <div class="title" v-html="albumName || '未知专辑'" ref="titleRef"></div>
                <div class="info" :class="{ 'short-info': isTwoLinesTitle }">
                    <div class="info-row">
                        <p><b>歌手:</b> <span class="artist">{{ artistName || '未知歌手' }} </span></p>
                    </div>
                    <div class="info-row">
                        <!--
                        <span class="col1"><b>发行时间:</b> {{ publishTime || '未知' }} </span>
                        -->
                        <p class="col1"><b>发行时间:</b> {{ publishTime || '未知' }} </p>
                    </div>
                    <div class="info-row">
                        <!--
                        <span class="col2"><b>发行公司:</b> {{ company || '未知' }}</span>
                        -->
                        <p class="col2"><b>发行公司:</b> {{ company || '未知' }}</p>
                    </div>
                </div>
                <div class="action">
                    <PlayAddAllBtn :leftAction="playAll" :rightAction="() => addAll()" class="spacing"></PlayAddAllBtn>
                    <FavoriteShareBtn class="spacing"
                        :favorited="favorited" 
                        :leftAction="toggleFavorite" 
                        :disabled="isLocalMusic(platform)" 
                        :hiddenShare="true"
                        v-show="!isLocalMusic(platform)">
                    </FavoriteShareBtn>
                </div>
            </div>
            <div class="right" v-show="isLoading">
                <div class="title" v-show="isLoadingDetail">
                    <div class="loading-mask" style="width: 88%; height: 39px; display: inline-block;"></div>
                </div>
                <div class="info" v-show="isLoadingDetail">
                    <div class="loading-mask" v-for="  i   in   3  "
                        style="width: 100%; height: 28px; display: inline-block;">
                    </div>
                </div>
                <div class="action">
                    <div class="loading-mask spacing" v-for="  i   in   2  "
                        style="width: 168px; height: 36px; display: inline-block;"></div>
                </div>
            </div>
        </div>
        <div class="center">
            <div class="tab-nav">
                <span class="tab" :class="{ active: activeTab == index, 'content-text-highlight': activeTab == index }"
                    v-for="(  tab, index  ) in   tabs  " @click="visitTab(index, true)" v-html="computedTabName(tab)">
                </span>
                <span class="tab-tip content-text-highlight" v-html="tabTipText"></span>
            </div>
            <component 
                :id="randomTextWithinAlphabetNums(16)"
                :is="currentTabView" 
                :data="tabData" 
                :dataType="dataType" 
                :artistVisitable="true"
                :albumVisitable="true"
                :draggable="true"
                :loading="isLoading" 
                :platform="platform">
            </component>
        </div>
    </div>
</template>

<style scoped>
#album-detail-view {
    display: flex;
    flex-direction: column;
    padding: 20px 33px 15px 33px;
    flex: 1;
    overflow: scroll;
    overflow-x: hidden;
}

#album-detail-view .header {
    display: flex;
    flex-direction: row;
    margin-bottom: 16px;
}

#album-detail-view .header .right {
    flex: 1;
    margin-left: 30px;
}

#album-detail-view .header .title {
    text-align: left;
    margin-top: 0px;
    /*font-size: 30px;*/
    font-size: var(--content-text-module-title-size);
    font-weight: bold;

    overflow: hidden;
    word-wrap: break-word;
    /*white-space: pre-wrap;
    line-break: anywhere;*/
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    word-wrap: break-word;
    line-break: anywhere;
}

#album-detail-view .header .cover {
    width: 236px;
    height: 236px;
    border-radius: var(--border-img-text-tile-border-radius);
    box-shadow: 0px 0px 1px #161616;
}

#album-detail-view .header .cover.draggable {
    -webkit-user-drag: auto;
}

#album-detail-view .header .info {
    margin-top: 10px;
    margin-bottom: 50px;
    /*font-size: 16px;*/
    text-align: left;
}


#album-detail-view .header .short-info {
    margin-top: 10px;
    margin-bottom: 10px;
}

#album-detail-view .header .info-row {
    /*margin-top: 10px;*/
    margin-top: 6px;
}

#album-detail-view .header .info-row span {
    color: var(--content-subtitle-text-color);
}

#album-detail-view .header .info-row p {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    text-align: left;
    word-wrap: break-word;
    line-break: anywhere;
}

#album-detail-view .header .info-row b {
    margin-right: 8px;
    font-weight: normal;
    color: var(--content-subtitle-text-color);
}

#album-detail-view .header .info-row .col1 {
    width: 233px;
    display: inline-block;
}

#album-detail-view .header .info-row .col2 {
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    text-align: left;
    word-wrap: break-word;
    line-break: anywhere;
}

#album-detail-view .action {
    display: flex;
    flex-direction: row;
}

#album-detail-view .spacing {
    margin-right: 20px;
}

#album-detail-view .tab-nav {
    position: relative;
    display: flex;
    align-items: center;
    height: 36px;
    margin-bottom: 5px;
    margin-left: 2px;
    border-bottom: 1px solid transparent;
}

#album-detail-view .tab {
    font-size: var(--content-text-tab-title-size);
    /*padding-left: 15px;
    padding-right: 15px;
    margin-right: 15px;
    */
    margin-right: 36px;
    padding-bottom: 5px;
    border-bottom: 3px solid transparent;
    cursor: pointer;
}

#album-detail-view .tab-nav .active {
    font-weight: bold;
    border-color: var(--content-highlight-color);
}

#album-detail-view .tab-tip {
    position: absolute;
    right: 10px;
    font-weight: bold;
}

#album-detail-view .songlist {
    display: flex;
    flex-direction: column;
}

#album-detail-view .text-ctl p {
    margin-top: 15px;
    margin-bottom: 5px;
}

#album-detail-view .textlist-ctl {
    padding: 0px 2px 10px 2px;
}
</style>