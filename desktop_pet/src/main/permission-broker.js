function normalizeOptions(options) {
  if (Array.isArray(options) && options.length > 0) {
    return options.slice(0, 3);
  }

  return ['Yes', 'Yes, allow for all projects', 'No'];
}

function mapDecisionFromOption(optionText) {
  const normalized = String(optionText || '').toLowerCase();

  if (normalized.includes('allow for all')) {
    return 'approve_always';
  }

  if (normalized.includes('no') || normalized.includes('deny')) {
    return 'deny';
  }

  return 'approve_once';
}

function createPermissionBroker({ onShow, onHide, now = Date.now, timeoutMs = 60000 }) {
  const requests = new Map();
  const queue = [];
  const finalizedStatuses = new Map();
  let activeRequestId = null;

  function cleanupFinalizedStatuses() {
    const cutoff = now() - timeoutMs;

    for (const [requestId, finalized] of finalizedStatuses.entries()) {
      if (finalized.finalizedAt < cutoff) {
        finalizedStatuses.delete(requestId);
      }
    }
  }

  function removeFromQueue(requestId) {
    let index = queue.indexOf(requestId);

    while (index !== -1) {
      queue.splice(index, 1);
      index = queue.indexOf(requestId);
    }
  }

  function finalizeRequest(requestId, status) {
    requests.delete(requestId);
    removeFromQueue(requestId);
    finalizedStatuses.set(requestId, { status, finalizedAt: now() });
    cleanupFinalizedStatuses();
  }

  function activateNext() {
    if (activeRequestId) {
      return;
    }

    const nextId = queue.find((id) => requests.get(id)?.status === 'pending');
    if (!nextId) {
      return;
    }

    activeRequestId = nextId;
    const request = requests.get(nextId);

    onShow({
      requestId: request.requestId,
      message: request.message,
      toolName: request.toolName,
      options: request.options,
      type: 'permission_request',
    });
  }

  function enqueueRequest(input) {
    cleanupFinalizedStatuses();

    const existing = requests.get(input.requestId);

    if (existing && existing.status === 'pending') {
      existing.message = input.message;
      existing.toolName = input.toolName;
      existing.options = normalizeOptions(input.options);
      return existing;
    }

    const request = {
      requestId: input.requestId,
      message: input.message,
      toolName: input.toolName,
      options: normalizeOptions(input.options),
      status: 'pending',
      createdAt: now(),
    };

    requests.set(request.requestId, request);
    finalizedStatuses.delete(request.requestId);

    if (!queue.includes(request.requestId)) {
      queue.push(request.requestId);
    }

    activateNext();

    return request;
  }

  function resolveByDecision({ requestId, decision, source }) {
    const finalized = finalizedStatuses.get(requestId);
    if (finalized) {
      if (finalized.status === 'expired') {
        return { status: 'expired', requestId, currentStatus: finalized.status };
      }

      return { status: 'not_pending', requestId, currentStatus: finalized.status };
    }

    const request = requests.get(requestId);

    if (!request) {
      return { status: 'request_not_found' };
    }

    if (request.status !== 'pending') {
      if (request.status === 'expired') {
        return { status: 'expired', requestId, currentStatus: request.status };
      }

      return { status: 'not_pending', requestId, currentStatus: request.status };
    }

    request.status = 'resolved';
    request.decision = decision;
    request.source = source;

    if (activeRequestId === requestId) {
      onHide({ requestId });
      activeRequestId = null;
    }

    finalizeRequest(requestId, 'resolved');
    activateNext();

    return {
      status: 'resolved',
      requestId,
      decision,
    };
  }

  function resolveByClaudeUi({ requestId }) {
    return resolveByDecision({
      requestId,
      decision: 'resolved_in_claude_ui',
      source: 'claude_ui',
    });
  }

  function expireOld() {
    const cutoff = now() - timeoutMs;

    for (const requestId of [...queue]) {
      const request = requests.get(requestId);
      if (!request || request.status !== 'pending') {
        continue;
      }

      if (request.createdAt >= cutoff) {
        continue;
      }

      request.status = 'expired';

      if (activeRequestId === requestId) {
        onHide({ requestId });
        activeRequestId = null;
      }

      finalizeRequest(requestId, 'expired');
    }

    activateNext();
  }

  return {
    enqueueRequest,
    resolveByDecision,
    resolveByClaudeUi,
    mapDecisionFromOption,
    expireOld,
  };
}

module.exports = {
  createPermissionBroker,
  mapDecisionFromOption,
};
