emitAller = (emit, name) ->
  (event, args...) ->
    emit name, event, args...
    emit "min.#{event}", args...
  
define "min", () ->
  $ = require "jquery" 
  _ = require "underscore"
  nimble = require "nimble"
  drews = require "drews-mixins"
  severus = require "severus"
  severus.db = "mobilemin_dev"
  eventBus = require "event-bus"
  Min = {}
  Min.init = (attrs={}) ->
    self.attrs = attrs
    _emit = eventBus.selfEmitter self
    emit = emitAller _emit, "action"
    
    save = (cb=->) ->
      emit "saving"
      severus.save "mins", attrs, (err, _mobileApp) ->
        _.extend attrs, _mobileApp
        emit "action", "save"
        emit "save"
        cb err, self
    self.save = save

    remove = (cb) ->
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
    emit "init"
    self

  Min.find = (args..., cb) ->
    emit = eventBus.selfEmitter Min
    emit "finding"
    models = []
    severus.find "mins", args..., (err, models) ->
      for model in models
        models.push Min.init model
      emit "find", models, Min
      cb err, models


  Min
