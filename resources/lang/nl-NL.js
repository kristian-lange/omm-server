module.exports = {}

// Export all files as modules in the corresponding language folder
const ctx = require.context('./nl-NL', true, /\.js$/)
ctx.keys().forEach((fileName) => {
  const modName = fileName.replace(/^.+\/([^/]+)\.js/, '$1')
  module.exports[modName] = ctx(fileName).default
})
