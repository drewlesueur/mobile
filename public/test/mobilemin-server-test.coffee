describe "MobileMinServer", ->
  allFunc = dModule.require "all-func" 
  obj = allFunc "object"
  isEqual = allFunc "isEqual"

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

  RealMobileMinTwilio = dModule.require "mobilemin-twilio"


  getAvailableLocalNumbersSpy = jasmine.createSpy()
  class FakeTwilioClient
    constructor: ->
    getAvailableLocalNumbers: getAvailableLocalNumbersSpy
    
  setupNumbersSpy = jasmine.createSpy()
  class FakeMobileminTwilio 
    constructor: ->
      @twilioClient = new FakeTwilioClient()
    setupNumbers: setupNumbersSpy 

    

  dModule.define "mobilemin-twilio", () ->
    FakeMobileminTwilio

  MobileMinServer = dModule.require "mobilemin-server"
  
  server = null 

  beforeEach ->
    server = new MobileMinServer()

  it "should have an express rpc", ->
    expect(expressRpcInit).toHaveBeenCalledWith "/rpc", {}
    expect(server "expressApp").toBe(expressRpcObj)
    expect((server "expressApp").post).toHaveBeenCalledWith("/phone", server.phone)
    expect((server "expressApp").post).toHaveBeenCalledWith("/sms", server.sms)

  it "should have a mobileminTwilio", ->
    expect(server("twilio").constructor).toBe(FakeMobileminTwilio)

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
    cb = server("handleNewCustomerWhoTextedStart")(fakeRes, "+14808405406")
    expect(getAvailableLocalNumbersSpy).toHaveBeenCalledWith(
      "US",
      {
        "AreaCode": "480"
      }
    )
    


  dModule.define "mobilemin-twilio", RealMobileMinTwilio
