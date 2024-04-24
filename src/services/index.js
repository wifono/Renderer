import { render } from './render/render.js'

import { projects } from './projects/projects.js'

import { template } from './template/template.js'

export const services = (app) => {
  app.configure(render)

  app.configure(projects)

  app.configure(template)

  // All services will be registered here
}
