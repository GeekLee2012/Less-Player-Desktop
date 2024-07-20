<script setup>
import { usePlaylistSquareStore } from '../store/playlistSquareStore';
import { useAppCommonStore } from '../store/appCommonStore';
import { reactive } from 'vue';
import { storeToRefs } from 'pinia';
import { onEvents, emitEvents } from '../../common/EventBusWrapper';



const { currentCategoryItem, currentOrder } = storeToRefs(usePlaylistSquareStore())
const { currentPlatformCategories, updateCurrentCategoryItem,
    currentPlatformOrders, updateCurrentOrder } = usePlaylistSquareStore()
const { hidePlaylistCategoryView } = useAppCommonStore()
const categories = reactive([])
const orders = reactive([])

const updateCategories = () => {
    categories.length = 0
    const cached = currentPlatformCategories() || []
    categories.push(...cached)
}

const updateOrders = () => {
    orders.length = 0
    const cached = currentPlatformOrders() || []
    if (cached.length > 0) orders.push(...cached)
}

const resetScroll = () => {
    const view = document.querySelector(".playlist-category-view")
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
        emitEvents("playlistSquare-refresh")
        //prevCate = { item, row, col }
        hidePlaylistCategoryView()
    }
}

const visitByOrder = (item, index) => {
    const needRefresh = isDiffOrder(item, index)
    updateCurrentOrder(item.key, item.value, index)
    if (needRefresh) {
        emitEvents("playlistSquare-refresh")
        hidePlaylistCategoryView()
    }
}

onEvents({
    'playlistCategory-update': () => {
        updateCategories()
        updateOrders()
    },
    'playlistCategory-resetScroll': resetScroll,
})
</script>

<template>
    <div class="playlist-category-view" @click.stop="">
        <div class="container">
            <div class="header">
                <div class="cate-title">全部分类</div>
                <div class="fl-item content-text-highlight" v-html="currentCategoryItem.data.key"></div>
            </div>
            <div class="center">
                <div class="fl-row" v-show="orders && orders.length > 0">
                    <div class="cate-title">排序</div>
                    <div class="cate-item-wrap">
                        <div v-for="(item, index) in orders" class="fl-item"
                            :class="{ current: currentOrder.index == index }" @click="visitByOrder(item, index)"
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
        </div>
    </div>
</template>

<style scoped>
.playlist-category-view {
    display: flex;
    overflow: hidden;
    overflow-x: hidden;
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
}

.playlist-category-view .container {
    overflow: scroll;
    overflow-x: hidden;
    padding-bottom: 30px;
    flex: 1;
    background: var(--content-bg-color);
    background: var(--content-bg-color-no-transparent);
}

.playlist-category-view .header,
.playlist-category-view .center {
    display: flex;
    text-align: left;
}

.playlist-category-view .header {
    /*margin-top: 5px;*/
    margin-bottom: 5px;
    padding-bottom: 10px;
    padding-left: 33px;
    padding-right: 33px;
    border-bottom: 1px solid var(--border-color);
}

.playlist-category-view .header .cate-title {
    /*margin-right: 1px;*/
    flex: 1;
}


.playlist-category-view .header .fl-item,
.playlist-category-view .header .fl-item:hover {
    cursor: default;
    font-size: var(--content-text-size);
    margin-right: 0px;
    /*
    padding-top: 8px;
    margin-left: 30px;
    position: relative;
    right: 30px;
    */
}

.playlist-category-view .center {
    flex-direction: column;
    margin-left: 33px;
    margin-right: 33px;
}

.playlist-category-view .fl-row {
    display: flex;
    flex-direction: row;
    margin-bottom: 10px;
    text-align: left;
}

.playlist-category-view .cate-item-wrap {
    display: flex;
    flex-wrap: wrap;
}

.playlist-category-view .cate-title {
    font-size: 19px;
    font-weight: bold;
    color: var(--content-subtitle-text-color);
    min-width: 39px;
    margin-top: 15px;
    margin-right: 20px;
}

.playlist-category-view .header .cate-title {
    /*font-size: 21px;*/
    margin-bottom: 3px;
    font-size: var(--content-text-module-title2-size);
}

.playlist-category-view .fl-item {
    /*float: left;*/
    /* font-size: 15px; */
    padding: 6px 16px;
    margin-top: 10px;
    margin-right: 10px;
    cursor: pointer;
    color: var(--content-text-color);
    border-radius: var(--border-list-item-border-radius);
    font-size: var(--content-text-subtitle-size);
}

.playlist-category-view .fl-item:hover {
    background-color: var(--content-list-item-hover-bg-color);
    color: var(--content-text-color);
}

.playlist-category-view .header .current {
    font-weight: bold;
}


.playlist-category-view .center .current {
    border-radius: var(--border-list-item-border-radius);
    background: var(--button-icon-text-btn-bg-color) !important;
    color: var(--button-icon-text-btn-icon-color) !important;
}
</style>