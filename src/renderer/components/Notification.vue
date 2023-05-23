<script setup>
//TODO
</script>

<template>
    <div class="ntf">
        <div class="ntf-dialog-mask">
            <div class="ntf-dialog container">
                <div class="ntf-text">
                    <slot name="text"></slot>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
.ntf {
    position: fixed;
    left: 50%;
    top: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 202;
}

.ntf-dialog-mask {
    position: absolute;
    margin: auto;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: var(--box-shadow);
}

.ntf-dialog {
    width: 265px;
    height: 163px;
    background: var(--content-bg-color);
    background: var(--content-bg-color-no-transparent);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.ntf-text {
    font-size: 20px;
}

.ntf-text p {
    line-height: 36px;
}

.ntf-text svg {
    fill: var(--content-text-color);
}
</style>