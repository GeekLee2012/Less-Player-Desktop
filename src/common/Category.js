export class Category {
    // { name, code, data }
    constructor(name, code) {
        this.name = name
        this.code = code ? code : name
        this.data = [] //[key, value]
        this.isolated = false //是否独立
    }

    add(key, value) {
        const item = { key, value }
        return this.addItem(item)
    }

    addFirst(key, value) {
        const item = { key, value }
        if (!this.data.includes(item)) {
            this.data.unshift(item)
        }
        return this
    }

    addItem(item) {
        if (!this.data.includes(item)) {
            this.data.push(item)
        }
        return this
    }

    get(key) {
        return this.data.find(item => item.key === key)
    }
}