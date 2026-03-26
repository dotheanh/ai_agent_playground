const { app, BrowserWindow, screen, Menu, Tray, nativeImage } = require('electron');
const path = require('path');
const { startHttpServer } = require('./http-server');
const { createPermissionBroker } = require('./permission-broker');
const { initBubbleManager, syncBubblePosition, destroyBubbleWindow, showBubble, hideBubble } = require('./bubble-window');

let mainWindow = null;
let tray = null;
let isAlwaysOnTop = true;
let permissionBroker = null;

const isDev = !app.isPackaged;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: 400,
    height: 250,
    x: width - 420,
    y: height - 250,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: isAlwaysOnTop,
    skipTaskbar: true,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Expose mainWindow globally for IPC handlers
  global.mainWindow = mainWindow;

  // Init bubble manager
  initBubbleManager(mainWindow);

  // Sync bubble position when window moves
  mainWindow.on('moved', () => syncBubblePosition());

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173/');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist-renderer/index.html'));
  }
}

function createTray() {
  // Create a 16x16 transparent icon for tray
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('Mega Rayquaza Pet');
  updateTrayMenu();

  tray.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Always on Top',
      type: 'checkbox',
      checked: isAlwaysOnTop,
      click: () => toggleAlwaysOnTop(),
    },
    { type: 'separator' },
    {
      label: 'Show Pet',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    {
      label: 'Hide Pet',
      click: () => {
        mainWindow.hide();
      },
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function toggleAlwaysOnTop() {
  isAlwaysOnTop = !isAlwaysOnTop;
  mainWindow.setAlwaysOnTop(isAlwaysOnTop);
  updateTrayMenu();
  mainWindow.webContents.send('always-on-top-changed', isAlwaysOnTop);
}

function showContextMenu() {
  const template = [
    {
      label: 'Always on Top',
      type: 'checkbox',
      checked: isAlwaysOnTop,
      click: () => toggleAlwaysOnTop(),
    },
    { type: 'separator' },
    {
      label: 'Show Pet',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    {
      label: 'Hide Pet',
      click: () => {
        mainWindow.hide();
      },
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => {
        app.quit();
      },
    },
  ];

  const contextMenu = Menu.buildFromTemplate(template);
  contextMenu.popup({ window: mainWindow });
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  permissionBroker = createPermissionBroker({
    onShow: (payload) => showBubble(payload),
    onHide: () => hideBubble(),
  });

  startHttpServer({ broker: permissionBroker, port: 49152 });
});

app.on('window-all-closed', () => {
  // Don't quit on window close, keep in tray
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  // Actually quit when app is closed
});

// IPC handlers
const { ipcMain } = require('electron');

ipcMain.on('show-context-menu', () => {
  showContextMenu();
});

ipcMain.on('toggle-always-on-top', () => {
  toggleAlwaysOnTop();
});

ipcMain.on('show-window', () => {
  mainWindow.show();
  mainWindow.focus();
});

ipcMain.on('hide-window', () => {
  mainWindow.hide();
});

ipcMain.handle('get-always-on-top', () => {
  return isAlwaysOnTop;
});

ipcMain.on('set-window-position', (event, { x, y }) => {
  const win = global.mainWindow;
  if (win && !win.isDestroyed()) {
    win.setPosition(Math.round(x), Math.round(y));
  }
});

ipcMain.on('exit-app', () => {
  app.quit();
});

ipcMain.on('focus-terminal', () => {
  // Bring Claude Code / terminal window to foreground
  const { exec } = require('child_process');
  // Windows: use PowerShell to activate the most recent console window
  exec('powershell -Command "(Add-Type -MemberDefinition \'[DllImport(\\\"user32.dll\\\")]public static extern bool SetForegroundWindow(IntPtr hWnd);[DllImport(\\\"user32.dll\\\")]public static extern bool ShowWindow(IntPtr hWnd,int nCmdShow);[DllImport(\\\"user32.dll\\\")]public static extern bool IsIconic(IntPtr hWnd);\' -Name Win32 -Namespace W32 -PassThru)::W32.ShowWindow((Get-Process | Where-Object {$_.MainWindowHandle -ne 0 -and $_.ProcessName -match \'claude|code|terminal|cmd|powershell\'} | Sort-Object LastAccessTime -Descending | Select-Object -First 1).MainWindowHandle, 9)"');
});

ipcMain.on('hide-bubble', () => {
  hideBubble();
});
