var collect = require('collect-stream')
var through = require('through2')
var readonly = require('read-only-stream')
var parse = require('parse-messy-schedule')
var randombytes = require('randombytes')
var defined = require('defined')
var defaults = require('levelup-defaults')
var strftime = require('strftime')

var ID = 'i!', ONETIME = 'o!'

module.exports = Cal

function Cal (db) {
  if (!(this instanceof Cal)) return new Cal(db)
  this.db = defaults(db, { valueEncoding: 'json' })
}

Cal.prototype.query = function (opts, cb) {
  var self = this
  var output = through.obj()
  var r0 = self.db.createReadStream({
    gt: ONETIME + defined(opts.gt, ''),
    lt: ONETIME + defined(opts.lt, '\uffff')
  })
  r0.pipe(through.obj(function (row, enc, next) {
    var id = row.key.split('!')[2]
    self.db.get(ID + id, function (err, doc) {
      next(err, {
        key: id,
        value: doc
      })
    })
  })).pipe(output)

  if (cb) collect(output, cb)
  return readonly(output)
}

Cal.prototype.prepare = function (ev, cb) {
  var p = parse(ev)
  var id = randombytes(16).toString('hex')
  var batch = []
  if (p.oneTime) {
    batch.push({
      type: 'put',
      key: ID + id,
      value: ev
    })
    batch.push({
      type: 'put',
      key: ONETIME + strftime('%F', p.range[0]) + '!' + id,
      value: 0
    })
  } else {
    // ...
  }
  return { id: id, batch: batch }
}

Cal.prototype.add = function (ev, cb) {
  var prep = this.prepare(ev)
  this.db.batch(prep.batch, function (err) {
    if (err) cb(err)
    else cb(null, prep.id)
  })
}

Cal.prototype.remove = function () {
}
