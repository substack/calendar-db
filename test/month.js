var test = require('tape')
var memdb = require('memdb')
var strftime = require('strftime')
var calendar = require('../')

test('month', function (t) {
  t.plan(6)
  var cal = calendar(memdb())
  var docs = [
    {
      time: 'every thursday',
      opts: {
        created: '2016-05-21',
        value: { title: 'javascript study group' }
      }
    },
    {
      time: 'sunday may 22',
      opts: {
        created: '2016-05-21',
        value: { title: 'open hack' }
      }
    }
  ]
  var ids = {}
  ;(function next (index) {
    if (docs.length === 0) return ready()
    var doc = docs.shift()
    cal.add(doc.time, doc.opts, function (err, id) {
      t.error(err)
      t.ok(/^[0-9A-Fa-f]+$/.test(id), 'hex id')
      ids[index] = id
      next(index + 1)
    })
  })(0)

  function ready () {
    var expected = [
      {
        key: ids[0],
        time: '2016-05-05',
        value: { title: 'javascript study group' }
      },
      {
        key: ids[0],
        time: '2016-05-12',
        value: { title: 'javascript study group' }
      },
      {
        key: ids[0],
        time: '2016-05-19',
        value: { title: 'javascript study group' }
      },
      {
        key: ids[1],
        time: '2016-05-21',
        value: { title: 'open hack' }
      },
      {
        key: ids[0],
        time: '2016-05-26',
        value: { title: 'javascript study group' }
      }
    ]
    var monthq = { gt: '2016-05-01', lt: '2016-06-01' }
    cal.query(monthq, function (err, results) {
      t.error(err)
      t.deepEqual(results.map(format), expected.map(format))
    })
  }
  function format (row) {
    return {
      key: row.key,
      time: typeof row.time === 'string' ? row.time : strftime('%F', row.time),
      value: row.value
    }
  }
})
