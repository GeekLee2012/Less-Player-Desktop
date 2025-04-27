<script setup>
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
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 202;
    --ntf-width: 266px;
    --ntf-height: 168px;
}

.ntf-dialog-mask {
    position: absolute;
    margin: auto;
    overflow: hidden;
    box-shadow: var(--box-shadow);
    /*transition: all 0.3s ease;*/
}

.ntf-dialog {
    width: var(--ntf-width);
    height: var(--ntf-height);
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