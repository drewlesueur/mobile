Severus = dModule.require "severus2"
#TODO: handle errors!!
drews = dModule.require "drews-mixins"
class MobileMinApp 
  constructor: ->
    @data = Severus.init()
    @data.db = "new_mobilemin"
    @app = {}
    drews.makeEventful this
    

  find: (what, callback=->) =>
    mmCallback = (err, apps) =>
      @app = apps[0]
      callback(err, apps)
      @data.db = "new_mobilemin"

    @data.find "apps", what, mmCallback
    mmCallback

  findPhones: (what, callback=->) =>
    cleanFirstPhone = @app.firstPhone.replace(/\W/, "")
    cleanTwilioPhone = @app.twilioPhone.replace(/\W/, "")
    @data.find "app_#{cleanFirstPhone}_#{cleanTwilioPhone}_phones", what, callback

  onCreate: (err, app) =>
    if err
      @emit "createerror", err
      return
    @app = app
    @emit "created"
    
  createApp: (props) =>
    @app = props 
    @data.save "apps", props, @onCreate

  onSave: (err, app) =>
    if err
      @emit "saveerror", err
      return
    @app = app
    @emit "saved"

  save: () =>
    @data.save "apps", @app, @onSave
    
MobileMinApp.init = (args...) -> return new MobileMinApp args...

dModule.define "mobilemin-app", -> MobileMinApp
