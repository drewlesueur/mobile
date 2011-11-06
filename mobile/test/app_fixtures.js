(function() {
  define("app-fixtures", function() {
    var appFixtures, krazySubFixture, ykFixture;
    ykFixture = {
      name: "Yk",
      title: "Yogurt Kingdom"
    };
    krazySubFixture = {
      name: "krazysub",
      title: "Krazy Sub"
    };
    return appFixtures = [ykFixture, krazySubFixture];
  });
}).call(this);
