(function() {
  define("mobile-manager-view", function() {
    var $, eventer, mobileManagerView, _;
    $ = require("jquery");
    eventer = require("drews-event");
    _ = require("underscore");
    return mobileManagerView = function(self) {
      var el, emit, hash;
      if (self == null) {
        self = {};
      }
      self = eventer(self);
      emit = self.emit;
      el = " \n<div class=\"phone\">\n  <div class=\"screen\">\n   </div>\n</div>\n<div class=\"apps\">\n  <ul>\n  </ul>\n</div>";
      $(document.body).find('.body-wrapper').append(el);
      self.addAppToList = function(app) {
        var name;
        name = app.get("name");
        return $(".apps ul").append("<li>\n  <a href=\"#" + name + "\">name</a>\n</li>");
      };
      hash = location.hash.slice(1);
      emit("nav", hash);
      console.log(hash);
      $(window).bind("hashchange", function(e) {
        hash = location.hash.slice(1);
        emit("nav", hash);
        return console.log(hash);
      });
      return self;
    };
  });
}).call(this);
