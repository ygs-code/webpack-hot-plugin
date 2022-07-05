/* eslint-disable*/
(function () {
  // 初始化参数，创建，连接
  function Client(config) {
    this.config = config;
    // 创建
    this.reporter = this.createReporter();
  }

  Client.prototype = {
    windowReload(messaves = []) {
      if (!messaves.length) {
        window.location.reload();
        return;
      }

      let key = messaves.join('').replace(/\[((?:\d{1,3};?)+|)m\r*\n*\s*/g, '');
      if (sessionStorage.getItem(key)) {
        setTimeout(() => {
          sessionStorage.removeItem(key);
        }, 3000);
        return false;
      } else {
        sessionStorage.setItem(key, key);
        window.location.reload();
      }
    },
    log: function (message) {
      console.info(
        '%c webpack-hot-plugin ' +
          (this.config.enabled ? '' : '(Disabled) '),
        'background:#CB5C0D; padding:2px; border-radius:3px; color:#fff',
        message
      );
    },
    createReporter: function () {
      var options = this.config;
      var strip = require('strip-ansi');

      var overlay;
      if (typeof document !== 'undefined' && options.overlay) {
        overlay = require('./client-overlay')({
          ansiColors: options.ansiColors,
          overlayStyles: options.overlayStyles,
        });
      }

      var styles = {
        errors: 'color: #ff0000;',
        warnings: 'color: #999933;',
      };
      var previousProblems = null;
      function log(type, obj) {
        var newProblems = obj[type]
          .map(function (msg) {
            return strip(msg);
          })
          .join('\n');

        if (previousProblems == newProblems) {
          return;
        } else {
          previousProblems = newProblems;
        }

        var style = styles[type];
        var name = obj.name ? "'" + obj.name + "' " : '';
        var title =
          'webpack-hot-plugin [HMR] bundle ' + name + 'has ' + obj[type].length + ' ' + type;
        // NOTE: console.warn or console.error will print the stack trace
        // which isn't helpful here, so using console.log to escape it.
        if (console.group && console.groupEnd) {
          console.group('%c' + title, style);
          console.log('%c' + newProblems, style);
          console.groupEnd();
        } else {
          console.log(
            '%c' + title + '\n\t%c' + newProblems.replace(/\n/g, '\n\t'),
            style + 'font-weight: bold;',
            style + 'font-weight: normal;'
          );
        }
      }

      return {
        cleanProblemsCache: function () {
          previousProblems = null;
        },
        problems: function (type, obj) {
          if (options.warn) {
            log(type, obj);
          }
          if (overlay) {
            if (options.overlayWarnings || type === 'errors') {
              overlay.showProblems(type, obj[type]);
              return false;
            }
            overlay.clear();
          }
          return true;
        },
        success: function () {
          if (overlay) overlay.clear();
        },
        useCustomOverlay: function (customOverlay) {
          overlay = customOverlay;
        },
      };
    },
    handleMessage: function (event) {
      try {
        this.processMessage(JSON.parse(event.data));
      } catch (ex) {
        if (options.warn) {
          console.warn('Invalid HMR message: ' + event.data + '\n' + ex);
        }
      }
    },
    processMessage: function (obj) {
      var options = this.config;
      var reporter = this.reporter;
      _this = this;

      switch (obj.action) {
        case 'building':
          if (options.log) {
            _this.log('[HMR] bundle rebuilding');
          }
          break;
        case 'built':
          if (options.log) {
            if (options.log) {
              _this.log('[HMR] bundle rebuilt');
            }
          }

        case 'error':
          if (obj.errors.length > 0) {
            if (reporter) {
              reporter.problems('errors', obj);
            }
          }
          break;
        case 'warning':
          if (options.warn && obj.warnings.length > 0) {
            if (reporter) {
              reporter.problems('warnings', obj);
              _this.windowReload(obj.warnings);
            }
          }
          break;
        case 'sync':
          break;
        case 'success':
          // window.location.reload();
          _this.windowReload();
          break;
        default:
      }
    },
  };

  let key = 'webpack-hot-plugin-client';
  if (window[key]) {
    return;
  }
  window[key] = Client;
})();
/* eslint-disable*/
