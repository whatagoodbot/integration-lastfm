import broker from 'message-broker'
import controllers from './controllers/index.js'
import { logger } from './utils/logging.js'
import { metrics } from './utils/metrics.js'
import { performance } from 'perf_hooks'

const topicPrefix = `${process.env.NODE_ENV}/`

const subscribe = () => {
  Object.keys(controllers).forEach((topic) => {
    broker.client.subscribe(`${topicPrefix}${topic}`, (err) => {
      logger.info(`subscribed to ${topicPrefix}${topic}`)
      if (err) {
        logger.error({
          error: err.toString(),
          topic
        })
      }
    })
  })
}

if (broker.client.connected) {
  subscribe()
} else {
  broker.client.on('connect', subscribe)
}

broker.client.on('error', (err) => {
  logger.error({
    error: err.toString()
  })
})

broker.client.on('message', async (topic, data) => {
  const startTime = performance.now()
  const topicName = topic.substring(topicPrefix.length)
  try {
    metrics.count('receivedMessage', { topicName })
    const requestPayload = JSON.parse(data.toString())
    const validatedRequest = broker[topicName].validate(requestPayload)
    if (validatedRequest.errors) throw { message: validatedRequest.errors } // eslint-disable-line
    const processedResponse = await controllers[topicName](requestPayload)
    if (processedResponse?.topic) {
      const replyTopic = processedResponse.topic
      const validatedResponse = broker[replyTopic].validate({
        ...validatedRequest,
        ...processedResponse.payload
      })
      if (validatedResponse.errors) throw { message: validatedResponse.errors } // eslint-disable-line
      console.log(validatedResponse)
      broker.client.publish(`${topicPrefix}${replyTopic}`, JSON.stringify(validatedResponse))
    }
    metrics.timer('responseTime', performance.now() - startTime, { topic })
  } catch (error) {
    logger.error(error.message)
    metrics.count('error', { topicName })
  }
})
