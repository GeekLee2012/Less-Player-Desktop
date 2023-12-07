<!-- 比较鸡肋糟糕的组件设计 -->
<script setup>
import { computed, watch } from 'vue';

const props = defineProps({
    platform: String,
    data: Array
})

const computedTextItem = computed(() => {
    return (item, platform) => {
        //console.log(JSON.stringify(item))
        item = item.replace(/:/g, '：')
        if (platform == 'netease') {
            return item.replace(/(<i>&nbsp;<\/i>)/g, '')
                .replace(/(。)/g, '。<br/>')
        } else if (platform == 'kuwo') {
            return item.replace(/(<br\/>&nbsp;)/g, '<br>')
        } else if (platform == 'kugou') {
            return item.replace(/(\n\t\t\t\t)/g, '')
                .replace(/(\n)/g, '')
                .replace(/(\t)/g, '')
                .replace(/(。)/g, '。<br/>')
        }
        return item
    }
})
</script>

<template>
    <div class="textlist-ctl" :class="platform">
        <div v-for="item in data" v-html="computedTextItem(item, platform)">
        </div>
    </div>
</template>

<style>
.textlist-ctl {
    font-size: var(--content-text-size);
    text-align: left;
    color: var(--text-sub-text);
    line-height: 33px;
    word-wrap: break-word;
    /*white-space: pre-wrap;*/
    line-break: anywhere;
    word-break: normal;
}

.textlist-ctl h2,
.textlist-ctl h3 {
    font-size: 20px;
    font-weight: bold;
}

.textlist-ctl.netease p {
    margin-bottom: 28px;
}

.textlist-ctl.qq p {
    margin-top: 0px;
    margin-bottom: 8px;
}
</style>