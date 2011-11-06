define "editor-presenter", () ->
  App = require "app"
  EditorView = require "editor-view"
  class EditorPresenter extends Presenter
    constructor: ->
      @app = new App()
      @view = new EditorView()
      @applyBindings()

    getApps: ->
      @app.find()

    applyBindings: =>
      @app.bind "found", (apps) =>
        @view.populateApps(apps)

      @view.bind "appclick", (app) =>
        @view.populateSingleApp(app) 



        



