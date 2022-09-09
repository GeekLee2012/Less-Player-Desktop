import { defineStore } from "pinia";

export const useUserProfileStore = defineStore("userProfile", {
    state: () => ({
        user: {
            id: 0,
            nickname: "RIVE2012",
            cover: "",
            description: "One for All, All for One ~"
        },
        favorites: {
            playlists: [],
            albums: [],
            artists: [],
            songs: []
        },
        recents: {
            playlists: [],
            albums: [],
            artists: [],
            songs: []
        },
        customPlaylists: [],
    }),
    getters: {

    },
    actions: {

    },
    persist: {
        enabled: true,
        strategies: [
            {
                storage: localStorage,
            },
        ],
    }
})