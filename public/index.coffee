define "zepto", () -> Zepto
define "underscore", () -> _
define "nimble", () -> _


_.templateSettings =
  interpolate : /\{\{(.+?)\}\}/g

_320 = null
$ = require "zepto"

drews = require "drews-mixins"
severus = require("severus2")()
texter = require("text")
eventer = require "drews-event"

getPhone = ->
  existingPhone = localStorage.existingPhone
  if existingPhone?.match /[\d]{10}/
    if confirm "Is your phone number #{existingPhone}?"
      return existingPhone
    else
      delete localStorage.existingPhone
  phone = prompt("Enter your 10 digit phone number to view the Specials!")
  if phone
    phone = phone.replace /[^\d]/g, ""
    if not phone.match /[\d]{10}/
      alert "Phone number must be 10 digits."
      getPhone()
      return ""
    getPhone.emit "phone", phone
    localStorage.existingPhone = phone
    return phone
  else
    alert "You must enter your phone to redeem specials"

 getPhone = eventer getPhone



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

  getHoursTable = (model) ->
    dayRows = ""
    for day in daysMonday
      dayRows += getDayRow day, model
    hoursTable =  """ 
      <table class="paddinglrt15">
        <tbody>
          #{dayRows}
        </tbody>
      </table>
    """
    hoursTable


  Router = require "router"
  AppView = {}
  AppView.init = (options) ->
    
    if $.os.android
      view = SimpleAppView.init options
      return view
    
    if $.os.ios and parseFloat($.os.version) >= 3.1
      canSwipe = true

    {model} = options
    self = eventer {}
    {emit} = self
    $(document.body).append """
      <div class="content content-gradient"></div>
    """
    swipeAnimationSeconds = 0.25
    activeTile = null

    scrollTo 0,0,1
    if (model.textShadowPresent + "").toLowerCase() == "no"
      textShadowCss = """
        .nav-item, .headline {
          text-shadow: none;
        }
      """
    else
      textShadowCss = """
        .nav-item, .headline {
          text-shadow: 2px 2px 3px #000;
        }
      """
    extraStyles = $ """
      <style>
        #{textShadowCss} 

        body, html {
          width: #{innerWidth}px;
          height: #{1000}px;
          overflow-x: hidden;
          overflow-y: visible;
        }

        .nav a {
          height: #{innerWidth / 3}px;
          width: #{innerWidth / 3}px;
        }
        
        .phone-bar a {
          color: #{model.phoneColor}  
        }

        body {
          color: #{model.bodyTextColor};
          background-image: url('#{model.backgroundImage}');
          background-repeat: no-repeat;
          background-size: 100%;
         
        }

        .second-bar {
          background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#{model.secondBarColor1 or "white"}), color-stop(1,#{model.secondBarColor2 or "#EFEFEF"}));
        }
        
        .headline {
          color: #{model.headlineColor}
        }

        .tile:not(.home) {
          background-color: white; 
          min-height: #{innerHeight + 90}px;

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
          width: #{_320}px;
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
      myTile = $(".content .tile.#{className}")
      myTile.show()
      if not canSwipe
        if myTile.length > 0
          $("body, html").css height: (getComputedStyle myTile[0]).getPropertyValue("height")

      index = myTile.index()
      if className == "home"
        className = ""
      if className != ""
        phoneText = model.phone
      else
        phoneText = ""
      newX = - innerWidth * index
      $(".content").anim
        translate3d: "#{newX}px, #{0}px, 0"
      , swipeAnimationSeconds, 'cubic-bezier(0.000, 0.000, 0.005, 0.9999)'
      , () -> touch.transitionDone = true
        
        


    #$(".content").append """<div class="clear"></div>"""


    if model.address
      mapText = "Map"
    else
      mapText = "Locations"
    navItems =
      specials: "Specials"
      menu: model.itemsText
      phone: """
        <span style="">#{model.phone}</span>
      """
      hours: "Hours"
      map: mapText
      facebook:"facebook"
      twitter: "Twitter"
      "": model.headline

    nav = self.nav = (className) ->
      scrollTo 0, 0, 1
      if className == ""
        className = "home"
      #TODO specials
      showPage className


    routes = {}
    addHomePage = () ->
      navHtml = ""
      _.each navItems, (navItemText, navItem) ->
        routes[navItem] = () -> 
          nav navItem 

        if navItem == ""
          return
        href = "#" + navItem
        if navItem == "phone"
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
        <div class="home tile page2" data-page="home">
          <div class="hbox center">
             <div>
             <img src="#{model.headerUrl}">
             </div>
          </div>
          <div class="headline text-center">#{model.headline}</div>
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


       

    addDirectionsPage = () ->
      urlAddress = encodeURIComponent model.address.replace /\n/g, " "
      htmlAddress = model.address.replace /\n/g, "<br />"
      directionsHtml =  """
       <div class="tile map page2" data-page="map">
         <div class="text-center headline second-bar">
           <a href="#" class="left home-icon"></a>
           #{"Map"}
           <a href="tel:#{model.phone}" class="right phone-icon"></a>
         </div>
         <div class="paddinglr15">
           <br />
           <div><b>#{model.title}</b></div>
           <div>#{model.crossStreets}</div>
           #{htmlAddress}
         </div>

         <!--<a target="blank" href="http://maps.google.com/maps?daddr=#{urlAddress}">Google Map Directions</a>-->
         <a target="blank" href="http://maps.google.com/maps?q=#{urlAddress}">
         <br />
         <img src="http://maps.googleapis.com/maps/api/staticmap?center=#{urlAddress}&zoom=14&size=#{_320}x#{_320}&markers=color:red|#{urlAddress}&maptype=roadmap&sensor=false" />
         </a>
       </div>
      """
      $(".content").append directionsHtml
      




    addHoursPage = () ->
      hoursTable = getHoursTable(model)

      $(".content").append """
        <div class="hours tile page2" data-page="hours">
         <div class="text-center headline second-bar">
           <a href="#" class="left home-icon"></a>
           #{"Hours"}
           <a href="tel:#{model.phone}" class="right phone-icon"></a>
         </div>
          #{hoursTable}
        </hours>
      """

    menuMaker = (name) ->
      addMenuPage = () ->
        itemsTable =  """ 
          <div class="items-table">

          </div>
        """
        $(".content").append """
          <div class="#{name} tile page2 scrollable2 vertical2" data-page="#{name}">
            <div class="text-center headline second-bar">
             <a href="#" class="left home-icon"></a>
              #{drews.capitalize navItems[name]}
             <a href="tel:#{model.phone}" class="right phone-icon"></a>
            </div>
            #{itemsTable}
          </div>
        """

      self["add" + drews.capitalize(name)] = (items) ->

        _.each items, (item) ->

          if name is "specials"
            redeemButton = $ """
              <input type="button" class="redeem-button" value="Redeem">
            """
            redeemButton.bind "click", (e) ->
              phone = getPhone()
              if phone
                emit "redeem", phone, item
          else
            redeemButton = ""

          itemRow = $ """
            <div class="item menu-gradient hbox">
                <div>
                  <img class=""  src="#{item?.image or model.headerUrl}" />
                </div>
                <div class="relative boxFlex">
                  <div class="item-top-bar relative">
                    <div class="title">#{item?.title or ""}</div>
                    <div class="price">#{item?.price or ""}</div>
                  </div>
                  <div class="description">#{item?.description or ""}</div>
                  <div class="redeem-wrapper">
                  </div>
                </div>
                <div class="clear"></div>
            </div>
          """
          $(".content .#{name}").append itemRow
          $(itemRow).find(".redeem-wrapper").append redeemButton
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
    router = Router.init routes
    router.initHashWatch()

#view-source:http://www.netzgesta.de/dev/cubic-bezier-timing-function.html



    cubed = (x) -> Math.pow(x, 3)
    squared = (x) -> Math.pow(x, 2)
    easingMaker = (x2, y2, x3, y3) ->
      [x1, y1, x4, y4] = [0, 0, 1, 1]
      (t) ->
        newX = cubed(1 - t) * x1 + 3 * squared(1 - t) * t * x2 + 3 * (1 - t) * squared(t) * x3 + cubed(t) + x4
        newX - 1

        
    defaultEasing =  easingMaker(0, 1, 1, 0) 
    testEasing = () ->
      for ii in [0...10]
        console.log "easing test #{defaultEasing ii/10}"


    doEasing = (info, callback, complete=->) ->
      timerFuncs = {}
      values = info.values
      duration = info.duration
      _.each values, ([start, end, easing], key) ->
        easing or= defaultEasing
        diff = end - start
        timerFuncs[key] = (time) ->
          diff * easing(time) + start

      time1 = new Date().getTime()
      interval = () ->
        time2 = new Date().getTime()
        values = {} 
        time = (time2 - time1) / duration 
        _.each timerFuncs, (func, key) ->
          values[key] = func time
        callback null, values
        if time >= 1
          complete null
          clearInterval timer
          return
          

      timer = setInterval interval, 0
     
    setActiveTile = (_activeTile) ->
      activeTile = _activeTile
      #router.disable()
      page = $(activeTile).attr "data-page"
      if page is "home" then page = ""
      location.href = "#" + page
      #router.enable()


    $(document).bind "scroll", () ->
      return true
      
      x = Math.round(window.pageXOffset / _320) * _320
      doEasing
        values: 
          x: [window.pageXOffset, x]
          y: [window.pageYOffset, 0]
        duration: 500
        (err, values) ->
          scrollTo values.x, window.pageYOffset
        
      $(".tile").each () ->
        if this == activeTile then return
        this.style.webkitTransform = "translate3d(0, #{window.pageYOffset}px, 0)"

    pushToTop = () ->
      $(".tile").each () ->
        this.style.webkitTransform = "translate3d(0, 0, 0)"

    getXY = (el=null) ->
      if not el then return [0,0]
      transform = getComputedStyle(el).webkitTransform #"matrix(a,b,c,d,e,f)"
      matrix = new WebKitCSSMatrix(transform) #maybe parse the string instead?
      [matrix.m41, matrix.m42]
    
    content = $(".content")[0]
    touch = {}
    setActiveTile $(".tile.home")[0]

    lastContentTransform = null
    
    touchStart = (e) ->
      #http://cubiq.org/scrolling-div-on-iphone-ipod-touch
      #console.log getComputedStyle(content).webkitTransform

      activeTileTransform = getComputedStyle(activeTile).webkitTransform #"matrix(a,b,c,d,e,f)"
      activeTile.style.webkitTransform = activeTileTransform
      activeTile.style.webkitTransition = ""
      transform = getComputedStyle(content).webkitTransform #"matrix(a,b,c,d,e,f)"
      toTransform = content.style.webkitTransform
      content.style.webkitTransform = transform
      content.style.webkitTransition = ""

      delete touch.yOnly
      touch.transitionDone = true


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


    touchMove = (e) ->
      touch.x1 = touch.x2
      touch.y1 = touch.y2
      touch.time1 = touch.time2
      touch.x2 = e.touches[0].pageX
      touch.y2 = e.touches[0].pageY
      [contentX, contentY] = getXY content
      touch.time2 = new Date().getTime()
      time = touch.time2 - touch.time1
      {x1, x2, y1, y2} = touch
      xLen = x2 - x1
      yLen = y2 - y1
      x = Math.pow(xLen, 2)
      y = Math.pow(yLen, 2)
      distance = Math.pow x + y, 0.5
      speed = distance / time
      #TODO: are you usin gthe above calculations
      
      e.preventDefault()

      if "yOnly" not of touch
        #if touch.transitionDone
        if Math.abs(xLen) > Math.abs(yLen) 
          touch.yOnly = false
        else
          touch.yOnly = true

      if touch.yOnly
        [tileX, tileY] = getXY activeTile
        
        tileY = tileY + yLen
       
        #resistance is futile
        if tileY > 0
          tileY = tileY - yLen
          tileY = tileY + ((innerHeight - tileY) / innerHeight) * 0.38 * yLen
        else if $(activeTile).height() <=  innerHeight
          if tileY < 0
            tileY = tileY - yLen
            tileY = tileY + ((innerHeight - tileY) / innerHeight) * 0.38 * yLen
        else
          if tileY < maxHeight = - $(activeTile).height() + innerHeight
            tileY = tileY - yLen
            tileY = tileY + ((innerHeight - (tileY - maxHeight)) / innerHeight) * 0.38 * yLen

        activeTile.style.webkitTransform = "translate3d(#{0}, #{tileY}px, 0)"
      else
        contentX = contentX + xLen
        if contentX > 0
          1
          contentX = contentX - xLen
          contentX = contentX + ((innerWidth - contentX) / innerWidth) * 0.38 * xLen
        if contentX <= maxWidth =  - $(".tile").length * _320 + innerWidth
          contentX = contentX - xLen
          contentX = contentX + ((innerWidth - (contentX - maxWidth)) / innerWidth) * 0.38 * xLen
          
        content.style.webkitTransform = "translate3d(#{contentX}px, #{0}px, 0)"
     
    touchEnd = (e) ->
      {x0, x1, x2, y0, y1, y2} = touch
      time = touch.time2 - touch.time1
      xLen = x2 - x1
      yLen = y2 - y1
      x = Math.pow(xLen, 2)
      y = Math.pow(yLen, 2)
      distance = Math.pow x + y, 0.5
      speed = distance / time
      newDistance = distance + speed * 100

      if distance != 0
        newXLen = xLen * newDistance / distance
        newYLen = yLen * newDistance / distance
      else
        newXLen = 0
        newYLen = 0

      [contentX, contentY] = getXY content
      [tileX, tileY] = getXY activeTile


      if touch.yOnly  
        newY = newYLen + tileY
        newX = contentX
      else
        newX = newXLen + contentX
        newY = tileY



      #SUPER TODO: fix the wierd snapping at one second transition

      $tile = $(".tile")
      #loop thru tiles
      for tileIndex in [0...$tile.length]
        tile = $tile.get(tileIndex) 
        tileHeight = $(tile).height()
        if tile == activeTile
          tileY = newY #the perscribed new y
        else
          [tileX, tileY] = getXY tile
        if tileHeight <= innerHeight
          if tileY != 0
            tileY = 0
        else
          if tileY > 0
            tileY = 0
          else if tileY <= - $(tile).height() + innerHeight
            tileY = - $(tile).height() + innerHeight
            

        $(tile).anim
          translate3d: "0, #{tileY}px, 0"
        , swipeAnimationSeconds, 'cubic-bezier(0.000, 0.000, 0.005, 0.9999)'
        , () -> touch.transitionDone = true
          
      newXNotRounded = newX
      index = -Math.round(newX / _320)
      newX =  -index * _320
      
      if newX >= _320
        newX = 0
        index = 0
      else
        minTranslateX = - $(".tile").length * _320 + _320
        if newX <= minTranslateX then newX = minTranslateX 
        index = -Math.round(newX / _320)


      setActiveTile $(".content .tile").get(index)
      document.title = $(activeTile).attr "data-page"

      touch.transitionDone = false
     
      #TODO: when active tile changes
      # because the activeTile could change and you might be changing
      # onother tile

      #todo: maybe take out the transition done code
      
      if not touch.yOnly #required for android. I wonder why this worked. SUPER TODO: what am I giving up by iffing this
        $(content).anim
          translate3d: "#{newX}px, #{0}px, 0"
        , swipeAnimationSeconds, 'cubic-bezier(0.000, 0.000, 0.005, 0.9999)'
        , () -> touch.transitionDone = true

      #setTimeout pushToTop, 250

    touching = () ->  
      $(document).bind "touchstart", touchStart
      $(document).bind "touchmove", touchMove
      $(document).bind "touchend", touchEnd

    if canSwipe
      touching()

    

    self
  SimpleAppView = {}
  SimpleAppView.init = (options) ->
    {model} = options
    self = eventer {}
    {emit} = self

    urlAddress = encodeURIComponent model.address.replace /\n/g, " "
    htmlAddress = model.address.replace /\n/g, "<br />"

    hoursTable = getHoursTable(model)

    simpleHtml = """
      <div class="content content-gradient"></div>
        <img src="#{model.headerUrl}" />
        <h1>#{model.title}</h1>
        <a href="tel:#{model.phone}">#{model.phone}</a>
        <div>#{model.crossStreets}</div>
        <a target="blank" href="http://maps.google.com/maps?daddr=#{urlAddress}">Google Map Directions</a>
        <a name="hours"></a>
        <h2>Hours</h2>
        #{hoursTable}
      </div>

    """
    $(document.body).append simpleHtml
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

    false and severus.find "items", (err, items) ->
      items = items.sort (a, b)->
        a.order - b.order
      #view.addMenu items

    false and severus.find "specials", (err, items) ->
      items = items.sort (a, b)->
        a.order - b.order
      #view.addSpecials items
    
    itemSort = (items) ->
      items = items.sort (a, b)->
        a.order - b.order
      return items
    
    view.addMenu? itemSort model.menu
    view.addSpecials? itemSort model.specials
      
      
    getPhone.on "phone", (phone) ->
      severus.save "phones", {phone}, (err) ->
    
    view.on "redeem", (phone, item) ->
      textTemplate = _.template(model.redeemText or "You have redeemed #{item.title}.")
      texter.text model.twilioPhone, phone, textTemplate item
      alertTemplate = _.template(model.redeemAlert or "A text message has been sent to you to redeem #{item.title}.")
      alert alertTemplate item

  AppPresenter


AppPresenter = require "app-presenter"

$ ->
  _320 = innerWidth
  AppPresenter.init()
  drews.wait 1000, -> scrollTo 0, 0, 1
