# html-webpack-externals-plugin *DEPRECATED*

I don't advise people to use this plugin, personally. I developed it with the intention of having it keep my code clean, but it's buggy in too many edge cases. I'm finding that it's better (if more verbose), to use a combination of [`externals`](https://webpack.github.io/docs/configuration.html#externals), [`HtmlWebpackPlugin`](https://github.com/jantimon/html-webpack-plugin), [`HtmlWebpackIncludeAssetsPlugin`](https://github.com/jharris4/html-webpack-include-assets-plugin), and [`CopyWebpackPlugin`](https://github.com/kevlened/copy-webpack-plugin), like so:

```js
  plugins: [
    // Use CopyWebpackPlugin to copy dist files to your outputPath
    new CopyWebpackPlugin([
      { from: 'node_modules/react/dist/react.js', to: 'vendor/js/' },
      { from: 'node_modules/react-dom/dist/react-dom.js', to: 'vendor/js/' },
      { from: 'node_modules/redux/dist/redux.js', to: 'vendor/js/' },
      { from: 'node_modules/semantic-ui-css/semantic.css', to: 'vendor/css/' },
      // Required assets of your dependencies (such as fonts and images) can be copied too
      { from: 'node_modules/semantic-ui-css/themes/', to: 'vendor/css/themes/' }
    ]),
    // Use HtmlWebpackAssetsPlugin to add asset script/link tags to HTML output
    new HtmlWebpackIncludeAssetsPlugin({
      // List of JS and CSS paths (relative to outputPath) to load
      assets: [
        'vendor/js/react.js',
        'vendor/js/react-dom.js',
        'vendor/js/redux.js',
        'vendor/css/semantic.css'
      ],
      // Insert these assets before the bundle file(s)
      append: false,
      // Add hash to end of filename so that if your dependencies update, cache will refresh
      hash: true
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/index.html',
      hash: true
    })
  ],
  // Specify the dependencies to exclude from the bundle since the dist files are being used
  // keys are the module names, values are the globals exported by the dist files
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    redux: 'Redux'
  }
```

While it's a little more redundant, it's more reliable and generally more configurable.

If I end up rewriting this plugin at some point, it will probably just provide an abstraction layer over these other plugins.

Documentation is below, but be warned that this plugin is buggy and somewhat unreliable for a number of edge cases.

***

This plugin supplements the fantastic [html-webpack-plugin](https://github.com/ampedandwired/html-webpack-plugin) by providing a very basic interface for loading your external dependencies.

Webpack developers advise using externals to speed up compile time during development/builds as well as to leverage the caching capabilities of browsers.

This plugin allows you to load external CSS and JS dependencies with:

* **Absolute URLs.** This approach lets you leverage the caching and speed benefits of CDNs. In this case, the module does not need to be in your dependencies list of your `package.json` and require/import statements will still behave as expected. Script/link tags with the given URLs are appended to the HTML.
* **Local module dist files.** This approach lets you serve dist files of your specified dependencies instead of bundling them. At build time, the listed externals are copied from your `node_modules` into your build and script/link tags with relative paths are appended to the HTML.

## Installation

```sh
npm install html-webpack-externals-plugin --save-dev
```

## Usage

### Basic
Add it to the `plugins` array of your Webpack configuration, after your `HtmlWebpackPlugin` instance.

```js
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin');

module.exports = {
  // ...your Webpack config
  plugins: [
    new HtmlWebpackPlugin(),
    new HtmlWebpackExternalsPlugin(
      // See the API section
    );
  ]
};
```

When using this plugin, do *not* define `externals` in the Webpack configuration yourself; it will be written by the plugin at runtime.

### More Detail

```js
//webpack.config.js
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin');

module.exports = {
  // ...your Webpack config
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'path.to.html.template.name'),
      lib: ['jquery', 'd3', 'bootstrap.css'],
      chunks: ['entry-name']
    }),
    new HtmlWebpackExternalsPlugin(
        [
          {
              name: 'jquery',
              var: 'jQuery',
              path: './jquery/jquery-3.1.1.js'
          },
          {
              name: 'd3',
              var: 'd3',
              path: './d3/d3.min.js'
          },
          {
              name: 'Highcharts',
              var: 'Highcharts',
              path: './highcharts-5.0.4/highcharts.js'
          },
          {
              name: 'HighchartsMore',
              var: 'Highcharts',
              path: './highcharts-5.0.4/highcharts-more.js'
          },
          {
              name: 'bootstrap.css',
              path: './bootstrap-3.3.7/css/bootstrap.min.css'
          },
      ], 
      {
          basedir: 'path.to.your.lib.basedir',
          dest: 'lib'
      }
    );
  ]
};
```

```js
//output html
//entry.css is imported by chunk 'entry'
<!-- index.html -->
<!DOCTYPE HTML>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"/>
  <meta name="renderer" content="webkit">
  <title>XXX</title>
<link href="lib/bootstrap-3.3.7/css/bootstrap.min.css" rel="stylesheet"><link href="./css/entry.css" rel="stylesheet"></head>
<body>
<button id="btn">test</button>

<div id="industryMap"></div>
<script type="text/javascript" src="lib/jquery/jquery-3.1.1.js"></script><script type="text/javascript" src="lib/d3/d3.min.js"></script><script type="text/javascript" src="./js/entry.js"></script></body>
</html> 
```
#### Note: the plugin will get property 'lib' from configuration of HtmlWebpackPlugin, and not get from anywhere. If 'lib' is absent, then all libs will be appended

## API

### new HtmlWebpackExternalsPlugin(externals, options)

#### externals

An array of objects, each of which represents an external. Each object may have a set of properties, which are documented in the following code sample.

```js
[
  {
    // The name of the external dependency, i.e. what is passed into `require()` calls or `import`
    // statements.
    name: 'react',
    // JS library dists typically export their API through a single global variable on the `window`
    // object, e.g. `jQuery` or `React`. If the external does not export anything (e.g. a CSS
    // dependency), omit this property.
    var: 'React',
    // The absolute URL to use when loading the dependency from a CDN.
    url: 'https://cdnjs.cloudflare.com/ajax/libs/react/15.0.1/react.js'
  },
  {
    name: 'react',
    var: 'React',
    // Alternatively, you can specify a path to a dist file of one of your packages in `node_modules`.
    // This will copy it to the build directory when Webpack runs.
    path: 'react/dist/react.min.js'
  }
]
```

#### options

An object containing configuration options for the plugin. Both options apply only to local externals (i.e. externals that use `path` instead of `url`).

```js
{
  // The absolute path to resolve locally installed externals from. Usually this is your
  // application's root directory. It is required for loading local externals. Most of the time you
  // can pass `__dirname` to use the current directory.
  basedir: __dirname,
  // The directory to copy locally installed externals to within the build directory. Defaults to
  // `'vendor'`.
  dest: 'vendor'
}
```

## Example

### webpack.config.js

```js
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin');

module.exports = {
  // ...your Webpack config
  plugins: [
    new HtmlWebpackPlugin(),
    new HtmlWebpackExternalsPlugin(
      [
        // Using a CDN for a JS library
        {
          name: 'jquery',
          var: 'jQuery',
          url: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/1.12.4/jquery.js'
        },
        // Using a locally installed module for a JS library
        {
          name: 'react',
          var: 'React',
          path: 'react/dist/react.min.js'
        },
        // Using a CDN for a library with no export (e.g. a CSS module)
        {
          name: 'bootstrap.css',
          url: 'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.5/css/bootstrap.css'
        }
      ],
      {
        // Resolve local modules relative to this directory
        basedir: __dirname
      }
    );
  ]
};
```

### index.jsx

```js
import React, {Component} from 'react';
import $ from 'jquery';
// No need to import 'bootstrap.css' because it's already been added to the page
```

Note that since they are externals, they are always loaded exactly once, whether they are used in source code or not. So this means that it is unnecessary to import the CSS libraries, like Bootstrap.

## Assets Required by Library

For local externals (i.e. externals that use `path` instead of `url`), sometimes you need to copy other assets to the dist that the library depends on (e.g. font assets used by Bootstrap).

The easiest way to accomplish this is by complementing the HtmlWebpackExternalsPlugin with the [CopyWebpackPlugin](https://github.com/kevlened/copy-webpack-plugin), which copies files in a directory to the build.

In your Webpack configuration's `plugins` array, add the plugin after your HtmlWebpackExternalsPlugin instance.

```js
new CopyWebpackPlugin([
  {from: 'node_modules/bootstrap/dist/', to: 'vendor/bootstrap/dist/'},
  {from: 'node_modules/font-awesome/fonts/', to: 'vendor/font-awesome/fonts/'}
])
```
