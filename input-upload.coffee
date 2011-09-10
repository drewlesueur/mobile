InputUpload = {}

InputUpload.init = (els) ->
  fileDroppable = require "file-droppable"
  FileBox = require "filebox" 

  fileHandler = fileDroppable $(els)
  fileHandler.on "filedroppableover", (el) ->
    $(el).css "background-color": "yellow"

  fileHandler.on "filedroppableurls", (urls, el) ->
    el = $(el)
    el.val urls
    
    

  fileHandler.on "filedroppablefiles", (files, el) ->
    el = $(el)
    progressBar = $ """
      <div style="background-color: blue; height: 10px; width: 0px; position: absolute; left: #{el.offset().left}px; top: #{el.offset().top}px; " ></div>
    """
    $(document.body).append progressBar
    filebox = FileBox()
    filebox.on "progress", (progress) ->
      progressBar.css
        width: $(el).width() * progress + "px"
    el = $(el)
    filebox.uploadFiles files, (err, urls) ->
      el.val urls[0]
      progressBar.remove()

define "input-upload", -> InputUpload
