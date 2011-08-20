(function() {
  define("mobile-manager-view", function() {
    var $, eventer, mobileManagerView, _;
    $ = require("jquery");
    eventer = require("drews-event");
    _ = require("underscore");
    return mobileManagerView = function(self) {
      var clearNav, el, emit, navTo;
      if (self == null) {
        self = {};
      }
      self = eventer(self);
      emit = self.emit;
      el = " \n<div class=\"phone\">\n  <div class=\"screen\">\n   </div>\n</div>\n<div class=\"ctrls\">\n <a href=\"#new\">New app</a>\n <a href=\"#load\">load</a>\n</div>\n<div class=\"apps\">\n  <ul>\n  </ul>\n</div>";
      self.getEl = function() {
        return el;
      };
      self.addApp = function(app) {
        return $(".apps ul").append(app.view.getEl());
      };
      self.clearApps = function() {
        return $(".apps ul").empty();
      };
      self.initNav = function() {
        var hash;
        hash = location.hash.slice(1);
        emit("nav", hash);
        return $(window).bind("hashchange", function(e) {
          hash = location.hash.slice(1);
          return emit("nav", hash);
        });
      };
      navTo = function() {
        return window.location.hash = "#";
      };
      self.navTo = navTo;
      clearNav = function() {
        return navTo("");
      };
      self.clearNav = clearNav;
      return self;
    };
  });
}).call(this);
