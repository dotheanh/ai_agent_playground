"""
Smart Auto Click - Main GUI Application
"""
import threading
import time
import tkinter as tk
from tkinter import ttk, messagebox, filedialog

import config
from clicker import Clicker, ScriptPlayer
from recorder import Recorder
from script_manager import ScriptManager
from hotkey_handler import HotkeyHandler


class AutoClickApp:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title(config.WINDOW_TITLE)
        self.root.geometry(f"{config.WINDOW_WIDTH}x{config.WINDOW_HEIGHT}")
        self.root.configure(bg=config.WINDOW_BG)
        self.root.resizable(False, False)

        # Core components
        self.clicker = Clicker()
        self.player = ScriptPlayer()
        self.recorder = Recorder()
        self.script_manager = ScriptManager()
        self.hotkeys = HotkeyHandler()

        # State
        self.current_mode = tk.StringVar(value="continuous")
        self.current_script = None
        self.current_script_path = None
        self.is_continuous_running = False
        self.is_recording = False
        self.is_replaying = False

        # Position tracking
        self._position_thread = None
        self._tracking = False

        self._setup_ui()
        self._setup_hotkeys()
        self._start_position_tracking()

        # Cleanup on close
        self.root.protocol("WM_DELETE_WINDOW", self._on_close)

    def _setup_ui(self):
        """Setup all UI components"""
        style = ttk.Style()
        style.theme_use('clam')

        # ===== TITLE =====
        title_frame = tk.Frame(self.root, bg=config.WINDOW_BG)
        title_frame.pack(fill=tk.X, padx=20, pady=(20, 10))

        tk.Label(
            title_frame,
            text="SMART AUTO CLICK",
            font=("Segoe UI", 18, "bold"),
            fg=config.ACCENT_COLOR,
            bg=config.WINDOW_BG
        ).pack()

        # ===== HOTKEY HINTS =====
        hotkey_frame = tk.Frame(
            self.root,
            bg="#0d1225",
            padx=15,
            pady=8
        )
        hotkey_frame.pack(fill=tk.X, padx=20, pady=(0, 10))

        hotkeys_info = [
            ("F1", "Start Click", config.ACCENT_COLOR),
            ("F2", "Record", config.WARNING_COLOR),
            ("F3", "Replay", config.SUCCESS_COLOR),
            ("ESC", "Stop All", config.ERROR_COLOR)
        ]

        for i, (key, action, color) in enumerate(hotkeys_info):
            col = i * 2
            tk.Label(
                hotkey_frame,
                text=key,
                bg="#0d1225",
                fg=color,
                font=("Consolas", 10, "bold"),
                width=4
            ).grid(row=0, column=col, padx=(0 if i == 0 else 8), pady=2)

            tk.Label(
                hotkey_frame,
                text=action,
                bg="#0d1225",
                fg=config.TEXT_COLOR,
                font=("Segoe UI", 9),
                width=10
            ).grid(row=0, column=col + 1, sticky=tk.W, pady=2)

        # ===== MODE SELECTION =====
        mode_frame = tk.LabelFrame(
            self.root,
            text=" Mode ",
            font=("Segoe UI", 10, "bold"),
            fg=config.TEXT_COLOR,
            bg=config.WINDOW_BG,
            padx=15,
            pady=10
        )
        mode_frame.pack(fill=tk.X, padx=20, pady=10)

        modes = [
            ("continuous", "Continuous Click"),
            ("position", "Position-Only Script"),
            ("timeline", "Timeline Script")
        ]

        for val, txt in modes:
            tk.Radiobutton(
                mode_frame,
                text=txt,
                variable=self.current_mode,
                value=val,
                command=self._on_mode_change,
                bg=config.WINDOW_BG,
                fg=config.TEXT_COLOR,
                selectcolor=config.WINDOW_BG,
                activebackground=config.WINDOW_BG,
                font=("Segoe UI", 10)
            ).pack(anchor=tk.W, pady=2)

        # ===== SETTINGS =====
        settings_frame = tk.LabelFrame(
            self.root,
            text=" Settings ",
            font=("Segoe UI", 10, "bold"),
            fg=config.TEXT_COLOR,
            bg=config.WINDOW_BG,
            padx=15,
            pady=10
        )
        settings_frame.pack(fill=tk.X, padx=20, pady=10)

        # Click Interval
        tk.Label(
            settings_frame,
            text="Click Interval (ms):",
            bg=config.WINDOW_BG,
            fg=config.TEXT_COLOR,
            font=("Segoe UI", 9)
        ).grid(row=0, column=0, sticky=tk.W, pady=5)

        self.interval_var = tk.IntVar(value=config.DEFAULT_INTERVAL_MS)
        interval_spin = tk.Spinbox(
            settings_frame,
            from_=config.MIN_INTERVAL_MS,
            to=config.MAX_INTERVAL_MS,
            increment=50,
            textvariable=self.interval_var,
            width=10,
            font=("Segoe UI", 9)
        )
        interval_spin.grid(row=0, column=1, sticky=tk.W, pady=5, padx=5)

        # Click Type
        tk.Label(
            settings_frame,
            text="Click Type:",
            bg=config.WINDOW_BG,
            fg=config.TEXT_COLOR,
            font=("Segoe UI", 9)
        ).grid(row=1, column=0, sticky=tk.W, pady=5)

        self.click_type_var = tk.StringVar(value=config.CLICK_LEFT)
        click_type_combo = ttk.Combobox(
            settings_frame,
            textvariable=self.click_type_var,
            values=list(config.CLICK_TYPES.values()),
            state="readonly",
            width=15,
            font=("Segoe UI", 9)
        )
        click_type_combo.grid(row=1, column=1, sticky=tk.W, pady=5, padx=5)

        # Click Count
        tk.Label(
            settings_frame,
            text="Click Count:",
            bg=config.WINDOW_BG,
            fg=config.TEXT_COLOR,
            font=("Segoe UI", 9)
        ).grid(row=2, column=0, sticky=tk.W, pady=5)

        self.click_count_var = tk.IntVar(value=1)
        tk.Radiobutton(
            settings_frame,
            text="Single",
            variable=self.click_count_var,
            value=1,
            bg=config.WINDOW_BG,
            fg=config.TEXT_COLOR,
            selectcolor=config.WINDOW_BG,
            font=("Segoe UI", 9)
        ).grid(row=2, column=1, sticky=tk.W, pady=2)
        tk.Radiobutton(
            settings_frame,
            text="Double",
            variable=self.click_count_var,
            value=2,
            bg=config.WINDOW_BG,
            fg=config.TEXT_COLOR,
            selectcolor=config.WINDOW_BG,
            font=("Segoe UI", 9)
        ).grid(row=2, column=1, sticky=tk.W, pady=2, padx=60)

        # ===== SCRIPT INFO =====
        self.script_frame = tk.LabelFrame(
            self.root,
            text=" Script ",
            font=("Segoe UI", 10, "bold"),
            fg=config.TEXT_COLOR,
            bg=config.WINDOW_BG,
            padx=15,
            pady=10
        )
        self.script_frame.pack(fill=tk.X, padx=20, pady=10)

        self.script_label = tk.Label(
            self.script_frame,
            text="No script loaded",
            bg=config.WINDOW_BG,
            fg=config.DIM_COLOR,
            font=("Segoe UI", 9),
            anchor=tk.W
        )
        self.script_label.pack(fill=tk.X)

        self.script_preview = tk.Text(
            self.script_frame,
            height=5,
            bg="#0d1225",
            fg=config.TEXT_COLOR,
            font=("Consolas", 8),
            state="disabled",
            wrap=tk.WORD
        )
        self.script_preview.pack(fill=tk.X, pady=(5, 0))

        # Script buttons
        script_btn_frame = tk.Frame(self.script_frame, bg=config.WINDOW_BG)
        script_btn_frame.pack(fill=tk.X, pady=(5, 0))

        tk.Button(
            script_btn_frame,
            text="Load",
            command=self._load_script,
            bg="#1a2340",
            fg=config.TEXT_COLOR,
            font=("Segoe UI", 9),
            padx=10
        ).pack(side=tk.LEFT, padx=(0, 5))

        tk.Button(
            script_btn_frame,
            text="Save",
            command=self._save_script,
            bg="#1a2340",
            fg=config.TEXT_COLOR,
            font=("Segoe UI", 9),
            padx=10
        ).pack(side=tk.LEFT, padx=(0, 5))

        tk.Button(
            script_btn_frame,
            text="Edit",
            command=self._edit_script,
            bg="#1a2340",
            fg=config.TEXT_COLOR,
            font=("Segoe UI", 9),
            padx=10
        ).pack(side=tk.LEFT, padx=(0, 5))

        tk.Button(
            script_btn_frame,
            text="Clear",
            command=self._clear_script,
            bg="#1a2340",
            fg=config.TEXT_COLOR,
            font=("Segoe UI", 9),
            padx=10
        ).pack(side=tk.LEFT)

        tk.Button(
            script_btn_frame,
            text="Reload",
            command=self._reload_script,
            bg="#1a2340",
            fg=config.TEXT_COLOR,
            font=("Segoe UI", 9),
            padx=10
        ).pack(side=tk.LEFT, padx=(5, 0))

        # ===== STATUS =====
        self.status_label = tk.Label(
            self.root,
            text="Ready - F1: Click | F2: Record | F3: Replay | ESC: Stop",
            bg=config.WINDOW_BG,
            fg=config.ACCENT_COLOR,
            font=("Segoe UI", 10, "bold"),
            pady=10
        )
        self.status_label.pack(fill=tk.X, padx=20)

        # ===== POSITION DISPLAY =====
        self.pos_label = tk.Label(
            self.root,
            text="Position: --",
            bg=config.WINDOW_BG,
            fg=config.DIM_COLOR,
            font=("Consolas", 9)
        )
        self.pos_label.pack(fill=tk.X, padx=20)

    def _setup_hotkeys(self):
        """Setup global hotkey callbacks"""
        self.hotkeys.on_start_stop = self._on_hotkey_start_stop
        self.hotkeys.on_record = self._on_hotkey_record
        self.hotkeys.on_replay = self._on_hotkey_replay
        self.hotkeys.on_emergency = self._on_emergency_stop
        self.hotkeys.start()

    def _start_position_tracking(self):
        """Track mouse position continuously"""
        def track():
            while self._tracking:
                try:
                    import pyautogui
                    x, y = pyautogui.position()
                    self.root.after(0, lambda: self.pos_label.config(text=f"Position: {x}, {y}"))
                except:
                    pass
                time.sleep(0.1)

        self._tracking = True
        self._position_thread = threading.Thread(target=track, daemon=True)
        self._position_thread.start()

    def _on_mode_change(self):
        """Handle mode change"""
        mode = self.current_mode.get()
        self._update_status(f"Mode: {mode}")

    def _on_hotkey_start_stop(self):
        """Handle F1 - Start/Stop"""
        mode = self.current_mode.get()

        if mode == "continuous":
            if self.is_continuous_running:
                self._stop_continuous()
            else:
                self._start_continuous()
        elif self.is_replaying:
            self._stop_replay()

    def _on_hotkey_record(self):
        """Handle F2 - Record"""
        if self.is_recording:
            self._stop_recording()
        else:
            self._start_recording()

    def _on_hotkey_replay(self):
        """Handle F3 - Replay"""
        if self.is_replaying:
            self._stop_replay()
        else:
            self._start_replay()

    def _on_emergency_stop(self):
        """Handle ESC - Emergency stop all"""
        if self.is_continuous_running:
            self._stop_continuous()

        if self.is_replaying:
            self._stop_replay()

        if self.is_recording:
            self._stop_recording()

        self._update_status("Emergency Stop!", color=config.ERROR_COLOR)

    def _start_continuous(self):
        """Start continuous clicking"""
        self.clicker.set_interval(self.interval_var.get())
        self.clicker.set_click_type(self.click_type_var.get())
        self.clicker.set_click_count(self.click_count_var.get())

        self.clicker.start_continuous()
        self.is_continuous_running = True
        self._update_status("Clicking... (F1 to stop)", color=config.SUCCESS_COLOR)

    def _stop_continuous(self):
        """Stop continuous clicking"""
        count = self.clicker.stop()
        self.is_continuous_running = False
        self._update_status(f"Stopped - {count} clicks", color=config.ACCENT_COLOR)

    def _start_recording(self):
        """Start recording"""
        mode = self.current_mode.get()
        if mode == "continuous":
            self._update_status("Switch to Position or Timeline mode to record", color=config.WARNING_COLOR)
            return

        script_mode = "timeline" if mode == "timeline" else "position"
        self.recorder.set_mode(script_mode)
        self.recorder.start_recording(script_mode)

        self.is_recording = True
        self._update_status("Recording... (F2 to stop)", color=config.WARNING_COLOR)

    def _stop_recording(self):
        """Stop recording"""
        actions = self.recorder.stop_recording()
        self.is_recording = False

        if actions:
            self.current_script = self.recorder.to_script_format(
                interval_ms=self.interval_var.get()
            )
            self._update_script_preview()
            self._update_status(f"Recorded {len(actions)} actions", color=config.SUCCESS_COLOR)
        else:
            self._update_status("No actions recorded", color=config.DIM_COLOR)

    def _start_replay(self):
        """Start replaying script"""
        if not self.current_script:
            self._update_status("No script loaded!", color=config.ERROR_COLOR)
            return

        if self.is_replaying:
            return

        self.is_replaying = True
        threading.Thread(target=self._replay_thread, daemon=True).start()
        self._update_status("Replaying... (Press ESC to stop)", color=config.SUCCESS_COLOR)

    def _replay_thread(self):
        """Background thread for replay"""
        self.player.replay(self.current_script)

        # Wait for replay to finish
        while self.player.is_running:
            time.sleep(0.1)

        self.is_replaying = False
        result = self.player.stop()
        self.root.after(0, lambda: self._update_status(
            f"Replay done - {result['total_clicks']} clicks, {result['actions_completed']} actions",
            color=config.ACCENT_COLOR
        ))

    def _stop_replay(self):
        """Stop replaying"""
        result = self.player.stop()
        self.is_replaying = False
        self._update_status(
            f"Stopped - {result['total_clicks']} clicks",
            color=config.ACCENT_COLOR
        )

    def _load_script(self):
        """Load script from file"""
        filepath = filedialog.askopenfilename(
            initialdir=config.SCRIPTS_DIR,
            title="Load Script",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )

        if filepath:
            try:
                self.current_script = self.script_manager.load_script(filepath)
                self.current_script_path = filepath
                self._update_script_preview()
                self._update_status(f"Loaded: {filepath.split('/')[-1]}", color=config.SUCCESS_COLOR)
            except Exception as e:
                messagebox.showerror("Error", f"Failed to load script:\n{e}")

    def _save_script(self):
        """Save current script to file"""
        if not self.current_script or not self.current_script.get("actions"):
            messagebox.showwarning("Warning", "No script to save!")
            return

        filepath = filedialog.asksaveasfilename(
            initialdir=config.SCRIPTS_DIR,
            title="Save Script",
            defaultextension=".json",
            filetypes=[("JSON files", "*.json")]
        )

        if filepath:
            try:
                self.script_manager.save_script(self.current_script, filepath)
                self.current_script_path = filepath
                self._update_status(f"Saved: {filepath.split('/')[-1]}", color=config.SUCCESS_COLOR)
            except Exception as e:
                messagebox.showerror("Error", f"Failed to save script:\n{e}")

    def _edit_script(self):
        """Open script in text editor"""
        # If no script, create empty one first
        if not self.current_script:
            self.current_script = self.script_manager.create_new_script()

        # Save to temp file if not saved yet
        if not self.current_script_path:
            try:
                self.current_script_path = self.script_manager.save_script(
                    self.current_script,
                    "temp_edit.json"
                )
            except Exception as e:
                messagebox.showerror("Error", f"Failed to create temp file:\n{e}")
                return

        # Open in editor
        try:
            self.script_manager.edit_script(self.current_script_path)
            self._update_status("Edit script in opened window, then reload", color=config.WARNING_COLOR)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to open editor:\n{e}")

    def _reload_script(self):
        """Reload current script from file"""
        if self.current_script_path:
            try:
                self.current_script = self.script_manager.load_script(self.current_script_path)
                self._update_script_preview()
                self._update_status("Script reloaded!", color=config.SUCCESS_COLOR)
            except Exception as e:
                messagebox.showerror("Error", f"Failed to reload:\n{e}")

    def _clear_script(self):
        """Clear current script"""
        self.current_script = None
        self.current_script_path = None
        self.script_preview.configure(state="normal")
        self.script_preview.delete("1.0", tk.END)
        self.script_preview.configure(state="disabled")
        self.script_label.config(text="No script loaded")
        self._update_status("Script cleared", color=config.DIM_COLOR)

    def _update_script_preview(self):
        """Update script preview panel"""
        if not self.current_script:
            return

        self.script_label.config(
            text=f"Script: {len(self.current_script.get('actions', []))} actions | Mode: {self.current_script.get('mode', 'unknown')}"
        )

        self.script_preview.configure(state="normal")
        self.script_preview.delete("1.0", tk.END)

        # Show first few actions
        actions = self.current_script.get("actions", [])[:10]
        for action in actions:
            self.script_preview.insert(tk.END, f"{action}\n")

        if len(self.current_script.get("actions", [])) > 10:
            self.script_preview.insert(tk.END, f"... and {len(self.current_script.get('actions', [])) - 10} more\n")

        self.script_preview.configure(state="disabled")

    def _update_status(self, text, color=None):
        """Update status label"""
        color = color or config.ACCENT_COLOR
        self.status_label.config(text=text, fg=color)

    def _on_close(self):
        """Handle window close"""
        self._tracking = False
        self.hotkeys.stop()
        self._stop_continuous()
        self._stop_replay()
        self.root.destroy()

    def run(self):
        """Start the application"""
        self.root.mainloop()


def main():
    app = AutoClickApp()
    app.run()


if __name__ == "__main__":
    main()
