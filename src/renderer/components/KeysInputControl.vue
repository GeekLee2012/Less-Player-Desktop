<script setup>
const props = defineProps({
    value: String
})

//TODO
</script>

<template>
    <div class="keys-input-ctl">
        <input type="text" :value="value" />
    </div>
</template>

<style>
.keys-input-ctl {
    background: transparent;
}

.keys-input-ctl input {
    border: 0px solid transparent;
    border-bottom: 1px solid #eee;
    background-color: var(--text-color);
    border-radius: 3px;
    padding: 5px;
    outline: 0;
    color: var(--bg-color);
}
</style>