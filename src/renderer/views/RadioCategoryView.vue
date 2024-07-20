<script setup>
import { reactive } from 'vue';
import { storeToRefs } from 'pinia';
import { useRadioSquareStore } from '../store/radioSquareStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { onEvents, emitEvents } from '../../common/EventBusWrapper';



const { currentCategoryItem, currentOrder, multiSelectMode, currentCategoryItems } = storeToRefs(useRadioSquareStore())
const { currentPlatformCategories, updateCurrentCategoryItem,
    currentPlatformOrders, updateCurrentOrder,
    updateMultiModeCurrentCategoryItem, resetCurrentCategoryItems,
    setMultiSelectMode, resetCurrentCategoryItem } = useRadioSquareStore()
const { hideRadioCategoryView } = useAppCommonStore()
const categories = reactive([])
const orders = reactive([])

const updateCategories = () => {
    categories.length = 0
    const cached = currentPlatformCategories() || { data: [], multiSelectMode: false }
    categories.push(...cached.data)
    //setMultiSelectMode(cached.multiSelectMode)
    if (multiSelectMode.value) resetCurrentCategoryItems()
}

const updateOrders = () => {
    orders.length = 0
    const cached = currentPlatformOrders() || []
    orders.push(...cached)
}

const resetScroll = () => {
    const view = document.querySelector(".radio-category-view")
    if (view) view.scrollTop = 0
}

const isDiffCate = (item, row, col) => {
    const prevCate = currentCategoryItem.value
    return prevCate ? (
        prevCate.data.value != item.value
        || prevCate.row != row
        || prevCate.col != col) : true
}

const isDiffOrder = (item, index) => {
    const prevOrder = currentOrder.value
    return prevOrder ? (
        prevOrder.value != item.value
        || prevOrder.index != index) : true
}

const visitCateItem = (item, row, col) => {
    const needRefresh = isDiffCate(item, row, col)
    updateCurrentCategoryItem(item, row, col)
    if (needRefresh) {
        emitEvents("radioSquare-refresh")
        hideRadioCategoryView()
    }
}

const visitMultiModeCateItem = (name, item, index) => {
    updateMultiModeCurrentCategoryItem(name, item, index)
}

const visitByOrder = (item, index) => {
    const needRefresh = isDiffOrder(item, index)
    updateCurrentOrder(item.key, item.value, index)
    if (needRefresh) {
        emitEvents("radioSquare-refresh")
        hideRadioCategoryView()
    }
}

onEvents({
    'radioCategory-update': () => {
        updateCategories()
        updateOrders()
    },
    'radioCategory-resetScroll': resetScroll
})
</script>

<template>
    <div class="radio-category-view" @click.stop="">
        <div class="container">
            <div class="header" :class="{ 'multi-mode-header': multiSelectMode }">
                <div class="left-action" v-show="multiSelectMode" @click="hideRadioCategoryView">
                    <div class="hide-btn btn">
                        <svg width="12" height="12" viewBox="0 0 593.14 593.11" data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z"
                                transform="translate(-663.4 -243.46)" />
                        </svg>
                    </div>
                </div>
                <div class="cate-title">全部分类</div>
                <div class="fl-item content-text-highlight" v-show="!multiSelectMode" v-html="currentCategoryItem.data.key">
                </div>
                <div class="right-action" v-show="multiSelectMode">
                    <div class="reset-btn text-btn" @click="resetCurrentCategoryItems">
                        <svg width="15" height="15" viewBox="0 0 256 256" data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M1040,669H882c-12.79-4.93-17.16-14.62-17.1-27.83.26-52.77.11-105.55.11-158.32V477c-6,0-11.42-.32-16.84.09-6.54.48-11.66-1.39-15.17-7.08v-7c3.16-5.7,8-7.48,14.44-7.36,18.29.32,36.58.12,54.88.1,1.75,0,3.5-.16,5.48-.25,0-7.76,0-14.91,0-22.05a18.56,18.56,0,0,1,6.6-14.52c2.85-2.39,6.37-4,9.59-5.92h73c13.83,5.64,17.27,10.84,17.25,26.08,0,5.41,0,10.82,0,16.68h7.53c17.61,0,35.21.2,52.81-.12,6.43-.12,11.27,1.63,14.41,7.36v7c-3.5,5.7-8.63,7.56-15.17,7.08-5.41-.4-10.89-.09-16.84-.09v6.36c0,52.6-.15,105.2.11,157.8C1057.17,654.36,1052.81,664.08,1040,669ZM886.24,477.29V640.4c0,8.44-.49,7.34,7.11,7.35q67.95,0,135.9,0c6.51,0,6.52,0,6.52-6.43v-164Zm106.5-42.78H929.37v21h63.37Z"
                                transform="translate(-833 -413)" />
                            <path
                                d="M950.29,562.2c0-13.47,0-26.94,0-40.41,0-7.94,4.25-12.84,10.82-12.77,6.36.07,10.59,5,10.6,12.52,0,27.28,0,54.55,0,81.83,0,5.13-1.71,9.17-6.5,11.36-7.39,3.36-14.87-2.16-14.94-11.11-.11-13.81,0-27.61,0-41.42Z"
                                transform="translate(-833 -413)" />
                            <path
                                d="M1014.25,562.63c0,13.48,0,27,0,40.42,0,7.88-4.3,12.82-10.87,12.64-6.29-.18-10.35-5.13-10.36-12.75q0-41.16,0-82.33c0-5.91,3-9.91,8-11.26a10.29,10.29,0,0,1,11.85,5.16,16.06,16.06,0,0,1,1.33,6.71c.12,13.8.06,27.61.06,41.41Z"
                                transform="translate(-833 -413)" />
                            <path
                                d="M929,562.53q0,21,0,41.92c0,4.8-2.09,8.39-6.49,10.29-4.21,1.81-8.49,1.25-11.43-2.23a13.57,13.57,0,0,1-3.17-8c-.23-28.1-.19-56.21-.12-84.32,0-6.74,4.63-11.34,10.74-11.19s10.41,4.78,10.44,11.59C929.05,534.59,929,548.56,929,562.53Z"
                                transform="translate(-833 -413)" />
                        </svg>
                        <span>重置</span>
                    </div>
                </div>
            </div>
            <div class="center" v-if="!multiSelectMode">
                <div class="fl-row" v-show="orders && orders.length > 0">
                    <div class="cate-title">排序</div>
                    <div class="cate-item-wrap">
                        <div v-for="(item, index) in orders" class="fl-item"
                            :class="{ current: (currentOrder.index == index) }" @click="visitByOrder(item, index)"
                            v-html="item.key">
                        </div>
                    </div>
                </div>
                <div v-for="(cate, row) in categories" class="fl-row">
                    <div class="cate-title">{{ cate.name }}</div>
                    <div class="cate-item-wrap">
                        <div v-for="(item, col) in cate.data" class="fl-item" :class="{
                            current: (row == currentCategoryItem.row
                                && col == currentCategoryItem.col)
                        }" @click="visitCateItem(item, row, col)" v-html="item.key">
                        </div>
                    </div>
                </div>
            </div>
            <div class="center" v-if="multiSelectMode">
                <div v-for="(cate, row) in categories" class="fl-row">
                    <div class="cate-title">{{ cate.name }}</div>
                    <div class="cate-item-wrap">
                        <div v-for="(item, col) in cate.data" class="fl-item"
                            :class="{ current: col == currentCategoryItems[cate.name].index }"
                            @click="visitMultiModeCateItem(cate.name, item, col)" v-html="item.key">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.radio-category-view {
    display: flex;
    overflow: hidden;
    overflow-x: hidden;
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
}

.radio-category-view .container {
    overflow: scroll;
    overflow-x: hidden;
    padding-bottom: 30px;
    flex: 1;
    background: var(--content-bg-color);
    background: var(--content-bg-color-no-transparent);
}

.radio-category-view .header,
.radio-category-view .center {
    display: flex;
    text-align: left;
}

.radio-category-view .header {
    /*margin-top: 5px;*/
    margin-bottom: 5px;
    padding-bottom: 10px;
    padding-left: 33px;
    padding-right: 33px;
    border-bottom: 1px solid var(--border-color);
}

.radio-category-view .multi-mode-header {
    padding-left: 15px;
}

.radio-category-view .header .cate-title {
    /*margin-right: 1px;*/
    color: var(--content-subtitle-text-color);
    flex: 1;
}

.radio-category-view .header .fl-item,
.radio-category-view .header .fl-item:hover {
    cursor: default;
    margin-right: 0px;
    font-size: var(--content-text-size);
    /*
    padding-top: 8px;
    margin-left: 30px;
    
    position: absolute;
    right: 30px;
    */
}


.radio-category-view .header .left-action {
    display: flex;
    flex-direction: row;
    justify-content: center;
    margin-top: 15px;
    margin-right: 15px;
}

.radio-category-view .hide-btn {
    text-align: left;
    /*font-size: 15px;*/
    display: flex;
    align-items: center;
    justify-items: center;
    cursor: pointer;
}

.radio-category-view .header .right-action {
    flex: 1;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    margin-top: 10px;
}

.radio-category-view .text-btn {
    text-align: left;
    /*font-size: 15px;*/
    display: flex;
    align-items: center;
    justify-items: center;
    cursor: pointer;
    margin-left: 20px;
}

.radio-category-view .center {
    flex-direction: column;
    margin-left: 33px;
    margin-right: 33px;
}

.radio-category-view .fl-row {
    display: flex;
    flex-direction: row;
    margin-bottom: 10px;
    text-align: left;
}

.radio-category-view .cate-item-wrap {
    display: flex;
    flex-wrap: wrap;
}

.radio-category-view .cate-title {
    font-size: 19px;
    font-weight: bold;
    color: var(--content-subtitle-text-color);
    min-width: 39px;
    margin-top: 15px;
    margin-right: 20px;
}

.radio-category-view .header .cate-title {
    /*font-size: 21px;*/
    font-size: var(--content-text-module-title2-size);
}

.radio-category-view .fl-item {
    /*float: left;*/
    /*font-size: 15px;*/
    padding: 6px 16px;
    margin-top: 10px;
    margin-right: 10px;
    cursor: pointer;
    color: var(--content-text-color);
    font-size: var(--content-text-subtitle-size);
    border-radius: var(--border-list-item-border-radius);
}

.radio-category-view .fl-item:hover {
    background-color: var(--content-list-item-hover-bg-color);
    color: var(--content-text-color);
}


.radio-category-view .header .current {
    font-weight: bold;
}

.radio-category-view .center .current {
    border-radius: var(--border-list-item-border-radius);
    background: var(--button-icon-text-btn-bg-color) !important;
    color: var(--button-icon-text-btn-icon-color) !important;
}
</style>