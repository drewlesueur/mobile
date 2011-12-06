
describe "MobileMinServer", ->
  allFunc = dModule.require "all-func" 
  obj = allFunc "object"
  isEqual = allFunc "isEqual"
  
  justBoughtNumber = 
    sid: 'PN139f6f56936749f585ae9ab952682e98',
    account_sid: 'fake sid',
    friendly_name: '(480) 428-2578',
    phone_number: '+14804282578',
    voice_url: 'http://mobilemin-server.drewl.us/phone',
    voice_method: 'POST',
    voice_fallback_url: '',
    voice_fallback_method: 'POST',
    voice_caller_id_lookup: false,
    date_created: 'Tue, 06 Dec 2011 00:03:10 +0000',
    date_updated: 'Tue, 06 Dec 2011 00:03:10 +0000',
    sms_url: 'http://mobilemin-server.drewl.us/sms',
    sms_method: 'POST',
    sms_fallback_url: '',
    sms_fallback_method: 'POST',   
    capabilities: { voice: true, sms: true },
    status_callback: '',
    status_callback_method: 'POST',
    api_version: '2010-04-01', 
    voice_application_sid: '',
    sms_application_sid: '',
    uri: '/2010-04-01/Accounts/fakesid/IncomingPhoneNumbers/PN139f6f56936749f585ae9ab952682e98.json'


  notFakeIncomingStartText =
    Body: 'start',
    To: '+14804208755',
    From: '+14808405406',

  fakeIncomingStartText =
    Body: 'start',
    To: '+14804208755',
    From: '+14808405406',

  fakeIncomingText =
    AccountSid: 'ACa7ba1183dd4f2853f8af6043299bf892',
    Body: 'test me',
    ToZip: '85034',
    FromState: 'AZ',
    ToCity: 'PHOENIX',
    SmsSid: 'SMdbbf2ba79040b393c42878d01268e0fe',
    ToState: 'AZ',
    To: '+14804208755',
    ToCountry: 'US',
    FromCountry: 'US',
    SmsMessageSid: 'SMdbbf2ba79040b393c42878d01268e0fe',
    ApiVersion: '2010-04-01',
    FromCity: 'PHOENIX',
    SmsStatus: 'received',
    From: '+14808405406',
    FromZip: '85256'

  #mock express rpc
  expressRpcAppListen = jasmine.createSpy()
  expressPost = jasmine.createSpy()
  expressRpcObj =
    listen: expressRpcAppListen 
    post: expressPost
  expressRpcInit = jasmine.createSpy().andReturn expressRpcObj

  dModule.define "express-rpc", -> expressRpcInit
  dModule.define "config", ->
    ACCOUNT_SID: 'sid',
    AUTH_TOKEN: 'authToken',

  config = dModule.require "config"

  RealMobileMinTwilio = dModule.require "mobilemin-twilio"


  getAvailableLocalNumbersSpy = jasmine.createSpy()
  apiCallSpy = jasmine.createSpy()
  provisionIncomingNumberSpy = jasmine.createSpy()
  sendSmsSpy = jasmine.createSpy()

  class FakeTwilioClient
    constructor: (@sid, @authToken)->
    getAvailableLocalNumbers: getAvailableLocalNumbersSpy
    apiCall: apiCallSpy #(httpMethod, path, options, success, err) ->
    provisionIncomingNumber: provisionIncomingNumberSpy
    sendSms: sendSmsSpy
    
  setupNumbersSpy = jasmine.createSpy()
  class FakeMobileminTwilio 
    constructor: (@sid, @authToken) ->
      @twilioClient = new FakeTwilioClient(@sid, @authToken)
    setupNumbers: setupNumbersSpy 

    
  dModule.define "mobilemin-twilio", () ->
    FakeMobileminTwilio

  MobileminServer = dModule.require "mobilemin-server"
  
  server = null 

  beforeEach ->
    server = MobileminServer("init")()

  it "should have an express rpc", ->
    expect(expressRpcInit).toHaveBeenCalledWith "/rpc", {}
    expect(server "expressApp").toBe(expressRpcObj)
    expect((server "expressApp").post).toHaveBeenCalledWith("/phone", server.phone)
    expect((server "expressApp").post).toHaveBeenCalledWith("/sms", server.sms)

  it "should have a mobileminTwilio", ->
    expect(server("twilio").constructor).toBe(FakeMobileminTwilio)
    expect(server("twilio").sid).toBe config.ACCOUNT_SID
    expect(server("twilio").authToken).toBe config.AUTH_TOKEN

  it "should start", ->
    server("start")()
    expect(server("expressApp").listen).toHaveBeenCalledWith 8010
    expect(server("twilio").setupNumbers).toHaveBeenCalled()

  it "should know when to start handling a new customer", ->
    arg = null
    server "handleNewCustomerWhoTextedStart", (res, _arg) ->
      arg = _arg
    fakeReq = 
      body: fakeIncomingStartText
    fakeRes =
      send: ->

    server("sms") fakeReq, fakeRes
    expectedArg = "+14808405406"
       
    expect(arg).toBe(expectedArg)

  it "should know how to handle a new customer who texted start", ->
    fakeRes =
      send: ->
    buyCallbacks = server("handleNewCustomerWhoTextedStart")(fakeRes, "+14808405406")
    buySuccess = buyCallbacks 0
    buyError = buyCallbacks 1
    expect(apiCallSpy).toHaveBeenCalledWith(
      "POST","/IncomingPhoneNumbers", {params: {
        VoiceUrl: "http://mobilemin-server.drewl.us/phone"
        SmsUrl: "http://mobilemin-server.drewl.us/sms"
        AreaCode: "480"
      }}, buySuccess, buyError, "ffff`"
    )

    sendFeedbackCallbacks = buySuccess(justBoughtNumber)
    sendFeedbackSuccess = sendFeedbackCallbacks 0
    sendFeedbackError = sendFeedbackCallbacks 1
    expect(sendSmsSpy).toHaveBeenCalledWith(
      server("mobileminNumber"),
      justBoughtNumber.phone_number,
      "Your mobilemin text number is #{justBoughtNumber.friendly_name}. Subscribers will receive texts from that number. Text 'help' for more info and to manage your account." 
      null, 
      sendFeedbackSuccess,
      sendFeedbackError
    )
    

  xit "should know how to handle a new customer who texted start", ->
    fakeAvailablePhones = {available_phone_numbers : [ 
     {
       friendly_name: '(480) 409-2352',
       phone_number: '+14804092352',
       latitude: null,
       longitude: null,
       region: 'Arizona',
       postal_code: null,
       iso_country: 'US',
       lata: null,
       rate_center: null
     }, { 
       friendly_name: '(480) 428-3732',
       phone_number: '+14804283732',
       latitude: null,
       longitude: null,
       region: 'AZ',
       postal_code: null,
       iso_country: 'US',
       lata: null,
       rate_center: null 
     }
    ]}
    fakeRes =
      send: ->
    [success, error] = server("handleNewCustomerWhoTextedStart")(fakeRes, "+14808405406")
    expect(getAvailableLocalNumbersSpy).toHaveBeenCalledWith(
      "US",
      {
        "AreaCode": "480"
      }, success, error
    )
    twilioClient = server("twilio").twilioClient
    success fakeAvailablePhones
    expect(provisionIncomingNumberSpy).toHaveBeenCalledWith(
       '+14804092352',
       {
         voiceUrl: "http://mobilemin-server.drewl.us/phone"
         smsUrl: "http://mobilemin-server.drewl.us/sms"
       }
    )
    

  dModule.define "mobilemin-twilio", RealMobileMinTwilio
