<script setup>
import { onMounted, onActivated, reactive, ref, watch } from 'vue';
import PlayAddAllBtn from '../components/PlayAddAllBtn.vue';
import { usePlatformStore } from '../store/platformStore'
import { usePlayStore } from '../store/playStore';
import SongListControl from '../components/SongListControl.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import { useMainViewStore } from '../store/mainViewStore';
import FavouriteShareBtn from '../components/FavouriteShareBtn.vue';
import EventBus from '../../common/EventBus';
import { useUserProfileStore } from '../store/userProfileStore';
import { toYyyymmddHhMmSs } from '../../common/Times';
import BatchDeleteBtn from '../components/BatchDeleteBtn.vue';

const { getVender } = usePlatformStore()
const { addTracks, resetQueue, playNextTrack } = usePlayStore()
const { showToast, hideSongItemCtxMenu } = useMainViewStore()
const { getCustomPlaylist } = useUserProfileStore()

const props = defineProps({
    id: String
})

const detail = reactive({})
const listSize = ref(0)
const playlistDetailRef = ref(null)
const back2TopBtnRef = ref(null)
let offset = 0
let page = 1
let limit = 1000
let markScrollTop = 0
const loading = ref(true)

const resetView = () => {
    Object.assign(detail, { cover: 'default_cover.png', title: '', about: '',data: [] })
    offset = 0
    page = 1
    detail.total = 0
    listSize.value = detail.data.length
}

const nextPage = () =>  {
    if(detail.data.length >= detail.total) return false
    offset = page * limit
    page = page + 1
    return true
}

const loadContent = () => {
    const result = getCustomPlaylist(props.id)
    Object.assign(detail, {...result})
}

const loadMoreContent = () => {
    if(nextPage()) {
        loadContent()
    }
}

const getAbout = () => {
    return (detail.about && detail.about.trim().length > 0) ? 
        detail.about.trim() : "这个人很懒，什么也没留下~"
}

const playAll = () => {
    if(detail.data.length < 1) return 
    resetQueue()
    addAll("即将为您播放全部！")
    playNextTrack()
}

const addAll = (text) => {
    if(detail.data.length < 1) return 
    addTracks(detail.data)
    showToast(text || "歌曲已全部添加！")
}

//TODO
const { addFavouritePlaylist, removeFavouritePlaylist, isFavouritePlaylist } = useUserProfileStore()
const favourited = ref(false)
const toggleFovourite = () => {
    favourited.value = !favourited.value
    let text = "歌单收藏成功！"
    if(favourited.value) {
        const { title, cover } = detail
        addFavouritePlaylist(props.id, props.platform, title, cover)
    } else {
        removeFavouritePlaylist(props.id, props.platform)
        text = "歌单已取消收藏！"
    }
    showToast(text)
}

const checkFavourite = () => {
    favourited.value = isFavouritePlaylist(props.id, props.platform)
}

const markScrollState = () => {
    markScrollTop = playlistDetailRef.value.scrollTop
}

const resetScrollState = () => {
    markScrollTop = 0
}

const restoreScrollState = () => {
    if(markScrollTop < 1) return 
    playlistDetailRef.value.scrollTop = markScrollTop
    checkFavourite()
}

const scrollToLoad = () => {
    const scrollTop = playlistDetailRef.value.scrollTop
    const scrollHeight = playlistDetailRef.value.scrollHeight
    const clientHeight = playlistDetailRef.value.clientHeight
    markScrollState()
    if((scrollTop + clientHeight) >= scrollHeight) {
       loadMoreContent()
    }
    //TODO
    hideSongItemCtxMenu()
}

const bindScrollListener = () => {
    if(!playlistDetailRef.value) return 
    playlistDetailRef.value.removeEventListener('scroll', scrollToLoad)
    playlistDetailRef.value.addEventListener('scroll', scrollToLoad)
}

const resetBack2TopBtn = () => {
    back2TopBtnRef.value.setScrollTarget(playlistDetailRef.value)
}

onActivated(() => restoreScrollState())

watch(() => props.id, () => {
    resetView()
    resetScrollState()
    resetBack2TopBtn()
    loadContent()
})

onMounted(() => {
    resetView()
    resetBack2TopBtn()
    loadContent()
    bindScrollListener()
})
</script>

<template>
    <div id="custom-playlist-detail" ref="playlistDetailRef">
        <div class="header">
            <div>
                <img class="cover" v-lazy="detail.cover" />
            </div>
            <div class="right">
                <div class="title" v-html="detail.title"></div>
                <div class="about" v-html="getAbout()"></div>
                <div class="time">
                    <span>最后更新：{{ toYyyymmddHhMmSs(detail.updated) }}</span>
                </div>
                <div class="action">
                    <PlayAddAllBtn :leftAction="playAll"  :rightAction="() => addAll()" class="btn-spacing">
                    </PlayAddAllBtn>
                    <!--
                    <FavouriteShareBtn :favourited="favourited" :leftAction="toggleFovourite">
                    </FavouriteShareBtn>
                    -->
                    <BatchDeleteBtn></BatchDeleteBtn>
                </div>
            </div>
        </div>
        <div class="center">
            <div class="list-title">歌曲({{ listSize }})</div>
            <SongListControl :data="detail.data" 
                :artistVisitable="true" 
                :albumVisitable="true" >
            </SongListControl>
        </div>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style>
#custom-playlist-detail {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 28px 33px 10px 33px;
    overflow: auto;
}

#custom-playlist-detail .header {
    display: flex;
    flex-direction: row;
    margin-bottom: 20px;
}

#custom-playlist-detail .header .right {
    flex: 1;
    margin-left: 20px;
}

#custom-playlist-detail .header .title, 
#custom-playlist-detail .header .about {
    text-align: left;
    margin-bottom: 13px;
}

#custom-playlist-detail .header .title {
    font-size: 21px;
    font-weight: bold;
}

#custom-playlist-detail .header .about {
    height: 88px;
    line-height: 20px;
    color: var(--text-sub-color);
    overflow: hidden;
    word-wrap: break-all;
    white-space:pre-wrap;
    line-break: anywhere;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 5;
    margin-bottom: 8px;
}

#custom-playlist-detail .time {
    font-size: 14px;
    color: var(--text-sub-color);
    text-align: left;
    margin-bottom: 10px;
}

#custom-playlist-detail .header .cover {
    width: 202px;
    height: 202px;
    border-radius: 6px;
    box-shadow: 0px 0px 10px #161616;
}

#custom-playlist-detail .action {
    display: flex;
    flex-direction: row;
}

#custom-playlist-detail .btn-spacing {
    margin-right: 20px;
}

#custom-playlist-detail .list-title {
    margin-bottom: 15px;
    text-align: left;
    font-size: 18px;
    background: linear-gradient(to top right, #1ca388, #28c83f);
    background: var(--hl-text-bg);
    -webkit-background-clip: text;
    color: transparent;
}
</style>