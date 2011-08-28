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
        $('.info-form').each(function() {
          return this.reset();
        });
        return _.each(_.keys(min.attrs), function(prop) {
          var input;
          input = $(".info-form [name=\"" + prop + "\"]");
          if (input.is('[type="checkbox"]')) {
            return input.prop("checked", min.get(prop));
          } else {
            return input.val(min.get(prop));
          }
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
          if ($(this).is('[type="checkbox"]')) {
            val = $(this).is(":checked");
            console.log("" + prop + " is " + val);
          } else {
            val = $(this).val();
          }
          hash[prop] = val;
          return true;
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
