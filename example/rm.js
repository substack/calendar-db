var level = require('level')
var db = level('/tmp/cal.db')
var calendar = require('../')

var cal = calendar(db)
var id = process.argv[2]
cal.rm(id, function (err) {
  if (err) console.error(err)
  else console.log('ok')
})
