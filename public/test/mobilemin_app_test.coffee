describe "MobileminApp", ->
  MobileminApp = require "mobilemin-app"

  Severus = require "severus2"
  mobileminApp = null
  app = null

  beforeEach ->
    mobileminApp = new MobileminApp()
    app = mobileminApp

  it "should be there", ->
    expect(mobileminApp).toBeTruthy()

  it "should have a severus", ->
    expect(mobileminApp.data.db).toBe("new_mobilemin")

  it "should find an app", ->
    spyOn mobileminApp.data, "find"
    myCallBackCalled = false
    callback = -> myCallBackCalled = true
    findQuery = {title: "yk"}
    mmCallback = mobileminApp.find findQuery, callback
    expect(mobileminApp.data.find).toHaveBeenCalledWith(
      "apps", findQuery, mmCallback
    )
    expect(_.isFunction(mmCallback)).toBeTruthy()
    mmCallback(false, [{title: "yk", name: "myappy", firstPhone: "+14808505406"}])
    expect(myCallBackCalled).toBeTruthy()
    expect(mobileminApp.app.title).toBe("yk")
    expect(mobileminApp.data.db).toBe "new_mobilemin"

  describe "after having found an app", ->
    beforeEach ->
      mobileminApp.app.name = "myappy"
      mobileminApp.app.firstPhone = "+14808405406"
      mobileminApp.app.twilioPhone = "+14805554444"
      app = mobileminApp
    it "should be able to get the phones", ->
      spyOn mobileminApp.data, "find"
      myCallBackCalled = false
      findPhonesCallback = -> myCallBackCalled = true
      mmCallback = mobileminApp.findPhones {}, findPhonesCallback
      expect(mobileminApp.data.find).toHaveBeenCalledWith(
        "app_14808405406_14805554444_phones", {}, findPhonesCallback
      )

  it "should create an app", ->

    spyOn(mobileminApp.data, "save")
    rawApp = {name: "drewsapp", test: 1}
    mobileminApp.createApp(rawApp)
    expect(mobileminApp.data.save).toHaveBeenCalledWith(
      "apps", rawApp, app.onCreate
    )

  it "should handle a create", ->
    rawApp = {name: "drewsapp", test: 1, _id: "xx"}
    spyOn app, "emit"
    app.onCreate null, rawApp 
    expect(app.emit).toHaveBeenCalledWith("created")
    expect(mobileminApp.app.name).toBe("drewsapp")

  it "should handle a create error", ->
    rawApp = {name: "drewsapp", test: 1, _id: "xx"}
    spyOn app, "emit"
    app.onCreate "fake error", rawApp 
    expect(app.emit).toHaveBeenCalledWith("createerror", "fake error")

  it "should save", ->
    spyOn app.data, "save"
    app.save()
    expect(app.data.save).toHaveBeenCalledWith(
      "apps",
      app.app,
      app.onSave
    )
    
  it "should handle a successful save", ->
    rawApp = {name: "drewsapp", test: 1, _id: "xx"}
    spyOn app, "emit"
    app.onSave(null, rawApp) 
    expect(app.emit).toHaveBeenCalledWith("saved")
    expect(mobileminApp.app.name).toBe("drewsapp")

  it "should handle a save error", ->
    rawApp = {name: "drewsapp", test: 1, _id: "xx"}
    spyOn app, "emit"
    app.onSave("error!", rawApp) 
    expect(app.emit).toHaveBeenCalledWith("saveerror", "error!")



