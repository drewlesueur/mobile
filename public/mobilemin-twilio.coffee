dModule.define "mobilemin-twilio", ->
  TwilioRestClient = dModule.require("twilio").RestClient
  MobileminApp = dModule.require("mobilemin-app")
  nimble = dModule.require "nimble"

  class MobileMinTwilio
    constructor: (@sid, @authToken)->
      @twilioClient = new TwilioRestClient @sid, @authToken
      @mobileminApp = new MobileminApp

    setupNumbers: =>

      @mobileminApp.find {}, @onGotApps
      return @onGotApps

    onGotApps: (err, apps) =>

      cbs = []
      nimble.each apps, (app, index, arr, cb) =>
        cbs.push @getPhoneNumberSidsForUpdating app.twilioPhone, cb
        
      return cbs
   
    updateCallbackNumbers: (cb) =>
    getPhoneNumberSidsForUpdating: (twilioPhone, cb = ->) =>
      if (not twilioPhone) or (twilioPhone.length < 10)
        return cb null

      success = (resp) =>
        phoneSid = resp.incoming_phone_numbers[0].sid
        xSuccess = (data) =>
          console.log("updated #{twilioPhone}")
          cb null
        xErr = (d) =>
          cb d
        @twilioClient.updateIncomingNumber phoneSid,
          VoiceUrl: "http://mobilemin-server.drewl.us/phone"
          SmsUrl: "http://mobilemin-server.drewl.us/sms"
        , xSuccess
        , xErr
        return [xSuccess, xErr] #ug. should be one callback node.js style

      err = (data) ->
        cb data
      @twilioClient.getIncomingNumbers
        PhoneNumber: "+1" + twilioPhone
      , success
      , err
      return [success, err]


  MobileMinTwilio
