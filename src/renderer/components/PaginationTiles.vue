<script setup>
//TODO 目前仅作为标记性组件，并无任何实现逻辑
</script>

<template>
    <div class="pagination-tiles">
        <slot></slot>
    </div>
</template>

<style>
 .pagination-tiles {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    /*
    justify-content: center;
    align-items: center;
    */
}
</style>