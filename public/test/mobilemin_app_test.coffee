describe "MobileminApp", ->
  MobileminApp = require "mobilemin-app"
  mobileminApp = new MobileminApp()

  Severus = require "severus2"

  it "should be there", ->
    expect(mobileminApp).toBeTruthy()

  it "should have a severus", ->
    expect(mobileminApp.severus.db).toBe("mobilemin_dev")
    

  it "should find an app", ->
    spyOn mobileminApp.severus, "find"
    myCallBackCalled = false
    callback = -> myCallBackCalled = true
    findQuery = {title: "yk"}
    mmCallback = mobileminApp.find findQuery, callback
    expect(mobileminApp.severus.find).toHaveBeenCalledWith(
      "mins", findQuery, mmCallback
    )
    expect(_.isFunction(mmCallback)).toBeTruthy()
    mmCallback(false, [{title: "yk", name: "myappy"}])
    expect(myCallBackCalled).toBeTruthy()
    expect(mobileminApp.app.title).toBe("yk")
    expect(mobileminApp.data.db).toBe "mobilemin_myappy"

  describe "after having found an app", ->
    beforeEach ->
      mobileminApp.name = "myappy"
    it "should be able to get the phones", ->
      spyOn mobileminApp.data, "find"
      myCallBackCalled = false
      findPhonesCallback = -> myCallBackCalled = true
      mmCallback = mobileminApp.findPhones {}, findPhonesCallback
      expect(mobileminApp.data.find).toHaveBeenCalledWith(
        "phones", {}, findPhonesCallback
      )



