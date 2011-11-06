describe "presenter", ->
  EditorPresenter = require "editor-presenter" 
  appFixtures = require "app-fixtures"
  presenter = null
  app = null
  view = null

  beforeEach ->
    presenter = new EditorPresenter()
    view = presenter.view
    app = presenter.app
    
  it "should get apps", ->
    spyOn(presenter.app, "find")
    presenter.getApps()
    expect(presenter.app.find).toHaveBeenCalled()

  it "should handle when apps are found", ->
    spyOn(view, "populateApps")
    presenter.app.trigger "found", appFixtures
    expect(view.populateApps).toHaveBeenCalledWith(appFixtures)

  it "should handle a click on an app", ->
    spyOn view, "populateSingleApp" 

    view.trigger "appclick", app
    expect(view.populateSingleApp).toHaveBeenCalledWith(app)




    
