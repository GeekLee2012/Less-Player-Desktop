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
    border: 1px solid var(--border-inputs-border-color);
    background-color: var(--content-inputs-bg-color);
    border-radius: var(--border-inputs-border-radius);
    padding: 5px;
    color: var(--content-inputs-text-color);
    cursor: default;
}
</style>