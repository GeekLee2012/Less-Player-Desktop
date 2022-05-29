<script setup>
import { usePlaylistSquareViewStore } from '../store/playlistSquareViewStore';
import { useMainViewStore } from '../store/mainViewStore';
import EventBus from '../../common/EventBus';
import { reactive } from 'vue';
import { storeToRefs } from 'pinia';

const { currentCategoryItem } = storeToRefs(usePlaylistSquareViewStore())
const { currentCategory, updateCurrentCategoryItem } = usePlaylistSquareViewStore()
const { hidePlaylistCategoryView } = useMainViewStore()
const category = reactive([])

const updateCategory = () => {
    category.length = 0
    const cached = currentCategory()
    category.push(...cached)
}

const resetScroll = () => {
    const view = document.querySelector(".playlist-category-view")
    view.scrollTop = 0
}

const visitCateItem = (item, row, col) => {
    updateCurrentCategoryItem(item, row, col)
    hidePlaylistCategoryView()
}

EventBus.on('playlistCategory-update', ()=> {
    updateCategory()
})

EventBus.on('playlistCategory-resetScroll', ()=> {
    resetScroll()
})
</script>

<template>
    <div class="playlist-category-view" @click.stop="">
        <div class="header">
            <div class="cate-title">当前分类</div>
            <div class="fl-item">{{ currentCategoryItem.data.key }}</div>
        </div>
        <div class="center">
            <div v-for="(cate, row) in category" class="fl-row">
                <div class="cate-title">{{ cate.name }}</div>
                <div>
                    <div v-for="(item, col) in cate.data" 
                        class="fl-item" 
                        :class="{ current : (row == currentCategoryItem.row 
                            && col == currentCategoryItem.col )}"
                        @click="visitCateItem(item, row, col)"
                        v-html="item.key" >
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.playlist-category-view {
    overflow: auto;
}

.playlist-category-view .header,
.playlist-category-view .center {
    display: flex;
    flex-direction: row;
    text-align: left;
}

.playlist-category-view .header {
    margin-top: 5px;
    margin-bottom: 5px;
    padding-bottom: 10px;
    padding-left: 25px;
    padding-right: 25px;
    border-bottom: 0.5px solid #565656;
}

.playlist-category-view .header .cate-title {
    margin-right: 1px;
}

.playlist-category-view .header .fl-item {
    cursor: default;
    font-size: 18px;
    background: linear-gradient(to top right, #28c83f, #1ca388);
    -webkit-background-clip: text;
    color: transparent;
}

.playlist-category-view .center {
    flex-direction: column;
    margin-left: 25px;
    margin-right: 25px;
}

.playlist-category-view .fl-row {
    display: flex;
    flex-direction: row;
    margin-bottom: 10px;
    text-align: left;
}

.playlist-category-view .cate-title {
    font-size: 18px;
    font-weight: bold;
    /*
    background: linear-gradient(to top right, #28c83f, #1ca388);
    -webkit-background-clip: text;
    color: transparent;
    */
    color: #ddd;
    min-width: 36px;
    margin-top: 15px;
    margin-right: 15px;
}

.playlist-category-view .fl-item {
    font-size: 15px;
    padding: 6px 16px;
    margin-top: 10px;
    margin-right: 10px;
    float: left;
    cursor: pointer;
    color: #bcbcbc;
    border-radius: 10rem;
}

.playlist-category-view .fl-item:hover {
    background-color: var(--list-item-hover);
    color: var(--text-color);
}
    

.playlist-category-view .current {
    border-radius: 10rem;
    background: linear-gradient(to top right, #1ca388, #28c83f);
    color: var(--text-color);
}
</style>