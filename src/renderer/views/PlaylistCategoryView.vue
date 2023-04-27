<script setup>
import { usePlaylistSquareStore } from '../store/playlistSquareStore';
import { useAppCommonStore } from '../store/appCommonStore';
import EventBus from '../../common/EventBus';
import { reactive } from 'vue';
import { storeToRefs } from 'pinia';



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
    orders.push(...cached)
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
        EventBus.emit("playlistSquare-refresh")
        //prevCate = { item, row, col }
        hidePlaylistCategoryView()
    }
}

const visitByOrder = (item, index) => {
    const needRefresh = isDiffOrder(item, index)
    updateCurrentOrder(item.key, item.value, index)
    if (needRefresh) {
        EventBus.emit("playlistSquare-refresh")
        hidePlaylistCategoryView()
    }
}

EventBus.on('playlistCategory-update', () => {
    updateCategories()
    updateOrders()
})
EventBus.on('playlistCategory-resetScroll', resetScroll)
</script>

<template>
    <div class="playlist-category-view" @click.stop="">
        <div class="header">
            <div class="cate-title">全部分类</div>
            <div class="fl-item current" v-html="currentCategoryItem.data.key"></div>
        </div>
        <div class="center">
            <div class="fl-row" v-show="orders && orders.length > 0">
                <div class="cate-title">排序</div>
                <div class="cate-item-wrap">
                    <div v-for="(item, index) in orders" class="fl-item" :class="{ current: (currentOrder.index == index) }"
                        @click="visitByOrder(item, index)" v-html="item.key">
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
</template>

<style scoped>
.playlist-category-view {
    overflow: scroll;
    overflow-x: hidden;
}

.playlist-category-view .header,
.playlist-category-view .center {
    display: flex;
    text-align: left;
}

.playlist-category-view .header {
    margin-top: 5px;
    margin-bottom: 5px;
    padding-bottom: 10px;
    padding-left: 33px;
    padding-right: 33px;
    /* border-bottom: 0.5px solid var(--category-view-border); */
    border-bottom: 0.5px solid #565656;
    border-bottom: var(--category-view-border);
}

.playlist-category-view .header .cate-title {
    margin-right: 1px;
}

.playlist-category-view .header .fl-item,
.playlist-category-view .header .fl-item:hover {
    cursor: default;
    /* font-size: 18px; */
    background: var(--hl-text-bg);
    -webkit-background-clip: text;
    color: transparent;
    /*
    padding-top: 8px;
    margin-left: 30px;
    */
    position: absolute;
    right: 30px;
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
    font-size: 18px;
    font-weight: bold;
    /*
    background: linear-gradient(to top right, #28c83f, #1ca388);
    -webkit-background-clip: text;
    color: transparent;
    */
    color: var(--text-sub-color);
    min-width: 36px;
    margin-top: 15px;
    margin-right: 20px;
}

.playlist-category-view .header .cate-title {
    /*font-size: 21px;*/
    font-size: var(--text-main3-title-size);
}

.playlist-category-view .fl-item {
    /*float: left;*/
    /* font-size: 15px; */
    padding: 6px 16px;
    margin-top: 10px;
    margin-right: 10px;
    cursor: pointer;
    color: var(--text-color);
    border-radius: 10rem;
}

.playlist-category-view .fl-item:hover {
    background-color: var(--list-item-hover);
    color: var(--text-color);
}

.playlist-category-view .header .current {
    font-weight: bold;
}


.playlist-category-view .center .current {
    border-radius: 10rem;
    background: var(--btn-bg) !important;
    color: var(--svg-btn-color) !important;
}
</style>