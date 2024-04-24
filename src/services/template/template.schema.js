// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve, getValidator, querySyntax } from '@feathersjs/schema'
import { dataValidator, queryValidator } from '../../validators.js'

// Main data model schema
export const templateSchema = {
  $id: 'Template',
  type: 'object',
  additionalProperties: true,
  required: [],
  properties: {
    template: { type: 'string' },
    file: { type: 'string' }
  }
}
export const templateValidator = getValidator(templateSchema, dataValidator)
export const templateResolver = resolve({})

export const templateExternalResolver = resolve({})

// Schema for creating new data
export const templateDataSchema = {
  $id: 'TemplateData',
  type: 'object',
  additionalProperties: true,
  required: [],
  properties: {
    ...templateSchema.properties
  }
}
export const templateDataValidator = getValidator(templateDataSchema, dataValidator)
export const templateDataResolver = resolve({})

// Schema for updating existing data
export const templatePatchSchema = {
  $id: 'TemplatePatch',
  type: 'object',
  additionalProperties: false,
  required: [],
  properties: {
    ...templateSchema.properties
  }
}
export const templatePatchValidator = getValidator(templatePatchSchema, dataValidator)
export const templatePatchResolver = resolve({})

// Schema for allowed query properties
export const templateQuerySchema = {
  $id: 'TemplateQuery',
  type: 'object',
  additionalProperties: false,
  properties: {
    ...querySyntax(templateSchema.properties)
  }
}
export const templateQueryValidator = getValidator(templateQuerySchema, queryValidator)
export const templateQueryResolver = resolve({})
