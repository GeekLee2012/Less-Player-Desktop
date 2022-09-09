//TODO
<script setup>
</script>

<template>
    <div class="ntf">
        <div class="ntf-dialog">
            <div class="ntf-text">
                <slot name="text"></slot>
            </div>
        </div>
    </div>
</template>

<style>
.ntf {
    width: 82.5%;
    height: 78%;
    margin: 72px 0px 88px 0px;
    background: transparent;
    position: fixed;
    left: 16.5%;
    z-index: 98;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
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
    margin-right: 16.5%;
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