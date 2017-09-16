const path = require('path')

const MAX_CHANGES_TO_SHOW = 80
const EXTS_TO_SHOW = ['.css', '.html', 'js', '.json', '.jsx', '.md', '.scss', '.yml']

module.exports = {
  authenticateOptions: {
    type: 'oauth',
    token: process.env.GH_TOKEN,
  },
  owner: 'mmiller42',
  repo: 'html-webpack-externals-plugin',
  showDiff: ({ filename, changes }) => {
    const ext = path.extname(filename)
    return changes <= MAX_CHANGES_TO_SHOW && (!ext || EXTS_TO_SHOW.includes(ext))
  },
}
