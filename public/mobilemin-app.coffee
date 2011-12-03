Severus = dModule.require "severus2"

class MobileMinApp 
  constructor: ->
    @severus = Severus.init()
    @severus.db = "new_mobilemin"
    @data = Severus.init()

  find: (what, callback=->) =>
    mmCallback = (err, apps) =>
      @app = apps[0]
      callback(err, apps)
      @data.db = "new_mobilemin"

    @severus.find "apps", what, mmCallback
    mmCallback

  findPhones: (what, callback=->) =>
    @data.find "app_#{@name}_phones", what, callback


dModule.define "mobilemin-app", -> MobileMinApp
