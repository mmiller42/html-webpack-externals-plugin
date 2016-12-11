# html-webpack-externals-plugin

本插件提供基本接口加载第三方依赖库增强了[html-webpack-plugin](https://github.com/ampedandwired/html-webpack-plugin)的不足。

Webpack的开发者们建议在开发过程、构建过程中单独加载第三方依赖库来提升编译速度，以极大的利用浏览器的缓存能力。

本插件允许使用以下2种方式加载第三方css，js 依赖：

* **Absolute URLs.** 这种方式让你更好的利用浏览器的缓存以及CDN带来的好处。在这种情况中，不需要在package.json文件中添加这些依赖，但是依然需要通过require/import声明引入。与URLs对应的script，link标签，也即js和css会被附件到HTML文件。
* **Local module dist files.** 这种方式让你直接使用本地依赖文件，而不是把它们打包在一起。在构建时，对应路径的配置列表会被从node_modules目录拷贝到HTML中，同理js文件用script标签，css用link标签。

## 安装

```sh
npm install html-webpack-externals-plugin --save-dev
```

## 使用

### 基本例子
添加到Webpack 配置文件中的`plugins`数组中，并放在`HtmlWebpackPlugin`后面，实际使用中发现貌似放在前面也可以。

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
使用这个插件时，不需要再在Webpack配置文件中定义 `externals`。插件会在运行时写入。

### 更加详细的例子

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
//输出的html
//entry.css 是在名为 'entry' 的chunk（entry对应的js文件）里被引入的
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
#### 注意: 插件只会从 HtmlWebpackPlugin 的配置对象中读取 'lib' 属性。如果 'lib' 没有被定义，则在 HtmlWebpackExternalsPlugin 中配置的全部依赖会被附加到 HTML 中。

## API

### new HtmlWebpackExternalsPlugin(externals, options)

#### externals

一个对象数组，每一个对象代表一个外部依赖。每一个对象会包含如下的属性。

```js
[
  {
    // 依赖的名称，即被传递到 `require()` 或者 `import` 声明中的那个名称
    name: 'react',
    // JS 库在 `window` 对象中暴露的那个变量名称。 比如 `jQuery` or `React`。
    // 如果依赖库中没有暴露任何值（比如CSS文件，不需要暴露一个全局变量），省略这个属性也可以。
    var: 'React',
    // 用于从 CDN 加载依赖的绝对路径
    url: 'https://cdnjs.cloudflare.com/ajax/libs/react/15.0.1/react.js'
  },
  {
    name: 'react',
    var: 'React',
    // 可选地，你可以指定你的项目目录下的 `node_modules` 目录下的一个目录。
    //webpack会在构建时拷贝到输出（'build'属性）目录
    path: 'react/dist/react.min.js'
  }
]
```

#### options

一个对象，包含了插件需要的属性。这个配置只会应用到从本地目录中读取依赖的情况。（即使用 `path` 而不是 `url`）

```js
{
  // 会被解析成本地依赖文件的绝对路径。通常为项目的根目录。用于加载本地依赖。 大多数情况下可以使用 `__dirname`
  basedir: __dirname,
  // 拷贝本地依赖到 build 目录的那个目录名称。默认为 'vendor'
  // `'vendor'`.
  dest: 'vendor'
}
```

## 例子

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
        // 本地依赖的相对路径
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
// 不需要 import 'bootstrap.css'， 因为已经被添加到 html 中了
```

注意因为它们是外部依赖，所以它们总是只会被加载一次，不管你是否在你自己的代码中多处使用。意思就是说没必要再在 js 文件中引入 CSS 库了，比如 Bootstrap CSS。

## Assets Required by Library （不好翻译，应该是依赖库需要的额外资源，比如字体资源）

对于本地依赖 (即使用 `path` 属性，而不是 `url`)，有时候需要拷贝依赖库所依赖的额外资源到目标目录(比如 Bootstrap 用到的字体资源)。

最简单的方法就是结合 [CopyWebpackPlugin](https://github.com/kevlened/copy-webpack-plugin) 与 HtmlWebpackExternalsPlugin, 拷贝需要的文件到 build 目录。

在你的 Webpack 配置文件里的 `plugins` 数组里，添加下列插件到 HtmlWebpackExternalsPlugin 配置后面。

```js
new CopyWebpackPlugin([
  {from: 'node_modules/bootstrap/dist/', to: 'vendor/bootstrap/dist/'},
  {from: 'node_modules/font-awesome/fonts/', to: 'vendor/font-awesome/fonts/'}
])
```
