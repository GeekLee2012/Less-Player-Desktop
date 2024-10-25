<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'EmbySessionDetailView'
}
</script>

<script setup>
import { computed, inject, onActivated, onDeactivated, onMounted, onUnmounted, reactive, ref, shallowRef, toRaw, watch, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { usePlayStore } from '../store/playStore';
import { useSettingStore } from '../store/settingStore';
import { usePlatformStore } from '../store/platformStore';
import { useCloudStorageStore } from '../store/cloudStorageStore';
import { isDevEnv, toLowerCaseTrimString, isBlank, randomTextWithinAlphabetNums, nextInt, } from "../../common/Utils";
import { Emby } from '../../vendor/emby';
import SearchBarExclusiveModeControl from '../components/SearchBarExclusiveModeControl.vue';
import AlbumListPaginationControl from '../components/AlbumListPaginationControl.vue';
import ArtistListControl from '../components/ArtistListControl.vue';
import PlaylistsControl from '../components/PlaylistsControl.vue';
import SongListControl from '../components/SongListControl.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';



const props = defineProps({
    id: String
})

const { backward } = inject('appRoute')
const { showConfirm } = inject('apiExpose')
const { addAndPlayTracks, playVideoItem, dndSaveFile } = inject('player')


const { showToast, showFailToast, hideAllCtxMenus, } = useAppCommonStore()
const { isDndSaveEnable, isSingleLineAlbumTitleStyle, getPaginationStyleIndex } = storeToRefs(useSettingStore())
const { getEmbyTypeTabs, isAllSongsTab, isPlaylistsTab, 
    isAlbumsTab, isFMRadiosTab, isArtistsTab, 
    isGenresTab, isFoldersTab, } = usePlatformStore()
const { playTrack, resetQueue, addTracks, playNextTrack, addTrack, playTrackLater } = usePlayStore()
//const {  } = storeToRefs(useCloudStorageStore())
const { getEmbySession, } = useCloudStorageStore()


const activeTab = ref(0)
const tabData = reactive([])
const currentTabView = shallowRef(null)
const currentSession = ref(null)
const currentCate = ref(null)
const categoriesShow = ref(false)
const categories = reactive([])
const albumCategories = reactive([])
const artistCategories = reactive([])
const loading = ref(false)
const viewMode = ref(0)
const keyword = ref(null)
const filteredData = ref(null)
const singleLineTitleStyle = ref(false)
const contentRef = ref(null)
const back2TopBtnRef = ref(null)
let markScrollTop = 0
const limit = 36
const maxPage = ref(-1)
const dataListId = ref(null)

const setDataListId = (value) => (dataListId.value = value)
const setCategories = (value) => {
    categories.length = 0
    if(value) categories.push(...value)
}
const setAlbumCategories = (value) => {
    albumCategories.length = 0
    if(value) albumCategories.push(...value)
}
const setArtistCategories = (value) => {
    artistCategories.length = 0
    if(value) artistCategories.push(...value)
}
const setCurrentCate = (value) => (currentCate.value = value)
const setCategoriesShow = (value) => (categoriesShow.value = value)
const toggleCategories = () => setCategoriesShow(!categoriesShow.value)

const setActiveTab = (value) => (activeTab.value = value)
const setCurrentTabView = (value) => (currentTabView.value = value)

const setCurrentSession = (value) => (currentSession.value = value)
const setViewMode = (value) => (viewMode.value = value)
const setLoading = (value) => (loading.value = value)
const setKeyword = (value) => (keyword.value = value)
const setFilteredData = (value) => (filteredData.value = value)
const setSingleLineTitleStyle = (value) => (singleLineTitleStyle.value = value)
const setMaxPage = (value) => {
    if(typeof value == 'number') maxPage.value = value
}

const typeTabs = getEmbyTypeTabs()
const activeTabCode = () => (typeTabs[activeTab.value].code)
const isSongTab = () => (isAllSongsTab(activeTabCode()))
const isPlaylistTab = () => (isPlaylistsTab(activeTabCode()))
const isAlbumTab = () => (isAlbumsTab(activeTabCode()))
const isFmRadioTab = () => (isFMRadiosTab(activeTabCode()))
const isArtistTab = () => (isArtistsTab(activeTabCode()))
const isGenreTab = () => (isGenresTab(activeTabCode()))
const isFolderTab = () => (isFoldersTab(activeTabCode()))
const isNormalPaginationType = computed(() => (getPaginationStyleIndex.value === 0))
const needRefreshSession = ref(false)
const setNeedRefreshSession = (value) => (needRefreshSession.value = value)



const setupSession = async () => {
    if(!props.id) return
    const session = getEmbySession(props.id) || { title: 'Emby' }
    setCurrentSession(session)
    return Emby.setSession(session)
}

const resetTab = () => {
    tabData.length = 0
    singleLineTitleStyle.value = false
    setCurrentTabView(null)
    resetScrollState()
    setMaxPage(-1)
}

const loadAlbumCategories = async () => {
    if(albumCategories.length > 0) return false
    const result = await Emby.albumCategories()
    setAlbumCategories(result && result.data)
    return true
}

const casTabData = (data, needReset, predicate) => {
    const isValid = (typeof predicate == 'function') ? predicate() : true
    if(needReset) tabData.length = 0
    if(isValid && data) tabData.push(...data)
    setLoading(!isValid)
    return isValid
}

const loadAlbums = async () => {
    setLoading(true)
    setCurrentTabView(AlbumListPaginationControl)

    await loadAlbumCategories()
    setCategories(albumCategories)
    
    const { value: cate } = currentCate.value || { value: '' }
    Emby.albumSquare(cate, 0, limit, 1).then(result => {
        if(!result) return
        const { data, total } = result
        setMaxPage(total)
        setSingleLineTitleStyle(true)
        if(casTabData(data, true, isAlbumTab)) {
            setLoading(false)
        }
    })
}

const loadArtists = async () => {
    setLoading(true)
    setCurrentTabView(ArtistListControl)

    const { value: cate } = currentCate.value || { value: '' }
    Emby.artistSquare(cate, 0, limit, 1).then(result => {
        if(!result) return
        const { data, categories } = result
    
        setArtistCategories(categories && categories.data)
        setCategories(artistCategories)
        if(casTabData(data, true, isArtistTab)) {
            setLoading(false)
        }
    })
}

const loadPlaylists = async () => {
    setLoading(true)
    setCurrentTabView(PlaylistsControl)
    Emby.playlistSquare('', 0, limit, 1).then(result => {
        if(!result) return
        const { data, } = result
        if(casTabData(data, true, isPlaylistTab)) {
            setLoading(false)
        }
    })
}

const loadSongs = async () => {
    setLoading(true)
    setCurrentTabView(SongListControl)
    return Emby.songSquare('', 0, limit, 1).then(result => {
        if(!result) return
        const { data, total } = result
        setMaxPage(total)
        if(casTabData(data, true, isSongTab)) {
            setLoading(false)
        }
    })
}

const loadRadios = async () => {
    setLoading(true)
    setCurrentTabView(PlaylistsControl)
    Emby.radioSquare('', 0, limit, 1).then(result => {
        if(!result) return
        const { data, } = result
        if(casTabData(data, true, isFmRadioTab)) {
            setLoading(false)
        }
    })
}

const loadGenres = async () => {
    setLoading(true)
    setCurrentTabView(PlaylistsControl)
    Emby.genresSquare('', 0, limit, 1).then(result => {
        if(!result) return
        const { data, total } = result
        //if(typeof total == 'number') setMaxPage(total)
        if(casTabData(data, true, isGenreTab)) {
            setLoading(false)
        }
    })
}

const loadFolders = async () => {
    setLoading(true)
    setCurrentTabView(PlaylistsControl)
    Emby.folderSquare('', 0, limit, 1).then(result => {
        if(!result) return
        const { data, } = result
        if(casTabData(data, true, isFolderTab)) {
            setLoading(false)
        }
    })
}

const loadTab = () => {
    resetTab()
    if(isAlbumTab()) {
        setCurrentCate(albumCategories[0])
        loadAlbums()
    } else if(isArtistTab()) {
        setCurrentCate(artistCategories[0])
        loadArtists()
    } else if(isPlaylistTab()) {
        loadPlaylists()
    } else if(isSongTab()) {
        loadSongs().then(() => setDataListId(randomTextWithinAlphabetNums(16)))
    } else if(isFmRadioTab()) {
        loadRadios()
    } else if(isGenreTab()) {
        loadGenres()
    } else if(isFolderTab()) {
        loadFolders()
    }
}

const visitTab = (index, isUserAction) => {
    refreshSession()
    if(activeTab.value == index && isUserAction) return
    setActiveTab(index)
    loadTab()
}

const markScrollState = () => {
    if (contentRef.value) markScrollTop = contentRef.value.scrollTop
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

const resetFlowBtns = () => {
    if (back2TopBtnRef.value) back2TopBtnRef.value.setScrollTarget(contentRef.value)
}

const refreshAllPendingMark = ref(0)
const nextPagePendingMark = ref(0)
const scrollToLoad = (event) => {
    if (loading.value) return
    const { scrollTop, scrollHeight, clientHeight } = contentRef.value
    markScrollState()
    const allowedError = 10 //允许误差
    if ((scrollTop + clientHeight + allowedError) >= scrollHeight) {
        nextPagePendingMark.value = Date.now()
    }
}

const onPageLoaded = () => {
    if (isNormalPaginationType.value) resetScrollState()
}

const loadPageContent = async ({ offset, page, limit }) => {
    const isNormalType = isNormalPaginationType.value
    if (isNormalType) resetScrollState()
    return loadContent((!isNormalType && page > 1), offset, limit, page)
}

const loadContent = async (noLoadingMask, offset, limit, page) => {
    if(!noLoadingMask) setLoading(true)

    let loadAction = null, needReset = false, predicate = null
    if(isAlbumTab()) {
        loadAction = Emby.albumSquare
        predicate = isAlbumTab
    } else if(isPlaylistTab()) {
        loadAction = Emby.playlistSquare
        needReset = true
        predicate = isPlaylistTab
    } else if(isSongTab()) {
        loadAction = Emby.songSquare
        needReset = true
        predicate = isSongTab
    } else if(isFmRadioTab()) {
        loadAction = Emby.radioSquare
        needReset = true
        predicate = isFmRadioTab
    } else if(isGenreTab()) {
        loadAction = Emby.genresSquare
        needReset = true
        predicate = isGenreTab
    }
    if(!loadAction) return

    const { value: cate } = currentCate.value || { value: '' }
    const result = await loadAction(cate, offset, limit, page)
    if(!result) return

    setSingleLineTitleStyle(true)
    const { data, total } = result
    const _needReset = (isNormalPaginationType.value || needReset)
    if(casTabData(data, _needReset, predicate)) {
        setLoading(false)
    }
    return { data, total, limit }
}

const onScroll = (event) => {
    hideAllCtxMenus()
    setCategoriesShow(false)
    scrollToLoad(event)
}

const resetFilter = () => {
    setKeyword(null)
    setFilteredData(null)
}

const filterContent = (keyword) => {
    setKeyword(keyword)
    if(isBlank(keyword)) return resetFilter()
    if(tabData.length < 1) return

    const _keyword = toLowerCaseTrimString(keyword)
    const list = tabData.filter(item => {
        const { basename } = item
        const title = toLowerCaseTrimString(basename)
        return title.includes(_keyword)
    }) || []
    setFilteredData(list)
}

const computedSessionTitle = computed(() => {
    const { title, } = currentSession.value || {}
    return title || 'Emby'
})

const computedTabData = computed(() => {
    return filteredData.value || tabData
})

const computedTabDataLength = computed(() => {
    const total = tabData.length
    const filtered = computedTabData.value.length
    return filtered == total ? total : `${filtered}/${total}`
})

const computedCurrentCateTitle = computed(() => {
    const item = currentCate.value
    if(!item) {
        if(isAlbumTab()) return '全部'
        if(isArtistTab()) return '全部'
        return ''
    }
    return item.key.replace('%', '未知')
            .replace('#', '全部')
})

const computedCateTitle = computed(() => {
    return (item) => {
        if(!item) return ''
        return item.key.replace('[Unknown]', '%')
    }
})

const visitCate = (item) => {
    setCategoriesShow(false)
    setCurrentCate(item)
    resetScrollState()
    if(isAlbumTab()) {
        setCategories(albumCategories)
        loadAlbums()
    } else if(isArtistTab()) {
        setCategories(artistCategories)
        loadArtists()
    }
}

const playAll = () => {
    if(tabData.length < 1) return 

    addAndPlayTracks(tabData, true, '即将为您播放当前页')
}

const randomPlay = () => {
    const pages = maxPage.value
    if(!pages || pages < 1) return
    const page = Math.max(1, nextInt(pages))
    const offset = limit * (page - 1)
    Emby.songSquare('', offset, limit, page).then(result => {
        if(!result) return
        const { data, total } = result
        if(!data || data.length < 1) return
        const index = nextInt(data.length)
        showToast('即将为您随缘一曲')
        playTrack(data[index])
    })
}

const addAll = () => {
    if(tabData.length < 1) return 

    addTracks(tabData)
    showToast('当前页歌曲已添加')
}

const refreshSession = () => {
    if(!needRefreshSession.value) return
    setupSession().then(success => {
        setNeedRefreshSession(false)
        if(loading.value) visitTab(activeTab.value)
    })
}

watch(() => props.id, () => {
    setNeedRefreshSession(true)
    visitTab(0)
}, { immediate: true })

/* 生命周期、监听 */
onMounted(() => resetScrollState())
onActivated(() => restoreScrollState())
onDeactivated(() => setCategoriesShow(false))
</script>

<template>
    <div id="emby-session-detail-view" @click="() => setCategoriesShow(false)">
        <div class="header">
            <div class="title-wrap">
                <svg width="32" height="32" viewBox="0 0 367.8 368.13" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path style="fill:#52b54b;" d="M198.12,368.13a70.39,70.39,0,0,1-6-4.66q-15.42-15.11-30.7-30.35c-4.37-4.32-8.77-8.6-13.07-13-4-4.11-8-8.26-11.92-12.5-4.74-5.17-9.14-10.69-14.14-15.59a47.82,47.82,0,0,0-10.53-7.33c-.92-.51-3.47.74-4.53,1.87-10.09,10.83-11.93,10.64-21.34-1-4.06-5-9-9.3-13.55-13.89-9.11-9.17-18.2-18.37-27.4-27.46-4.72-4.67-9.71-9.05-14.46-13.69-6.7-6.55-13.29-13.22-19.92-19.84-3-3-6-6.1-9.12-9.06-2.34-2.24-1.49-4,.52-5.83,3.47-3.24,6.79-6.65,10.22-9.94,8.71-8.37,17.57-16.58,26.12-25.11,7-7,13.57-14.52,20.58-21.55,3.49-3.49,7.71-6.23,11.3-9.63,4.68-4.44,9.21-9.07,13.47-13.92,1-1.13,1.52-4.13.76-5.11A106.8,106.8,0,0,0,74.06,99.32c-2.43-2.36-2.69-4-.15-6.58q45.53-45.33,90.85-90.86c2.72-2.74,4.43-2.32,6.92.2,17.95,18.11,36.11,36,54,54.21,5.2,5.3,9.54,11.44,14.44,17.05,3.25,3.72,6.87,7.1,10.18,10.76,3.59,4,7.86,3.22,12.08-2a40.56,40.56,0,0,1,7.21-7.25,5.22,5.22,0,0,1,5,.39c10.29,10.15,20.29,20.59,30.48,30.84,6.22,6.25,12.71,12.22,19,18.43,13.71,13.63,27.25,27.42,41.09,40.93,3.34,3.26,3.73,5.25.18,8.75-26,25.68-51.74,51.56-77.57,77.37a24.84,24.84,0,0,1-2.19,2c-4.85,3.82-4.64,5.85.78,9.19a22.81,22.81,0,0,1,4.67,3.66c4,4.27,3.65,5.7-.5,9.9-4.64,4.7-8.79,9.88-13.45,14.55-3.37,3.38-7.49,6-10.82,9.43C259,307.79,252.2,315.62,245,323c-3.68,3.77-8.1,6.81-11.9,10.47-9.51,9.14-18.88,18.43-28.27,27.69C202.68,363.26,200.69,365.45,198.12,368.13Zm-61-117c.78,6.22,2.34,7.5,7.78,4.69,9.73-5,19.28-10.43,28.82-15.83,7.21-4.08,14.22-8.53,21.45-12.59,6.84-3.84,14-7.17,20.76-11.14,5.59-3.27,10.65-7.46,16.25-10.72,10-5.79,20.17-11.11,30.15-16.84,1.68-1,2.76-2.94,4.12-4.45-1.48-.85-2.95-1.71-4.43-2.55-.71-.41-1.47-.74-2.16-1.19-6.08-4-12-8.13-18.27-11.81-4.07-2.41-8.69-3.89-12.84-6.18-3-1.66-5.52-4.21-8.5-5.93-6.26-3.63-12.75-6.85-19-10.44-10.88-6.23-21.62-12.7-32.5-18.92-7.77-4.45-15.71-8.61-23.52-13-5.54-3.12-7.73-2-8.06,4.56-.08,1.66,0,3.33,0,5Z"/></g></g></svg>
                <div class="title" v-html="computedSessionTitle"></div>
            </div>
            <div class="tabs">
                <span class="tab" v-for="(tab, index) in typeTabs"
                    :class="{ active: activeTab == index, 'content-text-highlight': activeTab == index }"
                    @click="visitTab(index, true)" v-html="tab.name">
                </span>
                <div class="cate-btn btn text-btn to-right" 
                    v-show="activeTab <= 1 && categories && categories.length > 0"
                    @click.stop="toggleCategories">
                    <svg width="17" height="17" viewBox="0 0 29.3 29.3">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M23.51,15.66H17.3a1.55,1.55,0,0,0-.56.11,1.45,1.45,0,0,0-1.11,1.41v6.38a5.77,5.77,0,0,0,5.76,5.76h2.16a5.76,5.76,0,0,0,5.75-5.76V21.41a5.76,5.76,0,0,0-5.77-5.75Zm2.85,7.91a2.86,2.86,0,0,1-2.85,2.86H21.35a2.86,2.86,0,0,1-2.85-2.86v-5h5a2.86,2.86,0,0,1,2.85,2.86ZM12.52,15.76a1.55,1.55,0,0,0-.56-.11H5.75A5.76,5.76,0,0,0,0,21.41v2.15a5.76,5.76,0,0,0,5.75,5.76H7.91a5.78,5.78,0,0,0,5.72-5.76V17.18A1.47,1.47,0,0,0,12.52,15.76Zm-1.76,7.8a2.86,2.86,0,0,1-2.85,2.86H5.75A2.86,2.86,0,0,1,2.9,23.56V21.41a2.86,2.86,0,0,1,2.85-2.86h5Zm-5-9.89H12a1.55,1.55,0,0,0,.56-.11,1.45,1.45,0,0,0,1.1-1.42V5.76A5.77,5.77,0,0,0,7.87,0H5.75A5.76,5.76,0,0,0,0,5.76V7.91a5.77,5.77,0,0,0,5.75,5.75ZM2.9,5.76A2.86,2.86,0,0,1,5.75,2.9H7.91a2.86,2.86,0,0,1,2.85,2.86v5h-5A2.86,2.86,0,0,1,2.91,7.9ZM23.51,0H21.35a5.78,5.78,0,0,0-5.72,5.76v6.38a1.45,1.45,0,0,0,1.15,1.42,1.55,1.55,0,0,0,.56.11h6.21A5.76,5.76,0,0,0,29.3,7.91V5.76A5.76,5.76,0,0,0,23.54,0Zm2.85,7.91a2.86,2.86,0,0,1-2.85,2.86h-5v-5a2.86,2.86,0,0,1,2.85-2.86h2.16a2.86,2.86,0,0,1,2.85,2.86Z" />
                            </g>
                        </g>
                    </svg>
                    <span v-html="computedCurrentCateTitle"></span>
                </div>
                <transition name="fade-ex">
                    <div class="categories" v-show="categoriesShow && categories && categories.length > 0">
                        <ul>
                            <li class="cate-item" v-for="(item, index) in categories"
                                :class="{ first: (index == 0)}"
                                v-html="computedCateTitle(item)" 
                                @click.stop="visitCate(item)">
                            </li>
                        </ul>
                    </div>
                </transition>
                <div class="action to-right" v-show="activeTab == 2">
                    <SvgTextButton text="播放全部" 
                        :leftAction="playAll" 
                        :rightAction="addAll" >
                        <template #left-img>
                            <svg width="15" height="15" viewBox="0 0 139 139" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"
                                xmlns:xlink="http://www.w3.org/1999/xlink">
                                <path
                                    d="M117.037,61.441L36.333,14.846c-2.467-1.424-5.502-1.424-7.972,0c-2.463,1.423-3.982,4.056-3.982,6.903v93.188  c0,2.848,1.522,5.479,3.982,6.9c1.236,0.713,2.61,1.067,3.986,1.067c1.374,0,2.751-0.354,3.983-1.067l80.704-46.594  c2.466-1.422,3.984-4.054,3.984-6.9C121.023,65.497,119.502,62.866,117.037,61.441z" />
                            </svg>
                        </template>
                        <template #right-img>
                            <svg width="17" height="17" viewBox="0 0 768.02 554.57" xmlns="http://www.w3.org/2000/svg">
                                <g id="Layer_2" data-name="Layer 2">
                                    <g id="Layer_1-2" data-name="Layer 1">
                                        <path
                                            d="M341.9,0q148,0,296,0C659,0,675,11.28,680.8,30.05c8.34,26.78-11.43,54.43-39.45,55.18-1.17,0-2.33,0-3.5,0q-296.46,0-592.93,0C22.37,85.25,5.32,71.87.87,50.78-4.36,26,14.59,1.39,39.94.12c2.49-.13,5-.11,7.5-.11Z" />
                                        <path
                                            d="M554.64,426.5h-6.72c-26.49,0-53,.17-79.47-.1a41.87,41.87,0,0,1-39.06-27.7,42.4,42.4,0,0,1,11.2-46.19,41.85,41.85,0,0,1,29.11-11.25q39.49,0,79,0h6V335c0-26-.12-52,0-78,.15-25.3,19.44-44.3,44.06-43.72,23.23.55,41.24,19.54,41.37,43.92.13,25.82,0,51.65,0,77.48v6.57h5.67c26.65,0,53.31-.11,80,.05,20.38.12,37.94,14.9,41.51,34.49,3.74,20.57-7.15,40.65-26.59,47.73a53.72,53.72,0,0,1-17.56,2.85c-25.66.3-51.32.13-77,.13h-6v6.36c0,26,.1,52,0,78-.11,20.74-13.1,37.68-32.17,42.41-27.42,6.8-53-13.28-53.24-42.11-.22-26-.05-52-.05-78Z" />
                                        <path
                                            d="M234.37,256q-94.73,0-189.44,0c-21.55,0-38.62-12.68-43.5-32.09-6.74-26.8,12.45-52.1,40.47-53.35,1.33-.06,2.67-.05,4-.05H423.78c21.17,0,37.53,11.12,43.49,29.46,9.15,28.13-11.52,55.87-42,56-36.32.15-72.64,0-109,0Z" />
                                        <path
                                            d="M170.91,426.5c-42.48,0-85,.07-127.45,0-20.94-.06-37.61-13.2-42.21-32.85-6.18-26.41,13.5-52,40.6-52.3,23.82-.27,47.65-.07,71.47-.07q92.46,0,184.93,0c24.55,0,43.52,19.37,43.12,43.58-.38,23.41-19.15,41.53-43.51,41.61-40,.12-80,0-120,0Z" />
                                    </g>
                                </g>
                            </svg>
                        </template>
                    </SvgTextButton>
                    <SvgTextButton text="随缘听" 
                        :leftAction="randomPlay"
                        class="spacing" >
                        <template #left-img>
                            <svg width="16" height="16" viewBox="0 0 768.11 768.93" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M384.2,509.12c-5.62,8.58-10.61,17-16.38,24.87-42.57,58-99.37,92.91-170.52,104A234.9,234.9,0,0,1,163,640.81c-43.5.32-87,.21-130.5.12C14.67,640.89.6,627.39.06,610.2-.53,591.75,13.72,577,32.51,577q63-.13,126,0c38.3,0,73.92-9.69,105.81-31,51.79-34.55,81.47-83,86.79-145.17A190.91,190.91,0,0,0,200.48,197.4c-14.06-3-28.73-4.05-43.14-4.24-41.65-.55-83.33-.1-125-.24-22.79-.08-38.09-22-30.3-43.11,4.44-12,15.83-20.7,28.59-20.74,46.67-.14,93.44-2,140,.48,92.18,4.86,162.42,48.2,210.63,127l2.76,4.54,3.21-5.28c42.17-69.24,103.1-111,183.24-123.77,15.53-2.49,31.5-2.64,47.29-3,21.65-.48,43.32-.12,66.19-.12-1.76-1.89-2.87-3.14-4-4.32-23.09-23.11-46.27-46.12-69.26-69.33C593.09,37.61,599.81,9,623.12,1.69,634.93-2,645.93.29,654.56,9c30.27,30.54,60.79,60.86,90.07,92.32,32.47,34.89,30.87,88.23-2.4,122.16Q699.53,267,656.63,310.4c-13.11,13.24-32.42,14.13-45.44,2.38-13.84-12.49-14.41-33.17-1-46.71C633,243.13,656,220.4,678.92,197.57c1.24-1.24,2.39-2.56,4.3-4.61h-4.29c-24.49,0-49-.21-73.49.08a192.07,192.07,0,0,0-182.25,139.8c-30.93,109.57,40,221.92,152.33,241.16a198.36,198.36,0,0,0,30.29,2.8c25.65.39,51.31.13,78.16.13-1.85-1.89-3-3.13-4.24-4.32q-34.37-33.51-68.71-67c-10.48-10.27-13.19-24.09-7.54-36.64a31.81,31.81,0,0,1,51.45-9.7c20.42,19.87,40.39,40.22,60.54,60.37,8.72,8.71,17.54,17.34,26.12,26.2,35.35,36.5,35.24,90.32-.31,126.63Q699,715.67,656.37,758.63c-18.25,18.36-48,11.12-54.62-13.24-3.35-12.28,0-23,9-32q34-33.84,68-67.76c1.26-1.25,2.45-2.57,4.48-4.71h-6.22c-24.33,0-48.7.78-73-.17-94.75-3.73-167.09-46.24-217-126.91Z"/></g></g></svg>
                        </template>
                    </SvgTextButton>
                </div>
            </div>
        </div>
        <div class="center">
            <div class="content" ref="contentRef" @scroll="onScroll">
                <component 
                    :id="dataListId"
                    :is="currentTabView" 
                    :data="tabData" 
                    :loading="loading"
                    :paginationStyleType="getPaginationStyleIndex"
                    :limit="limit" 
                    :maxPage="maxPage"
                    :loadPage="loadPageContent"
                    :onPageLoaded="onPageLoaded"
                    :nextPagePendingMark="nextPagePendingMark"
                    :refreshAllPendingMark="refreshAllPendingMark" 
                    :singleLineTitleStyle="singleLineTitleStyle"
                    :playable="true"
                    :artistVisitable="true"
                    :albumVisitable="true"
                    :needReset="true"
                    :hideExtra="true"
                    :useMaxPage="true" >
                </component>
            </div>
        </div>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style>
#emby-session-detail-view .cls-1 {
    fill: url(#linear-gradient);
}

#emby-session-detail-view .cls-2 {
    fill-rule: evenodd;
    fill: url(#linear-gradient-2);
}

#emby-session-detail-view {
    display: flex;
    flex-direction: column;
    flex: 1;
    /*padding: 20px 33px 10px 33px;*/
    padding: 20px 0px 0px 0px;
    overflow: hidden;
}

#emby-session-detail-view .spacing {
    margin-left: 20px;
}

#emby-session-detail-view .to-right {
    position: absolute;
    right: 0px;
}

#emby-session-detail-view .categories {
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

#emby-session-detail-view .categories ul {
    padding: 0px 15px;
    background: transparent;
}

#emby-session-detail-view .categories li {
    list-style: none;
    padding: 6px 0px 6px 0px;
    width: 88px;
    margin-top: 8px;
    text-align: center;
    font-size: calc(var(--content-text-size) - 1px);
    border-radius: var(--border-list-item-vertical-border-radius);
    cursor: pointer;
}

#emby-session-detail-view .categories li.first {
    margin-top: 0px;
}

#emby-session-detail-view .categories li:hover {
    background: var(--button-icon-text-btn-bg-color);
    color: var(--button-icon-text-btn-text-color);
    transform: scale(1.03);
}

.contrast-mode #emby-session-detail-view .categories li:hover {
    font-weight: bold;
}



#emby-session-detail-view .header {
    display: flex;
    flex-direction: column;
    margin-bottom: 5px;
    padding: 0px 33px 0px 33px;
}

#emby-session-detail-view .header .title-wrap {
    display: flex;
    align-items: center;
    position: relative;
    font-weight: bold;
}

#emby-session-detail-view .header .title-wrap .title {
    text-align: left;
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
    margin-left: 6px;
}

#emby-session-detail-view .header .title-wrap .options {
    display: flex;
    align-items: center;
    margin-right: 6px;
    height: 100%;
}

#emby-session-detail-view .about {
    text-align: left;
    margin-bottom: 0px;
    margin-top: 10px;
    color: var(--content-subtitle-text-color);
}

#emby-session-detail-view .header .action {
    display: flex;
}

#emby-session-detail-view .header .tabs {
    display: flex;
    align-items: center;
    text-align: left;
    padding-bottom: 0px;
    border-bottom: 1px solid var(--border-color);
    border-bottom: 1px solid transparent;
    margin-top: 3px;
    position: relative;
}

#emby-session-detail-view .header .tab {
    font-size: var(--content-text-tab-title-size);
    padding: 8px 0px 5px 0px;
    margin-right: 36px;
    border-bottom: 3px solid transparent;
    cursor: pointer;
}

#emby-session-detail-view .header .active {
    font-weight: bold;
    border-bottom: 3px solid var(--content-highlight-color);
}


#emby-session-detail-view .header .cate-btn {
    margin-right: 15px;
    display: flex;
    justify-content: center;
    align-items: center;
}

#emby-session-detail-view .center {
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

#emby-session-detail-view .center .list-title {
    margin-bottom: 6px;
    text-align: left;
    display: flex;
    position: relative;
    padding: 0px 33px 0px 33px;
}

#emby-session-detail-view .center .list-title .size-text {
    font-weight: bold;
    margin-left: 3px;
    padding-bottom: 6px;
    border-bottom: 3px solid var(--content-highlight-color);
    font-size: var(--content-text-tab-title-size);
    cursor: pointer;
}

#emby-session-detail-view .center .list-title .size-text.loading-mask {
    border-color: transparent;
}

#emby-session-detail-view .center .list-title .size-text svg {
    fill: var(--content-highlight-color);
    transform: translateY(2px);
}

#emby-session-detail-view .center .list-title .size-text span {
    margin-left: 5px;
}

#emby-session-detail-view .center .list-title .action {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-right: 38px;
}

#emby-session-detail-view .center .location {
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

#emby-session-detail-view .center .location .current {
    word-wrap: break-word;
    line-break: anywhere;
    margin-left: 10px;
}

#emby-session-detail-view .center .content {
    overflow: scroll;
    overflow-x: hidden;
    padding: 0px 33px 0px 33px;
}

#emby-session-detail-view .center .content.list-view .item {
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

#emby-session-detail-view .center .item:hover {
    background: var(--content-list-item-hover-bg-color);
    cursor: pointer;
}

#emby-session-detail-view .center .content.list-view  .item > div {
    height: var(--item-height);
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex: 1;
    /*font-size: var(--content-text-size);*/
}

#emby-session-detail-view .center .content.list-view  .item .sqno {
    min-width: 36px;
    padding-left: 10px;
    flex: 1;
}

#emby-session-detail-view .center .content.list-view  .item .icon {
    width: 50px;
    max-width: 50px;
    flex: 1;
    padding-left: 10px;
}

#emby-session-detail-view .center .content .item .icon svg {
    fill: var(--button-icon-btn-color) !important;
    fill: var(--content-subtitle-text-color) !important;
    border-radius: var(--border-img-small-border-radius);
}

#emby-session-detail-view .center .content.list-view  .item .title {
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

#emby-session-detail-view .center .content .item .title span {
    word-wrap: break-word;
    line-break: anywhere;
    line-height: var(--item-height);
}

#emby-session-detail-view .center .content.list-view .item .title .action {
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

#emby-session-detail-view .center .content.list-view .item .title:hover span {
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

#emby-session-detail-view .center .content .item .title:hover .action {
    visibility: visible;
}

#emby-session-detail-view .center .content .item .action svg {
    fill: var(--button-icon-btn-color);
}

#emby-session-detail-view .center .content .item .action svg:hover {
    fill: var(--content-highlight-color);
}

#emby-session-detail-view .center .content.list-view  .item .size {
    min-width: 88px;
    margin-right: 15px;
    justify-content: flex-end
}

#emby-session-detail-view .center .content.list-view  .item .type {
    min-width: 39px;
}

#emby-session-detail-view .center .content.list-view  .item .updated {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-end;
    min-width: 115px;
    padding-right: 10px;
    /*font-size: var(--content-text-tip-text-size);*/
    font-size: calc(var(--content-text-size) - 1px);
}

#emby-session-detail-view .center .content.list-view  .item .updated .hms {
    margin-bottom: 3px;
}

#emby-session-detail-view .center .content.grid-view {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    flex: 1;
}

#emby-session-detail-view .center .content.grid-view .item {
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

#emby-session-detail-view .center .content.grid-view  .item .title {
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

#emby-session-detail-view .center .content.grid-view .item .action {
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

#emby-session-detail-view .center .content.grid-view .item:hover .action {
    visibility: visible;
    background: var(--content-list-item-hover-bg-color);
}
</style>