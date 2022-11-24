import { logger, metrics } from '@whatagoodbot/utilities'

import { clients } from '@whatagoodbot/rpc'
import { defaultLastfmInstance } from '../../libs/lastfm.js'

export default async payload => {
  if (payload.service !== process.env.npm_package_name) return

  const string = await clients.strings.get('lastFmNothingFound')
  let message = string.value
  if (payload.command === 'artist') {
    const functionName = payload.command
    logger.debug({ event: functionName })
    metrics.count(functionName)
    const artistDetails = new Promise(resolve => {
      defaultLastfmInstance.getArtistInfo({
        artist: payload.nowPlaying.artist,
        callback: results => {
          resolve(results)
        }
      })
    })
    const details = await artistDetails
    if (details.artistInfo) {
      message = details.artistInfo.bio.summary.replace(/<[^>]*>?/gm, '')
      if (payload.arguments) {
        if (payload.arguments.toLowerCase().indexOf('full') > -1) {
          message = details.artistInfo.bio.content.replace(/<[^>]*>?/gm, '')
        }
      }
    }
  } else if (payload.command === 'album') {
    const functionName = payload.command
    logger.debug({ event: functionName })
    metrics.count(functionName)
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
      defaultLastfmInstance.getAlbumInfo({
        artist: track.trackInfo.album.artist,
        album: track.trackInfo.album.title,
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
  return [{
    topic: 'broadcast',
    payload: {
      message
    }
  }]
}
