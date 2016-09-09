# html-webpack-externals-plugin
This plugin supplements the fantastic [html-webpack-plugin](https://github.com/ampedandwired/html-webpack-plugin) by providing a very basic interface for loading your external dependencies.

Webpack developers advise using externals to speed up compile time during development/builds as well as to leverage the caching capabilities of browsers by fetching popular libraries from CDNs instead of reading them out of the bundle.

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
      // See the Configuration section
    );
  ]
};
```

When using this plugin, do *not* define `externals` in the Webpack configuration yourself; it will be written by the plugin at runtime.

## Configuration
The constructor takes one argument, an array of externals. Each external is an object with these properties:
* *string* `name`

  The original name of the module, which is what is used to reference the dependency in application code. For example, if you write `import React from 'react'` or `var $ = require('jquery')`, set the name to `react` or `jquery`, respectively.

* *string/boolean* `var`

  The name of the variable that is globally exported on the `window` object when the module is loaded. For example, React creates a variable named `React` and jQuery creates a variable `jQuery`. If the library doesn't export anything (a CSS library like Bootstrap, for example), just set this to `true`.

* *string* `url`

  The URL used in the script tag. For example, for React, you can use a CDN like `https://cdnjs.cloudflare.com/ajax/libs/react/15.0.1/react.js`.

## Example
### `webpack.config.js`
```js
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin');

module.exports = {
  // ...your Webpack config
  plugins: [
    new HtmlWebpackPlugin(),
    new HtmlWebpackExternalsPlugin([
      {name: 'jquery', var: 'jQuery', url: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/1.12.4/jquery.js'},
      {name: 'react', var: 'React', url: 'https://cdnjs.cloudflare.com/ajax/libs/react/15.0.1/react.js'},
      {name: 'react-dom', var: 'ReactDOM', url: 'https://cdnjs.cloudflare.com/ajax/libs/react/15.0.1/react-dom.js'},
      {name: 'redux', var: 'Redux', url: 'https://cdnjs.cloudflare.com/ajax/libs/redux/3.6.0/redux.js'},
      {name: 'bootstrap.css', url: 'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.5/css/bootstrap.css'},
      {name: 'font-awesome.css', url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.6.3/css/font-awesome.css'}
    ]);
  ]
};
```

### `index.jsx`
```js
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {createStore, applyMiddleware, combineReducers} from 'redux';
```

Note that since they are externals, they are always loaded exactly once, whether they are used in source code or not. So this means that it is unnecessary to import the CSS libraries.
