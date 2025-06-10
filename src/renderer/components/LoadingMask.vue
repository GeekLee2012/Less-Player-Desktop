<script setup>
import { computed } from 'vue';


const props = defineProps({
    //必须属性
    loading: Boolean,   
    //可选属性
    width: String,
    height: String,
    count: Number,
    classList: Object,
    marginTop: String,  
    marginBottom: String,
    marginLeft: String,
    marginRight: String,
})

const computedStyle = computed(() => {
    const { width, height, marginTop, marginBottom, marginLeft, marginRight } = props
    let style = ''
    if(width) style += `width: ${width};`
    if(height) style += `height: ${height};`   
    if(marginTop) style += `margin-top: ${marginTop};`
    if(marginBottom) style += `margin-bottom: ${marginBottom};`
    if(marginLeft) style += `margin-left: ${marginLeft};`
    if(marginRight) style += `margin-right: ${marginRight};`
    return style
})
</script>

<template>
    <div class="loading-mask inline-mask"
        :class="classList || {}"
        v-show="loading"
        v-for="i in Math.max(count || 1, 1)"
        :style="computedStyle">
    </div>
</template>

<style>
.inline-mask {
    display: inline-block;
}
</style>