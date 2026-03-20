"""
Click execution logic for Smart Auto Click
"""
import threading
import time
import pyautogui
from pynput import mouse

import config

class Clicker:
    def __init__(self):
        self.is_running = False
        self.is_paused = False
        self._thread = None
        self._current_pos = None
        self._click_count = 0

        # Settings
        self.interval_ms = config.DEFAULT_INTERVAL_MS
        self.click_type = config.CLICK_LEFT
        self.click_count = 1  # 1 = single, 2 = double

    def _get_pynput_button(self):
        """Convert our click type to pynput Button"""
        if self.click_type == config.CLICK_LEFT:
            return mouse.Button.left
        elif self.click_type == config.CLICK_RIGHT:
            return mouse.Button.right
        else:
            return mouse.Button.middle

    def _perform_click(self, x, y):
        """Perform click at locked position using pynput"""
        btn = self._get_pynput_button()
        with mouse.Controller() as mc:
            mc.position = (x, y)
            time.sleep(0.01)  # Small delay to ensure position is set
            for _ in range(self.click_count):
                mc.click(btn)

    def _continuous_click_loop(self):
        """Main loop for continuous clicking - LOCK position"""
        while self.is_running:
            if not self.is_paused:
                if self._current_pos:
                    x, y = self._current_pos
                    self._perform_click(x, y)
                    self._click_count += 1
                time.sleep(self.interval_ms / 1000.0)
            else:
                time.sleep(0.1)  # Small sleep when paused

    def update_position(self, x, y):
        """Update current click position (called from GUI)"""
        self._current_pos = (x, y)

    def start_continuous(self):
        """Start continuous clicking - CAPTURE current mouse position"""
        if self.is_running:
            return False

        # Capture current mouse position NOW
        self._current_pos = pyautogui.position()

        self.is_running = True
        self.is_paused = False
        self._click_count = 0
        self._thread = threading.Thread(target=self._continuous_click_loop, daemon=True)
        self._thread.start()
        return True

    def stop(self):
        """Stop clicking"""
        self.is_running = False
        self.is_paused = False
        if self._thread:
            self._thread.join(timeout=1)
            self._thread = None
        return self._click_count

    def pause(self):
        """Pause clicking"""
        self.is_paused = True

    def resume(self):
        """Resume clicking"""
        self.is_paused = False

    def get_click_count(self):
        """Get number of clicks performed"""
        return self._click_count

    def set_interval(self, interval_ms):
        """Set click interval in milliseconds"""
        self.interval_ms = max(config.MIN_INTERVAL_MS, min(config.MAX_INTERVAL_MS, interval_ms))

    def set_click_type(self, click_type):
        """Set click type (left/right/middle)"""
        if click_type in config.CLICK_TYPES:
            self.click_type = click_type

    def set_click_count(self, count):
        """Set number of clicks per action (1=single, 2=double)"""
        self.click_count = 1 if count < 2 else 2


class ScriptPlayer:
    """Play back recorded click scripts"""

    def __init__(self):
        self.is_running = False
        self.is_paused = False
        self._thread = None
        self._click_count = 0
        self._current_action = 0

    def replay(self, script_data):
        """Replay a script (position or timeline mode)"""
        if self.is_running:
            return False

        if not self._validate_script(script_data):
            return False

        self.is_running = True
        self.is_paused = False
        self._click_count = 0
        self._current_action = 0
        self._thread = threading.Thread(
            target=self._replay_loop,
            args=(script_data,),
            daemon=True
        )
        self._thread.start()
        return True

    def _validate_script(self, script):
        """Validate script format"""
        if "actions" not in script or not isinstance(script["actions"], list):
            return False
        if len(script["actions"]) == 0:
            return False
        if "mode" not in script:
            return False
        return True

    def _replay_loop(self, script):
        """Main loop for script replay"""
        mode = script.get("mode", "position")
        actions = script.get("actions", [])
        interval_ms = script.get("interval", config.DEFAULT_INTERVAL_MS)

        if mode == "timeline":
            # Timeline mode: respect exact timing
            start_time = time.time()
            for i, action in enumerate(actions):
                if not self.is_running:
                    break

                # Wait until this action's time
                action_time = action.get("time", 0)
                while self.is_running and not self.is_paused:
                    elapsed = time.time() - start_time
                    if elapsed >= action_time:
                        break
                    time.sleep(0.001)  # Small sleep to avoid CPU spin

                if not self.is_running:
                    break

                self._execute_action(action)
                self._current_action = i + 1

        else:
            # Position mode: use fixed interval
            for i, action in enumerate(actions):
                if not self.is_running:
                    break

                while self.is_running and self.is_paused:
                    time.sleep(0.1)

                if not self.is_running:
                    break

                self._execute_action(action)
                self._current_action = i + 1

                # Wait interval between actions (except last)
                if i < len(actions) - 1:
                    time.sleep(interval_ms / 1000.0)

        self.is_running = False

    def _execute_action(self, action):
        """Execute a single click action"""
        x = action.get("x")
        y = action.get("y")
        button = action.get("button", config.CLICK_LEFT)
        clicks = action.get("clicks", 1)

        if x is None or y is None:
            return

        btn_map = {
            config.CLICK_LEFT: mouse.Button.left,
            config.CLICK_RIGHT: mouse.Button.right,
            config.CLICK_MIDDLE: mouse.Button.middle
        }

        btn = btn_map.get(button, mouse.Button.left)

        with mouse.Controller() as mc:
            mc.position = (int(x), int(y))
            for _ in range(int(clicks)):
                mc.click(btn)

        self._click_count += int(clicks)

    def stop(self):
        """Stop script replay"""
        self.is_running = False
        self.is_paused = False
        if self._thread:
            self._thread.join(timeout=1)
            self._thread = None
        return {
            "total_clicks": self._click_count,
            "actions_completed": self._current_action
        }

    def pause(self):
        """Pause replay"""
        self.is_paused = True

    def resume(self):
        """Resume replay"""
        self.is_paused = False

    def get_progress(self):
        """Get current replay progress"""
        return {
            "is_running": self.is_running,
            "is_paused": self.is_paused,
            "current_action": self._current_action,
            "click_count": self._click_count
        }
