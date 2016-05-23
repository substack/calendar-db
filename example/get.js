var level = require('level')
var db = level('/tmp/cal.db')
var calendar = require('../')

var cal = calendar(db)
var id = process.argv[2]
cal.get(id, function (err, doc) {
  if (err) console.error(err)
  else console.log(doc)
})

