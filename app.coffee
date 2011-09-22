config = require "./config"
{ACCOUNT_SID, AUTH_TOKEN, MY_HOSTNAME} = config
rpc = require "./rpc"
sys = require('sys')
twizzle = require('twilio')
TwilioClient = twizzle.Client
Twiml = twizzle.Twiml
client = new TwilioClient(ACCOUNT_SID, AUTH_TOKEN, MY_HOSTNAME);

phones = {}

app = rpc "/rpc",
  text: (from, to, message, callback) ->
    phone = null
    sendSms = ->
      phone.sendSms to, message, {}, (err) -> #is this really an error?
        console.log "sent #{message} from #{from}, to #{to}"
        callback()

    if from of phones
      phone = phones[from]
      sendSms()
    else
      phone = client.getPhoneNumber from  #('+14804208755');
      phone.setup () ->
        phones[from] = phone
        sendSms()

app.listen 8011
console.log("Express server listening on port %d", app.address().port)
