const http = require('http');
const { showBubble } = require('./bubble-window');

const PORT = 49152;

/**
 * Start HTTP server to receive Claude Code hook events
 */
function startHttpServer() {
  const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === 'POST') {
      let body = '';

      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          console.log('[HTTP Server] Received hook payload:', JSON.stringify({
            type: data.type,
            message: data.message,
            optionsCount: Array.isArray(data.options) ? data.options.length : 0,
            metadata: data.metadata || null,
          }));

          // Show bubble notification
          showBubble(data);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok' }));
        } catch (err) {
          console.error('[HTTP Server] Parse error:', err.message);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[HTTP Server] Port ${PORT} already in use, skipping...`);
    } else {
      console.error('[HTTP Server] Error:', err.message);
    }
  });

  server.listen(PORT, () => {
    console.log(`[HTTP Server] Listening on http://localhost:${PORT}`);
  });

  return server;
}

module.exports = { startHttpServer };
