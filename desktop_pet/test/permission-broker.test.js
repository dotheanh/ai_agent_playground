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

test('idempotent resolve: second resolve returns not_pending resolved', () => {
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
  assert.equal(second.status, 'not_pending');
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

  assert.equal(result.status, 'not_pending');
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
