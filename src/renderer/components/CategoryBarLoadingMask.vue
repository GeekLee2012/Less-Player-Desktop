<script setup>
const props = defineProps({
    count: Number 
})
</script>

<template>
    <div class="category-bar-loading-mask">
        <span class="loading-mask first-mask">
        </span>
        <span v-for="i in count" class="loading-mask">
        </span>
    </div>
</template>

<style scoped>
.category-bar-loading-mask span {
    width: 52px; 
    height: 23px;
    line-height: 36px;
    padding: 6px 15px;
    margin-right: 8px;
    margin-bottom: 6px; 
    border-radius: var(--border-list-item-border-radius);
    display: inline-block;
}

.category-bar-loading-mask span.first-mask {
    width: 34px; 
    height: 34px;
    padding: 0px;
    border-radius: 5px;
    display: none;
}
</style>