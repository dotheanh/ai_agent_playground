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
  let activeRequestId = null;

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
    queue.push(request.requestId);
    activateNext();

    return request;
  }

  function resolveByDecision({ requestId, decision, source }) {
    const request = requests.get(requestId);

    if (!request) {
      return { status: 'request_not_found' };
    }

    if (request.status === 'resolved') {
      return { status: 'already_resolved' };
    }

    request.status = 'resolved';
    request.decision = decision;
    request.source = source;

    if (activeRequestId === requestId) {
      onHide({ requestId });
      activeRequestId = null;
      activateNext();
    }

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

    for (const requestId of queue) {
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
