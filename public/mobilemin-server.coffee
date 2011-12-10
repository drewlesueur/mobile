dModule.define "mobilemin-server", ->
  expressRpc = dModule.require "express-rpc" 
  drews = dModule.require "drews-mixins"
  config = dModule.require "config"

  MobileminTwilio = dModule.require "mobilemin-twilio"

  MobileminServer = {}
  MobileminServer.init = ->
    self = {}
    self.phone = ->
    self.sms =  (req, res) ->
      text = req.body 
      self.handleNewCustomerWhoTextedStart res, text.From
    self.status = (req, res) ->
      console.log req.body 

    self.mobileminNumber =  "+14804673355"
    self.expressApp = expressRpc("/rpc", {})
    self.expressApp.post "/phone", self.phone
    self.expressApp.post "/sms", self.sms
    self.expressApp.post "/status", self.status
    self.twilio =  new MobileminTwilio config.ACCOUNT_SID, config.AUTH_TOKEN
    self.smsSidsWaitingStatus =  []
    twilio = self.twilio


    self.start =  ->
      self.expressApp.listen 8010 #TODO: use config
      self.twilio.setupNumbers()

    self.sendSms = (info)-> 
      {to, body, triedToSendCallback, sentCallback, responseCallback, sendSmsSuccess} = info
      sendSmsSuccess = (res) ->
        sid = res.SMSMessage.Sid
        self.smsSidsWaitingStatus[sid] = res.SMSMessage
        triedToSendCallback(null, res)

      sendSmsError = ->

      twilio.twilioClient.sendSms(
        self.mobileminNumber
        to,
        body
        null, #statusCallback 
        sendSmsSuccess,
        sendSmsError
      )

      return [sendSmsSuccess, sendSmsError]

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
