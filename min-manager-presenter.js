(function() {
  define("min-manager-presenter", function() {
    var Min, MinManagerPresenter, eventBus;
    eventBus = require("event-bus");
    Min = require("min");
    MinManagerPresenter = {};
    return MinManagerPresenter.init = function(self) {
      var bind, clear, emit, info, infoView, view;
      if (self == null) {
        self = {};
      }
      emit = eventBus.selfEmitter(self);
      bind = eventBus.bind;
      view = MinManagerView.init();
      infoView = InfoView.init();
      info = infoView.info, clear = infoView.clear;
      SubMinManagerPresenter.init();
      MinManagerPresenter.init();
      bind("subminmanagerview.selectmin", function(min) {
        return view.model(model);
      });
      bind("subminmanagerview.remove", function(min) {
        return min.remove();
      });
      bind("min.action", function(action, min) {
        return info(action);
      });
      bind("minmanagerview.change", function(min, prop, val) {
        return min.set(prop, val);
      });
      return bind("minmanagerview.header");
    };
  });
}).call(this);
