(function() {
  var MobileMinApp, Severus;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Severus = dModule.require("severus2");

  MobileMinApp = (function() {

    function MobileMinApp() {
      this.createApp = __bind(this.createApp, this);
      this.findPhones = __bind(this.findPhones, this);
      this.find = __bind(this.find, this);      this.severus = Severus.init();
      this.severus.db = "new_mobilemin";
      this.data = Severus.init();
    }

    MobileMinApp.prototype.find = function(what, callback) {
      var mmCallback;
      var _this = this;
      if (callback == null) callback = function() {};
      mmCallback = function(err, apps) {
        _this.app = apps[0];
        callback(err, apps);
        return _this.data.db = "new_mobilemin";
      };
      this.severus.find("apps", what, mmCallback);
      return mmCallback;
    };

    MobileMinApp.prototype.findPhones = function(what, callback) {
      if (callback == null) callback = function() {};
      return this.data.find("app_" + (this.app.firstPhone.replace(/\W/, "")) + "_phones", what, callback);
    };

    MobileMinApp.prototype.createApp = function(props, cb) {
      var saveCallback, self;
      var _this = this;
      self = this;
      saveCallback = function(err, app) {
        _this.app = app;
        return cb(null, self);
      };
      this.data.save("apps", props, saveCallback);
      return saveCallback;
    };

    return MobileMinApp;

  })();

  dModule.define("mobilemin-app", function() {
    return MobileMinApp;
  });

}).call(this);
