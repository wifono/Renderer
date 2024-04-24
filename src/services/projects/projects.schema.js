// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve, getValidator, querySyntax } from '@feathersjs/schema'
import { dataValidator, queryValidator } from '../../validators.js'

// Main data model schema
export const projectsSchema = {
  $id: 'Projects',
  type: 'object',
  additionalProperties: false,
  required: ['project'],
  properties: {
    project: { type: 'string' },
    file: { type: 'string' },
    name: { type: 'string' }
  }
}
export const projectsValidator = getValidator(projectsSchema, dataValidator)
export const projectsResolver = resolve({})

export const projectsExternalResolver = resolve({})

// Schema for creating new data
export const projectsDataSchema = {
  $id: 'ProjectsData',
  type: 'object',
  additionalProperties: false,
  required: ['project'],
  properties: {
    ...projectsSchema.properties
  }
}
export const projectsDataValidator = getValidator(projectsDataSchema, dataValidator)
export const projectsDataResolver = resolve({})

// Schema for updating existing data
export const projectsPatchSchema = {
  $id: 'ProjectsPatch',
  type: 'object',
  additionalProperties: false,
  required: ['project'],
  properties: {
    ...projectsSchema.properties
  }
}
export const projectsPatchValidator = getValidator(projectsPatchSchema, dataValidator)
export const projectsPatchResolver = resolve({})

// Schema for allowed query properties
export const projectsQuerySchema = {
  $id: 'ProjectsQuery',
  type: 'object',
  additionalProperties: false,
  properties: {
    ...querySyntax(projectsSchema.properties)
  }
}
export const projectsQueryValidator = getValidator(projectsQuerySchema, queryValidator)
export const projectsQueryResolver = resolve({})
