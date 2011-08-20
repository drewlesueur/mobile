define "mobile-app-presenter", () ->
  $ = require "jquery" 
  _ = require "underscore"
  nimble = require "nimble"
  drews = require "drews-mixins"
  severus = require "severus"
  severus.db = "mobilemin_dev"
  mobileAppMaker = require "mobile-app"
  mobileAppViewMaker = require "mobile-app-view"
  eventer = require "drews-event"
  mobileAppPresenterMaker = (self={}) ->
    self = eventer self
    model = null 
    view = null
    {emit} = self

    getModel = () -> model

    setApp = (_app) ->
      model = _app
      model.view = mobileAppViewMaker model: model
      view = model.view

      model.on "remove", (args...) ->
        emit "remove", model, args...

      model.on "save", (args...) ->
        emit "save", model, args...
    self.setApp = setApp

    loadApp = (name, cb) ->
      mobileAppMaker.find name:"name", (err, _app) ->
        model = mobileAppMaker _app
        model.view = mobileAppViewMaker model: model
        view = model.view
    self.loadApp = loadApp

    self.set = (args...) ->
      model.set args...

    self.get = (args...) ->
      model.get args...

    self.remove = (args...) ->
      model.remove args...

         







    self
