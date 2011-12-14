Severus = dModule.require "severus2"
#TODO: handle errors!!
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
    @data.find "app_#{@app.name}_phones", what, callback

  createApp: (props, cb) =>
    self = this
    saveCallback = (err, app) =>
      @app = app
      cb(null, self)
    @data.save "apps", props, saveCallback
    return saveCallback


dModule.define "mobilemin-app", -> MobileMinApp
