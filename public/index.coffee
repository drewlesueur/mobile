define "zepto", () -> Zepto
define "underscore", () -> _
define "nimble", () -> _


$ = require "zepto"
drews = require "drews-mixins"
severus = require("severus2")()
eventer = require "drews-event"

define "app-view", () ->
  days = [
    "sunday", "monday", "tuesday", "wednesday"
    "thursday", "friday", "saturday"
  ]
  daysMonday = [
    "monday", "tuesday", "wednesday"
    "thursday", "friday", "saturday", "sunday"
  ]
  
  timeToMili = (time, date = new Date()) -> #8am to miliseconds
    pm = _.s(time, -2, 2) == "pm"
    am = _.s(time, -2, 2) == "am"
    hours = 0
    minutes = 0

    if am or pm
      time = _.s time, 0, -2

    if time.indexOf(":") >= 0
      time = time.split ":"
      hours = time[0]
      minutes = time[1]
    else
      hours = time
    if pm then hours = hours - 0 + 12
    console.log pm
    console.log hours
    newDate = new Date date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0
    ret = newDate.getTime()
    
  
  getDayRow = (day, model) ->
    if model[day + "Open"]
      hoursHtml = """
        <td align="right">#{model["#{day}Start"]}</td>
        <td> to </td>
        <td align="right">#{model["#{day}End"]}</td>
      """
    else
      hoursHtml = """
        <td> Closed </td>
      """
    dayHtml = """
      <tr>
        <td>#{_.capitalize(day)}</td>
          #{hoursHtml}
      </tr>
    """
  Router = require "router"
  AppView = {}
  AppView.init = (options) ->
    {model} = options
    self = eventer {}
    {emit} = self

    extraStyles = $ """
      <style>
        
        .phone-bar a {
          color: #{model.phoneColor}  
        }

        body {
          color: #{model.bodyTextColor};
          background-image: url('#{model.promo}');
          background-repeat: no-repeat;
        }
        
        .headline {
          color: #{model.headlineColor}
        }


        .promo-wrapper {
          color: #{model.promoTextColor}
        }

        .nav-item, .full-site {
          color: #{model.buttonsTextColor}
        }

        .item .title {
          color: #{model.menuTitleTextColor or "black"}
        }

        .item .price{
          color: #{model.menuPriceTextColor or "gray"}
        }

        .item .description{
          color: #{model.menuDescriptionTextColor}
        }
        
        .menu-gradient {
          background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#{model.menuColor1 or "white"}), color-stop(1,#{model.menuColor2 or "#EFEFEF"}));
        }


        .tile {
          background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#{model.bodyColor1}), color-stop(1,#{model.bodyColor2}));
          
        }

        .promo-gradient {
          background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#{model.promoColor1}), color-stop(1,#{model.promoColor2}));
        }

      </style>
    """

    extraStyles.appendTo $ "head"

    $("h1").bind "click", () ->
      location.href = "#"

    showPage = (className) ->
      $(".content .tile").hide()
      $(".content .tile.#{className}").show()
      if className == "home"
        className = ""
      if className != ""
        phoneText = model.phone
      else
        phoneText = ""
      $(".headline").html """
        <div class="left">#{navItems[className]}</div>
        
        <div class="right phone-bar"><a href="tel:#{phoneText}">#{phoneText}</a></div>
      """


    $(".content").append """<div class="clear"></div>"""


    if model.address
      mapText = "Map"
    else
      mapText = "Locations"
    navItems =
      specials: "Specials"
      menu: model.itemsText
      map: mapText
      hours: "Hours"
      phone: """
        <span style="">#{model.phone}</span>
      """
      facebook:"facebook"
      twitter: "Twitter"
      "": model.headline

    nav = self.nav = (className) ->
      scrollTo 0, 0, 1
      if className == ""
        className = "home"
      if className == "specials"
        existingPhone = localStorage.existingPhone
        if existingPhone?.match /[\d]{10}/
          showPage "specials"
          return
        phone = prompt("Enter your 10 digit phone number to view the Specials!")

        if phone
          phone = phone.replace /[^\d]/g, ""
          if not phone.match /[\d]{10}/
            alert "Phone number must be 10 digits."
            nav "specials"
            return
          emit "phone", phone
          localStorage.existingPhone = phone
          showPage "specials"
        else
          location.href = "#"
      else
        showPage className

     

    initHome = () ->

      routes = {}
      navHtml = ""
      _.each navItems, (navItemText, navItem) ->
        routes[navItem] = () -> 
          nav navItem 

        if navItem == ""
          return
        href = "#" + navItem
        if navItem == "call"
          href="tel:#{model.phone}"
        if navItem == "twitter"
          if model.twitterUrl
            href = model.twitterUrl
          else
            return

        if navItem == "facebook"
          if model.facebookUrl
            href = model.facebookUrl
          else
            return
        navItemUrl = model[navItem + "Icon"] || "http://drewl.us:8010/icons/#{navItem}.png"
        navHtml += """
          <a class="nav-item" data-nav="#{navItem}" href="#{href}" style="background-image: url('#{navItemUrl}')">
            <span>#{_.capitalize navItemText}</span>
          </a>
        """
      
      if model.promo
        promoImage = """<img src="#{model.promo}" />"""
      else
        promoImage = ""

      navHtml = $ """
        <div class="home tile page ">
          <div class="promo" style="position:absolute; z-index: -100;">
            <div class="promo-wrapper promo-gradient" style="display:none;">
              <div class="promo-text paddinglr">
                #{model.promoText}
              </div>
              <form class="phone-form paddinglr" action="/" method="POST">
                <div class="clearfix">
                  <div class="input">
                    <input id="phone" name="phone" type="tel">
                    <input class="send" type="submit" value="Send">
                  </div>
                </div> <!-- /clearfix -->
              </form>
            </div>
          </div>
          <div class="nav">
            #{navHtml}
          </div>
          <div class="clear">
          <br />
          <br />
        <a class="full-site" href="#{model.fullUrl}">Full Site</a><a class="full-site" href="javascript:delete localStorage.existingPhone;void(0);">.</a>
        </div>
      """


      $(".content").append navHtml
      navHtml.find("form").bind "submit", (e) ->
        e.preventDefault()
        emit "phone", $("#phone").val()


       
      router = Router.init routes
      router.initHashWatch()

    displayDirections = () ->
      urlAddress = encodeURIComponent model.address.replace /\n/g, " "
      htmlAddress = model.address.replace /\n/g, "<br />"
      directionsHtml =  """
       <div class="tile map hidden">
         <div class="paddinglr">#{htmlAddress}</div>

         <!--<a target="blank" href="http://maps.google.com/maps?daddr=#{urlAddress}">Google Map Directions</a>-->
         <a target="blank" href="http://maps.google.com/maps?q=#{urlAddress}">
         <img src="http://maps.googleapis.com/maps/api/staticmap?center=#{urlAddress}&zoom=14&size=320x320&markers=color:red|#{urlAddress}&maptype=roadmap&sensor=false" />
         </a>
       </div>
      """
      $(".content").append directionsHtml
    displayDirections()
      


    displayHours = () ->
      dayRows = ""
      for day in daysMonday
        dayRows += getDayRow day, model
      hoursTable =  """ 
        <table class="paddinglr">
          <tbody>
            #{dayRows}
          </tbody>
        </table>
      """
      $(".content").append """
        <div class="hours tile hidden">#{hoursTable}</hours>
      """
    displayHours()

    menuMaker = (name) ->
      displayItems = () ->
        itemsTable =  """ 
          <div class="items-table">

          </div>
        """
        $(".content").append """
          <div class="#{name} tile hidden">#{itemsTable}</hours>
        """
      displayItems()
      self["add" + drews.capitalize(name)] = (items) ->
        if name == "items"
          console.log "you are adding an item"

        _.each items, (item) ->
          console.log item 
          $(".content .#{name}").append $ """
            <div class="item menu-gradient">
                <div class="left">
                  <img class=""  src="#{item.image or model.headerUrl}" />
                </div>
                <div class="right relative">
                  <div class="item-top-bar relative">
                    <div class="title">#{item.title or ""}</div>
                    <div class="price">#{item.price or ""}</div>
                  </div>
                  <div class="description">#{item.description or ""}</div>
                </div>
                <div class="clear"></div>
            </div>
          """
    menuMaker "specials"
    menuMaker "menu"




    self.doHours = () ->
      date = new Date()
      day = days[date.getDay()]
      isEvenOpen = model["#{day}Open"]
      if not isEvenOpen
        return $(".open").html """
          <a href="#hours">Hours</a>
        """
      openText = model["#{day}Start"]
      closeText = model["#{day}End"]
      openTime = timeToMili openText
      closeTime = timeToMili closeText

      time = drews.time()
      if time >= openTime and time <= closeTime
        
        openText = """
          Open til #{drews.s(closeText, 0, -2)}
        """
      else
        openText = """
          <a href="#hours">Hours</a>
        """

      $(".hours").text openText
      $("[data-nav=hours] > span").html openText


    initHome()
    self
  AppView


loadScript = (url, callback) ->
  script = document.createElement "script"

  
  

define "app-presenter", () ->
  model = require "model"
  AppView = require "app-view"
  AppPresenter = {}
  AppPresenter.init = () ->

    severus.db = "mobilemin_#{model.name}"
    view = AppView.init model: model
    view.doHours()

    severus.find "items", (err, items) ->
      items = items.sort (a, b)->
        a.order - b.order
      view.addMenu items

    severus.find "specials", (err, items) ->
      items = items.sort (a, b)->
        a.order - b.order
      view.addSpecials items

    view.on "phone", (phone) ->
      severus.save "phones", {phone}, (err) ->
        #alert "Thank you"

  AppPresenter


AppPresenter = require "app-presenter"

$ ->
  alert "test"
  AppPresenter.init()
  drews.wait 1000, -> scrollTo 0, 0, 1
