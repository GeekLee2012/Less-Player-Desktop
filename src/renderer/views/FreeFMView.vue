<script>
//定义名称，方便用于<keep-alive>
export default { name: 'FreeFMView' }
</script>

<script setup>
import { computed, inject, onActivated, onDeactivated, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useFreeFMStore } from '../store/freeFMStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';
import PlaylistsControl from '../components/PlaylistsControl.vue';
import BatchActionBtn from '../components/BatchActionBtn.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import SearchBarExclusiveModeControl from '../components/SearchBarExclusiveModeControl.vue';
import { parseM3uText, parsePlsText, ipcRendererInvoke, isSupportedImage, isLiveStream } from "../../common/Utils";
import { onEvents, emitEvents } from '../../common/EventBusWrapper';
import EmptyControl from '../components/EmptyControl.vue';



const { currentRoutePath, visitFreeFMCreate, visitBatchFreeFM } = inject('appRoute')
const { showConfirm } = inject('apiExpose')

const { freeRadios, importTaskCount } = storeToRefs(useFreeFMStore())
const { addFreeRadio, updateFreeRadio, resetAll,
    increaseImportTaskCount, decreaseImportTaskCount } = useFreeFMStore()
const { searchBarExclusiveAction } = storeToRefs(useAppCommonStore())
const { showToast, showFailToast, hideAllCtxMenus,
    setSearchBarExclusiveAction, toggleTagsCategoryView } = useAppCommonStore()
const { isSearchForFreeFMShow, isShowDialogBeforeClearFreeFM, 
    isFreeFMViewTipsShow, isFreeFMViewRadiosTipsShow, 
    isSingleLineRadioTitleStyle, } = storeToRefs(useSettingStore())


const freefmRef = ref(null)
const back2TopBtnRef = ref(null)

const isLoading = ref(false)
const setLoading = (value) => isLoading.value = value

const filteredData = ref(null)


const computedListSizeText = computed(() => {
    return filteredData.value ? filteredData.value.length : freeRadios.value.length
})

const resetBack2TopBtn = () => {
    if (back2TopBtnRef.value) back2TopBtnRef.value.setScrollTarget(freefmRef.value)
}

const onScroll = () => {
    markScrollState()
    hideAllCtxMenus()
}

const onDrop = async (event) => {
    if (importTaskCount.value > 0) return
    event.preventDefault()
    
    const { files } = event.dataTransfer
    if (files.length > 1) return

    const { path } = files[0]
    if (!path.endsWith('.json') && !path.endsWith('.pls') 
        && !path.endsWith('.m3u') && !path.endsWith('.m3u8')) return
    
    event.stopPropagation()
    const result = await ipcRendererInvoke('read-text', path)
    doImportRadios(result)
}

const importRadios = async () => {
    const result = await ipcRendererInvoke('open-file', { title: '请选择数据文件', filterExts: ['json', 'm3u', 'm3u8', 'pls'] })
    doImportRadios(result)
}

const doImportRadios = (result) => {
    if(!result) return
    const { data: rData, filePath } = result
    if(!rData || !filePath) return 

    increaseImportTaskCount()
    const isJson = filePath.endsWith('.json')
    const isPls = filePath.endsWith('.pls')
    const { data: radios } = isJson ?
        JSON.parse(rData)
        : isPls ? parsePlsText(rData, item => {
            item.streamType = (isLiveStream(item.url) ? 0 : 1)
            return item
        }) : parseM3uText(rData, item => {
            item.streamType = (isLiveStream(item.url) ? 0 : 1)
            return item
        })
    let msg = '导入电台失败', success = false
    if (radios && radios.length > 0) {
        radios.forEach(item => {
            const { title, url, streamType, cover, coverFit, tags, about } = item
            addFreeRadio(title, url, streamType, tags, about, cover, coverFit)
        })
        msg = `导入电台已完成！<br>共${radios.length}个电台`
        success = true
    }
    decreaseImportTaskCount()
    success ? showToast(msg) : showFailToast(msg)
}

const removeAll = async () => {
    if (freeRadios.value.length < 1) return

    if (isShowDialogBeforeClearFreeFM.value) {
        const ok = await showConfirm('确定要清空全部电台吗？')
        if (!ok) return
    }

    resetAll()
    filteredData.value = null
    showToast('电台已全部清空')
}

const toggleUseSearchBar = () => {
    if (!isSearchForFreeFMShow.value) return
    const action = searchBarExclusiveAction.value ? null : setSearchKeyword
    setSearchBarExclusiveAction(action)
}

const filterWithKeyword = (list, keyword) => {
    let result = list
    if (keyword) {
        keyword = keyword.toLowerCase()
        result = result.filter(item => {
            const { title, tags } = item
            const _title = title || ''
            const _tags = tags || ''
            return _title.toLowerCase().includes(keyword)
                || _tags.toLowerCase().includes(keyword)
        })
    }
    return result
}

const filterContent = (keyword) => {
    const data = freeRadios.value
    const listData = filterWithKeyword(data, keyword)
    filteredData.value = null
    if (listData && listData.length != data.length) {
        filteredData.value = listData
    }
    resetScrollState()
}

const getAllTags = () => {
    const allTags = []
    const data = freeRadios.value
    data.forEach(item => {
        const { tags } = item
        if (!tags || tags.trim().length < 1) return
        const tagTexts = tags.split(',')
        tagTexts.forEach(tagText => {
            if (!tagText || tagText.trim().length < 1) return
            tagText = tagText.trim()
            const index = allTags.findIndex(e => (e.value == tagText))
            if (index < 0) {
                allTags.push({ name: tagText, value: tagText, occurence: 0 })
            } else {
                ++allTags[index].occurence
            }
        })
    })
    return allTags.sort((a, b) => (b.occurence - a.occurence))
}

const filterByTags = (tags) => {
    if (!tags) return
    const data = freeRadios.value
    const listData = data.filter(item => {
        const { tags: tagsText } = item
        const _tagTexts = tagsText || ''
        for (var i = 0; i < tags.length; i++) {
            const { value } = tags[i]
            if (_tagTexts.toLowerCase().includes(value.toLowerCase())) {
                return true
            }
        }
        return false
    })
    filteredData.value = listData.length > 0 ? listData : null
}

const showTagsView = () => {
    emitEvents('tagsCategory-update', { data: getAllTags(), callback: filterByTags })
    toggleTagsCategoryView()
}

const loadPageContent = ({ offset, limit, page, dataInProps }) => {
    if (!dataInProps) return
    const pageData = dataInProps.slice(offset, offset + limit)
    return { data: pageData }
}

let markScrollTop = 0
const markScrollState = () => {
    if (freefmRef.value) markScrollTop = freefmRef.value.scrollTop
}

const restoreScrollState = () => {
    if (markScrollTop < 1) return
    if (freefmRef.value) freefmRef.value.scrollTop = markScrollTop
}

const resetScrollState = () => {
    markScrollTop = 0
    if (freefmRef.value) freefmRef.value.scrollTop = markScrollTop
}

const radioTileOnDrop = (event, item, index) => {
    if(!item) return 
    event.preventDefault()
    const { files } = event.dataTransfer

    if (files.length < 1) return

    const { path } = files[0]
    let isEventStopped = true
    if (isSupportedImage(path)) {
        const { id, platform, title, url, streamType, tags, about, coverFit } = item
        const cover = path
        updateFreeRadio(id, title, url, streamType, tags, about, cover, coverFit) 
            && Object.assign(item, { cover })
    } else {
        isEventStopped = false
    }
    if (isEventStopped) event.stopPropagation()
}

//为方便搜索、修改电台信息
const interruptSearchBarExclusiveModeCtl = () => {
    return currentRoutePath().includes('/radios/freefm')
}

const tutorialList = [{
    title: '前往设置-提示，可关闭上面的废话文学',
    color: '#fb929e'
}, {
    title: '支持json、pls拖拽导入',
    color: '#46cdcf'
}, {
    title: '支持m3u、m3u8拖拽导入',
    color: '#3d84a8'
}, {
    title: '拖拽图片到当前控件，更新封面',
    color: '#aa96da'
} ]


/* 生命周期、监听 */
onMounted(() => {
    resetScrollState()
})

onActivated(() => {
    restoreScrollState()
    resetBack2TopBtn()
})
</script>

<template>
    <div id="freefm-view" ref="freefmRef" @scroll="onScroll" @dragover="e => e.preventDefault()" @drop="onDrop">
        <div class="header">
            <div class="title">自由FM</div>
            <div class="about" v-show="isFreeFMViewTipsShow">
                <p>初衷：期待汇集全球主流电台，跟随电波一起，更多地了解、感知世界</p>
                <p>世界那么大，一起来静心聆听吧</p>
                <p>去探索、去发现，世界的美好</p>
                <p>去思考、去追寻，自己的人生</p>
            </div>
            <div class="action" :class="{ 'none-about': !isFreeFMViewTipsShow }">
                <SvgTextButton text="导入电台"
                    :disabled="importTaskCount > 0" 
                    :leftAction="importRadios" 
                    :rightAction="visitFreeFMCreate">
                    <template #left-img>
                        <svg width="17" height="15" viewBox="0 0 853.89 768.02" xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M426.89,768q-148.75,0-297.49,0C69.87,767.93,19.57,729.67,4.61,672.5a140.41,140.41,0,0,1-4.31-34c-.44-55.67-.29-111.33-.21-167,0-31.15,27.63-51.88,56.33-42.52,17.88,5.83,29.09,22.14,29.12,42.72q.1,65.51.06,131c0,11.66,0,23.33,0,35,.13,27.13,18,45.07,45.21,45.08q143,.07,286,0,152.49,0,305,0c10.8,0,20.87-2.11,29.52-8.91,11.68-9.19,16.88-21.33,16.83-36.16-.15-43,0-86,0-129,0-12.83-.15-25.66,0-38.49.26-17.27,7.72-30.64,23.12-38.64,14.61-7.57,29.38-6.72,43.18,2.34,12.62,8.29,19,20.52,19,35.47.17,57.83.86,115.67-.21,173.49-1.18,63.32-47.07,114.32-109.5,123.77a141.79,141.79,0,0,1-20.92,1.3Q574.88,768.07,426.89,768Z" />
                                    <path
                                        d="M394.63,450.06v-5.88q0-199.47,0-398.94c0-20.15,9.91-35.63,26.85-42.21,28.37-11,58.2,9.24,58.3,40,.19,62,.06,124,.06,186V451.28c2-1.84,3.34-3,4.57-4.19Q535.69,395.84,587,344.6c18.84-18.76,47.07-18,63.7,1.39a42.31,42.31,0,0,1-1.2,56.56c-8.5,9.16-17.56,17.79-26.4,26.63Q546,506.25,468.93,583.3c-15.5,15.47-36.33,18.46-53.8,7.71a51.86,51.86,0,0,1-9.31-7.48q-89.51-89.35-178.88-178.84c-13.46-13.48-17.06-31.76-9.79-48.24a42.62,42.62,0,0,1,41.2-25.38c11.71.55,21.35,5.62,29.57,13.87q40.38,40.57,80.91,81c8.22,8.23,16.38,16.53,24.57,24.8Z" />
                                </g>
                            </g>
                        </svg>
                    </template>
                    <template #right-img>
                        <!--
                        <svg width="17" height="15" viewBox="0 0 682.65 682.74"
                            xmlns="http://www.w3.org/2000/svg">
                            <g id="Layer_2" data-name="Layer 2">
                                <g id="Layer_1-2" data-name="Layer 1">
                                    <path
                                        d="M298.59,384.15h-7.06q-123.24,0-246.49,0c-21.63,0-38.69-12.57-43.64-31.94-7-27.56,13.21-53.29,42.33-53.51,25.33-.18,50.66,0,76,0H298.59v-6.44q0-123.49,0-247c0-20.39,10.77-36.44,28.49-42.71C355-7.34,383.55,13,384,43.16c.26,16.33,0,32.67,0,49V298.65h6.82q123.49,0,247,0c21.52,0,38.61,12.77,43.43,32.19,6.75,27.26-13.06,52.7-41.62,53.25-11.16.22-22.33,0-33.49,0H384.09v6.69q0,123.5,0,247c0,21.59-12.66,38.65-32.06,43.53-27.59,6.95-53.24-13.31-53.39-42.46-.17-32.66,0-65.33,0-98V384.15Z" />
                                </g>
                            </g>
                        </svg>
                        -->
                        <svg width="18" height="18" viewBox="0 -50 768.02 554.57" xmlns="http://www.w3.org/2000/svg">
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
                <BatchActionBtn :deleteBtn="true" :leftAction="visitBatchFreeFM" :rightAction="removeAll"
                    popover-hint="圾桶图标按钮，点击后将清空全部本地歌单，请谨慎操作" class="spacing">
                </BatchActionBtn>
            </div>
        </div>
        <div class="center">
            <div class="list-title">
                <div class="size-text content-text-highlight">电台列表({{ computedListSizeText }})</div>
                <SearchBarExclusiveModeControl class="search-wrap" v-show="isSearchForFreeFMShow"
                    :onKeywordChanged="filterContent" :interruptDeactivatedAction="interruptSearchBarExclusiveModeCtl">
                </SearchBarExclusiveModeControl>
                <div class="tags-btn text-btn" @click.stop="showTagsView" v-show="false">
                    <svg width="15" height="15" viewBox="0 0 29.3 29.3">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M23.51,15.66H17.3a1.55,1.55,0,0,0-.56.11,1.45,1.45,0,0,0-1.11,1.41v6.38a5.77,5.77,0,0,0,5.76,5.76h2.16a5.76,5.76,0,0,0,5.75-5.76V21.41a5.76,5.76,0,0,0-5.77-5.75Zm2.85,7.91a2.86,2.86,0,0,1-2.85,2.86H21.35a2.86,2.86,0,0,1-2.85-2.86v-5h5a2.86,2.86,0,0,1,2.85,2.86ZM12.52,15.76a1.55,1.55,0,0,0-.56-.11H5.75A5.76,5.76,0,0,0,0,21.41v2.15a5.76,5.76,0,0,0,5.75,5.76H7.91a5.78,5.78,0,0,0,5.72-5.76V17.18A1.47,1.47,0,0,0,12.52,15.76Zm-1.76,7.8a2.86,2.86,0,0,1-2.85,2.86H5.75A2.86,2.86,0,0,1,2.9,23.56V21.41a2.86,2.86,0,0,1,2.85-2.86h5Zm-5-9.89H12a1.55,1.55,0,0,0,.56-.11,1.45,1.45,0,0,0,1.1-1.42V5.76A5.77,5.77,0,0,0,7.87,0H5.75A5.76,5.76,0,0,0,0,5.76V7.91a5.77,5.77,0,0,0,5.75,5.75ZM2.9,5.76A2.86,2.86,0,0,1,5.75,2.9H7.91a2.86,2.86,0,0,1,2.85,2.86v5h-5A2.86,2.86,0,0,1,2.91,7.9ZM23.51,0H21.35a5.78,5.78,0,0,0-5.72,5.76v6.38a1.45,1.45,0,0,0,1.15,1.42,1.55,1.55,0,0,0,.56.11h6.21A5.76,5.76,0,0,0,29.3,7.91V5.76A5.76,5.76,0,0,0,23.54,0Zm2.85,7.91a2.86,2.86,0,0,1-2.85,2.86h-5v-5a2.86,2.86,0,0,1,2.85-2.86h2.16a2.86,2.86,0,0,1,2.85,2.86Z" />
                            </g>
                        </g>
                    </svg>
                    <span>标签</span>
                </div>
            </div>
            <PlaylistsControl :data="filteredData || freeRadios" 
                :playable="true"
                :loading="isLoading" 
                :customLoadingCount="importTaskCount"
                :tileOnDropFn="radioTileOnDrop" 
                :singleLineTitleStyle="isSingleLineRadioTitleStyle">
            </PlaylistsControl>
            <PlaylistsControl 
                :data="tutorialList" 
                :playable="false"
                :tutorial="true"
                v-show="isFreeFMViewRadiosTipsShow && freeRadios.length < 1">
            </PlaylistsControl>
            <EmptyControl
                v-show="!isFreeFMViewRadiosTipsShow 
                    && freeRadios.length < 1">
            </EmptyControl>
        </div>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style>
#freefm-view {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 20px 33px 10px 33px;
    overflow: scroll;
    overflow-x: hidden;
}

#freefm-view .spacing {
    margin-left: 20px;
}

#freefm-view .header {
    display: flex;
    flex-direction: column;
    margin-bottom: 15px;
}

#freefm-view .header .title {
    text-align: left;
    margin-bottom: 5px;
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
}

#freefm-view .header .about {
    text-align: left;
    margin-left: 5px;
    margin-bottom: 12px;
    line-height: 29px;
    color: var(--content-subtitle-text-color);
}

#freefm-view .header .action {
    display: flex;
}

#freefm-view .header .action.none-about {
    margin-top: 6px;
}

#freefm-view .list-title {
    margin-bottom: 6px;
    text-align: left;
    font-weight: bold;
    display: flex;
    align-items: center;
    position: relative;
}

#freefm-view .list-title .size-text {
    margin-left: 5px;
    padding-bottom: 6px;
    border-bottom: 3px solid var(--content-highlight-color);
    font-size: var(--content-text-tab-title-size);
}

#freefm-view .checkbox {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-left: 8px;
    margin-right: 15px;
    cursor: pointer;
}

/*
#freefm-view .checkbox svg {
    fill: var(--button-icon-btn-color);
    cursor: pointer;
}

#freefm-view .checkbox .checked-svg {
    fill: var(--content-highlight-color);
}
*/

#freefm-view .search-wrap {
    position: absolute;
    right: 68px;
    right: -10px;
    display: flex;
    align-items: center;
    /* font-weight: bold; */
    font-size: calc(var(--content-text-tab-title-size) - 1.5px);
}

#freefm-view .tags-btn {
    position: absolute;
    right: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
}

#freefm-view .tags-btn:hover {
    fill: var(--content-highlight-color);
    color: var(--content-highlight-color);
}
</style>