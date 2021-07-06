import * as mm from 'music-metadata'

import { Observable, SubscriptionObserver } from 'observable-fns'
import fs, { promises as fsP } from 'fs'

import crypto from 'crypto'
import { expose } from 'threads'
import path from 'path'
import { v4 } from 'uuid'

const audioPatterns = new RegExp('.flac|.mp3|.ogg|.m4a|.webm|.wav|.wv', 'i')

expose({
  start(paths: musicPaths) {
    return new Observable<any>((observer) => {
      start(paths, observer)
    })
  },
})

async function scanFile(filePath: string): Promise<Song> {
  const fsStats = await fsP.stat(filePath)
  const hash = await generateChecksum(filePath)

  return processFile({
    path: filePath,
    inode: fsStats.ino.toString(),
    deviceno: fsStats.dev.toString(),
    size: fsStats.size,
    hash: hash,
  })
}

async function processFile(stat: stats): Promise<Song> {
  const metadata = await mm.parseFile(stat.path)
  // const cover = getCover(metadata, stat.path, v4())
  const info = await getInfo(metadata, stat)
  return info
}

async function getInfo(data: mm.IAudioMetadata, stats: stats): Promise<Song> {
  const artists: string[] = []
  if (data.common.artists) {
    for (const a of data.common.artists) {
      artists.push(...a.split(/[,&]+/))
    }
  }

  return {
    _id: v4(),
    title: data.common.title ? data.common.title : path.basename(stats.path).split('.').slice(0, -1).join('.').trim(),
    path: stats.path,
    size: stats.size,
    album: {
      album_name: data.common.album,
      album_song_count: 0,
      year: data.common.year,
      album_artist: data.common.albumartist,
    },
    artists: artists,
    date: data.common.date,
    year: data.common.year,
    genre: data.common.genre,
    lyrics: data.common.lyrics ? data.common.lyrics[0] : undefined,
    releaseType: data.common.releasetype,
    bitrate: data.format.bitrate,
    codec: data.format.codec,
    container: data.format.container,
    duration: data.format.duration || 0,
    sampleRate: data.format.sampleRate,
    hash: stats.hash,
    inode: stats.inode,
    deviceno: stats.deviceno,
    type: 'LOCAL',
  }
}

async function scanDir(directory: string, observer: SubscriptionObserver<Song>) {
  if (fs.existsSync(directory)) {
    const promises: Promise<void>[] = []
    const files = fs.readdirSync(directory)
    files.forEach((file) => {
      if (fs.statSync(path.join(directory, file)).isDirectory()) {
        scanDir(path.join(directory, file), observer)
      }
      if (audioPatterns.exec(path.extname(file)) !== null) {
        const filePath = path.join(directory, file)
        promises.push(scanFile(filePath).then((result) => observer.next(result)))
      }
    })
    await Promise.all(promises).then(() => observer.complete())
  } else {
    console.error('invalid directory: ' + directory)
  }
}

async function start(paths: musicPaths, observer: SubscriptionObserver<any>) {
  for (const i in paths) {
    paths[i].enabled && scanDir(paths[i].path, observer)
  }
}

async function generateChecksum(file: string): Promise<string> {
  return new Promise((resolve) => {
    const hash = crypto.createHash('md5')
    const fileStream = fs.createReadStream(file, { highWaterMark: 256 * 1024 })
    fileStream.on('data', (data) => {
      hash.update(data)
    })
    fileStream.on('end', function () {
      resolve(hash.digest('hex'))
    })
  })
}