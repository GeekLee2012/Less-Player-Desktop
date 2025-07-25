<script setup>
import { ref } from 'vue';
import { toTrimString } from '../../common/Utils';



const props = defineProps({
    miniMode: Boolean,
    placeholder: String,
    beforeSubmitAction: Function,
    submitAction: Function,
    onClearAction: Function
})


const keywordRef = ref(null)
const hasText = ref(false)

const submitSearch = () => {
    const kwInputEl = keywordRef.value
    //简单处理特殊字符
    let keyword = toTrimString(kwInputEl.value)
    keyword = toTrimString(keyword.replace(/[#\\?]/g, ''))
    if (/^[@]+$/.test(keyword)) return

    const { beforeSubmitAction, submitAction } = props
    if (typeof beforeSubmitAction == 'function') keyword = beforeSubmitAction(keyword)
    if (typeof submitAction == 'function') submitAction(keyword)
}

const toggleClearBtn = () => {
    const data = keywordRef.value.value
    hasText.value = (data && data.length > 0)
    invokeKeywordClear()
}

const invokeKeywordClear = () => {
    if(hasText.value) return 
    const { onClearAction } = props
    if(typeof onClearAction == 'function') onClearAction()
}

const clear = () => {
    keywordRef.value.value = ""
    hasText.value = false
    invokeKeywordClear()
}

defineExpose({
    setKeyword: (keyword, options) => {
        if(!keywordRef.value) return 
        keywordRef.value.value = keyword
        toggleClearBtn()
        
        const { beforSubmit, submit } = options || {}
        if(beforSubmit) {
            const { beforSubmitAction } = props
            if (typeof beforSubmitAction == 'function') keyword = beforSubmitAction(keyword)
        }
        if(submit) {
            const { submitAction } = props
            if (typeof submitAction == 'function') submitAction(keyword)
        }
    },
    getKeyword: () => {
        const { value } = keywordRef.value || {}
        return value || ''
    }
})
</script>

<template>
    <div class="search-bar" :class="{ 'mini-search-bar': miniMode }" 
        @keydown.enter="submitSearch" 
        @keydown.stop="">
        <div class="search-btn" @click="submitSearch">
            <svg :width="miniMode ? 20 : 16" 
                :height="miniMode ? 20 : 16" 
                viewBox="0 0 726.24 726.5" xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_2" data-name="Layer 2">
                    <g id="Layer_1-2" data-name="Layer 1">
                        <path
                            d="M456.25,529.61C384.86,577,307.37,592.47,224,573.24,153.93,557.08,97.62,519,55.17,460.86-28.43,346.44-15.75,186.09,84.6,85.69c101.34-101.4,261-114.38,376.23-30.54,41.42,30.13,73,68.4,94.17,115.09,21.07,46.46,29.25,95.18,24.9,146-4.37,51-21.59,97.46-51.33,141.2,1.68,1.06,3.67,1.85,5,3.23Q622,549.41,710.24,638.25c14.25,14.32,19.28,31.43,13.88,50.84-10.61,38.09-57.48,50-86,22-23.29-22.9-46.23-46.15-69.33-69.24L459.56,532.66C458.52,531.62,457.4,530.67,456.25,529.61Zm56.64-238.83C513,168.29,413.34,68.68,290.67,68.67a221.82,221.82,0,0,0-222,222.1c0,122.25,99.47,221.82,221.82,222.16C412.61,513.26,512.77,413.22,512.89,290.78Z" />
                    </g>
                </g>
            </svg>
        </div>
        <div class="prefix-wrap">
            <slot name="prefix"></slot>
        </div>
        <input type="text" class="keyword" 
            ref="keywordRef" 
            :placeholder="placeholder"
            @input="toggleClearBtn" />
        <div class="suffix-wrap">
            <slot name="suffix"></slot>
        </div>
        <div class="clear-btn">
            <svg v-show="hasText" @click="clear" 
                width="10"  height="10" 
                viewBox="0 0 593.14 593.11"  data-name="Layer 1" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M900.38,540.1c-4.44-4.19-8-7.42-11.45-10.83Q783.57,424,678.2,318.63c-13.72-13.69-18.55-29.58-11.75-47.85,10.7-28.71,47.17-36.54,69.58-14.95,18.13,17.45,35.68,35.49,53.47,53.28Q872.75,392.36,956,475.63a47.69,47.69,0,0,1,3.41,4.38c2.07-2,3.5-3.27,4.86-4.63Q1073,366.69,1181.63,258c12.79-12.8,27.71-17.69,45.11-12.36,28.47,8.73,39,43.63,20.49,67a88.49,88.49,0,0,1-6.77,7.34q-107.62,107.65-215.28,215.28c-1.41,1.41-2.94,2.7-4.94,4.53,1.77,1.82,3.2,3.32,4.66,4.79q108.7,108.71,217.39,217.42c15.1,15.11,18.44,35.26,8.88,52.5a42.4,42.4,0,0,1-66.64,10.22c-16.41-15.63-32.17-31.93-48.2-48L963.82,604.19c-1.16-1.16-2.38-2.24-3.83-3.6-1.59,1.52-3,2.84-4.41,4.23Q846.86,713.51,738.15,822.22c-14.56,14.56-33.07,18.24-50.26,10.12a42.61,42.61,0,0,1-14-66.31c1.74-2,3.65-3.89,5.53-5.78Q787.21,652.43,895,544.63C896.44,543.23,898.06,542.06,900.38,540.1Z"
                    transform="translate(-663.4 -243.46)" />
            </svg>
        </div>
    </div>
</template>

<style scoped>
.search-bar {
    display: flex;
    height: 34px;
    -webkit-app-region: none;
    --border-radius: var(--border-btn-border-radius);
    --btn-width: 33px;
}

.search-bar .search-btn,
.search-bar .prefix-wrap,
.search-bar .suffix-wrap,
.search-bar .keyword,
.search-bar .clear-btn {
    border: 1px solid var(--searchbar-border-color);
    height: 100%;
}

.search-bar .search-btn {
    /*border-radius: 10rem 0 0 10rem;*/
    border-radius: var(--border-radius) 0px 0px var(--border-radius);
    border-right: 0px;
    width: var(--btn-width);
    min-width: var(--btn-width);
    background: var(--searchbar-search-btn-bg-color);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.search-bar .search-btn:hover {
    background: var(--searchbar-search-btn-hover-bg-color);
}

.search-bar .search-btn svg {
    transform: translateX(2px) translateY(0.5px) scale(1.02);
    fill: var(--searchbar-search-btn-icon-color);
}

.search-bar .search-btn:hover svg {
    fill: var(--searchbar-search-btn-hover-icon-color);
}

.search-bar .prefix-wrap,
.search-bar .suffix-wrap {
    border-radius: 0px;
    border-left: 0px;
    border-right: 0px;
    background: var(--searchbar-bg-color);
    color: var(--searchbar-text-color);
}

.search-bar .keyword {
    font-size: var(--content-text-size);
    padding-left: 3px;
    padding-right: 0px;
    outline: 0;
    width: 168px;
    border-left: 0px;
    border-right: 0px;
    background: var(--searchbar-bg-color);
    color: var(--searchbar-text-color);
}

.search-bar .clear-btn {
    /*border-radius: 0 10rem 10rem 0;*/
    border-radius: 0px var(--border-radius) var(--border-radius) 0px;
    width: var(--btn-width);
    min-width: var(--btn-width);
    border-left: 0px;
    background: var(--searchbar-bg-color);
    display: flex;
    align-items: center;
    justify-content: center;
}

.search-bar .clear-btn svg {
    transform: translateX(-2px) scale(1.1);
    fill: var(--searchbar-clear-btn-icon-color);
    visibility: visible;
    cursor: pointer;
}

/* 
.search-bar .keyword::-webkit-input-placeholder {
    color: var(--searchbar-placeholder-color);
}
*/

.mini-search-bar {
    width: 32px;
}

.mini-search-bar .keyword {
    display: none;
}

.mini-search-bar .search-btn,
.mini-search-bar .keyword,
.mini-search-bar .clear-btn {
    border: 1px solid transparent;
}
</style>