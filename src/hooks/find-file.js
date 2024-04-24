import path from 'path'

export const findFile = async (context, next) => {
  const { params, dirPath } = context
  const file = params.query.file
  const filePath = path.join(dirPath, file)

  context.filePath = filePath

  return next(context)
}
