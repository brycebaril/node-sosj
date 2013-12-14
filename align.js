module.exports = align

var Transform = require("stream").Transform
  || require("readable-stream/transform")
var inherits = require("util").inherits
var map = require("through2-map")

/**
 * align takes two objectMode streams and a sequence key and will create a stream
 * aligning records from each stream resulting in a stream that emits record doublets
 * when the sequence key exactly matches. IMPORTANT: This only works on ordered streams!
 * @param  {String} key The sequence key the two streams are storted by and will be joined by.
 * @param  {Stream} leftStream  An objectMode stream ordered by `key`
 * @param  {Stream} rightStream An objectMode stream ordered by `key`
 * @return {Stream}             A doublet stream containing [leftRecord, rightRecord], [leftRecord, null], or [null, rightRecord]
 */
function align(key, leftStream, rightStream, epsilon) {
  var aligner = new Aligner(key, {}, epsilon)

  var l = left()
  var r = right()

  var ended = 0
  l.on("end", function () {
    l.unpipe(aligner)
    if (++ended == 2) aligner.end()
  })
  r.on("end", function () {
    r.unpipe(aligner)
    if (++ended == 2) aligner.end()
  })

  leftStream.pipe(l).pipe(aligner, {end: false})
  rightStream.pipe(r).pipe(aligner, {end: false})

  return aligner
}

function left(stream) {
  return map({objectMode: true}, function (record) {
    return [record, null]
  })
}

function right(stream) {
  return map({objectMode: true}, function (record) {
    return [null, record]
  })
}

function Aligner(key, options, epsilon) {
  if (!(this instanceof Aligner)) return new Aligner(key, options)
  if (!key) throw new Error("Aligner requires a sequence key")
  this.key = key
  this.epsilon = epsilon
  // This MUST be an objectMode stream.
  options = options || {}
  options.objectMode = true
  Transform.call(this, options)
  this.queue = [[], []]
}
inherits(Aligner, Transform)

Aligner.prototype._transform = function (record, encoding, callback) {
  var i = (record[0] != null) ? 0 : 1
  var o = +(!i)

  var key = this.key
  var me = record[i]
  var other, otherRecord
  var myQueue = this.queue[i]
  var otherQueue = this.queue[o]

  if (myQueue.length > 0 || otherQueue.length == 0) {
    // My queue is not empty, or the other queue is empty.
    myQueue.push(record)
    return callback()
  }

  while (otherRecord = otherQueue.shift()) {
    other = otherRecord[o]
    if (me[key] == other[key] || compareDelta(me[key], other[key], this.epsilon)) {
      // These keys are joined, w00t
      record[o] = other
      this.push(record)
      return callback()
    }
    else if (me[key] < other[key]) {
      // This record pre-dates all seen records on the other's queue
      otherQueue.unshift(otherRecord)
      this.push(record)
      return callback()
    }
    else {
      // This comes after the earliest leftStream record.
      // Emit that record and continue to the next leftStream record.
      this.push(otherRecord)
    }
  }
  myQueue.push(record)
  return callback()
}

Aligner.prototype._flush = function (callback) {
  // At this point only one queue should have any items in it.
  if (this.queue[0].length && this.queue[1].length)
    return callback(new Error("Incomplete align!"))
  var self = this
  this.queue.map(function (q) {
    q.map(function (r) { self.push(r) })
  })

  return callback()
}
function compareDelta(val1, val2, epsilon){
    console.log("comparing", val1, val2, epsilon)
    if(!epsilon) return false;
    var compareDouble = function(e,a,d) {
        return Math.abs(e - a) <= d;
    }
    if (val1 === val2) {
        return true;
    }

    if (typeof val1 == "number" ||
        typeof val2 == "number" ||
        !val1 || !val2) {
        return compareDouble(val1, val2, epsilon);
    }
}