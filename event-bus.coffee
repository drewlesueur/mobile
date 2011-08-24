define "event-bus", () ->
  eventer = require "drews-event"
  EventBus = eventer {}
  EventBus.selfEmitter = (obj) ->
    (args...) ->
      EventBus.emit obj, args...
