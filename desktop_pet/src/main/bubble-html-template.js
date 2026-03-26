/**
 * Bubble window HTML template
 * Kept separate from bubble-window.js to stay under 200 LOC each.
 */
function getBubbleHTML() {
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: transparent;
      overflow: hidden;
      font-family: 'Segoe UI', sans-serif;
    }
    #bubble {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      background: #0d0d0d;
      border: 2px solid #cc0000;
      border-radius: 12px;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      max-width: 300px;
      min-width: 180px;
      box-shadow: 0 4px 20px rgba(200,0,0,0.5);
      animation: bubbleIn 0.25s ease-out;
      cursor: default;
    }
    @keyframes bubbleIn {
      from { opacity: 0; transform: translateX(-50%) translateY(10px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    .icon    { font-size: 16px; flex-shrink: 0; }
    .content { flex: 1; }
    .type {
      font-size: 9px;
      text-transform: uppercase;
      color: #cc0000;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .message {
      font-size: 11px;
      color: #e0e0e0;
      line-height: 1.3;
    }
  </style>
</head>
<body>
  <div id="bubble">
    <div class="icon" id="icon">ℹ️</div>
    <div class="content">
      <div class="type" id="type">Notification</div>
      <div class="message" id="msg"></div>
    </div>
  </div>
  <script>
    const ICONS = {
      permission_request: '🔐',
      ask_question:      '❓',
      session_start:     '🚀',
      session_end:       '👋',
      notification:      'ℹ️'
    };
    const TYPE_NAMES = {
      permission_request: 'Permission Required',
      ask_question:       'Question',
      session_start:      'Session Started',
      session_end:        'Session Ended',
      notification:       'Notification'
    };

    function showBubble(data) {
      document.getElementById('icon').textContent = ICONS[data.type] || 'ℹ️';
      document.getElementById('type').textContent  = TYPE_NAMES[data.type] || (data.type || 'Notification');

      var msg = data.message || '';
      if (msg.length > 120) msg = msg.substring(0, 120) + '...';
      document.getElementById('msg').textContent = msg;

      var el = document.getElementById('bubble');
      el.style.animation = 'none';
      el.offsetHeight;
      el.style.animation = 'bubbleIn 0.25s ease-out';
    }
  </script>
</body>
</html>`;
}

module.exports = { getBubbleHTML };
