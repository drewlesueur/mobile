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

    models = []
   

    initOneModel = (_model) ->
      model = _model
      presenter = mobileAppPresenterMaker
      presenter.initModel model
      view = mobileAppViewMaker model: model
      model.view = view
      model

    loadModels = self.loadModels = ->
      mobileAppMaker.find (err, _models) ->
        models = []
        _.each _models, (_model, index) ->
          initModel model
        initView()

