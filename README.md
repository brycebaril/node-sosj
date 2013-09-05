sosj
=====

[![NPM](https://nodei.co/npm/sosj.png)](https://nodei.co/npm/sosj/)

Sequential Object Stream Joiner (SOSJ) -- Provides an `align` function that can be used as a precursor to joining two objectMode streams.

Combines two objectMode streams that are each **ALREADY ORDERED** by a sequence key and emits a new stream which is doublets of records for the two joined streams.

You can then use other `Transform` streams to perform typical Set join operations. Or you can use some that have already been created for you that wrap this library: [stream-joins](http://npm.im/stream-joins)

```javascript
var align = require("sosj")
var spy = require("through2-spy")
var spigot = require("stream-spigot")

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

align("v", left, right).pipe(spy({objectMode: true}, console.log))

/*
[ { v: 0, foo: 100 }, { v: 0, bar: 100 } ]
[ { v: 1, foo: 200 }, null ]
[ { v: 2, foo: 300 }, { v: 2, bar: 200 } ]
[ { v: 3, foo: 400 }, null ]
[ { v: 4, foo: 500 }, { v: 4, bar: 300 } ]
[ null, { v: 8, bar: 400 } ]
 */

```

API
===

`require("sosj")(sequenceKey, leftStream, rightStream)`
---

Align the two streams by sequenceKey into doublets of `[left, right]`, `[left, null]`, or `[null, right]` depending on if the records have matching sequenceKey values.

LICENSE
=======

MIT
