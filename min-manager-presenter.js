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
      var emit, mins, view;
      if (self == null) {
        self = {};
      }
      self = eventer(self);
      emit = self.emit;
      view = MinManagerView.init();
      mins = [];
      Min.find(null, function(err, _mins) {
        return mins = _mins;
      });
      Min.on("init", function(min) {
        min.subView = SubMinManagerView.init({
          model: min
        });
        return view.addMin(min);
      });
      SubMinManagerView.on("selectmin", function(min) {
        return view.model(model);
      });
      SubMinManagerView.on("remove", function(min) {
        return min.remove();
      });
      Min.on("action", function(action, min) {});
      view.on("change", function(min, prop, val) {
        return min.set(prop, val);
      });
      return view.on("new", function(name) {
        return console.log(name);
      });
    };
    return MinManagerPresenter;
  });
}).call(this);
