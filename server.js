const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { initWebSocket } = require('./src/lib/websocket');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  initWebSocket(server);

  const port = process.env.PORT || 3000;
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
    console.log(`> WebSocket ready on ws://localhost:${port}/api/socket`);
  });
});
