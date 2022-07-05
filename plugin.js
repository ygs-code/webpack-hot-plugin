/* eslint-disable   */

const webpack = require('webpack');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const portfinder = require('portfinder');

class WebpackHotPlugin {
  constructor(options) {
    this.options = {
      port: 8080,
      retryWait: 5000,
      delay: 0,
      enabled: true,
      reload: true,
      overlay: true,
      log: true,
      warn: true,
      name: '',
      autoConnect: true,
      overlayStyles: '{}',
      overlayWarnings: false,
      ansiColors: '{}',
      ...options,
    };
    this.latestStats = {};
    let {
      port,
      retryWait,
      delay,
      enabled,
      reload,
      overlay,
      log,
      warn,
      name,
      autoConnect,
      overlayStyles,
      overlayWarnings,
      ansiColors,
    } = this.options;
    this.clientBrowser = this.readFile('./client-browser.js');
    this.clientSrc = this.createClient(this.readFile('./client-socket.js'), {
      port,
      retryWait,
      delay,
      enabled,
      reload,
      overlay,
      log,
      warn,
      name,
      autoConnect,
      overlayStyles,
      overlayWarnings,
      ansiColors,
    });
  }
  readFile(src) {
    return fs.readFileSync(path.join(__dirname, src)).toString();
  }
  createClient(fileStr, data) {
    // eslint-disable-next-line guard-for-in
    for (const key in data) {
      fileStr = fileStr.replace('/*' + key + '*/', data[key]);
    }
    return fileStr;
  }
  async start() {
    const { options } = this;
    let { port } = options;

    // 设置静态服务器
    portfinder.basePort = port;
    port = await new Promise((resolve, reject) => {
      //查找端口号
      portfinder.getPort((err, port) => {
        if (err) {
          reject(err);
          return;
        }
        // 新端口
        resolve(port);
      });
    });

    this.wss = new WebSocket.Server({ port });

    this.wss.on('connection', (ws) => {
      // 远程socket
      this.broadcast(this.latestStats);
    });
  }

  broadcast(message) {
    message = JSON.stringify(message);
    this.wss.clients.forEach((client) => client.send(message));
  }
  //   做兼容
  hook(compiler, hookName, pluginName, fn) {
    if (arguments.length === 3) {
      fn = pluginName;
      pluginName = hookName;
    }
    if (compiler.hooks) {
      compiler.hooks[hookName].tap(pluginName, fn);
    } else {
      compiler.plugin(pluginName, fn);
    }
  }

  publishStats(statsResult) {
    let action = null;
    let errors = [];
    let warnings = [];
    var stats = statsResult.toJson({
      // all: false,
      // cached: true,
      // children: true,
      // modules: true,
      // timings: true,
      // hash: true,
    });

    this.latestStats = {
      name: '',
      action: action,
      time: '',
      hash: '',
      warnings: [],
      errors: [],
    };

    if (statsResult.hasWarnings()) {
      action = 'warning';
      for (let item of stats.warnings) {
        const { message = [] } = item;
        warnings.push(message);
        this.latestStats = {
          ...this.latestStats,
          action,
          warnings,
        };
      }
    }

    if (statsResult.hasErrors()) {
      action = 'error';
      for (let item of stats.errors) {
        const { message = [] } = item;
        errors.push(message);
        this.latestStats = {
          ...this.latestStats,
          action,
          errors,
        };
      }
    }

    if (!action) {
      this.latestStats = {
        name: '',
        action: 'success',
        time: '',
        hash: '',
        warnings: [],
        errors: [],
      };
      this.broadcast(this.latestStats);
      this.latestStats = {
        ...this.latestStats,
        action: null,
      };
      return false;
    }

    this.broadcast(this.latestStats);
  }

  apply(compiler) {
    const { options = {}, clientSrc } = this;
    const { compilerWatch = () => {} } = options;
    //  开始编译 只会调用一次
    this.hook(compiler, 'afterPlugins', async (compilation) => {
      if (!this.wss) {
        await this.start();
      }
    });

    this.hook(compiler, 'compile', 'webpack-hot-plugin', (statsResult) => {
      // console.log('compile=====================================');
    });
    this.hook(compiler, 'invalid', 'webpack-hot-plugin', (compilation) => {
      console.log('invalid==========');
      this.broadcast({
        name: '',
        action: 'building',
        time: '',
        hash: '',
        warnings: [],
        errors: [],
      });
    });

    // 编译
    this.hook(compiler, 'emit', 'webpack-hot-plugin', (compilation) => {
       
      for (const name in compilation.assets) {
        if (compilation.assets.hasOwnProperty(name) && name.endsWith('.js')) {
          const contents = compilation.assets[name].source();
          const withoutComments =
            this.clientBrowser + '\n' + this.clientSrc + '\n' + contents;
          compilation.assets[name] = {
            source: () => withoutComments,
            size: () => withoutComments.length,
          };
        }
      }
    });
    // 发送消息
    this.hook(compiler, 'done', 'webpack-hot-plugin', (statsResult) => {
      this.publishStats(statsResult);
    });
  }
}

module.exports = WebpackHotPlugin;
/* eslint-enable   */
