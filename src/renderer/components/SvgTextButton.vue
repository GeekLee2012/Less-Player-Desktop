<script setup>
const props = defineProps({
    text: String,
    leftAction: Function,
    rightAction: Function,
    disabled: Boolean,
    useEvent: Boolean
})

const handleLeftClick = (event) => {
    const { disabled, leftAction, useEvent } = props
    if (disabled) return
    const _event = useEvent ? event : null
    if (leftAction) leftAction(_event)
}

const handleRightClick = (event) => {
    const { disabled, rightAction, useEvent } = props
    if (disabled) return
    const _event = useEvent ? event : null
    if (rightAction) rightAction(_event)
}
</script>

<template>
    <div class="svg-text-btn" :class="{ 'button-disabled': disabled }">
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
    height: 36px;
    color: var(--button-icon-text-btn-text-color);
}

.svg-text-btn svg {
    fill: var(--button-icon-text-btn-icon-color);
}

.svg-text-btn .left-btn,
.svg-text-btn .right-btn {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--button-icon-text-btn-bg-color);
    cursor: pointer;
}

.svg-text-btn .left-btn:hover,
.svg-text-btn .right-btn:hover {
    background: var(--button-icon-text-btn-hover-bg-color);
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

.button-disabled .left-btn:hover,
.button-disabled .right-btn:hover {
    background: var(--button-icon-text-btn-bg-color);
    cursor: default;
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