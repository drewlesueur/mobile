config = require "./config"
_ = require "underscore"
nimble = require "nimble"
_.mixin nimble
drews = require "./node_modules/drews-mixins"

severus = require("severus2")()
severus.db = "mobilemin_dev"
mobilemin = severus
mobileminApp = require("severus2")()

texter = require "text"

sys = require('sys')
twitter = require('twitter')
twit = new twitter({
    consumer_key: 'nHsh3SzB2SJOcbxbZn3eSA',
    consumer_secret: 'EapiN2bVhE27bOZ6oGxVAX0AzfV7b8ALJ0IwG3H70n8',
    access_token_key: '375302207-4G4rrcvxQt1kxXoSKg9XgSsTPTRTB4WDul4uNvna',
    access_token_secret: 'o51ISi5CXJ6qgf6nWxVtJ8qgrd6SoVjoQpnDVZbwyc'
})


findApp = (twitterDealsName, callback) ->
  console.log "findind app with twitterdealsname #{twitterDealsName}"
  mobilemin.find "mins", {twitterDealsName: twitterDealsName}, (err, apps) ->
    callback err, apps?[0]


findPhones = (app, callback) ->
  console.log "finding phones with #{app.name}"
  mobileminApp.db = "mobilemin_#{app.name}"
  mobileminApp.find "phones", (err, phones) ->
    callback err, _.map phones, (phone) -> phone.phone

twit.stream 'statuses/filter',{follow: [375302207]}, (stream) ->
  stream.on 'data',  (tweet) ->
    screenName = tweet.user.screen_name
    console.log "got tweet from #{screenName}"
    findApp screenName, (err, app) ->
      console.log JSON.stringify app
      console.log "found app!!!"
      console.log "app is #{app.name}"
      findPhones app, (err, phones) ->
        console.log "found phones"
        console.log phones
        _.each phones, (phone) ->
          texter.text app.twilioPhone, phone, tweet.text

    
#https://api.twitter.com/1/statuses/user_timeline.json?include_entities=true&include_rts=true&screen_name=drewtest2&count=10

