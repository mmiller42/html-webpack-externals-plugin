# html-webpack-externals-plugin

Webpack plugin that works alongside [`html-webpack-plugin`](https://github.com/jantimon/html-webpack-plugin) to use pre-packaged vendor bundles.

## How it works

This plugin is very simple and just encapsulates two other Webpack plugins to do the heavy lifting. It:

1. modifies your Webpack config at runtime to add your vendor modules to the [`externals`](https://webpack.js.org/configuration/externals/) property.
1. runs the [`copy-webpack-plugin`](https://github.com/kevlened/copy-webpack-plugin) to copy your vendor module assets into the output path.
1. runs the [`html-webpack-include-assets-plugin`](https://github.com/jharris4/html-webpack-include-assets-plugin) to add your vendor module bundles to the HTML output.

## Installation

```sh
npm install --save-dev html-webpack-externals-plugin
```

## Usage

Require the plugin in your Webpack config file.

```js
const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin')
```

Then instantiate it in the `plugins` array, after your instance of `html-webpack-plugin`.

```js
plugins: [
  new HtmlWebpackPlugin(),
  new HtmlWebpackExternalsPlugin(
    // See API section
  )
]
```

## API

The constructor takes a configuration object with the following properties.

| Property | Type | Description | Default |
| --- | --- | --- | --- |
| `externals` | array&lt;object&gt; | An array of vendor modules that will be excluded from your Webpack bundle and added as `script` or `link` tags in your HTML output. | *None* |
| `externals[].module` | string | The name of the vendor module. This should match the package name, e.g. if you are writing `import React from 'react'`, this would be `react`. | *None* |
| `externals[].entry` | string \| array&lt;string&gt; \| object \| array&lt;object \| string&gt; | The path, relative to the vendor module directory, to its pre-bundled distro file. e.g. for React, use `dist/react.js`, since the file exists at `node_modules/react/dist/react.js`. Specify an array if there are multiple CSS/JS files to inject. To use a CDN instead, simply use a fully qualified URL beginning with `http://`, `https://`, or `//`.<br><br>For entries whose type (JS or CSS) cannot be inferred by file extension, pass an object such as `{ path: 'https://some/url', type: 'css' }` (or `type: 'js'`). | *None* |
| `externals[].global` | string \| null | For JavaScript modules, this is the name of the object globally exported by the vendor's dist file. e.g. for React, use `React`, since `react.js` creates a `window.React` global. For modules without an export (such as CSS), omit this property or use `null`. | `null` |
| `externals[].supplements` | array&lt;string&gt; | For modules that require additional resources, specify globs of files to copy over to the output. e.g. for Bootstrap CSS, use `['dist/fonts/']`, since Glyphicon fonts are referenced in the CSS and exist at `node_modules/bootstrap/dist/fonts/`. | `[]` |
| `externals[].append` | boolean | Set to true to inject this module after your Webpack bundles. | `false` |
| `hash` | boolean | Set to true to append the injected module distro paths with a unique hash for cache-busting. | `false` |
| `outputPath` | string | The path (relative to your Webpack `outputPath`) to store externals copied over by this plugin. | `vendor` |
| `publicPath` | string \| null | Override Webpack config's `publicPath` for the externals files, or `null` to use the default `output.publicPath` value. | `null` |

## Example

```js
new HtmlWebpackExternalsPlugin({
  externals: [
    {
      // Specify that `react` module will be externalized (not bundled)
      module: 'react',
      // Copy `node_modules/react/dist/react.js` into output and insert `script` tag
      entry: 'dist/react.js',
      // Specify that the `react` module is accessed via `window.React`
      global: 'React',
    },
    {
      module: 'react-dom',
      entry: 'dist/react-dom.js',
      global: 'ReactDOM',
    },
    {
      module: 'bootstrap',
      // Specify multiple entry points to copy into output and insert a `link` tag for each
      entry: ['dist/css/bootstrap.css', 'dist/css/bootstrap-theme.css'],
      // Specify additional assets to copy into the outputPath, needed by this module
      supplements: ['dist/fonts/'],
    },
    {
      module: 'material-icons',
      // For entry points without file extensions, pass an object with `path` and `type`
      // properties to manually specify the type (either `js` or `css`)
      entry: {
        path: 'https://fonts.googleapis.com/css?family=Material+Icons',
        type: 'css'
      }
    }
  ],
  // Enable cache-busting on the module entry files
  hash: true,
  // Specify the directory within the outputPath to copy externals' assets into
  outputPath: 'vendors',
})
```
