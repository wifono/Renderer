import puppeteer from 'puppeteer'
import amount from 'physical-cpu-count'

const singleton = Symbol()
const singletonEnforcer = Symbol()
const physicalCpuCount = amount

const TEMPLATE_PATH = process.env.TEMPLATE_PATH
const PUPPETEER_INSTANCES = process.env.PUPPETEER_INSTANCES

export class Puppeteer {
  constructor(enforcer) {
    if (enforcer != singletonEnforcer) {
      throw new Error('Cannot construct singleton')
    }
    //count of instances
    console.info('Initializing renderer, count: ' + PUPPETEER_INSTANCES)
    this.instances = parseInt(PUPPETEER_INSTANCES)
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
      this[singleton] = new Puppeteer(singletonEnforcer)
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
      // Pushnutie browseru do this.browsers
      const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox']
      })
      this.browsers.push(browser)
    }
    await Promise.all(this.browsers)
  }

  getCounter() {
    if (this.counter >= this.instances) {
      this.counter = 0
    }
    return this.counter++ % this.instances
  }

  // Init template - otvorí sa stránka s templejtom
  async initTemplate(template, opts) {
    this.initialising = true
    let labelSettings = opts.data.Article.Label
    const templateName = template

    console.info(`Initializing template: ${templateName} - ${opts._phantomKey}`)

    const settings = {
      width: labelSettings.width,
      height: labelSettings.height
    }

    try {
      const phantomKey = `${opts._phantomKey}`

      // Kontrola, či máme otvorené stránky pre danú šablónu
      if (!this.templates[phantomKey]) {
        // Ak nie, inicializujte novú šablónu
        const browserIndex = this.getCounter()
        const browser = this.browsers[browserIndex]
        const temp = []
        const tempInUse = {}

        const filePath = `file:///${TEMPLATE_PATH}/${template}/index.html`
        for (let i = 0; i < 4; i++) {
          // Vytvorte 4 taby pre každú šablónu
          const page = await browser.newPage()
          await page.setViewport({ width: parseInt(settings.width), height: parseInt(settings.height) })
          await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36'
          )
          await page.goto(filePath, { waitUntil: 'load' })
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
        }

        this.templates[phantomKey] = temp
        this.templatesInUse[phantomKey] = tempInUse

        this.templatesConfig[templateName] = {
          width: labelSettings.width,
          height: labelSettings.height
        }
      }

      this.initialising = false
      console.log(this.templates)
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

  async renderBase64(p, phantomKey, opts) {
    console.log(this.templatesInUse)
    const count = this.getCounter()
    const t = await p.screenshot(opts)
    console.log(this.templatesInUse[phantomKey][count])

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

      console.log('>>>>', page)

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
