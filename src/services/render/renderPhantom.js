import phantom from 'phantom'
import amount from 'physical-cpu-count'

const singleton = Symbol()
const singletonEnforcer = Symbol()
const physicalCpuCount = amount

const PHANTOM_INSTANCES = 4
const TEMPLATE_PATH = process.env.TEMPLATE_PATH

export class Phantom {
  constructor(enforcer) {
    if (enforcer != singletonEnforcer) {
      throw new Error('Cannot construct singleton')
    }
    //count of instances
    console.info('Initializing renderer, count: ' + PHANTOM_INSTANCES)
    this.instances = parseInt(PHANTOM_INSTANCES)
    if (this.instances > physicalCpuCount * 2) {
      console.info('Physical CPU count low, setting new renderer count: ' + physicalCpuCount)
      this.instances = physicalCpuCount * 2
    }
    this.initialising = true

    //internal counter
    this.counter = 0
    this.templates = {}
    this.templatesConfig = {}
    this.templatesInUse = {}
    this.browsers = []
    this.templateSources = []
    this.url = ''
    this.templateStats = {}
  }

  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new Phantom(singletonEnforcer)
    }
    return this[singleton]
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  // Vytvorenie nového browseru
  async init() {
    console.info('Renderer instances start')
    for (var i = 1; i <= this.instances; i++) {
      this.browsers.push(
        await phantom.create(['--local-url-access=true', '--disk-cache=true', '--max-disk-cache-size=10000'])
      )
    }

    await Promise.all(this.browsers)
  }

  getCounter() {
    if (this.counter >= this.instances) {
      this.counter = 0
    }
    return this.counter++ % this.instances
  }

  async initTemplate(template, opts) {
    this.initialising = true
    let labelSettings = opts.data.Article.Label
    const templateName = template

    console.info(`Initializing template: ${templateName} - ${opts._phantomKey}`)

    let temp = []
    let tempInUse = {}

    const settings = {
      top: 0,
      left: 0,
      width: labelSettings.width,
      height: labelSettings.height
    }

    try {
      const phantomKey = `${opts._phantomKey}`

      for (let i = 0; i < this.instances; i++) {
        const filePath = `file:///${TEMPLATE_PATH}/${template}/index.html`

        const pagePromise = this.browsers[i].createPage().then(async (page) => {
          await page.property('clipRect', settings)
          await page.property(
            'userAgent',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36'
          )
          await page.property('dpi', '150')
          await page.open(filePath)
          await page.evaluate(function () {
            var style = document.createElement('style')
            var text = document.createTextNode(
              'body { background-color: #FFFFFF; -webkit-font-smoothing: none !important; }'
            )
            style.setAttribute('type', 'text/css')
            style.appendChild(text)
            document.head.insertBefore(style, document.head.firstChild)
          })

          temp.push(page)
          tempInUse[i] = false
        })

        await pagePromise
      }

      this.templates[phantomKey] = temp
      this.templatesInUse[phantomKey] = tempInUse

      this.templatesConfig[templateName] = {
        width: labelSettings.width,
        height: labelSettings.height
      }
      await this.sleep(100)
      this.initialising = false
      return this.templates
    } catch (error) {
      console.error('Error initializing template:', error)
      this.initialising = false
      throw error
    }
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async getTemplate(template, opts) {
    const phantomKey = opts._phantomKey

    if (this.initialising) {
      await this.sleep(500)
      this.initialising = false
      return await this.getTemplate(template, opts)
    }

    const count = this.getCounter()
    if (this.templates[phantomKey] === undefined) {
      await this.initTemplate(template, opts)
    }

    if (this.templatesInUse[phantomKey][count] === false) {
      this.templatesInUse[phantomKey][count] = true
      return this.templates[phantomKey][count]
    }

    await this.sleep(this.getRandomInt(1, 10))
    return await this.getTemplate(template, opts)
  }

  async renderBase64(p, phantomKey) {
    const count = this.getCounter()
    await this.sleep(2)
    const t = await p.renderBase64('PNG')
    this.templatesInUse[phantomKey][count] = false
    return t
  }

  async renderImage(data, opts) {
    try {
      const template = data['@template'].replace(/\.[^.]+$/, '')
      opts['_phantomKey'] =
        template + '_' + opts.data.Article.Label.width + '_' + opts.data.Article.Label.height
      const phantomKey = opts._phantomKey
      console.time('Get Template:')
      const page = await this.getTemplate(template, opts)
      console.timeEnd('Get Template:')

      const eData = data.Article

      console.time('Evaluate:')
      await page.evaluate(function (arg) {
        setPageData(arg)
      }, eData)
      console.timeEnd('Evaluate:')

      console.time('Render:')
      const image = await this.renderBase64(page, phantomKey)
      console.timeEnd('Render:')
      return Buffer.from(image, 'base64')
    } catch (error) {
      console.error('Error rendering image:', error)
      throw error
    }
  }
}
