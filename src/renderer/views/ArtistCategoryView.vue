<script setup>
import { useArtistSquareStore } from '../store/artistSquareStore';
import { onDeactivated, onMounted, onUnmounted, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { onEvents, emitEvents, offEvents } from '../../common/EventBusWrapper';



const { currentCategoryItems } = storeToRefs(useArtistSquareStore())
const { currentCategory, updateCurrentCategoryItem, resetCurrentCategoryItems } = useArtistSquareStore()
const categories = reactive([])

const updateCategory = () => {
    categories.length = 0
    const cached = currentCategory()
    if (cached) categories.push(...cached)
    resetCurrentCategoryItems()
}

const resetScroll = () => {
    const viewEl = document.querySelector('.artist-category-view .container')
    if(viewEl) viewEl.scrollTop = 0
}

const visitCateItem = (name, item, index) => {
    updateCurrentCategoryItem(name, item, index)
    //hideArtistCategoryView()
}



/* 生命周期、监听 */
const eventsRegistration = {
    'artistCategory-update': updateCategory,
    'artistCategory-resetScroll': resetScroll,
}
onMounted(() => onEvents(eventsRegistration))
onDeactivated(resetScroll)
onUnmounted(() => offEvents(eventsRegistration))
</script>

<template>
    <div class="artist-category-view" @click.stop="">
        <div class="container">
            <div class="header">
                <span class="cate-title">全部分类</span>
                <div class="action">
                    <div class="reset-btn text-btn" @click="resetCurrentCategoryItems">
                        <svg width="16" height="16" viewBox="0 0 256 256" data-name="Layer 1"
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
            <div class="center">
                <div v-for="(cate, row) in categories" class="fl-row">
                    <div class="cate-title">{{ cate.name }}</div>
                    <div class="cate-item-wrap">
                        <div v-for="(item, col) in cate.data" class="fl-item"
                            :class="{ current: col == currentCategoryItems[cate.name].index }"
                            @click="visitCateItem(cate.name, item, col)" v-html="item.key">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.artist-category-view {
    display: flex;
    overflow: hidden;
    overflow-x: hidden;
    border-top-left-radius: var(--border-popover-border-radius);
    border-bottom-left-radius: var(--border-popover-border-radius);
}

.artist-category-view .container {
    overflow: scroll;
    overflow-x: hidden;
    padding-bottom: 30px;
    flex: 1;
    background: var(--content-bg-color);
    background: var(--content-bg-color-no-transparent);
}

.artist-category-view .header,
.artist-category-view .center {
    display: flex;
    /*flex-direction: row;*/
    text-align: left;
}

.artist-category-view .header {
    padding: 15px 33px;
    border-bottom: 2px solid var(--border-header-nav-border-color);
}

.artist-category-view .header .cate-title {
    /*font-size: 21px;*/
    font-size: var(--content-text-module-title2-size);
    font-weight: bold;
    color: var(--content-subtitle-text-color);
    flex: 1;
}

.artist-category-view .header .action {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
}

.artist-category-view .text-btn {
    text-align: left;
    /*font-size: 15px;*/
    display: flex;
    align-items: center;
    justify-items: center;
    cursor: pointer;
    margin-left: 20px;
    /*font-size: var(--content-text-tip-text-size);*/
}

.artist-category-view .center {
    flex-direction: column;
    margin-left: 33px;
    margin-right: 33px;
}

.artist-category-view .fl-row {
    display: flex;
    flex-direction: row;
    margin-bottom: 10px;
    text-align: left;
}

.artist-category-view .center .cate-title {
    font-size: 19px;
    font-weight: bold;
    color: var(--content-subtitle-text-color);
    min-width: 39px;
    margin-top: 15px;
    margin-right: 20px;
}

.artist-category-view .cate-item-wrap {
    display: flex;
    flex-wrap: wrap;
}

.artist-category-view .fl-item {
    /*font-size: 15px;*/
    padding: 6px 20px;
    margin-top: 10px;
    margin-right: 10px;
    float: left;
    cursor: pointer;
    color: var(--content-text-color);
    font-size: var(--content-text-subtitle-size);
    border-radius: var(--border-list-item-border-radius);
}

.artist-category-view .fl-item:hover {
    background-color: var(--content-list-item-hover-bg-color);
    color: var(--content-text-color);
}


.artist-category-view .current {
    border-radius: 10rem;
    /*
    background: var(--button-icon-text-btn-bg-color) !important;
    color: var(--button-icon-text-btn-icon-color) !important;
    */
    background: var(--content-list-item-hl-bg-color) !important;
    color: var(--content-list-item-hl-text-color) !important;
}

.contrast-mode .artist-category-view .current {
    font-weight: bold;
}
</style>