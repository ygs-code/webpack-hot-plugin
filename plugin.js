
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const portfinder = require("portfinder");
const clientSrc = fs
  .readFileSync(path.join(__dirname, "./client-socket.js"))
  .toString();
const clientBrowser = fs
  .readFileSync(path.join(__dirname, "./client-browser.js"))
  .toString();

const createClient = (data) => {
  let src = clientSrc;
  // eslint-disable-next-line guard-for-in
  for (const key in data) {
    src = src.replace("/*" + key + "*/", data[key]);
  }
  return src;
};

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
    this.latestStats = {}
  }

  async start () {
    const { options } = this;
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
    } = options

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

    this.wss.on("connection", (ws) => {
      // 远程socket
      this.broadcast(
        this.latestStats
      );
    });

    this.clientSrc = createClient({
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

  broadcast (message) {
    message = JSON.stringify(message)
    this.wss.clients.forEach((client) => client.send(message));
  }
  //   做兼容
  hook (compiler, hookName, pluginName, fn) {
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



  publishStats (statsResult) {
    var stats = statsResult.toJson({
      // all: false,
      // cached: true,
      // children: true,
      // modules: true,
      // timings: true,
      // hash: true,
    });

    if (statsResult.hasErrors()) {
      for (let item of stats.errors) {
        const {
          action = 'error',
          time,
          hash,
          warnings = [],
          message = [],
        } = item;
        this.latestStats = {
          name: '',
          action: action,
          time: time || '',
          hash: hash || '',
          warnings: warnings || [],
          errors: [message],
        };
        this.broadcast(this.latestStats)
      }
    } else if (statsResult.hasWarnings()) {
      for (let item of stats.warnings) {
        const {
          action = 'warnings',
          time,
          hash,
          errors = [],
          message = [],
        } = item;
        this.latestStats = {
          name: '',
          action: action,
          time: time || '',
          hash: hash || '',
          warnings: [message] || [],
          errors: errors || [],
        };
        this.broadcast(this.latestStats)
      }
    } else {
      this.latestStats = {
        name: '',
        action: 'success',
        time: '',
        hash: '',
        warnings: [],
        errors: [],
      };
      this.broadcast(this.latestStats)
      this.latestStats = {
        ...this.latestStats,
        action: 'sync',
      };
    }
  }

  apply (compiler) {
    const { options = {}, clientSrc } = this;
    const { compilerWatch = () => { } } = options;
    //  开始编译 只会调用一次
    this.hook(compiler, "afterPlugins", async (compilation) => {
      if (!this.wss) {
        await this.start();
      }
    });

    this.hook(compiler, "invalid", 'webpack-hot-plugin', (statsResult) => {});
    // 编译
    this.hook(compiler, "emit", 'webpack-hot-plugin', (compilation) => {
      const { clientSrc } = this;
      for (const name in compilation.assets) {
        if (compilation.assets.hasOwnProperty(name) && name.endsWith(".js")) {
          const contents = compilation.assets[name].source();
          const withoutComments =
            clientBrowser +
            "\n" + clientSrc + "\n" + contents;
          compilation.assets[name] = {
            source: () => withoutComments,
            size: () => withoutComments.length,
          };
        }
      }
    });
    // 发送消息
    this.hook(compiler, "done", 'webpack-hot-plugin', (statsResult) => {
      this.publishStats(statsResult)
    });

  }
}

module.exports = WebpackHotPlugin;













