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
    --item-border: 1px solid var(--border-inputs-border-color);
    --item-border-radius: var(--border-inputs-border-radius);
}

.single-selection-ctl .item {
    border-width: 0px;
    border-left: var(--item-border);
    border-top: var(--item-border);
    border-bottom: var(--item-border);
    padding: 4px 9px;
    cursor: pointer;
    font-size: 14px;
    text-align: center;
    /*
    background-color: var(--content-list-item-hover-bg-color);
    background-color: var(--button-toggle-btn-bg-color);
    */
}

.single-selection-ctl .item:hover {
    background: var(--content-list-item-hover-bg-color);
}

.single-selection-ctl .first {
    border-top-left-radius: var(--item-border-radius);
    border-bottom-left-radius: var(--item-border-radius);
    /*padding-left: 10px;*/
}

.single-selection-ctl .last {
    border-top-right-radius: var(--item-border-radius);
    border-bottom-right-radius: var(--item-border-radius);
    border-right: var(--item-border);
    /*padding-right: 10px;*/
}

.single-selection-ctl .active {
    background: var(--content-list-item-hl-bg-color) !important;
    color: var(--content-list-item-hl-text-color) !important;
}

.contrast-mode .single-selection-ctl .active {
    font-weight: bold;
}
</style>