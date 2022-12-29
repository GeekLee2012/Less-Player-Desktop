<script setup>
const props = defineProps({
    data: Array,
    artistVisitable: Boolean,
    albumVisitable: Boolean,
    deleteFn: Function,
    dataType: Number,
    checkbox: Boolean,
    checkedAll: Boolean,
    ignoreCheckAllEvent: Boolean,
    checkChangedFn: Function,
    loading: Boolean,
    useExtra1: Boolean,
    useExtra2: Boolean
})
</script>

<template>
    <div class="songlist-ctl">
        <div v-for="(item, index) in data" v-show="!loading">
            <SongItem :index="index" :data="item" :artistVisitable="artistVisitable" :albumVisitable="albumVisitable"
                :dataType="dataType" :deleteFn="deleteFn" :checkbox="checkbox" :checked="checkedAll"
                :ignoreCheckAllEvent="ignoreCheckAllEvent" :checkChangedFn="checkChangedFn">
            </SongItem>
        </div>
        <div v-show="loading">
            <div class="loading-mask" v-for="i in 12"
                style="width: 100%;  height: 56px; margin-bottom: 3px; display: inline-block;"></div>
        </div>
    </div>
</template>

<style scoped>
.songlist-ctl {
    display: flex;
    flex-direction: column;
}
</style>