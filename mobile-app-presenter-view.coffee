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
            <input name="mondayStart" class="mini" type="text">
            to
            <input name="mondayEnd" class="mini" type="text">
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
      start = dayEl.find('[name="mondayStart"]')
      start.attr "name", "#{low}Start"
      startVal = model.get("hours")?[day]?.start || ""
      start.val startVal
      console.log model.get("hours")?[day]?.end

      end = dayEl.find('[name="mondayEnd"]')
      endVal = model.get("hours")?[day]?.end || ""
      end.val endVal
      end.attr "name", "#{low}End"
      dayEl
      
    saveHtml = """
      <div class="actions">
        <button type="submit" class="btn primary">Save</button>
      </div>
    """
    hoursEl = $ """
      <div class="form-togglee hours">
      <form>
        <fieldset>
         <legend>Hours</legend>
        </fieldset>
        #{saveHtml}
      </form>
      </div>
    """
    hoursEl.find("fieldset").append _makeDayForm "monday"
    hoursEl.find("fieldset").append _makeDayForm "tuesday"
    hoursEl.find("fieldset").append _makeDayForm "wednesday"
    hoursEl.find("fieldset").append _makeDayForm "thursday"
    hoursEl.find("fieldset").append _makeDayForm "friday"
    hoursEl.find("fieldset").append _makeDayForm "saturday"
    hoursEl.find("fieldset").append _makeDayForm "sunday"
    contactEl = $ """
      <div class="form-togglee contact">
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
      </div>
    """

    headerInfoEl = $ """
      <div class="form-togglee header-info">
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
      </div>
    """

    formEl = $ """
      <div>
      <ul class="pills">
        <li class="active"><a href="#" class="hours">Hours</a></li>
        <li><a href="#" class="contact">Contact</a></li>
        <li><a href="#" class="header-info">Header</a></li>
      </ul>
      <div class="form-toggler">
      </div>
      </div>
    """
    formEl.find(".form-toggler").append(hoursEl).append(contactEl).append(headerInfoEl)
    formEl.find(".form-togglee").hide()
    formEl.find(".form-togglee.hours").show()
    formEl.find("li a").bind "click", (e) ->
      e.preventDefault()
      klass = $(this).attr("class")
      formEl.find(".form-togglee").hide()
      formEl.find("li").removeClass("active")
      formEl.find("li a.#{klass}").parents("li").eq(0).addClass "active"
      formEl.find(".form-togglee.#{klass}").show()
    
    getHourValues = (day) ->
      day = day.toLowerCase()
      start = hoursEl.find("[name=\"#{day}Start\"]").val()
      end = hoursEl.find("[name=\"#{day}End\"]").val()
      [start, end]

    hoursEl.find("form").bind "submit", (e) ->
      e.preventDefault()
      days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
      hours = {}
      for day in days
        values = getHourValues day 
        hours[day] =
          start: values[0]
          end: values[1]
      emit "modelviewvalchanged", model, "hours", hours
      

    
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
