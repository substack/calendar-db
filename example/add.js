var level = require('level')
var db = level('/tmp/cal.db')
var calendar = require('../')

var cal = calendar(db)
var ev = process.argv.slice(2).join(' ')
cal.add(ev, function (err, id) {
  if (err) console.error(err)
  else console.log(id)
})

