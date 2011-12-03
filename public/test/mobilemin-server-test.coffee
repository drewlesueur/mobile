describe "MobileMinServer", ->
  #mock express rpc
  expressRpcAppListen = jasmine.createSpy()
  expressPost = jasmine.createSpy()
  expressRpcObj =
    listen: expressRpcAppListen 
    post: expressPost
  expressRpcInit = jasmine.createSpy().andReturn expressRpcObj

  dModule.define "express-rpc", -> expressRpcInit

  RealMobileMinTwilio = dModule.require "mobilemin-twilio"

  class FakeMobileminTwilio 
  dModule.define "mobilemin-twilio", () ->
    FakeMobileminTwilio

  MobileMinServer = dModule.require "mobilemin-server"
  
  server = null 

  beforeEach ->
    server = new MobileMinServer()

  it "should pass have an express rpc", ->
    expect(expressRpcInit).toHaveBeenCalledWith "/rpc", {}
    expect(server.expressApp).toBe(expressRpcObj)
    expect(server.expressApp.post).toHaveBeenCalledWith("/phone", server.phone)
    expect(server.expressApp.post).toHaveBeenCalledWith("/sms", server.sms)

  it "should have a mobileminTwilio", ->
    expect(server.twilio.constructor).toBe(FakeMobileminTwilio)

  it "should handle a start", ->
    


  it "should know how to handle an sms"

  dModule.define "mobilemin-twilio", RealMobileMinTwilio
