(function() {
  var MobileMinApp, Severus, difinir;
  var __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  if (typeof module !== "undefined" && module !== null ? module.exports : void 0) {
    difinir = function() {
      var args, ret, _i;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), ret = arguments[_i++];
      return module.exports = ret();
    };
    define = difinir;
  }

  Severus = require("severus2");

  MobileMinApp = (function() {

    function MobileMinApp() {
      this.find = __bind(this.find, this);      this.severus = Severus.init();
      this.severus.db = "mobilemin_dev";
    }

    MobileMinApp.prototype.find = function(what, callback) {
      var mmCallback;
      var _this = this;
      if (callback == null) callback = function() {};
      mmCallback = function(err, apps) {
        _this.app = apps[0];
        return callback(err, apps);
      };
      this.severus.find("mobilemin", what, mmCallback);
      return mmCallback;
    };

    return MobileMinApp;

  })();

  define("mobilemin-app", function() {
    return MobileMinApp;
  });

}).call(this);
