export class Category {
    // { name, data }
    constructor(name) {
        this.name = name
        this.data = []
    }

    add(key, value) {
        const item = { key, value }
        this.addItem(item)
    }

    addItem(item) {
        if(!this.data.includes(item)) {
            this.data.push(item)
        }
    }

    get(key) {
        return this.data.find(item => item.key === key )
    }
}