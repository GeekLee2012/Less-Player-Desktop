<script setup>
const props = defineProps({
    cover: String,
    title: String,
    subtitle: String
})
</script>

<template>
    <div class="image-text-tile">
        <img class="cover" v-lazy="cover" />
        <div class="title">{{ title }}</div>
        <div class="subtitle" v-show="subtitle">{{ subtitle }}</div>
    </div>
</template>

<style scoped>
.image-text-tile {
    margin: 15px 12px;
}
.image-text-tile .cover {
    width: 165px;
    height: 165px;
    border-radius: 6px;
    cursor: pointer;
    box-shadow: 0px 0px 10px #161616;
}

.image-text-tile .cover:hover {
    transform: scale(1.05) translateY(-4px);
}

.image-text-tile .title {
    width: 165px;
    margin-top: 5px;
    text-align: left;
    cursor: pointer;
    line-height: 21px;

    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}
.image-text-tile .title:hover {
    background: linear-gradient(to right, #1ca388, #28c83f);
    -webkit-background-clip: text;
    color: transparent;
}

.image-text-tile .subtitle {
    width: 165px;
    text-align: left;
    line-height: 25px;
    color: #989898;
    font-size: 14px;

    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
}
</style>