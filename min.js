(function() {
  var __slice = Array.prototype.slice;
  define("min", function() {
    var $, Min, drews, eventBus, eventer, mobilemin, nimble, severus, _;
    $ = require("jquery");
    _ = require("underscore");
    nimble = require("nimble");
    drews = require("drews-mixins");
    severus = require("severus");
    severus.db = "mobilemin_dev";
    mobilemin = require("mobilemin");
    eventBus = require("event-bus");
    eventer = require("drews-event");
    Min = eventer({});
    Min.init = function(attrs) {
      var emit, remove, save, self, toHtml, _emit;
      if (attrs == null) {
        attrs = {};
      }
      self = {};
      self.attrs = attrs;
      self = eventer(self);
      _emit = self.emit;
      emit = function() {
        var args, event;
        event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        _emit.apply(null, [event].concat(__slice.call(args)));
        return Min.emit.apply(Min, [event, self].concat(__slice.call(args)));
      };
      save = function(cb) {
        if (cb == null) {
          cb = function() {};
        }
        emit("saving");
        console.log("saving");
        console.log(JSON.stringify(attrs));
        return severus.save("mins", attrs, function(err, _mobileApp) {
          _.extend(attrs, _mobileApp);
          emit("action", "save");
          emit("save");
          return cb(err, self);
        });
      };
      self.save = save;
      remove = function(cb) {
        if (cb == null) {
          cb = function() {};
        }
        emit("removing");
        return severus.remove("mins", attrs._id, function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          emit("remove");
          return cb.apply(null, args);
        });
      };
      self.remove = remove;
      toHtml = self.toHtml = function() {
        return "<!doctype html>\n<html>\n<head>\n  <title>" + attrs.title + "</title>\n  <meta name=\"viewport\" content=\"width=device-width\" />\n</head>\n<body>\n  <h1><img src=\"" + attrs.headerUrl + "\" class=\"header-image\"/></h1>\n  <div class=\"phone\">\n    " + attrs.phone + "\n  </div>\n</body>";
      };
      self["export"] = function() {
        return mobilemin.saveSite(attrs.name, toHtml());
      };
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
      Min.emit("init", self);
      return self;
    };
    Min.find = function() {
      var args, cb, models, _i;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
      models = [];
      return severus.find.apply(severus, ["mins"].concat(__slice.call(args), [function(err, models) {
        var model, _j, _len;
        for (_j = 0, _len = models.length; _j < _len; _j++) {
          model = models[_j];
          models.push(Min.init(model));
        }
        Min.emit("find", models, Min);
        return cb(err, models);
      }]));
    };
    return Min;
  });
}).call(this);
