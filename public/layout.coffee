process?.on "uncaughtException", (err) ->
  console.log "there whas a hitch, but we're still up"
  console.log err.stack

_ = dModule.require "underscore"
drews = dModule.require("drews-mixins")

addPlus1 = (phone) ->
  if drews.s(phone, 0, 2) != "+1" and phone.length == 10
    phone = "+1" + phone
  else if drews.s(phone, 0, 1) == "1" and phone.length == 11
    phone = "+" + phone
  return phone

dModule.define "mobilemin-text", ->
  #TODO. should only be able to send one at a time
  # because of the retires
  Text = {}
  Text.init = (textInfo, twilioClient)->
    sms = drews.makeEventful({})
    sms.twilioClient = twilioClient
    sms.to = addPlus1 textInfo.to
    sms.from = addPlus1 textInfo.from
    sms.body = textInfo.body

    sms.sendSmsSuccess = (res) ->
      console.log "success sending sms"
      console.log res
      sid = res.sid
      _.extend(sms, res)
      sms.emit("triedtosendsuccess")
    
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
        
    sms.send =  () ->
      sms.twilioClient.sendSms(
        sms.from,
        sms.to,
        sms.body
        "http://mobilemin-server.drewl.us/status",
        sms.sendSmsSuccess,
        sms.sendSmsError
      )
    return sms
  return Text

dModule.define "mobilemin-server", ->
  expressRpc = dModule.require "express-rpc" 
  drews = dModule.require "drews-mixins"
  config = dModule.require "config"
  _ = dModule.require "underscore"
  MobileminApp = dModule.require "mobilemin-app"
  MobileminText = dModule.require "mobilemin-text"

  MobileminTwilio = dModule.require "mobilemin-twilio"

  MobileminServer = {}
  MobileminServer.init = ->
    server = {}
    server.statuses = {}
    server.info = {}
    server.twilioPhones = {}
    server.phone = ->
    server.sms =  (req, res) ->
      text = req.body 
      text.to = text.To
      text.from = text.From
      text.body = text.Body
      server.onText(text)
      res.send "ok"

    server.status = (req, res) ->
      console.log "got status"
      console.log req.body
      info = req.body
      sid = info.SmsSid
      status = info.SmsStatus
      if sid and server.smsSidsWaitingStatus[sid]
        text = server.smsSidsWaitingStatus[sid] 
        delete server.smsSidsWaitingStatus[sid] 
        if status == "sent" 
          text.emit("sent")
        else
          text.emit("error")
          text.retry()
      res.send "ok"
        
    server.mobileminNumber =  "+14804673355"
    server.expressApp = expressRpc("/rpc", {})
    server.expressApp.post "/phone", server.phone
    server.expressApp.post "/sms", server.sms
    server.expressApp.post "/status", server.status
    server.twilio =  new MobileminTwilio config.ACCOUNT_SID, config.AUTH_TOKEN
    server.smsSidsWaitingStatus =  {}
    server.conversations = {}
    twilio = server.twilio

    server.start =  ->
      server.expressApp.listen 8010 #TODO: use config
      #self.twilio.setupNumbers()


    server.onText = (text) ->
      console.log("text!")
      if text.to is server.mobileminNumber and text.body is "start"
        console.log("its a start")
        server.buyPhoneNumberFor(text.from)
      else if server.hasAStatus(text.from, text.to)
        status = server.getStatus(text.from, text.to)
        server.actAccordingToStatus(status, text)
      else if text.body is "admin"
        server.onAdmin(text)
      else if text.body is "stop"
        server.onStop(text)
      else
        server.onJoin(text)

    server.hasAStatus = (from, to) ->
      return server.statuses[from]?[to]
    
    server.getStatus = (from, to) ->
      return server.statuses[from]?[to]

    server.setStatus = (from, to, status) ->
      server.statuses[from] or= {}
      server.statuses[from][to] = status
      if status is "waiting to allow admin"
        server.inOneHour(server.setStatus, from, to, "waiting for special")

    server.onAdmin = (text) ->
      server.getMisterAdmin(text.to)
      server.whenGotMisterAdmin(server.askMisterAdminIfNewGuyCanBeAdmin, text.to, text.from)

    server.getMisterAdmin = () ->
      #TODO: implement this correctly
      server.misterAdminRequest = drews.makeEventful({})
      _.defer ->
        server.misterAdminRequest.emit("done", "480-840-5406")

    server.whenGotMisterAdmin = (func, args...) ->
      #TODO: implement this correctly
      funcToCall = func.bind(null, args...)
      server.misterAdminRequest.once("done", funcToCall)
      

      
      
    server.askMisterAdminIfNewGuyCanBeAdmin = (twilioPhone, wannaBeAdmin, misterAdmin) ->
      server.text
        to: misterAdmin
        from: wannaBeAdmin
        body: """
          Can #{wannaBeAdmin} send texts to your subscribers on your behalf?
        """
      server.whenTextIsSent(server.setStatus, misterAdmin, twilioPhone, "waiting to allow admin")
      server.whenTextIsSent(server.setWannaBeAdmin, misterAdmin, twilioPhone, wannaBeAdmin)
      
      
    server.onJoin = (text) ->
      server.addThisNumberToTheSubscribeList(text.from, text.to)
      server.getBusinessNameFor(text.to)
      server.whenNumberIsAddedAndGotBusinessName(
        server.sayYouWillReceiveSpecials, text
      )



    server.onStop = (text) ->
      server.removeThisNumberFromTheSubscribeList(text.from, text.to)
      server.getBusinessNameFor(text.to)
      server.whenNumberIsRemovedAndGotBusinessName(
        server.sayYouWillNoLongerReceiveTextsFromThisBusiness(text.from, businessName)
      )

    server.sayYouWillNoLongerReceiveTextsFromThisBusiness = (text, businessName) ->
      server.text
        from: text.to
        to: text.from
        body: """
          You will not get any more texts from this number.
          Text "join" to start getting texts agian.
        """

    server.sayYouWillReceiveSpecials = (text, businessName) ->
      server.text
        from: text.to
        to: text.from
        body: """
          You just signed up for free specials from #{businessName}.
          Text STOP at anytime to not receive any texts,
          and START at anytime to start receiveing them agian.
        """

    server.onCall = (call) ->
      server.findBusinessPhoneFor(call.to) 
      server.whenBusinessPhoneIsFound(server.forwardCall)

    server.actAccordingToStatus = (status, text) ->
      if status is "waiting for business name"
        server.onGotBusinessName(text.from, text.body)
      else if status is "waiting for business phone"
        server.onGotBusinessPhone(text.from, text.body)
      else if status is "waiting for special"
        server.onSpecial(text)
      else if status is "waiting for special confirmation"
        server.onSpecialConfirmation(text)
      else if status is "waiting to allow admin"
        server.onDetermineAdmin(text)
        
    server.onDetermineAdmin = (text) ->
      wannaBeAdmin = server.getWannaBeAdmin(text.from, text.to)
      if text.body is "yes"
        self.grantAdminAccess(wannaBeAdmin)
        self.whenAccessIsGranted(self.tellWannaBeAdminHeIsAnAdmin, text.to, wannaBeAdmin)
      else
        self.tellWannaBeAdminHeGotRejected()

      self.setStatus text.from, text.to, "waiting for special"
        

    server.onSpecialConfirmation = (text) ->
      server.setStatus(text.from, text.to, "waiting for special")
      if text.body is "yes"
        specialText = server.getSpecialText(text.from, text.to)
        server.sendThisSpecialToAllMyFollowers(text.from, text.to, special)
      else if text.body is "no"
        server.sayThatTheSpecialWasNotSent text

    server.sayThatTheSpecialWasNotSent = (text) ->
      server.text
        from: text.to
        to: text.from
        body: """
          Ok. that special was *not* sent. 
        """

    server.onSpecial = (text) ->
      server.askForSpecialConfirmation(text)
      server.setSpecialText(text.from, text.to, text.body)

    server.askForSpecialConfirmation = (text) ->
      server.text
        from: text.to
        to: text.from
        body: """
          You are about to send "#{text.body}" to all your subscribers. Reply with "yes" to confirm.
        """
      server.whenTextIsSent(server.setStatus, text.from, text.to,
        "wating for special confirmation")

    server.buyPhoneNumberFor = (from)->
      console.log "fake buying a number"
      #Twilio specific phone here
      #will call server.onBoughtPhoneNumber
      _.defer ->
        server.onBoughtPhoneNumber(from, "480-555-5555")

    server.onBoughtPhoneNumber = (customerPhone, twilioPhone) ->
      server.createDatabaseRecord customerPhone, twilioPhone
      server.congradulateAndAskForBuisinessName(customerPhone, twilioPhone)
      server.setTwilioPhone customerPhone, twilioPhone

    server.setTwilioPhone = (customerPhone, twilioPhone) ->
      server.twilioPhones[customerPhone] = twilioPhone

    server.getTwilioPhone = (customerPhone) ->
      server.twilioPhones[customerPhone]
    
    server.createDatabaseRecord = (customerPhone, twilioPhone) ->
      #TODO: implement
      server.customers or= {}
      server.customers[twilioPhone] = {misterAdmin: customerPhone}
       
    server.onGotBusinessName = (customerPhone, businessName) ->
      twilioPhone = server.getTwilioPhone customerPhone
      server.setBusinessName customerPhone, twilioPhone, businessName
      server.askForBusinessPhone customerPhone

    server.setBusinessName = (customerPhone, twilioPhone, businessName) ->
      server.setMetaInfo(customerPhone, twilioPhone, "businessName", businessName)
      #TODO: Add db to this

    server.setBusinessPhone = (customerPhone, twilioPhone, businessPhone) ->
      server.setMetaInfo(customerPhone, twilioPhone, "businessPhone", businessPhone)
      #TODO: Add db to this
      #
    server.setWannaBeAdmin = (customerPhone, twilioPhone, wannaBeAdmin) ->
      server.setMetaInfo(customerPhone, twilioPhone, "wannaBeAdmin", wannaBeAdmin)
      #TODO: Add db to this
      #
    server.setSpecialText = (customerPhone, twilioPhone, specialText) ->
      server.setMetaInfo(customerPhone, twilioPhone, "specialText", specialText)
      #TODO: Add db to this
      #
    server.setMetaInfo = (from, to, key, value) ->
      server.info[from] or= {}
      server.info[from][to] or= {}
      server.info[from][to][key] = value


    server.onGotBusinessPhone = (customerPhone, businessPhone) ->
      twilioPhone = server.getTwilioPhone customerPhone
      server.setBusinessPhone(customerPhone, twilioPhone, businessPhone)
      server.sayThatTheyreLive(customerPhone, twilioPhone)

    server.sayThatTheyreLive = (customerPhone, twilioPhone) ->
      server.text
        from: server.mobileminNumber
        to: customerPhone
        body: """
          You're live! To send out a text blast, just text a special offer to #{twilioPhone} and all of your subscribers will get the text!  
        """
      server.whenTextIsSent(server.setStatus, customerPhone,
        server.mobileminNumber, "done")

      server.whenTextIsSent(server.setStatus, customerPhone, 
        twilioPhone, "waiting for special")
     

    server.askForBusinessPhone = (customerPhone)->
      server.text
        from: server.mobileminNumber
        to: customerPhone
        body: """
          What is your business phone number so we can forward calls?
        """
      server.whenTextIsSent(server.setStatus, customerPhone, 
        server.mobileminNumber, "waiting for business phone")

      
    server.congradulateAndAskForBuisinessName = (customerPhone, twilioPhone) ->
      server.text
        from: server.mobileminNumber
        to: customerPhone
        body: """
          Congratulations! Your MobileMin number is #{twilioPhone}. Your customers text "join" to subscribe. What is your business name?
        """
      server.whenTextIsSent(server.setStatus, customerPhone, 
        server.mobileminNumber, "waiting for business name")


    server.text = (textInfo) ->
      sms = MobileminText.init(textInfo, server.twilio.twilioClient)
      sms.send()
      waitForTextResponse = server.waitForTextResponse.bind(null, sms)
      sms.once("triedtosendsuccess", waitForTextResponse)
      server.lastSms = sms

    server.whenTextIsSent = (func, args...) ->
      funcToCall = func.bind(null, args...) 
      server.lastSms.once("sent", funcToCall) 

    server.waitForTextResponse = (text) ->
      server.smsSidsWaitingStatus[text.sid] = text

    return server
  return MobileminServer


      
#errors,
#texts per month
#case and punctuation
