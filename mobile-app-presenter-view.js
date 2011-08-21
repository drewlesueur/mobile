(function() {
  define("mobile-app-presenter-view", function() {
    var $, drews, eventer, mobileAppPresenterViewMaker, nimble, severus, _;
    $ = require("jquery");
    _ = require("underscore");
    nimble = require("nimble");
    drews = require("drews-mixins");
    severus = require("severus");
    severus.db = "mobilemin_dev";
    eventer = require("drews-event");
    return mobileAppPresenterViewMaker = function(self) {
      var el, emit, model, name;
      if (self == null) {
        self = {};
      }
      self = eventer(self);
      model = self.model, emit = self.emit;
      name = model.get("name");
      el = $("<li>\n  <a href=\"#apps/" + name + "\">" + name + "</a> <a class=\"remove\" href=\"#\">[delete]</a>\n</li>");
      el.find(".remove").bind("click", function(e) {
        e.preventDefault();
        if (confirm("Are you sure you want to delete " + name + "?")) {
          return emit("remove");
        }
      });
      self.getEl = function() {
        return el;
      };
      self.remove = function() {
        return el.remove();
      };
      return self;
    };
  });
}).call(this);
