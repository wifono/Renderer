// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve, getValidator, querySyntax } from '@feathersjs/schema'
import { dataValidator, queryValidator } from '../../validators.js'

// Main data model schema
export const renderSchema = {
  $id: 'Render',
  type: 'object',
  additionalProperties: true,
  required: [],
  properties: {}
}
export const renderValidator = getValidator(renderSchema, dataValidator)
export const renderResolver = resolve({})

export const renderExternalResolver = resolve({})

// Schema for creating new data
export const renderDataSchema = {
  $id: 'RenderData',
  type: 'object',
  additionalProperties: true,
  required: [],
  properties: {
    ...renderSchema.properties
  }
}
export const renderDataValidator = getValidator(renderDataSchema, dataValidator)
export const renderDataResolver = resolve({})

// Schema for updating existing data
export const renderPatchSchema = {
  $id: 'RenderPatch',
  type: 'object',
  additionalProperties: true,
  required: [],
  properties: {
    ...renderSchema.properties
  }
}
export const renderPatchValidator = getValidator(renderPatchSchema, dataValidator)
export const renderPatchResolver = resolve({})

// Schema for allowed query properties
export const renderQuerySchema = {
  $id: 'RenderQuery',
  type: 'object',
  additionalProperties: true,
  properties: {
    ...querySyntax(renderSchema.properties)
  }
}
export const renderQueryValidator = getValidator(renderQuerySchema, queryValidator)
export const renderQueryResolver = resolve({})
