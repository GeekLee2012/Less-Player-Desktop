<script setup>
import { storeToRefs } from 'pinia';
import { onMounted, reactive } from 'vue';
import EventBus from '../../common/EventBus';
import { useAppCommonStore } from '../store/appCommonStore';
import { usePlaylistSquareStore } from '../store/playlistSquareStore';
import { useSettingStore } from '../store/settingStore';
import CategoryBarLoadingMask from './CategoryBarLoadingMask.vue';



const { currentCategoryItem } = storeToRefs(usePlaylistSquareStore())
const { updateCurrentCategoryItem } = usePlaylistSquareStore()
const { togglePlaylistCategoryView, hidePlaybackQueueView } = useAppCommonStore()
const { isPlaylistCategoryBarRandom } = storeToRefs(useSettingStore())

const props = defineProps({
    data: Array,
    loading: Boolean
})

const toggleCategory = () => {
    hidePlaybackQueueView()
    togglePlaylistCategoryView()
}

const isDiffCate = (item, row, col) => {
    const prevCate = currentCategoryItem.value
    return prevCate ? (
        prevCate.data.value != item.value
        || prevCate.row != row
        || prevCate.col != col) : true
}

const visitCateItem = (item, row, col, forceRefresh) => {
    const needRefresh = isDiffCate(item, row, col) || forceRefresh
    updateCurrentCategoryItem(item, row, col)
    if (needRefresh) {
        EventBus.emit("playlistSquare-refresh")
    }
}

const flatData = reactive([])
//TODO 随机打乱数据，感觉算法有问题，不够乱......
const shuffle = (arr) => {
    let i = arr.length
    while (i) {
        let j = Math.floor(Math.random() * i--);
        [arr[j], arr[i]] = [arr[i], arr[j]]
    }
}

const getFlatData = () => {
    if (flatData.length <= 0) {
        //记录源数组原始坐标
        props.data.forEach((cate, row) => {
            cate.data.forEach((item, col) => {
                item.row = row
                item.col = col
                flatData.push(item)
            })
        })
        if (isPlaylistCategoryBarRandom.value) {
            const shuffleTimes = Math.random(1024) % 3 + 1
            for (var i = 0; i < shuffleTimes; i++) shuffle(flatData)
        }
    }
    return flatData
}

const loadFirstCateData = () => {
    const flatData = getFlatData()
    if (!flatData || flatData.length < 1) return
    const firstItem = flatData[0]
    visitCateItem(firstItem, firstItem.row, firstItem.col, true)
}

EventBus.on('playlistCategory-toggle', toggleCategory)

//TODO 实现方式很别扭
EventBus.on('playlistCategory-update', () => {
    flatData.length = 0
    loadFirstCateData()
})
</script>

<template>
    <div class="playlist-category-bar">
        <div v-show="!loading">
            <svg @click.stop="toggleCategory" width="16" height="16" viewBox="0 0 29.3 29.3">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <path
                            d="M23.51,15.66H17.3a1.55,1.55,0,0,0-.56.11,1.45,1.45,0,0,0-1.11,1.41v6.38a5.77,5.77,0,0,0,5.76,5.76h2.16a5.76,5.76,0,0,0,5.75-5.76V21.41a5.76,5.76,0,0,0-5.77-5.75Zm2.85,7.91a2.86,2.86,0,0,1-2.85,2.86H21.35a2.86,2.86,0,0,1-2.85-2.86v-5h5a2.86,2.86,0,0,1,2.85,2.86ZM12.52,15.76a1.55,1.55,0,0,0-.56-.11H5.75A5.76,5.76,0,0,0,0,21.41v2.15a5.76,5.76,0,0,0,5.75,5.76H7.91a5.78,5.78,0,0,0,5.72-5.76V17.18A1.47,1.47,0,0,0,12.52,15.76Zm-1.76,7.8a2.86,2.86,0,0,1-2.85,2.86H5.75A2.86,2.86,0,0,1,2.9,23.56V21.41a2.86,2.86,0,0,1,2.85-2.86h5Zm-5-9.89H12a1.55,1.55,0,0,0,.56-.11,1.45,1.45,0,0,0,1.1-1.42V5.76A5.77,5.77,0,0,0,7.87,0H5.75A5.76,5.76,0,0,0,0,5.76V7.91a5.77,5.77,0,0,0,5.75,5.75ZM2.9,5.76A2.86,2.86,0,0,1,5.75,2.9H7.91a2.86,2.86,0,0,1,2.85,2.86v5h-5A2.86,2.86,0,0,1,2.91,7.9ZM23.51,0H21.35a5.78,5.78,0,0,0-5.72,5.76v6.38a1.45,1.45,0,0,0,1.15,1.42,1.55,1.55,0,0,0,.56.11h6.21A5.76,5.76,0,0,0,29.3,7.91V5.76A5.76,5.76,0,0,0,23.54,0Zm2.85,7.91a2.86,2.86,0,0,1-2.85,2.86h-5v-5a2.86,2.86,0,0,1,2.85-2.86h2.16a2.86,2.86,0,0,1,2.85,2.86Z" />
                    </g>
                </g>
            </svg>
            <template v-for="item in getFlatData()" v-show="data.length > 0">
                <span @click="visitCateItem(item, item.row, item.col)" :class="{
                        active: (item.row == currentCategoryItem.row
                            && item.col == currentCategoryItem.col)
                    }" v-html="item.key" :data="item.value">
                </span>
            </template>
        </div>
        <CategoryBarLoadingMask :count="20" v-show="loading"></CategoryBarLoadingMask>
    </div>
</template>

<style scoped>
.playlist-category-bar {
    margin-left: 10px;
    height: 36px;
    overflow: hidden;
    text-align: left;
}

.playlist-category-bar span {
    padding: 6px 15px;
    margin-right: 8px;
    vertical-align: middle;
    text-align: center;
    line-height: 36px;
    font-size: var(--text-size);
    cursor: pointer;
    white-space: nowrap;
    border-radius: 10rem;
    /*border: 1px solid transparent;*/
    color: var(--text-color);
}

.playlist-category-bar span:hover {
    background: var(--list-item-hover);
    color: var(--text-color);
}

.playlist-category-bar svg {
    fill: var(--svg-color);
    margin-right: 15px;
    cursor: pointer;
    transform: translateY(3px);
}

.playlist-category-bar svg:hover {
    fill: var(--hl-color);
}

.playlist-category-bar .active {
    border-color: var(--hl-color);
    border-color: transparent;
    background: var(--btn-bg) !important;
    color: var(--svg-btn-color) !important;
}
</style>