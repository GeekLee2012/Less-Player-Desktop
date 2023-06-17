const { opendirSync, readFileSync, statSync, writeFileSync, readdirSync } = require('fs');
const { opendir, rmdir, rm } = require('fs/promises');
const { homedir } = require('os');
const path = require('path');
const CryptoJS = require('crypto-js');
const MusicMetadata = require('music-metadata');
const { AUDIO_EXTS } = require('./env');



const FILE_PREFIX = 'file:///'
const IMAGE_PROTOCAL = {
    scheme: 'lessimage',
    prefix: 'lessimage://',
}

const transformPath = (path) => {
    try {
        return path.replace(FILE_PREFIX, '')
            .replace(/\\/g, '/')
            .replace(/\/\//g, '').trim()
    } catch (error) {
        console.log(error)
    }
    return path
}

const isExtentionValid = (name, exts) => {
    for (var ext of exts) {
        if (name && name.endsWith(ext)) {
            return true
        }
    }
    return false
}

const statPathSync = (path) => {
    try {
        path = transformPath(path)
        return statSync(path, { throwIfNoEntry: false })
    } catch (error) {
        console.log(error)
    }
    return null
}

const scanDirTracks = async (dir, exts, deep) => {
    try {
        if (!exts || exts.length < 1) exts = AUDIO_EXTS
        const result = { path: dir, data: [], name: getSimpleFileName(dir) }
        const files = []
        walkSync(dir, (file, dirent) => {
            if (dirent.isFile() && isExtentionValid(dirent.name, exts)) {
                files.push(transformPath(file))
            }
        }, { deep })
        if (files.length > 0) {
            const tracks = await parseTracks(files.sort())
            result.data.push(...tracks)
        }
        return result
    } catch (error) {
        console.log(error);
        return null
    }
}

function getSimpleFileName(fullname) {
    if (!fullname) return ''
    fullname = transformPath(fullname)
    const from = fullname.lastIndexOf('/')
    let to = fullname.lastIndexOf('.')
    to = to >= 0 ? to : fullname.length
    return fullname.substring(from + 1, to)
}

async function parseTracks(audioFiles) {
    const tracks = []
    for (const file of audioFiles) {
        try {
            if (!isExtentionValid(file, AUDIO_EXTS)) continue
            const track = await createTrackFromMetadata(file)
            if (track) {
                const index = tracks.findIndex(item => track.id == item.id)
                if (index == -1) tracks.push(track)
            }
        } catch (error) {
            console.log(error)
        }
    }
    return tracks
}

async function createTrackFromMetadata(file) {
    file = transformPath(file)
    const statResult = statSync(file, { throwIfNoEntry: false })
    if (!statResult) return null

    const metadata = await MusicMetadata.parseFile(file, { duration: true })
    const artist = []
    let filename = getSimpleFileName(file)
    const album = { id: 0, name: '' }
    //let coverData = 'default_cover.png'
    let title = null, duration = 0, lyricText = null, publishTime = null
    try {
        if (metadata.common) {
            const { title: mTitle, artist: mArtist, artists, album: mAlbum, picture, lyrics,
                year: mYear, date: mDate, originaldate } = metadata.common
            //歌曲名称
            if (mTitle) title = mTitle.trim()
            //歌手、艺人
            if (artists) artists.forEach(ar => artist.push({ id: '', name: ar }))
            //专辑名称
            if (mAlbum) album.name = mAlbum
            //封面
            //const cover = MusicMetadata.selectCover(picture)
            //直接返回内容数据，太耗内存
            //if (cover) coverData = `data:${cover.format};base64,${cover.data.toString('base64')}`

            //内嵌歌词
            if (lyrics && lyrics.length > 0) lyricText = lyrics[0]

            //发布时间
            if (originaldate) publishTime = originaldate
            if (!publishTime && mDate) publishTime = mDate
            if (!publishTime && mYear) publishTime = mYear
        }
        if (metadata.format) {
            const { duration: mDuration } = metadata.format
            if (mDuration) duration = mDuration * 1000
        }

        //内嵌歌词
        if (metadata.native && !lyricText) {
            const ID3v23 = metadata.native['ID3v2.3']
            for (var i in ID3v23) {
                const { id, value } = ID3v23[i]
                if (id === 'USLT') {
                    lyricText = value.text
                    break
                }
            }
        }

        //TODO
        const hash = CryptoJS.MD5(file).toString()
        return {
            id: hash,
            platform: 'local',
            title: title || filename,
            filename,
            artist,
            album,
            duration,
            cover: (IMAGE_PROTOCAL.prefix + file),
            embeddedLyricText: lyricText,
            url: (FILE_PREFIX + file),
            publishTime
        }

    } catch (error) {
        console.log(error)
    }
    return null
}

async function parseImageDataFromFile(file) {
    let coverData = null

    file = transformPath(file)
    const statResult = statSync(file, { throwIfNoEntry: false })
    if (!statResult) return coverData

    try {
        const metadata = await MusicMetadata.parseFile(file, { duration: true })
        const { picture } = metadata.common
        //封面
        const cover = MusicMetadata.selectCover(picture)
        //if (cover) coverData = `data:${cover.format};base64,${cover.data.toString('base64')}`
        if (cover) coverData = { format: cover.format, data: cover.data, text: `data:${cover.format};base64,${cover.data.toString('base64')}` }
    } catch (error) {
        console.log(error)
    }
    return coverData
}

function readText(file, encoding) {
    try {
        file = transformPath(file)
        const statResult = statSync(file, { throwIfNoEntry: false })
        if (statResult) {
            const data = readFileSync(file, { encoding })
            return data.toString()
        }
    } catch (error) {
        console.log(error)
    }
    return null
}

function writeText(file, text) {
    try {
        file = transformPath(file)
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

/** 返回值为数组，且当没有文件时，默认为[ ] 
 * 不遍历子目录
 */
const listFiles = async (dir, isFullname) => {
    const files = []
    try {
        const list = await opendir(dir)
        for await (const dirent of list) {
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

/**
 * 遍历当前目录全部文件，包括子目录
 */
const walkSync = (dir, callback, options) => {
    try {
        options = options || { deep: false }
        readdirSync(dir, { withFileTypes: true }).forEach(dirent => {
            var pathName = path.join(dir, dirent.name);
            if (dirent.isFile()) {
                callback(pathName, dirent);
            } else if (dirent.isDirectory() && options.deep) {
                walkSync(pathName, callback, options);
            }
        })
    } catch (error) {
        console.log(error)
    }
}

//解析.pls格式文件
const parsePlsFile = async (filename) => {
    try {
        filename = transformPath(filename)
        const sname = getSimpleFileName(filename)
        const result = { file: filename, name: sname, version: null, data: [] }
        //读取文本内容
        const content = readText(filename)
        if (!content) return null
        //逐行解析
        const lines = content.trim().split('\n')
        if (!lines) return null
        let title = null, file = null, length = null
        for (var i = 0; i < lines.length; i++) {
            const line = lines[i].trim()

            if (line.length < 1) return
            //[Playlist]，类似标签，直接忽略
            if (line.startsWith('[') && line.endsWith(']')) continue

            const index = line.indexOf('=')
            //不合法格式
            if (index == -1) continue
            //解析[key=value]
            const key = line.substring(0, index)
            const value = line.substring(index + 1)
            const lcKey = key.toLowerCase()
            if (lcKey.startsWith('numberofentries')) {
                Object.assign(result, { total: parseInt(value) })
            } else if (lcKey.startsWith('version')) {
                Object.assign(result, { version: value })
            } else if (lcKey.startsWith('file')) {
                file = value
            } else if (lcKey.startsWith('title')) {
                title = value
            } else if (lcKey.startsWith('length')) {
                length = parseInt(value)
            }
            //TODO 暂时先简单处理，不校验序号是否匹配
            if (file != null && title != null && length != null) {
                //从文件本身去解析 Metadata，pls自带信息不完整
                const track = await createTrackFromMetadata(file)
                if (track) {
                    const index = result.data.findIndex(item => track.id == item.id)
                    if (index == -1) result.data.push(track)
                }
                //重置
                title = null
                file = null
                length = null
            }
        }
        return result
    } catch (error) {
        console.log(error)
    }
    return null
}

//解析.m3u格式文件
const parseM3uFile = async (filename) => {
    try {
        filename = transformPath(filename)
        const sname = getSimpleFileName(filename)
        const result = { file: filename, name: sname, version: null, data: [] }
        //读取文本内容
        const content = readText(filename)
        if (!content) return null
        //逐行解析
        const lines = content.trim().split('\n')
        if (!lines) return null
        //let title = null, file = null, length = null
        let file = null
        for (var i = 0; i < lines.length; i++) {
            const line = lines[i].trim()

            if (line.length < 1) return
            /*
            if (line.startsWith('#EXTM3U')) continue
            if (line.startsWith('#EXTINF')) {
                const metaText = line.replace('#EXTINF:', '')
                const index = metaText.indexOf(',')
                length = parseInt(metaText.substring(0, index))
                title = metaText.substring(index + 1).trim()
            } else {
                file = line
            }
            */
            if (line.startsWith('#')) continue
            file = line
            if (file != null) {
                //从文件本身去解析 Metadata，pls自带信息不完整
                const track = await createTrackFromMetadata(file)
                if (track) {
                    const index = result.data.findIndex(item => track.id == item.id)
                    if (index == -1) result.data.push(track)
                }
                //重置
                file = null
                //title = null
                //length = null
            }
        }
        return result
    } catch (error) {
        console.log(error)
    }
    return null
}


//保存为.pls格式文件
const writePlsFile = async (filename, data) => {
    let content = '[Playlist]\n'
    for (var i = 0; i < data.length; i++) {
        const { title, duration, url } = data[i]
        const num = i + 1
        const file = transformPath(url)
        const length = duration > 0 ? Math.ceil(duration / 1000) : -1
        content += `File${num}=${file}\n`
        content += `Title${num}=${title}\n`
        content += `Length${num}=${length}\n`
    }
    content += `NumberOfEntries=${data.length}\n`
    content += 'Version=2\n'
    return writeText(filename, content)
}

//保存为.m3u格式文件
const writeM3uFile = async (filename, data) => {
    console.log(filename)
    let content = '#EXTM3U\n'
    for (var i = 0; i < data.length; i++) {
        const { title, duration, url } = data[i]
        const file = transformPath(url)
        const length = duration > 0 ? Math.ceil(duration / 1000) : -1
        content += `#EXTINF:${length}, ${title}\n${file}\n`
    }
    return writeText(filename, content)
}

module.exports = {
    scanDirTracks,
    parseTracks,
    readText,
    writeText,
    FILE_PREFIX,
    IMAGE_PROTOCAL,
    ALPHABET_NUMS,
    randomText,
    randomTextWithinAlphabetNums,
    nextInt,
    getDownloadDir,
    removePath,
    listFiles,
    parsePlsFile,
    parseM3uFile,
    writePlsFile,
    writeM3uFile,
    parseImageDataFromFile,
    statPathSync,
    walkSync
}