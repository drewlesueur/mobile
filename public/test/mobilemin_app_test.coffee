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
      "mobilemin", findQuery, mmCallback
    )
    expect(_.isFunction(mmCallback)).toBeTruthy()
    mmCallback(false, [{title: "yk", name: "test"}])
    expect(myCallBackCalled).toBeTruthy()
    expect(mobileminApp.app.title).toBe("yk")

    






  

