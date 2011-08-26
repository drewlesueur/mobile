  
define "min", () ->
  $ = require "jquery" 
  _ = require "underscore"
  nimble = require "nimble"
  drews = require "drews-mixins"
  severus = require "severus"
  severus.db = "mobilemin_dev"
  eventBus = require "event-bus"
  eventer = require "drews-event"
  Min = eventer {}
  Min.init = (attrs={}) ->
    self = {}
    self.attrs = attrs
    self = eventer self
    _emit = self.emit
    emit = (event, args...) ->
      _emit event, args...
      Min.emit event, self, args...
    
    save = (cb=->) ->
      emit "saving"
      severus.save "mins", attrs, (err, _mobileApp) ->
        _.extend attrs, _mobileApp
        emit "action", "save"
        emit "save"
        cb err, self
    self.save = save

    remove = (cb=->) ->
      emit "removing"
      severus.remove "mins", attrs._id, (args...) ->
        emit "remove"
        cb args...
    self.remove = remove

    self.set = (obj, val) ->
      if _.isString obj
        attrs[obj] = val
      else
        _.extend attrs, obj

    self.get = (prop) -> attrs[prop]
    Min.emit "init", self

    self

  Min.find = (args..., cb) ->
    models = []
    severus.find "mins", args..., (err, models) ->
      for model in models
        models.push Min.init model
      Min.emit "find", models, Min
      cb err, models
  Min
