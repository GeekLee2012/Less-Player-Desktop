<script setup>
const props = defineProps({
    count: Number 
})
</script>

<template>
    <div class="category-bar-loading-mask">
        <span v-for="i in count" class="loading-mask">
        </span>
    </div>
</template>

<style scoped>
.category-bar-loading-mask span {
    width: 58px; 
    height: 23px;
    line-height: 36px;
    padding: 6px 15px;
    margin-right: 8px;
    margin-bottom: 6px; 
    border-radius: 10rem; 
    cursor: default; 
    display: inline-block;
}
</style>