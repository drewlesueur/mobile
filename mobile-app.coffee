define "mobile-app", () ->
  $ = require "jquery" 
  _ = require "underscore"
  nimble = require "nimble"
  drews = require "drews-mixins"
  severus = require "severus"
  severus.db = "mobilemin_dev"
  eventer = require "drews-event"
  mobileAppMaker = (attrs={}) ->
    
    self = eventer {}
    self.attrs = attrs
    {emit} = self
    
    save = (cb=->) ->
      emit "saving"
      severus.save "mobileapps", attrs, (err, _mobileApp) ->
        _.extend attrs, _mobileApp
        emit "save", self
        cb err, self
    self.save = save

    remove = (cb) ->
      emit "removing"
      severus.remove "mobileapps", attrs._id, (args...) ->
        emit "remove", self
        cb args...
    self.remove = remove

    self.set = (obj, val) ->
      if _.isString obj
        attrs[obj] = val
      else
        _.extend attrs, obj

    self.get = (prop) -> attrs[prop]
    self


  mobileAppMaker.find = (args...) ->
    severus.find "mobileapps", args...
  mobileAppMaker
