import { toMillis } from './Times';
import { toLowerCaseTrimString, toTrimString } from './Utils';



const TAG_BEGIN = "["
const TAG_END = "]"

/*
const TITLE_TAG_NAME = "ti"
const ARTIST_TAG_NAME = "ar"
const ALBUM_TAG_NAME = "al"
const BY_TAG_NAME = "by"
const OFFSET_TAG_NAME = "offset"
//const META_TAG_DELIM = ":";
*/
const META_TAGS = {
    ti: 'title',
    ar: 'artist',
    al: 'album',
    //by: 'by',
    //offset: 'offset'
}

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
        if (!Lyric._isValidTime(mmssSSS)) return
        this.data.set(Lyric._unifyTime(mmssSSS), text)
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
                if (!line.startsWith(TAG_BEGIN) || !line.includes(TAG_END)) return
                if (Lyric._isTimeDataLine(line)) {
                    Lyric._parseTimeData(lyric, line)
                } else {
                    Lyric._parseMetaData(lyric, line)
                }
            })
        } catch (error) {
            console.log(error)
        }
        return Lyric.sort(lyric)
    }

    static _isTimeDataLine(text) {
        return TIME_LINE_REGEX.test(text)
    }

    static _parseTimeData(lyric, text) {
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

    static _parseMetaData(lyric, text) {
        const tokens = text.split(/[\[:\]]/)
        const len = tokens.length
        if (len < 3) return
        let name = tokens[1]
        let value = tokens[2]
        if (!name || !value) return
        name = toLowerCaseTrimString(name)
        value = toTrimString(value)
        if (value.len < 1) return
        /*
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
        */
        const propName = META_TAGS[name] || name
        if(propName == 'offset') value = Number(value)
        lyric[propName] = value
    }

    static _isValidTime(text) {
        return TIME_REGEX.test(text)
    }

    static _unifyTime(time) {
        const timeParts = time.split('.')
        if (timeParts.length >= 2) {
            const millisPart = timeParts[1].trim()
            if (millisPart.length == 2) { //10ms
                return `${time}0`
            } else if (millisPart.length == 1) { //格式错误，暂时当成ms处理
                return timeParts[0].trim() + '.00' + millisPart
            } else if (millisPart.length >= 3) { //格式错误，暂时截断，然后当成ms处理
                return timeParts[0].trim() + '.' + millisPart.substring(0, 3)
            }
        }
        return `${time}.000`
    }

    static hasData(lyric) {
        return lyric && lyric.data.size > 0
    }

    static sort(lyric) {
        if (!lyric || !lyric.data) return lyric
        if (!lyric.data.size || lyric.data.size < 1) return lyric
        const mapDatas = Array.from(lyric.data).sort((a, b) => (toMillis(a[0]) - toMillis(b[0])))
        Object.assign(lyric, {
            data: new Map(mapDatas.map(item => [item[0], item[1]]))
        })
        return lyric
    }

    static stringify(lyric) {
        if (!lyric || !lyric.data) return ''
        if (!lyric.data.size || lyric.data.size < 1) return ''
        lyric = Lyric.sort(lyric)
        const { title, artist, album, by, offset } = lyric
        let text = `[ti: ${title || ''}]\n`
            + `[ar: ${artist || ''}]\n`
            + `[al: ${album || ''}]\n`
            + `[by: ${by || ''}]\n`
            + `[offset: ${offset}]\n\n`
        Array.from(lyric.data).forEach(line => {
            if(!line) return
            //当前应用时间格式：00:00.000，一般格式：00:00.00
            const lineTime = line[0].slice(0, line[0].length - 1)
            const lineText = line[1] || ''
            text += `[${lineTime}] ${lineText}\n`
        })
        return text
    }

}