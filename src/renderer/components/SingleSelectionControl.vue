<script setup>
import { toRef } from 'vue';



const props = defineProps({
    data: Array,
    value: Number,
    onChanged: Function
})

const current = toRef(props, 'value')

const setCurrentIndex = (index) => {
    const { onChanged } = props
    if (onChanged) onChanged(index)
}
</script>

<template>
    <div class="single-selection-ctl">
        <div v-for="(item, index) in data" :class="{
            item: true,
            first: (index == 0),
            last: (index == data.length - 1),
            active: (index == current)
        }" @click="setCurrentIndex(index)" v-html="item">
        </div>
    </div>
</template>

<style scoped>
.single-selection-ctl {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    flex: 1;
    --item-border-color: var(--input-border-color);
}

.single-selection-ctl .item {
    border-width: 0px;
    border-left: 1px solid var(--item-border-color);
    border-top: 1px solid var(--item-border-color);
    border-bottom: 1px solid var(--item-border-color);
    padding: 4px 6px;
    cursor: pointer;
    font-size: 13px;
    text-align: center;
    /*
    background-color: var(--list-item-hover);
    background-color: var(--toggle-btn-bg);
    */
}

.single-selection-ctl .first {
    border-top-left-radius: 10rem;
    border-bottom-left-radius: 10rem;
    padding-left: 10px;
}

.single-selection-ctl .last {
    border-top-right-radius: 10rem;
    border-bottom-right-radius: 10rem;
    border-right: 1px solid var(--item-border-color);
    padding-right: 10px;
}

.single-selection-ctl .active {
    background: var(--btn-bg) !important;
    color: var(--svg-btn-color) !important;
}
</style>