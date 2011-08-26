define "event-bus", () ->
  eventer = require "drews-event"
  eventBus = eventer {}
  eventBus.selfEmitter = (obj) ->
    (args...) ->
      eventBus.emit obj, args...
  eventBus.bind = eventBus.on
  eventBus
