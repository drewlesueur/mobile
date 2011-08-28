(function() {
  define('min-manager-view', function() {
    var MinManagerView, eventBus, eventer, nimble, _;
    _ = require("underscore");
    nimble = require("nimble");
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
        return $('.apps').append(min.subView.el);
      };
      self.loadMin = function(min) {
        return _.each(_.keys(min.attrs), function(prop) {
          return $(".info-form [name=\"" + prop + "\"]").val(min.get(prop));
        });
      };
      $('.new').bind("click", function(e) {
        var name;
        e.preventDefault();
        name = prompt("Name?");
        emit("new", name);
        return false;
      });
      $('.info-form').bind("submit", function(e) {
        var hash;
        e.preventDefault();
        hash = {};
        $(".info-form [name]").each(function() {
          var prop, val;
          prop = $(this).attr("name");
          val = $(this).val();
          return hash[prop] = val;
        });
        return emit("save", hash);
      });
      self.removeMin = function(min) {
        return min.subView.remove();
      };
      return self;
    };
    return MinManagerView;
  });
}).call(this);
