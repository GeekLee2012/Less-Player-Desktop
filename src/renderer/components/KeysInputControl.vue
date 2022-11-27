<script setup>
const props = defineProps({
    value: String
})

//TODO
</script>

<template>
    <div class="keys-input-ctl">
        <input type="text" :value="value" readonly="true" />
    </div>
</template>

<style>
.keys-input-ctl {
    background: transparent;
}

.keys-input-ctl input {
    border: 1px solid var(--input-border-color);
    /*border-bottom: 1px solid #eee;*/
    background-color: var(--input-bg);
    border-radius: 3px;
    padding: 5px;
    color: var(--input-text-color);
    cursor: default;
}
</style>