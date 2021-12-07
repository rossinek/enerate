# enerate

A simple tool to create boilerplate generator.

## Usage

```sh
npx enerate path/to/new-project --template examples/vue-project
```

## Template

The template consists of two parts: the `config.js` configuration file (optional) and the `template` folder which contains files which will become the base for new projects.

### Template files

Template files can contain special tags, which will be replaced during project creation by values entered by the user.

For example it may contain file `index.html`:

```html
<!DOCTYPE html>
<html>
  <head>
    <title><%= PROJECT_NAME %></title>
  </head>
  <body>
    <script src="<%= ENTRY_PATH %>"></script>
  </body>
</html>
```

It uses [mustache.js](https://github.com/janl/mustache.js) under the hood. I recommend reading the it's documentation for more info.

#### Template variables

Template variables may come from two sources:
- prompts (user input)
- context

See [Configuration file section](#config-file-configjs) for more details.

### Config file (`config.js`)

Configuration file, among other things, allows you to define what questions will be asked during project creation.

Example configuration file:

```js
// config.js
export default {
  prompts: [
    {
      type: 'text',
      name: 'PROJECT_NAME',
      message: 'Project name',
      initial: 'My project',
    },
    {
      type: 'select',
      name: 'LANGUAGE',
      message: 'Page language',
      choices: [
        { title: 'English', value: 'en' },
        { title: 'Polish', value: 'pl' },
      ],
      initial: 0
    }
  ]
}
```

Configuration file can export object or function (async functions are supported).

Example configuration file that exports function:

```js
// config.js
export default (context) => ({
  prompts: [
    {
      type: 'text',
      name: 'PROJECT_NAME',
      message: 'Project name',
      initial: context.output.split('/').slice(-1)[0],
    },
  ]
})
```

Configuration `context` object type:

```ts
type ConfigContext = {
  template: string; // template directory path
  output: string; // output directory path
}
```

#### `prompts?: prompts.PromptObject[]`

**Default**: `[]`

Provided questions will be asked while generating project. All answers will be accessible as variables in the template based on `name` attribute.
If `output` directory already exists user will be asked if it should be overwritten.

See [`prompts`](https://github.com/terkelg/prompts) for details.

#### `context?: Record<string, any>`

**Default**: `{}`

All properties of provided object will be accessible as variables in the template.

Example:

```js
// config.js
export default () => ({
  context: {
    TIMESTAMP: Date.now()
  },
  // ...
})

// template/index.js
export const appVersion = <%= TIMESTAMP %>
```

#### `renderFiles?: string | string[]`

**Default**: `['**/*.{html,json,vue,js,ts,jsx,tsx}', '**/.env', '**/.env.*']`

Glob or array of globs defining which files should be rendered. Unmatched files from `template` directory will be just copied without change.

#### `tags?: [string, string]`

**Default**: `['<%=', '%>']`

#### Lifecycle hooks

- `onBeforeCreate?: (renderContext: Record<string, any>) => void | Promise<void>`
- `onBeforeRender?: (renderContext: Record<string, any>) => void | Promise<void>`
- `onAfterCreate?: (renderContext: Record<string, any>) => void | Promise<void>`
