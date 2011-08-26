(function() {
  define("min-presenter", function() {
    var Min, MinPresenter, eventBus;
    eventBus = require("event-bus");
    Min = require("min");
    MinPresenter = {};
    return MinPresenter.init = function(self) {
      var bind, emit, view;
      if (self == null) {
        self = {};
      }
      emit = eventBus.selfEmitter(self);
      bind = eventBus.bind;
      view = MinView.init();
      bind("minview.addphonenumber", function(view, _phoneNumber) {
        var phoneNumber;
        phoneNumber = PhoneNumber.init(_phoneNumber);
        return phoneNumber.save();
      });
      bind("phonenumber.save", function(phone) {
        return view.confirmPhoneSaved();
      });
      return bind("minview.sendtext", function(text) {
        text = Text.init(text);
        return text.save();
      });
    };
  });
}).call(this);
