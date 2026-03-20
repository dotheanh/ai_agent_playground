"""
Recording logic for Smart Auto Click
"""
import threading
import time
from pynput import mouse

import config


class Recorder:
    """Record click actions for script creation"""

    def __init__(self):
        self.is_recording = False
        self._listener = None
        self._actions = []
        self._start_time = None
        self._mode = "position"  # "position" or "timeline"

        # Settings
        self.click_type_filter = None  # None = record all, or specific type

    def start_recording(self, mode="position"):
        """Start recording clicks"""
        if self.is_recording:
            return False

        self.is_recording = True
        self._actions = []
        self._start_time = time.time()
        self._mode = mode

        self._listener = mouse.Listener(
            on_click=self._on_click,
            suppress=False
        )
        self._listener.start()
        return True

    def stop_recording(self):
        """Stop recording and return recorded actions"""
        self.is_recording = False

        if self._listener:
            self._listener.stop()
            self._listener = None

        actions = self._actions.copy()
        return actions

    def _on_click(self, x, y, button, pressed):
        """Handle mouse click event"""
        if not self.is_recording:
            return

        # Only record button press, not release
        if not pressed:
            return

        # Convert button to string
        if button == mouse.Button.left:
            btn_str = config.CLICK_LEFT
        elif button == mouse.Button.right:
            btn_str = config.CLICK_RIGHT
        elif button == mouse.Button.middle:
            btn_str = config.CLICK_MIDDLE
        else:
            return

        # Filter by click type if set
        if self.click_type_filter and btn_str != self.click_type_filter:
            return

        # Calculate timestamp for timeline mode
        timestamp = time.time() - self._start_time

        action = {
            "x": int(x),
            "y": int(y),
            "button": btn_str,
            "clicks": 1
        }

        if self._mode == "timeline":
            action["time"] = round(timestamp, 3)

        self._actions.append(action)

    def get_actions(self):
        """Get current recorded actions"""
        return self._actions.copy()

    def clear_actions(self):
        """Clear recorded actions"""
        self._actions = []

    def set_mode(self, mode):
        """Set recording mode (position/timeline)"""
        if mode in ["position", "timeline"]:
            self._mode = mode

    def set_click_type_filter(self, click_type):
        """Set click type filter (None to record all)"""
        self.click_type_filter = click_type

    def get_action_count(self):
        """Get number of recorded actions"""
        return len(self._actions)

    def get_total_duration(self):
        """Get total recording duration in seconds"""
        if not self._actions or self._mode != "timeline":
            return 0
        return round(self._actions[-1].get("time", 0), 3)

    def to_script_format(self, interval_ms=None):
        """Convert recorded actions to script format"""
        script = {
            "version": config.SCRIPT_VERSION,
            "mode": self._mode,
            "actions": self._actions.copy()
        }

        if self._mode == "position" and interval_ms:
            script["interval"] = interval_ms

        return script

    def remove_last_action(self):
        """Remove the last recorded action"""
        if self._actions:
            self._actions.pop()
            return True
        return False

    def insert_action(self, index, action):
        """Insert an action at specific index"""
        if 0 <= index <= len(self._actions):
            self._actions.insert(index, action)
            return True
        return False

    def update_action(self, index, updates):
        """Update specific fields of an action"""
        if 0 <= index < len(self._actions):
            self._actions[index].update(updates)
            return True
        return False
