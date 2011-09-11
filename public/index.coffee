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
    $(document.body).append """
      <div class="content content-gradient scrollable2 horizontal2 paginated2"></div>
    """


    extraStyles = $ """
      <style>
        
        .phone-bar a {
          color: #{model.phoneColor}  
        }

        body {
          color: #{model.bodyTextColor};
          background-image: url('#{model.backgroundImage}');
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
      #$(".content .tile").hide()
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


    #$(".content").append """<div class="clear"></div>"""


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

     

    addHomePage = () ->

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
      

      navHtml = $ """
        <div class="home tile page2 ">
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

    addDirectionsPage = () ->
      urlAddress = encodeURIComponent model.address.replace /\n/g, " "
      htmlAddress = model.address.replace /\n/g, "<br />"
      directionsHtml =  """
       <div class="tile map page2">
         <div class="paddinglr">#{htmlAddress}</div>

         <!--<a target="blank" href="http://maps.google.com/maps?daddr=#{urlAddress}">Google Map Directions</a>-->
         <a target="blank" href="http://maps.google.com/maps?q=#{urlAddress}">
         <img src="http://maps.googleapis.com/maps/api/staticmap?center=#{urlAddress}&zoom=14&size=320x320&markers=color:red|#{urlAddress}&maptype=roadmap&sensor=false" />
         </a>
       </div>
      """
      $(".content").append directionsHtml
      


    addHoursPage = () ->
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
        <div class="hours tile page2">#{hoursTable}</hours>
      """

    menuMaker = (name) ->
      addMenuPage = () ->
        itemsTable =  """ 
          <div class="items-table">

          </div>
        """
        $(".content").append """
          <div class="#{name} tile page2 scrollable2 vertical2">#{itemsTable}</hours>
        """
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
      addMenuPage

    addSpecialsPage = menuMaker "specials"
    addMenuPage = menuMaker "menu"

    self.calcHours = () ->
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


    addHomePage()
    addSpecialsPage()
    addMenuPage()
    addDirectionsPage()
    addHoursPage()
    
    content = $(".content")[0]
    touch = {}
    touch.newX = 0
    touch.newY = 0
    touch.oldX = 0
    touch.oldY = 0
    touchStart = (e) ->
      delete touch.yOnly
      #e.preventDefault()
      touch.x1 = e.touches[0].pageX
      touch.y1 = e.touches[0].pageY
      touch.time0 = new Date().getTime()
      touch.time1 = new Date().getTime()
      touch.time2 = new Date().getTime()
      touch.x0 = touch.x1
      touch.y0 = touch.y1
      touch.x2 = touch.x1
      touch.y2 = touch.y1

    $(document).bind "touchstart", touchStart

    touchMove = (e) ->
      if touch.yOnly == true
        return
      document.title = "#{touch.x1}, #{touch.x2} #{touch.newX}"
      touch.x1 = touch.x2
      touch.y1 = touch.y2
      touch.time1 = touch.time2
      touch.x2 = e.touches[0].pageX
      touch.y2 = e.touches[0].pageY
      touch.oldX = touch.newX
      touch.oldY = touch.newY
      touch.newX = touch.newX + touch.x2 - touch.x1
      touch.newY = touch.newY + touch.y2 - touch.y1
      touch.time2 = new Date().getTime()

      time = touch.time2 - touch.time1
      {x1, x2, y1, y2} = touch
      xLen = x2 - x1
      yLen = y2 - y1
      x = Math.pow(xLen, 2)
      y = Math.pow(yLen, 2)
      distance = Math.pow x + y, 0.5
      speed = distance / time
      
      document.title = "#{((xLen / yLen) + "").substring(0,4)}"

      if "yOnly" not of touch
        console.log "yonl"
        if Math.abs(xLen / yLen) > 0.5
          touch.yOnly = false
        else
          touch.yOnly = true

      if touch.yOnly == false
        e.preventDefault()
        content.style.webkitTransform = "translate3d(#{touch.newX}px, #{0}px, 0)"

      

    touchEnd = (e) ->
      if touch.yOnly == true
        return
      {x0, x1, x2, y0, y1, y2} = touch
      time = touch.time2 - touch.time1
      xLen = x2 - x1
      yLen = y2 - y1
      x = Math.pow(xLen, 2)
      y = Math.pow(yLen, 2)
      distance = Math.pow x + y, 0.5
      speed = distance / time
      newDistance = distance + speed * 100
      if distance == 0 then return
      newXLen = xLen * newDistance / distance
      newYLen = yLen * newDistance / distance
      newX = newXLen + touch.newX
      newY = newYLen + touch.newY
      touch.newX = newX
      touch.newY = newY


      document.title = "#{distance} #{time} #{distance/time}"
      document.title = "#{newXLen} #{x2}"

      $(content).anim
        translate3d: "#{newX}px, #{0}px, 0"
      , 0.25, 'cubic-bezier(0.000, 0.000, 0.005, 0.9999)'
      
    $(document).bind "touchmove", touchMove
    $(document).bind "touchend", touchEnd
    

        
      

    self
  AppView



define "app-presenter", () ->
  model = require "model"
  AppView = require "app-view"
  AppPresenter = {}
  AppPresenter.init = () ->

    severus.db = "mobilemin_#{model.name}"
    view = AppView.init model: model
    #view.calcHours()

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
  AppPresenter.init()
  drews.wait 1000, -> scrollTo 0, 0, 1
