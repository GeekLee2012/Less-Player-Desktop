<script setup>

const excludes = [ 'LocalMusicView', 'CustomPlaylistEditView',
    'UserInfoEditView', 'BatchActionView', 
    'DataBackupView', 'DataRestoreView' ]
</script>

<template>
    <div id="main-content">
        <router-view v-slot="{ Component }">
            <keep-alive :exclude="excludes" :max="12">
                <component :is="Component" />
            </keep-alive>
        </router-view>
    </div>  
</template>

<style>
#main-content {
    display: flex;
    flex: 1;
    overflow: auto;
    /*margin-right: 2px;*/
}
</style>