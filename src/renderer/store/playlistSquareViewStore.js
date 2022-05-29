import { defineStore } from "pinia";
import { usePlatformStore } from "./platformStore";

export const usePlaylistSquareViewStore = defineStore('playlistSquareView', {
    state: () => ({
        // (platformCode, categoryArray)
        categoryMap: new Map(),
        currentCategoryItem: {
            data: { key: '默认', value: ''},
            row: 0, 
            col: 0
        }
    }),
    getters: {
        currentPlatformCode(state) {
            const { currentPlatformCode } = usePlatformStore()
            return currentPlatformCode
        },
        currentCategoryCode(state) {
            return state.currentCategoryItem.data.value
        }
    },
    actions: {
        putCategory(key, value) {
            this.categoryMap.set(key, value)
        },
        putCurrentCategory(value){
            this.putCategory(this.currentPlatformCode, value)
        },
        getCategory(key) {
            return this.categoryMap.get(key)
        },
        currentCategory() {
           return this.getCategory(this.currentPlatformCode) 
        },
        currentVender() {
            const { currentVender } = usePlatformStore()
            return currentVender()
        },
        updateCurrentCategoryItem(data, row, col) {
            this.currentCategoryItem.data = data
            this.currentCategoryItem.row = row
            this.currentCategoryItem.col = col
        },
        resetCurrentCategoryItem() {
            this.updateCurrentCategoryItem({ key: '默认', value: ''}, 0, 0)
        }
    }
})