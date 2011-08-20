define "info-view", () ->
  infoViewMaker = () ->
    self = {}
    el = $ """
      <div class="info"></div>
    """
    self.getEl = () -> el
    self.info = (_info) ->
      ret = $ """
        <div class='info-item'>
          #{_info}
        </div>
      """
      el.append ret
      ret
    self.clear = (_el) ->
      _el.fadeOut 1000, () -> _el.remove()






    self
      
