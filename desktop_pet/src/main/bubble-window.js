const { BrowserWindow } = require('electron');
const path = require('path');

let bubbleWindow = null;
let mainWindow = null;
let hideTimer = null;
let isBubbleReady = false;
let pendingBubbleData = null; // Queue latest payload until bubble HTML is ready.

const BUBBLE_WIDTH = 360;
const BUBBLE_HEIGHT = 120;

// Auto-hide timeouts (ms) for passive event types.
// permission_request & ask_question: NO auto-hide (require user action via Focus button).
const AUTO_HIDE = {
  session_start: 8000,
  session_end: 5000,
  notification: 6000,
  task_completed: 4000,
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
    focusable: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, '../preload/bubble-preload.js'),
    },
  });

  bubbleWindow.setIgnoreMouseEvents(true, { forward: true }); // Click-through by default
  isBubbleReady = false;
  pendingBubbleData = null;
  bubbleWindow.loadURL('file://' + path.join(__dirname, '../../public/bubble.html'));

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
  console.log('[Bubble] === showBubble ===');
  console.log('[Bubble] Data:', JSON.stringify(data, null, 2));
  console.log('[Bubble] Type:', data.type);
  console.log('[Bubble] Message:', data.message);

  if (!mainWindow || mainWindow.isDestroyed()) {
    console.log('[Bubble] Main window not available');
    return;
  }

  // Clear any existing hide timer
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  if (!bubbleWindow || bubbleWindow.isDestroyed()) {
    console.log('[Bubble] Creating new bubble window');
    createBubbleWindow();
  }

  const pos = getBubblePosition();
  bubbleWindow.setPosition(pos.x, pos.y);
  bubbleWindow.setIgnoreMouseEvents(false); // Allow button clicks
  bubbleWindow.show();
  bubbleWindow.moveTop(); // Ensure bubble is above main window

  if (isBubbleReady) {
    console.log('[Bubble] Sending to bubble window');
    bubbleWindow.webContents
      .executeJavaScript(`showBubble(${JSON.stringify(data)})`)
      .catch((err) => console.error('[Bubble] showBubble failed:', err.message));
  } else {
    console.log('[Bubble] Queuing pending data');
    pendingBubbleData = data;
  }

  // Auto-hide for passive types only. Interactive types (permission_request, ask_question)
  // stay until user clicks Focus button.
  const autoHideMs = AUTO_HIDE[data.type];
  console.log('[Bubble] Auto-hide for type:', data.type, '-', autoHideMs, 'ms');

  if (!AUTO_HIDE.hasOwnProperty(data.type)) {
    // permission_request and ask_question have no auto-hide
    console.log('[Bubble] NO auto-hide (interactive type)');
    return;
  }

  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    console.log('[Bubble] Auto-hiding bubble');
    hideBubble();
  }, AUTO_HIDE[data.type]);
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

module.exports = { initBubbleManager, showBubble, hideBubble, syncBubblePosition, destroyBubbleWindow };
