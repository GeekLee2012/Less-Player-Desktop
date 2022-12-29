import { defineStore } from "pinia";
import { usePlatformStore } from "./platformStore";



export const usePlaylistSquareStore = defineStore('playlistSquare', {
    state: () => ({
        // (platformCode, categoryArray)
        categoriesMap: new Map(),
        currentCategoryItem: {
            data: { key: '默认', value: '' },
            row: 0,
            col: 0
        },
        // (platformCode, orderArray)
        ordersMap: new Map(),
        currentOrder: {
            key: null,
            value: null,
            index: 0,
        },
    }),
    getters: {
        currentPlatformCode(state) {
            const { currentPlatformCode } = usePlatformStore()
            return currentPlatformCode
        },
        currentCategoryCode(state) {
            return state.currentCategoryItem.data.value
        },
    },
    actions: {
        putCategories(key, value) {
            this.categoriesMap.set(key, value)
        },
        putCurrentPlatformCategories(value) {
            this.putCategory(this.currentPlatformCode, value)
        },
        getCategories(key) {
            return this.categoriesMap.get(key)
        },
        currentPlatformCategories() {
            return this.getCategories(this.currentPlatformCode)
        },
        currentVender() {
            const { currentVender } = usePlatformStore()
            return currentVender()
        },
        updateCurrentCategoryItem(data, row, col) {
            this.currentCategoryItem.data = data
            this.currentCategoryItem.row = row
            this.currentCategoryItem.col = col
            //Object.assign(this.currentCategory, { data, row, col })
        },
        resetCurrentCategoryItem() { //TODO
            this.updateCurrentCategoryItem({ key: '默认', value: '' }, -1, -1)
        },
        putOrders(key, value) {
            this.ordersMap.set(key, value)
        },
        putCurrentOrders(value) {
            this.putOrders(this.currentPlatformCode, value)
        },
        currentPlatformOrders() {
            return this.ordersMap.get(this.currentPlatformCode)
        },
        updateCurrentOrder(key, value, index) {
            this.currentOrder.key = key
            this.currentOrder.value = value
            this.currentOrder.index = index
        },
        resetOrder() {
            this.updateCurrentOrder(null, null, 0)
        }
    }
})