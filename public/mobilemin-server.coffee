process?.on "uncaughtException", (err) ->
  console.log "there whas a hitch, but we're still up"
  console.log err.stack

drews = dModule.require("drews-mixins")
addPlus1 = (phone) ->
  if drews.s(phone, 0, 2) != "+1" and phone.length == 10
    phone = "+1" + phone
  else if drews.s(phone, 0, 1) == "1" and phone.length == 11
    phone = "+" + phone
  return phone

dModule.define "mobilemin-conversation", ->
  #TODO. should only be able to send one at a time
  # because of the retires
  Conversation = {}
  Conversation.init = (from, to)->
    sms = drews.makeEventful({})
    sms.to = addPlus1 to
    sms.from = addPlus1 from


    sms.sendSmsSuccess = (res) ->
      console.log "success sending sms"
      console.log res
      sid = res.sid
      _.extend(sms, res)
      #self.smsSidsWaitingStatus[sid] = sms
      #self.conversations[from] or= {}
      #self.conversations[from][to] = sms
      sms.emit("triedtosendsuccess")
      # or sms.onTriedToSendSuccess()
    
    sms.maxRetries = 3
    sms.retries = 0

    sms.retry = ->
      #delete self.smsSidsWaitingStatus[sms.sid] 
      if sms.maxRetries == sms.retries
        return sms.emit("maxretriesreached", sms.maxRetries)
      sms.retries += 1
      sms.send(sms.body)
      sms.emit "retry"

    sms.sendSmsError = (err) ->
      console.log "there was an error sending an sms"
      console.log err
      drews.wait 3000, sms.retry
        
    sms.send =  (body) ->
      sms.body = body
      sms.twilioClient.sendSms(
        sms.from,
        sms.to,
        sms.body
        "http://mobilemin-server.drewl.us/status",
        sms.sendSmsSuccess,
        sms.sendSmsError
      )
    return sms
  return Conversation

dModule.define "mobilemin-customer", ->
  MobileminApp = dModule.require "mobilemin-app"
  Conversation = dModule.require "mobilemin-conversation"
  Customer = {}
  Customer.init = (from, to)->
    customer = {}
    customer.app = MobileminApp.init()
    customer.convo = Conversation.init from, to
    customer._app = customer.app.app

    customer.createApp = (info) ->
      customer.app.createApp(info)
      customer.app.once("created", customer.onCreatedApp)


    customer.onCreatedApp = ->
      customer.convo.send """
        Congratulations! Your MobileMin number is #{customer._app.prettyPhone}. Your customers text "join" to subscribe. What is your business name?
      """
      customer.convo.once("response", customer.onBusinessName)

    customer.onBusinessName = (businessName) ->
      customer.set("businessName", businessName)
      customer.app.save()
      customer.convo.send """
        What is your business phone number so we can forward calls?  
      """
      customer.convo.once "response", customer.onBusinessPhone


      


    customer.get = (key) ->
      return customer.app.app[key]

    customer.set = (key, val) ->
      customer.app.app[key] = val
      return 

    customer


  Customer

dModule.define "mobilemin-server", ->
  expressRpc = dModule.require "express-rpc" 
  drews = dModule.require "drews-mixins"
  config = dModule.require "config"
  _ = dModule.require "underscore"
  MobileminApp = dModule.require "mobilemin-app"

  MobileminTwilio = dModule.require "mobilemin-twilio"

  MobileminServer = {}
  MobileminServer.init = ->
    self = {}
    self.phone = ->
    self.sms =  (req, res) ->
      text = req.body 
      res.send "ok"
      if self.conversations[text.To]?[text.From]
        sms = self.conversations[text.To]?[text.From]
        sms.emit "response", text.Body, text
      
      #todo: check they don't already have and account
      if req.body.Body.toLowerCase() == "start" and text.To == self.mobileminNumber
        console.log "i see we are on start"
        console.logj
        self.handleNewCustomerWhoTextedStart res, text.From

    self.status = (req, res) ->
      console.log "got status"
      console.log req.body
      info = req.body
      sid = info.SmsSid
      status = info.SmsStatus
      if sid and self.smsSidsWaitingStatus[sid]
        sms = self.smsSidsWaitingStatus[sid] 
        delete self.smsSidsWaitingStatus[sid] 
        sms.status = status
        if status == "sent" 
          sms.emit("sent")
        else
          sms.emit("error")
          sms.retry()
        

    self.mobileminNumber =  "+14804673355"
    self.expressApp = expressRpc("/rpc", {})
    self.expressApp.post "/phone", self.phone
    self.expressApp.post "/sms", self.sms
    self.expressApp.post "/status", self.status
    self.twilio =  new MobileminTwilio config.ACCOUNT_SID, config.AUTH_TOKEN
    self.smsSidsWaitingStatus =  {}
    self.conversations = {}
    twilio = self.twilio


    self.start =  ->
      self.expressApp.listen 8010 #TODO: use config
      #self.twilio.setupNumbers()

    #TODO: test the createConversation
    #and retry based of last sent info
    self.createConversation = (from, to) -> 

    self.sendSms = (from, to, body)-> 
      sms = self.createConversation(from, to)
      sms.send(body)


      

    self.sendFirstResponse = (conversation) ->
      conversation.send """
         Congratulations! Your MobileMin number is (480) 444-1223. Your customers text "join" to subscribe. What is your business name?
      """
      conversation.once "response", (businessName) ->
        smsConversation.createAppCallback = () ->
          smsConversation.send "Thank you."

         
    self.onNewCustomerAppCreated = () =>
      smsConversation = self.createConversation(
        self.mobileminNumber,
        from
      )
      console.log "you tried to ask for business name"

    
    self.handleNewCustomerWhoTextedStart = (res, from) ->
      console.log "we are handling a new start"
      areaCode = drews.s(from, 2, 3) #get rid of +1, and get area code 
      buySuccess = (justBoughtNumber) =>
        newPhone = justBoughtNumber.phone_number
        console.log "you just bought a number which was #{newPhone}"
        app = new MobileminApp()
        app.createApp
          adminPhones: [from]
          firstPhone: from
          twilioPhone: newPhone
        app.once "created", self.onNewCustomerAppCreated
          
        #smsConversation.friendly_name = justBoughtNumber.friendly_name
        #self.sendFirstResponse(smsConversation)

        #return smsConversation
     
      buyError = (error) =>
        console.log "There was an error"
        

      actuallyBuy = true
      actuallyBuy and twilio.twilioClient.apiCall('POST', '/IncomingPhoneNumbers', {params: {
        VoiceUrl: "http://mobilemin-server.drewl.us/phone"
        SmsUrl: "http://mobilemin-server.drewl.us/sms"
        AreaCode: areaCode
        StatusUrl: "http://mobilemin-server.drewl.us/status"

      }}, buySuccess, buyError)
      

      actuallyBuy or buySuccess
        friendly_name: '(480) 428-2578',
        phone_number: '+14804282578',

      return [buySuccess, buyError]


    __getAvailableNumbers: =>
      success = (response) ->
        firstPhone = response.available_phone_numbers[0].phone_number
        console.log "going to buy #{firstPhone}" 
        false and twilio.twilioClient.provisionIncomingNumber firstPhone,
          VoiceUrl: "http://mobilemin-server.drewl.us/phone"
          SmsUrl: "http://mobilemin-server.drewl.us/sms"
      error = ->
     
      twilio.twilioClient.getAvailableLocalNumbers "US",
        AreaCode: drews.s(from, 2, 3) #get rid of +1, and get area code
      , success, error
      [success, error]

    self
  MobileminServer
