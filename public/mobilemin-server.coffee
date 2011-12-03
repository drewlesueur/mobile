dModule.define "mobilemin-server", ->
  MobileminTwilio = dModule.require "mobilemin-twilio"
  class MobileMinServer
    expressRpc = dModule.require "express-rpc"
    constructor: ->
      @expressApp = expressRpc "/rpc", {}
      @expressApp.post "/phone", @phone
      @expressApp.post "/sms", @sms
      @twilio = new MobileminTwilio()
    start: =>
      @expressApp.listen 8010 #TODO: use config
      @twilio.setupNumbers()
    phone: =>
    sms: =>

    

    
