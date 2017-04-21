const hyperlog = require('hyperlog');
const MemDB = require('memdb');
const wsock = require('websocket-stream');
const co = require('co');
const wait = require('co-wait');
const pify = require('pify');

const db = MemDB();
const log = hyperlog(db, { valueEncoding: 'json' });

const chat = document.getElementById('x');
log.createReadStream({ live:true }).on('data', (node) => {
  console.log(node.value);
  chat.innerHTML += `${JSON.stringify(node.value)}\n`;
});

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

const el = document.getElementById('i');
el.addEventListener('keyup', (evt) => {
  if (evt.which === 13) {
    log.append({ content: el.value });
    el.value = '';
  }
});