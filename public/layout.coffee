
server = MobileminServer.init()

server.onText = (text) ->
  if text.to is mainMobileminNumber and text.body is "start"
    server.buyPhoneNumberFor(text.from)
  else if hasAStatus(text.from)
    status = server.getStatus(text.from, text.to)
    twilioPhone = server.getTwilioPhoneFor(text.from)
    if status is "waiting for business name"
      server.onGotBusinessName(text.from, text.body, twilioPhone)
    else if status is "waiting for business phone"
      server.onGotBusinessPhone(text.from, text.body, twilioPhone)
    else if status is "waiting for special"
      server.onSpecial(text)
    else if status is "waiting for special confirmation"
      server.onSpecialConfirmation(text)
     
server.onSpecialConfirmation = (text) ->
  server.sendSpecial(text)
  server.setStatus(text.from, text.to, "waiting for special")
  if (text.body == "yes")
    specialText = server.getStatusInfo(text.from, text.to, "special")
    server.sendThisSpecialToAllMyFollowers(text.from, text.to, special)

server.onSpecial = (text) ->
  server.askForSpecialConfirmation(text)
  server.setStatus(text.from, text.to, "waiting for special confirmation")
  server.setStatusInfo(text.from, text.to, "special", text.from)

server.askForSpecialConfirmation = (text) ->
  server.text
    from: text.to
    to: text.from
    body: """
      You are about to send "#{text.body}" to all your subscribers. Reply with "yes" to confirm.
    """
  

server.buyPhoneNumberFor = (text.from)->
  #Twilio specific phone here
  #will call server.onBoughtPhoneNumber

server.onBoughtPhoneNumber = (customerPhone, twilioPhone) ->
  server.createDatabaseRecord(customerPhone, twilioPhone)
  server.congradulateAndAskForBuisinessName(customerPhone, twilioPhone)
  server.setStatus(customerPhone, mainMobileminNumber, "waiting for business name")
  
  
server.onGotBusinessName =  (customerPhone, businessName, twilioPhone) ->
  server.setBusinessName(customerPhone, businessName)
  server.askForBusinessPhone()
  server.setStatus(customerPhone, mainMobileminNumber,  "waiting for business phone")

server.onGotBusinessPhone = (customerPhone, businessPhone, twilioPhone) ->
  server.setBusinessPhone(customerPhone, businessPhone)
  server.sayThatTheyreLive(customerPhone, twilioPhone)
  server.setStatus(customerPhone, mainMobileminNumber, "done")
  server.setStatus(customerPhone, twilioPhone, "waiting for special")

server.sayThatTheyreLive = (customerPhone) ->
  server.text
    from: mainMobileminNumber
    to: to
    body: """
      You're live! To send out a text blast, just text a special offer to #{twilioPhone} and all of your subscribers will get the text!  
    """
 

server.askForBusinessPhone = ->
  server.text
    from: mainMobileminNumber
    to: to
    body: """
      What is your business phone number so we can forward calls?
    """

server.on "gotBusinessPhone", (customerPhone, businessPhone) ->
  server.setBusinessPhone(customerPhone, businessPhone)
  
server.congradulateAndAskForBuisinessName = (customerPhone, twilioPhone) ->
  server.text
    from: mainMobileminNumber
    to: to
    body: """
      Congratulations! Your MobileMin number is #{twilioPhone}. Your customers text "join" to subscribe. What is your business name?
    """
