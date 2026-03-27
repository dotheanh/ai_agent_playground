const { BrowserWindow } = require('electron');
const path = require('path');

let bubbleWindow = null;
let mainWindow = null;
let hideTimer = null;
let isBubbleReady = false;
let pendingBubbleData = null;
let currentBubbleType = null;

const BUBBLE_WIDTH = 360;
const BUBBLE_HEIGHT = 120;

// Single auto-hide timeout for all passive events
const AUTO_HIDE_TIMEOUT = 10000;

// Bubble types by priority (higher = more important)
// LOW priority: auto-hide, no sound, no focus button
// HIGH priority: no auto-hide, has sound, has focus button
const BUBBLE_PRIORITY = {
  // Low priority (auto-hide, passive notifications)
  LOW: ['session_start', 'session_end', 'notification', 'task_completed', 'user_prompt_submit', 'pre_tool_use', 'post_tool_use'],
  // High priority (no auto-hide, requires user action)
  HIGH: ['permission_request', 'ask_question'],
};

// Check if bubble type is low priority (auto-hide)
function isLowPriorityBubble(type) {
  return BUBBLE_PRIORITY.LOW.includes(type);
}

// Check if bubble type is high priority (no auto-hide)
function isHighPriorityBubble(type) {
  return BUBBLE_PRIORITY.HIGH.includes(type);
}

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
 * Show bubble at calculated position with priority handling
 * Rules:
 * - Low Priority currently showing + High Priority comes → Low Priority auto-hides, High Priority shows
 * - High Priority currently showing + Low Priority comes → Low Priority queues, waits for High Priority to close
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

  const type = data.type;
  const isHighPriority = isHighPriorityBubble(type);
  const isLowPriority = isLowPriorityBubble(type);

  // Rule 1: High Priority currently showing + Low Priority comes → Queue, don't show
  if (currentBubbleType && isHighPriorityBubble(currentBubbleType) && isLowPriority) {
    console.log('[Bubble] High priority is active, queuing low priority bubble');
    pendingBubbleData = {
      ...data,
      isHighPriority,
      isLowPriority,
      autoHideMs: isLowPriority ? AUTO_HIDE_TIMEOUT : null,
    };
    return; // Don't show, wait for high priority to close
  }

  // Rule 2: Low Priority currently showing + High Priority comes → Auto-hide Low Priority
  if (isHighPriority && currentBubbleType && isLowPriorityBubble(currentBubbleType)) {
    console.log('[Bubble] High priority interrupting low priority bubble');
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    if (bubbleWindow && !bubbleWindow.isDestroyed()) {
      bubbleWindow.hide();
    }
    currentBubbleType = null; // Reset current type
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

  // Update current bubble type
  currentBubbleType = type;

  if (isBubbleReady) {
    console.log('[Bubble] Sending to bubble window');
    // Pass priority info to bubble HTML for different layouts
    const bubbleData = {
      ...data,
      isHighPriority,
      isLowPriority,
      autoHideMs: isLowPriority ? AUTO_HIDE_TIMEOUT : null,
    };
    bubbleWindow.webContents
      .executeJavaScript(`showBubble(${JSON.stringify(bubbleData)})`)
      .catch((err) => console.error('[Bubble] showBubble failed:', err.message));

    // Play sound effect ONLY for high priority bubbles (no sound for low priority)
    if (isHighPriority) {
      console.log('[Bubble] Playing sound effect (high priority)');
      try {
        // Windows notification sound via Beep API
        const { exec } = require('child_process');
        exec('powershell -Command "[Console]::Beep(800, 200)"');
      } catch (e) {
        console.log('[Bubble] Sound play failed:', e.message);
      }
    } else {
      console.log('[Bubble] NO sound (low priority)');
    }
  } else {
    console.log('[Bubble] Queuing pending data');
    pendingBubbleData = {
      ...data,
      isHighPriority,
      isLowPriority,
      autoHideMs: isLowPriority ? AUTO_HIDE_TIMEOUT : null,
    };
  }

  // Auto-hide for low priority types only. High priority types (permission_request, ask_question)
  // stay until user clicks Focus button.
  console.log('[Bubble] Priority:', isHighPriority ? 'HIGH (no auto-hide)' : 'LOW (auto-hide)');

  if (isHighPriority) {
    console.log('[Bubble] NO auto-hide (high priority type)');
    return;
  }

  // Low priority: set auto-hide timer, NO sound effect
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    console.log('[Bubble] Auto-hiding bubble');
    currentBubbleType = null; // Reset when auto-hiding
    hideBubble();
    // Check if there's a queued low priority bubble
    if (pendingBubbleData && isLowPriorityBubble(pendingBubbleData.type)) {
      console.log('[Bubble] Showing queued low priority bubble');
      const queued = pendingBubbleData;
      pendingBubbleData = null;
      showBubble(queued);
    }
  }, AUTO_HIDE_TIMEOUT);
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
