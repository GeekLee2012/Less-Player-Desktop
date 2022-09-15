<script setup>
import { storeToRefs } from 'pinia';
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import EventBus from '../../common/EventBus';
import { useMainViewStore } from '../store/mainViewStore';
import CustomPlaylistItem from './CustomPlaylistItem.vue';

const props = defineProps({
    data: Array,
})

const route = useRouter()
const visitItem = (item) => {
    route.push("/userhome/customPlaylist/" + item.id)
}

</script>

<template>
    <div class="customPlaylist-list-ctl">
        <div v-for="(item, index) in data">
            <CustomPlaylistItem :index="index" :data="item"
              @click="visitItem(item)">
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