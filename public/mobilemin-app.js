(function() {
  var MobileMinApp, Severus;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Severus = dModule.require("severus2");

  MobileMinApp = (function() {

    function MobileMinApp() {
      this.findPhones = __bind(this.findPhones, this);
      this.find = __bind(this.find, this);      this.severus = Severus.init();
      this.severus.db = "mobilemin_dev";
      this.data = Severus.init();
    }

    MobileMinApp.prototype.find = function(what, callback) {
      var mmCallback;
      var _this = this;
      if (callback == null) callback = function() {};
      mmCallback = function(err, apps) {
        _this.app = apps[0];
        callback(err, apps);
        return _this.data.db = "mobilemin_" + _this.app.name;
      };
      this.severus.find("mins", what, mmCallback);
      return mmCallback;
    };

    MobileMinApp.prototype.findPhones = function(what, callback) {
      if (callback == null) callback = function() {};
      return this.data.find("phones", what, callback);
    };

    return MobileMinApp;

  })();

  dModule.define("mobilemin-app", function() {
    return MobileMinApp;
  });

}).call(this);
