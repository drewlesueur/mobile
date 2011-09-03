define 'row-view', () ->
  _ = require "underscore"
  nimble = require "nimble"
  eventer = require "drews-event"
  RowView = eventer {}
  RowView.init = (self={}) ->
    self = eventer self
    {model, emit, fields} = self

    self.setEmittee self.emittee
    
    tdsHtml = ""
    _.each fields, (field) ->
      tdsHtml += """
        <td><input data-prop="#{field}" type="text" value="#{model.get(field) or ""}" /></td>
      """


    el = $ """
      <tr>#{tdsHtml}</tr>
    """
    el.find("input").bind "keydown", (e) ->
      if e.keyCode in [9, 13]
        console.log e.keyCode
        prop = $(this).attr("data-prop")
        val = $(this).val()
        values = {}
        values[prop] = val
        emit "update", model, values


    self.el = el
    self.getEl = -> el
      

    self
  RowView
