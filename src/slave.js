const level = require('level');
const wsock = require('websocket-stream');
const hyperlog = require('hyperlog');
const co = require('co');
const wait = require('co-wait');
const pify = require('pify');

const db = level('./db.db');
const log = hyperlog(db, { valueEncoding: 'json' });

co(function* () {
  while (true) {
    console.log('connecting');
    const r = log.replicate({ live: true });
    const stream = wsock('ws://localhost:3001');
    stream.on('error', console.log.bind(console, 'error'));
    r.pipe(stream).pipe(r);
    console.log('piping');
    yield pify(stream.once).call(stream, 'close');
    stream.destroy();
    r.destroy();
    console.log('closed');
    yield wait(1000);
  }
}).catch(console.error);