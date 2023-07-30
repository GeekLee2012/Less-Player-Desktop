<script setup>
import { computed, nextTick, reactive, ref, toRefs, watch } from 'vue';
import PaginationToolbar from './PaginationToolbar.vue';



//TODO 设计复杂，逻辑较乱
const props = defineProps({
    data: Array,
    paginationStyleType: Number, // 0 => 普通， 1 => 瀑布流，下拉翻页
    direction: Number, //0 => row, 1 => column
    limit: Number,
    maxPage: Number,
    loadPage: Function,
    onPageLoaded: Function,
    loading: Boolean,
    nextPagePendingMark: Number,    //下一页
    refreshAllPendingMark: Number,  //刷新全部
    refreshPagePendingMark: Number, //刷新当前页
})

//数据优先级： props.data > dataFromLoad
const { data, limit, maxPage,
    paginationStyleType, nextPagePendingMark,
    refreshAllPendingMark, refreshPagePendingMark } = toRefs(props)
const dataFromLoad = reactive([])

const currentPage = ref(1)
const currentPageMatchLimit = ref(null)
const setCurrentPage = (value) => currentPage.value = value
const setCurrentPageMatchLimit = (value) => currentPageMatchLimit.value = value
const totalPageFromLoad = ref(0)

const getMaxPage = computed(() => {
    return totalPageFromLoad.value || maxPage.value
})

const onPageChanged = async ({ offset, limit, page }) => {
    setCurrentPage(page)
    const { paginationStyleType, loadPage, onPageLoaded, data: dataInProps } = props
    if (!loadPage) return
    const isNormalStyleType = (paginationStyleType == 0)

    const result = await loadPage({ offset, limit, page, dataInProps })
    if (!result) return

    if (isNormalStyleType || page == 1 || offset == 0) dataFromLoad.length = 0

    const { data: rData, total } = result
    if (rData) {
        setCurrentPageMatchLimit(rData.length === limit)
        dataFromLoad.push(...rData)
    }
    if (total >= 0) totalPageFromLoad.value = total
    if (onPageLoaded) onPageLoaded({ offset, limit, page, data: rData, total })
}

const paginationToolbarRef = ref(null)
const nextPage = (event) => {
    const isNormalStyleType = (paginationStyleType.value == 0)
    if (!paginationToolbarRef.value || isNormalStyleType) return

    paginationToolbarRef.value.nextPage(event)
}

const refreshAll = () => {
    dataFromLoad.length = 0
    if (data.value || !paginationToolbarRef.value) return
    paginationToolbarRef.value.goToPage(1)
}

const refreshPage = () => {
    dataFromLoad.length = 0
    if (data.value || !paginationToolbarRef.value) return
    paginationToolbarRef.value.refreshPage()
}

const isLastPageContent = computed(() => {
    if (paginationStyleType.value != 0) return false
    if (!currentPageMatchLimit.value) return true
    return currentPage == maxPage.value
})

const showToolbar = computed(() => {
    return paginationStyleType.value == 0 && getMaxPage.value > 1
})

watch(nextPagePendingMark, nextPage, { immediate: true })
watch(refreshPagePendingMark, refreshPage, { immediate: true })
watch(refreshAllPendingMark, () => { nextTick(refreshAll) }, { immediate: true })
watch(paginationStyleType, refreshAll, { immediate: true })
</script>

<template>
    <div class="pagination-tiles">
        <div class="pag-content" :class="{ 'last-pag-content': isLastPageContent, 'flex-column': (direction == 1) }"
            v-show="!loading">
            <div class="pag-tile" v-for="(item, index) in (data || dataFromLoad)">
                <slot :item="item" :index="index"></slot>
            </div>
            <div>
                <slot name="loading1"></slot>
            </div>
        </div>
        <div>
            <slot name="loading2"></slot>
        </div>
        <PaginationToolbar ref="paginationToolbarRef" v-show="showToolbar" :limit="limit" :maxPage="getMaxPage"
            :onPageChanged="onPageChanged">
        </PaginationToolbar>
    </div>
</template>

<style scoped>
.pagination-tiles {
    display: flex;
    flex-direction: column;
    --content-min-height: 430px;
}

.pagination-tiles .spacing {
    margin-left: 20px;
}

.pagination-tiles .pag-content {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    flex: 1;
}

.pagination-tiles .flex-column {
    flex-direction: column;
}

.pagination-tiles .flex-column .pag-tile {
    width: 100%;
}

.pagination-tiles .last-pag-content {
    min-height: var(--content-min-height);
}
</style>