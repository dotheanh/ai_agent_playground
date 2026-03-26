const { BrowserWindow } = require('electron');
const { getBubbleHTML } = require('./bubble-html-template');

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

  bubbleWindow.setIgnoreMouseEvents(true, { forward: true }); // Click-through by default
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

module.exports = { initBubbleManager, showBubble, hideBubble, syncBubblePosition, destroyBubbleWindow };
