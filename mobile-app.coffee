define "mobile-app", () ->
  $ = require "jquery" 
  nimble = require "nimble"
  drews = require "drews-mixins"
  severus = require "severus"
  severus.db = "mobilemin_dev"
  eventer = require "drews-event"
  mobileAppMaker = (self={}) ->
    attrs = []

    self = eventer self
    {emit} = self
    
    save = () ->
      severus.save "mobileapps", attrs, (err, _mobileApp) ->
      _.extend attrs, _mobileApp
      cb err, self
    self.save = save

    remove = (cb) ->
      severus.remove "listings", attrs._id, cb
    self.remove = remove

    self.set = (obj, val) ->
      if _.isString obj
        attrs[obj] = val
      else
        _.extend attrs, obj

    self.get = (prop) -> attrs[prop]


  mobileAppMaker.find = (args...) ->
    severus.find "mobileapps", args
  mobileAppMaker
