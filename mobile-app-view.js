(function() {
  define("mobile-app-view", function() {
    var $, drews, eventer, mobileAppViewMaker, nimble, severus, _;
    $ = require("jquery");
    _ = require("underscore");
    nimble = require("nimble");
    drews = require("drews-mixins");
    severus = require("severus");
    severus.db = "mobilemin_dev";
    eventer = require("drews-event");
    return mobileAppViewMaker = function(self) {
      var el;
      if (self == null) {
        self = {};
      }
      self = eventer(self);
      el = $("<div>hi</div>");
      self.getEl = function() {
        return el;
      };
      return self;
    };
  });
}).call(this);
