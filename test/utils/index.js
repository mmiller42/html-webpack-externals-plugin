import path from 'path'
import fs from 'fs'
import assert from 'assert'
import webpack from 'webpack'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import escapeRegExp from 'escape-string-regexp'
import rimraf from 'rimraf'

const OUTPUT_PATH = path.resolve(__dirname, '..', 'tmp')

export function cleanUp() {
  return promisify(rimraf, OUTPUT_PATH)
}

export function runWebpack(...plugins) {
  const config = {
    entry: {
      app: path.resolve(__dirname, '..', 'fixtures', 'app.js'),
      style: path.resolve(__dirname, '..', 'fixtures', 'style.css'),
    },
    output: {
      path: OUTPUT_PATH,
      filename: '[name].js',
    },
    module: {
      loaders: [
        {
          test: /\.css$/,
          loader: ExtractTextPlugin.extract({ use: 'css-loader' }),
        },
      ],
    },
    plugins: [new ExtractTextPlugin({ filename: '[name].css' }), ...plugins],
  }

  return promisify(webpack, config).then(stats => {
    assert.strictEqual(
      stats.hasErrors(),
      false,
      stats.toJson().errors.toString()
    )
    return { stats, config }
  })
}

export function checkBundleExcludes(external) {
  return promisify(
    fs.readFile,
    path.join(OUTPUT_PATH, 'app.js'),
    'utf8'
  ).then(contents => {
    assert.ok(
      contents.indexOf(`module.exports = ${external}`) > -1,
      `${external} was not excluded from the bundle`
    )
  })
}

export function checkCopied(file) {
  return promisify(fs.access, path.join(OUTPUT_PATH, file))
}

export function checkConfigExternals(config, externals) {
  assert.ok(Array.isArray(config.externals), 'webpackConfig.externals is not an array');

  externals.forEach(({ module, global }) => {
    if (global) {
      const expected = { [module]: global }
      assert.deepEqual(
        config.externals.find(external => external[module]),
        expected,
        `webpackConfig.externals did not contain ${JSON.stringify(expected)}`
      )
    } else {
      assert.ok(
        config.externals.indexOf(module) > -1,
        `webpackConfig.externals did not contain ${module}`
      )
    }
  })
}

export function checkHtmlIncludes(
  file,
  type,
  append = false,
  htmlFile = 'index.html',
  additionalContent = null
) {
  return promisify(
    fs.readFile,
    path.join(OUTPUT_PATH, htmlFile),
    'utf8'
  ).then(contents => {
    if (type === 'js') {
      assert.ok(
        contents.match(new RegExp(`<script type="text/javascript" src="${escapeRegExp(file)}".*></script>`)),
        `${file} script was not inserted into the HTML output`
      )
    } else if (type === 'css') {
      assert.ok(
        contents.match(new RegExp(`<link href="${escapeRegExp(file)}" rel="stylesheet".*>`)),
        `${file} link was not inserted into the HTML output`
      )
    }

    assert.ok(
      inequal(
        append ? '<' : '>',
        contents.indexOf(type === 'js' ? 'app.js' : 'style.css'),
        contents.indexOf(file)
      ),
      `${file} should have been inserted ${append
        ? 'after'
        : 'before'} the bundle`
    )

    if (additionalContent) {
      if (type === 'js') {
        assert.ok(
          contents.match(new RegExp(`<script type="text/javascript" src="${escapeRegExp(file)}" ${escapeRegExp(additionalContent)}></script>`)),
          `${file} script did not include attributes ${additionalContent}`
        )
      } else if (type === 'css') {
        assert.ok(
          contents.match(new RegExp(`<link href="${escapeRegExp(file)}" rel="stylesheet" ${escapeRegExp(additionalContent)}>`)),
          `${file} link did not include attributes ${additionalContent}`
        )
      }
    }
  })
}

export function promisify(fn, ...args) {
  return new Promise((resolve, reject) => {
    fn(...args, (err, result) => {
      if (err) {
        reject(err)
        return
      }
      resolve(result)
    })
  })
}

function inequal(operator, a, b) {
  switch (operator) {
    case '<':
      return a < b
    case '>':
      return a > b
    case '<=':
      return a <= b
    case '>=':
      return a >= b
    case '!=':
      return a != b
    case '!==':
      return a !== b
    default:
      throw new Error(`Unknown operator ${operator}`)
  }
}
