const { opendirSync, readFileSync, statSync, writeFileSync, readdirSync } = require('fs');
const { opendir, rmdir, rm } = require('fs/promises');
const { homedir } = require('os');
const path = require('path');
const CryptoJS = require('crypto-js');
const MusicMetadata = require('music-metadata');
const { AUDIO_EXTS, EXTRA_AUDIO_EXTS, isDevEnv, VIDEO_EXTS, VIDEO_COLLECTION_EXTS, IMAGE_EXTS } = require('./env');


const FILE_SCHEME = 'file'
const FILE_PREFIX = `${FILE_SCHEME}:///`

const ImageProtocal = {
    scheme: 'lessimage',
    prefix: 'lessimage://',
}

const transformPath = (path) => {
    try {
        if(path) {
            return path.replace(FILE_PREFIX, '')
                .replace(/\\/g, '/')
                .replace(/\/\//g, '')
                .trim()
        }
    } catch (error) {
        console.log(error)
    }
    return path
}

const transformUrl = (url, protocal) => {
    url = (url || '').trim()
    if(url.length < 1 || url.includes('://')|| url.startsWith('data:')
        || url.startsWith('blob:')) return url
    protocal = protocal || 'https'
    return `${protocal}://${url}`.replace(':////', '://')
}

const isExtentionValid = (name, exts) => {
    for (var ext of exts) {
        if (name && name.toLowerCase().endsWith(ext.toLowerCase())) {
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

const scanDirCover = async (dir) => {
    const exts = [...IMAGE_EXTS]
    const names = ['Cover', 'cover']
    for(let i = 0; i < exts.length; i++) {
        for(let j = 0; j < names.length; j++) {
            const file = `${dir}/${names[j]}.${exts[i]}`
            if(statPathSync(file)) return file
        }
    }
}

const scanDirTracks = async (dir, exts, deep) => {
    const result = { path: dir, data: [], name: getSimpleFileName(dir), cover: '' }
    try {
        const statResult = statSync(dir, { throwIfNoEntry: false })
        if (!statResult || !statResult.isDirectory()) return null
       
        exts = Array.isArray(exts) ? exts : []
        if (exts.length < 1) {
            exts.push(...AUDIO_EXTS)
            exts.push(...EXTRA_AUDIO_EXTS)
        }
        const files = []
        walkSync(dir, (file, dirent) => {
            if (dirent.isFile() && isExtentionValid(dirent.name, exts)) {
                files.push(transformPath(file))
            }
        }, { deep })
        if (files.length > 0) {
            const tracks = await parseTracks(files.sort())
            result.data.push(...tracks)
            result.cover = await scanDirCover(dir) || ''
        }
    } catch (error) {
        console.log(error)
    }
    return result
}

function getSimpleFileName(fullname, defaultName) {
    defaultName = defaultName || ''
    if (!fullname) return defaultName
    fullname = transformPath(fullname)
    const from = fullname.lastIndexOf('/') + 1
    let to = fullname.lastIndexOf('.')
    to = (to >= 0 ? to : fullname.length)
    return from >= to ? fullname : fullname.substring(from, to)
}


function getParentPath(filename) {
    if (!filename) return filename
    filename = transformPath(filename)
    const index = filename.lastIndexOf('/')
    return index > 1 ? filename.substring(0, index) : filename
}

function getFileExtName(fullname) {
    if (!fullname) return ''
    fullname = transformPath(fullname)
    const from = fullname.lastIndexOf('.')
    return fullname.substring(from + 1)
}

function resolveParentPath(referentFile, targetFile) {
    const parent = getParentPath(referentFile)
    targetFile = transformPath(targetFile)
    if(targetFile && targetFile.indexOf('/') < 0) {
        return `${parent}/${targetFile}`
    }
    return targetFile
}

function isSuppotedAudioType(file) {
    return isExtentionValid(file, AUDIO_EXTS) 
        || isExtentionValid(file, EXTRA_AUDIO_EXTS)
}

function isSuppotedVideoType(file) {
    return isExtentionValid(file, VIDEO_EXTS)
        || isExtentionValid(file, VIDEO_COLLECTION_EXTS)
}

async function parseTracks(audioFiles) {
    const tracks = []
    for (const file of audioFiles) {
        try {
            if (!isSuppotedAudioType(file)) continue
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

const detectVideoPlatform = (url) => {
    return url && url.startsWith('http') ? 'free-video' : 'local'
}

async function createVideoFrom(file) {
    file = transformPath(file)
    const statResult = statSync(file, { throwIfNoEntry: false })
    if (!statResult) return null

    const filename = getSimpleFileName(file)
    //TODO
    const hash = MD5(file)
    return {
        id: hash,
        platform: detectVideoPlatform(file),
        title: filename,
        cover: null,
        url: (FILE_PREFIX + file),
    }
}

/** 解析levc格式文件
 * 目前格式松散，对数据的顺序性、重复性等方面并没有强制要求
 * levc => Less Player Video Collection
 * @param callback 每个视频项解析成功后的回调处理函数
 */
function parseVideoCollectionLines(lines) {
    if(!lines || !Array.isArray(lines) || lines.length < 1) return 
    
    const Meta = {
        DELIMITER: '$',
        TITLE: 'title',
        COVER: 'cover',
        YEAR: 'year',
        REGION: 'region',
        LANG: 'lang',
        ARTISTS: 'artists',
        TAGS: 'tags',
        ABOUT: 'about',
        UPDATED: 'updated',
        LIST: 'list',
        keyName: (prop) => (`${Meta.DELIMITER}${prop}${Meta.DELIMITER}`),
    }
    const delimiter = Meta.DELIMITER

    const vcid = 'levc' + Date.now()
    const collection = { id: vcid, platform: 'free-video', title: '', data: [] }

    let listBegan = false
    lines.forEach(line => {
        line = line.trim()
        if(!line || line.startsWith('#') 
            || line.startsWith('//')
            || line.startsWith('/*')
            || line.startsWith('*')) return
        
        if(line.startsWith(Meta.keyName(Meta.TITLE))) {
            const title = line.split(Meta.keyName(Meta.TITLE))[1].trim()
            Object.assign(collection, { title })
        } else if(line.startsWith(Meta.keyName(Meta.COVER))
            || line.startsWith(Meta.keyName(Meta.YEAR))
            || line.startsWith(Meta.keyName(Meta.REGION))
            || line.startsWith(Meta.keyName(Meta.LANG))
            || line.startsWith(Meta.keyName(Meta.ARTISTS))
            || line.startsWith(Meta.keyName(Meta.TAGS))
            || line.startsWith(Meta.keyName(Meta.ABOUT))
            || line.startsWith(Meta.keyName(Meta.UPDATED))) {
            const parts = line.split(delimiter)
            if(!parts || parts.length < 3) return 

            const key = parts[1].trim()
            const value = parts[2].trim()
            collection[key] = value
        } else if(!listBegan && line.startsWith(Meta.keyName(Meta.LIST))) {
            listBegan = true
        } else if(line.startsWith(delimiter) && line.endsWith(delimiter)) {
            const title = line.substring(1, line.length - 1)
            Object.assign(collection, { title })
        } else if(line.includes(delimiter)) {
            const parts = line.split(delimiter)
            if(!parts || parts.length != 2) return

            const subtitle = parts[0].trim() 
                    || getSimpleFileName(parts[0], randomTextWithinAlphabetNums(8))
            let url = parts[1].trim()
            if(!url.startsWith('http') 
                && !url.startsWith('blob:http') 
                && !url.startsWith('/')) {
                return
            }
            if(url.startsWith('/')) url = transformUrl(url, FILE_SCHEME)
            
            collection.data.push({ 
                id: MD5(subtitle), 
                platform: detectVideoPlatform(url), 
                title: subtitle, 
                url, 
            })
        } else {
            //数据行格式：[url]
            line = transformPath(line)
            if(!line.startsWith('http') 
                && !line.startsWith('blob:http') 
                && !line.startsWith('/')) {
                return
            }  
            if(line.startsWith('/')) line = transformUrl(line, FILE_SCHEME)
            
            const id = randomTextWithinAlphabetNums(8)
            collection.data.push({ 
                id, 
                platform: detectVideoPlatform(line), 
                title: getSimpleFileName(line, id), 
                url: line,
            })
        }
    })

    const vcType = collection.data.length > 1 ? 1 : 0
    Object.assign(collection, { vcType })
    //单个视频，非合集
    if(!vcType) {
        const vcItem = collection.data.length > 0 ? collection.data[0] : {}
        Object.assign(collection, { ...vcItem, data: [] })
        Object.assign(collection, { platform: detectVideoPlatform(collection.url) })
    }
    //const { title } = collection
    //if(title) Object.assign(collection, { id: MD5(title) })

    return collection
}

function parseVideoCollectionFile(file) {
    const content = readText(file)
    if (!content) return 
    const lines = content.trim().split('\n')
    return parseVideoCollectionLines(lines)
}

/**
 * 解析并创建视频对象，覆盖以下场景：
 * 1、单个视频文件 => [vcType = 0]
 * 2、levc合集文件 => [vcType = 1]
 * 3、多个本地视频文件 => [vcType = 1]
 * 其中, vcType值：0 => 单文件，1 => 合集
 */
async function parseVideos(videoFiles) {
    if(!videoFiles || videoFiles.length < 1) return 

    //视频合集文件
    //只检查第一顺序位，其他位置直接忽略
    const firstFile = videoFiles[0]
    if (firstFile.endsWith('.levc')) return parseVideoCollectionFile(firstFile)
    
    const id = 'levc' + Date.now()
    const video = { id, platform: 'free-video', title: '', vcType: 0, data: [] }
    //普通文件
    for (const file of videoFiles) {
        try {
            //非视频文件
            if (!isSuppotedVideoType(file)) continue
            //非第一顺序位的合集，直接忽略
            if (file.endsWith('.levc')) continue
            
            const videoItem = await createVideoFrom(file)
            if (!videoItem) continue
            //去掉重复项
            const index = video.data.findIndex(item => video.url == item.url)
            if (index == -1) video.data.push(videoItem)
        } catch (error) {
            console.log(error)
        }
    }

    //重新确认vcType，并根据vcType更新相关信息
    const vcType = (video.data.length > 1 ? 1 : 0)
    Object.assign(video, { vcType  })
    if(!vcType) {
        const videoItem = video.data.length > 0 ? video.data[0] : {}
        Object.assign(video, { ...videoItem, data: [] })
        Object.assign(video, { platform: detectVideoPlatform(video.url) })
    }
    
    return video
}

function MD5(text) {
    return text ? CryptoJS.MD5(text).toString() : null
}

function SHA1(text) {
    return text ? CryptoJS.SHA1(text).toString() : null
}

function stringIncludesIgnoreCase(value1, value2) {
    if(!value1 || !value2) return false
    const _value1 = value1.trim().toLowerCase()
    const _value2 = value2.trim().toLowerCase()
    return _value1.includes(_value2)
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
    let container = null, codec = null
    let bitrate = null, sampleRate = null, bitDepth = null
    try {
        if (metadata.common) {
            const { title: mTitle, artist: mArtist, 
                artists, album: mAlbum, picture, 
                lyrics, year: mYear, 
                date: mDate, originaldate 
            } = metadata.common
            //歌曲名称
            if (mTitle) title = mTitle.trim()
            //歌手、艺人
            if (artists) {
                if (artists.length > 1) {
                    artists.forEach(ar => artist.push({ id: 0, name: ar }))
                } else { //异常格式
                    artists.forEach(ar => {
                        const delimiter = '、'
                        const names = ar.replace(/[\/&，,\|\\]/g, delimiter).split(delimiter)
                        names.forEach(name => {
                            artist.push({ id: 0, name })
                        })
                    })
                }
            }
            //专辑名称
            if (mAlbum) Object.assign(album, { id: 0, name: mAlbum })
            //封面
            //const cover = MusicMetadata.selectCover(picture)
            //直接返回内容数据，太耗内存
            //if (cover) coverData = `data:${cover.format};base64,${cover.data.toString('base64')}`

            //内嵌歌词
            //if (lyrics && lyrics.length > 0) lyricText = lyrics[0]

            //发布时间
            if (originaldate) publishTime = originaldate
            if (!publishTime && mDate) publishTime = mDate
            if (!publishTime && mYear) publishTime = mYear
        }
        if (metadata.format) {
            const { duration: mDuration, bitrate: mBitrate, 
                sampleRate: mSampleRate, bitsPerSample: mBitDepth,
                container: mContainer, codec: mCodec
            } = metadata.format
            if (mDuration) duration = mDuration * 1000

            bitrate = mBitrate
            sampleRate = mSampleRate
            bitDepth = mBitDepth

            if(!mContainer) {
                codec = ''
            } if(stringIncludesIgnoreCase(mContainer, 'OGG')) {
                codec = 'OGG'
            } else if(stringIncludesIgnoreCase(mContainer, 'WAVE')) {
                codec = 'WAV'
            } else if(stringIncludesIgnoreCase(mContainer, 'M4A')) {
                codec = 'M4A'
            } else {
                //TODO 待定，需查阅资料
                codec = (mCodec || '').trim()
                    .replace('MPEG 1 Layer 3', 'MP3')
                    .replace('MPEG 2 Layer 3', 'MP3')
                    .replace('MPEG 1 Layer 2', 'AAC')
                    .replace('MPEG 2 Layer 1', 'AAC')
                    
            }
        }

        //内嵌歌词
        /*
        if (metadata.native && !lyricText) {
            const ID3v23 = metadata.native['ID3v2.3']
            for (var i in ID3v23) {
                const { id, value } = ID3v23[i]
                if (id === 'USLT') { //Unsynchronised Lyrics
                    lyricText = value.text
                    break
                }
                //Synchronised Lyrics暂不支持
            }
        }
        */
       
        //TODO
        const hash = MD5(file)
        return {
            id: hash,
            platform: 'local',
            title: title || filename,
            filename,
            artist,
            album,
            duration,
            cover: (ImageProtocal.prefix + file),
            //embeddedLyricText: lyricText,
            url: (FILE_PREFIX + file),
            publishTime,
            bitrate,
            sampleRate,
            bitDepth,
            codec
        }

    } catch (error) {
        console.log(error)
    }
    return null
}

async function parseImageMetaFromFile(file) {
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

async function parseEmbeddedLyricFromFile(file) {
    file = transformPath(file)
    const statResult = statSync(file, { throwIfNoEntry: false })
    if (!statResult) return null

    const metadata = await MusicMetadata.parseFile(file, { duration: true })
    let lyricText = null
    try {
        if (metadata.common) {
            const { lyrics } = metadata.common
            //内嵌歌词
            if (lyrics && lyrics.length > 0) lyricText = lyrics[0]
        }

        //内嵌歌词
        if (metadata.native && !lyricText) {
            const ID3v23 = metadata.native['ID3v2.3']
            for (var i in ID3v23) {
                const { id, value } = ID3v23[i]
                if (id === 'USLT') { //Unsynchronised Lyrics
                    lyricText = value.text
                    break
                }
                //Synchronised Lyrics暂不支持
            }
        }
    } catch (error) {
        console.log(error)
    }
    return lyricText
}

function readBufferSync(file, encoding) {
    try {
        file = transformPath(file)
        const statResult = statSync(file, { throwIfNoEntry: false })
        if (statResult) return readFileSync(file, { encoding })
    } catch (error) {
        console.log(error, file, encoding)
    }
    return null
}

function readText(file, encoding) {
    if(!file) return null
    const data = readBufferSync(file, encoding || 'utf8')
    return data ? data.toString() : null
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
    const choices = ALPHABET_NUMS + ALPHABET_NUMS + ALPHABET_NUMS
    return randomText(choices, len)
}

const nextInt = (max) => {
    const limit = max < 1024 ? 1024 : max
    return parseInt(Math.random() * limit) % max
}

const getDownloadDir = () => {
    return homedir() + "/Downloads/"
}

const removePath = (path) => {
    rm(path, { force: true, recursive: true }).catch(error => {
        if(isDevEnv) console.log(error)
    })
}

/** 返回值为数组，且当没有文件时，默认为[] 
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
            const pathName = path.join(dir, dirent.name)
            if (dirent.isFile()) {
                if (callback && (typeof callback == 'function')) callback(pathName, dirent)
            } else if (dirent.isDirectory() && options.deep) {
                walkSync(pathName, callback, options)
            }
        })
    } catch (error) {
        console.log(error)
    }
}

//解析.pls格式文件
const parsePlsFile = async (filename, audioExts) => {
    try {
        audioExts = audioExts || []
        if(audioExts.length < 1) {
            audioExts.push(...AUDIO_EXTS)
            audioExts.push(...EXTRA_AUDIO_EXTS)
        }
        filename = transformPath(filename)
        const sname = getSimpleFileName(filename)
        const result = { file: filename, name: sname, version: null, data: [], cover: '' }
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
            if (file != null && isExtentionValid(file, audioExts)) {
                file = resolveParentPath(filename, file)
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
        result.cover = await scanDirCover(getParentPath(filename)) || ''
        return result
    } catch (error) {
        console.log(error)
    }
    return null
}

//解析.m3u格式，歌曲列表文件
const parseM3uPlaylist = async (filename, audioExts) => {
    try {
        audioExts = audioExts || []
        if(audioExts.length < 1) {
            audioExts.push(...AUDIO_EXTS)
            audioExts.push(...EXTRA_AUDIO_EXTS)
        }
        filename = transformPath(filename)
        const sname = getSimpleFileName(filename)
        const result = { file: filename, name: sname, version: null, data: [], cover: '' }
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
            if (file != null && isExtentionValid(file, audioExts)) {
                file = resolveParentPath(filename, file)
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
        result.cover = await scanDirCover(getParentPath(filename)) || ''
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

//默认封面Base64内容
const DEFAULT_COVER_BASE64 = "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"

//保存为.m3u格式文件
const writeM3uFile = async (filename, data, looseMode) => {
    let content = '#EXTM3U\n'
    for (var i = 0; i < data.length; i++) {
        const { title, duration, url, cover } = data[i]
        //非标准，自定义扩展
        const coverExtPart = (cover && looseMode && cover != 'default_cover.png')
            ? `, "${cover}"` : ''
        const file = transformPath(url)
        const length = (duration && duration > 0) ? Math.ceil(duration / 1000) : -1
        content += `#EXTINF:${length}, ${title}${coverExtPart}\n${file}\n`
    }
    return writeText(filename, content)
}

module.exports = {
    transformPath,
    transformUrl,
    scanDirTracks,
    parseTracks,
    readText,
    writeText,
    FILE_PREFIX,
    ImageProtocal,
    ALPHABET_NUMS,
    randomText,
    randomTextWithinAlphabetNums,
    nextInt,
    getDownloadDir,
    removePath,
    listFiles,
    parsePlsFile,
    parseM3uPlaylist,
    writePlsFile,
    writeM3uFile,
    parseImageMetaFromFile,
    parseEmbeddedLyricFromFile,
    statPathSync,
    walkSync,
    MD5,
    SHA1,
    DEFAULT_COVER_BASE64,
    getSimpleFileName,
    getFileExtName,
    parseVideos,
    parseVideoCollectionLines,
    isSuppotedAudioType,
    isSuppotedVideoType,
}