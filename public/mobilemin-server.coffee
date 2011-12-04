dModule.define "mobilemin-server", ->
  allFunc = dModule.require "all-func" 
  obj = allFunc "object"
  expressRpc = dModule.require "express-rpc" 
  drews = dModule.require "drews-mixins"



  MobileminTwilio = dModule.require "mobilemin-twilio"

  MobileminServer = obj()
  MobileminServer "init", ->
    self = obj()
    self("expressApp", expressRpc("/rpc", {}))
    self("expressApp").post "/phone", @phone
    self("expressApp").post "/sms", @sms
    self "twilio", new MobileminTwilio()
    twilio = self "twilio"


    self "start", ->
      self("expressApp").listen 8010 #TODO: use config
      self("twilio").setupNumbers()

    self "phone", ->
    self "sms", (req, res) ->
      text = req.body 
      self("handleNewCustomerWhoTextedStart") res, text.From

    self "handleNewCustomerWhoTextedStart", (res, from) ->
      twilio.twilioClient.getAvailableLocalNumbers "US",
        AreaCode: drews.s(from, 2, 3) #get rid of +1, and get area code

    self
