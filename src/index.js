const hyperlog = require('hyperlog');
const Koa = require('koa');
const { get, post } = require('koa-route');
const bodyParser = require('koa-bodyparser');
const JSONStream = require('streaming-json-stringify');
const MemDB = require('memdb');

const db = MemDB();
const app = new Koa();
const log = hyperlog(db, { valueEncoding: 'json' });
app.use(bodyParser());

app.use(post('/', (ctx) => {
  const body = ctx.request.body;
  log.append(body);
  ctx.status = 204;
}));

app.use(get('/', (ctx) => {
  ctx.type = 'json';
  const stream = ctx.body = JSONStream();
  stream.on('error', ctx.onerror);
  log.createReadStream({ live:true }).on('data', (node) => stream.write(node.value));
}));

app.listen(3000);

const server = require('http').createServer();
server.listen(3001);

var wsock = require('websocket-stream');
wsock.createServer({ server, perMessageDeflate: false }, function (stream) {
  stream.pipe(log.replicate({ live: true })).pipe(stream);
});
