<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'FreeFMView'
}
</script>

<script setup>
import { computed, inject, onDeactivated, onMounted, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import CreatePlaylistBtn from '../components/CreatePlaylistBtn.vue';
import { usePlayStore } from '../store/playStore';
import { useFreeFMStore } from '../store/freeFMStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { useSettingStore } from '../store/settingStore';
import PlaylistsControl from '../components/PlaylistsControl.vue';
import BatchActionBtn from '../components/BatchActionBtn.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import { isDevEnv, useIpcRenderer } from "../../common/Utils";
import EventBus from '../../common/EventBus';




const { currentRoutePath, visitFreeFMCreate, visitBatchFreeFM } = inject('appRoute')

const ipcRenderer = useIpcRenderer()

const { freeRadios, importTaskCount } = storeToRefs(useFreeFMStore())
const { addFreeRadio, resetAll,
    increaseImportTaskCount, decreaseImportTaskCount } = useFreeFMStore()
const { searchBarExclusiveAction } = storeToRefs(useAppCommonStore())
const { showToast, showFailToast, hideAllCtxMenus, setSearchBarExclusiveAction } = useAppCommonStore()
const { isSearchForFreeFMShow } = storeToRefs(useSettingStore())


const freefmRef = ref(null)
const back2TopBtnRef = ref(null)

const isLoading = ref(false)
const setLoading = (value) => isLoading.value = value

const filteredData = ref(null)
const searchKeyword = ref(null)
const setSearchKeyword = (value) => searchKeyword.value = value


const computedListSizeText = computed(() => {
    return filteredData.value ? filteredData.value.length : freeRadios.value.length
})

const resetBack2TopBtn = () => {
    if (back2TopBtnRef.value) back2TopBtnRef.value.setScrollTarget(freefmRef.value)
}

const onScroll = () => {
    hideAllCtxMenus()
}

const onDrop = async (event) => {
    if (!ipcRenderer) return
    if (importTaskCount.value > 0) return
    event.preventDefault()
    //暂时不想支持拖拽
}

const importRadios = async () => {
    if (!ipcRenderer) return
    const result = await ipcRenderer.invoke('open-json-file')
    if (result) {
        increaseImportTaskCount()
        const { data: radios } = JSON.parse(result.data)
        let msg = '导入FM电台失败！', success = false
        if (radios && radios.length > 0) {
            radios.forEach(item => {
                const { title, url, streamType, cover, tags, about } = item
                addFreeRadio(title, url, streamType, tags, about, cover)
            })
            msg = `导入FM电台已完成！<br>共${radios.length}个电台！`
            success = true
        }
        decreaseImportTaskCount()
        if (success) showToast(msg)
        if (!success) showFailToast(msg)
    }
}

const removeAll = () => {
    if (freeRadios.value.length < 1) return
    showToast('自由FM已全部清空!')
    resetAll()
}

const toggleUseSearchBar = () => {
    if (!isSearchForFreeFMShow.value) return
    const action = searchBarExclusiveAction.value ? null : setSearchKeyword
    setSearchBarExclusiveAction(action)
}

const filterWithKeyword = (list) => {
    let keyword = searchKeyword.value
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

const filterContent = () => {
    const data = freeRadios.value
    const listData = filterWithKeyword(data)
    filteredData.value = null
    if (listData && listData.length != data.length) {
        filteredData.value = listData
    }
}


onMounted(() => {
    resetBack2TopBtn()
})

onDeactivated(() => {
    //为方便搜索、修改电台信息
    const currentPath = currentRoutePath()
    if (!currentPath.includes('/radios/freefm')) {
        setSearchBarExclusiveAction(null)
        setSearchKeyword(null)
    }
})

watch(searchKeyword, filterContent)
</script>

<template>
    <div id="freefm-view" ref="freefmRef" @scroll="onScroll" @dragover="e => e.preventDefault()" @drop="onDrop">
        <div class="header">
            <div class="title">自由FM</div>
            <div class="about">
                <p>初衷：期待汇集全球主流电台，跟随电波一起，更多地了解、感知世界</p>
                <p>世界那么大，一起来静心聆听吧</p>
                <p>去探索、去思考、去发现、去追寻，真正属于自己的人生吧</p>
            </div>
            <div class="action">
                <SvgTextButton text="新建FM电台" :leftAction="visitFreeFMCreate">
                </SvgTextButton>
                <SvgTextButton text="导入FM电台" :leftAction="importRadios" :disabled="importTaskCount > 0" class="spacing">
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
                </SvgTextButton>
                <BatchActionBtn :deleteBtn="true" :leftAction="visitBatchFreeFM" :rightAction="removeAll"
                    popover-hint="圾桶图标按钮，点击后将清空全部本地歌单，请谨慎操作" class="spacing">
                </BatchActionBtn>
            </div>
        </div>
        <div class="center">
            <div class="list-title">
                <div class="size-text content-text-highlight">FM电台({{ computedListSizeText }})</div>
                <div class="search-wrap checkbox" @click="toggleUseSearchBar" v-show="isSearchForFreeFMShow">
                    <svg v-show="!searchBarExclusiveAction" width="16" height="16" viewBox="0 0 731.64 731.66"
                        xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M365.63,731.65q-120.24,0-240.47,0c-54.2,0-99.43-30.93-117.6-80.11A124.59,124.59,0,0,1,0,608q0-242.21,0-484.42C.11,60.68,43.7,10.45,105.88,1.23A128.67,128.67,0,0,1,124.81.06q241-.09,481.93,0c61.43,0,110.72,39.85,122.49,99.08a131.72,131.72,0,0,1,2.3,25.32q.19,241.47.07,482.93c0,60.87-40.25,110.36-99.18,121.9a142.56,142.56,0,0,1-26.83,2.29Q485.61,731.81,365.63,731.65ZM48.85,365.45q0,121.76,0,243.5c0,41.57,32.38,73.82,73.95,73.83q243,.06,486,0c41.57,0,73.93-32.24,73.95-73.84q.11-243.24,0-486.49c0-41.3-32.45-73.55-73.7-73.57q-243.24-.06-486.49,0a74.33,74.33,0,0,0-14.89,1.42c-34.77,7.2-58.77,36.58-58.8,72.1Q48.76,244,48.85,365.45Z" />
                            </g>
                        </g>
                    </svg>
                    <svg v-show="searchBarExclusiveAction" class="checked-svg" width="16" height="16"
                        viewBox="0 0 767.89 767.94" xmlns="http://www.w3.org/2000/svg">
                        <g id="Layer_2" data-name="Layer 2">
                            <g id="Layer_1-2" data-name="Layer 1">
                                <path
                                    d="M384,.06c84.83,0,169.66-.18,254.48.07,45,.14,80.79,18.85,106.8,55.53,15.59,22,22.58,46.88,22.57,73.79q0,103,0,206,0,151.74,0,303.48c-.07,60.47-39.68,111.19-98.1,125.25a134.86,134.86,0,0,1-31.15,3.59q-254.73.32-509.47.12c-65,0-117.87-45.54-127.75-109.7a127.25,127.25,0,0,1-1.3-19.42Q0,384,0,129.28c0-65,45.31-117.82,109.57-127.83A139.26,139.26,0,0,1,131,.12Q257.53,0,384,.06ZM299.08,488.44l-74-74c-10.72-10.72-21.28-21.61-32.23-32.1a31.9,31.9,0,0,0-49.07,5.43c-8.59,13-6.54,29.52,5.35,41.43q62,62.07,124.05,124.08c16.32,16.32,34.52,16.38,50.76.15q146.51-146.52,293-293a69.77,69.77,0,0,0,5.44-5.85c14.55-18.51,5.14-45.75-17.8-51-12.6-2.9-23,1.37-32.1,10.45Q438.29,348.38,303.93,482.65C302.29,484.29,300.93,486.22,299.08,488.44Z" />
                            </g>
                        </g>
                    </svg>
                    <span>独占搜索框模式</span>
                </div>
            </div>
            <PlaylistsControl :data="filteredData || freeRadios" :loading="isLoading" :customLoadingCount="importTaskCount">
            </PlaylistsControl>
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

#freefm-view img {
    object-fit: contain;
}

#freefm-view .header {
    display: flex;
    flex-direction: column;
    margin-bottom: 33px;
}

#freefm-view .header .title {
    text-align: left;
    margin-bottom: 10px;
    font-size: var(--content-text-module-title-size);
    font-weight: bold;
}

#freefm-view .header .about {
    text-align: left;
    margin-left: 5px;
    margin-bottom: 15px;
    line-height: 28px;
    color: var(--content-subtitle-text-color);
}

#freefm-view .header .action {
    display: flex;
}

#freefm-view .list-title {
    margin-bottom: 10px;
    text-align: left;
    font-size: 16px;
    font-weight: bold;
    display: flex;
    position: relative;
}

#freefm-view .list-title .size-text {
    margin-left: 3px;
}

#freefm-view .checkbox {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-left: 8px;
    margin-right: 15px;
    cursor: pointer;
}

#freefm-view .checkbox svg {
    fill: var(--button-icon-btn-color);
    cursor: pointer;
}

#freefm-view .checkbox .checked-svg {
    fill: var(--content-highlight-color);
}


#freefm-view .search-wrap {
    position: absolute;
    right: -10px;
    display: flex;
    align-items: center;
    font-weight: bold;
}

#freefm-view .search-wrap svg {
    margin-top: 1px;
}

#freefm-view .search-wrap>span {
    margin-left: 5px;
    cursor: pointer;
}
</style>