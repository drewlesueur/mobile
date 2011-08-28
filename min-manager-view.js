(function() {
  define('min-manager-view', function() {
    var MinManagerView, eventBus, eventer;
    eventBus = require("event-bus");
    eventer = require("drews-event");
    MinManagerView = eventer({});
    MinManagerView.init = function(self) {
      var emit, model;
      if (self == null) {
        self = {};
      }
      self = eventer(self);
      model = self.model, emit = self.emit;
      self.addMin = function(min) {
        console.log(min.subView);
        return $('.apps').append(min.subView.el);
      };
      $('.new').bind("click", function(e) {
        var name;
        e.preventDefault();
        name = prompt("Name?");
        emit("new", name);
        return false;
      });
      $('.info-form').bind("submit", function(e) {
        e.preventDefault();
        return emit("save");
      });
      self.removeMin = function(min) {
        return min.subView.remove();
      };
      return self;
    };
    return MinManagerView;
  });
}).call(this);
