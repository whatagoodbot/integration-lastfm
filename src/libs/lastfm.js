import { createRequire } from 'module'
import { logger, metrics } from '@whatagoodbot/utilities'

const require = createRequire(import.meta.url)
const Lastfm = require('simple-lastfm')

export const createLastfmInstance = async (lastfmOptions) => {
  const functionName = 'createLastfmInstance'
  logger.debug({ event: functionName })
  metrics.count(functionName)
  const lastfm = new Lastfm(lastfmOptions)
  return new Promise(resolve => {
    lastfm.getSessionKey(() => {
      resolve(lastfm)
    })
  })
}

export const defaultLastfmInstance = await createLastfmInstance({
  api_key: process.env.API_KEY_LASTFM,
  api_secret: process.env.API_SECRET_LASTFM,
  username: process.env.USERNAME_EXTERNAL_LASTFM,
  password: process.env.PASSWORD_EXTERNAL_LASTFM
})
