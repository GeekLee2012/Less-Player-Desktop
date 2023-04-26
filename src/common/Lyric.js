import { toTrimString } from './Utils';



const TAG_BEGIN = "["
const TAG_END = "]"

const TITLE_TAG_NAME = "ti"
const ARTIST_TAG_NAME = "ar"
const ALBUM_TAG_NAME = "al"
const BY_TAG_NAME = "by"
const OFFSET_TAG_NAME = "offset"
//const META_TAG_DELIM = ":";

const TIME_REGEX = /\d{2}:\d{2}(:\d{2})?(\.\d{2,3})?/
const TIME_LINE_REGEX = /^\[\d{2}:\d{2}(:\d{2})?(\.\d{2,3})?].*/

export class Lyric {
    constructor(title, artist, album, by, offset) {
        this.title = toTrimString(title)
        this.artist = artist
        this.album = album
        this.by = toTrimString(by)
        this.offset = offset || 0
        this.data = new Map()
    }

    //MM:ss.SSS
    addLine(mmssSSS, text) {
        if (!Lyric.__isValidTime(mmssSSS)) return
        this.data.set(Lyric.__unifyTime(mmssSSS), text)
    }

    hasData() {
        return Lyric.hasData(this)
    }

    static parseFromText(text, seperator) {
        if (!text) return new Lyric()
        const sp = seperator || '\n'
        return Lyric.parseFromLines(text.trim().split(sp))
    }

    //@param lines - array
    static parseFromLines(lines) {
        const lyric = new Lyric()
        try {
            lines.forEach(line => {
                line = line.trim()
                if (line.length < 1) return
                //console.log(line)
                if (!line.startsWith(TAG_BEGIN) || !line.includes(TAG_END)) return
                if (Lyric.__isTimeDataLine(line)) {
                    Lyric.__parseTimeData(lyric, line)
                } else {
                    Lyric.__parseMetaData(lyric, line)
                }
            })
        } catch (error) {
            console.log(error)
        }
        return lyric
    }

    static __isTimeDataLine(text) {
        return TIME_LINE_REGEX.test(text)
    }

    static __parseTimeData(lyric, text) {
        const tokens = text.split(/[\[\]]/)
        const len = tokens.length
        if (len < 3) return
        const value = tokens[len - 1].trim()
        if (value.length < 1) return
        for (var i = 0; i < len - 1; i++) {
            const time = tokens[i].trim()
            if (time.length < 1) continue
            lyric.addLine(time, value)
        }
    }

    static __parseMetaData(lyric, text) {
        const tokens = text.split(/[\[:\]]/)
        const len = tokens.length
        if (len < 3) return
        let name = tokens[0]
        let value = tokens[1]
        if (!name || !value) return
        name = name.toString().trim().toLowerCase()
        value = value.toString().trim()
        if (value.len < 1) return
        if (TITLE_TAG_NAME == name) {
            lyric.title = value
        } else if (ARTIST_TAG_NAME == name) {
            lyric.artist = value
        } else if (ALBUM_TAG_NAME == name) {
            lyric.album = value
        } else if (BY_TAG_NAME == name) {
            lyric.by = value
        } else if (OFFSET_TAG_NAME == name) {
            lyric.offset = value
        }
    }

    static __isValidTime(text) {
        return TIME_REGEX.test(text)
    }

    static __unifyTime(time) {
        const timeParts = time.split('.')
        if (timeParts.length >= 2) {
            const millisPart = timeParts[1].trim()
            if (millisPart.length == 2) { //10ms
                return time + '0'
            } else if (millisPart.length == 1) { //格式错误，暂时当成ms处理
                return timeParts[0].trim() + '.00' + millisPart
            } else if (millisPart.length >= 3) { //格式错误，暂时截断，然后当成ms处理
                return timeParts[0].trim() + '.' + millisPart.substring(0, 3)
            }
        }
        return time + '.000'
    }

    static hasData(lyric) {
        return lyric && lyric.data.size > 0
    }

}