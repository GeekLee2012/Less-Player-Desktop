<script setup>
import { onActivated, onDeactivated, onMounted, onUnmounted, reactive, } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppCommonStore } from '../store/appCommonStore';
import { useRadioSquareStore } from '../store/radioSquareStore';
import CategoryBarLoadingMask from './CategoryBarLoadingMask.vue';
import { onEvents, emitEvents, offEvents } from '../../common/EventBusWrapper';
import { shuffle } from '../../common/Utils';




const { currentCategoryItem, currentCategoryItems, multiSelectMode } = storeToRefs(useRadioSquareStore())
const { updateCurrentCategoryItem, updateMultiModeCurrentCategoryItem } = useRadioSquareStore()
const { toggleRadioCategoryView, hidePlaybackQueueView } = useAppCommonStore()

const props = defineProps({
    data: Array,
    loading: Boolean,
    isWhiteWrap: Boolean
})

let lastToggleTime = -1
const toggleCategory = () => {
    const _now = Date.now()
    const distance = _now - lastToggleTime
    if(distance < 366) return

    hidePlaybackQueueView()
    toggleRadioCategoryView()

    lastToggleTime = _now
}

const isDiffCate = (item, row, col) => {
    const prevCate = currentCategoryItem.value
    return prevCate ? (
        prevCate.data.value != item.value
        || prevCate.row != row
        || prevCate.col != col) : true
}

const visitCateItem = (item, row, col, forceRefresh) => {
    if (multiSelectMode.value) {
        const cate = props.data[0]
        updateMultiModeCurrentCategoryItem(cate.name, item, col)
        return
    }
    const needRefresh = isDiffCate(item, row, col) || forceRefresh
    updateCurrentCategoryItem(item, row, col)
    if (needRefresh) emitEvents('radioSquare-refresh')
}

const flatData = reactive([])

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
    }
    return flatData
}

const loadFirstCateData = () => {
    const firstItem = getFlatData()[0]
    const { row, col } = firstItem || {}
    visitCateItem(firstItem, row, col, true)
}

const isItemActive = (item) => {
    if (multiSelectMode.value) {
        const cate = props.data[0]
        return currentCategoryItems.value[cate.name].index == item.col
    }
    return item.row == currentCategoryItem.value.row
        && item.col == currentCategoryItem.value.col
}


/* 生命周期、监听 */
//TODO 实现方式很别扭
const eventsRegistration = {
    'radioCategory-toggle': toggleCategory,
    'radioCategory-update': () => {
        flatData.length = 0
        loadFirstCateData()
    },
}
onMounted(() => onEvents(eventsRegistration))
onUnmounted(() => offEvents(eventsRegistration))
</script>

<template>
    <div class="radio-category-bar">
        <div v-show="!loading">
            <svg @click.stop="toggleCategory" width="17" height="17" viewBox="0 0 29.3 29.3">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <path
                            d="M23.51,15.66H17.3a1.55,1.55,0,0,0-.56.11,1.45,1.45,0,0,0-1.11,1.41v6.38a5.77,5.77,0,0,0,5.76,5.76h2.16a5.76,5.76,0,0,0,5.75-5.76V21.41a5.76,5.76,0,0,0-5.77-5.75Zm2.85,7.91a2.86,2.86,0,0,1-2.85,2.86H21.35a2.86,2.86,0,0,1-2.85-2.86v-5h5a2.86,2.86,0,0,1,2.85,2.86ZM12.52,15.76a1.55,1.55,0,0,0-.56-.11H5.75A5.76,5.76,0,0,0,0,21.41v2.15a5.76,5.76,0,0,0,5.75,5.76H7.91a5.78,5.78,0,0,0,5.72-5.76V17.18A1.47,1.47,0,0,0,12.52,15.76Zm-1.76,7.8a2.86,2.86,0,0,1-2.85,2.86H5.75A2.86,2.86,0,0,1,2.9,23.56V21.41a2.86,2.86,0,0,1,2.85-2.86h5Zm-5-9.89H12a1.55,1.55,0,0,0,.56-.11,1.45,1.45,0,0,0,1.1-1.42V5.76A5.77,5.77,0,0,0,7.87,0H5.75A5.76,5.76,0,0,0,0,5.76V7.91a5.77,5.77,0,0,0,5.75,5.75ZM2.9,5.76A2.86,2.86,0,0,1,5.75,2.9H7.91a2.86,2.86,0,0,1,2.85,2.86v5h-5A2.86,2.86,0,0,1,2.91,7.9ZM23.51,0H21.35a5.78,5.78,0,0,0-5.72,5.76v6.38a1.45,1.45,0,0,0,1.15,1.42,1.55,1.55,0,0,0,.56.11h6.21A5.76,5.76,0,0,0,29.3,7.91V5.76A5.76,5.76,0,0,0,23.54,0Zm2.85,7.91a2.86,2.86,0,0,1-2.85,2.86h-5v-5a2.86,2.86,0,0,1,2.85-2.86h2.16a2.86,2.86,0,0,1,2.85,2.86Z" />
                    </g>
                </g>
            </svg>
            <template v-for="item in getFlatData()" v-show="data.length > 0">
                <span @click="visitCateItem(item, item.row, item.col)" 
                    :class="{ 
                        active: isItemActive(item),
                        'no-whitewrap': !isWhiteWrap
                    }"
                    v-html="item.key">
                </span>
            </template>
        </div>
        <CategoryBarLoadingMask :count="20" v-show="loading">
        </CategoryBarLoadingMask>
    </div>
</template>

<style scoped>
.radio-category-bar {
    margin-left: 10px;
    height: 36px;
    overflow: hidden !important;
    text-align: left;
}

.radio-category-bar span {
    padding: 6px 15px;
    margin-right: 8px;
    vertical-align: middle;
    text-align: center;
    line-height: 36px;
    font-size: var(--content-text-size);
    cursor: pointer;
    /*white-space: nowrap;*/
    border-radius: var(--border-list-item-border-radius);
    /*border: 1px solid transparent;*/
    color: var(--content-text-color);

    white-space: pre-wrap;
    overflow: hidden;
    word-break: break-all;
}

.radio-category-bar span:hover {
    background: var(--content-list-item-hover-bg-color);
    color: var(--content-text-color);
}

.radio-category-bar span.no-whitewrap {
    white-space: nowrap;
}

.radio-category-bar svg {
    fill: var(--button-icon-btn-color);
    margin-right: 15px;
    cursor: pointer;
    transform: translateY(3px);
}

.radio-category-bar svg:hover {
    fill: var(--content-highlight-color);
}

.radio-category-bar .active {
    border-color: var(--content-highlight-color);
    border-color: transparent;
    /*
    background: var(--button-icon-text-btn-bg-color) !important;
    color: var(--button-icon-text-btn-icon-color) !important;
    */
    background: var(--content-list-item-hl-bg-color) !important;
    color: var(--content-list-item-hl-text-color) !important;
}

.contrast-mode .radio-category-bar .active {
    font-weight: bold;
}
</style>