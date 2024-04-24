import path from 'path'
import fs from 'fs'
import phantom from 'phantom'
import amount from 'physical-cpu-count'
import { cloneDeep } from 'clone-deep-circular-references'

const singleton = Symbol()
const singletonEnforcer = Symbol()
const physicalCpuCount = amount

const bat = new Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDozODQ3NDRFRTVCQUJFQzExOERDNURGRjU3NDgwNTlENiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpGMzNCNkJGMEFCNkExMUVDOUVCNEIyODM3NTVGQjM5MSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpGMzNCNkJFRkFCNkExMUVDOUVCNEIyODM3NTVGQjM5MSIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChXaW5kb3dzKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjM4NDc0NEVFNUJBQkVDMTE4REM1REZGNTc0ODA1OUQ2IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjM4NDc0NEVFNUJBQkVDMTE4REM1REZGNTc0ODA1OUQ2Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+zthmuAAAAOJJREFUeNrM10sOgCAMBFAw3v/KKCYaTStQ6Ge6IREWzymLklNKJQHXjowrpeSMmmDF1ZUAzw1yOF//4Y+rtaEm17yD78S4RL1wD7CHeO9btZvDwbT4D0dazKVzf7NqdQsXnmAPFwocwYUBR3EhQAnOHSjFuQJncG7AWZwLcAVnDlzFmQI1cGZALRw7bq0OrJo49QS1capAC5wa0ArH3kHpxGyJI0DpUGqNW2qxB459FyPhpoCeODHQGycCRuCGgVG4IWAkrguMxjWBCLhfIAqOBSLhCBAN9wEi4h4gKq7WIcAAyIGZ8bdXASsAAAAASUVORK5CYII=',
  'base64'
)
const linv = new Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDozODQ3NDRFRTVCQUJFQzExOERDNURGRjU3NDgwNTlENiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDoxRjRCNTgwQUNCQTUxMUVDODNGMDgzOTA3NzFCQjAyNCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoxRjRCNTgwOUNCQTUxMUVDODNGMDgzOTA3NzFCQjAyNCIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChXaW5kb3dzKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjY5QTQ0RDVGNUJDNUVDMTFBRTRGQzRBQzE0MzAzOUMxIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjM4NDc0NEVFNUJBQkVDMTE4REM1REZGNTc0ODA1OUQ2Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+vOGx0QAAAN1JREFUeNrM1tEOgyAMQNG2///PDpdscQ4QpaXXBxNR44kKuSoiW9lUoJvtO1Xd0EAy0o4HRKSdB2hIqw2SkFZmsJCR7zdIRn4/MRX58w8SkX+ThIaszmIS0lonKEgrDxQy8hMLWOQxFpDIcyzgkLVYQCFbsYBBNpcZCtJ6JwlIu7ogG9nsQQqy24ME5GUPZiOHejATOdyDWchbPZiBvN2Dq5GPenAl8nEPrkJO9eAK5HQPRiNdejAS6daDUUjXHoxAuvegNzKkBz2RNrIWZSL3O4dX9R6mh5i5/yXAAJn1x20JQ+ccAAAAAElFTkSuQmCC',
  'base64'
)

const PHANTOM_INSTANCES = 4
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
    this.badBatteries = []
    this.lightInventoryStores = []
    this.templateStats = {}
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async init() {
    console.info('Renderer instances start')
    for (var i = 1; i <= this.instances; i++) {
      this.browsers.push(
        await phantom.create(['--local-url-access=true', '--disk-cache=true', '--max-disk-cache-size=10000'])
      )
    }
    await Promise.all(this.browsers)
  }

  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new Renderer(singletonEnforcer)
    }
    return this[singleton]
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
    console.info(`Initializing template, attempt ${attempt}: ${templateName}`)

    let temp = []
    let tempInUse = {}

    const settings = {
      top: 0,
      left: 0,
      width: 400,
      height: 300
    }

    try {
      const phantomKey = `${templateName}`
      for (let i = 0; i < this.instances; i++) {
        const page = await this.browsers[i].createPage()

        const filePath = `file:///${TEMPLATE_PATH}/${template}/index.html`
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
            'body { background-color: #FFFFFF; -webkit-font-smoothing: none !important; width: 400px !important; height: 400px !important; }'
          )
          style.setAttribute('type', 'text/css')
          style.appendChild(text)
          document.head.insertBefore(style, document.head.firstChild)
        })

        page.on('onResourceRequested', function (requestData) {
          console.log('Resource requested:', requestData.url)
        })

        page.on('onResourceReceived', function (response) {
          if (response.stage === 'end') {
            console.log('Resource received:', response.url)
          }
        })

        temp.push(page)
        tempInUse[phantomKey] = false
      }

      this.templates[phantomKey] = temp
      this.templatesInUse[phantomKey] = tempInUse
      console.log('.>>>>', this.templatesInUse)

      this.templatesConfig[templateName] = {
        rotation: 0,
        width: 400,
        height: 300
      }

      //   await this.sleep(100)
      this.initialising = false
      console.log(this.templates)
      return this.templates
    } catch (error) {
      console.error('Error initializing template:', error)
      this.initialising = false
      throw error
    }
  }

  async getTemplate(template) {
    if (this.initialising) {
      await this.sleep(500)
      this.initialising = false
      return this.initTemplate(template)
    }

    const c = this.getCounter()

    if (this.templatesInUse[template][template] === false) {
      this.templatesInUse[template][template] = true
      return this.templates
    }

    await this.sleep(this.getRandomInt(1, 10))
    return this.initTemplate(template)
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async renderBase64(p, o) {
    await this.sleep(500)
    await this.sleep(2)
    let t = await p.renderBase64('PNG')

    this.templatesInUse[o['@template'].replace(/\.[^.]+$/, '')][0] = false

    return t
  }

  async renderImage(data) {
    try {
      const template = data['@template'].replace(/\.[^.]+$/, '')
      let page = await this.getTemplate(template)

      //   await this.sleep(500)

      //   const eData = data.Article
      //   await Promise.resolve(page[template][0]).then(async (r) => {
      //     page[template][0] = r
      //     await Promise.resolve(
      //       page[template][0].evaluate(function (arg) {
      //         return setPageData(arg)
      //       }, eData)
      //     ).then(() => {})
      //   })

      //   console.log('Evaluation completed')

      //   const image = await this.renderBase64(page[template][0], data)
      //   return image
    } catch (error) {
      console.error('Error rendering image:', error)
      throw error
    }
  }
}
