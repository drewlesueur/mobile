(function() {
  var $, texter;
  texter = require("text");
  $ = require("jquery");
  $(function() {
    return $(".text-form").submit(function(e) {
      var message, to;
      to = $(".to").val();
      message = $(".message").val();
      e.preventDefault();
      return texter.text("4804208755", to, message, function(err, result) {
        return alert("you sent a text message");
      });
    });
  });
}).call(this);
