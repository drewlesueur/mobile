server = MobileminServer.init()

server.onText = (text) ->
  if text.to is mainMobileminNumber and text.body is "start"
    server.buyPhoneNumberFor(text.from)
  else if server.hasAStatus(text.from, text.to)
    status = server.getStatus(text.from, text.to)
    server.actAccordingToStatus(status, text)
  else if text.body is "join"
    server.onJoin(text)

server.onJoin = (text) ->
  server.addThisNumberToTheSubscribeList(text.from, text.to)
  server.getBusinessNameFor(text.to)
  server.whenNumberIsAddedAndGotBusinessName(
    server.sayYouWillReceiveSpecials, text.to
  )

server.sayYouWillReceiveSpecials = (text.to, businessName) ->
  server.text
    from: text.to
    to: text.from
    body: """
      You just signed up for free specials from #{businessNames}.
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
    server.onGotBusinessPhone(text.from, text.body, twilioPhone)
  else if status is "waiting for special"
    server.onSpecial(text)
  else if status is "waiting for special confirmation"
    server.onSpecialConfirmation(text)

server.onSpecialConfirmation = (text) ->
  server.setStatus(text.from, text.to, "waiting for special")
  if text.body is "yes"
    specialText = server.getStatusInfo(text.from, text.to, "special")
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
  server.setStatusInfo(text.from, text.to, "special", text.from)

server.askForSpecialConfirmation = (text) ->
  server.text
    from: text.to
    to: text.from
    body: """
      You are about to send "#{text.body}" to all your subscribers. Reply with "yes" to confirm.
    """
  server.whenTextIsSent(server.setStatus, text.from, text.to,
    "wating for special confirmation")

server.buyPhoneNumberFor = (text.from)->
  #Twilio specific phone here
  #will call server.onBoughtPhoneNumber

server.onBoughtPhoneNumber = (customerPhone, twilioPhone) ->
  server.createDatabaseRecord customerPhone, twilioPhone
  server.congradulateAndAskForBuisinessName(customerPhone, twilioPhone)
  server.setStatusInfo customerPhone, mainMobileminNumber, "twilioPhone", twilioPhone 
  
server.onGotBusinessName = (customerPhone, businessName) ->
  twilioPhone = server.getStatusInfo customerPhone, mainMobileminNumber, "twilioPhone"
  server.setBusinessName customerPhone, twilioPhone, businessName
  server.askForBusinessPhone customerPhone

server.onGotBusinessPhone = (customerPhone, businessPhone, twilioPhone) ->
  twilioPhone = server.getStatusInfo customerPhone, mainMobileminNumber, "twilioPhone"
  server.setBusinessPhone(customerPhone, twilioPhone, businessPhone)
  server.sayThatTheyreLive(customerPhone, twilioPhone)

server.sayThatTheyreLive = (customerPhone, twilioPhone) ->
  server.text
    from: mainMobileminNumber
    to: customerPhone
    body: """
      You're live! To send out a text blast, just text a special offer to #{twilioPhone} and all of your subscribers will get the text!  
    """
  server.whenTextIsSent(server.setStatus, customerPhone,
    mainMobileminNumber, "done")

  server.whenTextIsSent(server.setStatus, customerPhone, 
    twilioPhone, "waiting for special")
 

server.askForBusinessPhone = (customerPhone)->
  server.text
    from: mainMobileminNumber
    to: customerPhone
    body: """
      What is your business phone number so we can forward calls?
    """
  server.whenTextIsSent(server.setStatus, customerPhone, 
    mainMobileminNumber, "waiting for business phone")

  
server.congradulateAndAskForBuisinessName = (customerPhone, twilioPhone) ->
  server.text
    from: mainMobileminNumber
    to: customerPhone
    body: """
      Congratulations! Your MobileMin number is #{twilioPhone}. Your customers text "join" to subscribe. What is your business name?
    """
  server.whenTextIsSent(server.setStatus, customerPhone, 
    mainMobileminNumber, "waiting for business name")
