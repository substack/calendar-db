var level = require('level')
var db = level('/tmp/cal.db')
var calendar = require('../')

var cal = calendar(db)
var time = process.argv[2]
var opts = {
  value: { title: process.argv[3] }
}
cal.add(time, opts, function (err, id) {
  if (err) console.error(err)
  else console.log(id)
})

