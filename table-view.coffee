define 'table-view', () ->
  _ = require "underscore"
  nimble = require "nimble"
  eventer = require "drews-event"
  TableView = eventer {}
  RowView = require "row-view"
  InputUpload = require "input-upload"

  TableView.init = (fields) ->
    self = {}
    self = eventer self
    {model, emit} = self

    headersHtml = ""
    _.each fields, (field) ->
      headersHtml += """
        <th>#{field}</th>
      """
    
    emptyRowHtml = $ ""
    _.each fields, (field) ->
      emptyRowHtml += """
        <td><input data-prop="#{field}" class="new" type="text"></td>
      """

    table = $ """
      <div class="row show-grid">
        <table class="zebra-striped">
          <thead>
            <tr>
              #{headersHtml}
              <th></th>
            </tr>
            <tr class="new-row">
              #{emptyRowHtml}
            </tr>
          </thead>
          <tbody>
          </tbody>
        </table>
      </div>
    """
    
    saveNew = (el) ->
      prop = $(el).attr("data-prop")
      val = $(el).val()
      obj = {}
      obj[prop] = val
      table.find(".new").val("")
      emit "new", obj

    table.find(".new").bind "keydown", (e) ->
      if e.keyCode in [9, 13]
        saveNew this

    self.addObj = (obj) ->
      el = obj.view.getEl()

      table.find(".new-row").before el
      obj.view.getEl().find("input")[0].focus()
      
      
      
    self.getEl = -> table

    self
  TableView

