import fs from 'fs'
import path from 'path'

const TEMPLATE_PATH = process.env.TEMPLATE_PATH

export class TemplateService {
  constructor(options) {
    this.options = options
  }
  async create(data, _params) {
    try {
      let fileResults

      if (Array.isArray(data)) {
        fileResults = data.map((file) => ({
          message: `Uploaded file: ${file.path}`
        }))
      } else {
        fileResults = {
          message: `Uploaded file: ${data.path}`
        }
      }

      return fileResults
    } catch (error) {
      console.error('Chyba pri nahrávaní súborov:', error)
      throw new Error('Nepodarilo sa nahrať súbor(y)')
    }
  }

  async find(_params) {
    return []
  }

  async get(id, _params) {
    return {
      id: 0,
      message: `A new message with ID: ${id}!`
    }
  }

  async update(req, data, _params) {
    try {
      const newName = req.query.name

      const sourcePath = path.join(TEMPLATE_PATH, req.params.template, req.params.file)
      let targetPath = path.join(TEMPLATE_PATH, req.params.template, newName)
      if (req.query.copy === 'true') {
        let counter = 1
        while (fs.existsSync(targetPath)) {
          const ext = path.extname(newName)
          const fileName = path.basename(newName, ext)
          const newFileName = `${fileName}_${counter}${ext}`
          targetPath = path.join(TEMPLATE_PATH, req.params.template, newFileName)
          counter++
        }
        fs.copyFileSync(sourcePath, targetPath)
        return { status: 'File copied' }
      } else {
        fs.renameSync(sourcePath, targetPath)
        return { status: 'File renamed' }
      }
    } catch (error) {
      console.error(error)
    }
  }

  async patch(data, _params) {
    return {
      ...data
    }
  }

  async remove(data, _params) {
    try {
      fs.unlinkSync(data)
      return {
        status: 200,
        message: `File deleted from template ${data}`
      }
    } catch (error) {
      return { status: 404, message: 'File not found.', path: data }
    }
  }
}

export const getOptions = (app) => {
  return { app }
}
