const { opendir } = require('fs/promises');
const path = require('path');
const CryptoJS = require('crypto-js');
const MusicMetadata = require('music-metadata');



const FILE_PREFIX = 'file:///'

const transformPath = (path) => {
    try {
        return path.replace(/\\/g, '/')
    } catch (error) {
        console.log(error)
    }
    return path
}

const isExtentionValid = (name, exts) => {
    for (var ext of exts) {
        if (name.endsWith(ext)) {
            return true
        }
    }
    return false
}

function getSimpleFileName(fullname) {
    if (!fullname) return ''
    fullname = transformPath(fullname).trim()
    const from = fullname.lastIndexOf('/')
    const to = fullname.lastIndexOf('.')
    return fullname.substring(from + 1, to)
}

const scanDirTracks = async (dir, exts) => {
    try {
        const result = { path: dir, data: [] }
        const list = await opendir(dir)
        const files = []
        for await (const dirent of list) {
            if (dirent.isFile() && isExtentionValid(dirent.name, exts)) {
                const fullname = transformPath(path.join(dir, dirent.name))
                files.push(fullname)
            }
        }
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

async function createTrackFromMetadata(file) {
    file = transformPath(file)
    const metadata = await MusicMetadata.parseFile(file, { duration: true })
    const artist = []
    let filename = getSimpleFileName(file)
    const album = { id: 0, name: '' }
    let coverData = 'default_cover.png'
    let title = null, duration = 0, lyricText = null
    try {
        if (metadata.common) {
            const { title: mTitle, artist: mArtist, artists, album: mAlbum, picture, lyrics } = metadata.common
            //歌曲名称
            if (mTitle) title = mTitle.trim()
            //歌手、艺人
            if (artists) artists.forEach(ar => artist.push({ id: '', name: ar }))
            //专辑名称
            if (mAlbum) album.name = mAlbum
            //封面
            const cover = MusicMetadata.selectCover(picture)
            if (cover) coverData = `data:${cover.format};base64,${cover.data.toString('base64')}`
            //内嵌歌词
            if (lyrics && lyrics.length > 0) lyricText = lyrics[0]
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

        const hash = CryptoJS.MD5(file).toString()
        //TODO
        return {
            id: hash,
            platform: 'local',
            title: title || filename,
            filename,
            artist,
            album,
            duration,
            cover: coverData,
            embeddedLyricText: lyricText,
            url: (FILE_PREFIX + file)
        }

    } catch (error) {
        console.log(error)
    }
    return null
}

async function parseTracks(audioFiles) {
    const tracks = []
    for (const file of audioFiles) {
        try {
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

process.parentPort.on('message', (event) => {
    //const [port] = event.ports
    const { action, args } = event.data
    if (action === 'scanDirTracks') {
        scanDirTracks(args[0], args[1]).then(result => {
            process.parentPort.postMessage(result)
        })
    }
})

