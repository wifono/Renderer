import { hooks as schemaHooks } from '@feathersjs/schema'
import {
  renderDataValidator,
  renderPatchValidator,
  renderQueryValidator,
  renderResolver,
  renderExternalResolver,
  renderDataResolver,
  renderPatchResolver,
  renderQueryResolver
} from './render.schema.js'
import { RenderService, getOptions } from './render.class.js'

export const renderPath = 'render'
export const renderMethods = ['find', 'get', 'create', 'patch', 'remove']

export * from './render.class.js'
export * from './render.schema.js'

import { renderPuppeteer, initPuppeteer } from '../render/renderPuppeteer.js'
import { Renderer } from '../render/renderPhantom.js'
import path from 'path'
import fs from 'fs'

const TEMPLATE_PATH = process.env.TEMPLATE_PATH

const PhantomRenderer = Renderer.instance
PhantomRenderer.init()

export const render = (app) => {
  app.use(renderPath, new RenderService(getOptions(app)), {
    methods: renderMethods
  })
  app.service(renderPath).hooks({
    around: {
      all: [schemaHooks.resolveExternal(renderExternalResolver), schemaHooks.resolveResult(renderResolver)]
    },
    before: {
      all: [schemaHooks.validateQuery(renderQueryValidator), schemaHooks.resolveQuery(renderQueryResolver)],

      create: [schemaHooks.validateData(renderDataValidator), schemaHooks.resolveData(renderDataResolver)],
      patch: [schemaHooks.validateData(renderPatchValidator), schemaHooks.resolveData(renderPatchResolver)]
    }
  })

  const headers = {
    'Content-Type': 'image/png',
    'Content-Disposition': 'inline; filename="image.png"'
  }

  app.post('/service/task/preview/image', async (req, res) => {
    try {
      const opts = await renderOpts(req.body)
      //Phantom renderer
      if (opts.settings.renderer === 'phantom') {
        let template = req.body

        const imageBuffer = await PhantomRenderer.renderImage(template, opts)
        const image = Buffer.from(imageBuffer, 'base64')

        if (!Buffer.isBuffer(image)) {
          throw new Error('imageBuffer is not a buffer object')
        }
        res.set(headers)
        res.send(image)
      }

      // Puppeteer renderer
      if (opts.settings.renderer === 'puppeteer') {
        const imageBuffer = await renderPuppeteer(opts)
        if (!Buffer.isBuffer(imageBuffer)) {
          throw new Error('imageBuffer is not a buffer object')
        }
        res.set(headers)
        res.send(imageBuffer)
      }
    } catch (error) {
      console.error(error)
      res.status(400).send('Nejdze to.')
    }
  })
}

async function renderOpts(req) {
  const mime = { png: 'image/png' }
  const template = req['@template'].replace('.xsl', '')
  const url = TEMPLATE_PATH + '/' + template + '/index.html'

  let data = req
  let settings = {}
  console.log(url)
  const settingsFileName = path.join(TEMPLATE_PATH, template, 'settings.json')
  if (fs.existsSync(settingsFileName)) {
    const settingsRaw = fs.readFileSync(settingsFileName)
    settings = JSON.parse(settingsRaw)
  }

  return { mime, url, settings, data }
}
