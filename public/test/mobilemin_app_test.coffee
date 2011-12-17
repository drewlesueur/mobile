describe "MobileminApp", ->
  MobileminApp = require "mobilemin-app"
  mobileminApp = new MobileminApp()

  Severus = require "severus2"

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
    myCallback = jasmine.createSpy()
    saveCallback = mobileminApp.createApp(rawApp, myCallback)
    expect(mobileminApp.data.save).toHaveBeenCalledWith(
      "apps", rawApp, saveCallback
    )
    saveCallback(null, rawApp)
    expect(myCallback).toHaveBeenCalledWith(null, mobileminApp)
    expect(mobileminApp.app.name).toBe("drewsapp")



