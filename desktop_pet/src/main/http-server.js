const http = require('http');

const DEFAULT_PORT = 49152;

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function startHttpServer({ broker, port = DEFAULT_PORT } = {}) {
  if (!broker) {
    throw new Error('startHttpServer requires broker');
  }

  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      res.writeHead(404);
      res.end();
      return;
    }

    try {
      const data = await parseJsonBody(req);

      if (req.url === '/hook/permission-request') {
        const result = broker.enqueueRequest(data);
        writeJson(res, 200, { status: 'queued', result });
        return;
      }

      if (req.url === '/bubble/decision') {
        const result = broker.resolveByDecision(data);
        const statusCode = result.status === 'request_not_found' ? 404 : 200;
        writeJson(res, statusCode, result);
        return;
      }

      if (req.url === '/hook/permission-resolved') {
        const result = broker.resolveByClaudeUi(data);
        writeJson(res, 200, result);
        return;
      }

      res.writeHead(404);
      res.end();
    } catch (error) {
      writeJson(res, 400, { error: error.message });
    }
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`[HTTP Server] Port ${port} already in use, skipping...`);
      return;
    }

    console.error('[HTTP Server] Error:', error.message);
  });

  server.listen(port, () => {
    console.log(`[HTTP Server] Listening on http://localhost:${port}`);
  });

  return server;
}

module.exports = { startHttpServer };
