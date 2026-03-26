const test = require('node:test');
const assert = require('node:assert/strict');

const { createPermissionBroker } = require('../src/main/permission-broker');

test('enqueue request, activate first request, map fallback options', () => {
  const events = [];
  const broker = createPermissionBroker({
    onShow: (payload) => events.push({ type: 'show', payload }),
    onHide: (payload) => events.push({ type: 'hide', payload }),
    now: () => 1000,
    timeoutMs: 60000,
  });

  const request = broker.enqueueRequest({
    requestId: 'req-1',
    message: 'Run: echo ok',
    toolName: 'Bash',
    options: [],
  });

  assert.equal(request.status, 'pending');
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'show');
  assert.deepEqual(events[0].payload.options, ['Yes', 'Yes, allow for all projects', 'No']);
});

test('resolve active request and activate next in FIFO', () => {
  const events = [];
  const broker = createPermissionBroker({
    onShow: (payload) => events.push({ type: 'show', payload }),
    onHide: (payload) => events.push({ type: 'hide', payload }),
    now: () => 1000,
    timeoutMs: 60000,
  });

  broker.enqueueRequest({ requestId: 'req-1', message: 'A', toolName: 'Edit', options: ['Yes', 'No'] });
  broker.enqueueRequest({ requestId: 'req-2', message: 'B', toolName: 'Bash', options: ['Yes', 'No'] });

  const result = broker.resolveByDecision({ requestId: 'req-1', decision: 'approve_once', source: 'bubble_click' });

  assert.equal(result.status, 'resolved');
  assert.equal(events.filter((event) => event.type === 'show').length, 2);
  assert.equal(events[events.length - 1].payload.requestId, 'req-2');
});

test('idempotent resolve: second resolve returns already_resolved', () => {
  const broker = createPermissionBroker({
    onShow: () => {},
    onHide: () => {},
    now: () => 1000,
    timeoutMs: 60000,
  });

  broker.enqueueRequest({ requestId: 'req-1', message: 'A', toolName: 'Bash', options: ['Yes', 'No'] });
  const first = broker.resolveByDecision({ requestId: 'req-1', decision: 'deny', source: 'bubble_click' });
  const second = broker.resolveByDecision({ requestId: 'req-1', decision: 'deny', source: 'bubble_click' });

  assert.equal(first.status, 'resolved');
  assert.equal(second.status, 'already_resolved');
  assert.equal(second.currentStatus, 'resolved');
});

test('expireOld hides active expired request and activates next', () => {
  const events = [];
  let nowValue = 1000;
  const broker = createPermissionBroker({
    onShow: (payload) => events.push({ type: 'show', payload }),
    onHide: (payload) => events.push({ type: 'hide', payload }),
    now: () => nowValue,
    timeoutMs: 100,
  });

  broker.enqueueRequest({ requestId: 'req-1', message: 'A', toolName: 'Bash', options: ['Yes', 'No'] });
  nowValue = 1020;
  broker.enqueueRequest({ requestId: 'req-2', message: 'B', toolName: 'Edit', options: ['Yes', 'No'] });

  nowValue = 1120;
  broker.expireOld();

  const req1HideIndex = events.findIndex((event) => event.type === 'hide' && event.payload.requestId === 'req-1');
  const req2ShowIndex = events.findIndex((event) => event.type === 'show' && event.payload.requestId === 'req-2');

  assert.notEqual(req1HideIndex, -1);
  assert.notEqual(req2ShowIndex, -1);
  assert.ok(req1HideIndex < req2ShowIndex);
});

test('cannot resolve expired request', () => {
  let nowValue = 1000;
  const broker = createPermissionBroker({
    onShow: () => {},
    onHide: () => {},
    now: () => nowValue,
    timeoutMs: 100,
  });

  broker.enqueueRequest({ requestId: 'req-1', message: 'A', toolName: 'Bash', options: ['Yes', 'No'] });
  nowValue = 1201;
  broker.expireOld();

  const result = broker.resolveByDecision({ requestId: 'req-1', decision: 'approve_once', source: 'bubble_click' });

  assert.equal(result.status, 'expired');
  assert.equal(result.currentStatus, 'expired');
});

test('mapDecisionFromOption maps allow-all, deny and default branches', () => {
  const broker = createPermissionBroker({
    onShow: () => {},
    onHide: () => {},
  });

  assert.equal(broker.mapDecisionFromOption('Yes, allow for all projects'), 'approve_always');
  assert.equal(broker.mapDecisionFromOption('No'), 'deny');
  assert.equal(broker.mapDecisionFromOption('Yes'), 'approve_once');
  assert.equal(broker.mapDecisionFromOption('unknown option'), 'approve_once');
});

test('duplicate enqueue same requestId does not duplicate queue activation', () => {
  const events = [];
  const broker = createPermissionBroker({
    onShow: (payload) => events.push({ type: 'show', payload }),
    onHide: () => {},
    now: () => 1000,
    timeoutMs: 60000,
  });

  broker.enqueueRequest({ requestId: 'req-1', message: 'A', toolName: 'Bash', options: ['Yes', 'No'] });
  broker.enqueueRequest({ requestId: 'req-1', message: 'A-updated', toolName: 'Bash', options: ['Yes', 'No'] });
  broker.enqueueRequest({ requestId: 'req-2', message: 'B', toolName: 'Edit', options: ['Yes', 'No'] });

  broker.resolveByDecision({ requestId: 'req-1', decision: 'approve_once', source: 'bubble_click' });

  const showReq2 = events.filter((event) => event.type === 'show' && event.payload.requestId === 'req-2');
  assert.equal(showReq2.length, 1);
});

// ─── HTTP route contract tests (Task 2) ───────────────────────────────────────

const http = require('node:http');
const { startHttpServer } = require('../src/main/http-server');

function httpPost(port, path, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = http.request(
      { hostname: 'localhost', port, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode, body: data }); }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

test('POST /hook/permission-request enqueues request and returns 200', (t, done) => {
  const calls = [];
  const mockBroker = {
    enqueueRequest: (payload) => { calls.push(['enqueue', payload]); return { status: 'pending' }; },
    resolveByDecision: () => ({ status: 'resolved' }),
    resolveByClaudeUi: () => ({ status: 'resolved' }),
  };

  const server = startHttpServer({ broker: mockBroker, port: 0 });
  const addr = server.address();

  httpPost(addr.port, '/hook/permission-request', { requestId: 'r1', message: 'Test', toolName: 'Bash', options: ['Yes'] })
    .then((res) => {
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'queued');
      assert.deepEqual(calls[0], ['enqueue', { requestId: 'r1', message: 'Test', toolName: 'Bash', options: ['Yes'] }]);
      server.close();
      done();
    })
    .catch(done);
});

test('POST /bubble/decision resolves request and returns 200', (t, done) => {
  const calls = [];
  const mockBroker = {
    enqueueRequest: () => {},
    resolveByDecision: (payload) => { calls.push(['decision', payload]); return { status: 'resolved' }; },
    resolveByClaudeUi: () => ({ status: 'resolved' }),
  };

  const server = startHttpServer({ broker: mockBroker, port: 0 });
  const addr = server.address();

  httpPost(addr.port, '/bubble/decision', { requestId: 'r1', decision: 'approve_once', source: 'bubble_click' })
    .then((res) => {
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'resolved');
      assert.deepEqual(calls[0], ['decision', { requestId: 'r1', decision: 'approve_once', source: 'bubble_click' }]);
      server.close();
      done();
    })
    .catch(done);
});

test('POST /bubble/decision returns 404 for unknown requestId', (t, done) => {
  const mockBroker = {
    enqueueRequest: () => {},
    resolveByDecision: () => ({ status: 'request_not_found' }),
    resolveByClaudeUi: () => ({ status: 'resolved' }),
  };

  const server = startHttpServer({ broker: mockBroker, port: 0 });
  const addr = server.address();

  httpPost(addr.port, '/bubble/decision', { requestId: 'unknown', decision: 'deny', source: 'bubble_click' })
    .then((res) => {
      assert.equal(res.status, 404);
      assert.equal(res.body.status, 'request_not_found');
      server.close();
      done();
    })
    .catch(done);
});

test('POST /hook/permission-resolved calls resolveByClaudeUi and returns 200', (t, done) => {
  const calls = [];
  const mockBroker = {
    enqueueRequest: () => {},
    resolveByDecision: () => ({ status: 'resolved' }),
    resolveByClaudeUi: (payload) => { calls.push(['claude_ui', payload]); return { status: 'resolved' }; },
  };

  const server = startHttpServer({ broker: mockBroker, port: 0 });
  const addr = server.address();

  httpPost(addr.port, '/hook/permission-resolved', { requestId: 'r1' })
    .then((res) => {
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'resolved');
      assert.deepEqual(calls[0], ['claude_ui', { requestId: 'r1' }]);
      server.close();
      done();
    })
    .catch(done);
});

test('unknown route returns 404', (t, done) => {
  const mockBroker = {
    enqueueRequest: () => {},
    resolveByDecision: () => ({ status: 'resolved' }),
    resolveByClaudeUi: () => ({ status: 'resolved' }),
  };

  const server = startHttpServer({ broker: mockBroker, port: 0 });
  const addr = server.address();

  httpPost(addr.port, '/hook/unknown', { requestId: 'r1' })
    .then((res) => {
      assert.equal(res.status, 404);
      server.close();
      done();
    })
    .catch(done);
});

test('malformed JSON returns 400', (t, done) => {
  const mockBroker = {
    enqueueRequest: () => {},
    resolveByDecision: () => ({ status: 'resolved' }),
    resolveByClaudeUi: () => ({ status: 'resolved' }),
  };

  const server = startHttpServer({ broker: mockBroker, port: 0 });
  const addr = server.address();

  const req = http.request(
    { hostname: 'localhost', port: addr.port, path: '/hook/permission-request', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        assert.equal(res.statusCode, 400);
        assert.ok(JSON.parse(data).error);
        server.close();
        done();
      });
    }
  );
  req.on('error', done);
  req.write('{ invalid json }');
  req.end();
});
