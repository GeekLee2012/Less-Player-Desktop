<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'GenreDetailView'
}
</script>

<script setup>
import { computed, inject, onActivated, onDeactivated, onMounted, onUnmounted, reactive, ref, shallowRef, toRaw, watch, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { usePlayStore } from '../store/playStore';
import { useSettingStore } from '../store/settingStore';
import { usePlatformStore } from '../store/platformStore';
import { isDevEnv, toLowerCaseTrimString, isBlank, randomTextWithinAlphabetNums, nextInt, } from "../../common/Utils";
import AlbumListControl from '../components/AlbumListControl.vue';
import AlbumListPaginationControl from '../components/AlbumListPaginationControl.vue';
import ArtistListControl from '../components/ArtistListControl.vue';
import PlaylistsControl from '../components/PlaylistsControl.vue';
import SongListControl from '../components/SongListControl.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';



const props = defineProps({
    id: String,
    platform: String,
})

const { backward } = inject('appRoute')
const { showConfirm } = inject('apiExpose')
const { addAndPlayTracks, playVideoItem, dndSaveFile } = inject('player')


const { showToast, showFailToast, hideAllCtxMenus, } = useAppCommonStore()
const { isDndSaveEnable, isSingleLineAlbumTitleStyle, getPaginationStyleIndex } = storeToRefs(useSettingStore())
const { getVendor, isJellyfin, isEmby, getGenreTypeTabs,
    isAlbumsTab, isArtistsTab, isAllSongsTab,
 } = usePlatformStore()
const { playTrack, resetQueue, addTracks, playNextTrack, addTrack, playTrackLater } = usePlayStore()


const activeTab = ref(0)
const tabData = reactive([])
const currentTabView = shallowRef(null)

const loading = ref(false)
const keyword = ref(null)
const filteredData = ref(null)
const singleLineTitleStyle = ref(false)
const contentRef = ref(null)
const back2TopBtnRef = ref(null)
let markScrollTop = 0
const limit = 36
const maxPage = ref(-1)
const dataListId = ref(null)
const tabTipText = ref(null)

const typeTabs = getGenreTypeTabs()
const activeTabCode = () => (typeTabs[activeTab.value].code)
const setActiveTab = (value) => (activeTab.value = value)
const setCurrentTabView = (value) => (currentTabView.value = value)

const isAlbumTab = () => (isAlbumsTab(activeTabCode()))
const isArtistTab = () => (isArtistsTab(activeTabCode()))
const isSongTab = () => (isAllSongsTab(activeTabCode()))

const setLoading = (value) => (loading.value = value)
const setKeyword = (value) => (keyword.value = value)
const setFilteredData = (value) => (filteredData.value = value)
const setSingleLineTitleStyle = (value) => (singleLineTitleStyle.value = value)
const setMaxPage = (value) => {
    if(typeof value == 'number') maxPage.value = value
}
const isNormalPaginationType = computed(() => (getPaginationStyleIndex.value === 0))
const setDataListId = (value) => (dataListId.value = value)



const casTabData = (data, needReset, predicate) => {
    const isValid = (typeof predicate == 'function') ? predicate() : true
    if(needReset) tabData.length = 0
    if(isValid && data) {
        tabData.push(...data)
        updateTabTipText(data.length)
    }
    setLoading(!isValid)
    return isValid
}

const loadAlbums = async () => {
    setCurrentTabView(AlbumListControl)
    setLoading(true)

    const { id, platform } = props
    if(!id || !platform) return

    const vendor = getVendor(platform)
    if(!vendor || !vendor.genreDetailAlbums) return

    vendor.genreDetailAlbums(id).then(result => {
        if(!result) return
        const { data, total } = result
        setSingleLineTitleStyle(true)
        if(casTabData(data, true)) {
            setLoading(false)
        }
    })
}

const loadArtists = async () => {
    setCurrentTabView(ArtistListControl)
    setLoading(true)

    const { id, platform } = props
    if(!id || !platform) return

    const vendor = getVendor(platform)
    if(!vendor || !vendor.genreDetailArtists) return

    vendor.genreDetailArtists(id).then(result => {
        if(!result) return
        const { data, total } = result
        //setSingleLineTitleStyle(true)
        setMaxPage(total)
        if(casTabData(data, true)) {
            setLoading(false)
        }
    })
}

const loadSongs = async () => {
    setCurrentTabView(SongListControl)
    setLoading(true)

    const { id, platform } = props
    if(!id || !platform) return

    const vendor = getVendor(platform)
    if(!vendor || !vendor.genreDetailAllSongs) return

    return vendor.genreDetailAllSongs(id).then(result => {
        if(!result) return
        
        const { data, total } = result
        setMaxPage(total)
        if(casTabData(data, true)) {
            setLoading(false)
        }
    })
}

const resetFlowBtns = () => {
    if (back2TopBtnRef.value) back2TopBtnRef.value.setScrollTarget(contentRef.value)
}


const resetScrollState = () => {
    markScrollTop = 0
    if (contentRef.value) contentRef.value.scrollTop = markScrollTop
    resetFlowBtns()
}

const restoreScrollState = () => {
    if (markScrollTop < 1) return
    if (contentRef.value) contentRef.value.scrollTop = markScrollTop
}

const resetTab = () => {
    tabData.length = 0
    singleLineTitleStyle.value = false
    tabTipText.value = null
    setCurrentTabView(null)
    resetScrollState()
    setMaxPage(-1)
    
}

const updateTabTipText = (size) => {
    tabTipText.value = typeTabs[activeTab.value].text.replace('0', size)
}

const loadTab = () => {
    resetTab()
    if(isAlbumTab()) {
        loadAlbums()
    } else if(isArtistTab()) {
        loadArtists()
    } else if(isSongTab()) {
        loadSongs().then(() => {
            setDataListId(randomTextWithinAlphabetNums(16))
        })
    }
}

const visitTab = (index, isUserAction) => {
    if(activeTab.value == index && isUserAction) return
    setActiveTab(index)
    loadTab()
}


const onScroll = (event) => {
    hideAllCtxMenus()
    scrollToLoad(event)
}


watch(() => props.id, () => {
    visitTab(0)
}, { immediate: true })

/* 生命周期、监听 */
onMounted(() => resetScrollState())
onActivated(() => restoreScrollState())
//onDeactivated()
</script>

<template>
    <div id="genre-detail-view">
        <div class="header">
            <div class="title-wrap">
                <svg v-show="isJellyfin(platform)" width="28" height="28" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                    <defs>
                        <linearGradient id="linear-gradient" x1="47.14" y1="-8.84" x2="107.14" y2="-41.84" gradientTransform="matrix(1, 0, 0, -1, -34.5, 20)" gradientUnits="userSpaceOnUse">
                            <stop offset="0" stop-color="#aa5cc3"/>
                            <stop offset="1" stop-color="#00a4dc"/>
                        </linearGradient>
                        <linearGradient id="linear-gradient-2" x1="46.81" y1="-9.44" x2="106.81" y2="-42.44" xlink:href="#linear-gradient"/>
                    </defs>
                    <g id="Layer_2" data-name="Layer 2">
                        <g id="Layer_1-2" data-name="Layer 1">
                            <path class="cls-1" d="M24.21,49.16C22.66,46,32.84,27.59,36,27.59S49.32,46.08,47.79,49.16s-22,3.11-23.58,0Z"/>
                            <path class="cls-2" d="M.48,65C-4.19,55.6,26.48,0,36,0S76.15,55.71,71.53,65,5.16,74.39.48,65m12.26-8.15c3.06,6.15,43.52,6.08,46.55,0S42.25,14.26,36,14.26,9.67,50.69,12.74,56.85Z"/>
                        </g>
                    </g>
                </svg>
                <svg v-show="isEmby(platform)" width="32" height="32" viewBox="0 0 367.8 368.13" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path style="fill:#52b54b;" d="M198.12,368.13a70.39,70.39,0,0,1-6-4.66q-15.42-15.11-30.7-30.35c-4.37-4.32-8.77-8.6-13.07-13-4-4.11-8-8.26-11.92-12.5-4.74-5.17-9.14-10.69-14.14-15.59a47.82,47.82,0,0,0-10.53-7.33c-.92-.51-3.47.74-4.53,1.87-10.09,10.83-11.93,10.64-21.34-1-4.06-5-9-9.3-13.55-13.89-9.11-9.17-18.2-18.37-27.4-27.46-4.72-4.67-9.71-9.05-14.46-13.69-6.7-6.55-13.29-13.22-19.92-19.84-3-3-6-6.1-9.12-9.06-2.34-2.24-1.49-4,.52-5.83,3.47-3.24,6.79-6.65,10.22-9.94,8.71-8.37,17.57-16.58,26.12-25.11,7-7,13.57-14.52,20.58-21.55,3.49-3.49,7.71-6.23,11.3-9.63,4.68-4.44,9.21-9.07,13.47-13.92,1-1.13,1.52-4.13.76-5.11A106.8,106.8,0,0,0,74.06,99.32c-2.43-2.36-2.69-4-.15-6.58q45.53-45.33,90.85-90.86c2.72-2.74,4.43-2.32,6.92.2,17.95,18.11,36.11,36,54,54.21,5.2,5.3,9.54,11.44,14.44,17.05,3.25,3.72,6.87,7.1,10.18,10.76,3.59,4,7.86,3.22,12.08-2a40.56,40.56,0,0,1,7.21-7.25,5.22,5.22,0,0,1,5,.39c10.29,10.15,20.29,20.59,30.48,30.84,6.22,6.25,12.71,12.22,19,18.43,13.71,13.63,27.25,27.42,41.09,40.93,3.34,3.26,3.73,5.25.18,8.75-26,25.68-51.74,51.56-77.57,77.37a24.84,24.84,0,0,1-2.19,2c-4.85,3.82-4.64,5.85.78,9.19a22.81,22.81,0,0,1,4.67,3.66c4,4.27,3.65,5.7-.5,9.9-4.64,4.7-8.79,9.88-13.45,14.55-3.37,3.38-7.49,6-10.82,9.43C259,307.79,252.2,315.62,245,323c-3.68,3.77-8.1,6.81-11.9,10.47-9.51,9.14-18.88,18.43-28.27,27.69C202.68,363.26,200.69,365.45,198.12,368.13Zm-61-117c.78,6.22,2.34,7.5,7.78,4.69,9.73-5,19.28-10.43,28.82-15.83,7.21-4.08,14.22-8.53,21.45-12.59,6.84-3.84,14-7.17,20.76-11.14,5.59-3.27,10.65-7.46,16.25-10.72,10-5.79,20.17-11.11,30.15-16.84,1.68-1,2.76-2.94,4.12-4.45-1.48-.85-2.95-1.71-4.43-2.55-.71-.41-1.47-.74-2.16-1.19-6.08-4-12-8.13-18.27-11.81-4.07-2.41-8.69-3.89-12.84-6.18-3-1.66-5.52-4.21-8.5-5.93-6.26-3.63-12.75-6.85-19-10.44-10.88-6.23-21.62-12.7-32.5-18.92-7.77-4.45-15.71-8.61-23.52-13-5.54-3.12-7.73-2-8.06,4.56-.08,1.66,0,3.33,0,5Z"/></g></g></svg>
                <div class="title">流派</div>
            </div>
            <div class="tip-text about" v-show="false">
                <p>提示：限于官方API，曲库中的专辑数量、歌曲数量无法确定</p>
                <p>所以，专辑Tab最大分页固定为300；歌曲Tab为随机500首（已达API上限）</p>
            </div>
            <div class="tabs">
                <span class="tab" v-for="(tab, index) in typeTabs"
                    :class="{ active: activeTab == index, 'content-text-highlight': activeTab == index }"
                    @click="visitTab(index, true)" v-html="tab.name">
                </span>
                <span class="tab-tip content-text-highlight" v-show="tabTipText" v-html="tabTipText"></span>
            </div>
        </div>
        <div class="center">
            <div class="content" ref="contentRef" @scroll="onScroll">
                <component
                    :id="dataListId"
                    :is="currentTabView" 
                    :data="tabData" 
                    :limit="limit" 
                    :loading="loading"
                    :maxPage="maxPage"
                    :singleLineTitleStyle="singleLineTitleStyle"
                    :playable="true"
                    :artistVisitable="true"
                    :albumVisitable="true"
                    :needReset="true"
                    :hideExtra="true" >
                </component>
            </div>
        </div>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style>
#genre-detail-view .cls-1 {
    fill: url(#linear-gradient);
}

#genre-detail-view .cls-2 {
    fill-rule: evenodd;
    fill: url(#linear-gradient-2);
}

#genre-detail-view {
    display: flex;
    flex-direction: column;
    flex: 1;
    /*padding: 20px 33px 10px 33px;*/
    padding: 20px 0px 0px 0px;
    overflow: hidden;
}

#genre-detail-view .spacing {
    margin-left: 20px;
}

#genre-detail-view .to-right {
    position: absolute;
    right: 0px;
}

#genre-detail-view .tab-tip {
    position: absolute;
    right: 10px;
    font-weight: bold;
}

#genre-detail-view .categories {
    --height-factor: 20px;
    position: fixed;
    top: calc(var(--main-top-height) + 3px + var(--app-win-custom-shadow-size) + var(--height-factor) / 2);
    right: calc(0px + var(--app-win-custom-shadow-size));
    height: calc(100% - var(--main-top-height) - var(--main-bottom-height) - 6px - 30px - var(--app-win-custom-shadow-size) * 2 - var(--height-factor));
    padding: 20px 0px;
    background: var(--app-bg-color);
    z-index: 99;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    overflow: auto;
    overflow-x: hidden;
    box-shadow: var(--box-shadow);
    border-top-left-radius: var(--border-popover-border-radius);
    border-bottom-left-radius: var(--border-popover-border-radius);
}

#genre-detail-view .categories ul {
    padding: 0px 15px;
    background: transparent;
}

#genre-detail-view .categories li {
    list-style: none;
    padding: 6px 0px 6px 0px;
    width: 88px;
    margin-top: 8px;
    text-align: center;
    font-size: calc(var(--content-text-size) - 1px);
    border-radius: var(--border-list-item-vertical-border-radius);
    cursor: pointer;
}

#genre-detail-view .categories li.first {
    margin-top: 0px;
}

#genre-detail-view .categories li:hover {
    background: var(--button-icon-text-btn-bg-color);
    color: var(--button-icon-text-btn-text-color);
    transform: scale(1.03);
}

.contrast-mode #genre-detail-view .categories li:hover {
    font-weight: bold;
}



#genre-detail-view .header {
    display: flex;
    flex-direction: column;
    margin-bottom: 5px;
    padding: 0px 33px 0px 33px;
}

#genre-detail-view .header .title-wrap {
    display: flex;
    align-items: center;
    position: relative;
    font-weight: bold;
}

#genre-detail-view .header .title-wrap .title {
    text-align: left;
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
    margin-left: 6px;
}

#genre-detail-view .header .title-wrap .options {
    display: flex;
    align-items: center;
    margin-right: 6px;
    height: 100%;
}

#genre-detail-view .about {
    text-align: left;
    margin-bottom: 0px;
    margin-top: 10px;
    color: var(--content-subtitle-text-color);
}

#genre-detail-view .header .action {
    display: flex;
}

#genre-detail-view .header .tabs {
    display: flex;
    align-items: center;
    text-align: left;
    padding-bottom: 0px;
    border-bottom: 1px solid var(--border-color);
    border-bottom: 1px solid transparent;
    margin-top: 0px;
    position: relative;
}

#genre-detail-view .header .tab {
    font-size: var(--content-text-tab-title-size);
    padding: 8px 0px 5px 0px;
    margin-right: 36px;
    border-bottom: 3px solid transparent;
    cursor: pointer;
}

#genre-detail-view .header .active {
    font-weight: bold;
    border-bottom: 3px solid var(--content-highlight-color);
}


#genre-detail-view .header .cate-btn {
    margin-right: 15px;
    display: flex;
    justify-content: center;
    align-items: center;
}

#genre-detail-view .center {
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

#genre-detail-view .center .list-title {
    margin-bottom: 6px;
    text-align: left;
    display: flex;
    position: relative;
    padding: 0px 33px 0px 33px;
}

#genre-detail-view .center .list-title .size-text {
    font-weight: bold;
    margin-left: 3px;
    padding-bottom: 6px;
    border-bottom: 3px solid var(--content-highlight-color);
    font-size: var(--content-text-tab-title-size);
    cursor: pointer;
}

#genre-detail-view .center .list-title .size-text.loading-mask {
    border-color: transparent;
}

#genre-detail-view .center .list-title .size-text svg {
    fill: var(--content-highlight-color);
    transform: translateY(2px);
}

#genre-detail-view .center .list-title .size-text span {
    margin-left: 5px;
}

#genre-detail-view .center .list-title .action {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-right: 38px;
}

#genre-detail-view .center .location {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    text-align: left;
    word-wrap: break-word;
    line-break: anywhere;
    color: var(--content-subtitle-text-color);
    font-size: calc(var(--content-text-size) - 1px);
    padding: 3px 36px 12px 36px;
    min-height: 20px;
}

#genre-detail-view .center .location .current {
    word-wrap: break-word;
    line-break: anywhere;
    margin-left: 10px;
}

#genre-detail-view .center .content {
    overflow: scroll;
    overflow-x: hidden;
    padding: 0px 33px 0px 33px;
}

#genre-detail-view .center .content.list-view .item {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    flex: 1;
    margin-bottom: 8px;
    border-radius: var(--border-inputs-border-radius);
    border-radius: var(--border-list-item-vertical-border-radius);
    /*box-shadow: 0px 0px 3px var(--border-popovers-border-color);*/
    --item-height: 63px;
}

#genre-detail-view .center .item:hover {
    background: var(--content-list-item-hover-bg-color);
    cursor: pointer;
}

#genre-detail-view .center .content.list-view  .item > div {
    height: var(--item-height);
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex: 1;
    /*font-size: var(--content-text-size);*/
}

#genre-detail-view .center .content.list-view  .item .sqno {
    min-width: 36px;
    padding-left: 10px;
    flex: 1;
}

#genre-detail-view .center .content.list-view  .item .icon {
    width: 50px;
    max-width: 50px;
    flex: 1;
    padding-left: 10px;
}

#genre-detail-view .center .content .item .icon svg {
    fill: var(--button-icon-btn-color) !important;
    fill: var(--content-subtitle-text-color) !important;
    border-radius: var(--border-img-small-border-radius);
}

#genre-detail-view .center .content.list-view  .item .title {
    flex: 10;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    text-align: left;
    word-wrap: break-word;
    line-break: anywhere;
    margin-right: 15px;
    position: relative;
}

#genre-detail-view .center .content .item .title span {
    word-wrap: break-word;
    line-break: anywhere;
    line-height: var(--item-height);
}

#genre-detail-view .center .content.list-view .item .title .action {
    z-index: 2;
    height: 100%;

    position: absolute;
    top: 0px;
    left: 68%;

    display: flex;
    flex-direction: row;
    align-items: center;

    padding-left: 10px;
    padding-right: 10px;
    
    visibility: hidden;
}

#genre-detail-view .center .content.list-view .item .title:hover span {
    width: 66%;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    word-wrap: break-word;
    line-break: anywhere;
}

#genre-detail-view .center .content .item .title:hover .action {
    visibility: visible;
}

#genre-detail-view .center .content .item .action svg {
    fill: var(--button-icon-btn-color);
}

#genre-detail-view .center .content .item .action svg:hover {
    fill: var(--content-highlight-color);
}

#genre-detail-view .center .content.list-view  .item .size {
    min-width: 88px;
    margin-right: 15px;
    justify-content: flex-end
}

#genre-detail-view .center .content.list-view  .item .type {
    min-width: 39px;
}

#genre-detail-view .center .content.list-view  .item .updated {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-end;
    min-width: 115px;
    padding-right: 10px;
    /*font-size: var(--content-text-tip-text-size);*/
    font-size: calc(var(--content-text-size) - 1px);
}

#genre-detail-view .center .content.list-view  .item .updated .hms {
    margin-bottom: 3px;
}

#genre-detail-view .center .content.grid-view {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    flex: 1;
}

#genre-detail-view .center .content.grid-view .item {
    flex: none;
    width: 100px;
    padding: 15px 8px 15px 8px;
    margin-right: 3px;
    margin-left: 12px;
    margin-bottom: 18px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    border-radius: var(--border-list-item-vertical-border-radius);
    position: relative;
}

#genre-detail-view .center .content.grid-view  .item .title {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    text-align: center;
    word-wrap: break-word;
    line-break: anywhere;
    margin-top: 3px;
    /*font-size: calc(var(--content-text-size) - 1px);*/
}

#genre-detail-view .center .content.grid-view .item .action {
    z-index: 3;
    padding: 12px 15px;
    position: absolute;
    width: calc(100% - 30px);
    bottom: 0px;
    left: 0px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    
    visibility: hidden;
    border-bottom-left-radius: var(--border-list-item-vertical-border-radius);
    border-bottom-right-radius: var(--border-list-item-vertical-border-radius);
}

#genre-detail-view .center .content.grid-view .item:hover .action {
    visibility: visible;
    background: var(--content-list-item-hover-bg-color);
}
</style>