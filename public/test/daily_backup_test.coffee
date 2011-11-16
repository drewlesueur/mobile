# mock mailer
define "../config", () ->
  email_pw: "fake" 

define "mailer", () ->
  send: ->


DailyBackup = require "daily-backup" 

severus = require "severus2" 

describe "daily_backup", -> 
  dailyBackup = null
  beforeEach ->
    dailyBackup = new DailyBackup("mobilemin-site")
    spyOn(dailyBackup.mobilemin, "find")

  it "should instantiate a new daily backup", ->
    spyOn(severus, "init").andCallThrough()
    myDailyBackup = new DailyBackup("mobilemin-site")
    expect(severus.init).toHaveBeenCalled() 
    expect(myDailyBackup.name).toBe("mobilemin-site")
    expect(myDailyBackup).toBeTruthy()
    expect(myDailyBackup.mobilemin).toBeTruthy()
    expect(myDailyBackup.mobilemin.db).toBe("mobilemin_dev")

  it "should find itself", ->
    dailyBackup.findMyself()
    expect(dailyBackup.mobilemin.find).toHaveBeenCalledWith(
      "mins", {name: "mobilemin-site"},
      dailyBackup.onFoundSelf
    )

  it "should know what to do when it finds itself", ->
    #depending on severus to call onfoundself
    spyOn(window, "setInterval")
    spyOn(dailyBackup, "performBackup")
    dailyBackup.onFoundSelf(null, [{a: 1, name: "my_appy"}])
    expect(dailyBackup.self).toEqual({a: 1, name: "my_appy"})
    expect(dailyBackup.mobileminApp.db).toBe("mobilemin_my_appy")
    expect(dailyBackup.performBackup).toHaveBeenCalled()
    expect(window.setInterval).toHaveBeenCalledWith(
      dailyBackup.performBackup,
      dailyBackup.backupInterval
    )
  
  it "should perform a backup", ->
    spyOn dailyBackup, "getPhones"
    dailyBackup.performBackup()
    expect(dailyBackup.getPhones).toHaveBeenCalledWith(
      dailyBackup.onGotPhones 
    )

  it "should get the phones", ->
    dailyBackup.onFoundSelf(null, [{a: 1, name: "my_appy"}])
    spyOn dailyBackup.mobileminApp, "find"
    dailyBackup.getPhones()
    expect(dailyBackup.mobileminApp.find).toHaveBeenCalledWith(
      "phones",
      dailyBackup.onGotPhones
    )

  it "should send the email once it gets the phones", ->
    spyOn(dailyBackup.email, "send")
    phonesFixture = [
      {phone: "480-381-3855"}
      {phone: "480-840-5406"}
    ]
    dailyBackup.onGotPhones(null, phonesFixture)

    expect(dailyBackup.email.send).toHaveBeenCalledWith(
      host: "smtp.gmail.com"
      port: "465"
      ssl: true
      domain: "smtp.gmail.com"
      to: "drewalex@gmail.com, kylebill@gmail.com",
      from: "drewalex@gmail.com"
      subject: "phone backup for #{dailyBackup.name} "
      body: JSON.stringify phonesFixture
      authentication: "login"
      username: "drewalex@gmail.com"
      password: dailyBackup.config.email_pw
    , dailyBackup.onSentEmail

    )


  it "should start a backup", ->
    spyOn dailyBackup, "findMyself"
    dailyBackup.startBackup()
    expect(dailyBackup.findMyself).toHaveBeenCalled()

  it "should log an email error", ->
    spyOn(console, "log")
    dailyBackup.onSentEmail("error!!")
    expect(console.log).toHaveBeenCalledWith("error!!")
