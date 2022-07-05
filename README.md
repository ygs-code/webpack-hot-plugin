# Webpack Hot  plugin
Webpack hot reloading using only Webpack Hot  plugin     This allows you to add hot reloading into an existing server without [webpack-dev-server](https://webpack.js.org/configuration/dev-server/).

This module is **only** concerned with the mechanisms to connect a browser client to a webpack server & receive updates. It will subscribe to changes from the server and execute those changes using [webpack's HMR API](https://webpack.js.org/concepts/hot-module-replacement/). Actually making your application capable of using hot reloading to make seamless changes is out of scope, and usually handled by another library.

[![npm version](https://img.shields.io/npm/v/webpack-hot-middleware.svg)](https://www.npmjs.com/package/webpack-hot-middleware) [![CircleCI](https://circleci.com/gh/webpack-contrib/webpack-hot-middleware/tree/master.svg?style=svg)](https://circleci.com/gh/webpack-contrib/webpack-hot-middleware/tree/master)[![codecov](https://codecov.io/gh/webpack-contrib/webpack-hot-middleware/branch/master/graph/badge.svg)](https://codecov.io/gh/webpack-contrib/webpack-hot-middleware)![MIT Licensed](https://img.shields.io/npm/l/webpack-hot-middleware.svg)

## Installation & Usage

See [example/](./example/) for an example of usage.

First, install the npm module.

```sh
npm install --save webpack-hot-plugin
```

Next, enable hot reloading in your webpack config:

 1. Add the following plugins to the `plugins` array:
    
 2. const WebpackHotPlugin = require('webpack-hot-plugin');

    ```js
    plugins: [
        new WebpackHotPlugin ({options}),
    ]
    ```

    Occurence ensures consistent build hashes, hot module replacement is
    somewhat self-explanatory, no errors is used to handle errors more cleanly.

    

And you're all set!

## Documentation

More to come soon, you'll have to mostly rely on the example for now.

### Config

#### Client

Configuration options can be passed to the client by adding querystring parameters to the path in the webpack config.

## options：

* **path** - The path which the middleware is serving the event stream on
* **name** - Bundle name, specifically for multi-compiler mode
* **timeout** - The time to wait after a disconnection before attempting to reconnect
* **overlay** - Set to `false` to disable the DOM-based client-side overlay.
* **reload** - Set to `true` to auto-reload the page when webpack gets stuck.
* **noInfo** - Set to `true` to disable informational console logging.
* **quiet** - Set to `true` to disable all console logging.
* **dynamicPublicPath** - Set to `true` to use webpack `publicPath` as prefix of `path`. (We can set `__webpack_public_path__` dynamically at runtime in the entry point, see note of [output.publicPath](https://webpack.js.org/configuration/output/#output-publicpath))
* **autoConnect** - Set to `false` to use to prevent a connection being automatically opened from the client to the webpack back-end - ideal if you need to modify the options using the `setOptionsAndConnect` function
* **ansiColors** - An object to customize the client overlay colors as mentioned in the [ansi-html-community](https://github.com/mahdyar/ansi-html-community#set-colors) package.
* **overlayStyles** - An object to let you override or add new inline styles to the client overlay div.
* **overlayWarnings** - Set to `true` to enable client overlay on warnings in addition to errors.

> Note:
> Since the `ansiColors` and `overlayStyles` options are passed via query string, you'll need to uri encode your stringified options like below:

```js
var ansiColors = {
  red: '00FF00' // note the lack of "#"
};
var overlayStyles = {
  color: '#FF0000' // note the inclusion of "#" (these options would be the equivalent of div.style[option] = value)
};


plugins: [
    new WebpackHotPlugin ({ansiColors,overlayStyles}),
]

 
```

 author : 姚观寿 (yao guan shou)
