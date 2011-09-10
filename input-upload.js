(function() {
  var InputUpload;
  InputUpload = {};
  InputUpload.init = function(els) {
    var FileBox, emit, eventer, fileDroppable, fileHandler, self;
    fileDroppable = require("file-droppable");
    FileBox = require("filebox");
    eventer = require("drews-event");
    self = eventer({});
    emit = self.emit;
    fileHandler = fileDroppable($(els));
    fileHandler.on("filedroppableover", function(el) {
      return $(el).css({
        "background-color": "yellow"
      });
    });
    fileHandler.on("filedroppableleave", function(el) {
      return $(el).css({
        "background-color": "white"
      });
    });
    fileHandler.on("filedroppableurls", function(urls, el) {
      el = $(el);
      $(el).css({
        "background-color": "white"
      });
      el.val(urls);
      return emit("change", $(el));
    });
    fileHandler.on("filedroppablefiles", function(files, el) {
      var filebox, progressBar;
      el = $(el);
      $(el).css({
        "background-color": "white"
      });
      progressBar = $("<div style=\"background-color: blue; height: 10px; width: 0px; position: absolute; left: " + (el.offset().left) + "px; top: " + (el.offset().top) + "px; \" ></div>");
      $(document.body).append(progressBar);
      filebox = FileBox();
      filebox.on("progress", function(progress) {
        return progressBar.css({
          width: $(el).width() * progress + "px"
        });
      });
      el = $(el);
      return filebox.uploadFiles(files, function(err, urls) {
        el.val(urls[0]);
        emit("change", $(el));
        return progressBar.remove();
      });
    });
    return self;
  };
  define("input-upload", function() {
    return InputUpload;
  });
}).call(this);
