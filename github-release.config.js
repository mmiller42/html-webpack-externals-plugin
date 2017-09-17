const path = require('path')

const MAX_LINES_TO_SHOW = 80
const EXTS_TO_SHOW = ['.css', '.html', 'js', '.json', '.jsx', '.md', '.scss', '.yml']

module.exports = {
  authenticateOptions: {
    type: 'oauth',
    token: process.env.GH_TOKEN,
  },
  owner: 'mmiller42',
  repo: 'html-webpack-externals-plugin',
  showDiff: ({ filename, lines }) => {
    const ext = path.extname(filename)
    return lines && lines <= MAX_LINES_TO_SHOW && (!ext || EXTS_TO_SHOW.includes(ext))
  },
}
