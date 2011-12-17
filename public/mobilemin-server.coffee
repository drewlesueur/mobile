process?.on "uncaughtException", (err) ->
  console.log "there whas a hitch, but we're still up"
  console.log err.stack

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
    self.mobileminApp = new MobileminApp()
    self.addPlus1 = (phone) ->
      if drews.s(phone, 0, 2) != "+1" and phone.length == 10
        phone = "+1" + phone
      else if drews.s(phone, 0, 1) == "1" and phone.length == 11
        phone = "+" + phone
      return phone
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

    self.sendSms = (from, to, body)-> 
      sms = null
      to = self.addPlus1 to
      from = self.addPlus1 from

      sendSmsSuccess = (res) ->
        console.log "success sending sms"
        console.log res
        sid = res.sid
        self.smsSidsWaitingStatus[sid] = sms
        _.extend(sms, res)
        self.conversations[from] or= {}
        self.conversations[from][to] = sms
        sms.emit("triedtosendsuccess")
      
      sms = drews.makeEventful({})
      sms.maxRetries = 3
      sms.retries = 0

      sms.retry = ->
        delete self.smsSidsWaitingStatus[sms.sid] 
        if sms.maxRetries == sms.retries
          return sms.emit("maxretriesreached", sms.maxRetries)
        sms.retries += 1
        send()

      send = ->
        twilio.twilioClient.sendSms(
          from,
          to,
          body
          "http://mobilemin-server.drewl.us/status",
          sendSmsSuccess,
          sendSmsError
        )

      sendSmsError = (err) ->
        console.log "there was an error sending an sms"
        console.log err
        drews.wait 3000, ->
          sms.retry()
          
      sms.sendSmsSuccess = sendSmsSuccess
      sms.sendSmsError = sendSmsError
      send()
      sms.send =  (body)->
        twilio.twilioClient.sendSms(
          from,
          to,
          body
          "http://mobilemin-server.drewl.us/status",
          sendSmsSuccess,
          sendSmsError
        )
      return sms

    self.handleNewCustomerWhoTextedStart = (res, from) ->
      console.log "we are handling a new start"
      areaCode = drews.s(from, 2, 3) #get rid of +1, and get area code 
      buySuccess = (justBoughtNumber) =>
        newPhone = justBoughtNumber.phone_number
        console.log "you just bought a number which was #{newPhone}"
        smsConversation = self.sendSms(
          self.mobileminNumber, from,
          "Your mobilemin text number is #{justBoughtNumber.friendly_name}. Subscribers will receive texts from that number. What is your business name?"
        )
        console.log "you tried to ask for business name"
        smsConversation.once "response", (businessName) ->
          smsConversation.createAppCallback = () ->
            smsConversation.send "Thank you."

           
          self.mobileminApp.createApp
            name: businessName
            adminPhones: [from]
            firstPhone: from
          , smsConversation.createAppCallback

        return smsConversation
     
      buyError = (error) =>
        console.log "There was an error"
        
      false and twilio.twilioClient.apiCall('POST', '/IncomingPhoneNumbers', {params: {
        VoiceUrl: "http://mobilemin-server.drewl.us/phone"
        SmsUrl: "http://mobilemin-server.drewl.us/sms"
        AreaCode: areaCode
        StatusUrl: "http://mobilemin-server.drewl.us/status"

      }}, buySuccess, buyError)
      

      true and buySuccess
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
