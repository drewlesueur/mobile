(function() {
  var __slice = Array.prototype.slice;
  define("event-bus", function() {
    var EventBus, eventer;
    eventer = require("drews-event");
    EventBus = eventer({});
    return EventBus.selfEmitter = function(obj) {
      return function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return EventBus.emit.apply(EventBus, [obj].concat(__slice.call(args)));
      };
    };
  });
}).call(this);
