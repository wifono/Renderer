import path from 'path'
import fs from 'fs'

const TEMPLATE_PATH = process.env.TEMPLATE_PATH
export class ProjectsService {
  constructor(options) {
    this.options = options
  }

  // Get projects
  async find(_params) {
    try {
      if (fs.existsSync(TEMPLATE_PATH)) {
        const dirList = fs.readdirSync(TEMPLATE_PATH)
        return { projects: dirList }
      } else {
        return { status: 404 }
      }
    } catch (error) {
      return { status: 400 }
    }
  }

  async get(req) {
    try {
      if (fs.existsSync(TEMPLATE_PATH, req)) {
        const dirList = fs.readdirSync(path.join(TEMPLATE_PATH, req))
        return { dirList }
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Create project
  async create(data) {
    try {
      fs.mkdirSync(path.join(TEMPLATE_PATH, data.project))
      return { status: 200 }
    } catch (error) {
      console.error('Chyba pri vytváraní projektu:', error)
      throw new Error('Nepodarilo sa vytvoriť projekt!')
    }
  }

  // Rename/Copy project
  async update(req, data, _params) {
    try {
      const project = req.params.project
      const sourcePath = path.join(TEMPLATE_PATH, project)
      let targetPath = path.join(TEMPLATE_PATH, req.query.name)

      if (req.query.copy === 'true') {
        let counter = 1
        while (fs.existsSync(targetPath)) {
          const newProject = req.query.name
          const newFileName = `${newProject}_${counter}`
          targetPath = path.join(TEMPLATE_PATH, newFileName)
          counter++
        }
        fs.cpSync(sourcePath, targetPath, { recursive: true })
        return { status: 'File copied' }
      } else {
        fs.renameSync(sourcePath, targetPath)
        return { status: 'File renamed' }
      }
    } catch (error) {
      console.error(error)
      return { status: 400 }
    }
  }

  // Delete project
  async remove(data, _params) {
    try {
      const projectPath = path.join(TEMPLATE_PATH, data)
      fs.rmdirSync(projectPath)
      return {
        status: 200,
        message: `Project deleted: ${projectPath}`
      }
    } catch (error) {
      return { status: 404, message: 'Project not found.', data: data }
    }
  }
}

export const getOptions = (app) => {
  return { app }
}
