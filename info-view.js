(function() {
  define("info-view", function() {
    var infoViewMaker;
    return infoViewMaker = function() {
      var el, self;
      self = {};
      el = $("<div class=\"info\"></div>");
      self.getEl = function() {
        return el;
      };
      self.info = function(_info) {
        var ret;
        ret = $("<div class='info-item'>\n  " + _info + "\n</div>");
        el.append(ret);
        return ret;
      };
      self.clear = function(_el) {
        return _el.fadeOut(1000, function() {
          return _el.remove();
        });
      };
      return self;
    };
  });
}).call(this);
