import path from 'path'
import fse from 'fs-extra'
import glob from 'glob'
import Mustache from 'mustache'
import prompts from 'prompts'

// meta:
// - prompts
// - renderFiles (globs)
// - customTags
// TODO:
// - beforeRender
// - afterRender

type GenerateConfig = {
  template: string;
  output: string;
  silent?: boolean;
}

const defaultRenderFiles = ['**/*.{html,json,vue,js,ts,jsx,tsx}', '**/.env?()', '**/.env.*']

const asyncGlob = (pattern: Parameters<typeof glob>[0], options: Parameters<typeof glob>[1]) =>
  new Promise<string[]>((resolve, reject) => {
    glob(pattern, options, (err, files) => err ? reject(err) : resolve(files))
  })


export const generate = async (config: GenerateConfig): Promise<boolean> => {
  const cl = config.silent ? (() => {}) : console.log
  const templateMetaFile = path.resolve(config.template, 'index.js')
  const templateFiles = path.resolve(config.template, 'template')
  const templateMetaRaw = fse.existsSync(templateMetaFile) ? await import(templateMetaFile) : {}

  if (!fse.existsSync(templateFiles)) {
    throw new Error('No `template` directory')
  }

  const ctx = {
    template: config.template,
    output: config.output,
  }
  const templateMeta = typeof templateMetaRaw?.default === 'function' ? templateMetaRaw?.default(ctx) : templateMetaRaw?.default

  let promptsCanceled = false
  const isOutputExists = fse.existsSync(config.output)
  const answers = await prompts([
    ...(isOutputExists ? [{
      type: 'confirm',
      name: '__overwriteOutput__',
      message: 'Output directory exists. Should I overwrite it?',
    }] : []),
    ...(templateMeta.prompts || []),
  ], {
    onSubmit: (prompt, answer) => prompt.name === '__overwriteOutput__' && !answer,
    onCancel: () => { promptsCanceled = true },
  })

  if (promptsCanceled || (isOutputExists && !answers.__overwriteOutput__)) {
    cl('Canceled.')
    return false
  }

  if (isOutputExists) fse.removeSync(config.output)
  await fse.copy(templateFiles, config.output)

  const metaRenderFiles = [templateMeta.renderFiles].flat().filter(Boolean) as string[]
  const renderFiles = metaRenderFiles.length ? metaRenderFiles : defaultRenderFiles

  const globOptions = { cwd: config.output }
  const globsOutput = renderFiles.map(pattern => asyncGlob(pattern, globOptions))
  const filesArray = (await Promise.all(globsOutput)).flat()
    .filter((filePath, index, all) => all.indexOf(filePath) === index)

  const customTags = templateMeta.customTags || ['<%=', '%>']

  await Promise.all(filesArray.map(async relativeFilePath => {
    const filePath = path.resolve(config.output, relativeFilePath)
    const content = await fse.readFile(filePath)
    cl(`> rendering: ${relativeFilePath}`)

    const rendered = Mustache.render(content.toString(), answers, {}, customTags)
    await fse.writeFile(filePath, rendered)
  }))

  cl('Done.')
  return true
}
