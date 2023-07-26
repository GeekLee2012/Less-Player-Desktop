<script setup>
import { computed, reactive, ref, watch } from 'vue';
import PaginationTiles from './PaginationTiles.vue';



const props = defineProps({
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
    pageLimit: Number,
})

const limit = ref(props.pageLimit || 2333)
const maxPage = computed(() => {
    const { data } = props
    if (!data || data.length < 0) return 0
    return Math.ceil(data.length / limit.value)
})

const currentOffset = ref(0)
const refreshPendingMark = ref(0)
const loadPageContent = ({ offset, limit, page }) => {
    currentOffset.value = offset
    const { data, paginationStyleType } = props
    if (!data || data.length < 0) return
    if (paginationStyleType !== 0) return { data }

    const pageData = data.slice(offset, offset + limit)
    return { data: pageData }
}

//TODO Bug: 播放歌曲时也被触发....
watch(() => props.data, (nv, ov) => {
    refreshPendingMark.value = Date.now()
}, { immediate: true, deep: true })
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
        <PaginationTiles :paginationStyleType="paginationStyleType" :limit="limit" :maxPage="maxPage"
            :loadPage="loadPageContent" :onPageLoaded="onPageLoaded" :loading="loading"
            :refreshPendingMark="refreshPendingMark">
            <template v-slot="{ item, index }">
                <SongItem :index="(currentOffset + index)" :data="item" :artistVisitable="artistVisitable"
                    :albumVisitable="albumVisitable" :dataType="dataType" :deleteFn="deleteFn" :checkbox="checkbox"
                    :checked="checkedAll" :ignoreCheckAllEvent="ignoreCheckAllEvent" :checkChangedFn="checkChangedFn">
                </SongItem>
            </template>
            <template #loading2>
                <div v-show="loading">
                    <div class="loading-mask" v-for="i in 12"
                        style="width: 100%;  height: 56px; margin-bottom: 3px; display: inline-block;"></div>
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

.songlist-ctl .pag-tile {
    width: 100%;
}
</style>