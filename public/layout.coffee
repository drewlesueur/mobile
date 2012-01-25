config = dModule.require "config"

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
        "http://#{config.server.hostName}:#{config.server.port}/status",
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

  clientCredentials = 
    user: config.mysql_user
    password: config.mysql_password
    host: config.server.hostName

  mysqlClient = mysql.createClient clientCredentials

  onReconnect = (err) ->
    console.log "trying got reconnect status"
    if err and err.errno is 'ECONNREFUSED'
      console.log "trying to reconnect in 1 sec"
      drews.wait 1000, tryToReconnect


  tryToReconnect = () ->
    console.log "trying to reconnect now"
    mysqlClient = mysql.createClient clientCredentials
    mysqlClient.query "use mobilemin", (err) ->
      console.log "first query after"
      console.log err

  checkConnection = () ->
    console.log "checking connection"
    if not mysqlClient.connected
      tryToReconnect()
    else
      console.log "good"
      

  drews.wait 1000, ->
    setInterval checkConnection, 5000

  mysqlClient.on "error", (err) ->
    console.log "mysql error"
    console.log err

  mysqlClient.on "end", (e) ->
    console.log "it ended"
    console.log e
  
  mysqlClient.query("USE mobilemin");
  mysqlClient.query "select `customer_phone` from statuses where customer_phone like '%4%'", (err, results) ->
    console.log "done showing tables"
    console.log results
    #mysqlClient.end ->
    #  mysqlClient.query "select count(*) from statuses", ->
    #    console.log "got done with second one!"

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
      if req.body.To == server.mobileminNumber
        forwardCall twilioResponse, "+14803813855"
      else
        server.getBusinessPhone req.body.To
        andThen forwardCall.bind null, twilioResponse

    forwardCall = (twilioResponse, phoneNumber) ->
      console.log "it got a phone number for forwarding " + phoneNumber
      twilioResponse.append(new Twiml.Dial(phoneNumber))
      twilioResponse.send()


    ramStati = {}
   
    #for testing
    server.setLast = (_last) ->
      last = _last
    server.prettyPhone = prettyPhone

    server.sms =  (req, res) ->
      console.log "Got a text"
      text = req.body 
      text.to = text.To
      text.from = text.From
      text.body = text.Body
      if (not isTextHold text.from, text.to) or like(text.body, "yes") or like(text.body, "no")
        console.log "not on hold, releasing"
        createTextHold(text.from, text.to) #holding for long messages
        drews.wait 4000, releaseTextHold.bind(null, text.from, text.to)
        server.onText text
      else
        console.log """ 
        
          on hold, not releasing
          the text that is on hold is
          #{text.body.substring(0, 10)}...

        """

      res.send ""

    server.status = (req, res) ->
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
      res.send ""
        
    #server.mobileminNumber =  "+14804673355"
    server.mobileminNumber =  "+14804673455"
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
      if status
        server.actAccordingToStatus(status, text)
      else if like text.body, "admin"
        server.onAdmin(text)
      else if like text.body, "stop"
        server.onStop(text)
      else if text.body.length <= 6
        server.onJoin(text)
      
    server.onText = (_text) ->
      text = _text
      if text.to is server.mobileminNumber and like(text.body, "start")
        server.onNewCustomer text.from
      else
        getStatus(text.from, text.to) 
        andThen handleStatus
    
    metaMap =
      status: "status"
      businessPhone: "business_phone"
      businessName: "business_name"
      special: "special"
      twilioPhone: "customer_phone"
      joinText: "join_text"

    setCustomerInfo = (to, key, value) ->
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
      exists = checkIfSubscriberExists.bind null, from, to
      addIfExists = addSubscriberIfNotExists.bind null, from, to
      doInOrder exists, addIfExists
      andThen (doesntAlreadyExist)->
        _last.emit "done", doesntAlreadyExist
      return _last

      
    server.removeThisNumberFromTheSubscribeList = (from, to) ->
      somethingNewToWaitFor()
      _last = last
      query = mysqlClient.query """
        update subscribers set active = 0 where 
        phone_number = ? and 
        customer_phone = ?
      """, [from, to], (err, results) ->
        _last.emit "done", results
      last

    
    addSubscriberIfNotExists = (from, to, doesntExist) ->
      somethingNewToWaitFor()

      _last = last
      if not doesntExist #if it does exist
        query = mysqlClient.query """
          update subscribers set active = 1 where
            phone_number = ? and
            customer_phone = ?
        """, [from, to], (err, results) ->
          _last.emit "done", results
      else 
        toDo = waitingIsOver.bind null, last
        query = mysqlClient.query """
          insert into subscribers (phone_number, customer_phone, active) values
          (?, ?, 1)
        """, [from, to], (err, results) ->
          _last.emit "done", results
      last

        
    checkIfSubscriberExists = (from, to) ->
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
      length = waiters.length
      count = 0
      results = []
      last = drews.makeEventful {}
      _last = last
      _last.test = "***this is a test"
      _.each waiters, (waiter, index) ->
        _.defer -> #this is important
          waiter = waiter()
          waiter.once "done", (vals...) ->
            count += 1
            results[index] = vals
            #results = results.concat vals
            if count is length
              flattenedResults = []
              for result in results # results is [[a], [g, b], [d]]
                for resultItem in result #result is [a] or [g,b]
                  flattenedResults.push resultItem #flattened = [a, g, b, d]
              _last.emit "done", flattenedResults...
      return _last
      
      
    doInOrder  = (waiters...) ->
      length = waiters.length
      count = 0
      results = []
      last = drews.makeEventful {}
      _last = last

      execWaiter = ->
        waiter = waiters[count]
        waiter = waiter results...
        waiter.once "done", (vals...) ->
          results = results.concat vals
          count += 1
          if count is length
            _last.emit "done", results...
          else
            execWaiter()
      _.defer execWaiter
      return _last
      

    server.onJoin = (text) ->
      {from, to} = text
      gettingBN = -> server.getBusinessName to
      adding = -> server.addThisNumberToTheSubscribeList(from, to)
      gettingJoinText = -> getJoinText text.to

      doAll gettingBN, adding, gettingJoinText
      andThen server.sayYouWillReceiveSpecials, text

    server.onStats = (text) ->
      getTotalSubscribers text
      last.once "done", (total) ->
      andThen giveStats, text

    giveStats = (text, numberOfSubscribers) ->
      server.text
        to: text.from
        from: text.to
        body: "You have #{numberOfSubscribers} subscribers."

    getTotalSubscribers = (text) ->
      somethingNewToWaitFor()
      _last = last
      _last.offer = "200"
      query = mysqlClient.query """
        select count(*) as `count` from subscribers s join customers c on (c.mobilemin_phone = s.customer_phone) where 
          s.customer_phone = ?
          and c.customer_phone = ?
      """, [text.to, text.from], (err, results) ->
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

    server.sayYouWillReceiveSpecials = (text, businessName, didntAlreadyExist, joinText) ->
      if didntAlreadyExist 
        if not joinText
          joinText = """
            Congrats! You've joined #{businessName} Text Specials!
            Text "Stop" anytime to cancel.
          """
        server.text
          from: text.to
          to: text.from
          body: joinText
      else
        server.text
          from: text.to
          to: text.from
          body: """
            Hooray! You're signed up to receive text specials.
            -#{businessName}
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
      else if status is "waiting for join text"
        onGotJoinText text
        
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
      sendInfo = sent: 0, tried: 0, gotStatusFor: 0, erroredPhones: []
      #letUserKnowTextsAreBeingSentOut(customerPhone, twilioPhone)
      server.getAllSubscribers(twilioPhone)
      onEach(server.sendToThisPerson, sendInfo, twilioPhone, special)
      andThen server.sendResultsOfSpecial, customerPhone, twilioPhone, sendInfo

    letUserKnowTextsAreBeingSentOut = (customerPhone, twilioPhone) ->
      server.text
        from: twilioPhone
        to: customerPhone
        body: "Ok. It's being sent out as we speak."

    server.sendResultsOfSpecial = (customerPhone, twilioPhone, sendInfo) ->
      body =  """
        Your special was sent to #{sendInfo.tried} People.
      """
      server.text
        from: twilioPhone
        to: customerPhone
        body: body

    server.sendToThisPerson = (sendInfo, twilioPhone, special, person) ->
      console.log "trying to send special to #{person}"
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
          customer_phone = ? and active = 1
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
    
    setRamStatus = (from, to, prop, value) ->
      key = from + to
      ramStati[key] ||= {}
      ramStati[key][prop] = value

    getRamStatus = (from, to, prop) ->
      key = from + to
      ramStati[key] ||= {}
      ramStati[key][prop]

    removeIncomingTextHold = (from, to) ->
      setRamStatus(from, to, "hold", false) 

    createTextHold = (from, to) ->
      setRamStatus from, to, "hold", true

    releaseTextHold = (from, to) ->
      setRamStatus from, to, "hold", false

    isTextHold = (from, to) ->
      getRamStatus from, to, "hold"

    server.onSpecial = (text) ->
      if text.body == "#"
        return server.onStats text
      if like text.body, "join"
        return onJoinTextChange text

      server.getBusinessName text.to
      andThen continueSpecialProcess.bind null, text

    onJoinTextChange = (text) ->
      askThemWhatTheirNewJoinTextShouldSay text
      andThen setStatus, text.from, text.to, "waiting for join text"

    onGotJoinText = (text) ->
      if (text.body > 160)
        sayJoinTextIsTooLong text
        return
      setJoinText text.to, text.body
      respondWithJoinText text
      andThen sayJoinTextWasUpdatedAndWaitForSpecial, text

    respondWithJoinText = (text) ->
      server.text
        from: text.to
        to: text.from
        body: text.body

    sayJoinTextWasUpdatedAndWaitForSpecial = (text) ->
      server.text
        to: text.from
        from: text.to
        body: "Your join text was updated."
      setStatus text.from, text.to, "waiting for special"

    sayJoinTextIsTooLong = (text) ->
      server.text
        from: text.to
        to: text.from
        body: "That join text is too long. Trim it down a bit."
        
        

    askThemWhatTheirNewJoinTextShouldSay = (text) ->
      server.text
        from: text.to
        to: text.from
        body: """
          How would you like it to respond when somebody joins?
        """

    continueSpecialProcess = (text, businessName) ->
      originalBody = text.body
      signature = "\n-#{businessName}"
      text.body += signature
      console.log """

        the text body to send is
        #{text.body}


      """
      if text.body.length > 160
        truncatedBody = originalBody.substring(0, 160 - signature.length) 
        text.body = truncatedBody + signature
        replyWithTheSpecialToTheUser text
        #andThen -> drews.wait 500, -> sayYourMessageIsTooLong(text)
        andThen sayYourMessageIsTooLong, text
      else
        settingSpecial = -> server.setSpecial(text.from, text.to, text.body)
        replyingWithSpecial = -> replyWithTheSpecialToTheUser text
        doAll settingSpecial, replyingWithSpecial
        #andThen -> drews.wait 500, -> server.askForSpecialConfirmation(text)
        andThen server.askForSpecialConfirmation, text

    sayYourMessageIsTooLong = (text) ->
      over = text.body.length - 160
      server.text
        from: text.to
        to: text.from
        body: """
          Your message is too long. Trim it down and send it again.
        """

    replyWithTheSpecialToTheUser = (text) ->
      #sending the text to them so they can review it
      server.text
        from: text.to
        to: text.from
        body: text.body

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
        VoiceUrl: "http://#{config.server.hostName}:#{config.server.port}/phone"
        SmsUrl: "http://#{config.server.hostName}:#{config.server.port}/sms"
        AreaCode: areaCode
        StatusUrl: "http://#{config.server.hostName}:#{config.server.port}/status"

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
        to: "+14803813855"
        body: """
          Someone new signed up. Their Text Marketing Number is #{prettyPhone twilioPhone}.
          Their cell phone is #{prettyPhone customerPhone}.
        """
      server.text text

    tellKyleSomeoneFinished = (customerPhone, twilioPhone, businessPhone, businessName) ->
      server.text
        from: server.mobileminNumber
        to: "+14803813855"
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
      askForName = server.askForBusinessName.bind null, customerPhone, twilioPhone
      drews.wait 1000, askForName


    

       
    server.onGotBusinessName = (customerPhone, businessName) ->
      server.getTwilioPhone customerPhone
      andThen handleBusinessName, customerPhone, businessName


    handleBusinessName = (customerPhone, businessName, twilioPhone) ->
      server.setBusinessName twilioPhone, businessName
      andThen server.askForBusinessPhone, customerPhone

    getStatus = (from, to) ->
      getMetaInfo from, to, "status"

    setStatus = (from, to, status) ->
      setMetaInfo from, to, "status", status
      if status is "waiting to allow admin"
        server.inOneHour(setStatus, from, to, "waiting for special")

    server.setSpecial = (customerPhone, twilioPhone, special) ->
      setMetaInfo(customerPhone, twilioPhone, "special", special)

    setJoinText = (twilioPhone, joinText) ->
      setCustomerInfo(twilioPhone, "joinText", joinText)

    getJoinText = (twilioPhone) ->
      getCustomerInfo(twilioPhone, "joinText")

    server.getSpecial = (customerPhone, twilioPhone) ->
      getMetaInfo(customerPhone, twilioPhone, "special")

    server.setBusinessName = (twilioPhone, businessName) ->
      setCustomerInfo(twilioPhone, "businessName", businessName)

    server.getBusinessName = (twilioPhone) ->
      console.log "getting businessName"
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
      server.getTwilioPhone customerPhone
      andThen handleBusinessPhone, customerPhone, businessPhone
    
    handleBusinessPhone  = (customerPhone, businessPhone, twilioPhone) ->
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
