`
require("./public/dmodule.js")
require("./config.js")
var _ = require("./public/underscore.js")
dModule.define("underscore", function () { return _ });
require("./public/drews-mixins.js")
var nimble = require("./public/nimble.js")
dModule.define("nimble", function () { return nimble });
require("./public/all-func.js")
express = require("express");
dModule.define("express", function () {return express;});
require("./public/express-rpc.js")
require("./public/severus2.js")
var twilio = require("twilio")
dModule.define("twilio", function() { return twilio })
require("./public/mobilemin-app.js")
require("./public/mobilemin-twilio.js")
//require("./public/mobilemin-server.js")
require("./public/layout.js")

var config = dModule.require("config")
var _ = dModule.require("underscore")
`
last = ""
andThen = (fn, args...) ->
  whatToDo = fn.bind null, args...
  last.once "done", whatToDo

doInOrder = (waiters...) ->
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
    
  

colors = require "colors"
 
drews = dModule.require 'drews-mixins'
Server = dModule.require("mobilemin-server")
server = Server.init()



randomPhone = ->
  phone = "+1"
  for x in [1..10]
    randInt = drews.rnd 0, 9
    phone += randInt.toString()
  return phone

realBuyPhoneNumberFor = server.buyPhoneNumberFor
realText = server.text
MobileminText = dModule.require "mobilemin-text"

fakeBoughtNumbers = []
server.buyPhoneNumberFor = (from) ->
  fakeBoughtNumber = randomPhone()
  fakeBoughtNumbers.unshift fakeBoughtNumber
  _.defer -> server.onBoughtPhoneNumber from, fakeBoughtNumber

sentTexts = []

server.text = (info) ->
  last = drews.makeEventful {}
  _last = last
  sentTexts.unshift info
  _.defer ->
    _last.emit "done"
  server.setLast last
  return last

mcDonalds = randomPhone()
jamba = randomPhone()
bob = randomPhone()
jim = randomPhone()
bill = randomPhone()
steve = randomPhone()
mobileminNumber = server.mobileminNumber

sendFakeText = (info) ->
  req =
    body: 
      To: info.to
      From: info.from
      Body: info.body
  res = send: () ->

  server.sms req, res

tests = []

shouldHaveSent = (info, message) ->
  sentText = sentTexts.pop()
  if _.isEqual(info, sentText)
    console.log message.green
  else
    console.log message.red
    console.log sentText.body.yellow
    console.log info.body.magenta
    

prettyPhone = server.prettyPhone
wait  = drews.wait
kylePhone = "+14803813855"
mcDonaldsmm = ""
jambamm = ""

startMcDonalds = ->
  sendFakeText
    from: mcDonalds
    to: mobileminNumber 
    body: "start"

startJamba = ->
  sendFakeText
    from: jamba
    to: mobileminNumber
    body: "start"

testJambaFirstResponse = ->
  shouldHaveSent
    to: jamba
    from: mobileminNumber
    body: """
      You're live! Your Text Marketing Number is #{prettyPhone jambamm}. Text it to send your customers a special. They text "Join" to subscribe.
    """
  , "First Response from a new sign up"

testMcDonaldsFirstResponse = ->
  shouldHaveSent
    to: mcDonalds
    from: mobileminNumber
    body: """
      You're live! Your Text Marketing Number is #{prettyPhone mcDonaldsmm}. Text it to send your customers a special. They text "Join" to subscribe.
    """
  , "First Response from a new sign up"

testKyleWasNotifiedOfNewSignup = (customer, customermm)->
  shouldHaveSent
    to: kylePhone
    from: mobileminNumber
    body: """
      Someone new signed up. Their Text Marketing Number is #{prettyPhone customermm}.
      Their cell phone is #{prettyPhone customer}.
    """
  , "Kyle was notified of a new signup"

testFirstResponse = () ->
    #test in backwards order

    mcDonaldsmm = fakeBoughtNumbers.pop()
    jambamm = fakeBoughtNumbers.pop()


    testKyleWasNotifiedOfNewSignup mcDonalds, mcDonaldsmm
    testKyleWasNotifiedOfNewSignup jamba, jambamm

    testMcDonaldsFirstResponse()
    testJambaFirstResponse()

    testBusinessNameRequested mcDonalds, mcDonaldsmm, "McDonalds"
    testBusinessNameRequested jamba, jambamm, "Jamba"
    #waitFor(4100)

testBusinessPhoneReqested = (customer) ->
  shouldHaveSent
    to: customer
    from: mobileminNumber
    body: "What is your business phone number?"
  , "Business phone was requested"

testBusinessNameRequested = (customer, customermm, business) ->
  shouldHaveSent
    to: customer
    from: mobileminNumber
    body: "What is your business name?"
  , "Business name was requested"


waitFor = (milis) ->
  last = drews.makeEventful {}
  _last = last
  wait milis, -> _last.emit "done"
  last

startMcDonalds()
startJamba()


doBusinessPhone = ->
  console.log "fake sending business phone"
  sendFakeText 
    to: mobileminNumber
    from: mcDonalds
    body: "McDonalds"
  
  sendFakeText 
    to: mobileminNumber
    from: jamba
    body: "Jamba"
    wait 10000, ->
      console.log "testing mcdonalds business phone requested with #{mcDonalds}"
      console.log sentTexts
      testBusinessPhoneReqested(mcDonalds)
      testBusinessPhoneReqested(jamba)

console.log "wating 10 seconds"
wait 15000, ->
  testFirstResponse()
  wait 4500, ->
    doBusinessPhone()

