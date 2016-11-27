# html-webpack-externals-plugin

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
