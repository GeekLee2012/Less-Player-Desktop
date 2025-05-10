<script>
</script>

<template>
    <div class="app-logo-wrap">
        <div class="app-logo">
            <span>L</span>
        </div>
        <div class="app-name">Less Player</div>
    </div>
</template>

<style>
.app-logo-wrap {
    display: flex;
    flex-direction: row;
    align-items: center;
}

.app-logo-wrap .app-logo {
    width: 27px;
    height: 27px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10rem 0 10rem 10rem;
    border: 0px solid;
    font-weight: bold;
    background: var(--app-logo-bg-color);
}

.app-logo-wrap .app-logo span {
    width: 16px;
    height: 16px;
    line-height: 16px;
    font-size: 14px;
    text-align: center;
    vertical-align: middle;
    border-radius: 10rem;
    background: var(--app-logo-inner-bg-color);
    color: var(--app-logo-inner-text-color);
}

.app-logo-wrap .app-name {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 10px;
    font-size: 20px;
    font-weight: bold;
    background: var(--app-logo-app-name-text-color);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}
</style>