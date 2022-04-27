<script setup>
const props = defineProps({
    data: Array,
    artistVisitable: Boolean,
    albumVisitable: Boolean
})
</script>

<template>
    <div class="songlist-ctl">
        <div v-for="(item, index) in data">
            <SongItem :index="index" :data="item"
                :artistVisitable="artistVisitable"
                :albumVisitable="albumVisitable" >
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