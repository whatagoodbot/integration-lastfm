import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const Lastfm = require('simple-lastfm')

const createLastfmInstance = async (lastfmOptions) => {
  const lastfm = new Lastfm(lastfmOptions)
  return new Promise(resolve => {
    lastfm.getSessionKey(() => {
      resolve(lastfm)
    })
  })
}

const defaultLastfmInstance = await createLastfmInstance({
  api_key: process.env.LASTFM_API_KEY,
  api_secret: process.env.LASTFM_API_SECRET,
  username: process.env.LASTFM_USERNAME,
  password: process.env.LASTFM_PASSWORD
})

export default async payload => {
  if (payload.service !== process.env.npm_package_name) return
  let message = 'Couldn\'t find anything. Sorry.'
  if (payload.name === 'artist') {
    const artistDetails = new Promise(resolve => {
      defaultLastfmInstance.getArtistInfo({
        artist: payload.nowPlaying.artist,
        callback: results => {
          resolve(results)
        }
      })
    })
    const details = await artistDetails
    message = details.artistInfo.bio.summary.replace(/<[^>]*>?/gm, '')
    if (payload.arguments) {
      if (payload.arguments.toLowerCase().indexOf('full') > -1) {
        message = details.artistInfo.bio.content.replace(/<[^>]*>?/gm, '')
      }
    }
  } else if (payload.name === 'album') {
    const trackDetails = new Promise(resolve => {
      defaultLastfmInstance.getTrackInfo({
        artist: payload.nowPlaying.artist,
        track: payload.nowPlaying.title,
        callback: results => {
          resolve(results)
        }
      })
    })
    const track = await trackDetails
    const albumDetails = new Promise(resolve => {
      defaultLastfmInstance.getAlbumInfoByMbid({
        artist: payload.nowPlaying.artist,
        mbid: track.trackInfo.album.mbid,
        callback: results => {
          resolve(results)
        }
      })
    })
    const details = await albumDetails
    if (details?.albumInfo?.wiki) {
      const released = details.albumInfo.wiki.published.split(',')[0]
      message = `Released ${released}, ${details.albumInfo.wiki.summary.replace(/<[^>]*>?/gm, '')}`
      if (payload.arguments) {
        if (payload.arguments.toLowerCase().indexOf('full') > -1) {
          message = `Released ${released}, ${details.albumInfo.wiki.content.replace(/<[^>]*>?/gm, '')}`
        }
      }
    }
  }
  return {
    topic: 'broadcast',
    payload: {
      message

    }
  }
}
