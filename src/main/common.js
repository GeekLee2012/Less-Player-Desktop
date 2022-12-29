const { opendirSync, readFileSync, statSync, writeFileSync } = require('fs');
const { opendir, rmdir, rm } = require('fs/promises');
const { homedir } = require('os');
const path = require('path');
const mm = require('music-metadata');
const jschardet = require('jschardet');
const iconv = require('iconv-lite');
const CryptoJS = require('crypto-js');

const FILE_PREFIX = 'file:///'

const isExtentionValid = (name, exts) => {
    for (var ext of exts) {
        if (name.endsWith(ext)) {
            return true
        }
    }
    return false
}

const scanDirTracks = async (dir, exts) => {
    try {
        const result = { path: dir, data: [] }
        const list = await opendir(dir)
        const files = []
        for await (const dirent of list) {
            //console.log(dirent.name)
            if (dirent.isFile() && isExtentionValid(dirent.name, exts)) {
                const fullname = path.join(dir, dirent.name)
                files.push(fullname)
            }
        }
        if (files.length > 0) {
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
    if (!fullname) return ''
    fullname = fullname.trim()
    const from = fullname.lastIndexOf('/')
    const to = fullname.lastIndexOf('.')
    return fullname.substring(from + 1, to)
}

async function parseTracks(audioFiles) {
    const tracks = []
    for (const audioFile of audioFiles) {
        const metadata = await mm.parseFile(audioFile, { duration: true })
        const artist = []
        let title = getSimpleFileName(audioFile)
        const album = { id: 0, name: '' }
        let coverData = 'default_cover.png'
        let duration = 0
        try {
            if (metadata.common) {
                if (metadata.common.title) {
                    title = decodeText(metadata.common.title.trim())
                }
                if (metadata.common.artists) {
                    metadata.common.artists.forEach(ar => artist.push({ id: '', name: decodeText(ar) }))
                }
                if (metadata.common.album) {
                    album.name = decodeText(metadata.common.album)
                }
                const cover = mm.selectCover(metadata.common.picture)
                if (cover) {
                    coverData = `data:${cover.format};base64,${cover.data.toString('base64')}`
                }
            }
            if (metadata.format) {
                if (metadata.format.duration) {
                    duration = metadata.format.duration * 1000
                }
            }

            const hash = CryptoJS.MD5(title + artist.name + album.name + duration).toString()
            //TODO
            const track = {
                id: hash,
                platform: 'local',
                title,
                artist,
                album,
                duration,
                cover: coverData
            }
            track.url = FILE_PREFIX + audioFile
            const index = tracks.findIndex(item => track.id == item.id)
            if (index < 0) tracks.push(track)
        } catch (error) {
            console.log(error)
        }
    }
    return tracks
}

//TODO 中文编码容易乱码
function decodeText(text) {
    try {
        const detect = jschardet.detect(text)
        //console.log(detect)
        if (!detect.encoding) return text
        const encoding = detect.encoding.trim().toLowerCase()
        if ('windows-1252' === encoding) {
            return iconv.decode(Buffer.from(text), 'gb2312')
        } else if ('ibm855' === encoding) {
            return iconv.decode(Buffer.from(text), 'gb2312')
        } else if ('gb2312' === encoding) {
            return iconv.decode(Buffer.from(text), 'gb2312')
        } else if ('gbk' === encoding) {
            return iconv.decode(Buffer.from(text), 'gbk')
        }
    } catch (error) {
        console.log(error)
    }
    return text
}

function readText(file, encoding) {
    try {
        const data = readFileSync(file, { encoding })
        if (encoding) return data.toString()
        return decodeText(data.toString())
    } catch (error) {
        console.log(error)
    }
    return null
}

function writeText(file, text) {
    try {
        writeFileSync(file, text)
        return true
    } catch (error) {
        console.log(error)
    }
    return false
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

const nextInt = (max) => {
    const limit = max < 1024 ? 1024 : max
    return parseInt(Math.random() * limit) % max
}

const getDownloadDir = () => {
    return homedir() + "/Downloads/"
}

const removePath = (path) => {
    rm(path, { force: true })
}

/** 返回值为数组，且当没有文件时，默认为[ ] */
const listFiles = async (dir, isFullname) => {
    const files = []
    try {
        //const result = { path: dir, data: [] }
        const list = await opendir(dir)
        for await (const dirent of list) {
            //console.log(dirent.name)
            if (dirent.isFile()) {
                const filename = isFullname ? path.join(dir, dirent.name) : dirent.name
                files.push(filename)
            }
        }
    } catch (error) {
        console.log(error);
    }
    return files
}

module.exports = {
    scanDirTracks,
    parseTracks,
    readText,
    writeText,
    FILE_PREFIX,
    ALPHABET_NUMS,
    randomText,
    randomTextWithinAlphabetNums,
    nextInt,
    getDownloadDir,
    removePath,
    listFiles
}