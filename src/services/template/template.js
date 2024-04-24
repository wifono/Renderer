import { hooks as schemaHooks } from '@feathersjs/schema'
import {
  templateDataValidator,
  templatePatchValidator,
  templateQueryValidator,
  templateResolver,
  templateExternalResolver,
  templateDataResolver,
  templatePatchResolver,
  templateQueryResolver
} from './template.schema.js'
import { TemplateService, getOptions } from './template.class.js'

export const templatePath = 'template'
export const templateMethods = ['find', 'get', 'create', 'patch', 'update', 'remove']

export * from './template.class.js'
export * from './template.schema.js'

import { upload } from '../../utils/multer.js'
import path from 'path'

const TEMPLATE_PATH = process.env.TEMPLATE_PATH

export const template = (app) => {
  app.use(templatePath, new TemplateService(getOptions(app)), {
    methods: templateMethods
  })
  app.service(templatePath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(templateExternalResolver),
        schemaHooks.resolveResult(templateResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(templateQueryValidator),
        schemaHooks.resolveQuery(templateQueryResolver)
      ],
      create: [
        schemaHooks.validateData(templateDataValidator),
        schemaHooks.resolveData(templateDataResolver)
      ],
      patch: [
        schemaHooks.validateData(templatePatchValidator),
        schemaHooks.resolveData(templatePatchResolver)
      ]
    }
  })
  // Single upload
  app.post('/template/:template/:file', upload.single('file'), async (req, res, next) => {
    try {
      const result = await app.service('/template').create(req.file, req.body)
      res.json(result)
    } catch (error) {
      next(error)
    }
  })
  // Multi Upload
  app.post('/template/:template/', upload.any(), async (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.')
    }
    try {
      const result = await app.service('/template').create(req.files, req.body)
      res.json(result)
    } catch (error) {
      next(error)
    }
  })

  // Delete
  app.delete('/template/:template/:file', async (req, res, next) => {
    try {
      const templatePath = path.join(TEMPLATE_PATH, req.params.template, req.params.file)
      const result = await app.service('/template').remove(templatePath)
      res.json(result)
    } catch (error) {
      next(error)
    }
  })

  /*
   * RENAME - /templates/Sample/blue.jpg?name=bluuue.jpg --- /templates/template/file?name=name
   * COPY - /templates/Sample/file.txt?name=file.txt&copy=true --- /templates/template/file?name=name&copy=true
   */
  app.put('/template/:template/:file', async (req, res, next) => {
    try {
      const result = await app.service('/template').update(req)
      res.json(result)
    } catch (err) {
      console.error(err)
      return res.status(500).send(err)
    }
  })
}
