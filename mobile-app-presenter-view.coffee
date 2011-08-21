define "mobile-app-presenter-view", () ->
  $ = require "jquery" 
  _ = require "underscore"
  nimble = require "nimble"
  drews = require "drews-mixins"
  severus = require "severus"
  severus.db = "mobilemin_dev"
  eventer = require "drews-event"
  mobileAppPresenterViewMaker = (self={}) ->
    self = eventer self
    {model, emit} = self
    name = model.get "name"
    
    dayInput = $ """
      <div class="because_outerhtml_isnt_built_in">
      <div class="clearfix">
        <label>Monday</label>
        <div class="input">
          <div class="inline-inputs">
            <input name="monday_start" class="mini" type="text" value="">
            to
            <input name="monday_end" class="mini" type="text" value="">
          </div>
        </div>
      </div> <!-- /clearfix -->
     </div>

    """
    _makeDayForm = (day) ->
      cap = drews.capitalize day
      low = day.toLowerCase()
      dayEl = dayInput.clone()
      dayEl.find("label").text cap 
      dayEl.find('[name="monday_start"]').attr "name", "#{low}_start"
      dayEl.find('[name="monday_end"]').attr "name", "#{low}_end"
      dayEl.html()
      
    saveHtml = """
      <div class="actions">
        <button type="submit" class="btn primary">Save</button>
      </div>
    """
    hoursHtml = """
      <form>
        <fieldset>
         <legend>Hours</legend>
           #{_makeDayForm "monday"}
           #{_makeDayForm "tuesday"}
           #{_makeDayForm "wednesday"}
           #{_makeDayForm "thursday"}
           #{_makeDayForm "friday"}
           #{_makeDayForm "saturday"}
           #{_makeDayForm "sunday"}
        </fieldset>
        #{saveHtml}
      </form>
    """
    contactHtml = """
      <form>
        <fieldset>
          <legend>Contact</legend>
          <div class="clearfix">
            <label for="phone">Phone</label>
            <div class="input">
              <input id="phone" name="phone" type="text">
            </div>
          </div> <!-- /clearfix -->
          <div class="clearfix">
            <label for="googleMapName">Google Map Name</label>
            <div class="input">
              <input id="googleMapName" name="googleMapName" type="text">
              <span class="help-block">the name to search for when searching on Google Maps</span>
            </div>
          </div> <!-- /clearfix -->
          <div class="clearfix">
            <label for="address">Address</label>
            <div class="input">
              <input id="address" name="address" type="text">
              <span class="help-block">Leave blank if multiple addresses</span>
            </div>
          </div> <!-- /clearfix -->
        </fieldset>
        #{saveHtml}
      </form>
    """

    headerHtml = """
      <form>
        <fieldset>
          <legend>Header</legend>
          <div class="clearfix">
            <label for="headerUrl">Header Url</label>
            <div class="input">
              <input id="headerUrl" name="headerUrl" type="text">
            </div>
          </div> <!-- /clearfix -->
        </fieldset>
        #{saveHtml}
      </form>
    """

    formEl = $ """
      <ul class="pills">
        <li class="active"><a href="#" class="hours">Hours</a></li>
        <li><a href="#" class="contact">Contact</a></li>
        <li><a href="#" class="header-info">Header</a></li>
      </ul>
      <div class="form-toggler">
        <div class="form-togglee hours">
         #{hoursHtml}
        </div>
        <div class="form-togglee contact">
         #{contactHtml}
        </div>
        <div class="form-togglee header-info">
         #{headerHtml }
        </div>
      </div>
    
    """
    formEl.find(".form-togglee").hide()
    formEl.find(".form-togglee.hours").show()
    formEl.find("li a").bind "click", (e) ->
      e.preventDefault()
      klass = $(this).attr("class")
      console.log klass
      formEl.find(".form-togglee").hide()
      formEl.find("li").removeClass("active")
      formEl.find("li a.#{klass}").parents("li").eq(0).addClass "active"
      formEl.find(".form-togglee.#{klass}").show()

    formEl.find("form").bind "submit", (e) ->
      e.preventDefault()
    
    el = $ """
      <li>
        <a href="#apps/#{name}">#{name}</a> <a class="remove" href="#">[delete]</a><a class="link" href="/apps.html##{name}">preview</a>
      </li>
    """
    el.find(".remove").bind "click", (e) ->
      e.preventDefault()
      if confirm "Are you sure you want to delete #{name}?"
        emit "remove"
    self.getEl = -> el
    self.getFormEl = -> formEl
    self.remove = () ->
      el.remove()






    self
