if module?.exports
  difinir = (args..., ret) -> module.exports = ret()
  `define = difinir`

Severus = require "severus2"

class MobileMinApp 
  constructor: ->
    @severus = Severus.init()
    @severus.db = "mobilemin_dev"
  find: (what, callback=->) =>
    mmCallback = (err, apps) =>
      @app = apps[0]
      callback(err, apps)

    @severus.find "mobilemin", what, mmCallback
    mmCallback

      



define "mobilemin-app", -> MobileMinApp
