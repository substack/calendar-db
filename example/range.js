var level = require('level')
var db = level('/tmp/cal.db')

var minimist = require('minimist')
var argv = minimist(process.argv.slice(2))

var calendar = require('../')
var cal = calendar(db)

cal.query(argv, function (err, results) {
  if (err) return console.error(err)
  results.forEach(function (r) { console.log(r) })
})
