<script setup>
import { toRef } from 'vue';



const props = defineProps({
    data: Array,
    values: Array, //格式：[false, true, true]
    onChanged: Function
})

const currentValues = toRef(props, 'values')

const toggleItem = (item, index) => {
    const _values = currentValues.value
    _values[index] = !_values[index]

    const { onChanged } = props
    if (onChanged) onChanged(_value, index)
}
</script>

<template>
    <div class="multi-selection-ctl">
        <div v-for="(item, index) in data" :class="{
            item: true,
            first: (index == 0),
            last: (index == data.length - 1),
            active: (values[index])
        }" 
        @click="toggleItem(item, index)" 
        v-html="item">
        </div>
    </div>
</template>

<style scoped>
.multi-selection-ctl {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    flex: 1;
    --item-border: 1px solid var(--border-inputs-border-color);
    --item-border-radius: var(--border-inputs-border-radius);
}

.multi-selection-ctl .item {
    border-width: 0px;
    border-left: var(--item-border);
    border-top: var(--item-border);
    border-bottom: var(--item-border);
    width: 88px;
    height: 36px;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    /*
    text-align: center;
    vertical-align: middle;
    background-color: var(--content-list-item-hover-bg-color);
    background-color: var(--button-toggle-btn-bg-color);
    */
}

.multi-selection-ctl .item:hover {
    background: var(--content-list-item-hover-bg-color);
}

.multi-selection-ctl .first {
    border-top-left-radius: var(--item-border-radius);
    border-bottom-left-radius: var(--item-border-radius);
    /*padding-left: 10px;*/
}

.multi-selection-ctl .last {
    border-top-right-radius: var(--item-border-radius);
    border-bottom-right-radius: var(--item-border-radius);
    border-right: var(--item-border);
    /*padding-right: 10px;*/
}

.multi-selection-ctl .active {
    background: var(--content-list-item-hl-bg-color) !important;
    color: var(--content-list-item-hl-text-color) !important;
}

.contrast-mode .multi-selection-ctl .active {
    font-weight: bold;
}
</style>