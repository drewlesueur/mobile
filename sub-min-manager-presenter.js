(function() {
  define("sub-min-manager-presenter", function() {
    var Min, SubMinManagerPresenter, SubMinManagerView, eventBus;
    eventBus = require("event-bus");
    Min = require("min");
    SubMinManagerView = require("sub-min-manager-view");
    SubMinManagerPresenter = {};
    SubMinManagerPresenter.init = function(self) {
      var bind, emit;
      if (self == null) {
        self = {};
      }
      emit = eventBus.selfEmitter(self);
      bind = eventBus.bind;
      return bind("min.init", function(model) {
        return model.view = SubMinManagerView.init({
          model: model,
          presener: self
        });
      });
    };
    return SubMinManagerPresenter;
  });
}).call(this);
