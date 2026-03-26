const { BrowserWindow, screen } = require('electron');

let bubbleWindow = null;
let mainWindow = null;

/**
 * Create a small transparent window for bubble notifications
 * Positioned above the main pet window
 */
function createBubbleWindow() {
  bubbleWindow = new BrowserWindow({
    width: 320,
    height: 80,
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
  bubbleWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(getBubbleHTML()));

  bubbleWindow.on('closed', () => {
    bubbleWindow = null;
  });

  return bubbleWindow;
}

/**
 * Show bubble at position above main window
 */
function showBubble(data) {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  if (!bubbleWindow || bubbleWindow.isDestroyed()) {
    createBubbleWindow();
  }

  // Position bubble above main window
  const mainBounds = mainWindow.getBounds();
  const bubbleWidth = 320;
  const bubbleHeight = 80;

  // Center bubble above main window
  const bubbleX = mainBounds.x + (mainBounds.width / 2) - (bubbleWidth / 2);
  const bubbleY = mainBounds.y - bubbleHeight - 10; // 10px gap

  bubbleWindow.setPosition(Math.round(bubbleX), Math.round(bubbleY));
  bubbleWindow.show();
  bubbleWindow.webContents.executeJavaScript(`showBubble(${JSON.stringify(data)})`);
}

/**
 * Hide bubble window
 */
function hideBubble() {
  if (bubbleWindow && !bubbleWindow.isDestroyed()) {
    bubbleWindow.hide();
  }
}

/**
 * Sync bubble position when main window moves
 */
function syncBubblePosition() {
  if (!bubbleWindow || !mainWindow || bubbleWindow.isDestroyed()) return;

  const mainBounds = mainWindow.getBounds();
  const bubbleWidth = 320;
  const bubbleHeight = 80;

  const bubbleX = mainBounds.x + (mainBounds.width / 2) - (bubbleWidth / 2);
  const bubbleY = mainBounds.y - bubbleHeight - 10;

  bubbleWindow.setPosition(Math.round(bubbleX), Math.round(bubbleY));
}

/**
 * Initialize bubble manager
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
      document.getElementById('type').textContent = TYPES[data.type] || data.type;
      let msg = data.message || '';
      if (msg.length > 80) msg = msg.substring(0, 80) + '...';
      document.getElementById('msg').textContent = msg;
      el.style.animation = 'none';
      el.offsetHeight;
      el.style.animation = 'bubbleIn 0.25s ease-out';
    }
  </script>
</body>
</html>`;
}

module.exports = { initBubbleManager, showBubble, hideBubble, syncBubblePosition, destroyBubbleWindow };
