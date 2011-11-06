describe "view", ->
  EditorView = require "editor-view"
  appFixtures = require "app-fixtures"
  view = null
  beforeEach ->
    view = new EditorView()

  it "should be initialized", ->
    spyOn(EditorView::, "setUpDom")
    spyOn(EditorView::, "addAppsSlate")
    spyOn(EditorView::, "addSingleAppSlate")

    view = new EditorView()
    expect(EditorView::setUpDom).toHaveBeenCalled()
    expect(EditorView::addAppsSlate).toHaveBeenCalled()
    expect(EditorView::addSingleAppSlate).toHaveBeenCalled()


  it "should add the app slate", ->
    spyOn view.el, "append"

    view.addAppsSlate()
    expect(view.el.append).toHaveBeenCalledWith(view.appsSlate.el)
    
  it "should add the a single app slate", ->
    spyOn view.el, "append"

    view.addSingleAppSlate()
    expect(view.el.append).toHaveBeenCalledWith(view.singleAppSlate.el)

  it "should set up the dom", ->
    spyOn view.appsSlate,"add"
    view.setUpDom() 
    expect(view.el.attr("class")).toBe("editor")
    expect(view.appsSlate.add).toHaveBeenCalledWith view.appsList

  it "should populate the apps", ->
    spyOn(view, "activate")
    spyOn(view.appsList, "fill") 
    view.populateApps appFixtures
    expect(view.activate).toHaveBeenCalledWith(view.appsSlate)
    titles = _.map(appFixtures, (app) -> [app.title, app])
    expect(view.appsList.fill).toHaveBeenCalledWith( titles)

  it "should dispatch the apps list click as appclick", ->
    spyOn view, "trigger" 
    view.appsList.trigger "click", "some title", "some app object"
    expect(view.trigger).toHaveBeenCalledWith "appclick", "some app object"

  it "should populate a single app", ->

    view.populateSingleApp
    expect("this").toBe("inplemented")

describe "slate view", ->
  SlateView = require "slate-view"
  slate = null

  beforeEach ->
    slate = new SlateView()

  it "should call init when constructed", ->
    spyOn(SlateView::, "init")
    slate = new SlateView()
    expect(SlateView::init).toHaveBeenCalled()

  it "should init with dom", ->
    slate.init()
    expect(slate.el.attr("class")).toBe("slate")

  it "should be able to append another view", ->
    spyOn(slate.el, "append")
    fakeView = {el: $("<div>hi</div>")} 
    slate.add fakeView
    expect(slate.el.append).toHaveBeenCalledWith(fakeView.el)

    
describe "list view", ->
  ListView = require "list-view"
  list = null

  beforeEach ->
    list = new ListView()

  it "should call init when constructed", ->
    spyOn(ListView::, "init")
    list = new ListView()
    expect(ListView::init).toHaveBeenCalled()

  it "should have a dom el ement when inited", ->
    list = new ListView
    list.init()
    expect(list.el.attr("class")).toBe("list")

  it "should fill and handle click events", ->
    obj1 = {}
    obj2 = {}
    fillFixture = [
      ["name1", obj1]
      ["name2", obj2]
    ]
    list.fill fillFixture
    expect(list.el.find(".item").length).toBe(2)
    expect(list.el.children().eq(0).text()).toBe("name1")
    expect(list.el.children().eq(1).text()).toBe("name2")
    
    $(document.body).append list.el
    console.log list.el
    spyOn(list, "trigger")
    list.el.children().eq(0).click()
    expect(list.trigger).toHaveBeenCalledWith("click", ["name1", obj1])
    list.el.remove()


