Severus = dModule.require "severus2"
#TODO: handle errors!!
class MobileMinApp 
  constructor: ->
    @data = Severus.init()
    @data.db = "new_mobilemin"

  find: (what, callback=->) =>
    mmCallback = (err, apps) =>
      @app = apps[0]
      callback(err, apps)
      @data.db = "new_mobilemin"

    @data.find "apps", what, mmCallback
    mmCallback

  findPhones: (what, callback=->) =>
    @data.find "app_#{@app.firstPhone.replace(/\W/, "")}_phones", what, callback

  createApp: (props, cb) =>
    self = this
    saveCallback = (err, app) =>
      @app = app
      cb(null, self)
    @data.save "apps", props, saveCallback
    return saveCallback


dModule.define "mobilemin-app", -> MobileMinApp
