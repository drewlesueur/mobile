define "min-manager-presenter", () ->
  eventer = require "drews-event"
  drews = require "drews-mixins"
  severus = require("severus2")()
  Min = require "min"
  MinManagerView = require "min-manager-view"
  SubMinManagerView = require "sub-min-manager-view"
  MinManagerPresenter = {}
  MinManagerPresenter.init = (self={}) ->
    self = eventer self
    {emit} = self


    
    view = MinManagerView.init()
    #infoView = InfoView.init()
    #{info, clear} = infoView
    mins = []
    currentMin = null



    #subMinManagerViews = SubMinManagerViewCollection.init()
    #subMinManagerViews.on "remove", (min) ->
      #do something

    #sumMinManagerViews.on "remove", (min) ->
    #  if min in myList
    #    emit "remove"


    SubMinManagerView.on "remove", (min) ->
      min.remove()

    SubMinManagerView.on "export", (min) ->
      min.export()

    SubMinManagerView.on "load", (min) ->
      setCurrentMin min


    Min.find null, (err, _mins) ->
      mins = _mins


    loadPhones = () ->
      severus.find "phones", (err, phones) ->
        view.setPhones _.map phones, (phone) -> phone.phone

    Min.on "init", (min) ->
      min.subView = SubMinManagerView.init model: min
      view.addMin min
    
    menuTablePresenter = null
    specialsTablePresenter = null
    phonesTablePresenter = null

    setCurrentMin = (min) ->
      currentMin = min
      severus.db = "mobilemin_" + currentMin.get "name"
      severus.db = "mobilemin_" + currentMin.get "name"
      loadPhones()
      view.loadMin min
      TablePresenter = require "table-presenter"
      menuTablePresenter = TablePresenter.init
        type: "items"
        db: "mobilemin_#{min.get "name"}"
        fields: ["order", "image", "title", "price", "description"]
      view.clearItems()
      view.addItemsText "Menu"
      view.addAdditionalItemsTable menuTablePresenter

      specialsTablePresenter = TablePresenter.init
        type: "specials"
        db: "mobilemin_#{min.get "name"}"
        fields: ["order", "image", "title", "price", "description"]
      view.addItemsText "Specials"
      view.addAdditionalItemsTable specialsTablePresenter

      phonesTablePresenter = TablePresenter.init
        type: "phones"
        db: "mobilemin_#{min.get "name"}"
        fields: ["phone"]
      view.addItemsText "Phones"
      view.addAdditionalItemsTable phonesTablePresenter

    Min.on "find", (mins) ->
      min = drews.s(mins, -1)[0]
      setCurrentMin min


      
    Min.on "action", (action, min) ->
      #info action

    Min.on "remove", (min) ->
      view.removeMin min
      
    view.on "change", (min, prop, val) ->
      min.set prop, val

    view.on "new", (name) ->
      model = Min.init name: name
      model.save()


    saveTables = ->
      console.log menuTablePresenter.getObjs()
      currentMin.set specials: specialsTablePresenter.getObjs()
      currentMin.set menu: menuTablePresenter.getObjs()

    view.on "save", (hash) ->
      currentMin.set hash
      saveTables()
      currentMin.save () ->
        currentMin.export()




  MinManagerPresenter


