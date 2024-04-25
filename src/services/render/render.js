import { RenderService } from './render.class.js'

export const renderPath = 'render'
export const renderMethods = ['create']

export * from './render.class.js'

import { Puppeteer } from '../render/renderPuppeteer.js'
import { Phantom } from '../render/renderPhantom.js'
import path from 'path'
import fs from 'fs'

const TEMPLATE_PATH = process.env.TEMPLATE_PATH
const PhantomRenderer = Phantom.instance
const PuppeteerRenderer = Puppeteer.instance

const renderer = [{ framework: 'puppet' /*'puppet', 'phantom'  */ }]

renderer[0].framework === 'phantom' ? await PhantomRenderer.init() : await PuppeteerRenderer.init()

export const render = (app) => {
  app.use(renderPath, new RenderService(), {
    methods: renderMethods
  })
  app.service(renderPath).hooks({
    around: {
      all: []
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
        if (!Buffer.isBuffer(imageBuffer)) {
          throw new Error('imageBuffer is not a buffer object')
        }
        res.set(headers)
        res.send(imageBuffer)
      }

      // Puppeteer renderer
      if (opts.settings.renderer === 'puppeteer') {
        let template = req.body
        const imageBuffer = await PuppeteerRenderer.renderImage(template, opts)
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
  const settingsFileName = path.join(TEMPLATE_PATH, template, 'settings.json')
  if (fs.existsSync(settingsFileName)) {
    const settingsRaw = fs.readFileSync(settingsFileName)
    settings = JSON.parse(settingsRaw)
  }

  return { mime, url, settings, data }
}
