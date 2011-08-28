(function() {
  define("min-manager-presenter", function() {
    var Min, MinManagerPresenter, MinManagerView, SubMinManagerView, eventBus, eventer;
    eventBus = require("event-bus");
    eventer = require("drews-event");
    Min = require("min");
    MinManagerView = require("min-manager-view");
    SubMinManagerView = require("sub-min-manager-view");
    MinManagerPresenter = {};
    MinManagerPresenter.init = function(self) {
      var currentMin, emit, mins, view;
      if (self == null) {
        self = {};
      }
      self = eventer(self);
      emit = self.emit;
      view = MinManagerView.init();
      mins = [];
      currentMin = null;
      SubMinManagerView.on("remove", function(min) {
        return min.remove();
      });
      SubMinManagerView.on("export", function(min) {
        return min["export"]();
      });
      SubMinManagerView.on("load", function(min) {
        currentMin = min;
        return view.loadMin(min);
      });
      Min.find(null, function(err, _mins) {
        return mins = _mins;
      });
      Min.on("init", function(min) {
        min.subView = SubMinManagerView.init({
          model: min
        });
        currentMin = min;
        view.addMin(min);
        return view.loadMin(min);
      });
      Min.on("action", function(action, min) {});
      Min.on("remove", function(min) {
        return view.removeMin(min);
      });
      view.on("change", function(min, prop, val) {
        return min.set(prop, val);
      });
      view.on("new", function(name) {
        var model;
        model = Min.init({
          name: name
        });
        return model.save();
      });
      return view.on("save", function(hash) {
        currentMin.set(hash);
        console.log(JSON.stringify(currentMin.attrs));
        return currentMin.save(function() {
          return currentMin["export"]();
        });
      });
    };
    return MinManagerPresenter;
  });
}).call(this);
