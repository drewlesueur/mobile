(function() {
  define('min-manager-view', function() {
    var MinManagerView, eventBus;
    eventBus = require("event-bus");
    MinManagerView = {};
    return MinManagerView.init = function(self) {
      var model;
      if (self == null) {
        self = {};
      }
      model = self.model.model;
      return self.model = function(_model) {
        if (!_model) {
          return model;
        }
        return model = _model;
      };
    };
  });
}).call(this);
