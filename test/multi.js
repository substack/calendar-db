var test = require('tape')
var memdb = require('memdb')
var strftime = require('strftime')
var calendar = require('../')

test('multi', function (t) {
  t.plan(8)
  var cal = calendar(memdb())
  var docs = [
    {
      time: 'every thursday at 7pm',
      opts: {
        created: '2015-12-25',
        value: { title: 'javascript study group' }
      }
    },
    {
      time: 'every tuesday at 7pm',
      opts: {
        created: '2015-12-25',
        value: { title: 'hardware hack night' }
      }
    },
    {
      time: 'every day at 12:00 starting jan 15 until feb 10',
      opts: {
        created: '2015-12-25',
        value: { title: 'cyberwizard institute' }
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
        key: ids[1],
        time: '2016-01-05',
        value: { title: 'hardware hack night' }
      },
      {
        key: ids[0],
        time: '2016-01-07',
        value: { title: 'javascript study group' }
      },
      {
        key: ids[1],
        time: '2016-01-12',
        value: { title: 'hardware hack night' }
      },
      {
        key: ids[0],
        time: '2016-01-14',
        value: { title: 'javascript study group' }
      },
      {
        key: ids[2],
        time: '2016-01-15',
        value: { title: 'cyberwizard institute' }
      },
      {
        key: ids[2],
        time: '2016-01-16',
        value: { title: 'cyberwizard institute' }
      },
      {
        key: ids[2],
        time: '2016-01-17',
        value: { title: 'cyberwizard institute' }
      },
      {
        key: ids[2],
        time: '2016-01-18',
        value: { title: 'cyberwizard institute' }
      },
      {
        key: ids[2],
        time: '2016-01-19',
        value: { title: 'cyberwizard institute' }
      },
      {
        key: ids[1],
        time: '2016-01-19',
        value: { title: 'hardware hack night' }
      },
      {
        key: ids[2],
        time: '2016-01-20',
        value: { title: 'cyberwizard institute' }
      },
      {
        key: ids[2],
        time: '2016-01-21',
        value: { title: 'cyberwizard institute' }
      },
      {
        key: ids[0],
        time: '2016-01-21',
        value: { title: 'javascript study group' }
      },
      {
        key: ids[2],
        time: '2016-01-22',
        value: { title: 'cyberwizard institute' }
      },
      {
        key: ids[2],
        time: '2016-01-23',
        value: { title: 'cyberwizard institute' }
      },
      {
        key: ids[2],
        time: '2016-01-24',
        value: { title: 'cyberwizard institute' }
      },
      {
        key: ids[2],
        time: '2016-01-25',
        value: { title: 'cyberwizard institute' }
      },
      {
        key: ids[2],
        time: '2016-01-26',
        value: { title: 'cyberwizard institute' }
      },
      {
        key: ids[1],
        time: '2016-01-26',
        value: { title: 'hardware hack night' }
      },
      {
        key: ids[2],
        time: '2016-01-27',
        value: { title: 'cyberwizard institute' }
      },
      {
        key: ids[2],
        time: '2016-01-28',
        value: { title: 'cyberwizard institute' }
      },
      {
        key: ids[0],
        time: '2016-01-28',
        value: { title: 'javascript study group' }
      },
      {
        key: ids[2],
        time: '2016-01-29',
        value: { title: 'cyberwizard institute' }
      },
      {
        key: ids[2],
        time: '2016-01-30',
        value: { title: 'cyberwizard institute' }
      },
      {
        key: ids[2],
        time: '2016-01-31',
        value: { title: 'cyberwizard institute' }
      }
    ]
    var monthq = { gt: '2016-01-01', lt: '2016-02-01' }
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
