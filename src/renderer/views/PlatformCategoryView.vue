<script setup>
import { onDeactivated } from 'vue';
import { storeToRefs } from 'pinia';
import { useSearchStore } from '../store/searchStore';
import { useAppCommonStore } from '../store/appCommonStore';



const { currentPlatformIndex, platforms } = storeToRefs(useSearchStore())
const { setCurrentPlatformIndex } = useSearchStore()
const { hidePlatformCategoryView } = useAppCommonStore()

const visitItem = (item, index) => {
    setCurrentPlatformIndex(index)
    hidePlatformCategoryView()
}

const resetScroll = () => {
    const viewEl = document.querySelector(".platform-category-view .container")
    if (viewEl) viewEl.scrollTop = 0
}

onDeactivated(resetScroll)
</script>

<template>
    <div class="platform-category-view" @click.stop="">
        <div class="container">
            <div class="header">
                <div class="cate-title">全部平台</div>
                <div class="fl-item content-text-highlight"></div>
            </div>
            <div class="center">
                <div v-for="(item, index) in platforms" class="fl-item"
                    :class="{ current: (currentPlatformIndex == index) }" @click.stop="visitItem(item, index)"
                    v-html="item.name">
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.platform-category-view {
    display: flex;
    overflow: hidden;
    overflow-x: hidden;
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
}

.platform-category-view .container {
    overflow: scroll;
    overflow-x: hidden;
    padding-bottom: 30px;
    flex: 1;
    background: var(--content-bg-color);
    background: var(--content-bg-color-no-transparent);
}

.platform-category-view .header,
.platform-category-view .center {
    display: flex;
    text-align: left;
}

.platform-category-view .header {
    /*margin-top: 5px;*/
    margin-bottom: 5px;
    padding-bottom: 10px;
    padding-left: 33px;
    padding-right: 33px;
    border-bottom: 1px solid var(--border-color);
}

.platform-category-view .header .cate-title {
    /*margin-right: 1px;*/
    flex: 1;
}

.platform-category-view .header .fl-item,
.platform-category-view .header .fl-item:hover {
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

.platform-category-view .center {
    align-items: center;
    flex-wrap: wrap;
    margin-left: 33px;
    margin-right: 33px;
}

.platform-category-view .cate-title {
    font-size: 19px;
    font-weight: bold;
    color: var(--content-subtitle-text-color);
    min-width: 39px;
    margin-top: 15px;
    margin-right: 20px;
}

.platform-category-view .header .cate-title {
    /*font-size: 21px;*/
    margin-bottom: 3px;
    font-size: var(--content-text-module-title2-size);
}

.platform-category-view .fl-item {
    /*float: left;*/
    /* font-size: 15px; */
    padding: 8px 16px;
    margin-top: 15px;
    margin-right: 10px;
    white-space: nowrap;
    cursor: pointer;
    color: var(--content-text-color);
    border-radius: var(--border-list-item-border-radius);
    font-size: var(--content-text-subtitle-size);
}

.platform-category-view .fl-item:hover {
    background-color: var(--content-list-item-hover-bg-color);
    color: var(--content-text-color);
}

.platform-category-view .header .current {
    font-weight: bold;
}

.platform-category-view .center .current {
    border-radius: var(--border-list-item-border-radius);
    background: var(--button-icon-text-btn-bg-color) !important;
    color: var(--button-icon-text-btn-icon-color) !important;
}

.contrast-mode .platform-category-view .center .current {
    font-weight: bold;
}
</style>