describe "MobileMinServer", ->
  drews = dModule.require "drews-mixins"
  fakeTimer = new jasmine.FakeTimer()
  window.setTimeout = (args...) ->
    fakeTimer.setTimeout args...
    
  fakeIncomingText = 
    AccountSid: 'fake account sid',
    Body: 'what?',
    ToZip: '85210',
    FromState: 'AZ',
    ToCity: 'PHOENIX',
    SmsSid: 'SMa587315830214927a2375d610ef8d438',
    ToState: 'AZ',
    To: '+14804673355',
    ToCountry: 'US',
    FromCountry: 'US',
    SmsMessageSid: 'SMa587315830214927a2375d610ef8d438',
    ApiVersion: '2010-04-01',
    FromCity: 'PHOENIX',
    SmsStatus: 'received',
    From: '+14808405406',
    FromZip: '85256'

  
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
    Body: 'not start',
    To: '+14804208755',
    From: '+14808405406',

  fakeIncomingStartText =
    Body: 'start',
    To: '+14804208755',
    From: '+14808405406',


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
    server = MobileminServer.init()

  it "should have an express rpc", ->
    expect(expressRpcInit).toHaveBeenCalledWith "/rpc", {}
    expect(server.expressApp).toBe(expressRpcObj)
    expect((server.expressApp).post).toHaveBeenCalledWith("/phone", server.phone)
    expect((server.expressApp).post).toHaveBeenCalledWith("/sms", server.sms)
    expect((server.expressApp).post).toHaveBeenCalledWith("/status", server.status)

  it "should have a mobileminTwilio", ->
    expect(server.twilio.constructor).toBe(FakeMobileminTwilio)
    expect(server.twilio.sid).toBe config.ACCOUNT_SID
    expect(server.twilio.authToken).toBe config.AUTH_TOKEN

  it "should start", ->
    server.start()
    expect(server.expressApp.listen).toHaveBeenCalledWith 8010
    #expect(server.twilio.setupNumbers).toHaveBeenCalled()

  it "should know when to start handling a new customer", ->
    arg = null
    server.handleNewCustomerWhoTextedStart =  (res, _arg) ->
      arg = _arg
    fakeReq = 
      body: fakeIncomingStartText
    fakeRes =
      send: ->

    server.sms fakeReq, fakeRes
    expectedArg = "+14808405406"
       
    expect(arg).toBe(expectedArg)

  it "should know what to do with a status url", ->
    #TODO: implement this

  describe "should be able to send a text message from mobilemin", ->
    triedToSendCallback = null 
    sentCallback = null
    responseCallback = null
    sendSmsSuccess = null
    sendSmsError = null
    sms = null
    eventOn = null
    eventEmit = null
    eventful = null

    fakeSendSmsResponse = null
    fakeGoodStatusRequest = null
    fakeBadStatusRequest = null
    fakeIncomingTextRequest = null


    beforeEach ->
      smsTriedToSendSuccess = jasmine.createSpy()
      smsTriedToSendError = jasmine.createSpy()
      smsSent = jasmine.createSpy()
      smsErrored = jasmine.createSpy()
      smsResponse = jasmine.createSpy()
      eventOn = jasmine.createSpy()
      eventEmit = jasmine.createSpy()
      eventful = 
        on: eventOn 
        emit: eventEmit
      spyOn(drews, "makeEventful").andReturn eventful

      fakeTriedToSendResponse = 
        sid: "fake sid"

      sms = server.sendSms server.mobileminNumber, "4808405406", "testing"
      expect(sms).toBe(eventful)

      {sendSmsSuccess, sendSmsError} = sms

      fakeSendSmsResponse =
        sid: "fake sid"
        status: "queued"

      #TODO: do I need one where it tried to send but the status was bad?


      fakeGoodStatusRequest = 
        body:
          AccountSid: 'fake account sid',
          SmsStatus: 'sent',
          Body: 'testing2',
          SmsSid: 'fake sid',
          To: '+14808405406',
          From: '+14804673355',
          ApiVersion: '2010-04-01'

      fakeBadStatusRequest = 
        body:
          AccountSid: 'fake account sid',
          SmsStatus: 'error',
          Body: 'testing2',
          SmsSid: 'fake sid',
          To: '+14808405406',
          From: '+14804673355',
          ApiVersion: '2010-04-01'

      fakeIncomingTextRequest =
        body: fakeIncomingText


    it "should have called the twilio client sms", ->
      expect(sendSmsSpy).toHaveBeenCalledWith(
        server.mobileminNumber,
        "+14808405406"
        "testing" 
        "http://mobilemin-server.drewl.us/status",
        sendSmsSuccess,
        sendSmsError
      )

    it "should handle the sms response", ->
      sendSmsSuccess fakeSendSmsResponse
      expect(sms.emit).toHaveBeenCalledWith("triedtosendsuccess")
      expect(server.conversations[server.mobileminNumber]["+14808405406"]).toBe(sms)
      expect(server.smsSidsWaitingStatus["fake sid"]).toBe(sms)
      server.status(fakeGoodStatusRequest, {})
      expect(server.smsSidsWaitingStatus["fake sid"]).toBeFalsy();
      expect(sms.emit).toHaveBeenCalledWith("sent")
      server.sms(fakeIncomingTextRequest, {})
      expect(sms.emit).toHaveBeenCalledWith("response", fakeIncomingText.Body, fakeIncomingText) 


    it "should handle the sms response", ->
      sendSmsSuccess fakeSendSmsResponse
      spyOn sms, "retry"
      expect(sms.emit).toHaveBeenCalledWith("triedtosendsuccess")
      expect(server.conversations[server.mobileminNumber]["+14808405406"]).toBe(sms)
      expect(server.smsSidsWaitingStatus["fake sid"]).toBe(sms)
      server.status(fakeBadStatusRequest, {})
      expect(server.smsSidsWaitingStatus["fake sid"]).toBeFalsy();
      expect(sms.emit).toHaveBeenCalledWith("error")
      expect(sms.emit).not.toHaveBeenCalledWith("sent")
      expect(sms.retry).toHaveBeenCalled()
      #server.sms(fakeIncomingTextRequest, {})
      #expect(sms.emit).toHaveBeenCalledWith("response", fakeIncomingText.Body, fakeIncomingText) 

    it "should resend in 3 seconds if if failed to try to send", ->
      spyOn sms, "retry"
      sendSmsError()
      #TODO: log error
      fakeTimer.tick(3000)
      expect(sms.retry).toHaveBeenCalled()

    it "should know how to retry", ->
      expect(sms.maxRetries).toBe(3)
      sms.maxRetries = 4
      sms.sid = "a fake sid"
      server.smsSidsWaitingStatus[sms.sid] = sms


      retry = ->
        oldCallCount = sendSmsSpy.callCount
        sms.retry()
        expect(server.smsSidsWaitingStatus[sms.sid]).toBeFalsy()
        expect(sendSmsSpy.callCount).toBe(oldCallCount + 1)
        expect(sendSmsSpy.mostRecentCall.args).toEqual [
          server.mobileminNumber,
          "+14808405406"
          "testing" 
          "http://mobilemin-server.drewl.us/status",
          sms.sendSmsSuccess,
          sms.sendSmsError
        ]

      retry()
      retry()
      retry()
      retry()

      oldCallCount = sendSmsSpy.callCount
      sms.retry()
      expect(sendSmsSpy.callCount).toBe(oldCallCount)
      expect(sms.emit).toHaveBeenCalledWith("maxretriesreached", 4)
      

    it "should try to resend if it gets a bad status", ->


    it "should have a send method", -> 
      oldCallCount = sendSmsSpy.callCount
      sms.send("howdy")
      expect(sendSmsSpy.callCount).toBe(oldCallCount + 1)
      expect(sendSmsSpy).toHaveBeenCalledWith(
        server.mobileminNumber,
        "+14808405406"
        "howdy" 
        "http://mobilemin-server.drewl.us/status",
        sms.sendSmsSuccess,
        sms.sendSmsError
      )
      #TODO sms object should be able to send smss

  it "should know how to handle a new customer who texted start", ->
    fakeRes =
      send: ->
    buyCallbacks = server.handleNewCustomerWhoTextedStart(fakeRes, "+14808405406")
    buySuccess = buyCallbacks[0]
    buyError = buyCallbacks[1]
    expect(apiCallSpy).toHaveBeenCalledWith(
      "POST","/IncomingPhoneNumbers", {params: {
        VoiceUrl: "http://mobilemin-server.drewl.us/phone"
        SmsUrl: "http://mobilemin-server.drewl.us/sms"
        AreaCode: "480"
        StatusUrl: "http://mobilemin-server.drewl.us/status" 
      }}, buySuccess, buyError
    )

    spyOn(server, "sendSms").andCallThrough() #TODO: should i spy out a mock?
    smsConversation = buySuccess(justBoughtNumber)
    newPhone = justBoughtNumber.phone_number
    expect(server.sendSms).toHaveBeenCalledWith(
      server.mobileminNumber,
      newPhone,
      "Your mobilemin text number is #{justBoughtNumber.friendly_name}. Subscribers will receive texts from that number. What is your business name?"
    )
    
    spyOn(server.mobileminApp, "createApp")
    smsConversation.emit("response", "Frozen Yogurt!") #TODO remove other chars?
    appData = {name: "Frozen Yogurt!", adminPhones: [newPhone], firstPhone: newPhone}
    expect(server.mobileminApp.createApp).toHaveBeenCalledWith(
      appData , smsConversation.createAppCallback
    )
    
    spyOn(smsConversation, "send")
    smsConversation.createAppCallback(null, appData)
    expect(smsConversation.send).toHaveBeenCalledWith(
      "Thank you."
    )



  dModule.define "mobilemin-twilio", RealMobileMinTwilio
