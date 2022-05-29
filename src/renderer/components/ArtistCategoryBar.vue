<script setup>
import { storeToRefs } from 'pinia';
import { useMainViewStore } from '../store/mainViewStore';
import { useArtistSquareViewStore } from '../store/artistSquareViewStore';
import { Category } from '../../common/Category';

const { currentCategoryItems } = storeToRefs(useArtistSquareViewStore())
const { updateCurrentCategoryItem } = useArtistSquareViewStore()
const { toggleArtistCategoryView, hidePlaybackQueueView } = useMainViewStore()

const props = defineProps({
    data: Array,
    alphabet: Category
})

const toggleCategory = () => {
    hidePlaybackQueueView()
    toggleArtistCategoryView()
}

const visitCateItem = (name, item, index) => {
    updateCurrentCategoryItem(name, item, index)
}

const filterData = (data) => {
    if(!data) return []
    return [ data[0] ]
}
</script>

<template>
    <div class="artist-category-bar" >
        <div class="row">
            <svg @click.stop="toggleCategory" width="15" height="15" viewBox="0 0 29.3 29.3"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M23.51,15.66H17.3a1.55,1.55,0,0,0-.56.11,1.45,1.45,0,0,0-1.11,1.41v6.38a5.77,5.77,0,0,0,5.76,5.76h2.16a5.76,5.76,0,0,0,5.75-5.76V21.41a5.76,5.76,0,0,0-5.77-5.75Zm2.85,7.91a2.86,2.86,0,0,1-2.85,2.86H21.35a2.86,2.86,0,0,1-2.85-2.86v-5h5a2.86,2.86,0,0,1,2.85,2.86ZM12.52,15.76a1.55,1.55,0,0,0-.56-.11H5.75A5.76,5.76,0,0,0,0,21.41v2.15a5.76,5.76,0,0,0,5.75,5.76H7.91a5.78,5.78,0,0,0,5.72-5.76V17.18A1.47,1.47,0,0,0,12.52,15.76Zm-1.76,7.8a2.86,2.86,0,0,1-2.85,2.86H5.75A2.86,2.86,0,0,1,2.9,23.56V21.41a2.86,2.86,0,0,1,2.85-2.86h5Zm-5-9.89H12a1.55,1.55,0,0,0,.56-.11,1.45,1.45,0,0,0,1.1-1.42V5.76A5.77,5.77,0,0,0,7.87,0H5.75A5.76,5.76,0,0,0,0,5.76V7.91a5.77,5.77,0,0,0,5.75,5.75ZM2.9,5.76A2.86,2.86,0,0,1,5.75,2.9H7.91a2.86,2.86,0,0,1,2.85,2.86v5h-5A2.86,2.86,0,0,1,2.91,7.9ZM23.51,0H21.35a5.78,5.78,0,0,0-5.72,5.76v6.38a1.45,1.45,0,0,0,1.15,1.42,1.55,1.55,0,0,0,.56.11h6.21A5.76,5.76,0,0,0,29.3,7.91V5.76A5.76,5.76,0,0,0,23.54,0Zm2.85,7.91a2.86,2.86,0,0,1-2.85,2.86h-5v-5a2.86,2.86,0,0,1,2.85-2.86h2.16a2.86,2.86,0,0,1,2.85,2.86Z"/></g></g></svg>
            <template v-for="(cate, row) in filterData(data)" v-show="data.length > 0">
                <span v-for="(item, col) in cate.data"
                    @click="visitCateItem(cate.name, item, col)"
                    :class="{ active: col == currentCategoryItems[cate.name].index }"
                    v-html="item.key" >
                </span>
            </template>
        </div>
        <div class="row alphabet">
            <template v-for="(item, index) in alphabet.data" v-show="alphabet.data.length > 0">
                <span @click="visitCateItem('字母', item, index)"
                    :class="{ active: index == currentCategoryItems['字母'].index }"
                    v-html="item.key" >
                </span>
            </template>
        </div>
    </div>
</template>

<style scoped>
.artist-category-bar {
    margin-left: 10px;
    text-align: left;
}

.artist-category-bar .row {
    height: 36px;
    overflow: hidden;
    /*
    text-align: left;
    white-space: nowrap;
    */
}

.artist-category-bar .alphabet {
    margin-top: 3px;
    height: 72px;
    white-space: pre-line;
    word-break: break-all;
}

.artist-category-bar span {
    padding: 6px 15px;
    margin-right: 8px;
    vertical-align: middle;
    text-align: center;
    line-height: 36px;
    color: #ccc;
    font-size: 16px;
    cursor: pointer;
    border-radius: 10rem;
    border: 0.1px solid transparent;
    white-space: nowrap;
}

.artist-category-bar span:hover {
    background-color: var(--list-item-hover);
    color: var(--text-color);
}

.artist-category-bar svg {
    fill: var(--svg-color);
    margin-right: 15px;
    cursor: pointer;
    transform: translateY(3px);
}

.artist-category-bar svg:hover {
    fill: #28c83f;
}

.artist-category-bar .active {
    border-color: #28c83f;
    background: linear-gradient(to right, #1ca388, #28c83f);
    color: var(--text-color);
}
</style>