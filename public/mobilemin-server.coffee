dModule.define "mobilemin-server", ->
  expressRpc = dModule.require "express-rpc" 
  drews = dModule.require "drews-mixins"
  config = dModule.require "config"
  _ = dModule.require "underscore"

  MobileminTwilio = dModule.require "mobilemin-twilio"

  MobileminServer = {}
  MobileminServer.init = ->
    self = {}
    self.addPlus1 = (phone) ->
      if drews.s(phone, 0, 2) != "+1" and phone.length == 10
        phone = "+1" + phone
      else if drews.s(phone, 0, 1) == "1" and phone.length == 11
        phone = "+" + phone
      return phone
    self.phone = ->
    self.sms =  (req, res) ->
      text = req.body 
      if self.conversations[text.To]?[text.From]
        sms = self.conversations[text.To]?[text.From]
        sms.emit "response", text.Body, text
      
      #todo: check they don't already have and account
      if req.body.Body.toLowerCase() == "start"
        self.handleNewCustomerWhoTextedStart res, text.From

    self.status = (req, res) ->
      info = req.body
      sid = info.SmsSid
      status = info.SmsStatus
      if sid and self.smsSidsWaitingStatus[sid]
        sms = self.smsSidsWaitingStatus[sid] 
        sms.status = status
        sms.emit("sent")
        

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
        sid = res.sid
        self.smsSidsWaitingStatus[sid] = sms
        _.extend(sms, res)
        self.conversations[from] or= {}
        self.conversations[from][to] = sms
        sms.emit("triedtosendsuccess")

      sendSmsError = ->

      twilio.twilioClient.sendSms(
        from,
        to,
        body
        "http://mobilemin-server.drewl.us/status",
        sendSmsSuccess,
        sendSmsError
      )

      
      sms = drews.makeEventful({})
      sms.sendSmsSuccess = sendSmsSuccess
      sms.sendSmsError = sendSmsError
      return sms

    self.handleNewCustomerWhoTextedStart = (res, from) ->
      areaCode = drews.s(from, 2, 3) #get rid of +1, and get area code 
      buySuccess = (newNumber) =>
        sendSmsSuccess = () =>
        sendSmsError = () =>
        twilio.twilioClient.sendSms(
          self.mobileminNumber,
          newNumber.phone_number,
          "Your mobilemin text number is #{newNumber.friendly_name}. Subscribers will receive texts from that number. Text 'help' for more info and to manage your account." 
          null, 
          sendSmsSuccess,
          sendSmsError
        )
        return [sendSmsSuccess, sendSmsError]
     
      buyError = (error) =>
        console.log "There was an error"
        
      twilio.twilioClient.apiCall('POST', '/IncomingPhoneNumbers', {params: {
        VoiceUrl: "http://mobilemin-server.drewl.us/phone"
        SmsUrl: "http://mobilemin-server.drewl.us/sms"
        AreaCode: areaCode
        StatusUrl: "http://mobilemin-server.drewl.us/status"

      }}, buySuccess, buyError)
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
