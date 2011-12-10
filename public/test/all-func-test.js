
  describe("all-func", function() {
    var allFunc, isEqual, list, obj;
    allFunc = dModule.require("all-func");
    obj = allFunc("object");
    list = allFunc("list");
    isEqual = allFunc("isEqual");
    it("should wrap objects", function() {
      var myObj;
      myObj = obj({
        name: "Drew",
        age: 27
      });
      return expect(myObj("name")).toBe("Drew");
    });
    it("should handle an empty object", function() {
      var myObj;
      myObj = obj();
      myObj("test", 1);
      return expect(myObj("test")).toBe(1);
    });
    it("should return the original object for javascript, and compare", function() {
      var jsObj, myObj, myOtherObj;
      jsObj = {
        name: "Drew",
        love: "Aimee"
      };
      myObj = obj(jsObj);
      expect(myObj()).toBe(jsObj);
      myOtherObj = obj({
        name: "Drew",
        love: "Aimee"
      });
      return expect(isEqual(myObj, myOtherObj)).toBe(true);
    });
    it("should get a key of 0", function() {
      var myObj;
      myObj = obj({
        0: "hello",
        1: "world"
      });
      return expect(myObj(0)).toBe("hello");
    });
    return it("should wrap arrays", function() {
      var myList;
      myList = list(["a", "b", "c"]);
      return expect(myList(0)).toBe("a");
    });
  });
