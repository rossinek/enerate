import minimist from 'minimist'
import { generate } from './generate.js'

const argv = minimist(process.argv.slice(2), { string: ['_'] })
const output = argv._[0]
if (!output) throw new Error('Give your project a home and specify output directory.')

const template = argv.template || argv.t
if (!template) throw new Error('Where is the template? Use -t or --template flag to tell me.')

generate({
  output,
  template,
})
