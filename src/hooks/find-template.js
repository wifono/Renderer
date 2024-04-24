import fs from 'fs'
import path from 'path'
import 'dotenv/config'

const TEMPLATE_PATH = process.env.TEMPLATE_PATH

export const findTemplate = async (context, next) => {
  const { params } = context
  const template = params.query

  const dirPath = path.join(TEMPLATE_PATH, template.template)
  if (fs.existsSync(dirPath)) {
    context.dirPath = dirPath
  } else {
    console.info('Template not found')
  }

  return next(context)
}
