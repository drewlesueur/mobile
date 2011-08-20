(function() {
  var __slice = Array.prototype.slice;
  define("mobile-app", function() {
    var $, drews, eventer, mobileAppMaker, nimble, severus;
    $ = require("jquery");
    nimble = require("nimble");
    drews = require("drews-mixins");
    severus = require("severus");
    severus.db = "mobilemin_dev";
    eventer = require("drews-event");
    mobileAppMaker = function(self) {
      var attrs, emit, remove, save;
      if (self == null) {
        self = {};
      }
      attrs = [];
      self = eventer(self);
      emit = self.emit;
      save = function() {
        severus.save("mobileapps", attrs, function(err, _mobileApp) {});
        _.extend(attrs, _mobileApp);
        return cb(err, self);
      };
      self.save = save;
      remove = function(cb) {
        return severus.remove("listings", attrs._id, cb);
      };
      self.remove = remove;
      self.set = function(obj, val) {
        if (_.isString(obj)) {
          return attrs[obj] = val;
        } else {
          return _.extend(attrs, obj);
        }
      };
      return self.get = function(prop) {
        return attrs[prop];
      };
    };
    mobileAppMaker.find = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return severus.find("mobileapps", args);
    };
    return mobileAppMaker;
  });
}).call(this);
