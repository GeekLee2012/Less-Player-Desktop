<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import PaginationToolbar from './PaginationToolbar.vue';



//TODO 设计复杂，逻辑较乱
const props = defineProps({
    data: Array,
    paginationStyleType: Number,
    limit: Number,
    maxPage: Number,
    loadPage: Function,
    onPageLoaded: Function,
    loading: Boolean,
    nextPagePendingMark: Number,
    refreshPendingMark: Number,
})

//数据优先级： props.data > dataFromLoad
const maxPage = ref(props.maxPage || -1)
const dataFromLoad = reactive([])

const currentPage = ref(1)
const currentPageMatchLimit = ref(null)
const setCurrentPage = (value) => currentPage.value = value
const setCurrentPageMatchLimit = (value) => currentPageMatchLimit.value = value

const onPageChanged = async ({ offset, limit, page }) => {
    setCurrentPage(page)
    const { paginationStyleType, loadPage, onPageLoaded, data: dataInProps } = props
    if (!loadPage) return
    const isNormalStyleType = (paginationStyleType === 0)

    const result = await loadPage({ offset, limit, page, dataInProps })
    if (!result) return

    if (isNormalStyleType) dataFromLoad.length = 0

    const { data, total } = result
    if (data) {
        setCurrentPageMatchLimit(data.length === limit)
        dataFromLoad.push(...data)
    }
    if (total >= 0) maxPage.value = total
    if (onPageLoaded) onPageLoaded({ offset, limit, page, data, total })
}

const paginationToolbarRef = ref(null)
const nextPage = (event) => {
    const isNormalStyleType = (props.paginationStyleType === 0)
    if (!paginationToolbarRef.value || isNormalStyleType) return

    paginationToolbarRef.value.nextPage(event)
}

const refresh = () => {
    dataFromLoad.length = 0
    if (props.data || !paginationToolbarRef.value) return
    paginationToolbarRef.value.goToPage(1)
}

/*
const paginationTilesRef = ref(null)
const scrollToLoad = (event) => {
    if (!paginationTilesRef.value) return

    const { scrollTop, scrollHeight, clientHeight } = paginationTilesRef.value
    //markScrollState()
    console.log(scrollTop, scrollHeight, clientHeight)
    const allowedError = 10 //允许误差
    if ((scrollTop + clientHeight + allowedError) >= scrollHeight) {
        nextPage(event)
    }
}
*/

const isLastPageContent = computed(() => {
    if (props.paginationStyleType !== 0) return false
    if (!currentPageMatchLimit.value) return true
    return currentPage === maxPage
})

watch(() => props.nextPagePendingMark, nextPage, { immediate: true })
watch(() => props.refreshPendingMark, refresh, { immediate: true })
watch(() => props.data, (nv, ov) => {
    dataFromLoad.length = 0
    if (nv && nv.length > 0) dataFromLoad.push(...nv)
}, { immediate: true, deep: true })
watch(() => props.maxPage, (nv, ov) => { maxPage.value = nv }, { immediate: true })
watch(() => props.paginationStyleType, refresh, { immediate: true })

onMounted(refresh)
</script>

<template>
    <div class="pagination-tiles">
        <div class="pag-content" :class="{ 'last-pag-content': isLastPageContent }" v-show="!loading">
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
        <PaginationToolbar ref="paginationToolbarRef" v-show="paginationStyleType === 0 && maxPage" :limit="limit"
            :maxPage="maxPage" :onPageChanged="onPageChanged">
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

.pagination-tiles .last-pag-content {
    min-height: var(--content-min-height);
}
</style>