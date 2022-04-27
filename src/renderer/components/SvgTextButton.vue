<script setup>
const props = defineProps({
    text: String,
    leftAction: Function,
    rightAction: Function
})
</script>

<template>
    <div class="svgTextButton">
        <div class="left-btn" @click="leftAction">
            <div class="img">
                <slot name="left-img"></slot>
            </div>
            <div class="text">
                {{ text }}
            </div>
        </div>
        <div class="right-btn" @click="rightAction">
            <slot name="right-img"></slot>
        </div>
    </div>
</template>

<style scoped>
.svgTextButton {
    display: flex;
    flex-direction: row;
    align-items: center;
    border-radius: 10rem;
    height: 32px;
    cursor: pointer;
    color: var(--svg-text-color);
}

.left-btn,
.right-btn {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--btn-bg);
}

.left-btn:hover,
.right-btn:hover {
    background: var(--btn-hover-bg);
}

.left-btn {
    /*width: 103px;*/
    border-radius: 10rem 0 0 10rem;
}

.left-btn .img {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 12px;
}

.left-btn .text {
    margin-left: 5px;
    margin-right: 8px;
}

.right-btn {
    border-radius: 0 10rem 10rem 0;
    padding-left: 8px;
    padding-right: 10px;
}
</style>