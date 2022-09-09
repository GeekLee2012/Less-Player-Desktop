<script setup>

</script>

<template>
    <div id="userhome-view">
        <div class="center">
            <div class="subtitle">页面开发测试中，近期将大刀阔斧修改，最终效果将......</div>
            <div class="subtitle">
                我的收藏
            </div>
            <div class="row">
                <div class="card-ctl">
                    <div>
                        <b>1000个</b>
                        <span>歌单</span>
                    </div>
                </div>
                <div class="card-ctl card-ctl-spacing">
                    <div>
                        <b>0个</b>
                        <span>专辑</span>
                    </div>
                </div>
                <div class="card-ctl card-ctl-spacing">
                    <div>
                        <b>0个</b>
                        <span>歌手</span>
                    </div>
                </div>
                <div class="card-ctl card-ctl-spacing">
                    <div>
                        <b>0个</b>
                        <span>FM电台</span>
                    </div>
                </div>
            </div>

            <div class="subtitle">
                最近播放
            </div>
            <div class="row">
                <div class="card-ctl">
                    <div>
                        <b>1000个</b>
                        <span>歌单</span>
                    </div>
                </div>
                <div class="card-ctl card-ctl-spacing">
                    <div>
                        <b>0个</b>
                        <span>专辑</span>
                    </div>
                </div>
                <div class="card-ctl card-ctl-spacing">
                    <div>
                        <b>0个</b>
                        <span>歌手</span>
                    </div>
                </div>
                <div class="card-ctl card-ctl-spacing">
                    <div>
                        <b>0个</b>
                        <span>FM电台</span>
                    </div>
                </div>
            </div>

            <div class="subtitle">
                听歌报告（是否实现？待定）
            </div>
            <div class="row">
                <div class="card-ctl">
                    <div>
                        <span>今日</span>
                    </div>
                </div>
                <div class="card-ctl card-ctl-spacing">
                    <div>
                        <span>昨天</span>
                    </div>
                </div>
                <div class="card-ctl card-ctl-spacing">
                    <div>
                        <span>最近三天</span>
                    </div>
                </div>
                <div class="card-ctl card-ctl-spacing">
                    <div>
                        <span>本周</span>
                    </div>
                </div>
                <div class="card-ctl card-ctl-spacing">
                    <div>
                        <span>上周</span>
                    </div>
                </div>
                <div class="card-ctl card-ctl-spacing">
                    <div>
                        <span>本月</span>
                    </div>
                </div>
                <div class="card-ctl card-ctl-spacing">
                    <div>
                        <span>上个月</span>
                    </div>
                </div>
                <div class="card-ctl card-ctl-spacing">
                    <div>
                        <span>...</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
#userhome-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    text-align: left;
    overflow: auto;
}

#userhome-view .title {
    margin-left: 35px;
    margin-right: 35px;
    padding-top: 25px;
    font-size: 25px;
    font-weight: bold;
    padding-bottom: 20px;
    /*border-bottom: 2px solid var(--setting-bottom-border-color);*/
}

#userhome-view .center {
    padding-left: 35px;
    padding-right: 35px;
    padding-bottom: 30px;
}

#userhome-view .center .row {
    display: flex;
    flex-direction: row;
    padding-bottom: 35px;
    /*
    padding-top: 15px;
    border-bottom: 2px solid var(--setting-bottom-border-color);
    */
}

#userhome-view .center .last-row {
    border-color: transparent;
}

#userhome-view .center .row > b {
    font-size: 16.5px;
    font-weight: bold;
    width: 125px;
    font-weight: normal;
}

#userhome-view .subtitle {
    padding-top: 25px;
    padding-bottom: 20px;
    font-size: 20px;
    font-weight: bold;
    color: var(--text-color);
}

.card-ctl-spacing {
    margin-left: 20px;
}

.card-ctl {
    border: 1px solid #555;
    border-radius: 15px;
    width: 128px;
    height: 68px;
    background-color: var(--text-color);
    color: var(--bg-color);
    box-shadow: 0px 1px 3px var(--border-color);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-size: 17px;
}
</style>