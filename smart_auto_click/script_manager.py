"""
Script management for Smart Auto Click - Load, Save, Edit scripts
"""
import json
import os
import subprocess
import sys
import tempfile
from datetime import datetime

import config


class ScriptManager:
    """Manage script files - load, save, edit, validate"""

    def __init__(self, scripts_dir=None):
        self.scripts_dir = scripts_dir or config.SCRIPTS_DIR
        os.makedirs(self.scripts_dir, exist_ok=True)

    def save_script(self, script_data, filename=None):
        """Save script to file"""
        if not self.validate_script(script_data):
            raise ValueError("Invalid script format")

        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"script_{timestamp}.json"

        # Ensure .json extension
        if not filename.endswith(config.SCRIPT_EXT):
            filename += config.SCRIPT_EXT

        filepath = os.path.join(self.scripts_dir, filename)

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(script_data, f, indent=2, ensure_ascii=False)

        return filepath

    def load_script(self, filepath):
        """Load script from file"""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Script not found: {filepath}")

        with open(filepath, "r", encoding="utf-8") as f:
            script_data = json.load(f)

        if not self.validate_script(script_data):
            raise ValueError("Invalid script format")

        return script_data

    def validate_script(self, script):
        """Validate script structure"""
        if not isinstance(script, dict):
            return False

        if "version" not in script:
            return False

        if "mode" not in script:
            return False

        if script["mode"] not in config.SCRIPT_MODES.values():
            return False

        if "actions" not in script or not isinstance(script["actions"], list):
            return False

        # Check action count
        if len(script["actions"]) > config.MAX_SCRIPT_ACTIONS:
            return False

        # Validate each action
        for action in script["actions"]:
            if not isinstance(action, dict):
                return False
            if "x" not in action or "y" not in action:
                return False
            if not isinstance(action["x"], (int, float)) or not isinstance(action["y"], (int, float)):
                return False
            if "button" in action and action["button"] not in config.CLICK_TYPES:
                return False
            if "clicks" in action and not isinstance(action["clicks"], int):
                return False
            if script["mode"] == "timeline" and "time" not in action:
                return False

        return True

    def list_scripts(self):
        """List all saved scripts"""
        scripts = []
        if not os.path.exists(self.scripts_dir):
            return scripts

        for filename in os.listdir(self.scripts_dir):
            if filename.endswith(config.SCRIPT_EXT):
                filepath = os.path.join(self.scripts_dir, filename)
                stat = os.stat(filepath)
                scripts.append({
                    "filename": filename,
                    "filepath": filepath,
                    "size": stat.st_size,
                    "modified": datetime.fromtimestamp(stat.st_mtime),
                    "name": filename[:-5]  # Without extension
                })

        # Sort by modified time, newest first
        scripts.sort(key=lambda x: x["modified"], reverse=True)
        return scripts

    def delete_script(self, filepath):
        """Delete a script file"""
        if os.path.exists(filepath):
            os.remove(filepath)
            return True
        return False

    def edit_script(self, filepath):
        """Open script in default text editor"""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Script not found: {filepath}")

        # Open with system default editor
        if sys.platform == "win32":
            os.startfile(filepath)
        elif sys.platform == "darwin":
            subprocess.run(["open", filepath])
        else:
            subprocess.run(["xdg-open", filepath])

    def create_new_script(self):
        """Create a new empty script template"""
        return {
            "version": config.SCRIPT_VERSION,
            "mode": "position",
            "interval": config.DEFAULT_INTERVAL_MS,
            "actions": []
        }

    def export_script(self, script_data, export_path):
        """Export script to specific path"""
        if not self.validate_script(script_data):
            raise ValueError("Invalid script format")

        with open(export_path, "w", encoding="utf-8") as f:
            json.dump(script_data, f, indent=2, ensure_ascii=False)

        return export_path

    def import_script(self, import_path):
        """Import script from specific path"""
        with open(import_path, "r", encoding="utf-8") as f:
            script_data = json.load(f)

        if not self.validate_script(script_data):
            raise ValueError("Invalid script format")

        # Save to scripts directory
        filename = os.path.basename(import_path)
        return self.save_script(script_data, filename)

    def duplicate_script(self, filepath):
        """Duplicate an existing script"""
        script = self.load_script(filepath)
        orig_name = os.path.splitext(os.path.basename(filepath))[0]
        new_name = f"{orig_name}_copy"
        return self.save_script(script, new_name)

    def get_script_info(self, filepath):
        """Get information about a script"""
        script = self.load_script(filepath)
        info = {
            "filepath": filepath,
            "filename": os.path.basename(filepath),
            "mode": script.get("mode", "unknown"),
            "action_count": len(script.get("actions", [])),
            "interval": script.get("interval", config.DEFAULT_INTERVAL_MS),
            "duration": self._calculate_duration(script)
        }
        return info

    def _calculate_duration(self, script):
        """Calculate script duration in seconds"""
        if script.get("mode") != "timeline":
            return None

        actions = script.get("actions", [])
        if not actions:
            return 0

        return actions[-1].get("time", 0)
