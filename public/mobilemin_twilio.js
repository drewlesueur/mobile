(function() {
  var difinir;
  var __slice = Array.prototype.slice;

  if (typeof module !== "undefined" && module !== null ? module.exports : void 0) {
    difinir = function() {
      var args, ret, _i;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), ret = arguments[_i++];
      return module.exports = ret();
    };
    define = difinir;
  }

  define("mobilemin-twilio", function() {
    var MobileMinTwilio;
    MobileMinTwilio = (function() {

      function MobileMinTwilio() {}

      return MobileMinTwilio;

    })();
    return MobileMinTwilio;
  });

}).call(this);
