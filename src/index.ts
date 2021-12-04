import path from 'path'
import fse from 'fs-extra'
import glob from 'glob'
import Mustache from 'mustache'

const templateDir = 'examples/vue-project/template' // TODO: check if it exists and if its a directory
const outputDir = 'examples/vue-project/output' // TODO: check if it does NOT exists and if it does ask if should be overwritten (fse.remove)
const globsToRender = ['**/*.{html,json,vue}', '**/*.ts']

const asyncGlob = (pattern: Parameters<typeof glob>[0], options: Parameters<typeof glob>[1]) =>
  new Promise<string[]>((resolve, reject) => {
    glob(pattern, options, (err, files) => err ? reject(err) : resolve(files))
  })

const main = async () => {
  await fse.copy(templateDir, outputDir, {
    overwrite: false,
    errorOnExist: true,
  })

  const globOptions = { cwd: outputDir }
  const globsOutput = globsToRender.map(pattern => asyncGlob(pattern, globOptions))
  const filesArray = (await Promise.all(globsOutput)).flat()
    .filter((filePath, index, all) => all.indexOf(filePath) === index)

  const props = {
    AUTHOR_NAME: 'Artur',
    PROJECT_NAME: 'my-awesome-project-name',
  }

  await Promise.all(filesArray.map(async relativeFilePath => {
    const filePath = path.resolve(outputDir, relativeFilePath)
    const content = await fse.readFile(filePath)
    console.log(`> rendering: ${relativeFilePath}`)
    const rendered = Mustache.render(content.toString(), props, {}, ['<%=', '%>'])
    await fse.writeFile(filePath, rendered)
  }))
}

main()
