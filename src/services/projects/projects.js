import { hooks as schemaHooks } from '@feathersjs/schema'
import {
  projectsDataValidator,
  projectsPatchValidator,
  projectsQueryValidator,
  projectsResolver,
  projectsExternalResolver,
  projectsDataResolver,
  projectsPatchResolver,
  projectsQueryResolver
} from './projects.schema.js'
import { ProjectsService, getOptions } from './projects.class.js'

export const projectsPath = 'projects'
export const projectsMethods = ['find', 'create', 'get', 'update', 'remove']

export * from './projects.class.js'
export * from './projects.schema.js'

export const projects = (app) => {
  app.use(projectsPath, new ProjectsService(getOptions(app)), {
    methods: projectsMethods
  })
  app.service(projectsPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(projectsExternalResolver),
        schemaHooks.resolveResult(projectsResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(projectsQueryValidator),
        schemaHooks.resolveQuery(projectsQueryResolver)
      ],

      create: [
        schemaHooks.validateData(projectsDataValidator),
        schemaHooks.resolveData(projectsDataResolver)
      ],
      patch: [
        schemaHooks.validateData(projectsPatchValidator),
        schemaHooks.resolveData(projectsPatchResolver)
      ]
    }
  })

  // Create project
  app.post('/projects/create/:project', async (req, res, next) => {
    try {
      const result = await app.service('/projects').create(req.params)
      res.json(result)
    } catch (error) {
      next(error)
    }
  })

  // Delete
  app.delete('/projects/delete/:project', async (req, res, next) => {
    try {
      const result = await app.service('/projects').remove(req.params.project)
      res.json(result)
    } catch (error) {
      next(error)
    }
  })

  // RENAME - /projects/Sample/folder?name=folderrr --- /projects/project?name=name
  // COPY - /projects/Sample/folder?name=folder&copy=true --- /projects/project?name=name&copy=true
  app.put('/projects/update/:project', async (req, res, next) => {
    try {
      const result = await app.service('/projects').update(req)
      res.json(result)
    } catch (error) {
      console.error(error)
      return res.status(500).send(error)
    }
  })
}
