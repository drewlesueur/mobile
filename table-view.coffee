define 'table-view', () ->
  _ = require "underscore"
  nimble = require "nimble"
  eventer = require "drews-event"
  TableView = eventer {}
  RowView = require "row-view"
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

    table.find(".new").bind "keydown", (e) ->
      if e.keyCode in [9, 13]
        console.log e.keyCode
        prop = $(this).attr("data-prop")
        val = $(this).val()
        obj = {}
        obj[prop] = val
        table.find(".new").val("")
        emit "new", obj

    self.addObj = (obj) ->
      console.log "adding obj"
      console.log obj.view.getEl()

      table.find(".new-row").before(obj.view.getEl())
      obj.view.getEl().find("input")[0].focus()
      
      
      
    self.getEl = -> table

    self
  TableView

