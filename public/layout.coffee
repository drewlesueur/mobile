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

like = (input, text) ->
  input = input.replace /\W/g, ""
  return input.toLowerCase() == text.toLowerCase()

prettyPhone = (phone) ->
  if phone.length == 12
    phone = drews.s phone, 2
  areacode = drews.s(phone, 0, 3)
  prefix = drews.s phone, 3, 3
  suffix = drews.s phone, 6
  return "#{areacode}-#{prefix}-#{suffix}"

last = drews.eventMaker {}

andThen = (fn, args...) ->
  whatToDo = fn.bind null, args...
  last.once "done", whatToDo

onEach = (fn, args...) ->
  whatToDo = fn.bind null, args...
  last.on "one", whatToDo

onError = (fn, args...) ->
  whatToDo = fn.bind null, args...
  last.on "one", whatToDo
 

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
        sms.emit("error")
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

  mysql = require "mysql"
  mysqlClient = mysql.createClient
    user: config.mysql_user
    passsword: config.mysql_password

  mysqlClient.query("USE mobilemin");

  _ = dModule.require "underscore"
  MobileminApp = dModule.require "mobilemin-app"
  MobileminText = dModule.require "mobilemin-text"

  MobileminTwilio = dModule.require "mobilemin-twilio"

  MobileminServer = {}
  MobileminServer.init = ->
    server = {}
    status = null
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

    handleStatus = ->
      if status
        server.actAccordingToStatus(status, text)
      else if like text.body, "admin"
        server.onAdmin(text)
      else if like text.body, "stop"
        server.onStop(text)
      else
        server.onJoin(text)
      
    server.onText = (_text) ->
      text = _text
      console.log("text!")
      if text.to is server.mobileminNumber and like(text.body, "start")
        console.log("its a start")
        server.buyPhoneNumberFor(text.from)
      else
        getStatus() 
        andThen handleStatus
    
    metaMap =
      status: "status"
      businessPhone: "business_phone"
      businessName: "business_name"
      special: "special"

    setMetaInfo = (from, to, key, value) ->
      field = metaMap[key]
      query = mysqlClient.query """
        update customers set `#{field}` = ? where
          customer_phone = ?
          and mobilemin_phone = ?
      """, [value, from, to]
      somethingNewToWaitFor()
      query.on "end", waitingIsOver

    getMetaInfo = (from, to, key) ->
      field = metaMap[key]
      query = mysqlClient.query """
        select `#{field}` from customers where 
          customer_phone = ?
          and mobilemin_phone = ?
      """, [from, to]
      somethingNewToWaitFor()
      query.on("field", waitingIsOver)

    server.createDatabaseRecord = (customerPhone, twilioPhone) ->
      query = mysqlClient.query """
        insert into customers (customer_phone, mobilemin_phone) values
        (?, ?)
      """, [customer_phone, mobilemin_phone]
      somethingNewToWaitFor()
      query.on "end", waitingIsOver

    server.addThisNumberToTheSubscribeList = (from, to) ->
      query = mysqlClient.query """
        insert into subscribers (phone_number, customer_phone) values
        (?, ?)
      """, [from, to]
      somethingNewToWaitFor()
      query.on "end", waitingIsOver


    server.removeThisNumberFromTheSubscribeList = (from, to) ->
      remove = drews.makeEventful {}
      server.remove = remove
      _.defer ->
        remove.emit("done")

    
    somethingNewToWaitFor = () ->
      last = drews.eventMaker {}

    waitingIsOver = (value) ->
      last.emit "done", value
      console.log value


    server.onAdmin = (text) ->
      server.getMisterAdmin(text.to)
      andThen(server.askMisterAdminIfNewGuyCanBeAdmin, text.to, text.from)

    server.getMisterAdmin = () ->
      last = ""

    server.askMisterAdminIfNewGuyCanBeAdmin = (twilioPhone, wannaBeAdmin, misterAdmin) ->
      server.text
        to: misterAdmin
        from: wannaBeAdmin
        body: """
          Can #{wannaBeAdmin} send texts to your subscribers on your behalf?
        """
      andThen(setStatus, misterAdmin, twilioPhone, "waiting to allow admin")
      andThen(server.setWannaBeAdmin, misterAdmin, twilioPhone, wannaBeAdmin)
      
      
    server.onJoin = (text) ->
      server.addThisNumberToTheSubscribeList(text.from, text.to)
      andThen server.sayYouWillReceiveSpecials, text



    server.onStop = (text) ->
      server.removeThisNumberFromTheSubscribeList(text.from, text.to)
      andThen(
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
      andThen(server.forwardCall)

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
      if like text.body, "yes"
        self.grantAdminAccess(wannaBeAdmin)
        andThen(self.tellWannaBeAdminHeIsAnAdmin, text.to, wannaBeAdmin)
      else
        self.tellWannaBeAdminHeGotRejected()

      setStatus text.from, text.to, "waiting for special"
        

    server.onSpecialConfirmation = (text) ->
      setStatus(text.from, text.to, "waiting for special")
      if like text.body, "yes"
        special = server.getSpecial(text.from, text.to)
        server.sendThisSpecialToAllMySubscribers(text.from, text.to, special)
      else if text.body is "no"
        server.sayThatTheSpecialWasNotSent text

    server.sendThisSpecialToAllMySubscribers = (customerPhone, twilioPhone, special) ->
      server.getAllSubscribers(twilioPhone)
      sendInfo = sent: 0, tried: 0, gotStatusFor: 0, erroredPhones: []
      onEach(server.sendToThisPerson, sendInfo, twilioPhone, special)
      andThen server.sendResultsOfSpecial, customerPhone, twilioPhone, sendInfo

    server.sendResultsOfSpecial = (customerPhone, twilioPhone, sendInfo) ->
      body =  """
        Your special was sent to #{sendInfo.tried} People.
      """
      server.text
        from: twilioPhone
        to: customerPhone
        body: body

    server.sendToThisPerson = (sendInfo, twilioPhone, special, person) ->
      text = server.text
        from: twilioPhone
        to: person
        body: special 
      
      sendInfo.tried += 1
      andThen server.acumulateSent, sendInfo, text
      onError server.acumulateError, sendInfo, text
    

    server.acumulateSent = (sendInfo, text) ->
      sendInfo.sent += 1

    server.acumulateError = (sendInfo, text) ->
      sendInfo.erroredPhones.push text.to

    server.getAllSubscribers = (twilioPhone) ->
      query = mysqlClient.query """
        select phone_number from subscribers where 
          and mobilemin_phone = ?
      """, [twilioPhone]
      somethingNewToWaitFor()
      query.on "field", oneDone
      query.on "end", waitingIsOver

    oneDone = (value) ->
      last.emit "one", value

    

    server.sayThatTheSpecialWasNotSent = (text) ->
      server.text
        from: text.to
        to: text.from
        body: """
          Ok. that special was *not* sent. 
        """

    server.onSpecial = (text) ->
      server.askForSpecialConfirmation(text)
      server.setSpecial(text.from, text.to, text.body)

    server.askForSpecialConfirmation = (text) ->
      server.text
        from: text.to
        to: text.from
        body: """
          You are about to send "#{text.body}" to all your subscribers. Reply with "yes" to confirm.
        """
      andThen(setStatus, text.from, text.to,
        "waiting for special confirmation")

    server.buyPhoneNumberFor = (from)->
      console.log "fake buying a number"
      #Twilio specific phone here
      #will call server.onBoughtPhoneNumber
      _.defer ->
        server.onBoughtPhoneNumber(from, "+14804282578")

    server.onBoughtPhoneNumber = (customerPhone, twilioPhone) ->
      server.createDatabaseRecord customerPhone, twilioPhone
      andThen afterDbRecordCreated

    afterDbRecordCreated = ->
      server.sayThatTheyreLive customerPhone, twilioPhone
      server.setTwilioPhone customerPhone, twilioPhone
      andThen waitAndAskForBusinessName

    waitAndAskForBusinessName = ->
      askForName = server.askForBusinessName.bind null, customerPhone, twilioPhone
      drews.wait 1000, askForName

    server.setTwilioPhone = (customerPhone, twilioPhone) ->
      server.twilioPhones[customerPhone] = twilioPhone

    server.getTwilioPhone = (customerPhone) ->
      server.twilioPhones[customerPhone]
    

       
    server.onGotBusinessName = (customerPhone, businessName) ->
      twilioPhone = server.getTwilioPhone customerPhone
      server.setBusinessName customerPhone, twilioPhone, businessName
      andThen server.askForBusinessPhone, customerPhone

    getStatus = (from, to) ->
      getMetaInfo from, to, status

    setStatus = (from, to, status) ->
      setMetaInfo from, to, "status", status
      if status is "waiting to allow admin"
        server.inOneHour(setStatus, from, to, "waiting for special")

    server.setBusinessName = (customerPhone, twilioPhone, businessName) ->
      setMetaInfo(customerPhone, twilioPhone, "businessName", businessName)

    server.getBusinessName = (customerPhone, twilioPhone) ->
      setMetaInfo(customerPhone, twilioPhone, "businessName")

    server.setBusinessPhone = (customerPhone, twilioPhone, businessPhone) ->
      setMetaInfo(customerPhone, twilioPhone, "businessPhone", businessPhone)

    server.getBusinessPhone = (customerPhone, twilioPhone) ->
      setMetaInfo(customerPhone, twilioPhone, "businessPhone")

    server.setWannaBeAdmin = (customerPhone, twilioPhone, wannaBeAdmin) ->
      setMetaInfo(customerPhone, twilioPhone, "wannaBeAdmin", wannaBeAdmin)

    server.getWannaBeAdmin = (customerPhone, twilioPhone) ->
      setMetaInfo(customerPhone, twilioPhone, "wannaBeAdmin")

    server.setSpecial = (customerPhone, twilioPhone, special) ->
      setMetaInfo(customerPhone, twilioPhone, "special", special)

    server.getSpecial = (customerPhone, twilioPhone) ->
      getMetaInfo(customerPhone, twilioPhone, "special")

    server.onGotBusinessPhone = (customerPhone, businessPhone) ->
      twilioPhone = server.getTwilioPhone customerPhone
      server.setBusinessPhone(customerPhone, twilioPhone, businessPhone)
      andThen server.sayThatTheyreLiveAgain(customerPhone, twilioPhone)

    server.sayThatTheyreLive = (customerPhone, twilioPhone) ->
      prettyTwilioPhone = prettyPhone twilioPhone
      server.text
        from: server.mobileminNumber
        to: customerPhone
        body: """
          You're live! To send out a text blast, just text a special offer to #{prettyTwilioPhone} and all of your subscribers will get the text!  
        """

      andThen setStatus, customerPhone, twilioPhone, "waiting for special"

     
    server.sayThatTheyreLiveAgain = (customerPhone, twilioPhone) ->
      prettyTwilioPhone = prettyPhone twilioPhone
      server.text
        from: server.mobileminNumber
        to: customerPhone
        body: """
          Thanks. Now send out a special to #{prettyPhone twilioPhone}.
        """
      andThen(setStatus, customerPhone,
        server.mobileminNumber, "done")

    server.askForBusinessPhone = (customerPhone)->
      server.text
        from: server.mobileminNumber
        to: customerPhone
        body: """
          What is your business phone number so we can forward calls?
        """
      andThen(setStatus, customerPhone, 
        server.mobileminNumber, "waiting for business phone")

      
    server.askForBusinessName = (customerPhone, twilioPhone) ->
      server.text
        from: server.mobileminNumber
        to: customerPhone
        body: """
          What is your business name?
        """
      #TODO: should I wait till text is sent
      andThen(setStatus, customerPhone, 
        server.mobileminNumber, "waiting for business name")


    server.text = (textInfo) ->
      sms = MobileminText.init(textInfo, server.twilio.twilioClient)
      sms.send()
      waitForTextResponse = server.waitForTextResponse.bind(null, sms)
      sms.once("triedtosendsuccess", waitForTextResponse)
      server.lastSms = sms
      last = sms #for use with "andThen"
      return sms


    server.waitForTextResponse = (text) ->
      server.smsSidsWaitingStatus[text.sid] = text

    return server
  return MobileminServer


      
#errors,
#texts per month
#case and punctuation
