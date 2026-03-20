"""
Configuration constants for Smart Auto Click
"""
import os

# ===== PATH SETTINGS =====
APP_DIR = os.path.dirname(os.path.abspath(__file__))
SCRIPTS_DIR = os.path.join(APP_DIR, "scripts")
os.makedirs(SCRIPTS_DIR, exist_ok=True)

# ===== CLICK SETTINGS =====
MIN_INTERVAL_MS = 10
MAX_INTERVAL_MS = 5000
DEFAULT_INTERVAL_MS = 500

MIN_CLICK_RATE = 1  # clicks per second
MAX_CLICK_RATE = 100

# ===== CLICK TYPES =====
CLICK_LEFT = "left"
CLICK_RIGHT = "right"
CLICK_MIDDLE = "middle"

CLICK_TYPES = {
    CLICK_LEFT: "Left Click",
    CLICK_RIGHT: "Right Click",
    CLICK_MIDDLE: "Middle Click"
}

# ===== SCRIPT SETTINGS =====
SCRIPT_VERSION = "1.0"

SCRIPT_MODES = {
    "position": "position",
    "timeline": "timeline"
}

# ===== HOTKEY SETTINGS =====
HOTKEY_START_STOP = "f1"
HOTKEY_RECORD = "f2"
HOTKEY_REPLAY = "f3"
HOTKEY_EMERGENCY = "esc"

# ===== GUI SETTINGS =====
WINDOW_WIDTH = 600
WINDOW_HEIGHT = 750
WINDOW_TITLE = "Smart Auto Click"
WINDOW_BG = "#1a1a2e"
ACCENT_COLOR = "#00d4ff"
WARNING_COLOR = "#fbbf24"
ERROR_COLOR = "#ef4444"
SUCCESS_COLOR = "#22c55e"
TEXT_COLOR = "#e2e8f0"
DIM_COLOR = "#64748b"

# ===== FILE SETTINGS =====
SCRIPT_EXT = ".json"
SCRIPT_FILENAME_PATTERN = "script_{timestamp}.json"

# ===== VALIDATION =====
MAX_SCRIPT_ACTIONS = 10000
MAX_SCRIPT_DURATION_SEC = 3600  # 1 hour max
