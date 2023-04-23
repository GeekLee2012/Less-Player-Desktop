<script setup>
import { onMounted, onActivated, reactive, ref, watch, inject } from 'vue';
import PlayAddAllBtn from '../components/PlayAddAllBtn.vue';
import { usePlatformStore } from '../store/platformStore'
import { usePlayStore } from '../store/playStore';
import SongListControl from '../components/SongListControl.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import { useAppCommonStore } from '../store/appCommonStore';
import FavoriteShareBtn from '../components/FavoriteShareBtn.vue';
import { useUserProfileStore } from '../store/userProfileStore';
import EventBus from '../../common/EventBus';



const { playPlaylist } = inject('player')

const { getVendor } = usePlatformStore()
const { addTracks } = usePlayStore()
const { showToast, hideAllCtxMenus } = useAppCommonStore()

const props = defineProps({
    platform: String,
    id: String
})

const detail = reactive({})
const listSizeText = ref("0")
const playlistDetailRef = ref(null)
const back2TopBtnRef = ref(null)
let offset = 0, page = 1, limit = 1000
let markScrollTop = 0
const isLoading = ref(true)

const setLoading = (value) => {
    isLoading.value = value
}

const updateListSizeText = () => {
    const total = detail.total
    const length = detail.data.length
    const text = total > length ? `${length} / ${total}` : length
    listSizeText.value = text
}

const resetView = () => {
    Object.assign(detail, { cover: 'default_cover.png', title: '', about: '', data: [] })
    offset = 0
    page = 1
    detail.total = 0
    updateListSizeText()
}

const nextPage = () => {
    //TODO
    if (detail.total < 1) return false
    offset = page * limit
    page = page + 1
    return true
}

const loadContent = async (noLoadingMask) => {
    if (!noLoadingMask) setLoading(true)
    checkFavorite()

    const vendor = getVendor(props.platform)
    if (!vendor || !vendor.playlistDetail) return
    let maxRetry = 3, retry = 0, success = false
    do {
        const result = await vendor.playlistDetail(props.id, offset, limit, page)
        if (!result || result.data.length < 1) {
            ++retry
            continue
        }
        if (page > 1) result.data.unshift(...detail.data)
        if (!result.total) detail.total = 0
        Object.assign(detail, result)
        updateListSizeText()
        setLoading(false)
        success = true
        break
    } while (retry > 0 && retry < maxRetry)
    if (!success) { //回退分页信息，并提示
        page = page - 1
        offset = page * limit
        if (offset < detail.total) showToast('网络异常！请稍候重试')
    }
}

const loadMoreContent = () => {
    if (nextPage()) {
        loadContent(true)
    }
}

const addAll = (text) => {
    addTracks(detail.data)
    showToast(text || "歌曲已全部添加！")
}

//TODO
const { addFavoritePlaylist, removeFavoritePlaylist, isFavoritePlaylist } = useUserProfileStore()
const favorited = ref(false)
const toggleFavorite = () => {
    favorited.value = !favorited.value
    let text = "歌单收藏成功！"
    if (favorited.value) {
        const { title, cover } = detail
        addFavoritePlaylist(props.id, props.platform, title, cover)
    } else {
        removeFavoritePlaylist(props.id, props.platform)
        text = "歌单已取消收藏！"
    }
    showToast(text)
}

const checkFavorite = () => {
    favorited.value = isFavoritePlaylist(props.id, props.platform)
}

const markScrollState = () => {
    if (playlistDetailRef.value) markScrollTop = playlistDetailRef.value.scrollTop
}

const resetScrollState = () => {
    markScrollTop = 0
    if (playlistDetailRef.value) playlistDetailRef.value.scrollTop = markScrollTop
}

const restoreScrollState = () => {
    if (markScrollTop < 1) return
    if (playlistDetailRef.value) playlistDetailRef.value.scrollTop = markScrollTop
    checkFavorite()
}

const scrollToLoad = () => {
    if (isLoading.value) return
    const scrollTop = playlistDetailRef.value.scrollTop
    const scrollHeight = playlistDetailRef.value.scrollHeight
    const clientHeight = playlistDetailRef.value.clientHeight
    markScrollState()
    const allowedError = 3 //允许误差
    if ((scrollTop + clientHeight + allowedError) >= scrollHeight) {
        loadMoreContent()
    }
}

//TODO
const onScroll = () => {
    hideAllCtxMenus()
    scrollToLoad()
}

const resetBack2TopBtn = () => {
    if (back2TopBtnRef.value) back2TopBtnRef.value.setScrollTarget(playlistDetailRef.value)
}

//TODO
const trimExtraHtml = (text) => {
    text = (text || '').trim()
    //TODO 暂时不处理html空白格式信息
    return text
}


/* 生命周期、监听 */
onActivated(() => restoreScrollState())

watch(() => props.id, () => {
    resetView()
    resetScrollState()
    resetBack2TopBtn()
    loadContent()
}, { immediate: true })

EventBus.on("refresh-favorite", checkFavorite)
</script>

<template>
    <div id="playlist-detail-view" ref="playlistDetailRef" @scroll="onScroll">
        <div class="header">
            <div>
                <img class="cover" v-lazy="detail.cover" />
            </div>
            <div class="right" v-show="!isLoading">
                <div class="title" v-html="detail.title"></div>
                <div class="about" v-html="trimExtraHtml(detail.about)"></div>
                <div class="action">
                    <PlayAddAllBtn :leftAction="() => playPlaylist(detail)" :rightAction="() => addAll()"
                        class="btn-spacing">
                    </PlayAddAllBtn>
                    <FavoriteShareBtn :favorited="favorited" :leftAction="toggleFavorite">
                    </FavoriteShareBtn>
                </div>
            </div>
            <div class="right" v-show="isLoading">
                <div class="title">
                    <div class="loading-mask" style="width: 88%; height: 39px; display: inline-block;"></div>
                </div>
                <div class="about">
                    <div class="loading-mask" v-for="i in 3" style="width: 100%; height: 23px; display: inline-block;">
                    </div>
                </div>
                <div class="action">
                    <div class="loading-mask btn-spacing" v-for="i in 2"
                        style="width: 188px; height: 36px; display: inline-block;"></div>
                </div>
            </div>
        </div>
        <div class="center">
            <div class="list-title">
                <div class="size-text" v-show="!isLoading">列表({{ listSizeText }})</div>
                <div class="loading-mask" v-show="isLoading"
                    style="text-align: left;width: 150px; height: 28px; display: inline-block;"></div>
            </div>
            <SongListControl :data="detail.data" :artistVisitable="true" :albumVisitable="true" :loading="isLoading">
            </SongListControl>
        </div>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style>
#playlist-detail-view {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 28px 33px 10px 33px;
    overflow: scroll;
    overflow-x: hidden;
}

#playlist-detail-view .header {
    display: flex;
    flex-direction: row;
    margin-bottom: 25px;
}

#playlist-detail-view .header .right {
    flex: 1;
    margin-left: 25px;
}

#playlist-detail-view .header .title,
#playlist-detail-view .header .about {
    text-align: left;
    margin-bottom: 10px;
}

#playlist-detail-view .header .title {
    /*font-size: 30px;*/
    font-size: var(--text-main-title-size);
    font-weight: bold;
    margin-bottom: 3px;

    overflow: hidden;
    word-wrap: break-all;
    white-space: pre-wrap;
    line-break: anywhere;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}

#playlist-detail-view .header .about {
    height: 139px;
    /*line-height: 23px;*/
    line-height: var(--text-line-height);
    color: var(--text-sub-color);
    /* font-size: 15px; */
    overflow: hidden;
    word-wrap: break-all;
    white-space: pre-wrap;
    line-break: anywhere;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 6;
}

#playlist-detail-view .header .cover {
    width: 233px;
    height: 233px;
    border-radius: 6px;
    box-shadow: 0px 0px 1px #161616;
}

#playlist-detail-view .action {
    display: flex;
    flex-direction: row;
}

#playlist-detail-view .btn-spacing {
    margin-right: 20px;
}

#playlist-detail-view .list-title {
    margin-bottom: 3px;
    text-align: left;
    font-size: 16px;
    font-weight: bold;
    background: var(--hl-text-bg);
    -webkit-background-clip: text;
    color: transparent;
}

#playlist-detail-view .list-title .size-text {
    margin-left: 3px;
}
</style>