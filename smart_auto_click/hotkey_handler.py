"""
Global hotkey handler for Smart Auto Click
"""
import threading
import time

import keyboard

import config


class HotkeyHandler:
    """Handle global hotkeys for app control"""

    def __init__(self):
        self._listeners = {}
        self._running = False
        self._thread = None

        # Callbacks
        self.on_start_stop = None
        self.on_record = None
        self.on_replay = None
        self.on_emergency = None

    def start(self):
        """Start listening for hotkeys"""
        if self._running:
            return

        self._running = True
        self._thread = threading.Thread(target=self._listen_loop, daemon=True)
        self._thread.start()

    def stop(self):
        """Stop listening for hotkeys"""
        self._running = False
        if self._thread:
            self._thread.join(timeout=1)
            self._thread = None

    def _listen_loop(self):
        """Main loop for hotkey detection"""
        while self._running:
            try:
                # F1 - Start/Stop
                if keyboard.is_pressed(config.HOTKEY_START_STOP):
                    if self.on_start_stop:
                        self.on_start_stop()
                    time.sleep(0.3)  # Debounce

                # F2 - Record
                elif keyboard.is_pressed(config.HOTKEY_RECORD):
                    if self.on_record:
                        self.on_record()
                    time.sleep(0.3)

                # F3 - Replay
                elif keyboard.is_pressed(config.HOTKEY_REPLAY):
                    if self.on_replay:
                        self.on_replay()
                    time.sleep(0.3)

                # ESC - Emergency stop
                elif keyboard.is_pressed(config.HOTKEY_EMERGENCY):
                    if self.on_emergency:
                        self.on_emergency()
                    time.sleep(0.3)

                time.sleep(0.01)  # Small sleep to reduce CPU usage

            except Exception as e:
                print(f"Hotkey error: {e}")
                time.sleep(0.1)

    def set_callback(self, event, callback):
        """Set callback for specific event"""
        if event == "start_stop":
            self.on_start_stop = callback
        elif event == "record":
            self.on_record = callback
        elif event == "replay":
            self.on_replay = callback
        elif event == "emergency":
            self.on_emergency = callback
