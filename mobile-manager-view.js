(function() {
  define("mobile-manager-view", function() {
    var $, eventer, mobileManagerView, _;
    $ = require("jquery");
    eventer = require("drews-event");
    _ = require("underscore");
    return mobileManagerView = function(self) {
      var app, clearNav, el, emit, navTo, screen, showApp;
      if (self == null) {
        self = {};
      }
      self = eventer(self);
      emit = self.emit;
      el = $(" \n <div class=\"container\">\n  <div class=\"row show-grid\">\n    <div class=\"apps span4 column\">\n      <ul class=\"unstyled zebra-striped\">\n      </ul>\n    </div>\n    <div class=\"phone span6 column\">\n      <div class=\"screen\">\n       </div>\n    </div>\n    <div class=\"ctrls span6 column\">\n     <a class=\"new\" href=\"#\">New app</a>\n     <div class=\"uploads\">\n     </div>\n     <div class=\"form\">\n     </div>\n    </div>\n  </div>\n</div>");
      el.find(".new").bind("click", function() {
        return emit("new");
      });
      app = null;
      self.getApp = function() {
        return app;
      };
      screen = el.find(".screen");
      self.getEl = function() {
        return el;
      };
      self.addApp = function(app) {
        $(".apps ul").append(app.view.getEl());
        el.find(".form").empty();
        return el.find(".form").append(app.view.getFormEl());
      };
      showApp = self.showApp = function(_app) {
        app = _app;
        screen.empty();
        return screen.append(app.view.getEl());
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
      self.addFileBoxProgress = function(filebox) {
        return el.find(".uploads").append(filebox.getProgressBars());
      };
      return self;
    };
  });
}).call(this);
