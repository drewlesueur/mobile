define "app", ->
  Severus = require("severus2")

  class App extends Backbone.Model
    constructor: ->
      @severus = Severus.init()
      @severus.db = "mobilemin_dev"
    find: (stuff) ->
      @severus.find "mins", stuff, @onFound

    onFound: (err, apps) =>
      if not err
        @trigger "found", apps

  
