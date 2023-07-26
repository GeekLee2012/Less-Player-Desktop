<script setup>
import { onMounted, reactive, watch } from 'vue';

//TODO 分页工具栏
const props = defineProps({
    limit: Number,
    maxPage: Number,
    onPageChanged: Function
})

const defaultMaxPage = 1024
const ellipsisPage = - defaultMaxPage

const pagination = reactive({ offset: 0, page: 1 })
const getMaxPage = () => {
    const { maxPage } = props
    const hasMaxPage = maxPage > 0
    return {
        hasMaxPage,
        maxPage: (hasMaxPage ? maxPage : defaultMaxPage)
    }
}

const getOffset = (page, limit) => {
    return Math.max((page - 1) * limit, 0)
}

const pageList = reactive([1, 2, 3, 4, 5, 6, 7, 8, 9])
const refreshPageList = () => {
    const { page } = pagination
    const { maxPage, hasMaxPage } = getMaxPage()

    let list = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    if (maxPage < 9) {
        list.splice(maxPage, 9 - maxPage)
    } else if (hasMaxPage) {
        if (page <= 6) {
            list = [1, 2, 3, 4, 5, 6, 7, ellipsisPage, maxPage]
        } else if (page < (maxPage - 4)) {
            list = [1, ellipsisPage, page - 2, page - 1, page, page + 1, page + 2, ellipsisPage, maxPage]
        } else {
            list = [1, ellipsisPage, maxPage - 6, maxPage - 5, maxPage - 4, maxPage - 3, maxPage - 2, maxPage - 1, maxPage]
        }
    } else if (page > 6) {
        if (page < (maxPage - 3)) {
            list = [1, ellipsisPage, page - 3, page - 2, page - 1, page, page + 1, page + 2, page + 3]
        } else {
            list = [1, ellipsisPage, maxPage - 6, maxPage - 5, maxPage - 4, maxPage - 3, maxPage - 2, maxPage - 1, maxPage]
        }
    }

    pageList.length = 0
    pageList.push(...list)
}

//转换特殊页
const resolvePresetPage = (page, index) => {
    if (page === ellipsisPage && index === 1) { //左边
        return Math.ceil((pagination.page - 3) / 2 + 1)
    } else if (page === ellipsisPage) { //右边
        const { maxPage } = getMaxPage()
        return Math.ceil((maxPage - pagination.page) / 2 + pagination.page)
    }
    return page
}

const goToPage = (page, event) => {
    const { onPageChanged, limit } = props
    const { maxPage } = getMaxPage()

    page = Math.max(page, 1)
    page = Math.min(page, maxPage)

    if (page === pagination.page && event) return false

    const offset = getOffset(page, limit)
    Object.assign(pagination, { offset, page })
    if (onPageChanged) onPageChanged({ offset, page, limit, maxPage })

    refreshPageList()
    return true
}

const prevPage = (event) => {
    return goToPage(pagination.page - 1, event)
}

const nextPage = (event) => {
    return goToPage(pagination.page + 1, event)
}

const refresh = (event) => {
    return goToPage(pagination.page, event)
}

watch(() => props.maxPage, refreshPageList)

defineExpose({
    prevPage,
    nextPage,
    goToPage,
    refresh,
})
</script>

<template>
    <div class="pagination-toolbar" v-show="pageList.length > 1">
        <div class="action">
            <div class="prev-btn btn" @click="prevPage">
                <svg width="18" height="18" viewBox="0 0 455.71 818.05" xmlns="http://www.w3.org/2000/svg">
                    <g id="Layer_2" data-name="Layer 2">
                        <g id="Layer_1-2" data-name="Layer 1">
                            <path
                                d="M101.17,405.1c2.89,1.94,5,2.89,6.47,4.41Q274.29,576.23,440.9,743c13.06,13.06,18.24,28.17,12.47,46-9.58,29.54-46.92,38.79-69.57,17.37-7.87-7.44-15.35-15.29-23-23L15.22,437.44C-5,417.2-5.07,392.34,15,372.23Q193.44,193.58,371.81,14.88C380.93,5.74,391.29-.19,404.44,0c17.18.25,30.24,8,37.94,23.27,7.79,15.43,6.19,30.66-3.89,44.78a60.83,60.83,0,0,1-6.7,7.4Q269.45,238,107.05,400.5C105.77,401.78,104.18,402.76,101.17,405.1Z" />
                        </g>
                    </g>
                </svg>
            </div>
            <ul>
                <li v-for="(page, index) in pageList" :class="{ active: page === pagination.page }"
                    @click="(event) => goToPage(resolvePresetPage(page, index), event)">
                    {{ page > 0 ? page : '...' }}
                </li>
            </ul>
            <div class="next-btn btn spacing" @click="nextPage">
                <svg width="18" height="18" viewBox="0 0 455.71 818.08" xmlns="http://www.w3.org/2000/svg">
                    <g id="Layer_2" data-name="Layer 2">
                        <g id="Layer_1-2" data-name="Layer 1">
                            <g id="Layer_2-2" data-name="Layer 2">
                                <g id="Layer_1-2-2" data-name="Layer 1-2">
                                    <path
                                        d="M354.54,413c-2.89-1.94-5-2.89-6.47-4.41Q181.42,241.85,14.81,75.08C1.75,62-3.43,46.91,2.34,29.08,11.92-.46,49.26-9.71,71.91,11.71c7.87,7.44,15.35,15.29,23,23L440.49,380.64c20.22,20.24,20.29,45.1.22,65.21Q262.27,624.5,83.9,803.2c-9.12,9.14-19.48,15.07-32.63,14.88-17.18-.25-30.24-8-37.94-23.27C5.54,779.38,7.14,764.15,17.22,750a61.07,61.07,0,0,1,6.7-7.4q162.34-162.55,324.74-325C349.94,416.3,351.53,415.32,354.54,413Z" />
                                </g>
                            </g>
                        </g>
                    </g>
                </svg>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pagination-toolbar {
    display: flex;
    flex-direction: column;
    flex: 1;

    --item-size: 50px;
    --item-spacing: 20px;
}

.pagination-toolbar .spacing {
    margin-left: 20px;
}

.pagination-toolbar .action {
    display: flex;
    align-items: center;
    margin: 10px 10px 20px 10px;
}

.pagination-toolbar .action .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--item-size);
    height: var(--item-size);
    border-radius: 3px;
}

.pagination-toolbar .action ul {
    list-style: none;
    height: var(--item-size);
    line-height: var(--item-size);
}

.pagination-toolbar .action ul li {
    list-style: none;
    float: left;
    width: var(--item-size);
    cursor: pointer;
    margin-left: var(--item-spacing);
    margin-bottom: 8px;
    border-bottom: 3px solid transparent;
    border-radius: 3px;
}

.pagination-toolbar .action .btn:hover,
.pagination-toolbar .action ul li:hover {
    background: var(--content-list-item-hover-bg-color);
}

.pagination-toolbar .action ul li.active {
    border-color: var(--content-highlight-color);
    border-bottom-left-radius: 0px;
    border-bottom-right-radius: 0px;
}
</style>