(function() {
  var __slice = Array.prototype.slice;
  define("event-bus", function() {
    var eventBus, eventer;
    eventer = require("drews-event");
    eventBus = eventer({});
    eventBus.selfEmitter = function(obj) {
      return function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return eventBus.emit.apply(eventBus, [obj].concat(__slice.call(args)));
      };
    };
    eventBus.bind = eventBus.on;
    return eventBus;
  });
}).call(this);
