(function() {
  var __slice = Array.prototype.slice;
  define("drews-event", function() {
    var drews, drewsEventMaker;
    drews = require("drews-mixins");
    return drewsEventMaker = function(obj) {
      var triggeree;
      triggeree = obj;
      obj.setTriggeree = function(_trig) {
        return triggeree = _trig;
      };
      obj.setEmittee = obj.setTriggeree;
      obj.on = function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return drews.on.apply(drews, [obj].concat(__slice.call(args)));
      };
      obj.emit = function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return drews.trigger.apply(drews, [triggeree].concat(__slice.call(args)));
      };
      obj.trigger = obj.emit;
      return obj;
    };
  });
}).call(this);
