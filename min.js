(function() {
  var __slice = Array.prototype.slice;
  define("min", function() {
    var $, Min, drews, eventBus, eventer, mobilemin, nimble, severus, _;
    $ = require("jquery");
    _ = require("underscore");
    nimble = require("nimble");
    drews = require("drews-mixins");
    severus = require("severus2")();
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
        var day, days, daysHtml, _i, _len;
        days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        daysHtml = {};
        for (_i = 0, _len = days.length; _i < _len; _i++) {
          day = days[_i];
          daysHtml = {};
        }
        return "<!doctype html>\n<html>\n<head>\n  <title>" + attrs.title + "</title>\n  <meta name=\"viewport\" content=\"width=device-width\" />\n  <link rel=\"stylesheet\" href=\"http://drewl.us:8010/styles.css\" />\n</head>\n<body>\n  <div class=\"header\">\n    <div class=\"top-bar header-gradient\">\n      <div class=\"headerWrapper\">\n        <h1><img src=\"" + attrs.headerUrl + "\" class=\"header-image\"/></h1>\n      </div>\n      <!--<div class=\"right left\">\n        <div class=\"phone\">\n          " + attrs.phone + "\n        </div>\n        <div class=\"crossStreets\">\n          <a href=\"#map\">\n          " + attrs.crossStreets + "\n          </a>\n        </div>\n        <div class=\"open\"> </div>\n      </div>\n      <div class=\"clear\"></div>\n      -->\n    </div>\n    <div class=\"second-bar second-bar-gradient\">\n      <div class=\"headline\">\n        " + attrs.headline + "\n      </div>\n      <div class=\"clear\"></div>\n    </div>\n  </div> <!-- header div -->\n  <div class=\"content content-gradient\">\n  </div>\n  <script src=\"module.js\"></script>\n  <script src=\"http://inc.the.tl/underscore.js\"></script>\n  <script src=\"http://inc.the.tl/nimble.js\"></script>\n  <script src=\"http://inc.the.tl/drews-mixins.js\"></script>\n  <script src=\"http://severus.drewl.us/severus2.js\"></script>\n  <script src=\"zepto.min.js\"></script>\n  <script src=\"http://inc.the.tl/drews-event.js\"></script>\n  <script>\n    define(\"model\", function() {\n      return " + (JSON.stringify(self.attrs)) + ";\n    });\n  </script>\n  <!--<script src=\"index.js\"></script>-->\n  <script src=\"http://drewl.us:8010/router.js\"></script>\n  <script src=\"http://drewl.us:8010/index.js\"></script>\n</body>";
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