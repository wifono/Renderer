import { RenderService } from './render.class.js'

export const renderPath = 'render'
export const renderMethods = ['create']

export * from './render.class.js'

import { renderPuppeteer, initPuppeteer } from '../render/renderPuppeteer.js'
import { Renderer } from '../render/renderPhantom.js'
import path from 'path'
import fs from 'fs'

const TEMPLATE_PATH = process.env.TEMPLATE_PATH

const PhantomRenderer = Renderer.instance
PhantomRenderer.init()

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
