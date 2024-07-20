import { defineStore } from "pinia";
import { usePlatformStore } from "./platformStore";
import { onEvents, emitEvents } from "../../common/EventBusWrapper";



const  notifyRefresh = () => emitEvents('radioSquare-refresh')

export const useRadioSquareStore = defineStore('radioSquare', {
    state: () => ({
        // (platformCode, categoryArray)
        categoriesMap: new Map(),
        //单选模式
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
        //多选模式
        multiSelectMode: false,
        currentCategoryItems: {},
        // TODO 控制CSS样式white-space
        whiteWrapMap: new Map(),
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
            this.updateCurrentCategoryItem({ key: '', value: '' }, -1, -1)
        },
        putOrders(key, value) {
            this.ordersMap.set(key, value)
        },
        getOrders(key) {
            return this.ordersMap.get(key)
        },
        putCurrentOrders(value) {
            this.putOrders(this.currentPlatformCode, value)
        },
        currentPlatformOrders() {
            return this.getOrders(this.currentPlatformCode)
        },
        updateCurrentOrder(key, value, index) {
            this.currentOrder.key = key
            this.currentOrder.value = value
            this.currentOrder.index = index
        },
        resetOrder() {
            this.updateCurrentOrder(null, null, 0)
        },
        //多选模式
        updateMultiModeCurrentCategoryItem(name, item, index) {
            const cate = {}
            cate[name] = { item, index }
            const oldValue = JSON.stringify(this.currentCategoryItems[name])
            const newValue = JSON.stringify(cate[name])
            if (oldValue == newValue) return
            Object.assign(this.currentCategoryItems, cate)
            notifyRefresh()
        },
        resetCurrentCategoryItems() {
            for (var key in this.currentCategoryItems) {
                Reflect.deleteProperty(this.currentCategoryItems, key)
            }
            const categories = this.currentPlatformCategories()
            if (!categories) return
            categories.data.forEach(item => {
                this.currentCategoryItems[item.name] = { item: item.data[0], index: 0 }
            })
            notifyRefresh()
        },
        setMultiSelectMode(value) {
            this.multiSelectMode = (value === true)
        },
        putWhiteWrap(key, value) {
            this.whiteWrapMap.set(key, value)
        },
        currentPlatformWhiteWrap() {
            return this.whiteWrapMap.get(this.currentPlatformCode)
        },
    }
})