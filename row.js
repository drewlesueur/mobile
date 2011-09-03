(function() {
  var __slice = Array.prototype.slice;
  define("row-maker", function() {
    return function(type) {
      var $, Row, drews, eventer, nimble, severus, _;
      $ = require("jquery");
      _ = require("underscore");
      nimble = require("nimble");
      drews = require("drews-mixins");
      severus = require("severus2")();
      severus.db = type;
      eventer = require("drews-event");
      Row = eventer({});
      Row.init = function(attrs) {
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
          return Row.emit.apply(Row, [event, self].concat(__slice.call(args)));
        };
        save = function(cb) {
          if (cb == null) {
            cb = function() {};
          }
          emit("saving");
          return severus.save("Rows", attrs, function(err, _mobileApp) {
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
          return severus.remove("Rows", attrs._id, function() {
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
          return "<!doctype html>\n<html>\n<head>\n  <title>" + attrs.title + "</title>\n  <meta name=\"viewport\" content=\"width=device-width\" />\n  <link rel=\"stylesheet\" href=\"http://drewl.us:8010/styles.css\" />\n</head>\n<body>\n  <div class=\"header\">\n    <h1><img src=\"" + attrs.headerUrl + "\" class=\"header-image\"/></h1>\n    <div class=\"phone\">\n      " + attrs.phone + "\n    </div>\n    <div class=\"open\">\n    </div>\n  </div> <!-- header div -->\n  <div class=\"content\">\n  </div>\n  <script src=\"module.js\"></script>\n  <script src=\"http://inc.the.tl/underscore.js\"></script>\n  <script src=\"http://inc.the.tl/nimble.js\"></script>\n  <script src=\"http://inc.the.tl/drews-mixins.js\"></script>\n  <script src=\"http://severus.drewl.us/severus2.js\"></script>\n  <script src=\"zepto.min.js\"></script>\n  <script src=\"http://inc.the.tl/drews-event.js\"></script>\n  <script>\n    define(\"model\", function() {\n      return " + (JSON.stringify(self.attrs)) + ";\n    });\n  </script>\n  <!--<script src=\"index.js\"></script>-->\n  <script src=\"http://drewl.us:8010/router.js\"></script>\n  <script src=\"http://drewl.us:8010/index.js\"></script>\n</body>";
        };
        self["export"] = function() {
          return mobileRow.saveSite(attrs.name, toHtml());
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
        Row.emit("init", self);
        return self;
      };
      Row.find = function() {
        var args, cb, models, _i;
        args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
        models = [];
        return severus.find.apply(severus, ["Rows"].concat(__slice.call(args), [function(err, models) {
          var model, _j, _len;
          for (_j = 0, _len = models.length; _j < _len; _j++) {
            model = models[_j];
            models.push(Row.init(model));
          }
          Row.emit("find", models, Row);
          return cb(err, models);
        }]));
      };
      return Row;
    };
  });
}).call(this);
