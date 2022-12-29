<script setup>
const props = defineProps({
    text: String,
    leftAction: Function,
    rightAction: Function,
    isDisabled: Boolean
})

const handleLeftClick = (event) => {
    const { isDisabled, leftAction } = props
    if (isDisabled) return
    if (leftAction) leftAction(event)
}

const handleRightClick = (event) => {
    const { isDisabled, rightAction } = props
    if (isDisabled) return
    if (rightAction) rightAction(event)
}
</script>

<template>
    <div class="svg-text-btn" :class="{ btnDisabled: isDisabled }">
        <div class="left-btn" @click="handleLeftClick">
            <div class="img">
                <slot name="left-img"></slot>
            </div>
            <div class="text">
                {{ text }}
            </div>
        </div>
        <div class="right-btn" @click="handleRightClick">
            <slot name="right-img"></slot>
            <slot name="right-text"></slot>
        </div>
    </div>
</template>

<style>
.svg-text-btn {
    display: flex;
    flex-direction: row;
    align-items: center;
    border-radius: 10rem;
    height: 32px;
    color: var(--svg-text-color);
}

.svg-text-btn svg {
    fill: var(--svg-btn-color);
}

.svg-text-btn .left-btn,
.svg-text-btn .right-btn {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--btn-bg);
    cursor: pointer;
}

.svg-text-btn .left-btn:hover,
.svg-text-btn .right-btn:hover {
    background: var(--btn-hover-bg);
}

.svg-text-btn .left-btn {
    /*width: 103px;*/
    border-radius: 10rem 0 0 10rem;
}

.svg-text-btn .left-btn .img {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 12px;
}

.svg-text-btn .right-btn {
    border-radius: 0 10rem 10rem 0;
    padding-left: 8px;
    padding-right: 10px;
    border-left: var(--svg-text-btn-rbtn-border);
}

.btnDisabled .left-btn:hover,
.btnDisabled .right-btn:hover {
    background: var(--btn-bg);
}

.svg-text-btn .left-btn .text {
    margin-left: 5px;
    margin-right: 8px;
}

.svg-text-btn .right-btn .text {
    margin-left: 1px;
    margin-right: 6px;
}
</style>