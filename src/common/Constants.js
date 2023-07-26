export const FILE_PREFIX = 'file:///'

export const IMAGE_PROTOCAL = {
    scheme: 'lessimage',
    prefix: 'lessimage://',
}

export const PLAY_STATE = {
    NONE: -1,
    INIT: 0,
    PLAYING: 1,
    PAUSE: 2,
    END: 3,
}

export const PLAY_MODE = {
    REPEAT_ALL: 0,
    REPEAT_ONE: 1,
    RANDOM: 2
}

export const TRAY_ACTION = {
    RESTORE: 0, //什么也不做，仅恢复上次显示
    PLAY: 1,
    PAUSE: 2,
    PLAY_PREV: 3,
    PLAY_NEXT: 4,
    USERHOME: 5,
    SETTING: 6,
    DESKTOP_LYRIC_OPEN: 7,
    DESKTOP_LYRIC_CLOSE: 8,
    DESKTOP_LYRIC_LOCK: 9,
    DESKTOP_LYRIC_UNLOCK: 10,
}