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

last = drews.makeEventful {}

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
      console.log "tried to send!!"
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
    password: config.mysql_password
    host: "173.45.232.218"

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
    server.phone = (req, res)->
      console.log "got a phone call"
      twilioResponse = new Twiml.Response(res)
      #TODO: find out what the actual phone numer called was
      if req.body.To == "+14804673355" 
        forwardCall twilioResponse, "+14803813855"
      else
        server.getBusinessPhone req.body.To
        andThen forwardCall.bind null, twilioResponse

    forwardCall = (twilioResponse, phoneNumber) ->
      console.log "it got a phone number for forwarding " + phoneNumber
      twilioResponse.append(new Twiml.Dial(phoneNumber))
      twilioResponse.send()


    ramStati = {}

    server.sms =  (req, res) ->
      
      console.log "Got a text"
      text = req.body 
      text.to = text.To
      text.from = text.From
      text.body = text.Body
      
      server.onText(text)
      res.send "ok"

    server.status = (req, res) ->
      #console.log req.body
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
    Twiml = require("twilio").Twiml

    customerPhone = ""
    twilioPhone = ""
    text = null
    status = null

    server.start =  ->
      server.expressApp.listen 8010 #TODO: use config
      #self.twilio.setupNumbers()

    handleStatus = (status) ->
      console.log "status is : #{status}"
      if status
        console.log "going to act according to status of #{status}"
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
        server.onNewCustomer text.from
      else
        console.log "going to get the status"
        getStatus(text.from, text.to) 
        andThen handleStatus
    
    metaMap =
      status: "status"
      businessPhone: "business_phone"
      businessName: "business_name"
      special: "special"
      twilioPhone: "customer_phone"

    setCustomerInfo = (to, key, value) ->
      console.log ""
      field = metaMap[key]
      somethingNewToWaitFor()
      toDo =  waitingIsOver.bind null, last
      query = mysqlClient.query """
        update customers set `#{field}` = ? where
          mobilemin_phone = ?
      """, [value, to], (err, results) ->
        toDo results
      last

    server.getTwilioPhone = (customerPhone) ->
      console.log "getting twilio phone"
      somethingNewToWaitFor()
      toDo = waitingIsOverWithKey.bind null, last, "mobilemin_phone"
      query = mysqlClient.query """
        select mobilemin_phone from customers where 
          customer_phone = ?
        order by id desc
        limit 1
      """, [customerPhone], (err, results) ->
        toDo results
      last

    

    getCustomerInfo = (to, key) ->
      field = metaMap[key]
      somethingNewToWaitFor()
      toDo = waitingIsOverWithKey.bind null, last, field

      query = mysqlClient.query """
        select `#{field}` from customers where 
          mobilemin_phone = ?
        order by id desc
        limit 1
      """, [to], (err, results) ->
        console.log "NOT MAAAJOOOR"
        console.log results
        toDo results
      false and query.on "end", (err, results) ->
        #TODO seriously why doesn't this work?!!!!!
        # figure this out!!
        console.log "MAAAAJJJJOOORRRR"
        console.log err
        console.log results
      last

    setMetaInfo = (from, to, key, value) ->
      console.log ""
      field = metaMap[key]
      somethingNewToWaitFor()
      toDo = waitingIsOver.bind null, last
      query = mysqlClient.query """
        update statuses set `#{field}` = ? where
          customer_phone = ?
          and mobilemin_phone = ?
      """, [value, from, to], (err, results) ->
        toDo results
      last

    getMetaInfo = (from, to, key) ->
      field = metaMap[key]

      somethingNewToWaitFor()
      toDo = waitingIsOverWithKey.bind null, last, field
      query = mysqlClient.query """
        select `#{field}` from statuses where 
          customer_phone = ?
          and mobilemin_phone = ?
        order by id desc
        limit 1
      """, [from, to], (err, result) ->
        toDo(result)
      last
   
    server.onNewCustomer = (customerPhone) ->
      server.createInitialDbRecord customerPhone
      andThen server.buyPhoneNumberFor, customerPhone
      
    server.createInitialDbRecord = (customerPhone) ->
      query = mysqlClient.query """
        insert into statuses (customer_phone, mobilemin_phone) values
        (?, ?)
      """, [customerPhone, server.mobileminNumber]
      somethingNewToWaitFor()
      query.on "end", waitingIsOver.bind null, last

    server.createDatabaseRecord = (customerPhone, twilioPhone) ->
      query = mysqlClient.query """
        insert into customers (customer_phone, mobilemin_phone) values
        (?, ?)
      """, [customerPhone, twilioPhone]
      somethingNewToWaitFor()
      query.on "end", waitingIsOver.bind null, last
      last

    #todo create a funciton that return the correct waitingisover #refactor

    server.createStatusRecord = (customerPhone, twilioPhone) ->
      query = mysqlClient.query """
        insert into statuses (customer_phone, mobilemin_phone) values
        (?, ?)
      """, [customerPhone, twilioPhone]
      somethingNewToWaitFor()
      query.on "end", waitingIsOver.bind null, last
      last

    server.addThisNumberToTheSubscribeList = (from, to) ->
      somethingNewToWaitFor()
      _last = last
      console.log "going to add this number if it exists"
      exists = checkIfSubscriberExists.bind null, from, to
      addIfExists = addSubscriberIfNotExists.bind null, from, to
      console.log 
      doInOrder exists, addIfExists
      andThen ->
        _last.emit "done", null
      return _last

    false and _.defer ->
      server.onJoin
        from: "+14808405406"
        to: "+14804282578"
        text: "join"
      
    server.removeThisNumberFromTheSubscribeList = (from, to) ->
      somethingNewToWaitFor()
      _last = last
      query = mysqlClient.query """
        delete from subscribers where 
        phone_number = ? and 
        customer_phone = ?
      """, [from, to], (err, results) ->
        _last.emit "done", results
      last

    
    addSubscriberIfNotExists = (from, to, exists) ->
      somethingNewToWaitFor()
      if not exists
        console.log "already exists." 
        _.defer -> last.emit "done", null
        return last

      console.log "now really going to add this nubmer"
      toDo = waitingIsOver.bind null, last
      _last = last
      query = mysqlClient.query """
        insert into subscribers (phone_number, customer_phone) values
        (?, ?)
      """, [from, to], (err, results) ->
        _last.emit "done", results
      last

        
    checkIfSubscriberExists = (from, to) ->
      console.log "checking if subscriber exists"
      #TODO: subscribers table field names need to change
      somethingNewToWaitFor()
      _last = last
      query = mysqlClient.query """
        select exists(select * from subscribers where
          phone_number = ?
          and customer_phone = ?
        ) as `exists`
      """, [from, to], (err, result) ->
        _last.emit "done", result[0]["exists"] == 0
      last

    mysqlClient.on "error", (e) ->
      console.log "mysql error"
      console.log e



    
    somethingNewToWaitFor = () ->
      last = drews.makeEventful {}

    waitingIsOver = (last, value) ->
      last.emit "done", value

    waitingIsOverWithKey = (last, key, value) ->
      ret = value?[0]?[key]
      last.emit "done", ret


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
      


    doAll  = (waiters...) ->
      console.log "doing all"
      length = waiters.length
      count = 0
      results = []
      last = drews.makeEventful {}
      _last = last
      _last.test = "***this is a test"
      _.each waiters, (waiter, index) ->
        _.defer -> #this is important
          waiter = waiter()
          console.log "doAll called  #{index + 1}/#{length}"
          waiter.once "done", (vals...) ->
            count += 1
            console.log "doAll done  #{count}/#{length}"
            results = results.concat vals
            if count is length
              console.log "EMITTING"
              console.log results
              console.log _last.test
              _last.emit "done", results...
      return _last
      
      
    doInOrder  = (waiters...) ->
      console.log "do in order"
      console.log waiters[0] == waiters[1]
      console.log waiters
      length = waiters.length
      count = 0
      results = []
      last = drews.makeEventful {}
      _last = last

      execWaiter = ->
        waiter = waiters[count]
        waiter = waiter results...
        console.log "called doInOrder #{count+1}/#{length}"
        waiter.once "done", (vals...) ->
          results = results.concat vals
          console.log "done with a  doInOrder #{count+1}/#{length}"
          count += 1
          if count is length
            _last.emit "done", results...
          else
            execWaiter()
      _.defer execWaiter
      return _last
      

    server.onJoin = (text) ->
      console.log "going to join"
      {from, to} = text
      gettingBN = -> server.getBusinessName to
      adding = -> server.addThisNumberToTheSubscribeList(from, to)

      doAll gettingBN, adding
      last.once "done", (args...) ->
        console.log "DDOOOOONNNNEEEE"
      andThen server.sayYouWillReceiveSpecials, text

      
    server.onStats = (text) ->
      getTotalSubscribers text
      last.once "done", (total) ->
        console.log(total)
        console.log("hellow wooroasdflahsdfkahdf")
      console.log "hello world"
      console.log last.offer
      andThen giveStats, text

    giveStats = (text, numberOfSubscribers) ->
      console.log "giving stats"
      server.text
        to: text.from
        from: text.to
        body: "You have #{numberOfSubscribers} subscribers."

    getTotalSubscribers = (text) ->
      console.log "getting total"
      somethingNewToWaitFor()
      _last = last
      _last.offer = "200"
      query = mysqlClient.query """
        select count(*) as `count` from subscribers s join customers c on (c.mobilemin_phone = s.customer_phone) where 
          s.customer_phone = ?
          and c.customer_phone = ?
      """, [text.to, text.from], (err, results) ->
         console.log "WOOOOOOOOOOOOO"
         console.log query
         console.log "done"
         console.log results

         _last.emit "done", results?[0]?.count


    server.onStop = (text) ->
      bn = -> server.getBusinessName text.to
      remove = -> server.removeThisNumberFromTheSubscribeList(text.from, text.to)
      doAll bn, remove
      andThen server.sayYouWillNoLongerReceiveTextsFromThisBusiness, text

    server.sayYouWillNoLongerReceiveTextsFromThisBusiness = (text, businessName) ->
      server.text
        from: text.to
        to: text.from
        body: """
          We'll stop texting you. Text "Join" if you change your mind.
          -#{businessName}
        """

    server.sayYouWillReceiveSpecials = (text, businessName) ->
      console.log "business name is #{businessName}"
      console.log "saying you will recieve specials from #{businessName}"
      server.text
        from: text.to
        to: text.from
        body: """
          Congrats! You've joined #{businessName} Text Specials!
          Text "Stop" anytime to cancel.
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
        server.getSpecial(text.from, text.to)
        andThen server.sendThisSpecialToAllMySubscribers, text.from, text.to
      else
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
          customer_phone = ?
      """, [twilioPhone] #TODO customer phone should be mobilemin phone
      somethingNewToWaitFor()
      query.on "row", oneSubscriberDone.bind null, last
      query.on "end", waitingIsOver.bind null, last

    oneSubscriberDone = (last, value) ->
      last.emit "one", value["phone_number"]

    

    server.sayThatTheSpecialWasNotSent = (text) ->
      server.text
        from: text.to
        to: text.from
        body: """
          Ok. That special was *not* sent. 
        """

    server.onSpecial = (text) ->
      if text.body == "#"
        return server.onStats text

      server.getBusinessName text.to
      andThen continueSpecialProcess.bind null, text

    continueSpecialProcess = (text, businessName) ->
      text.body += "\n-#{businessName}"
      if text.body.length > 160
        sayYourMessageIsTooLong(text)
      else
        server.askForSpecialConfirmation(text)
        server.setSpecial(text.from, text.to, text.body)

    sayYourMessageIsTooLong = (text) ->
      over = text.body.length - 160
      server.text
        from: text.to
        to: text.from
        body: """
          Your message is #{over} characters too long. Trim it down and send it again.
        """

    server.askForSpecialConfirmation = (text) ->
      server.text
        from: text.to
        to: text.from
        body: """
          You are about to send that to all your subscribers. Reply "yes" to confirm, "no" to cancel.
        """
      andThen(setStatus, text.from, text.to,
        "waiting for special confirmation")

    server.buyPhoneNumberFor = (from)->
      areaCode = drews.s(from, 2, 3) #get rid of +1, and get area code 
      buySuccess = (justBoughtNumber) =>
        newPhone = justBoughtNumber.phone_number
        server.onBoughtPhoneNumber(from, newPhone)
        console.log "you just bought a number which was #{newPhone}"
     
      buyError = (error) =>
        console.log "There was an error"
      actuallyBuy = true
      actuallyBuy and twilio.twilioClient.apiCall('POST', '/IncomingPhoneNumbers', {params: {
        VoiceUrl: "http://mobilemin-server.drewl.us/phone"
        SmsUrl: "http://mobilemin-server.drewl.us/sms"
        AreaCode: areaCode
        StatusUrl: "http://mobilemin-server.drewl.us/status"

      }}, buySuccess, buyError)



    server.onBoughtPhoneNumber = (customerPhone, twilioPhone) ->
      customers = -> server.createDatabaseRecord customerPhone, twilioPhone
      statuses = -> server.createStatusRecord customerPhone, twilioPhone
      doAll customers, statuses
      andThen afterDbRecordCreated, customerPhone, twilioPhone

      tellKyleSomeoneSignedUp(customerPhone, twilioPhone)

    tellKyleSomeoneSignedUp = (customerPhone, twilioPhone) ->
      text = 
        from: server.mobileminNumber
        to: "4803813855"
        body: """
          Someone new signed up. Their Text Marketing Number is #{prettyPhone twilioPhone}.
          Their cell phone is #{prettyPhone customerPhone}.
        """
      server.text text

    tellKyleSomeoneFinished = (customerPhone, twilioPhone, businessPhone, businessName) ->
      server.text
        from: server.mobileminNumber
        to: "4803813855"
        body: """
          #{businessName} finished signing up.
          Their Text Marketing number is #{prettyPhone twilioPhone}.
          Their business phone is #{prettyPhone businessPhone}.
          Their cell phone is #{prettyPhone customerPhone}.

        """

    afterDbRecordCreated = (customerPhone, twilioPhone)->
      server.sayThatTheyreLive customerPhone, twilioPhone
      andThen waitAndAskForBusinessName, customerPhone, twilioPhone


    waitAndAskForBusinessName = (customerPhone, twilioPhone)->
      console.log "waiting and then asking for business name"
      askForName = server.askForBusinessName.bind null, customerPhone, twilioPhone
      drews.wait 1000, askForName


    

       
    server.onGotBusinessName = (customerPhone, businessName) ->
      console.log "got business name!!!"
      server.getTwilioPhone customerPhone
      andThen handleBusinessName, customerPhone, businessName


    handleBusinessName = (customerPhone, businessName, twilioPhone) ->
      console.log "handling business name"
      server.setBusinessName twilioPhone, businessName
      andThen server.askForBusinessPhone, customerPhone

    getStatus = (from, to) ->
      console.log "getting status"
      getMetaInfo from, to, "status"

    setStatus = (from, to, status) ->
      setMetaInfo from, to, "status", status
      if status is "waiting to allow admin"
        server.inOneHour(setStatus, from, to, "waiting for special")

    server.setSpecial = (customerPhone, twilioPhone, special) ->
      setMetaInfo(customerPhone, twilioPhone, "special", special)

    server.getSpecial = (customerPhone, twilioPhone) ->
      getMetaInfo(customerPhone, twilioPhone, "special")

    server.setBusinessName = (twilioPhone, businessName) ->
      console.log "setting business name #{twilioPhone}: #{businessName}"
      setCustomerInfo(twilioPhone, "businessName", businessName)

    server.getBusinessName = (twilioPhone) ->
      console.log "getting business name for #{twilioPhone}"
      getCustomerInfo(twilioPhone, "businessName")

    _.defer ->
      setInterval server.getBusinessName.bind(null, "4808405406"), 10000

    server.setBusinessPhone = (twilioPhone, businessPhone) ->
      setCustomerInfo(twilioPhone, "businessPhone", businessPhone)

    server.getBusinessPhone = (twilioPhone) ->
      getCustomerInfo(twilioPhone, "businessPhone")

    server.setWannaBeAdmin = (twilioPhone, wannaBeAdmin) ->
      setCustomerInfo(twilioPhone, "wannaBeAdmin", wannaBeAdmin)

    server.getWannaBeAdmin = (twilioPhone) ->
      getCustomerInfo(twilioPhone, "wannaBeAdmin")



    server.onGotBusinessPhone = (customerPhone, businessPhone) ->
      console.log "ON GOT BUSINESS PHONE"
      console.log businessPhone
      console.log "end business phone"
      server.getTwilioPhone customerPhone
      andThen handleBusinessPhone, customerPhone, businessPhone
    
    handleBusinessPhone  = (customerPhone, businessPhone, twilioPhone) ->
      console.log "handling business PHONE!!!! #{twilioPhone}"
      server.setBusinessPhone(twilioPhone, businessPhone)
      andThen server.sayThatTheyreLiveAgain, customerPhone, twilioPhone, businessPhone

    server.sayThatTheyreLive = (customerPhone, twilioPhone) ->
      prettyTwilioPhone = prettyPhone twilioPhone
      text = server.text
        from: server.mobileminNumber
        to: customerPhone
        body: """
          You're live! Your Text Marketing Number is #{prettyTwilioPhone}. Text it to send your customers a special. They text "Join" to subscribe.
        """

      andThen setStatus, customerPhone, twilioPhone, "waiting for special"
      return text

     
    server.sayThatTheyreLiveAgain = (customerPhone, twilioPhone, businessPhone) ->
      prettyTwilioPhone = prettyPhone twilioPhone
      server.text
        from: server.mobileminNumber
        to: customerPhone
        body: """
          All set. Invite your customers to receive text specials by having them text "Join" to #{prettyPhone twilioPhone}.
          Now, save that number in your phone.
        """
      andThen(setStatus, customerPhone,
        server.mobileminNumber, "done")

      server.getBusinessName twilioPhone
      andThen tellKyleSomeoneFinished.bind null, customerPhone, twilioPhone, businessPhone

    server.askForBusinessPhone = (customerPhone)->
      server.text
        from: server.mobileminNumber
        to: customerPhone
        body: """
          What is your business phone number?
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
      itsDone = sms.emit.bind sms, "done"
      sms.once "sent", itsDone
      return sms


    server.waitForTextResponse = (text) ->
      server.smsSidsWaitingStatus[text.sid] = text

    return server
  return MobileminServer


      
#errors,
#texts per month
#case and punctuation
