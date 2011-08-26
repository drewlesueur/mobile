(function() {
  var emitAller;
  var __slice = Array.prototype.slice;
  emitAller = function(emit, name) {
    return function() {
      var args, event;
      event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      emit.apply(null, [name, event].concat(__slice.call(args)));
      return emit.apply(null, ["min." + event].concat(__slice.call(args)));
    };
  };
  define("min", function() {
    var $, Min, drews, eventBus, nimble, severus, _;
    $ = require("jquery");
    _ = require("underscore");
    nimble = require("nimble");
    drews = require("drews-mixins");
    severus = require("severus");
    severus.db = "mobilemin_dev";
    eventBus = require("event-bus");
    Min = {};
    Min.init = function(attrs) {
      var emit, remove, save, _emit;
      if (attrs == null) {
        attrs = {};
      }
      self.attrs = attrs;
      _emit = eventBus.selfEmitter(self);
      emit = emitAller(_emit, "action");
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
        emit("removing");
        return severus.remove("mins", attrs._id, function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          emit("remove");
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
      emit("init");
      return self;
    };
    Min.find = function() {
      var args, cb, emit, models, _i;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
      emit = eventBus.selfEmitter(Min);
      emit("finding");
      models = [];
      return severus.find.apply(severus, ["mins"].concat(__slice.call(args), [function(err, models) {
        var model, _j, _len;
        for (_j = 0, _len = models.length; _j < _len; _j++) {
          model = models[_j];
          models.push(Min.init(model));
        }
        emit("find", models, Min);
        return cb(err, models);
      }]));
    };
    return Min;
  });
}).call(this);
