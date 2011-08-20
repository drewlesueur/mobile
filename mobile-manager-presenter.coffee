define "mobile-manager-presenter", () -> 
  mobileManagerView = require "mobile-manager-view"
  mobileAppMaker = require "mobile-app"
  mobileAppViewMaker = require "mobile-app-view"
  mobileAppPresenterMaker = require "mobile-app-presenter"
  mobileAppPresenterViewMaker = require "mobile-app-presenter-view"
  infoViewMaker = require "info-view"
  mobileManagerPresenter = () ->
    self = {}
    view = mobileManagerView()
    apps = []

    infoView = infoViewMaker()
    info = (args...) ->
      infoView.info args...
    clear = (args...) ->
      infoView.clear args...

    load = self.load = ->
      view.clearNav()
      view.clearApps()
      loading = info "loading mobile sites"
      mobileAppMaker.find (err, _apps) ->
        apps = []
        console.log _apps
        _.each _apps, (app, index) ->
          app = mobileAppMaker app
          addApp app
        clear loading

    addApp = (mobileApp) ->
      apps.push mobileApp
      mobileAppPresenter = mobileAppPresenterMaker()
      mobileAppPresenter.setApp mobileApp
      mobileAppPresenter.view = mobileAppPresenterViewMaker model: mobileAppPresenter
      view.addApp mobileAppPresenter
      mobileAppPresenter.view.on "remove", () ->
        deleting = info "Removing #{mobileAppPresenter.get "name"}"
        mobileAppPresenter.remove (err) ->
          clear deleting 
      mobileAppPresenter.on "remove", () ->
        mobileAppPresenter.view.remove()


        


    newApp = () ->
      view.clearNav()
      mobileApp = mobileAppMaker
        name: prompt("name")
      #TODO: you are adding before you know it worked
      saving = info "initiating new app"
      mobileApp.save () ->
        addApp mobileApp
        clear saving 

    load()

    navMap =
      new: newApp
      load: load
    view.on "nav", (place) ->
      fn = navMap[place]
      fn?()


    view.initNav()
    

    self.getEl = -> view.getEl()
    self.getInfoEl = -> infoView.getEl()


    self
