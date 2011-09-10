define 'row-view', () ->
  _ = require "underscore"
  nimble = require "nimble"
  eventer = require "drews-event"
  InputUpload = require "input-upload"
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
      <tr>
        #{tdsHtml}
        <td><input class="delete" type="button" value="delete"></td>
      
      </tr>
    """
    doUpdating = (el) ->
      prop = $(el).attr("data-prop")
      val = $(el).val()
      values = {}
      values[prop] = val
      emit "update", model, values

    el.find("input").bind "keydown", (e) ->
      if e.keyCode in [9, 13]
        console.log e.keyCode
        doUpdating this

    input = InputUpload.init el.find("input[type=text]")
    input.on "change", (el) ->
      console.log el
      doUpdating el


    el.find(".delete").bind "click", () ->
      emit "delete", model
      el.remove()


    self.el = el
    self.getEl = -> el
      

    self
  RowView
