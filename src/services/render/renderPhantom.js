import phantom from 'phantom'
import amount from 'physical-cpu-count'
import { cloneDeep } from 'clone-deep-circular-references'

const singleton = Symbol()
const singletonEnforcer = Symbol()
const physicalCpuCount = amount

const PHANTOM_INSTANCES = 2
const TEMPLATE_PATH = process.env.TEMPLATE_PATH

export class Renderer {
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
      this[singleton] = new Renderer(singletonEnforcer)
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

  async initTemplate(template, attempt = 1) {
    this.initialising = true
    const templateName = template
    console.info('Initializing template, attempt ' + attempt + ': ' + templateName)

    const settings = {
      top: 0,
      left: 0,
      width: 400,
      height: 300
    }

    try {
      const phantomKey = template.toString()
      const temp = []
      const tempInUse = {}

      const pagePromises = []
      for (let i = 0; i < this.instances; i++) {
        const filePath = 'file:///' + TEMPLATE_PATH + '/' + template + '/index.html'
        const pagePromise = this.browsers[i].createPage().then(function (page) {
          return page
            .property('clipRect', settings)
            .then(() =>
              page.property(
                'userAgent',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36'
              )
            )
            .then(() => page.property('dpi', '150'))
            .then(() => page.open(filePath))
            .then(() =>
              page.evaluate(function () {
                var style = document.createElement('style')
                var text = document.createTextNode(
                  'body { background-color: #FFFFFF; -webkit-font-smoothing: none !important; width: 400px !important; height: 400px !important; }'
                )
                style.setAttribute('type', 'text/css')
                style.appendChild(text)
                document.head.insertBefore(style, document.head.firstChild)
              })
            )
            .then(() => {
              temp.push(cloneDeep(page))
              tempInUse[i] = false
            })
        })
        pagePromises.push(pagePromise)
      }

      await Promise.all(pagePromises)

      this.templates[phantomKey] = temp
      this.templatesInUse[phantomKey] = tempInUse

      this.templatesConfig[templateName] = {
        rotation: 0,
        width: 400,
        height: 300
      }

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

  async getTemplate(template) {
    if (this.initialising) {
      await this.sleep(500)
      this.initialising = false
    }

    const count = this.getCounter()
    if (this.templates[template] === undefined) {
      await this.initTemplate(template)
    }

    if (this.templatesInUse[template][count] === false) {
      this.templatesInUse[template][count] = true
    }

    return this.templates
  }

  async renderBase64(p, template) {
    const count = this.getCounter()
    const t = await p.renderBase64('PNG')
    this.templatesInUse[template][count] = false
    return t
  }

  async renderImage(data) {
    try {
      const template = data['@template'].replace(/\.[^.]+$/, '')
      const page = await this.getTemplate(template)

      const eData = data.Article

      // Evaluate page data without unnecessary promise chaining
      await page[template][0].evaluate(function (arg) {
        setPageData(arg)
      }, eData)

      console.log('Evaluation completed')

      // Render image directly without waiting for unnecessary Promise.resolve
      const image = await this.renderBase64(page[template][0], template)
      return Buffer.from(image, 'base64')
    } catch (error) {
      console.error('Error rendering image:', error)
      throw error
    }
  }
}
