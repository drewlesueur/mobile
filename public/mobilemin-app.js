(function() {
  var MobileMinApp, Severus, drews;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __slice = Array.prototype.slice;

  Severus = dModule.require("severus2");

  drews = dModule.require("drews-mixins");

  MobileMinApp = (function() {

    function MobileMinApp() {
      this.save = __bind(this.save, this);
      this.onSave = __bind(this.onSave, this);
      this.createApp = __bind(this.createApp, this);
      this.onCreate = __bind(this.onCreate, this);
      this.findPhones = __bind(this.findPhones, this);
      this.find = __bind(this.find, this);      this.data = Severus.init();
      this.data.db = "new_mobilemin";
      this.app = {};
      drews.makeEventful(this);
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
      this.data.find("apps", what, mmCallback);
      return mmCallback;
    };

    MobileMinApp.prototype.findPhones = function(what, callback) {
      var cleanFirstPhone, cleanTwilioPhone;
      if (callback == null) callback = function() {};
      cleanFirstPhone = this.app.firstPhone.replace(/\W/, "");
      cleanTwilioPhone = this.app.twilioPhone.replace(/\W/, "");
      return this.data.find("app_" + cleanFirstPhone + "_" + cleanTwilioPhone + "_phones", what, callback);
    };

    MobileMinApp.prototype.onCreate = function(err, app) {
      if (err) {
        this.emit("createerror", err);
        return;
      }
      this.app = app;
      return this.emit("created");
    };

    MobileMinApp.prototype.createApp = function(props) {
      this.app = props;
      return this.data.save("apps", props, this.onCreate);
    };

    MobileMinApp.prototype.onSave = function(err, app) {
      if (err) {
        this.emit("saveerror", err);
        return;
      }
      this.app = app;
      return this.emit("saved");
    };

    MobileMinApp.prototype.save = function() {
      return this.data.save("apps", this.app, this.onSave);
    };

    return MobileMinApp;

  })();

  MobileMinApp.init = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return typeof result === "object" ? result : child;
    })(MobileMinApp, args, function() {});
  };

  dModule.define("mobilemin-app", function() {
    return MobileMinApp;
  });

}).call(this);
