define "mobile-manager-presenter", () -> 
  mobileManagerPresenter = () ->
    mobileManagerView = require "mobile-manager-view"
    mobileAppMaker = require "mobile-app"
    self = {}
    view = mobileManagerView()
    apps = []
    mobileAppMaker.find (err, _apps) ->
      apps = []
      _.each _apps, (app, index) ->
        apps.push app
        view.addAppToList app



    self
