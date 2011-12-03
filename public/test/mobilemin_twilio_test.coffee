describe "MobileminTwilio", ->
  #faking twilio
  define "twilio", ->
    class RestClient
      constructor: (@sid, @authToken)->
      updateIncomingNumber: =>
      getIncomingNumbers: =>

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

  it "should set up all the phone numbers with twilio", ->
    spyOn mobileminTwilio.mobileminApp, "find"
    callbackCalled = false
    callback = -> callbackCalled = true
    mobileminTwilio.setupNumbers callback

    expect(mobileminTwilio.mobileminApp.find).toHaveBeenCalledWith(
      {},
      mobileminTwilio.onGotApps
    )

  it "should get the twilio phone sids once it finds the apps", ->
    
    spyOn(mobileminTwilio.twilioClient, "getIncomingNumbers")
    spyOn(mobileminTwilio.twilioClient, "updateIncomingNumber")

    cbs = mobileminTwilio.onGotApps(null, [
      {twilioPhone: "4808405406"},
      {twilioPhone: "4808405407"},
      {twilioPhone: ""},
      {twilioPhone: "1"}
    ])

  
    expect(cbs[0]).toBeTruthy()
    [success, err] = cbs[0]
    expect(mobileminTwilio.twilioClient.getIncomingNumbers).toHaveBeenCalledWith(
      {PhoneNumber: "+14808405406"},
      success,
      err
    )
    expect(mobileminTwilio.twilioClient.getIncomingNumbers).toHaveBeenCalledWith(
      {PhoneNumber: "+14808405407"},
      cbs[1][0],
      cbs[1][1],
    )
    expect(mobileminTwilio.twilioClient.getIncomingNumbers).not.toHaveBeenCalledWith(
      {PhoneNumber: "+1"},
      cbs[1][0],
      cbs[1][1],
    )

    [success, err] = cbs[0][0]({incoming_phone_numbers: [{sid:"a fake sid"}]})
    expect(mobileminTwilio.twilioClient.updateIncomingNumber).toHaveBeenCalledWith(
      "a fake sid"
      {
        VoiceUrl: "http://mobilemin-server.drewl.us/phone",
        SmsUrl: "http://mobilemin-server.drewl.us/sms"
      },
      success,
      err
    )
