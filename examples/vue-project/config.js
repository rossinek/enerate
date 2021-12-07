const toSlug = str => str.toLowerCase().replace(/[^a-z0-9_]+/g, '-')

export default ({ output }) => ({
  context: {
    TIMESTAMP: Date.now()
  },
  prompts: [
    {
      type: 'text',
      name: 'PROJECT_ID',
      message: 'Project id',
      validate: (value) => /[a-z0-9_-]*/.test(value) ? true : 'Use only lowercase letters, digits and hyphens.',
      initial: toSlug(output.split('/').slice(-1)[0]),
    },
    {
      type: 'text',
      name: 'AUTHOR_NAME',
      message: 'Your name',
      initial: 'Author',
    },
  ]
})
