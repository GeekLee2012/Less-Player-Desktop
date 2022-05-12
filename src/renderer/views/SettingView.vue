<script setup>
const ipcRenderer = electronAPI.ipcRenderer

const visitAuthor = () => {
    const url = 'https://github.com/GeekLee2012/'
    ipcRenderer.send('visit-link', url)
}
</script>

<template>
    <div id="setting-view">
        <div class="title">设置</div>
        <div class="center">
            <div class="row">
                <b>皮肤</b>
                <div></div>
            </div>
            <div class="row">
                <b>播放歌曲</b>
                <div></div>
            </div>
            <div class="row">
                <b>缓存</b>
                <div></div>
            </div>
            <div class="row">
                <b>菜单栏</b>
                <div></div>
            </div>
            <div class="row">
                <b>快捷键</b>
                <div></div>
            </div>
            <div class="row">
                <b>版本</b>
                <div>v 0.1.3</div>
            </div>
            <div class="row">
                <b>关于</b>
                <div class="about"><a @click.prevent="visitAuthor" href="#">RIVE2012</a></div>
            </div>
        </div>
    </div>
</template>

<style scoped>
#setting-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    text-align: left;
}

#setting-view .title {
    margin-left: 35px;
    margin-right: 35px;
    padding-top: 20px;
    font-size: 25px;
    font-weight: bold;
    padding-bottom: 15px;
    border-bottom: 1px solid #373737;
}

#setting-view .center {
    overflow: auto;
    padding-left: 35px;
    padding-right: 35px;
    padding-bottom: 15px;
}

#setting-view .center .row {
    display: flex;
    flex-direction: row;
    padding-top: 30px;
    padding-bottom: 30px;
    border-bottom: 1px solid #373737;
}

#setting-view .center .row b{
    font-size: 15px;
    font-weight: bold;
    width: 125px;
}

#setting-view .center .about a {
    text-decoration: none;
    color: var(--text-color);
}
</style>