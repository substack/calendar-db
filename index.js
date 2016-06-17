var collect = require('collect-stream')
var through = require('through2')
var Readable = require('readable-stream').Readable
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
  var output = new Readable({ objectMode: true })
  var reading = false
  output._read = function () {
    reading = true
    if (pending === 0) next()
  }
  var cursors = []

  var lt = opts.lt, gt = opts.gt
  if (lt !== undefined && tostr(lt) !== '[object Date]') lt = newDate(lt)
  if (gt !== undefined && tostr(gt) !== '[object Date]') gt = newDate(gt)
  var gtstr = gt && strftime('%F', gt)
  var ltstr = lt && strftime('%F', lt)

  var r0 = self.db.createReadStream({
    gt: ONETIME + defined(gtstr, ''),
    lt: ONETIME + defined(ltstr, '\uffff')
  })
  r0.on('error', output.emit.bind(output, 'error'))
  r0.pipe(through.obj(write, done))

  var r1 = self.db.createReadStream({
    gt: END + defined(gtstr, ''),
    lt: END + '\uffff'
  })
  r1.on('error', output.emit.bind(output, 'error'))
  r1.pipe(through.obj(write, done))

  if (cb) collect(output, cb)
  return output

  function write (row, enc, next) {
    var tr = this
    var id = row.key.split('!')[2]
    self.db.get(ID + id, function (err, doc) {
      if (err) return next(err)
      var p = parse(doc.time, { created: doc.created })
      var b = strftime('%F', p.range[0])
      if (!lt || b < ltstr) {
        cursors.push({
          id: id,
          value: doc.value,
          current: p.oneTime ? p.range[0] : p.next(gt),
          iterator: p
        })
      }
      next()
    })
  }
  function done () {
    if (--pending !== 0) return
    if (reading) next()
  }
  function next () {
    if (cursors.length === 0) return output.push(null)
    var min = cursors[0].current, mini = 0
    for (var i = 1; i < cursors.length; i++) {
      if (cursors[i].current < min) {
        min = cursors[i].current
        mini = i
      }
    }
    var c = cursors[mini]
    var t = c.current
    c.current = c.iterator.next(c.current)
    if (!c.current || c.current >= lt) {
      cursors.splice(mini, 1)
    }
    output.push({
      key: c.id,
      time: t,
      value: c.value
    })
  }
}

Cal.prototype.prepare = function (time, opts) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  if (!opts) opts = {}
  var doc = {
    time: time,
    value: opts.value || {},
    created: opts.created || Date.now()
  }
  var p = parse(time, { created: doc.created })
  var type = defined(opts.type, 'put')

  var id = defined(opts.id, randombytes(16).toString('hex'))
  var batch = []
  if (p.oneTime) {
    batch.push({ type: type, key: ID + id, value: doc })
    batch.push({
      type: type,
      key: ONETIME + strftime('%F', p.range[0]) + '!' + id,
      value: 0
    })
  } else {
    batch.push({ type: type, key: ID + id, value: doc })
    batch.push({
      type: type,
      key: BEGIN + strftime('%F', p.range[0]) + '!' + id,
      value: 0
    })
    batch.push({
      type: type,
      key: END + strftime('%F', p.range[1]) + '!' + id,
      value: 0
    })
  }
  return { id: id, batch: batch }
}

Cal.prototype.add = function (time, opts, cb) {
  if (!cb) cb = noop
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  if (!opts) opts = {}
  var prep = this.prepare(time, opts)
  this.db.batch(prep.batch, function (err) {
    if (err) cb(err)
    else cb(null, prep.id)
  })
}

Cal.prototype.get = function (id, cb) {
  this.db.get(ID + id, cb)
}

Cal.prototype.remove = function (id, cb) {
  var self = this
  self.db.get(ID + id, function (err, doc) {
    if (err) return cb(err)
    var prep = self.prepare(doc.time, {
      id: id,
      type: 'del',
      created: doc.created
    })
    self.db.batch(prep.batch, cb)
  })
}

function noop () {}
function tostr (x) { return Object.prototype.toString.call(x) }

function newDate (str) {
  if (/\b\d+:\d+(:\d+)?\b/.test(str)) return new Date(str)
  else return new Date(str + ' 00:00:00')
}
