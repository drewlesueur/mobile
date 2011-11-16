
  describe("MobileminTwilio", function() {
    var MobileminTwilio, mobileminTwilio;
    MobileminTwilio = require("mobilemin-twilio");
    mobileminTwilio = null;
    beforeEach(function() {
      return mobileminTwilio = new MobileminTwilio();
    });
    it("should be there", function() {
      return expect(mobileminTwilio).toBeTruthy();
    });
    return it("should");
  });
