const { BrowserWindow } = require('electron');

let bubbleWindow = null;
let mainWindow = null;
let hideTimer = null;
let isBubbleReady = false;
let pendingBubbleData = null; // Queue latest payload until bubble HTML is ready.

const BUBBLE_WIDTH = 360;
const BUBBLE_HEIGHT = 120;

// Auto-hide timeouts (ms) for each event type
const AUTO_HIDE = {
  session_start: 5000,
  session_end: 3000,
  notification: 5000,
  // Interactive types (permission_request, ask_question) don't auto-hide
};

/**
 * Calculate bubble position (shared logic)
 */
function getBubblePosition() {
  if (!mainWindow) return { x: 0, y: 0 };

  const mainBounds = mainWindow.getBounds();
  const x = mainBounds.x + (mainBounds.width / 2) - (BUBBLE_WIDTH / 2);
  // Bubble positioned to overlap middle of main window
  const y = mainBounds.y + (mainBounds.height / 2) - (BUBBLE_HEIGHT / 2) - 100;

  return { x: Math.round(x), y: Math.round(y) };
}

/**
 * Create bubble window
 */
function createBubbleWindow() {
  bubbleWindow = new BrowserWindow({
    width: BUBBLE_WIDTH,
    height: BUBBLE_HEIGHT,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  bubbleWindow.setIgnoreMouseEvents(true); // Click-through
  isBubbleReady = false;
  pendingBubbleData = null;
  bubbleWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(getBubbleHTML()));

  bubbleWindow.webContents.once('did-finish-load', () => {
    isBubbleReady = true;

    if (pendingBubbleData) {
      const queued = pendingBubbleData;
      pendingBubbleData = null;
      bubbleWindow.webContents
        .executeJavaScript(`showBubble(${JSON.stringify(queued)})`)
        .catch((err) => console.error('[Bubble] queued showBubble failed:', err.message));
    }
  });

  bubbleWindow.on('closed', () => {
    bubbleWindow = null;
    isBubbleReady = false;
    pendingBubbleData = null;
  });

  return bubbleWindow;
}

/**
 * Show bubble at calculated position
 */
function showBubble(data) {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  // Clear any existing hide timer
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  if (!bubbleWindow || bubbleWindow.isDestroyed()) {
    createBubbleWindow();
  }

  const pos = getBubblePosition();
  bubbleWindow.setPosition(pos.x, pos.y);
  bubbleWindow.show();
  bubbleWindow.moveTop(); // Ensure bubble is above main window

  if (isBubbleReady) {
    bubbleWindow.webContents
      .executeJavaScript(`showBubble(${JSON.stringify(data)})`)
      .catch((err) => console.error('[Bubble] showBubble failed:', err.message));
  } else {
    pendingBubbleData = data;
  }

  // Auto-hide for non-interactive types
  const timeout = AUTO_HIDE[data.type];
  if (timeout) {
    hideTimer = setTimeout(() => {
      hideBubble();
    }, timeout);
  }
}

/**
 * Hide bubble
 */
function hideBubble() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  if (bubbleWindow && !bubbleWindow.isDestroyed()) {
    bubbleWindow.hide();
  }
}

/**
 * Sync bubble position when main window moves
 */
function syncBubblePosition() {
  if (!bubbleWindow || !mainWindow || bubbleWindow.isDestroyed()) return;

  const pos = getBubblePosition();
  bubbleWindow.setPosition(pos.x, pos.y);
}

/**
 * Init bubble manager
 */
function initBubbleManager(mainWin) {
  mainWindow = mainWin;
  createBubbleWindow();
}

/**
 * Clean up
 */
function destroyBubbleWindow() {
  if (bubbleWindow && !bubbleWindow.isDestroyed()) {
    bubbleWindow.destroy();
    bubbleWindow = null;
  }
}

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
    }
    @keyframes bubbleIn {
      from { opacity: 0; transform: translateX(-50%) translateY(10px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    .icon { font-size: 16px; flex-shrink: 0; }
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
    .options {
      margin-top: 4px;
      font-size: 10px;
      color: #ff9b9b;
      line-height: 1.3;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div id="bubble">
    <div class="icon" id="icon">ℹ️</div>
    <div class="content">
      <div class="type" id="type">Notification</div>
      <div class="message" id="msg"></div>
      <div class="options" id="opts"></div>
    </div>
  </div>
  <script>
    const ICONS = {
      permission_request: '🔐',
      ask_question: '❓',
      session_start: '🚀',
      session_end: '👋',
      notification: 'ℹ️'
    };
    const TYPES = {
      permission_request: 'Permission Required',
      ask_question: 'Question',
      session_start: 'Session Started',
      session_end: 'Session Ended',
      notification: 'Notification'
    };
    function showBubble(data) {
      const el = document.getElementById('bubble');
      document.getElementById('icon').textContent = ICONS[data.type] || 'ℹ️';
      document.getElementById('type').textContent = TYPES[data.type] || (data.type || 'Notification');

      let msg = data.message || '';
      if (msg.length > 120) msg = msg.substring(0, 120) + '...';
      document.getElementById('msg').textContent = msg;

      const optsEl = document.getElementById('opts');
      const options = Array.isArray(data.options) ? data.options : [];
      if (options.length > 0) {
        const text = options.slice(0, 3).map((o, i) => (i + 1) + '. ' + o).join('\\n');
        optsEl.textContent = text;
        optsEl.style.display = 'block';
      } else {
        optsEl.textContent = '';
        optsEl.style.display = 'none';
      }

      el.style.animation = 'none';
      el.offsetHeight;
      el.style.animation = 'bubbleIn 0.25s ease-out';
    }
  </script>
</body>
</html>`;
}

module.exports = { initBubbleManager, showBubble, hideBubble, syncBubblePosition, destroyBubbleWindow };
