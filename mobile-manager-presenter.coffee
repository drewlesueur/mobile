define "mobile-manager-presenter", () -> 
  mobileManagerView = require "mobile-manager-view"
  mobileAppMaker = require "mobile-app"
  mobileAppViewMaker = require "mobile-app-view"
  mobileAppPresenterMaker = require "mobile-app-presenter"
  mobileAppPresenterViewMaker = require "mobile-app-presenter-view"
  infoViewMaker = require "info-view"
  routerMaker = require "router"
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
      view.clearApps()
      loading = info "loading mobile sites"
      mobileAppMaker.find (err, _apps) ->
        apps = []
        console.log _apps
        _.each _apps, (app, index) ->
          app = mobileAppMaker app
          addApp app
        clear loading
        view.initNav()

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
      saving = null
      mobileApp.on "saving", () ->
        saving = info "saving #{mobileApp.get("name")}"
      mobileApp.on "save", () ->
        clear saving


    newApp = () ->
      mobileApp = mobileAppMaker
        name: prompt("name")
      #TODO: you are adding before you know it worked
      saving = info "initiating new app"
      mobileApp.save () ->
        addApp mobileApp
        clear saving 

    loadApp = (mobileApp) ->
      view.showApp mobileApp
      
    loadAppByName = (path, name) ->
      mobileApp = null
      found = _.any apps, (app) ->
        console.log """
          checking #{app.get("name")} == #{name}
        """
        if app.get("name") == name
          mobileApp = app
          return true
      if found
        console.log mobileApp
        loadApp mobileApp
      
      

      

    load()
    
    router = routerMaker
      load: load
      "apps/:name": loadAppByName
   


    view.on "nav", (place) ->
      router.testRoutes place

    view.on "new", newApp

    

    self.getEl = -> view.getEl()
    self.getInfoEl = -> infoView.getEl()


    self
