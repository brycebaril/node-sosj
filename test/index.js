var test = require("tape").test

var align = require("../align")

var spy = require("through2-spy")
var spigot = require("stream-spigot")

test("init", function (t) {
  t.equals(typeof align, "function", "Align loaded and is a function")
  t.end()
})

test("align", function (t) {
  t.plan(6)

  var left = spigot({objectMode: true}, [
    {v: 0, foo: 100},
    {v: 1, foo: 200},
    {v: 2, foo: 300},
    {v: 3, foo: 400},
    {v: 4, foo: 500},
  ])

  var right = spigot({objectMode: true}, [
    {v: 0, bar: 100},
    {v: 2, bar: 200},
    {v: 4, bar: 300},
    {v: 8, bar: 400},
  ])

  var expected = [
    [ { v: 0, foo: 100 }, { v: 0, bar: 100 } ],
    [ { v: 1, foo: 200 }, null ],
    [ { v: 2, foo: 300 }, { v: 2, bar: 200 } ],
    [ { v: 3, foo: 400 }, null ],
    [ { v: 4, foo: 500 }, {v: 4, bar: 300} ],
    [ null, { v: 8, bar: 400 } ],
  ]

  function check(r) {
    t.deepEquals(r, expected.shift(), "Expected record emitted")
  }

  align("v", left, right)
    .pipe(spy({objectMode: true}, check))
})

test("align new key", function (t) {
  t.plan(5)

  var left = spigot({objectMode: true}, [
    {v: 0, foo: 100},
    {v: 1, foo: 200},
    {v: 2, foo: 300},
    {v: 3, foo: 400},
    {v: 4, foo: 500},
  ])

  var right = spigot({objectMode: true}, [
    {v: 0, foo: 100},
    {v: 2, foo: 200},
    {v: 4, foo: 300},
    {v: 8, foo: 400},
  ])

  var expected = [
    [ { v: 0, foo: 100 }, { v: 0, foo: 100 } ],
    [ { v: 1, foo: 200 }, { v: 2, foo: 200 } ],
    [ { v: 2, foo: 300 }, { v: 4, foo: 300 } ],
    [ { v: 3, foo: 400 }, { v: 8, foo: 400 } ],
    [ { v: 4, foo: 500 }, null ]
  ]

  function check(r) {
    t.deepEquals(r, expected.shift(), "Expected record emitted")
  }

  align("foo", left, right)
    .pipe(spy({objectMode: true}, check))
})

test("align float keys", function (t) {
  t.plan(6)

  var left = spigot({objectMode: true}, [
    {v: 0.11, foo: 100},
    {v: 1.11, foo: 200},
    {v: 2.11, foo: 300},
    {v: 3.11, foo: 400},
    {v: 4.11, foo: 500},
  ])

  var right = spigot({objectMode: true}, [
    {v: 0.12, bar: 100},
    {v: 2.12, bar: 200},
    {v: 4.12, bar: 300},
    {v: 8.12, bar: 400},
  ])

  var expected = [
    [ { v: 0.11, foo: 100 }, { v: 0.12, bar: 100 } ],
    [ { v: 1.11, foo: 200 }, null ],
    [ { v: 2.11, foo: 300 }, { v: 2.12, bar: 200 } ],
    [ { v: 3.11, foo: 400 }, null ],
    [ { v: 4.11, foo: 500 }, {v: 4.12, bar: 300} ],
    [ null, { v: 8.12, bar: 400 } ],
  ]

  function check(r) {
    t.deepEquals(r, expected.shift(), "Expected record emitted")
  }

  align("v", left, right, 0.011)
    .pipe(spy({objectMode: true}, check))
})
