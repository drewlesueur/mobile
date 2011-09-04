define "table-presenter", () ->
  eventer = require "drews-event"
  drews = require "drews-mixins"
  TableView = require "table-view"
  RowView = require "row-view"
  TablePresenter = {}
  rowMaker = require "row-maker"

  # tablePresenter = TablePresenter.init type: "menu", fields: 
  TablePresenter.init = (self={}) ->
    self = eventer self
    {emit, type, fields, db} = self
    Obj = rowMaker
      db: db
      type: type
    view = TableView.init fields
    objs = []

    Obj.on "init", (obj) ->
      obj.view = RowView.init model: obj, fields: fields, emittee: view
      view.addObj obj
      
    view.on "new", (obj) ->
      obj = Obj.init obj
      obj.save()

    Obj.find null, (err, stuff) ->
      console.log stuff

    view.on "update", (obj, values) ->
      obj.set values
      console.log obj
      obj.save()

    view.on "delete", (obj) ->
      obj.remove()

    self.getEl = -> view.getEl()
    
    self
  TablePresenter

