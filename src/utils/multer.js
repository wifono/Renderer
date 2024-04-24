import multer from 'multer'
import path from 'path'
import fs from 'fs'

const TEMPLATE_PATH = process.env.TEMPLATE_PATH

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const templateFolder = req.params.template
    const uploadPath = path.join(TEMPLATE_PATH, templateFolder)
    fs.mkdirSync(uploadPath, { recursive: true })
    cb(null, uploadPath)
  },
  filename: function (req, file, cb) {
    let filename = file.originalname

    if (req.params.file === 'file' || !req.params.file) {
      filename = file.originalname
    } else {
      const extname = path.extname(file.originalname)
      filename = req.params.file + extname
    }

    cb(null, filename)
  }
})

export const upload = multer({ storage: storage })
