//TODO
<script setup>
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
    z-index: 108;
}

.ntf-dialog-mask {
    position: absolute;
    margin: auto;
}

.ntf-dialog {
    width: 235px;
    height: 125px;
    border-radius: 12px;
    background-color: #eaeaeaea;
    background-color: var(--ntf-bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0px 0px 10px #161616;
}

.ntf-text {
    font-size: 18px;
    color: var(--ntf-text-color);
}

.ntf-text p {
    line-height: 30px;
}

.ntf-text svg {
    fill: var(--ntf-text-color);
}
</style>