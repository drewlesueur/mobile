(function() {
  var __slice = Array.prototype.slice;
  define("mobile-app-presenter", function() {
    var $, drews, eventer, mobileAppMaker, mobileAppPresenterMaker, mobileAppViewMaker, nimble, severus, _;
    $ = require("jquery");
    _ = require("underscore");
    nimble = require("nimble");
    drews = require("drews-mixins");
    severus = require("severus");
    severus.db = "mobilemin_dev";
    mobileAppMaker = require("mobile-app");
    mobileAppViewMaker = require("mobile-app-view");
    eventer = require("drews-event");
    return mobileAppPresenterMaker = function(self) {
      var emit, loadApp, model, setApp, view;
      if (self == null) {
        self = {};
      }
      self = eventer(self);
      model = null;
      view = null;
      emit = self.emit;
      setApp = function(_app) {
        model = _app;
        model.view = mobileAppViewMaker({
          model: model
        });
        view = model.view;
        model.on("remove", function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return emit.apply(null, ["remove", model].concat(__slice.call(args)));
        });
        return model.on("save", function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return emit.apply(null, ["save", model].concat(__slice.call(args)));
        });
      };
      self.setApp = setApp;
      loadApp = function(name, cb) {
        return mobileAppMaker.find({
          name: "name"
        }, function(err, _app) {
          model = mobileAppMaker(_app);
          model.view = mobileAppViewMaker({
            model: model
          });
          return view = model.view;
        });
      };
      self.loadApp = loadApp;
      self.set = function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return model.set.apply(model, args);
      };
      self.get = function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return model.get.apply(model, args);
      };
      self.remove = function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return model.remove.apply(model, args);
      };
      return self;
    };
  });
}).call(this);
