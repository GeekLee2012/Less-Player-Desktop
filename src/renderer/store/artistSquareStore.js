import { defineStore } from "pinia";
import EventBus from "../../common/EventBus";
import { usePlatformStore } from "./platformStore";



export const useArtistSquareStore = defineStore('artistSquare', {
    state: () => ({
        // (platformCode, categoryArray)
        categoryMap: new Map(),
        currentCategoryItems: {},
        alphabetMap: new Map()
    }),
    getters: {
        currentPlatformCode(state) {
            const { currentPlatformCode } = usePlatformStore()
            return currentPlatformCode
        },
        currentAlphabet() {
            return this.alphabetMap.get(this.currentPlatformCode)
        }
    },
    actions: {
        putCategory(key, value) {
            this.categoryMap.set(key, value)
        },
        putCurrentCategory(value) {
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
        notifyRefresh() {
            EventBus.emit("artistSquare-refresh")
        },
        updateCurrentCategoryItem(name, item, index) {
            const cate = {}
            cate[name] = { item, index }
            const oldValue = JSON.stringify(this.currentCategoryItems[name])
            const newValue = JSON.stringify(cate[name])
            if (oldValue == newValue) return
            Object.assign(this.currentCategoryItems, cate)
            this.notifyRefresh()
        },
        resetCurrentCategoryItems() {
            //TODO
            for (var key in this.currentCategoryItems) {
                //delete this.currentCategoryItems[key]
                Reflect.deleteProperty(this.currentCategoryItems, key)
            }
            const category = this.currentCategory()
            if (!category) return
            category.forEach(item => {
                this.currentCategoryItems[item.name] = { item: item.data[0], index: 0 }
            })
            this.notifyRefresh()
        },
        putAlphabet(platform, alphabet) {
            this.alphabetMap.set(platform, alphabet)
        }
    }
})