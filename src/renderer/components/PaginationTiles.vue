<script setup>
</script>

<template>
    <div class="pagination-tiles">
        <slot name="data"></slot>
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