dModule.define "mobilemin-server", ->
  MobileminTwilio = dModule.require "mobilemin-twilio"
  class MobileMinServer
    expressRpc = dModule.require "express-rpc"
    constructor: ->
      @expressApp = expressRpc "/rpc", {}
      @expressApp.post "/phone", @phone
      @expressApp.post "/sms", @sms
      @twilio = new MobileminTwilio()
    phone: =>
    sms: =>

    

    
