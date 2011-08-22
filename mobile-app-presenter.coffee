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
    self.model = () -> model
    self.view = () -> view 
   

    initModel = (_model) ->
      model = mobileAppMaker _model
      view = mobileAppViewMaker model: model
      model.view = view
      initView()
      model
    self.initModel = initModel

    self.loadModel = (info) ->
      mobileAppMaker.find info, (err, _models) ->
        initModel _models[0]
        model

    initView = () ->
      view.on "change", (model, prop, val) ->
        model.set prop, val
        model.save()



      



         







    self
