# calendar-db

store and query recurring and one-time events

# example

## add

``` js
var level = require('level')
var db = level('/tmp/cal.db')
var calendar = require('calendar-db')

var cal = calendar(db)
var time = process.argv[2]
var opts = {
  value: { title: process.argv[3] }
}
cal.add(time, opts, function (err, id) {
  if (err) console.error(err)
  else console.log(id)
})
```

```
$ date
Mon May 23 16:09:11 CEST 2016
$ node add.js 'every thursday' 'javascript study group'
4e9007c81c2c50ee373c9d69c94259ad
$ node add.js 'tuesday may 24th' 'open hack'
6538b3a92859e99267ad45b15ae6ab1d
```

## range

``` js
var level = require('level')
var db = level('/tmp/cal.db')

var minimist = require('minimist')
var argv = minimist(process.argv.slice(2))

var calendar = require('calendar-db')
var cal = calendar(db)

cal.query(argv, function (err, results) {
  if (err) return console.error(err)
  results.forEach(function (r) { console.log(r) })
})
```

```
$ node range.js --gt 2016-05-01 --lt 2016-06-01
{ key: '4e9007c81c2c50ee373c9d69c94259ad',
  time: Thu May 05 2016 00:00:00 GMT+0200 (CEST),
  value: { title: 'javascript study group' } }
{ key: '4e9007c81c2c50ee373c9d69c94259ad',
  time: Thu May 12 2016 00:00:00 GMT+0200 (CEST),
  value: { title: 'javascript study group' } }
{ key: '4e9007c81c2c50ee373c9d69c94259ad',
  time: Thu May 19 2016 00:00:00 GMT+0200 (CEST),
  value: { title: 'javascript study group' } }
{ key: '6538b3a92859e99267ad45b15ae6ab1d',
  time: Tue May 24 2016 00:00:00 GMT+0200 (CEST),
  value: { title: 'open hack' } }
{ key: '4e9007c81c2c50ee373c9d69c94259ad',
  time: Thu May 26 2016 00:00:00 GMT+0200 (CEST),
  value: { title: 'javascript study group' } }
```

# api

``` js
var calendar = require('calendar-db')
```

## var cal = calendar(db)

Create a new calendar instance `cal` from a [leveldb][1] instance `db`.

[1]: https://npmjs.com/package/level

## cal.add(time, opts, cb)

Add an event given by a free-form string `time` which is parsed by
[parse-messy-schedule][2]. Optionally:

* `opts.created` - parse relative to this time
* `opts.value` - a value to store alongside the time

`cb(err, id)` fires with the event `id`.

[2]: https://npmjs.com/package/parse-messy-schedule

## var stream = cal.query(opts, cb)

Return a readable stream of all events between `opts.gt` and `opts.lt`,
including all instances of recurring events.

If `cb` is given, `cb(err, results)` fires with an array of all the `results`.

## cal.get(id, cb)

Read a document by its `id`. `cb(err, doc)` fires with the `doc`:

* `doc.time` - time string
* `doc.value` - supplementary value
* `doc.created` - time string parsed relative to this time

## cal.remove(id, cb)

Remove a document by its `id`.

## cal.prepare(time, opts, cb)

Like add, but do not write to the database. Instead, `prepare()` returns an
object `res` that you can use to batch insert into the database yourself:

* `res.id` - id of the event
* `res.batch` - array of documents to batch insert into the database

Optionally specify:

* `opts.created` - parse relative to this time
* `opts.value` - a value to store alongside the time
* `opts.type` - `'put'` (default) or `'del'`

The batch data is more useful if you wish to insert additional documents
atomically along with the event data.

# install

```
npm install calendar-db
```

# license

BSD
