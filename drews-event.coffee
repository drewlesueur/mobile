define "drews-event", () ->
  drews = require "drews-mixins"
  drewsEventMaker = (obj) ->
    triggeree = obj
    obj.setTriggeree = (_trig) ->
      triggeree = _trig 
    obj.on = (args...) ->
      drews.on obj, args...
    obj.emit = (args...) ->
      drews.trigger triggeree, args...
    obj
