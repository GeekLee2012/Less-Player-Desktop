<script setup>
import { inject } from 'vue';
import CustomPlaylistItem from './CustomPlaylistItem.vue';



const { visitCustomPlaylist } = inject('appRoute')

const props = defineProps({
    data: Array,
})
</script>

<template>
    <div class="customPlaylist-list-ctl">
        <div v-for="(item, index) in data">
            <!--
            <CustomPlaylistItem :index="index" :data="item"
              @click="() => visitCustomPlaylist(item.id)">
            </CustomPlaylistItem>
            -->
            <CustomPlaylistItem :index="index" :data="item">
            </CustomPlaylistItem>
        </div>
    </div>
</template>

<style scoped>
.customPlaylist-list-ctl {
    display: flex;
    flex-direction: column;
}
</style>