<script setup>
//TODO
</script>

<template>
    <div class="ntf">
        <div class="ntf-dialog-mask">
            <div class="ntf-dialog">
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
}

.ntf-dialog {
    width: 258px;
    height: 159px;
    border-radius: 12px;
    background: var(--ntf-bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0px 0px 10px var(--ntf-border-color);
}

.ntf-text {
    font-size: 20px;
    color: var(--ntf-text-color);
}

.ntf-text p {
    line-height: 36px;
}

.ntf-text svg {
    fill: var(--ntf-text-color);
}
</style>