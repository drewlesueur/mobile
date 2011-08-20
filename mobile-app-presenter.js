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
      var emit, getModel, loadApp, model, setApp, view;
      if (self == null) {
        self = {};
      }
      self = eventer(self);
      model = null;
      view = null;
      emit = self.emit;
      getModel = function() {
        return model;
      };
      setApp = function(_app) {
        model = _app;
        model.view = mobileAppViewMaker({
          model: model
        });
        view = model.view;
        view.on("modelviewvalchanged", function(_model, prop, val) {
          model.set(prop, val);
          return model.save();
        });
        view.on("newheaderimage", function(files) {
          var file, reader;
          file = files[0];
          reader = new FileReader();
          reader.onload = function(e) {
            alert("loaded");
            return view.setHeaderUrl(e.target.result);
          };
          return reader.readAsDataURL(file);
        });
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
          return setApp(model);
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
