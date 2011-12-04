describe "all-func", ->
  allFunc = dModule.require "all-func"
  obj = allFunc "object"
  list = allFunc "list" 
  isEqual = allFunc "isEqual"
  it "should wrap objects", ->
    myObj = obj
      name: "Drew"
      age: 27

    expect(myObj "name").toBe "Drew"

  it "should handle an empty object", ->
    myObj = obj()
    myObj("test", 1)
    expect(myObj "test").toBe(1)

  it "should return the original object for javascript, and compare", ->
    jsObj =
      name: "Drew"
      love: "Aimee"
 
    myObj = obj jsObj
    expect(myObj()).toBe(jsObj)

    myOtherObj = obj 
      name: "Drew"
      love: "Aimee"

    expect(isEqual myObj, myOtherObj).toBe true
  

    

