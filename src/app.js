// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html
import { feathers } from '@feathersjs/feathers'
import express, { rest, json, urlencoded, cors, notFound, errorHandler } from '@feathersjs/express'
import configuration from '@feathersjs/configuration'
import { configurationValidator } from './configuration.js'
import { logger } from './logger.js'
import { logError } from './hooks/log-error.js'
import 'dotenv/config'

import { services } from './services/index.js'

const app = express(feathers())

app.configure(configuration(configurationValidator))
app.use(cors())
app.use(json())
app.use(urlencoded({ extended: true }))

app.configure(rest())

app.configure(services)

app.use(notFound())
app.use(errorHandler({ logger }))

app.hooks({
  around: {
    all: [logError]
  }
})

export { app }
