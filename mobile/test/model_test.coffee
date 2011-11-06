describe "model", ->
  App = require "app"
  app = null
  beforeEach ->
    app = new App()
    
  it "should find apps", ->
    expect(app.severus.db).toBe("mobilemin_dev")
    spyOn(app.severus, "find")
    app.find name: "yk"
    expect(app.severus.find).toHaveBeenCalledWith("mins", {name: "yk"}, app.onFound)

  it "should trigger a found when stuff is found", ->
    spyOn(app, "trigger")
    app.onFound.call({}, null, [1, 2])
    expect(app.trigger).toHaveBeenCalledWith("found", [1,2])
    

    


