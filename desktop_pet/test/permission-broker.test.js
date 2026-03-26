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
});
