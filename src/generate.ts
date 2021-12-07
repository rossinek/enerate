import path from 'path'
import fse from 'fs-extra'
import glob from 'glob'
import Mustache from 'mustache'
import prompts, { PromptObject } from 'prompts'

type GenerateConfig = {
  template: string;
  output: string;
  silent?: boolean;
}

type TemplateConfigContext = {
  template: string;
  output: string;
}

enum LifecycleHooks {
  OnBeforeCreate = 'onBeforeCreate',
  OnBeforeRender = 'onBeforeRender',
  OnAfterCreate = 'onAfterCreate',
}
type LifecycleHookHandler = (renderContext: Record<string, any>) => void | Promise<void>;

type TemplateConfig = {
  prompts?: PromptObject[];
  context?: Record<string, any>;
  renderFiles?: string | string[];
  tags?: [string, string];
  [LifecycleHooks.OnBeforeCreate]?: LifecycleHookHandler;
  [LifecycleHooks.OnBeforeRender]?: LifecycleHookHandler;
  [LifecycleHooks.OnAfterCreate]?: LifecycleHookHandler;
}

const defaultRenderFiles = ['**/*.{html,json,vue,js,ts,jsx,tsx}', '**/.env', '**/.env.*']
const confirmOutputOverwritePrompt: PromptObject = {
  type: 'confirm',
  name: '__overwriteOutput__',
  message: 'Output directory exists. Should I overwrite it?',
}

const asyncGlob = (pattern: Parameters<typeof glob>[0], options: Parameters<typeof glob>[1]) =>
  new Promise<string[]>((resolve, reject) => {
    glob(pattern, options, (err, files) => err ? reject(err) : resolve(files))
  })


export const generate = async (config: GenerateConfig): Promise<boolean> => {
  const cl = config.silent ? (() => {}) : console.log
  const templateMetaFile = path.resolve(config.template, 'config.js')
  const templateFiles = path.resolve(config.template, 'template')
  const templateMetaRaw = fse.existsSync(templateMetaFile) ? await import(templateMetaFile) : {}

  if (!fse.existsSync(templateFiles)) {
    throw new Error('No `template` directory')
  }

  const ctx: TemplateConfigContext = {
    template: config.template,
    output: config.output,
  }
  const templateMeta: TemplateConfig = typeof templateMetaRaw?.default === 'function'
    ? (await templateMetaRaw?.default(ctx))
    : templateMetaRaw?.default

  let promptsCanceled = false
  const isOutputExists = fse.existsSync(config.output)
  const answers = await prompts([
    ...(isOutputExists ? [confirmOutputOverwritePrompt] : []),
    ...(templateMeta.prompts || []),
  ], {
    onSubmit: (prompt, answer) => prompt.name === confirmOutputOverwritePrompt.name && !answer,
    onCancel: () => { promptsCanceled = true },
  })

  if (promptsCanceled || (isOutputExists && !answers[confirmOutputOverwritePrompt.name as string])) {
    cl('Canceled.')
    return false
  }

  if (isOutputExists) fse.removeSync(config.output)

  const renderContext = {
    ...answers,
    ...(templateMeta.context || {})
  }

  await templateMeta[LifecycleHooks.OnBeforeCreate]?.(renderContext)

  await fse.copy(templateFiles, config.output)

  const metaRenderFiles = [templateMeta.renderFiles].flat().filter(Boolean) as string[]
  const renderFiles = metaRenderFiles.length ? metaRenderFiles : defaultRenderFiles

  const globOptions = { cwd: config.output }
  const globsOutput = renderFiles.map(pattern => asyncGlob(pattern, globOptions))
  const filesArray = (await Promise.all(globsOutput)).flat()
    .filter((filePath, index, all) => all.indexOf(filePath) === index)

  const tags = templateMeta.tags || ['<%=', '%>']

  await templateMeta[LifecycleHooks.OnBeforeRender]?.(renderContext)

  await Promise.all(filesArray.map(async relativeFilePath => {
    const filePath = path.resolve(config.output, relativeFilePath)
    const content = await fse.readFile(filePath)
    cl(`> rendering: ${relativeFilePath}`)

    const rendered = Mustache.render(content.toString(), renderContext, {}, tags)
    await fse.writeFile(filePath, rendered)
  }))

  await templateMeta[LifecycleHooks.OnAfterCreate]?.(renderContext)

  cl('Done.')
  return true
}
