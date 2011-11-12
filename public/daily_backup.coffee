if module.exports then define = (args..., ret) -> module?.exports = ret()


define 'daily-backup', ->
  email = require "mailer"
  config = require "../config.js"
  
  severus = require "severus2"

  class DailyBackup
    constructor: (@name) ->
      @mobilemin = severus.init()
      @mobilemin.db = "mobilemin_dev"
      @backupInterval = 1000 * 60 * 60 * 24
      @email = email
      @config = config
      

    onFoundSelf: (err, app) =>
      app = app[0]
      @self = app
      @mobileminApp = severus.init(app.name)
      @mobileminApp.db = "mobilemin_#{app.name}"
      @performBackup()
      setInterval(@performBackup, @backupInterval)
      

    performBackup: =>
      @getPhones(@onGotPhones)

    getPhones: =>
      @mobileminApp.find "phones",  @onGotPhones

    onGotPhones: (err, phones) =>
      console.log "going to send an email for #{@name}"
      @email.send
        host: "smtp.gmail.com"
        port: "465"
        ssl: true
        domain: "smtp.gmail.com"
        to: "drewalex@gmail.com, kylebill@gmail.com",
        from: "drewalex@gmail.com"
        subject: "phone backup for #{@name} "
        body: JSON.stringify phones
        authentication: "login"
        username: "drewalex@gmail.com"
        password: @config.email_pw
      , @onSentEmail

    onSentEmail: (err)->
      if err
        console.log err
     

    #TODO: you don't need to find yourself
    # all you need is the name to get the phones
    findMyself: =>
      @mobilemin.find "mins", {name: @name}, @onFoundSelf

    startBackup: =>
      #have to say self for testability, (jasmine spies)
      #wouldn't it be cool if I didn't have to?
      # or maybe solve it with explicit dynamic scope
      # in lexical scope world.
      @findMyself()


  DailyBackup
