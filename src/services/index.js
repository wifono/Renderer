import { render } from './render/render.js'

export const services = (app) => {
  app.configure(render)

  // All services will be registered here
}
