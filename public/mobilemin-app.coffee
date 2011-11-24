Severus = dModule.require "severus2"

class MobileMinApp 
  constructor: ->
    @severus = Severus.init()
    @severus.db = "mobilemin_dev"
    @data = Severus.init()

  find: (what, callback=->) =>
    mmCallback = (err, apps) =>
      @app = apps[0]
      callback(err, apps)
      @data.db = "mobilemin_#{@app.name}"

    @severus.find "mins", what, mmCallback
    mmCallback

  findPhones: (what, callback=->) =>
    @data.find "phones", what, callback


dModule.define "mobilemin-app", -> MobileMinApp
