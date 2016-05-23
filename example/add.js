var level = require('level')
var db = level('/tmp/cal.db')
var calendar = require('../')

var cal = calendar(db)
var ev = {
  time: process.argv[2],
  title: process.argv[3]
}
cal.add(ev, function (err, id) {
  if (err) console.error(err)
  else console.log(id)
})

