var collect = require('collect-stream')
var through = require('through2')
var readonly = require('read-only-stream')
var parse = require('parse-messy-schedule')
var randombytes = require('randombytes')
var defined = require('defined')
var defaults = require('levelup-defaults')
var strftime = require('strftime')

var ID = 'i!', ONETIME = 'o!', BEGIN = 'b!', END = 'e!'

module.exports = Cal

function Cal (db) {
  if (!(this instanceof Cal)) return new Cal(db)
  this.db = defaults(db, { valueEncoding: 'json' })
}

Cal.prototype.query = function (opts, cb) {
  var self = this
  var pending = 2
  var output = through.obj()

  var lt = opts.lt, gt = opts.gt
  if (lt !== undefined && tostr(lt) !== '[object Date]') lt = new Date(lt)
  if (gt !== undefined && tostr(gt) !== '[object Date]') gt = new Date(gt)

  var r0 = self.db.createReadStream({
    gt: ONETIME + defined(opts.gt, ''),
    lt: ONETIME + defined(opts.lt, '\uffff')
  })
  r0.on('error', output.emit.bind(output, 'error'))
  r0.pipe(through.obj(writeOne, done))
    .pipe(output, { end: false })

  var r1 = self.db.createReadStream({
    gt: END + defined(opts.gt, ''),
    lt: END + '\uffff'
  })
  r1.on('error', output.emit.bind(output, 'error'))
  r1.pipe(through.obj(writeEnd, done))
    .pipe(output, { end: false })

  // TODO: filter in both directions in parallel until one finishes

  if (cb) collect(output, cb)
  return readonly(output)

  function writeEnd (row, enc, next) {
    var tr = this
    var id = row.key.split('!')[2]
    self.db.get(ID + id, function (err, doc) {
      if (err) return next(err)
      var p = parse(doc.time)
      var b = strftime('%F', p.range[0])
      if (opts.lt === undefined || b < opts.lt) {
        var x = gt
        do {
          x = p.next(x)
          if (x < lt) {
            tr.push({
              key: id,
              time: x,
              value: doc.value
            })
          }
        } while (x < lt)
        next()
      } else next()
    })
  }
  function writeOne (row, enc, next) {
    var id = row.key.split('!')[2]
    self.db.get(ID + id, function (err, doc) {
      if (err) tr.emit('error', err)
      var p = parse(doc.time)
      next(err, {
        key: id,
        time: p.range[0],
        value: doc.value
      })
    })
  }
  function done () { if (--pending === 0) output.end() }
}

Cal.prototype.prepare = function (time, value, cb) {
  if (typeof value === 'function') {
    cb = value
    value = {}
  }
  if (!value) value = {}
  var p = parse(time)
  var doc = { time: time, value: value }

  var id = randombytes(16).toString('hex')
  var batch = []
  if (p.oneTime) {
    batch.push({ type: 'put', key: ID + id, value: doc })
    batch.push({
      type: 'put',
      key: ONETIME + strftime('%F', p.range[0]) + '!' + id,
      value: 0
    })
  } else {
    batch.push({ type: 'put', key: ID + id, value: doc })
    batch.push({
      type: 'put',
      key: BEGIN + strftime('%F', p.range[0]) + '!' + id,
      value: 0
    })
    batch.push({
      type: 'put',
      key: END + strftime('%F', p.range[1]) + '!' + id,
      value: 0
    })
  }
  return { id: id, batch: batch }
}

Cal.prototype.add = function (time, value, cb) {
  if (!cb) cb = noop
  if (typeof value === 'function') {
    cb = value
    value = {}
  }
  if (!value) value = {}
  var prep = this.prepare(time, value)
  this.db.batch(prep.batch, function (err) {
    if (err) cb(err)
    else cb(null, prep.id)
  })
}

Cal.prototype.get = function (id, cb) {
  this.db.get(ID + id, cb)
}

Cal.prototype.remove = function (id, cb) {
  this.db.del(ID + id, cb)
}

function noop () {}
function tostr (x) { return Object.prototype.toString.call(x) }
