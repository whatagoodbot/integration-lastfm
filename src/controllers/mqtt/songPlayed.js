import { logger, metrics } from '@whatagoodbot/utilities'
import { createLastfmInstance, defaultLastfmInstance } from '../../libs/lastfm.js'

const scrobbleTrack = async (lastfmInstance, artist, track, album) => {
  const functionName = 'scrobbleTrack'
  logger.debug({ event: functionName, artist, track })
  metrics.count(functionName)

  if (process.env.NODE_ENV === 'development') return
  const promises = [
    new Promise(resolve => {
      lastfmInstance.scrobbleTrack({
        artist,
        track,
        album,
        callback: (result) => {
          metrics.count('scrobbledOk')
          resolve(result)
        }
      })
    }),
    new Promise(resolve => {
      lastfmInstance.scrobbleNowPlayingTrack({
        artist,
        track,
        album,
        callback: (result) => {
          metrics.count('scrobbledOk')
          resolve(result)
        }
      })
    })
  ]
  return Promise.all(promises)
}

export default async payload => {
  scrobbleTrack(defaultLastfmInstance, payload.nowPlaying.artist, payload.nowPlaying.title, payload.nowPlaying.album)
  if (payload.room.lastfm.api_key && payload.room.lastfm.api_secret && payload.room.lastfm.username && payload.room.lastfm.password) {
    const roomLastfmInstance = await createLastfmInstance(payload.room.lastfm)
    scrobbleTrack(roomLastfmInstance, payload.nowPlaying.artist, payload.nowPlaying.title, payload.nowPlaying.album)
  }
}
