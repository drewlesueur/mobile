(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  define("app", function() {
    var App, Severus;
    Severus = require("severus2");
    return App = (function() {
      __extends(App, Backbone.Model);
      function App() {
        this.onFound = __bind(this.onFound, this);        this.severus = Severus.init();
        this.severus.db = "mobilemin_dev";
      }
      App.prototype.find = function(stuff) {
        return this.severus.find("mins", stuff, this.onFound);
      };
      App.prototype.onFound = function(err, apps) {
        if (!err) {
          return this.trigger("found", apps);
        }
      };
      return App;
    })();
  });
}).call(this);
