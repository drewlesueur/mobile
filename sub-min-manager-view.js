(function() {
  define("sub-min-manager-view", function() {
    var SubMinManagerView, eventBus, eventer;
    SubMinManagerView = {};
    eventBus = require("event-bus");
    eventer = require("drews-event");
    SubMinManagerView = eventer({});
    SubMinManagerView.init = function(self) {
      var el, emit, model;
      if (self == null) {
        self = {};
      }
      self = eventer(self);
      model = self.model, emit = self.emit;
      el = $("<div>\n  <span>" + (model.get("name")) + "</span>\n  <a href=\"#\" class=\"remove\">Delete</a>\n</div>");
      self.el = function() {
        return el;
      };
      return SubMinManagerView.emit("init");
    };
    return SubMinManagerView;
  });
}).call(this);
