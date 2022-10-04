<script setup>
const props = defineProps({
    value: String
})

//TODO
</script>

<template>
    <div class="keys-input-ctl">
        <input type="text" :value="value" @keydown.stop=""/>
    </div>
</template>

<style>
.keys-input-ctl {
    background: transparent;
}

.keys-input-ctl input {
    border: 1px solid var(--keyinput-ctl-border);
    /*border-bottom: 1px solid #eee;*/
    background-color: var(--keyinput-ctl-bg);
    border-radius: 3px;
    padding: 5px;
    outline: 0;
    color: var(--searchbar-text-color);
}
</style>