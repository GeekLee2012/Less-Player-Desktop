//本文件仅用于测试

export const openDb = (name) => {
    return new Promise((resolve, reject) => {
        if (indexedDB) {
            const request = indexedDB.open(name)

            request.onsuccess = function (event) {
                const db = event.target.result
                resolve({ db, request })
            }
            /*
            request.onupgradeneeded = function (event) {
                const db = event.target.result
            }
            */
        }
    })
}

export const createStore = (db, name, keyPath) => {
    return db ? db.createObjectStore(name, { keyPath }) : null
}

export const getStore = (db, name, createIfNotExist, keyPath) => {
    if (!db) return null
    let store = db.transaction(name, 'readwrite').objectStore(name)
    if (!store && createIfNotExist) {
        store = createStore(db, name, keyPath)
    }
    return store
}

export const addItem = (store, item) => {
    if (store) store.add(item)
}

export const putItem = (store, item, key) => {
    if (store) store.put(item, key)
}