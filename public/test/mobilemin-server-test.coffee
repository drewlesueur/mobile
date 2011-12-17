#TODO: only text start to mobilemin

drews = dModule.require "drews-mixins"
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

notFakeIncomingStartText2 =
  Body: 'not start',
  To: '+14804208755',
  From: '+14808405406',

fakeIncomingStartText =
  Body: 'start',
  To: "+14804673355",
  From: '+14808405406',

describe "Customer", ->
  MobileminApp = dModule.require "mobilemin-app"
  Conversation = dModule.require "mobilemin-conversation"
  Customer = dModule.require "mobilemin-customer"
  customer = null
  beforeEach ->
    customer = Customer.init("14804673355", "4808405406")

  it "should have a conversation and a mobileminapp", ->
    spyOn(MobileminApp, "init").andReturn("fake mm app")
    spyOn(Conversation, "init").andReturn "fake convo"
    customer = Customer.init("14804673355", "4808405406")
    expect(customer.app).toBe "fake mm app"
    expect(customer.convo).toBe "fake convo"
    expect(customer._app).toBe(customer.app.app)

  it "should create an app", ->
    console.log customer
    spyOn(customer.app, "createApp") 
    spyOn(customer.app, "once") 
    customer.createApp("fake info")

    expect(customer.app.createApp).toHaveBeenCalledWith(
      "fake info"
    )

    expect(customer.app.once).toHaveBeenCalledWith(
      "created"
      customer.onCreatedApp
    )

  it "should set and get", ->
    customer.set("something", 1)
    customer.app.app.something
    expect(customer.app.app.something).toBe 1
    expect(customer.get("something")).toBe 1

  it "should know what to do once a new app is created", ->
    spyOn(customer.convo, "send") 
    spyOn(customer.convo, "once")
    customer._app.prettyPhone = ":)"
    customer.onCreatedApp()
    expect(customer.convo.send).toHaveBeenCalledWith(
      """Congratulations! Your MobileMin number is #{customer._app.prettyPhone}. Your customers text "join" to subscribe. What is your business name?"""
    )
    expect(customer.convo.once).toHaveBeenCalledWith(
      "response", customer.onBusinessName
    )

   it "should know what to do when it gets a business name", ->
     spyOn(customer, "set")
     spyOn(customer.app, "save")  
     spyOn(customer.convo, "send")  
     spyOn(customer.convo, "once")  

     customer.onBusinessName("YK")
     expect(customer.set).toHaveBeenCalledWith("businessName", "YK")
     expect(customer.app.save).toHaveBeenCalled()
   
     expect(customer.convo.send).toHaveBeenCalledWith("""
       What is your business phone number so we can forward calls?  
     """)

     expect(customer.convo.once).toHaveBeenCalledWith(
       "response", customer.onBusinessPhone
     )



describe "Conversation", ->
  MobileminApp = dModule.require "mobilemin-app"
  Conversation = dModule.require "mobilemin-conversation"
  convo = null
  getAvailableLocalNumbersSpy = null
  apiCallSpy = null
  provisionIncomingNumberSpy = null
  sendSmsSpy = null

  beforeEach ->
    convo = Conversation.init("14804673355", "4808405406")

  it "should have a from and to, retires and max retries", -> 
    console.log convo
    expect(convo.from).toBe("+14804673355")
    expect(convo.to).toBe("+14808405406")
    expect(convo.retries).toBe(0)
    expect(convo.maxRetries).toBe(3)

  it "should handle successful sms send", ->
    spyOn(_, "extend")
    spyOn(convo, "emit")
    convo.sendSmsSuccess fakeSendSmsResponse 
    expect(_.extend).toHaveBeenCalledWith convo, fakeSendSmsResponse
    expect(convo.emit).toHaveBeenCalledWith("triedtosendsuccess")

  it "should retry", ->
    convo.body = "testing"
    spyOn(convo, "send")
    spyOn(convo, "emit")
    convo.retry()
    expect(convo.send).toHaveBeenCalledWith("testing")
    expect(convo.emit).toHaveBeenCalledWith("retry")
    expect(convo.retries).toBe(1)

  it "should not retry when maxed retries are reached", ->
    convo.body = "testing"
    convo.retries = 3
    spyOn(convo, "send")
    spyOn(convo, "emit")
    convo.retry()
    expect(convo.send).not.toHaveBeenCalled()
    expect(convo.emit).toHaveBeenCalledWith("maxretriesreached", 3)
    expect(convo.retries).toBe(3)

  it "should handle sending error", ->
    spyOn(drews, "wait")
    convo.sendSmsError("fake error")
    
    expect( drews.wait).toHaveBeenCalledWith(
      3000,
      convo.retry  
    )

  it "should send a text", ->
    sendSmsSpy = jasmine.createSpy()
    convo.twilioClient = 
      sendSms: sendSmsSpy
    
    convo.send("fake text")
    expect(convo.body).toBe("fake text")
    expect(convo.twilioClient.sendSms).toHaveBeenCalledWith(
      convo.from,
      convo.to,
      convo.body
      "http://mobilemin-server.drewl.us/status",
      convo.sendSmsSuccess,
      convo.sendSmsError
    )

    



describe "MobileMinServer", ->
  drews = dModule.require "drews-mixins"
  fakeTimer = new jasmine.FakeTimer()
  window.setTimeout = (args...) ->
    fakeTimer.setTimeout args...
    

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
    spyOn(server, "handleNewCustomerWhoTextedStart")
    fakeReq = 
      body: fakeIncomingStartText
    fakeRes =
      send: ->

    server.sms fakeReq, fakeRes

    expectedArg = "+14808405406"
    expect(server.handleNewCustomerWhoTextedStart).toHaveBeenCalledWith(
      fakeRes,
      expectedArg
    )

  it "should know when not to handle a new customer", ->
    spyOn(server, "handleNewCustomerWhoTextedStart")
    fakeReq = body: notFakeIncomingStartText
    fakeRes = send: ->
    server.sms fakeReq, fakeRes
    expect(server.handleNewCustomerWhoTextedStart).not.toHaveBeenCalled()

  it "should know when not to handle a new customer", ->
    spyOn(server, "handleNewCustomerWhoTextedStart")
    fakeReq = body: notFakeIncomingStartText2
    fakeRes = send: ->
    server.sms fakeReq, fakeRes
    expect(server.handleNewCustomerWhoTextedStart).not.toHaveBeenCalled()

  it "should know what to do with a status url", ->
    #TODO: implement this

  xdescribe "should be able to send a text message from mobilemin", ->
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

      sms = server.createConversation server.mobileminNumber, "4808405406"
      sms.send("testing")
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
      server.sms(fakeIncomingTextRequest, {send: ->})
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
    fakeFrom = "+14808405406"
    buyCallbacks = server.handleNewCustomerWhoTextedStart(fakeRes, fakeFrom)
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
    
    return
    #!!!!!!!!!!!!!!1
    spyOn server.mobileminApp, "createApp"
    spyOn server.mobileminApp, "once"
    buySuccess(justBoughtNumber)
    newPhone = justBoughtNumber.phone_number
    expect(server.mobileminApp.createApp).toHaveBeenCalledWith(
      adminPhones: [fakeFrom]
      firstPhone: fakeFrom
      twilioPhone: newPhone
    )
    expect(server.mobileminApp.once).toHaveBeenCalledWith(
      "created", server.onNewCustomerAppCreated
    )

  xit "should know what to do once a new customer app is created", ->
    server.onNewCustomerAppCreated() 


  dModule.define "mobilemin-twilio", RealMobileMinTwilio
