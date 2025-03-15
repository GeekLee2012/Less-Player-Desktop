<script setup>
import { computed, ref, shallowRef, toRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import PaginationTiles from './PaginationTiles.vue';
import SongItem from './SongItem.vue';
import SongItemNew from './SongItemNew.vue';
import { useSettingStore } from '../store/settingStore'; 



const props = defineProps({
    id: String, //唯一性标识，同时用作刷新全部数据的依据
    data: Array,
    artistVisitable: Boolean,
    albumVisitable: Boolean,
    deleteFn: Function,
    dataType: Number,
    checkbox: Boolean,
    checkedAll: Boolean,
    ignoreCheckAllEvent: Boolean,
    checkChangedFn: Function,
    loading: Boolean,
    useExtra1: Boolean,
    useExtra2: Boolean,
    paginationStyleType: Number,
    onPageLoaded: Function,
    loadPage: Function,
    limit: Number,
    maxPage: Number,
    draggable: Boolean,
    //itemDisplayMode: Number,
})

const songItemRef = shallowRef(SongItemNew)
const limitFromProps  = toRef(props, 'limit')
const dataFromProps = toRef(props, 'data')
const maxPageFromProps = toRef(props, 'maxPage')
const paginationStyleType = toRef(props, 'paginationStyleType')
const { getSongItemStyleIndex } = storeToRefs(useSettingStore())

const getLimit = computed(() => (limitFromProps .value || 2333))

const getMaxPage = computed(() => {
    const maxPage = maxPageFromProps.value
    const data = dataFromProps.value
    const limit = limitFromProps.value
    if(maxPage && maxPage >= 0) return maxPage
    if (!data || data < 0) return 0
    return Math.ceil(data.length / limit)
})


const currentOffset = ref(0)
const refreshAllPendingMark = ref(0)
const refreshPagePendingMark = ref(0)
//let lastLoadTime = 0
const loadPageContent = ({ offset, limit, page }) => {
    /*
    const distance = (Date.now() - lastLoadTime)
    if (distance < 100) return
    lastLoadTime = Date.now()
    */

    currentOffset.value = offset
    const { loadPage } = props
    if (typeof loadPage == 'function') return loadPage({ offset, limit, page })

    if (!dataFromProps.value || dataFromProps.value.length < 0) return
    if (paginationStyleType.value != 0) return { data: dataFromProps.value }

    const pageData = dataFromProps.value.slice(offset, offset + limit)
    return { data: pageData }
}


/* 生命周期、监听 */
//TODO 逻辑上有Bug, 暂时先这样
/*
watch(() => dataFromProps.value.length, (nv, ov) => {
    if (ov && nv) {
        refreshPagePendingMark.value = Date.now()
    } else {
        refreshAllPendingMark.value = Date.now()
    }
})

watch(() => dataFromProps.value.length > 0 && dataFromProps.value[0].id, (nv, ov) => {
    refreshAllPendingMark.value = Date.now()
})
*/

watch(() => props.id, (nv, ov) => {
    refreshAllPendingMark.value = Date.now()
}, { immediate: true })

//偷懒写法，作为组件一般不应与设置settingStore直接关联
watch(getSongItemStyleIndex, (nv, ov) => {
    songItemRef.value = nv ? SongItemNew : SongItem
}, { immediate: true })
</script>

<!--
<template>
    <div class="songlist-ctl">
        <div v-for="(item, index) in data" v-show="!loading">
            <SongItem :index="index" :data="item" :artistVisitable="artistVisitable" :albumVisitable="albumVisitable"
                :dataType="dataType" :deleteFn="deleteFn" :checkbox="checkbox" :checked="checkedAll"
                :ignoreCheckAllEvent="ignoreCheckAllEvent" :checkChangedFn="checkChangedFn">
            </SongItem>
        </div>
        <div v-show="loading">
            <div class="loading-mask" v-for="i in 12"
                style="width: 100%;  height: 56px; margin-bottom: 3px; display: inline-block;"></div>
        </div>
    </div>
</template>
-->
<template>
    <div class="songlist-ctl">
        <PaginationTiles 
            :paginationStyleType="paginationStyleType" 
            :direction="1" 
            :limit="getLimit" 
            :maxPage="getMaxPage"
            :loadPage="loadPageContent" 
            :onPageLoaded="onPageLoaded" 
            :loading="loading"
            :refreshAllPendingMark="refreshAllPendingMark" 
            :refreshPagePendingMark="refreshPagePendingMark">
            <template v-slot="{ item, index }">
                <component :is="songItemRef"
                    :index="(currentOffset + index)" 
                    :data="item"
                    :draggable="draggable"
                    :artistVisitable="artistVisitable"
                    :albumVisitable="albumVisitable" 
                    :dataType="dataType" 
                    :deleteFn="deleteFn" 
                    :checkbox="checkbox"
                    :checked="checkedAll" 
                    :ignoreCheckAllEvent="ignoreCheckAllEvent" 
                    :checkChangedFn="checkChangedFn">
                </component>
            </template>
            <template #loading2>
                <div v-show="loading">
                    <div class="loading-mask" v-for="i in 20"
                        style="width: 100%;  height: 56px; margin-bottom: 3px; display: inline-block;">
                    </div>
                </div>
            </template>
        </PaginationTiles>
    </div>
</template>

<style>
.songlist-ctl {
    display: flex;
    flex-direction: column;
}
</style>