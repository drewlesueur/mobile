dModule.define "mobilemin-twilio", ->
  TwilioRestClient = dModule.require("twilio").RestClient
  MobileminApp = dModule.require("mobilemin-app")
  nimble = dModule.require "nimble"

  class MobileMinTwilio
    constructor: (@sid, @authToken)->
      @twilioClient = new TwilioRestClient @sid, @authToken
      @mobileminApp = new MobileminApp

    setupNumbers: =>

      @mobileminApp.find {}, gotAppsCallback
      return gotAppsCallback

    onGotApps: (err, apps) =>
      console.log "was there an error?"
      console.log err
      console.log "got #{apps.length} apps"
      cbs = []
      nimble.each apps, (app, index, cb) =>
        @getPhoneNumberSidsForUpdating app.twilioPhone, cb
   
    updateCallbackNumber: () =>
    updateCallbackNumbers: (twilioPhone, cb) =>
      if (not app.twilioPhone) or (app.twilioPhone.length < 10)
        return cb null
      success = (resp) =>
        phoneSid = resp.incoming_phone_numbers[0].sid
        @updateCallbackNumber
        xSuccess = (data) =>
          cb null
        xErr = (d) =>
          cb d
        @twilioClient.updateIncomingNumber phoneSid,
          VoiceUrl: "http://mobilemin-server.com/phone"
          SmsUrl: "http://mobilemin-server.com/sms"
        , xSuccess
        , xErr

      err = (data) ->
        console.log "error with #{app.twilioPhone}"
        cb data
      cbs.push cb

      @twilioClient.getIncomingNumbers
        PhoneNumber: "+1" + app.twilioPhone
      , success
      , err
    return cbs

  MobileMinTwilio
