import puppeteer from 'puppeteer'
import amount from 'physical-cpu-count'
import fs from 'fs'

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
    console.info('Initializing renderer, count: ' + PUPPETEER_INSTANCES)
    this.instances = parseInt(PUPPETEER_INSTANCES)
    if (this.instances > physicalCpuCount * 2) {
      console.info('Physical CPU count low, setting new renderer count: ' + physicalCpuCount)
      this.instances = physicalCpuCount * 2
    }
    this.initialising = true

    this.counter = 0
    this.templates = {}
    this.templatesConfig = {}
    this.templatesInUse = {}
    this.browsers = []
    this.templateSources = []
    this.url = ''
    this.templateStats = {}
    this.initialPages = 2
    // this.sameTemplatePages = 20
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

  async init() {
    console.info('Renderer instances start')
    for (let i = 1; i <= this.instances; i++) {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
      })

      this.browsers.push(browser)
      await this.initAllTemplates(browser) // Inicializácia šablón pre každý prehliadač
    }
  }

  getCounter() {
    if (this.counter >= this.instances) {
      this.counter = 0
    }
    return this.counter++ % this.instances
  }

  async initAllTemplates(browser) {
    try {
      const templateDirs = fs.readdirSync(TEMPLATE_PATH)

      for (let i = 0; i < templateDirs.length; i++) {
        const template = templateDirs[i]
        const browserIndex = i % this.instances
        const browserName = templateDirs[i]

        const filePath = `file:///${TEMPLATE_PATH}/${template}/index.html`

        const page = await browser.newPage()
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36'
        )
        await page.goto(filePath, { waitUntil: 'load' })
        await this.sleep(5)
        await page.evaluate(function () {
          var style = document.createElement('style')
          var text = document.createTextNode(
            'body { background-color: #FFFFFF; !important; -webkit-font-smoothing: none !important; }'
          )
          style.setAttribute('type', 'text/css')
          style.appendChild(text)
          document.head.insertBefore(style, document.head.firstChild)
        })

        this.templateSources.push({ browser, page, prior: browserName })
        console.info(`Initializing template: ${template}`)
      }
    } catch (error) {
      console.error('Error during initialising templates.', error)
      throw error
    }
  }

  async initTemplate(template, opts) {
    this.initialising = true
    let labelSettings = opts.data.Article.Label
    const templateName = template

    const settings = {
      width: labelSettings.width,
      height: labelSettings.height
    }

    try {
      const phantomKey = `${opts._phantomKey}`
      const temp = []
      const tempInUse = {}

      const templatePages = this.templateSources
        .filter((source) => source.prior === template)
        .map((source) => source.page)

      for (let i = 0; i < templatePages.length; i++) {
        const page = templatePages[i % templatePages.length]

        await page.setViewport({
          width: parseInt(settings.width),
          height: parseInt(settings.height)
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

      await this.sleep(50)
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
      await this.sleep(200)
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
    const count = this.getCounter()
    await this.sleep(2)
    const t = await p.screenshot(opts)
    this.templatesInUse[phantomKey][count] = false
    return t
  }

  async renderImage(data, opts) {
    try {
      const template = data['@template'].replace(/\.[^.]+$/, '')
      opts['_phantomKey'] =
        template + '_' + opts.data.Article.Label.width + '_' + opts.data.Article.Label.height
      const phantomKey = opts._phantomKey
      const page = await this.getTemplate(template, opts)

      const eData = data.Article
      await this.sleep(5)
      await page.evaluate(function (arg) {
        setPageData(arg)
      }, eData)

      const image = await this.renderBase64(page, phantomKey)
      return Buffer.from(image, 'base64')
    } catch (error) {
      console.error('Error rendering image:', error)
      throw error
    }
  }
}
