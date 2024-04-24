import puppeteer from 'puppeteer'

const PAGE_TIMEOUT = Number(process.env.PAGE_TIMEOUT) || 30

const pages = []

let browser

export const initPuppeteer = async (pagesNum) => {
  if (pagesNum < 1) {
    return
  }
  console.log('puppeteer start')
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  })
  const promises = []
  for (let i = 0; i < pagesNum; i++) {
    promises.push(browser.newPage())
  }
  await Promise.all(promises)
  const bPages = await browser.pages()
  for (let i = 0; i < bPages.length; i++) {
    const id = `#P${String(i).padStart(3, '0')}`
    const page = bPages[i]
    page.on('console', (msg) => console.log(id, msg.text()))
    page.emulateMediaType('print')
    page.setDefaultTimeout(PAGE_TIMEOUT * 1000)
    pages.push({ id, page, busy: false })
    console.log(`${id} puppeteer instance started`)
  }
}

// array of promise resolve for waiting jobs
const waitJobs = []

async function getPage() {
  if (pages.length < 1) {
    throw Error('no instances')
  }
  const page = pages.find((p) => !p.busy)
  if (page) {
    page.busy = true
    return page
  }
  return new Promise((resolve) => {
    waitJobs.push(resolve)
  })
}

export const renderPuppeteer = async (opts) => {
  const millis = Date.now()
  const curPage = await getPage()
  const { id, page } = curPage
  const waitFree = (Date.now() - millis).toFixed(3)
  console.log(`${id} waitFree: ${waitFree}ms`)
  let res = '***'
  try {
    res = await renderPage(id, page, opts)
  } finally {
    releasePage(curPage)
  }
  return res
}

function releasePage(curPage) {
  if (waitJobs.length) {
    const resolve = waitJobs.shift()
    resolve(curPage)
  } else {
    curPage.busy = false
  }
}

async function renderPage(id, page, opts) {
  console.time(`${id} total`)
  console.time(`${id} goto`)

  await page.goto(opts.url, { waitUntil: 'load' })
  console.timeEnd(`${id} goto`)

  if (opts.data) {
    let article = opts.data.Article

    console.time(`${id} evaluate`)
    await page.evaluate(async (data) => await window.setPageData(data), article)

    console.timeEnd(`${id} evaluate`)
  }
  console.time(`${id} waitFor`)

  await page.waitForSelector('*')
  console.timeEnd(`${id} waitFor`)

  console.time(`${id} render`)
  let res = ''
  let width = 0
  let height = 0

  width = opts.data.Article.Label.width / 10
  height = opts.data.Article.Label.height / 10

  const options = { type: 'png' }
  if (typeof opts.settings.omitBackground === 'boolean') {
    options.omitBackground = true
  }
  if (typeof opts.settings.size === 'boolean') {
    options.clip = {
      x: 0,
      y: 0,
      width: width.toString(),
      height: height.toString()
    }
  } else {
    options.fullPage = true
  }

  res = await page.screenshot(options)

  console.timeEnd(`${id} render`)

  console.timeEnd(`${id} total`)
  return res
}
