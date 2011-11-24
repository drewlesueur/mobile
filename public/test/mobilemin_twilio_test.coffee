describe "MobileminTwilio", ->
  #faking twilio
  define "twilio", ->
    class RestClient
      constructor: (@sid, @authToken)->
      updateIncomingNumber: =>

    return {RestClient: RestClient}
      
  TwilioRestClient = require("twilio").RestClient
  MobileminApp = require("mobilemin-app")
  MobileminTwilio = require "mobilemin-twilio"
  mobileminTwilio = null
  sid = "sid"
  authToken = "auth-token"

  beforeEach ->
    mobileminTwilio = new MobileminTwilio(sid, authToken)

  it "should be there", ->
    expect(mobileminTwilio).toBeTruthy()

  it "should have access to Twilio!", ->
    expect(mobileminTwilio.twilioClient.constructor).toBe(
      TwilioRestClient
    )
    expect(mobileminTwilio.sid).toBe("sid")
    expect(mobileminTwilio.authToken).toBe("auth-token")
    expect(mobileminTwilio.twilioClient.sid).toBe("sid")
    expect(mobileminTwilio.twilioClient.authToken).toBe("auth-token")

  it "should have access to mobilemin database", ->
    expect(mobileminTwilio.mobileminApp.constructor).toBe(
      MobileminApp
    )

  it "should setup all the phone numbers with twilio", ->
    spyOn mobileminTwilio.mobileminApp, "find"
    callbackCalled = false
    callback = -> callbackCalled = true
    gotAppsCallback = mobileminTwilio.setupNumbers callback

    expect(mobileminTwilio.mobileminApp.find).toHaveBeenCalledWith(
      {},
      gotAppsCallback
    )
    expect(_.isFunction(gotAppsCallback)).toBeTruthy()

    spyOn mobileminTwilio.twilioClient, "updateIncomingNumber"

    cbs = gotAppsCallback(null, [
      {twilioPhone: "4808405406"},
      {twilioPhone: "4808405407"}
    ])

    expect(mobileminTwilio.twilioClient.updateIncomingNumber).toHaveBeenCalledWith(
      sid,
      {
        PhoneNumber: "4808405406"
        VoiceUrl: "http://mobilemin-server.com/phone"
        SmsUrl: "http://mobilemin-server.com/sms"
      }, cbs[0]

    )

    expect(mobileminTwilio.twilioClient.updateIncomingNumber).toHaveBeenCalledWith(
      sid,
      {
        PhoneNumber: "4808405407"
        VoiceUrl: "http://mobilemin-server.com/phone"
        SmsUrl: "http://mobilemin-server.com/sms"
      }, cbs[1]
    )



    


