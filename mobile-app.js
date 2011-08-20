(function() {
  var __slice = Array.prototype.slice;
  define("mobile-app", function() {
    var $, drews, eventer, mobileAppMaker, nimble, severus, _;
    $ = require("jquery");
    _ = require("underscore");
    nimble = require("nimble");
    drews = require("drews-mixins");
    severus = require("severus");
    severus.db = "mobilemin_dev";
    eventer = require("drews-event");
    mobileAppMaker = function(attrs) {
      var emit, remove, save, self;
      if (attrs == null) {
        attrs = {};
      }
      self = eventer({});
      self.attrs = attrs;
      emit = self.emit;
      save = function(cb) {
        if (cb == null) {
          cb = function() {};
        }
        emit("saving");
        return severus.save("mobileapps", attrs, function(err, _mobileApp) {
          _.extend(attrs, _mobileApp);
          emit("save", self);
          return cb(err, self);
        });
      };
      self.save = save;
      remove = function(cb) {
        emit("removing");
        return severus.remove("mobileapps", attrs._id, function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          emit("remove", self);
          return cb.apply(null, args);
        });
      };
      self.remove = remove;
      self.set = function(obj, val) {
        if (_.isString(obj)) {
          return attrs[obj] = val;
        } else {
          return _.extend(attrs, obj);
        }
      };
      self.get = function(prop) {
        return attrs[prop];
      };
      return self;
    };
    mobileAppMaker.find = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return severus.find.apply(severus, ["mobileapps"].concat(__slice.call(args)));
    };
    return mobileAppMaker;
  });
}).call(this);
