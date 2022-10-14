const { opendirSync, readFileSync, statSync } = require('fs');
const { opendir, rmdir } = require('fs/promises');
const path = require('path');
const mm = require('music-metadata');
const jschardet = require('jschardet');
const iconv = require('iconv-lite');

const FILE_PREFIX = 'file:///'

const isExtentionValid = (name, exts) => {
    for(var ext of exts) {
        if(name.endsWith(ext)) {
            return true
        }
    }
    return false
}

const scanDir = async (dir, exts) => {
    try {
        const result = { path: dir, data: [] }
        const list = await opendir(dir)
        const files = []
        for await (const dirent of list) {
            //console.log(dirent.name)
            if(dirent.isFile() && isExtentionValid(dirent.name, exts)) {
                const fullname = path.join(dir, dirent.name)
                files.push(fullname)
            }
        }
        if(files.length > 0) {
            const tracks = await parseTracks(files)
            result.data.push(...tracks)
        }
        return result
    } catch (error) {
        console.log(error);
    }
    return null
}

function getSimpleFileName(fullname) {
    if(!fullname) return ''
    fullname = fullname.trim()
    const from = fullname.lastIndexOf('/') 
    const to = fullname.lastIndexOf('.')
    return fullname.substring(from + 1, to)
}

async function parseTracks(audioFiles) {
    const tracks = []
    for(const audioFile of audioFiles) {
        const metadata = await mm.parseFile(audioFile, { duration: true })
        const artist = []
        let title = getSimpleFileName(audioFile)
        const album = { id: 0, name: '' }
        let coverData = 'default_cover.png'
        let duration = 0
        try {
            if(metadata.common) {
                if(metadata.common.title) {
                    title = decodeText(metadata.common.title.trim())
                }
                if(metadata.common.artists) {
                    metadata.common.artists.forEach(ar => artist.push({ id: '', name: decodeText(ar) }))
                }
                if(metadata.common.album) {
                    album.name = decodeText(metadata.common.album)
                }
                const cover = mm.selectCover(metadata.common.picture)
                if(cover) {
                    coverData = `data:${cover.format};base64,${cover.data.toString('base64')}`
                }
            }
            if(metadata.format) {
                if(metadata.format.duration) {
                    duration = metadata.format.duration * 1000
                }
            }

            //TODO
            const track = {
                id: 0, 
                platform: 'local',
                title,
                artist, 
                album, 
                duration,
                cover: coverData
            }
            track.url = FILE_PREFIX + audioFile
            tracks.push(track)
        } catch(error) {
            console.log(error)
        }
    }
    return tracks
}

function decodeText(text) {
    try {
        const detect =jschardet.detect(text)
        console.log(detect)
        if(!detect.encoding) return text
        const encoding = detect.encoding.trim().toLowerCase()
        if('windows-1252' === encoding) {
            return iconv.decode(Buffer.from(text), 'gb2312')
        } else if('ibm855' === encoding) {
            return iconv.decode(Buffer.from(text), 'gb2312')
        } else if('gb2312' === encoding) {
            return iconv.decode(Buffer.from(text), 'gb2312')
        } else if('gbk' === encoding) {
            return iconv.decode(Buffer.from(text), 'gbk')
        }
    } catch(error) {
        console.log(error)
    }
    return text
}

function readText(file) {
    try {
        const data = readFileSync(file)
        return decodeText(data.toString())
    } catch(error) {
        console.log(error)
    }
    return null
}

const ALPHABET_NUMS = 'ABCDEFGHIJKLMNOPQRSTUVWSYZabcdefghijklmnopqrstuvwsyz01234567890'

/** 随机字符串
 * @param src 限定组成元素的字符串，如：ABCDEFGHIJKLMNOPQRSTUVWSYZ
 * @param len 长度
 */
const randomText = (src, len) => {
    let result = []
    for (let i = 0; i < len; i++) {
        const index = Math.floor(Math.random() * (src.length - 1))
        result.push(src.charAt(index))
    }
    return result.join('')
}

/** 随机字符串: 大小写字母和数字组成 */
const randomTextWithinAlphabetNums = (len) => {
    return randomText(ALPHABET_NUMS, len)
}

module.exports = { 
    scanDir, 
    parseTracks, 
    readText, 
    FILE_PREFIX,
    ALPHABET_NUMS, 
    randomText, 
    randomTextWithinAlphabetNums }