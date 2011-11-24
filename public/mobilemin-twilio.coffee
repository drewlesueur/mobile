dModule.define "mobilemin-twilio", ->
  TwilioRestClient = dModule.require("twilio").RestClient
  MobileminApp = dModule.require("mobilemin-app")
  nimble = dModule.require "nimble"

  class MobileMinTwilio
    constructor: (@sid, @authToken)->
      @twilioClient = new TwilioRestClient @sid, @authToken
      @mobileminApp = new MobileminApp

    setupNumbers: =>
      gotAppsCallback = (err, apps) =>
        console.log "was there an error?"
        console.log err
        console.log "got #{apps.length} apps"
        cbs = []
        nimble.each apps, (app, index, cb) =>
          cbs.push cb
          @twilioClient.updateIncomingNumber @twilioClient.sid,
            PhoneNumber: app.twilioPhone
            VoiceUrl: "http://mobilemin-server.com/phone"
            SmsUrl: "http://mobilemin-server.com/sms"
          , cb
        , () =>
        return cbs


      @mobileminApp.find {}, gotAppsCallback
      return gotAppsCallback

  MobileMinTwilio
