<script setup>
const props = defineProps({
    data: Array,
    artistVisitable: Boolean,
    albumVisitable: Boolean,
    dataType: Number,
    checkbox: Boolean,
    checkedAll: Boolean,
    ignoreCheckAllEvent: Boolean,
    checkChangedFn: Function
})
</script>

<template>
    <div class="songlist-ctl">
        <div v-for="(item, index) in data">
            <SongItem :index="index" :data="item"
                :artistVisitable="artistVisitable"
                :albumVisitable="albumVisitable"
                :dataType="dataType"
                :checkbox="checkbox"
                :checked="checkedAll"
                :ignoreCheckAllEvent="ignoreCheckAllEvent"
                :checkChangedFn="checkChangedFn" >
            </SongItem>
        </div>
    </div>
</template>

<style scoped>
.songlist-ctl {
    display: flex;
    flex-direction: column;
}
</style>