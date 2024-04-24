import { initPuppeteer } from '../render/renderPuppeteer.js'
// import { initPhantom } from './renderPhantom.js'
// await initPhantom(process.env.PHANTOM_INSTANCES)
// await initPuppeteer(process.env.PUPPETEER_INSTANCES)

export class RenderService {
  constructor(options) {
    this.options = options
  }

  async find(_params) {
    return []
  }

  async get(id, _params) {
    return {
      id: 0,
      text: `A new message with ID: ${id}!`
    }
  }

  async create(data, params) {
    try {
      return data
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  // This method has to be added to the 'methods' option to make it available to clients
  async update(id, data, _params) {
    return {
      id: 0,
      ...data
    }
  }

  async patch(id, data, _params) {
    return {
      id: 0,
      text: `Fallback for ${id}`,
      ...data
    }
  }

  async remove(id, _params) {
    return {
      id: 0,
      text: 'removed'
    }
  }
}

export const getOptions = (app) => {
  return { app }
}
