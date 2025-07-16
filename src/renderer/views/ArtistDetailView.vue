<!--
<script>
//定义名称，方便用于<keep-alive>
export default { name: 'ArtistDetailView' }
</script>
-->

<script setup>
import { onMounted, onActivated, ref, shallowRef, watch, reactive, inject, computed, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useArtistDetailStore } from '../store/artistDetailStore';
import { usePlatformStore } from '../store/platformStore';
import { usePlayStore } from '../store/playStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { useUserProfileStore } from '../store/userProfileStore';
import AlbumListControl from '../components/AlbumListControl.vue';
import TextListControl from '../components/TextListControl.vue';
import PlayAddAllBtn from '../components/PlayAddAllBtn.vue';
import SongListControl from '../components/SongListControl.vue';
import LoadingMask from '../components/LoadingMask.vue';
import FavoriteShareBtn from '../components/FavoriteShareBtn.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import { coverDefault, randomTextWithinAlphabetNums } from '../../common/Utils';
import { useSettingStore } from '../store/settingStore';
import { onEvents, emitEvents, offEvents } from '../../common/EventBusWrapper';



const props = defineProps({
    exploreMode: String,
    platform: String,
    id: String
})

const { addAndPlayTracks, dndSaveCover } = inject('player')

const { 
    artistId, artistName, artistCover, platform,
    artistAlias, tabTipText, activeTab,
    tabs, hotSongs, allSongs,
    albums, about, activeTabCode,
    hasHotSongsTab, hasAllSongsTab,
} = storeToRefs(useArtistDetailStore())
const { 
    setActiveTab, updateArtist,
    updateHotSongs, updateAllSongs, appendAllSongs,
    updateAlbums, updateAbout,
    resetAll, updateTabTipText,
    isHotSongsTabLoaded,
    isAllSongsTabLoaded,
    isAlbumsTabLoaded,
    isAboutTabLoaded,
    isArtistDetailLoaded,
    updateArtistDetailKeys
} = useArtistDetailStore()

const { 
    getVendor, isLocalMusic,
    isHotSongsTab, isAllSongsTab,
    isAlbumsTab, isAboutTab,
    isWebDav, isNavidrome, isCloudStorage 
} = usePlatformStore()
const { addTracks } = usePlayStore()
const { routerCtxCacheItem } = storeToRefs(useAppCommonStore())
const { showToast, showFailToast, hideAllCtxMenus } = useAppCommonStore()
const { isDndSaveEnable, isSingleLineAlbumTitleStyle } = storeToRefs(useSettingStore())


const artistDetailRef = ref(null)
const currentTabView = shallowRef(null)
const tabData = reactive([])
const dataType = ref(0)
const detail = reactive({})
let offset = 0, page = 1, limit = 30
const isLoadingDetail = ref(false)
const isLoadingSongs = ref(false)
const isLoadingAlbums = ref(false)
const isLoading = ref(false)
const back2TopBtnRef = ref(null)
const isAllSongsTabMoreData = ref(false)
let markScrollTop = 0
const setLoadingDetail = (value) => (isLoadingDetail.value = value)
const setLoading = (value) => (isLoading.value = value)


const setLoadingSongs = (value) => {
    isLoadingSongs.value = value
    setLoading(value)
}

const setLoadingAlbums = (value) => {
    isLoadingAlbums.value = value
    setLoading(value)
}

const visitTab = (index, isClick) => {
    if (isLoading.value && isClick) return
    setActiveTab(index)
    switchTab()
}

const playHotSongs = () => addAndPlayTracks(hotSongs.value, true)
const playAllSongs = () => addAndPlayTracks(allSongs.value, true)

const addHotSongs = (text) => {
    if(!hotSongs.value || hotSongs.value.length < 1) return 
    addTracks(hotSongs.value)
    showToast(text || "歌曲已全部添加")
}

const addAllSongs = (text) => {
    if(!allSongs.value || allSongs.value.length < 1) return 
    addTracks(allSongs.value)
    showToast(text || "歌曲已全部添加")
}

const { addFollowArtist, removeFollowArtist, isFollowArtist } = useUserProfileStore()
const follow = ref(false)
const toggleFollow = () => {
    const { id, platform } = props
    if(isLocalMusic(platform) || isCloudStorage(platform)) {
        return showFailToast('当前平台暂不支持关注')
    } 
    follow.value = !follow.value
    let text = "歌手关注成功"
    if (follow.value) {
        const { title, cover } = detail
        addFollowArtist(id, platform, title, cover)
    } else {
        removeFollowArtist(id, platform)
        text = "歌手已取消关注"
    }
    showToast(text)
}

const checkFollow = () => {
    follow.value = isFollowArtist(props.id, props.platform)
}

const updateTabData = (data) => {
    tabData.length = 0
    if (typeof data === 'string' && isAboutTab(activeTabCode.value)) {
        tabData.push(data)
        updateTabTipText(0)
    } else if (Array.isArray(data) && data.length > 0) {
        tabData.push(...data)
        const moreFlag = isAllSongsTab(activeTabCode.value) && isAllSongsTabMoreData.value ? '+' : ''
        updateTabTipText(`${tabData.length}${moreFlag}`)
    }
}

const getArtistDetail = async () => {
    checkFollow()
    if (isArtistDetailLoaded()) {
        setLoadingDetail(false)
        return
    }
    const vendor = getVendor(platform.value)
    if (!vendor || !vendor.artistDetail) return
    setLoadingDetail(true)
    const track = routerCtxCacheItem.value || {}
    const id = artistId.value
    let result = null, retry = 1
    do {
        result = await vendor.artistDetail(id, track)
    } while (!result && retry++ <= 3)
    if (!result) return
    updateArtist(result.title, result.cover)
    let { about, hotSongs } = result
    if(about) {
        updateAbout(about)
    } else if (!about && vendor.artistDetailAbout) {
        vendor.artistDetailAbout(id, track).then(about => {
            if(about) updateAbout(about)
        })
    }
    if (hotSongs) updateHotSongs(hotSongs)
    Object.assign(detail, result)
    setLoadingDetail(false)
}

const updateLocalMusicArtistCover = (songs) => {
    if(!songs || songs.length < 1) return
    const { id, platform } = props
    if(!isLocalMusic(platform)) return
    const { title, cover } = detail
    if(cover) return 
    for(let i = 0; i < songs.length; i++) {
        const { cover: sCover } = songs[i]
        if(sCover) {
            updateArtist(title, sCover)
            break
        }
    }
}

const loadHotSongs = async () => {
    setLoadingSongs(true)
    if (isHotSongsTabLoaded()) {
        updateTabData(hotSongs.value)
        setLoadingSongs(false)
        return
    }
    const vendor = getVendor(platform.value)
    if (!vendor || !vendor.artistDetailHotSongs) return
    const track = routerCtxCacheItem.value || {}
    const id = artistId.value
    let result = null, retry = 1
    do {
        result = await vendor.artistDetailHotSongs(id, track)
    } while (!result && retry++ <= 3)
    if (!isHotSongsTab(activeTabCode.value) || !result) return
    const { name, cover, data } = result
    if (name && cover) updateArtist(name, cover)
    updateHotSongs(data)
    updateTabData(hotSongs.value)
    setLoadingSongs(false)
}

//TODO
const loadMoreSongs = async () => {
    if (!isAllSongsTabMoreData.value) return
    offset = ++page * limit
    const vendor = getVendor(platform.value)
    if (!vendor || !vendor.artistDetailAllSongs) return
    const track = routerCtxCacheItem.value || {}
    const id = artistId.value
    let result = null, retry = 1
    do {
        result = await vendor.artistDetailAllSongs(id, track, offset, limit, page)
    } while (!result && retry++ <= 3)
    if (!isAllSongsTab(activeTabCode.value) || !result) return
    appendAllSongs(result.data)
    isAllSongsTabMoreData.value = (allSongs.value.length < result.total) || (page < result.totalPage)
    updateTabData(allSongs.value)
    currentTabView.value = SongListControl
}

const loadAllSongs = async () => {
    setLoadingSongs(true)
    if (isAllSongsTabLoaded()) {
        updateTabData(allSongs.value)
        updateLocalMusicArtistCover(allSongs.value)
        setLoadingSongs(false)
        return
    }
    const vendor = getVendor(platform.value)
    if (!vendor || !vendor.artistDetailAllSongs) return
    const track = routerCtxCacheItem.value || {}
    const id = artistId.value
    let result = null, retry = 1
    do {
        result = await vendor.artistDetailAllSongs(id, track, offset, limit, page)
    } while (!result && retry++ <= 3)
    if (!isAllSongsTab(activeTabCode.value) || !result) return
    updateAllSongs(result.data)
    isAllSongsTabMoreData.value = (allSongs.value.length < result.total) || (page < result.totalPage)
    updateTabData(allSongs.value)
    updateLocalMusicArtistCover(allSongs.value)
    setLoadingSongs(false)
}

const loadAlbums = async () => {
    setLoadingDetail(false)
    setLoadingAlbums(true)
    if (isAlbumsTabLoaded()) {
        //TODO
        setTimeout(() => {
            updateTabData(albums.value)
            setLoadingAlbums(false)
        }, 0)
        return
    }
    const vendor = getVendor(platform.value)
    if (!vendor || !vendor.artistDetailAlbums) return
    const track = routerCtxCacheItem.value || {}
    const id = artistId.value
    //TODO 分页加载全部
    let result = null, retry = 1
    do {
        result = await vendor.artistDetailAlbums(id, track, 0, 365, 1)
    } while (!result && retry++ <= 3)
    if (!isAlbumsTab(activeTabCode.value) || !result) return
    updateAlbums(result.data)
    updateTabData(result.data)
    setLoadingAlbums(false)
}

const loadAbout = () => {
    setLoadingDetail(false)
    setLoadingSongs(false)
    setLoadingAlbums(false)
    if (isAboutTabLoaded()) {
        updateTabData(about.value)
        updateTabTipText(0)
        return
    }
    const vendor = getVendor(platform.value)
    if (!vendor || !vendor.artistDetailAbout) return
    const track = routerCtxCacheItem.value || {}
    const id = artistId.value
    vendor.artistDetailAbout(id, track).then(result => {
        if (!isAboutTab(activeTabCode.value)) return
        updateAbout(result)
        updateTabData(result)
        updateTabTipText(0)
    })
}

const scrollToLoad = () => {
    if (isLoading.value) return
    const scrollTop = artistDetailRef.value.scrollTop
    const scrollHeight = artistDetailRef.value.scrollHeight
    const clientHeight = artistDetailRef.value.clientHeight
    markScrollState()
    const allowedError = 20 //允许误差
    if ((scrollTop + clientHeight + allowedError) >= scrollHeight) {
        loadMoreSongs()
    }
    //TODO
    hideAllCtxMenus()
}

const resetTabView = () => {
    currentTabView.value = null
    tabData.length = 0
    updateTabTipText(0)
}

const onScroll = () => {
    hideAllCtxMenus()
    if (isAllSongsTab(activeTabCode.value)) {
        scrollToLoad()
    } else {
        markScrollState()
    }
}

const switchTab = () => {
    setLoading(true)
    resetTabView()
    const code = activeTabCode.value
    if (isHotSongsTab(code)) {
        currentTabView.value = SongListControl
        loadHotSongs()
    } else if (isAllSongsTab(code)) {
        currentTabView.value = SongListControl
        loadAllSongs()
    } else if (isAlbumsTab(code)) {
        currentTabView.value = AlbumListControl
        loadAlbums()
    } else if (isAboutTab(code)) {
        currentTabView.value = TextListControl
        loadAbout()
    }
}

const resetBack2TopBtn = () => {
    if (back2TopBtnRef.value) {
        back2TopBtnRef.value.setScrollTarget(artistDetailRef.value)
    }
}

const resetScrollState = () => {
    markScrollTop = 0
    if (!artistDetailRef.value) return
    artistDetailRef.value.scrollTop = markScrollTop
}

const markScrollState = () => {
    if (!artistDetailRef.value) return
    markScrollTop = artistDetailRef.value.scrollTop
}

const restoreScrollState = () => {
    if (markScrollTop < 1) return
    if (!artistDetailRef.value) return
    artistDetailRef.value.scrollTop = markScrollTop
}

const resetPagination = () => {
    offset = 0
    page = 1
}

const reloadAll = () => {
    resetTabView()
    currentTabView.value = SongListControl
    dataType.value = isLocalMusic(platform.value) ? 11 : 0

    setLoadingDetail(true)
    setLoadingSongs(true)
    //resetBack2TopBtn()
    resetAll()
    loadAll()
}

const loadAll = async () => {
    resetPagination()
    resetScrollState()
    await getArtistDetail()
    visitTab(0)
}

const trimExtraHtml = (text) => {
    const title = artistName.value + '简介'
    const titleRegex = new RegExp(title)
    text = (text || '').trim()
    //text.replace(/<[/]?[\w\d\s"'\0\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]*>/g, '')
    return text.replace(/<[/\w\d\s"'\0\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]*>/g, '。')
        .replace(/<[\w\d\s"'\0\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]*>/g, '')
        .replace(/(&[a-zA-Z]+;)/g, '')
        .replace(titleRegex, '')
        .replace(/。。/g, '。')
        .replace(/^。/g, '')
        .trim()
}

const computedPlayAllSongsBtnShow = computed(() => {
    if (!hasAllSongsTab.value) return false
    if (!hasHotSongsTab.value) return true
    return isAllSongsTab(activeTabCode.value)
})

const computedTabName = computed(() => {
    return (tab) => {
        const { code, name } = tab
        return (tab.code === 'about') ? `歌手${name}` : name
    }
})


/* 生命周期、监听 */
watch(() => [props.platform, props.id], ([nv1, nv2]) => {
    updateArtistDetailKeys(nv1, nv2)
    reloadAll()
}, { immediate: true })

//TODO 需要梳理优化，容易出现重复加载Bug
const eventsRegistration = {
    'ctxMenu-removeFromLocal': reloadAll,
}

onMounted(() => onEvents(eventsRegistration))
onUnmounted(() => offEvents(eventsRegistration))

onActivated(() => {
    restoreScrollState()
    resetBack2TopBtn()
})
</script>

<template>
    <div id="artist-detail-view" ref="artistDetailRef" @scroll="onScroll">
        <div class="header">
            <div>
                <img class="cover" v-lazy="coverDefault(artistCover)" :class="{ 'draggable': isDndSaveEnable }"
                    :draggable="isDndSaveEnable" @dragstart="(event) => dndSaveCover(event, detail)" />
            </div>
            <div class="right" v-show="!isLoading">
                <div class="title" v-html="artistName"></div>
                <div class="alias" v-html="artistAlias"></div>
                <div class="about">{{ trimExtraHtml(about) }}</div>
                <div class="action">
                    <PlayAddAllBtn :leftAction="playHotSongs" 
                        :rightAction="() => addHotSongs()"
                        v-show="hasHotSongsTab && !isAllSongsTab(activeTabCode)" 
                        text="播放热歌" 
                        class="spacing">
                    </PlayAddAllBtn>
                    <PlayAddAllBtn text="播放歌曲" 
                        :leftAction="playAllSongs" 
                        :rightAction="() => addAllSongs()"
                        v-show="computedPlayAllSongsBtnShow" 
                        class="spacing">
                    </PlayAddAllBtn>
                    <FavoriteShareBtn :favorited="follow" 
                        actionText="关注" 
                        :leftAction="toggleFollow"
                        :disabled="isLocalMusic(platform)"
                        :hiddenShare="true" 
                        v-show="!isLocalMusic(platform)">
                    </FavoriteShareBtn>
                </div>
            </div>
            <div class="right" v-show="isLoading">
                <div class="title" v-show="isLoadingDetail">
                    <LoadingMask :loading="isLoading" width="36%" height="39px"/>
                </div>
                <div class="title" v-html="artistName" v-show="!isLoadingDetail"></div>
                <div class="about" v-show="isLoadingDetail">
                     <LoadingMask :loading="isLoading" :count="3" width="100%" height="23px"/>
                </div>
                <div class="about" v-show="!isLoadingDetail">{{ trimExtraHtml(about) }}</div>
                <div class="action" v-show="isLoadingDetail">
                    <LoadingMask :loading="isLoading" :classList="{ spacing: true }"
                        :count="2" width="168px" height="36px" marginRight="20px" />
                </div>
                <div class="action" v-show="!isLoadingDetail">
                    <PlayAddAllBtn :leftAction="playHotSongs" :rightAction="() => addHotSongs()"
                        v-show="hasHotSongsTab && !isAllSongsTab(activeTabCode)" text="播放热歌" class="spacing">
                    </PlayAddAllBtn>
                    <PlayAddAllBtn text="播放歌曲" :leftAction="playAllSongs" :rightAction="() => addAllSongs()"
                        v-show="computedPlayAllSongsBtnShow" class="spacing"></PlayAddAllBtn>
                    <FavoriteShareBtn 
                        :favorited="follow" 
                        actionText="关注" 
                        :leftAction="toggleFollow"
                        :hiddenShare="true" >
                    </FavoriteShareBtn>
                </div>
            </div>
        </div>
        <div class="center">
            <div class="tab-nav">
                <span class="tab" :class="{ active: activeTab == index, 'content-text-highlight': activeTab == index }"
                    v-for="(tab, index) in tabs" @click="visitTab(index, true)" v-html="computedTabName(tab)">
                </span>
                <span class="tab-tip content-text-highlight" v-html="tabTipText"></span>
                <!--
                <LoadingMask :loading="isLoading" :classList="{ 'tab-tip': true }"
                    width="88px" height="25px" />
                -->
            </div>
            <component 
                :id="randomTextWithinAlphabetNums(16)"
                :is="currentTabView" 
                :data="tabData" 
                :dataType="dataType" 
                :platform="platform"
                :artistVisitable="true" 
                :albumVisitable="true" 
                :draggable="true"
                :loading="isLoading" 
                :singleLineTitleStyle="isSingleLineAlbumTitleStyle"
                :needReset="true">
            </component>
        </div>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style scoped>
#artist-detail-view {
    display: flex;
    flex-direction: column;
    padding: 20px 33px 15px 33px;
    flex: 1;
    overflow: scroll;
    overflow-x: hidden;
}

#artist-detail-view .header {
    display: flex;
    flex-direction: row;
    margin-bottom: 16px;
}

#artist-detail-view .header .right {
    flex: 1;
    margin-left: 30px;
}

#artist-detail-view .header .title {
    text-align: left;
    margin-top: 8px;
    margin-bottom: 10px;
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
    min-height: 39px;

    overflow: hidden;
    word-wrap: break-all;
    white-space: pre-wrap;
    line-break: anywhere;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    line-break: anywhere;
}

#artist-detail-view .header .alias {
    display: none;
}

#artist-detail-view .header .about {
    height: 110px;
    margin-bottom: 15px;
    /*line-height: 23px;*/
    line-height: var(--content-text-line-height);
    font-size: var(--content-text-subtitle-size) !important;
    color: var(--content-subtitle-text-color);
    overflow: hidden;
    word-wrap: break-word;
    /*white-space: pre-wrap;*/
    line-break: anywhere;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
    line-clamp: 4;
    text-align: left;
    letter-spacing: calc(var(--content-text-letter-spacing) + 0.5px);
}

#artist-detail-view .header .cover {
    width: 236px;
    height: 236px;
    border-radius: 10rem;
    box-shadow: 0px 0px 1px #161616;
}

#artist-detail-view .header .cover.draggable {
    -webkit-user-drag: auto;
}

#artist-detail-view .action {
    display: flex;
    flex-direction: row;
}

#artist-detail-view .spacing {
    margin-right: 20px;
}

#artist-detail-view .tab-nav {
    position: relative;
    display: flex;
    align-items: center;
    height: 36px;
    margin-bottom: 3px;
    margin-left: 2px;
    border-bottom: 1px solid transparent;
}

#artist-detail-view .tab {
    font-size: var(--content-text-tab-title-size);
    /*padding-left: 15px;
    padding-right: 15px;
    margin-right: 15px;*/
    margin-right: 36px;
    padding-bottom: 5px;
    border-bottom: 3px solid transparent;
    cursor: pointer;
}

#artist-detail-view .tab-tip {
    position: absolute;
    right: 0px;
    font-weight: bold;
}

#artist-detail-view .tab-nav .active {
    font-weight: bold;
    border-color: var(--content-highlight-color);
}

#artist-detail-view .songlist {
    display: flex;
    flex-direction: column;
}

#artist-detail-view .textlist-ctl {
    padding: 0px 10px 10px 10px;
}
</style>